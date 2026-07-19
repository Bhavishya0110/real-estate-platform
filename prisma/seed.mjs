/**
 * SEED — JSON to PostgreSQL.
 *
 *   node scripts/with-env.mjs node prisma/seed.mjs
 *
 * Three tiers, per the approved strategy:
 *   1. System   — permissions, roles, categories, pipelines. Required to boot.
 *   2. Content  — the existing JSON, transformed into typed columns.
 *   3. Runtime  — captured leads and callbacks from data-runtime/, if present.
 *
 * Every write is an upsert keyed on a natural key (slug, email, key), so this
 * is safe to re-run. A seed that cannot be run twice is not a seed — it is a
 * one-shot script that will eventually be run twice by accident.
 */

import { PrismaClient } from "@prisma/client";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import {
  toMinor,
  parsePossession,
  parseAreaRange,
  parseConfiguration,
  slugify,
  normalizePhone,
  flattenArticle,
  reference,
  splitName,
} from "./seed-helpers.mjs";

const prisma = new PrismaClient();
const ROOT = process.cwd();

const read = (file) =>
  JSON.parse(readFileSync(path.join(ROOT, "src", "data", file), "utf8"));

const counts = {};
const record = (label, n) => {
  counts[label] = (counts[label] ?? 0) + n;
};

/* ========================================================== TIER 1: SYSTEM */

const PERMISSIONS = [
  ["projects", ["read", "create", "update", "delete", "publish"]],
  ["blog", ["read", "create", "update", "delete", "publish"]],
  ["gallery", ["read", "create", "update", "delete", "publish"]],
  ["testimonials", ["read", "create", "update", "delete", "publish"]],
  ["careers", ["read", "create", "update", "delete", "publish"]],
  ["applications", ["read", "update", "delete", "export"]],
  ["leads", ["read", "create", "update", "delete", "assign", "export"]],
  ["contacts", ["read", "create", "update", "delete", "export"]],
  ["visits", ["read", "create", "update", "delete"]],
  ["chat", ["read", "update", "delete"]],
  ["media", ["read", "create", "update", "delete"]],
  ["cms", ["read", "update", "publish"]],
  ["seo", ["read", "update"]],
  ["settings", ["read", "update"]],
  ["users", ["read", "manage"]],
  ["audit", ["read"]],
  ["reports", ["read", "export"]],
];

/**
 * The seven roles the brief names, plus `viewer`.
 *
 * Sales Executive is deliberately not given `leads:delete` or `leads:export`:
 * the row-level scoping that limits them to their own leads is enforced in the
 * repository, and bulk export is the one operation that would walk straight
 * around it.
 */
const ROLE_DEFINITIONS = [
  {
    slug: "owner",
    name: "Owner",
    rank: 100,
    description: "Full access, including managing other operators.",
    permissions: "*",
  },
  {
    slug: "admin",
    name: "Administrator",
    rank: 90,
    description: "Full access except managing operators.",
    permissions: (all) => all.filter((p) => p.resource !== "users"),
  },
  {
    slug: "sales_manager",
    name: "Sales Manager",
    rank: 70,
    description: "Owns the pipeline: every lead, assignment and site visit.",
    permissions: (all) =>
      all.filter(
        (p) =>
          ["leads", "contacts", "visits", "chat", "reports"].includes(p.resource) ||
          (p.action === "read" &&
            ["projects", "blog", "gallery", "testimonials", "careers", "applications"].includes(
              p.resource,
            )),
      ),
  },
  {
    slug: "sales_executive",
    name: "Sales Executive",
    rank: 50,
    description: "Works their own assigned leads and visits.",
    permissions: (all) =>
      all.filter(
        (p) =>
          (["leads", "contacts", "visits"].includes(p.resource) &&
            ["read", "create", "update"].includes(p.action)) ||
          (p.resource === "projects" && p.action === "read") ||
          (p.resource === "chat" && p.action === "read"),
      ),
  },
  {
    slug: "content_editor",
    name: "Content Editor",
    rank: 60,
    description: "Publishes the catalogue and editorial content. No lead access.",
    permissions: (all) =>
      all.filter((p) =>
        ["projects", "blog", "gallery", "testimonials", "careers", "media", "cms"].includes(
          p.resource,
        ),
      ),
  },
  {
    slug: "marketing",
    name: "Marketing",
    rank: 60,
    description: "SEO, campaigns and reporting. Aggregate lead visibility only.",
    permissions: (all) =>
      all.filter(
        (p) =>
          ["seo", "reports"].includes(p.resource) ||
          (p.resource === "cms" && p.action !== "publish") ||
          (p.resource === "media" && ["read", "create", "update"].includes(p.action)) ||
          (["projects", "blog", "gallery"].includes(p.resource) && p.action === "read") ||
          (p.resource === "leads" && p.action === "read"),
      ),
  },
  {
    slug: "support",
    name: "Support",
    rank: 40,
    description: "Answers enquiries, callbacks and chat. Read-only on leads.",
    permissions: (all) =>
      all.filter(
        (p) =>
          (p.resource === "chat") ||
          (["contacts", "visits"].includes(p.resource) && ["read", "update"].includes(p.action)) ||
          (p.resource === "leads" && p.action === "read") ||
          (p.resource === "projects" && p.action === "read"),
      ),
  },
  {
    slug: "viewer",
    name: "Viewer",
    rank: 10,
    description: "Read-only across the panel.",
    permissions: (all) => all.filter((p) => p.action === "read"),
  },
];

async function seedAccessControl() {
  const permissionRows = [];
  for (const [resource, actions] of PERMISSIONS) {
    for (const action of actions) {
      permissionRows.push(
        await prisma.permission.upsert({
          where: { resource_action: { resource, action } },
          update: {},
          create: { resource, action, isSystem: true },
        }),
      );
    }
  }
  record("permissions", permissionRows.length);

  for (const definition of ROLE_DEFINITIONS) {
    const role = await prisma.role.upsert({
      where: { slug: definition.slug },
      update: { name: definition.name, description: definition.description, rank: definition.rank },
      create: {
        slug: definition.slug,
        name: definition.name,
        description: definition.description,
        rank: definition.rank,
        isSystem: true,
      },
    });

    const granted =
      definition.permissions === "*"
        ? permissionRows
        : definition.permissions(permissionRows);

    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    await prisma.rolePermission.createMany({
      data: granted.map((permission) => ({ roleId: role.id, permissionId: permission.id })),
      skipDuplicates: true,
    });
    record("role_permissions", granted.length);
  }
  record("roles", ROLE_DEFINITIONS.length);
}

/**
 * Carries the environment-configured operators into the database.
 *
 * The PBKDF2 hash migrates verbatim — same format, same verification path — so
 * nobody is signed out and no password is reset by the migration.
 */
async function seedOperators() {
  const raw = process.env.ADMIN_USERS?.trim();
  if (!raw) {
    console.log("  (no ADMIN_USERS configured — skipping operator import)");
    return;
  }

  const ownerRole = await prisma.role.findUnique({ where: { slug: "owner" } });
  let imported = 0;

  for (const line of raw.split(/[\n;]+/).map((l) => l.trim()).filter(Boolean)) {
    const [email, name, roleSlug, passwordHash] = line.split("|").map((f) => f.trim());
    if (!email || !name || !passwordHash) continue;

    const role =
      (await prisma.role.findUnique({ where: { slug: roleSlug ?? "" } })) ?? ownerRole;

    const user = await prisma.user.upsert({
      where: { email },
      update: { name, passwordHash, status: "ACTIVE" },
      create: { email, name, passwordHash, status: "ACTIVE", emailVerifiedAt: new Date() },
    });

    if (role) {
      await prisma.userRole.upsert({
        where: { userId_roleId: { userId: user.id, roleId: role.id } },
        update: {},
        create: { userId: user.id, roleId: role.id },
      });
    }
    imported += 1;
  }
  record("users", imported);
}

async function seedTaxonomies() {
  const categories = [
    { slug: "residential", name: "Residential", isResidential: true, isCommercial: false, sortOrder: 1 },
    { slug: "commercial", name: "Commercial", isResidential: false, isCommercial: true, sortOrder: 2 },
    { slug: "plots", name: "Plots", isResidential: true, isCommercial: false, sortOrder: 3 },
    { slug: "senior-living", name: "Senior Living", isResidential: true, isCommercial: false, sortOrder: 4 },
    { slug: "luxury", name: "Luxury", isResidential: true, isCommercial: false, sortOrder: 5 },
  ];
  for (const category of categories) {
    await prisma.projectCategory.upsert({
      where: { slug: category.slug },
      update: category,
      create: category,
    });
  }
  record("project_categories", categories.length);

  const statuses = [
    { slug: "ongoing", name: "Ongoing", colorToken: "neutral", isSellable: true, isCompleted: false, sortOrder: 1 },
    { slug: "ready-to-move", name: "Ready to Move", colorToken: "success", isSellable: true, isCompleted: true, sortOrder: 2 },
    { slug: "pre-launch", name: "Pre-Launch", colorToken: "gold", isSellable: false, isCompleted: false, sortOrder: 3 },
    { slug: "available", name: "Available", colorToken: "success", isSellable: true, isCompleted: true, sortOrder: 4 },
    { slug: "upcoming", name: "Upcoming", colorToken: "neutral", isSellable: false, isCompleted: false, sortOrder: 5 },
  ];
  for (const status of statuses) {
    await prisma.projectStatus.upsert({
      where: { slug: status.slug },
      update: status,
      create: status,
    });
  }
  record("project_statuses", statuses.length);

  const pipeline = await prisma.leadPipeline.upsert({
    where: { slug: "sales" },
    update: { name: "Sales", isDefault: true },
    create: { slug: "sales", name: "Sales", isDefault: true },
  });
  record("lead_pipelines", 1);

  // Mirrors today's LeadStatus union so nothing in the UI shifts meaning.
  const stages = [
    { slug: "new", name: "New", sortOrder: 1, probability: 10 },
    { slug: "contacted", name: "Contacted", sortOrder: 2, probability: 30 },
    { slug: "qualified", name: "Qualified", sortOrder: 3, probability: 60 },
    { slug: "closed", name: "Closed", sortOrder: 4, isWon: true, probability: 100 },
  ];
  for (const stage of stages) {
    await prisma.leadStage.upsert({
      where: { pipelineId_slug: { pipelineId: pipeline.id, slug: stage.slug } },
      update: stage,
      create: { ...stage, pipelineId: pipeline.id },
    });
  }
  record("lead_stages", stages.length);

  // Mirrors today's LeadSource union.
  const sources = [
    { slug: "contact-form", name: "Contact Form", channel: "website", sortOrder: 1 },
    { slug: "chatbot-callback", name: "Chatbot Callback", channel: "website", sortOrder: 2 },
    { slug: "project-enquiry", name: "Project Enquiry", channel: "website", sortOrder: 3 },
    { slug: "newsletter", name: "Newsletter", channel: "website", sortOrder: 4 },
  ];
  for (const source of sources) {
    await prisma.leadSource.upsert({
      where: { slug: source.slug },
      update: source,
      create: source,
    });
  }
  record("lead_sources", sources.length);
}

/* ========================================================= TIER 2: CONTENT */

async function seedProjects() {
  const projects = read("projects.json");

  const gurugram = await prisma.location.upsert({
    where: { slug: "gurugram" },
    update: {},
    create: { slug: "gurugram", name: "Gurugram", type: "city", sortOrder: 1 },
  });
  record("locations", 1);

  const categoryBySlug = new Map(
    (await prisma.projectCategory.findMany()).map((c) => [c.slug, c]),
  );
  const statusBySlug = new Map(
    (await prisma.projectStatus.findMany()).map((s) => [s.slug, s]),
  );

  // Amenities and configurations are shared across projects: build the masters
  // once rather than upserting the same 60 amenities fourteen times.
  const amenityNames = [...new Set(projects.flatMap((p) => p.amenities ?? []))];
  const amenityByName = new Map();
  for (const name of amenityNames) {
    const amenity = await prisma.amenity.upsert({
      where: { slug: slugify(name) },
      update: { name },
      create: { slug: slugify(name), name },
    });
    amenityByName.set(name, amenity);
  }
  record("amenities", amenityNames.length);

  const configNames = [...new Set(projects.flatMap((p) => p.configurations ?? []))];
  const configByName = new Map();
  for (const name of configNames) {
    const parsed = parseConfiguration(name);
    const configuration = await prisma.unitConfiguration.upsert({
      where: { slug: parsed.slug },
      update: { name: parsed.name, bedrooms: parsed.bedrooms, isCommercial: parsed.isCommercial },
      create: parsed,
    });
    configByName.set(name, configuration);
  }
  record("unit_configurations", configNames.length);

  for (const [index, source] of projects.entries()) {
    const category = categoryBySlug.get(slugify(source.category));
    const status = statusBySlug.get(slugify(source.status));
    if (!category || !status) {
      throw new Error(
        `Project "${source.slug}" references unknown category/status: ${source.category} / ${source.status}`,
      );
    }

    const possession = parsePossession(source.possession);
    const area = parseAreaRange(source.areaRange);

    // Keep the original wording only when a date cannot reproduce it.
    const possessionLabelOverride = possession.on ? null : (source.possession || null);

    const data = {
      name: source.name,
      categoryId: category.id,
      projectStatusId: status.id,
      locationId: gurugram.id,
      publishStatus: "PUBLISHED",
      publishedAt: new Date(),
      tagline: source.tagline || null,
      description: source.description,
      displayLocality: source.location,
      priceFromMinor: source.priceFrom > 0 ? toMinor(source.priceFrom) : null,
      priceOnRequest: !(source.priceFrom > 0),
      areaMin: area.min,
      areaMax: area.max,
      areaUnit: area.unit,
      possessionOn: possession.on,
      possessionPrecision: possession.precision,
      possessionLabelOverride,
      isFeatured: Boolean(source.featured),
      featuredRank: source.featured ? index : null,
      sortOrder: index,
    };

    const project = await prisma.project.upsert({
      where: { slug: source.slug },
      update: data,
      create: { slug: source.slug, ...data },
    });

    // Highlights — editorial copy, preserved verbatim.
    await prisma.projectHighlight.deleteMany({ where: { projectId: project.id } });
    const highlights = (source.highlights ?? []).map((label, order) => ({
      projectId: project.id,
      label,
      sortOrder: order,
    }));
    if (highlights.length > 0) {
      await prisma.projectHighlight.createMany({ data: highlights, skipDuplicates: true });
      record("project_highlights", highlights.length);
    }

    // Amenities
    await prisma.projectAmenity.deleteMany({ where: { projectId: project.id } });
    const amenityLinks = (source.amenities ?? []).map((name, order) => ({
      projectId: project.id,
      amenityId: amenityByName.get(name).id,
      isHighlighted: order < 3,
      sortOrder: order,
    }));
    if (amenityLinks.length > 0) {
      await prisma.projectAmenity.createMany({ data: amenityLinks, skipDuplicates: true });
      record("project_amenities", amenityLinks.length);
    }

    // Unit types — one per configuration the project offers.
    for (const [order, name] of (source.configurations ?? []).entries()) {
      const configuration = configByName.get(name);
      await prisma.projectUnitType.upsert({
        where: {
          projectId_configurationId_label: {
            projectId: project.id,
            configurationId: configuration.id,
            label: name,
          },
        },
        update: { sortOrder: order },
        create: {
          projectId: project.id,
          configurationId: configuration.id,
          label: name,
          areaUnit: area.unit,
          sortOrder: order,
        },
      });
      record("project_unit_types", 1);
    }

    // RERA — only where a number actually exists; "" is not a registration.
    if (source.reraId && source.reraId.trim()) {
      await prisma.reraRegistration.upsert({
        where: {
          projectId_registrationNumber: {
            projectId: project.id,
            registrationNumber: source.reraId.trim(),
          },
        },
        update: {},
        create: {
          projectId: project.id,
          registrationNumber: source.reraId.trim(),
          authority: "HRERA",
        },
      });
      record("rera_registrations", 1);
    }

    /* hasVirtualTour / hasBrochure are booleans in the JSON and existence-of-rows
       in the schema. Recording the claim keeps the site truthful about what is
       on offer; the URL and the file are what the business still owes us, which
       is exactly what isActive=false and a zero-byte pending asset say. */
    if (source.hasVirtualTour) {
      const existing = await prisma.virtualTour.findFirst({
        where: { projectId: project.id, title: "Virtual tour" },
      });
      if (!existing) {
        await prisma.virtualTour.create({
          data: {
            projectId: project.id,
            title: "Virtual tour",
            provider: "CUSTOM_IFRAME",
            embedUrl: "",
            isActive: false,
          },
        });
        record("virtual_tours", 1);
      }
    }

    if (source.hasBrochure) {
      const storagePath = `pending/${source.slug}-brochure.pdf`;
      const media = await prisma.mediaAsset.upsert({
        where: { bucket_storagePath: { bucket: "brochures", storagePath } },
        update: {},
        create: {
          kind: "DOCUMENT",
          bucket: "brochures",
          storagePath,
          fileName: `${source.slug}-brochure.pdf`,
          mimeType: "application/pdf",
          sizeBytes: 0n,
          accessLevel: "LEAD_GATED",
        },
      });

      const existing = await prisma.projectDocument.findFirst({
        where: { projectId: project.id, kind: "BROCHURE" },
      });
      if (!existing) {
        await prisma.projectDocument.create({
          data: {
            projectId: project.id,
            mediaId: media.id,
            kind: "BROCHURE",
            title: `${source.name} brochure`,
            accessLevel: "LEAD_GATED",
            isActive: false,
          },
        });
        record("project_documents", 1);
        record("media_assets (pending brochures)", 1);
      }
    }

    record("projects", 1);
  }
}

async function seedEditorial() {
  // ---------------------------------------------------------------- blog ---
  const posts = read("blog.json");
  const authorCache = new Map();

  for (const post of posts) {
    let author = authorCache.get(post.author);
    if (!author) {
      author = await prisma.author.upsert({
        where: { slug: slugify(post.author) },
        update: { name: post.author },
        create: { slug: slugify(post.author), name: post.author },
      });
      authorCache.set(post.author, author);
      record("authors", 1);
    }

    const category = await prisma.blogCategory.upsert({
      where: { slug: slugify(post.category) },
      update: { name: post.category },
      create: { slug: slugify(post.category), name: post.category },
    });

    const data = {
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      contentText: flattenArticle(post.content),
      categoryId: category.id,
      authorId: author.id,
      readTimeMinutes: post.readTimeMinutes ?? null,
      publishStatus: "PUBLISHED",
      publishedAt: new Date(post.publishedAt),
    };

    await prisma.blogPost.upsert({
      where: { slug: post.slug },
      update: data,
      create: { slug: post.slug, ...data },
    });
    record("blog_posts", 1);
  }
  record("blog_categories", new Set(posts.map((p) => p.category)).size);

  // -------------------------------------------------------- testimonials ---
  const testimonials = read("testimonials.json");
  const projectsByName = new Map(
    (await prisma.project.findMany({ select: { id: true, name: true } })).map((p) => [
      p.name.toLowerCase(),
      p,
    ]),
  );

  for (const [order, item] of testimonials.entries()) {
    // projectName was a free string with nothing enforcing it; resolve it to a
    // real relation and report anything that does not match rather than
    // silently dropping the link.
    const key = String(item.projectName ?? "").toLowerCase();
    const match =
      projectsByName.get(key) ??
      projectsByName.get(key.replace(/^the\s+/, "")) ??
      [...projectsByName.entries()].find(([name]) => name.includes(key) || key.includes(name))?.[1];

    if (item.projectName && !match) {
      console.warn(`  ! testimonial "${item.name}" references unknown project "${item.projectName}"`);
    }

    const existing = await prisma.testimonial.findFirst({
      where: { authorName: item.name, quote: item.quote },
    });

    const data = {
      authorName: item.name,
      authorRole: item.role ?? null,
      projectId: match?.id ?? null,
      rating: item.rating,
      quote: item.quote,
      isVideo: item.type === "video",
      publishStatus: "PUBLISHED",
      publishedAt: new Date(),
      sortOrder: order,
    };

    if (existing) await prisma.testimonial.update({ where: { id: existing.id }, data });
    else await prisma.testimonial.create({ data });
    record("testimonials", 1);
  }

  // ----------------------------------------------------------------- faq ---
  const faqs = read("faq.json");
  for (const [order, faq] of faqs.entries()) {
    const category = await prisma.faqCategory.upsert({
      where: { slug: slugify(faq.category) },
      update: { name: faq.category },
      create: { slug: slugify(faq.category), name: faq.category, sortOrder: order },
    });

    const existing = await prisma.faq.findFirst({ where: { question: faq.question } });
    const data = {
      categoryId: category.id,
      question: faq.question,
      answer: faq.answer,
      publishStatus: "PUBLISHED",
      sortOrder: order,
    };

    if (existing) await prisma.faq.update({ where: { id: existing.id }, data });
    else await prisma.faq.create({ data });
    record("faqs", 1);
  }
  record("faq_categories", new Set(faqs.map((f) => f.category)).size);

  // ---------------------------------------------------------- leadership ---
  for (const [order, leader] of read("leadership.json").entries()) {
    const data = {
      name: leader.name,
      role: leader.role,
      bio: leader.bio,
      publishStatus: "PUBLISHED",
      sortOrder: order,
    };
    await prisma.leadershipMember.upsert({
      where: { slug: slugify(leader.name) },
      update: data,
      create: { slug: slugify(leader.name), ...data },
    });
    record("leadership_members", 1);
  }

  // ---------------------------------------------------------- milestones ---
  for (const [order, milestone] of read("milestones.json").entries()) {
    const existing = await prisma.milestone.findFirst({
      where: { year: milestone.year, title: milestone.title },
    });
    const data = {
      year: milestone.year,
      title: milestone.title,
      description: milestone.description,
      occurredOn: /^\d{4}$/.test(milestone.year)
        ? new Date(Date.UTC(Number(milestone.year), 0, 1))
        : null,
      sortOrder: order,
    };
    if (existing) await prisma.milestone.update({ where: { id: existing.id }, data });
    else await prisma.milestone.create({ data });
    record("milestones", 1);
  }

  // -------------------------------------------------------------- pillars ---
  for (const [order, pillar] of read("pillars.json").entries()) {
    const data = {
      title: pillar.title,
      description: pillar.description,
      iconName: pillar.icon ?? null,
      sortOrder: order,
    };
    await prisma.valuePillar.upsert({
      where: { slug: pillar.id ?? slugify(pillar.title) },
      update: data,
      create: { slug: pillar.id ?? slugify(pillar.title), ...data },
    });
    record("value_pillars", 1);
  }

  // ---------------------------------------------------------------- stats ---
  for (const [order, stat] of read("stats.json").entries()) {
    const data = {
      label: stat.label,
      value: stat.value,
      suffix: stat.suffix ?? null,
      sortOrder: order,
    };
    await prisma.companyStat.upsert({
      where: { slug: stat.id ?? slugify(stat.label) },
      update: data,
      create: { slug: stat.id ?? slugify(stat.label), ...data },
    });
    record("company_stats", 1);
  }

  // ----------------------------------------------------------------- jobs ---
  for (const job of read("jobs.json")) {
    const department = await prisma.department.upsert({
      where: { slug: slugify(job.department) },
      update: { name: job.department },
      create: { slug: slugify(job.department), name: job.department },
    });

    const data = {
      title: job.title,
      departmentId: department.id,
      employmentType: job.type,
      locationText: job.location,
      experienceLabel: job.experience ?? null,
      summary: job.summary,
      responsibilities: job.responsibilities ?? [],
      requirements: job.requirements ?? [],
      benefits: [],
      publishStatus: "PUBLISHED",
      publishedAt: new Date(),
    };

    await prisma.job.upsert({
      where: { slug: job.slug },
      update: data,
      create: { slug: job.slug, ...data },
    });
    record("jobs", 1);
  }

  // ---------------------------------------------------------------- legal ---
  const legal = read("legal.json");
  const document = await prisma.legalDocument.upsert({
    where: { slug_version: { slug: "privacy-policy", version: "1.0" } },
    update: { publishStatus: "PUBLISHED" },
    create: {
      slug: "privacy-policy",
      version: "1.0",
      title: "Privacy Policy",
      effectiveFrom: new Date(legal.lastUpdated),
      publishStatus: "PUBLISHED",
    },
  });
  await prisma.legalDocumentSection.deleteMany({ where: { documentId: document.id } });
  await prisma.legalDocumentSection.createMany({
    data: (legal.sections ?? []).map((section, order) => ({
      documentId: document.id,
      heading: section.heading,
      body: section.body,
      items: section.items ?? [],
      sortOrder: order,
    })),
  });
  record("legal_documents", 1);
  record("legal_document_sections", (legal.sections ?? []).length);
}

async function seedSiteConfiguration() {
  const site = read("site.json");
  const navigation = read("navigation.json");

  // ------------------------------------------------------------ settings ---
  const settings = [
    ["site.name", site.name, "STRING", "company", "Trading name", true],
    ["site.legalName", site.legalName, "STRING", "company", "Legal name", true],
    ["site.tagline", site.tagline, "STRING", "company", "Tagline", true],
    ["site.positioning", site.positioning, "STRING", "company", "Positioning", true],
    ["site.description", site.description, "STRING", "company", "Description", true],
    ["site.vision", site.vision, "RICH_TEXT", "company", "Vision", true],
    ["site.mission", site.mission, "RICH_TEXT", "company", "Mission", true],
    ["site.foundedYear", String(site.foundedYear), "NUMBER", "company", "Founded", true],
    ["contact.phone", site.phone, "PHONE", "contact", "Phone", true],
    ["contact.landline", site.landline ?? "", "PHONE", "contact", "Landline", true],
    ["contact.whatsapp", site.whatsapp, "PHONE", "contact", "WhatsApp", true],
    ["contact.email", site.email, "EMAIL", "contact", "Email", true],
    ["contact.address", site.address, "STRING", "contact", "Address", true],
    ["legal.reraNumber", site.reraNumber ?? "", "STRING", "legal", "RERA number", true],
  ];

  for (const [key, value, type, group, label, isPublic] of settings) {
    await prisma.siteSetting.upsert({
      where: { key },
      update: { value, type, group, label, isPublic },
      create: { key, value, type, group, label, isPublic },
    });
  }
  record("site_settings", settings.length);

  // -------------------------------------------------------- social links ---
  for (const [order, social] of (site.social ?? []).entries()) {
    const platform = slugify(social.label);
    await prisma.socialLink.upsert({
      where: { platform },
      update: { label: social.label, url: social.href, sortOrder: order },
      create: { platform, label: social.label, url: social.href, sortOrder: order },
    });
    record("social_links", 1);
  }

  // --------------------------------------------------------------- office ---
  await prisma.office.upsert({
    where: { slug: "corporate-gurugram" },
    update: {},
    create: {
      slug: "corporate-gurugram",
      name: "Corporate Office",
      type: "corporate",
      addressLine1: "M3M Tee Point, 7th Floor, North Block",
      addressLine2: "Sector 65",
      city: "Gurugram",
      state: "Haryana",
      pinCode: "122018",
      phone: site.phone,
      email: site.email,
      whatsapp: site.whatsapp,
      isPrimary: true,
    },
  });
  record("offices", 1);

  // ----------------------------------------------------------- navigation ---
  const menus = [
    { slug: "main", name: "Main Menu", location: "header", items: navigation.main },
    { slug: "explore", name: "Explore", location: "footer", items: navigation.explore },
    { slug: "company", name: "Company", location: "footer", items: navigation.company },
  ];

  for (const definition of menus) {
    const menu = await prisma.navigationMenu.upsert({
      where: { slug: definition.slug },
      update: { name: definition.name, location: definition.location },
      create: { slug: definition.slug, name: definition.name, location: definition.location },
    });

    await prisma.navigationItem.deleteMany({ where: { menuId: menu.id } });
    await prisma.navigationItem.createMany({
      data: (definition.items ?? []).map((item, order) => ({
        menuId: menu.id,
        label: item.label,
        href: item.href,
        sortOrder: order,
      })),
    });
    record("navigation_items", (definition.items ?? []).length);
  }
  record("navigation_menus", menus.length);

  // ------------------------------------------------------ homepage sections -
  // The twelve BRD blueprint sections, in render order, so the CMS module has
  // something real to reorder and toggle.
  const sections = [
    ["hero", "Hero", "Hero", 1],
    ["trust_bar", "Trust Bar", "TrustBar", 2],
    ["featured_projects", "Featured Projects", "FeaturedProjects", 3],
    ["why_choose_us", "Why Choose Us", "WhyChooseUs", 4],
    ["premium_highlights", "Premium Highlights", "PremiumHighlights", 5],
    ["emi_calculator", "EMI Calculator", "EmiSection", 6],
    ["testimonials", "Testimonials", "Testimonials", 7],
    ["blog_teaser", "Blog & Insights", "BlogTeaser", 8],
    ["career_teaser", "Career Teaser", "CareerTeaser", 9],
  ];
  for (const [key, name, componentType, sortOrder] of sections) {
    await prisma.homepageSection.upsert({
      where: { key },
      update: { name, componentType, sortOrder },
      create: { key, name, componentType, config: {}, sortOrder, isVisible: true },
    });
  }
  record("homepage_sections", sections.length);

  // ---------------------------------------------------------- integrations -
  const integrations = [
    ["lead-storage", "Lead Storage", true],
    ["notifications", "Notifications", false],
    ["whatsapp", "WhatsApp", true],
    ["crm", "CRM", false],
    ["email", "Email Service", false],
    ["ga4", "Google Analytics 4", false],
    ["google-maps", "Google Maps", false],
  ];
  for (const [slug, name, isEnabled] of integrations) {
    await prisma.integration.upsert({
      where: { slug },
      update: {},
      create: { slug, name, isEnabled },
    });
  }
  record("integrations", integrations.length);
}

/* ========================================================= TIER 3: RUNTIME */

/**
 * Carries captured leads and callbacks out of data-runtime/*.json.
 *
 * This is the only data in the project that cannot be regenerated, so it is
 * deduplicated into `contacts` on normalised phone rather than imported flat —
 * the same person submitting twice becomes one contact with two leads.
 */
async function seedRuntimeData() {
  const runtime = path.join(ROOT, "data-runtime");
  if (!existsSync(runtime)) {
    console.log("  (no data-runtime/ — nothing captured yet)");
    return;
  }

  const stageBySlug = new Map(
    (await prisma.leadStage.findMany()).map((s) => [s.slug, s]),
  );
  const sourceBySlug = new Map(
    (await prisma.leadSource.findMany()).map((s) => [s.slug, s]),
  );

  async function contactFor(name, phone, email) {
    const normalized = normalizePhone(phone);
    if (!normalized) return null;
    const { firstName, lastName } = splitName(name);

    return prisma.contact.upsert({
      where: { phoneNormalized: normalized },
      update: { fullName: name, email: email ?? undefined },
      create: {
        phoneNormalized: normalized,
        phoneRaw: String(phone),
        fullName: name,
        firstName,
        lastName,
        email: email ?? null,
      },
    });
  }

  // ---------------------------------------------------------------- leads ---
  const leadsFile = path.join(runtime, "leads.json");
  if (existsSync(leadsFile)) {
    const rows = JSON.parse(readFileSync(leadsFile, "utf8"));
    let sequence = 0;

    for (const row of Array.isArray(rows) ? rows : []) {
      const contact = await contactFor(row.name, row.phone, row.email);
      if (!contact) {
        console.warn(`  ! lead "${row.id}" has no usable phone — skipped`);
        continue;
      }

      sequence += 1;
      const stage = stageBySlug.get(row.status ?? "new") ?? stageBySlug.get("new");
      const source = sourceBySlug.get(row.source ?? "contact-form") ?? sourceBySlug.get("contact-form");
      const created = row.createdAt ? new Date(row.createdAt) : new Date();

      const existing = await prisma.lead.findFirst({
        where: { contactId: contact.id, createdAt: created },
      });
      if (existing) continue;

      await prisma.lead.create({
        data: {
          reference: reference("LEAD", sequence, created.getUTCFullYear()),
          contactId: contact.id,
          sourceId: source.id,
          stageId: stage.id,
          message: row.message ?? null,
          createdAt: created,
        },
      });
      record("leads", 1);
      record("contacts", 1);
    }
  }

  // ------------------------------------------------------------ callbacks ---
  const callbacksFile = path.join(runtime, "callbacks.json");
  if (existsSync(callbacksFile)) {
    const rows = JSON.parse(readFileSync(callbacksFile, "utf8"));

    for (const row of Array.isArray(rows) ? rows : []) {
      const contact = await contactFor(row.name, row.phone, null);
      const created = row.createdAt ? new Date(row.createdAt) : new Date();

      const existing = await prisma.callbackRequest.findFirst({
        where: { name: row.name, phone: String(row.phone), createdAt: created },
      });
      if (existing) continue;

      await prisma.callbackRequest.create({
        data: {
          contactId: contact?.id ?? null,
          name: row.name,
          phone: String(row.phone),
          preferredTimeLabel: row.preferredTime ?? "As soon as possible",
          message: row.message ?? null,
          unansweredQuestion: row.unansweredQuestion ?? null,
          status: row.status ?? "new",
          createdAt: created,
        },
      });
      record("callback_requests", 1);
    }
  }
}

/* =============================================================== ENTRYPOINT */

async function main() {
  const demo = process.env.SEED_DEMO === "true" && process.env.NODE_ENV !== "production";

  console.log("TIER 1 — system");
  await seedAccessControl();
  await seedTaxonomies();
  await seedOperators();

  console.log("TIER 2 — content");
  await seedProjects();
  await seedEditorial();
  await seedSiteConfiguration();

  console.log("TIER 3 — runtime");
  await seedRuntimeData();

  if (demo) console.log("(SEED_DEMO acknowledged — no demo fixtures defined yet)");

  console.log("");
  console.log("-".repeat(52));
  console.log("SEEDED");
  console.log("-".repeat(52));
  for (const [label, n] of Object.entries(counts).sort()) {
    console.log(`  ${label.padEnd(34)} ${String(n).padStart(5)}`);
  }
  console.log("-".repeat(52));
}

main()
  .catch((error) => {
    console.error("\nSEED FAILED:", error.message);
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

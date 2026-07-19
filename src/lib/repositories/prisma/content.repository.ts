import "server-only";

import { prisma } from "@/lib/db";
import type {
  BlogPost,
  FaqItem,
  Job,
  Leader,
  LegalDocument,
  Milestone,
  NavLink,
  SiteConfig,
  Stat,
  Testimonial,
  ValuePillar,
} from "@/types";
import type {
  ContentReadRepository,
  SiteConfigRepository,
} from "../content.types";
import {
  BLOG_INCLUDE,
  JOB_INCLUDE,
  TESTIMONIAL_INCLUDE,
  toBlogPost,
  toJob,
  toTestimonial,
} from "./mappers";

/** SERVER ONLY. Editorial content, read from PostgreSQL. */

const LIVE = { publishStatus: "PUBLISHED" as const };

export class PrismaContentRepository implements ContentReadRepository {
  async stats(): Promise<Stat[]> {
    const rows = await prisma.companyStat.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });
    return rows.map((row) => ({
      id: row.slug,
      value: row.value,
      suffix: row.suffix ?? "",
      label: row.label,
    }));
  }

  async pillars(): Promise<ValuePillar[]> {
    const rows = await prisma.valuePillar.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });
    return rows.map((row) => ({
      id: row.slug,
      title: row.title,
      description: row.description,
      icon: row.iconName ?? "Sparkles",
    }));
  }

  async testimonials(): Promise<Testimonial[]> {
    const rows = await prisma.testimonial.findMany({
      where: LIVE,
      include: TESTIMONIAL_INCLUDE,
      orderBy: { sortOrder: "asc" },
    });
    return rows.map(toTestimonial);
  }

  async leadership(limit?: number): Promise<Leader[]> {
    const rows = await prisma.leadershipMember.findMany({
      where: LIVE,
      orderBy: { sortOrder: "asc" },
      ...(limit ? { take: limit } : {}),
    });
    return rows.map((row) => ({
      id: row.slug,
      name: row.name,
      role: row.role,
      initials: row.name
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map((part, index, all) =>
          index === 0 || index === all.length - 1 ? part[0] : "",
        )
        .join("")
        .slice(0, 2)
        .toUpperCase(),
      bio: row.bio,
    }));
  }

  async milestones(): Promise<Milestone[]> {
    const rows = await prisma.milestone.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });
    return rows.map((row) => ({
      id: row.id,
      year: row.year,
      title: row.title,
      description: row.description,
    }));
  }

  async blogCategories(): Promise<string[]> {
    const rows = await prisma.blogCategory.findMany({
      where: { isActive: true, posts: { some: { ...LIVE, deletedAt: null } } },
      orderBy: { sortOrder: "asc" },
      select: { name: true },
    });
    return rows.map((row) => row.name);
  }

  async blogPosts(limit?: number): Promise<BlogPost[]> {
    const rows = await prisma.blogPost.findMany({
      where: { ...LIVE, deletedAt: null },
      include: BLOG_INCLUDE,
      orderBy: { publishedAt: "desc" },
      ...(limit ? { take: limit } : {}),
    });
    return rows.map(toBlogPost);
  }

  async blogPostBySlug(slug: string): Promise<BlogPost | null> {
    const row = await prisma.blogPost.findFirst({
      where: { slug, ...LIVE, deletedAt: null },
      include: BLOG_INCLUDE,
    });
    return row ? toBlogPost(row) : null;
  }

  async faqs(): Promise<FaqItem[]> {
    const rows = await prisma.faq.findMany({
      where: LIVE,
      include: { category: true },
      orderBy: [{ category: { sortOrder: "asc" } }, { sortOrder: "asc" }],
    });
    return rows.map((row) => ({
      id: row.id,
      category: row.category?.name ?? "General",
      question: row.question,
      answer: row.answer,
    }));
  }

  async faqsByCategory(): Promise<{ category: string; items: FaqItem[] }[]> {
    // One query, grouped in memory. Grouping fourteen rows in the database
    // would cost an extra round trip to save nothing.
    const items = await this.faqs();
    const categories = [...new Set(items.map((item) => item.category))];
    return categories.map((category) => ({
      category,
      items: items.filter((item) => item.category === category),
    }));
  }

  async legalDocument(): Promise<LegalDocument> {
    const document = await prisma.legalDocument.findFirst({
      where: { slug: "privacy-policy", publishStatus: "PUBLISHED" },
      include: { sections: { orderBy: { sortOrder: "asc" } } },
      orderBy: { effectiveFrom: "desc" },
    });

    if (!document) return { lastUpdated: "", sections: [] };

    return {
      lastUpdated: document.effectiveFrom.toISOString().slice(0, 10),
      sections: document.sections.map((section) => ({
        id: section.id,
        heading: section.heading,
        body: section.body,
        ...(section.items.length > 0 ? { items: section.items } : {}),
      })),
    };
  }

  async jobs(limit?: number): Promise<Job[]> {
    const rows = await prisma.job.findMany({
      where: { ...LIVE, deletedAt: null },
      include: JOB_INCLUDE,
      orderBy: { publishedAt: "desc" },
      ...(limit ? { take: limit } : {}),
    });
    return rows.map(toJob);
  }

  async jobBySlug(slug: string): Promise<Job | null> {
    const row = await prisma.job.findFirst({
      where: { slug, ...LIVE, deletedAt: null },
      include: JOB_INCLUDE,
    });
    return row ? toJob(row) : null;
  }

  async jobDepartments(): Promise<string[]> {
    const rows = await prisma.department.findMany({
      where: {
        isActive: true,
        jobs: { some: { ...LIVE, deletedAt: null } },
      },
      orderBy: { sortOrder: "asc" },
      select: { name: true },
    });
    return rows.map((row) => row.name);
  }

  async jobCount(): Promise<number> {
    return prisma.job.count({ where: { ...LIVE, deletedAt: null } });
  }
}

/* ------------------------------------------------------ site configuration */

export class PrismaSiteConfigRepository implements SiteConfigRepository {
  async config(): Promise<SiteConfig> {
    const [settings, socials] = await Promise.all([
      prisma.siteSetting.findMany({ where: { isPublic: true } }),
      prisma.socialLink.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      }),
    ]);

    const value = (key: string, fallback = "") =>
      settings.find((setting) => setting.key === key)?.value ?? fallback;

    return {
      name: value("site.name"),
      legalName: value("site.legalName"),
      tagline: value("site.tagline"),
      positioning: value("site.positioning"),
      description: value("site.description"),
      vision: value("site.vision"),
      mission: value("site.mission"),
      foundedYear: Number(value("site.foundedYear", "0")) || 0,
      phone: value("contact.phone"),
      landline: value("contact.landline"),
      whatsapp: value("contact.whatsapp"),
      email: value("contact.email"),
      address: value("contact.address"),
      reraNumber: value("legal.reraNumber"),
      social: socials.map((social) => ({ label: social.label, href: social.url })),
    };
  }

  async navigation(): Promise<{
    main: NavLink[];
    explore: NavLink[];
    company: NavLink[];
  }> {
    const menus = await prisma.navigationMenu.findMany({
      where: { isActive: true },
      include: {
        items: {
          // Top-level entries only; nested children are a CMS feature the
          // public navbar does not render yet.
          where: { isVisible: true, parentId: null },
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    const bySlug = (slug: string): NavLink[] =>
      menus
        .find((menu) => menu.slug === slug)
        ?.items.map((item) => ({ label: item.label, href: item.href })) ?? [];

    return {
      main: bySlug("main"),
      explore: bySlug("explore"),
      company: bySlug("company"),
    };
  }
}

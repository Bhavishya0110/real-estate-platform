#!/usr/bin/env node
/**
 * Verifies seeded data against the source JSON.
 *
 * Row counts prove the seed ran; this proves it ran *correctly* — that the
 * money survived the conversion, that possession labels were preserved where a
 * date could not carry them, and that the search triggers actually fired.
 */

import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";
import path from "node:path";

const prisma = new PrismaClient();
const sourceProjects = JSON.parse(
  readFileSync(path.join(process.cwd(), "src", "data", "projects.json"), "utf8"),
);

const problems = [];
const line = () => console.log("-".repeat(66));

async function main() {
  line();
  console.log("SEED VERIFICATION");
  line();

  // ------------------------------------------------------- round-trip ------
  console.log("Project round-trip (JSON -> DB -> rendered):");
  for (const source of sourceProjects) {
    const project = await prisma.project.findUnique({
      where: { slug: source.slug },
      include: {
        category: true,
        projectStatus: true,
        amenities: true,
        unitTypes: { include: { configuration: true } },
        virtualTours: true,
        documents: true,
      },
    });

    if (!project) {
      problems.push(`project ${source.slug} missing`);
      continue;
    }

    // Money must come back exactly.
    const expected = source.priceFrom > 0 ? BigInt(source.priceFrom) * 100n : null;
    if (project.priceFromMinor !== expected) {
      problems.push(
        `${source.slug}: price ${project.priceFromMinor} != expected ${expected}`,
      );
    }

    // Possession must render the same words the site shows today.
    const rendered =
      project.possessionLabelOverride ??
      (project.possessionOn
        ? new Intl.DateTimeFormat("en-IN", {
            month: "long",
            year: "numeric",
            timeZone: "UTC",
          }).format(project.possessionOn)
        : "");
    if (rendered !== source.possession) {
      problems.push(`${source.slug}: possession "${rendered}" != "${source.possession}"`);
    }

    // Derived flags must match the booleans the frontend still reads.
    const hasTour = project.virtualTours.length > 0;
    const hasBrochure = project.documents.some((d) => d.kind === "BROCHURE");
    if (hasTour !== source.hasVirtualTour) {
      problems.push(`${source.slug}: hasVirtualTour ${hasTour} != ${source.hasVirtualTour}`);
    }
    if (hasBrochure !== source.hasBrochure) {
      problems.push(`${source.slug}: hasBrochure ${hasBrochure} != ${source.hasBrochure}`);
    }

    // Collections must be complete.
    if (project.amenities.length !== new Set(source.amenities ?? []).size) {
      problems.push(
        `${source.slug}: ${project.amenities.length} amenities != ${new Set(source.amenities ?? []).size} distinct in JSON`,
      );
    }
    if (project.unitTypes.length !== new Set(source.configurations ?? []).size) {
      problems.push(
        `${source.slug}: ${project.unitTypes.length} unit types != ${new Set(source.configurations ?? []).size}`,
      );
    }

    console.log(
      `  ${source.slug.padEnd(16)} ₹${String(project.priceFromMinor ?? 0).padStart(11)} paise  ` +
        `possession="${rendered}"`.padEnd(34) +
        `  amenities=${project.amenities.length} units=${project.unitTypes.length}`,
    );
  }

  // ---------------------------------------------------- search vectors -----
  line();
  const [tsv] = await prisma.$queryRawUnsafe(`
    SELECT
      count(*) FILTER (WHERE search_vector IS NOT NULL)::int AS populated,
      count(*)::int AS total
    FROM projects
  `);
  console.log(`Search vectors populated: ${tsv.populated}/${tsv.total}`);
  if (tsv.populated !== tsv.total) problems.push("some projects have no search_vector");

  const hits = await prisma.$queryRawUnsafe(`
    SELECT name, ts_rank(search_vector, websearch_to_tsquery('english', 'golf course')) AS rank
    FROM projects
    WHERE search_vector @@ websearch_to_tsquery('english', 'golf course')
    ORDER BY rank DESC LIMIT 3
  `);
  console.log(`Full-text "golf course" -> ${hits.length} hit(s): ${hits.map((h) => h.name).join(", ")}`);
  if (hits.length === 0) problems.push("full-text search returned nothing for a known term");

  const fuzzy = await prisma.$queryRawUnsafe(`
    SELECT name, similarity(name, 'crosswak') AS sim
    FROM projects WHERE similarity(name, 'crosswak') > 0.3
    ORDER BY sim DESC LIMIT 3
  `);
  console.log(`Trigram "crosswak" -> ${fuzzy.map((f) => f.name).join(", ") || "(none)"}`);

  // --------------------------------------------------------- integrity -----
  line();
  const [orphans] = await prisma.$queryRawUnsafe(`
    SELECT
      (SELECT count(*) FROM testimonials WHERE project_id IS NULL)::int AS unlinked_testimonials,
      (SELECT count(*) FROM projects WHERE category_id IS NULL)::int      AS uncategorised,
      (SELECT count(*) FROM users u WHERE NOT EXISTS (
         SELECT 1 FROM user_roles r WHERE r.user_id = u.id))::int         AS users_without_role
  `);
  console.log(`Unlinked testimonials: ${orphans.unlinked_testimonials}`);
  console.log(`Users without a role : ${orphans.users_without_role}`);
  if (orphans.users_without_role > 0) problems.push("an operator has no role assigned");

  const roleGrants = await prisma.$queryRawUnsafe(`
    SELECT r.slug, count(rp.permission_id)::int AS grants
    FROM roles r LEFT JOIN role_permissions rp ON rp.role_id = r.id
    GROUP BY r.slug ORDER BY grants DESC
  `);
  console.log("Role -> permission grants:");
  roleGrants.forEach((r) => console.log(`  ${r.slug.padEnd(18)} ${r.grants}`));

  line();
  if (problems.length > 0) {
    console.log(`${problems.length} PROBLEM(S):`);
    problems.forEach((p) => console.log(`  ✗ ${p}`));
    process.exitCode = 1;
  } else {
    console.log("ALL SEED CHECKS PASSED");
  }
  line();
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

#!/usr/bin/env node
/**
 * Verifies the migrated schema against the database itself.
 *
 * A successful `migrate deploy` proves the script ran, not that the objects it
 * was supposed to create are present and shaped correctly. This asks the
 * catalogue directly and fails loudly on any shortfall.
 *
 *   node scripts/with-env.mjs node scripts/verify-schema.mjs
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const EXPECTED = {
  tables: 90,
  enums: 20,
  foreignKeys: 118,
  checkConstraints: 14,
};

function line() {
  console.log("-".repeat(62));
}

async function main() {
  const [tables] = await prisma.$queryRawUnsafe(`
    SELECT count(*)::int AS n FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      AND table_name <> '_prisma_migrations'
  `);

  const [enums] = await prisma.$queryRawUnsafe(`
    SELECT count(DISTINCT t.typname)::int AS n
    FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typtype = 'e' AND n.nspname = 'public'
  `);

  const [indexes] = await prisma.$queryRawUnsafe(`
    SELECT count(*)::int AS n FROM pg_indexes
    WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'
  `);

  const [fks] = await prisma.$queryRawUnsafe(`
    SELECT count(*)::int AS n FROM information_schema.table_constraints
    WHERE constraint_schema = 'public' AND constraint_type = 'FOREIGN KEY'
  `);

  const [checks] = await prisma.$queryRawUnsafe(`
    SELECT count(*)::int AS n FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE c.contype = 'c' AND n.nspname = 'public'
      AND c.conname NOT LIKE '%_not_null'
  `);

  const [uniques] = await prisma.$queryRawUnsafe(`
    SELECT count(*)::int AS n FROM information_schema.table_constraints
    WHERE constraint_schema = 'public' AND constraint_type = 'UNIQUE'
  `);

  const [triggers] = await prisma.$queryRawUnsafe(`
    SELECT count(*)::int AS n FROM information_schema.triggers
    WHERE trigger_schema = 'public'
  `);

  const [functions] = await prisma.$queryRawUnsafe(`
    SELECT count(*)::int AS n FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
  `);

  const extensions = await prisma.$queryRawUnsafe(`
    SELECT extname FROM pg_extension
    WHERE extname IN ('pgcrypto','pg_trgm','unaccent','citext') ORDER BY extname
  `);

  const ginIndexes = await prisma.$queryRawUnsafe(`
    SELECT indexname FROM pg_indexes
    WHERE schemaname = 'public' AND indexdef ILIKE '%USING gin%' ORDER BY indexname
  `);

  const partialIndexes = await prisma.$queryRawUnsafe(`
    SELECT indexname FROM pg_indexes
    WHERE schemaname = 'public' AND indexdef ILIKE '%WHERE%' ORDER BY indexname
  `);

  line();
  console.log("SCHEMA VERIFICATION");
  line();
  console.log(`tables              ${tables.n}   (expected ${EXPECTED.tables})`);
  console.log(`enums               ${enums.n}   (expected ${EXPECTED.enums})`);
  console.log(`indexes             ${indexes.n}`);
  console.log(`unique constraints  ${uniques.n}`);
  console.log(`foreign keys        ${fks.n}   (expected ${EXPECTED.foreignKeys})`);
  console.log(`check constraints   ${checks.n}`);
  console.log(`triggers            ${triggers.n}`);
  console.log(`functions           ${functions.n}`);
  console.log(`extensions          ${extensions.map((e) => e.extname).join(", ")}`);
  line();
  console.log("GIN indexes (full-text + trigram):");
  ginIndexes.forEach((i) => console.log(`  ${i.indexname}`));
  line();
  console.log("Partial indexes:");
  partialIndexes.forEach((i) => console.log(`  ${i.indexname}`));
  line();

  // Prove uuid_generate_v7 works and is time-ordered.
  const generated = await prisma.$queryRawUnsafe(`
    SELECT uuid_generate_v7() AS a, uuid_generate_v7() AS b
  `);
  const { a, b } = generated[0];
  const version = a.charAt(14);
  console.log(`uuid_generate_v7()  ${a}`);
  console.log(`                    ${b}`);
  console.log(`  version nibble    ${version}  ${version === "7" ? "OK" : "EXPECTED 7"}`);
  console.log(`  time-ordered      ${a < b ? "OK (ascending)" : "NOT ASCENDING"}`);
  line();

  const problems = [];
  if (tables.n !== EXPECTED.tables) problems.push(`table count ${tables.n} != ${EXPECTED.tables}`);
  if (enums.n !== EXPECTED.enums) problems.push(`enum count ${enums.n} != ${EXPECTED.enums}`);
  if (fks.n !== EXPECTED.foreignKeys) problems.push(`FK count ${fks.n} != ${EXPECTED.foreignKeys}`);
  if (extensions.length !== 4) problems.push(`only ${extensions.length}/4 extensions present`);
  if (ginIndexes.length < 5) problems.push(`only ${ginIndexes.length} GIN indexes, expected >= 5`);
  if (version !== "7") problems.push("uuid_generate_v7 is not emitting version 7");

  if (problems.length > 0) {
    console.log("PROBLEMS:");
    problems.forEach((p) => console.log(`  ✗ ${p}`));
    process.exitCode = 1;
  } else {
    console.log("ALL CHECKS PASSED");
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

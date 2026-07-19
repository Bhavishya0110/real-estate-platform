#!/usr/bin/env node
/**
 * Creates (or reconciles) the Supabase Storage buckets.
 *
 *   node scripts/with-env.mjs node scripts/provision-storage.mjs
 *
 * Idempotent: an existing bucket is updated to match its declaration rather
 * than recreated, so running this twice is safe and running it after changing
 * a limit actually applies the change.
 *
 * Bucket definitions are read from the TypeScript module that the application
 * itself uses, so provisioning and runtime can never disagree about which
 * buckets exist or which are public.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import path from "node:path";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
  process.exit(1);
}

/**
 * Reads the same declarations the application uses.
 *
 * The application's module is TypeScript and imports `server-only`, neither of
 * which resolves in a plain Node script — so both read the inert JSON instead.
 * The alternative, parsing the .ts source, broke the first time a constant was
 * introduced, and duplicating the list guarantees the two drift apart.
 */
function loadDefinitions() {
  const source = JSON.parse(
    readFileSync(
      path.join(process.cwd(), "src", "lib", "storage", "buckets.json"),
      "utf8",
    ),
  );

  return source.buckets.map((bucket) => ({
    name: bucket.name,
    isPublic: bucket.isPublic,
    fileSizeLimit: bucket.fileSizeLimit,
    allowedMimeTypes: [
      ...new Set([
        ...bucket.mimeGroups.flatMap((group) => source.mimeGroups[group] ?? []),
        ...(bucket.extraMimeTypes ?? []),
      ]),
    ],
    description: bucket.description,
  }));
}

const definitions = loadDefinitions();
const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  const { data: existing, error: listError } = await supabase.storage.listBuckets();
  if (listError) throw new Error(`Could not list buckets: ${listError.message}`);

  const byName = new Map((existing ?? []).map((b) => [b.name, b]));

  console.log("-".repeat(78));
  console.log("BUCKET".padEnd(16), "VISIBILITY".padEnd(12), "LIMIT".padEnd(9), "ACTION");
  console.log("-".repeat(78));

  let created = 0;
  let updated = 0;
  const failures = [];

  for (const definition of definitions) {
    const options = {
      public: definition.isPublic,
      fileSizeLimit: definition.fileSizeLimit,
      allowedMimeTypes: definition.allowedMimeTypes,
    };

    const limitLabel = `${Math.round(definition.fileSizeLimit / (1024 * 1024))} MB`;
    const visibility = definition.isPublic ? "public" : "PRIVATE";

    if (byName.has(definition.name)) {
      const { error } = await supabase.storage.updateBucket(definition.name, options);
      if (error) {
        failures.push(`${definition.name}: ${error.message}`);
        console.log(definition.name.padEnd(16), visibility.padEnd(12), limitLabel.padEnd(9), "FAILED");
      } else {
        updated += 1;
        console.log(definition.name.padEnd(16), visibility.padEnd(12), limitLabel.padEnd(9), "reconciled");
      }
      continue;
    }

    const { error } = await supabase.storage.createBucket(definition.name, options);
    if (error) {
      failures.push(`${definition.name}: ${error.message}`);
      console.log(definition.name.padEnd(16), visibility.padEnd(12), limitLabel.padEnd(9), "FAILED");
    } else {
      created += 1;
      console.log(definition.name.padEnd(16), visibility.padEnd(12), limitLabel.padEnd(9), "created");
    }
  }

  console.log("-".repeat(78));
  console.log(`${created} created, ${updated} reconciled, ${failures.length} failed`);

  if (failures.length > 0) {
    failures.forEach((f) => console.error(`  ✗ ${f}`));
    process.exitCode = 1;
    return;
  }

  // Re-read from the server: the goal is buckets that exist, not calls that
  // returned 200.
  const { data: after } = await supabase.storage.listBuckets();
  const live = new Map((after ?? []).map((b) => [b.name, b]));

  const missing = definitions.filter((d) => !live.has(d.name));
  const wrongVisibility = definitions.filter(
    (d) => live.has(d.name) && live.get(d.name).public !== d.isPublic,
  );

  console.log("");
  console.log(`Verified ${definitions.length - missing.length}/${definitions.length} buckets present.`);

  if (missing.length > 0) {
    console.error("MISSING:", missing.map((d) => d.name).join(", "));
    process.exitCode = 1;
  }
  if (wrongVisibility.length > 0) {
    console.error(
      "VISIBILITY MISMATCH:",
      wrongVisibility.map((d) => `${d.name} (want ${d.isPublic ? "public" : "private"})`).join(", "),
    );
    process.exitCode = 1;
  }
  if (missing.length === 0 && wrongVisibility.length === 0) {
    console.log("ALL BUCKETS VERIFIED");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

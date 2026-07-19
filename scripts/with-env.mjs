#!/usr/bin/env node
/**
 * Runs a command with `.env.local` loaded into the environment.
 *
 * Next.js reads `.env.local` automatically; the Prisma CLI does not — it reads
 * `.env`. Rather than duplicating live credentials into a second file (two
 * copies of a secret is one copy too many, and they drift), this loads the file
 * the application already uses and hands it to the child process.
 *
 *   node scripts/with-env.mjs npx prisma migrate dev
 *
 * Parsing is deliberately minimal but handles what a real credential file
 * contains: quoted values, `export ` prefixes, comments, blank lines, and `=`
 * inside a value (connection strings are full of them).
 */

import { spawn } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

/** Later files win, matching Next.js's own precedence. */
const ENV_FILES = [".env", ".env.local"];

function parseEnvFile(contents) {
  const values = {};

  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const withoutExport = line.startsWith("export ") ? line.slice(7).trim() : line;
    const separator = withoutExport.indexOf("=");
    if (separator === -1) continue;

    const key = withoutExport.slice(0, separator).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue;

    let value = withoutExport.slice(separator + 1).trim();

    // Strip one matching pair of surrounding quotes, and only then.
    const quoted =
      (value.startsWith('"') && value.endsWith('"') && value.length > 1) ||
      (value.startsWith("'") && value.endsWith("'") && value.length > 1);
    if (quoted) value = value.slice(1, -1);

    values[key] = value;
  }

  return values;
}

const loaded = {};
for (const file of ENV_FILES) {
  const full = path.join(ROOT, file);
  if (!existsSync(full)) continue;
  Object.assign(loaded, parseEnvFile(readFileSync(full, "utf8")));
}

/* A value already in the real environment wins — that is how CI overrides a
   local file, and silently shadowing it would be a nasty surprise. */
for (const [key, value] of Object.entries(loaded)) {
  if (process.env[key] === undefined) process.env[key] = value;
}

/**
 * The approved design names the migration connection DIRECT_DATABASE_URL.
 * Supabase's own template names it DIRECT_URL. Accept either, so neither the
 * schema nor a freshly copied Supabase credential block has to be edited.
 */
if (!process.env.DIRECT_DATABASE_URL && process.env.DIRECT_URL) {
  process.env.DIRECT_DATABASE_URL = process.env.DIRECT_URL;
}
if (!process.env.DIRECT_URL && process.env.DIRECT_DATABASE_URL) {
  process.env.DIRECT_URL = process.env.DIRECT_DATABASE_URL;
}

/**
 * Give the connection room to establish.
 *
 * The database is a Supabase pooler in ap-northeast-1; a TCP handshake from
 * here measures around six seconds, and Prisma's default connect timeout is
 * five. The result is an intermittent P1001 that looks like an outage but is
 * really a stopwatch. Raising it here keeps the credential file free of tuning
 * parameters, and an explicitly configured value is always respected.
 */
function withConnectionDefaults(rawUrl) {
  if (!rawUrl || !/^postgres(ql)?:\/\//.test(rawUrl)) return rawUrl;

  try {
    const url = new URL(rawUrl);
    if (!url.searchParams.has("connect_timeout")) {
      url.searchParams.set("connect_timeout", "30");
    }
    if (!url.searchParams.has("pool_timeout")) {
      url.searchParams.set("pool_timeout", "30");
    }
    if (!url.searchParams.has("sslmode")) {
      url.searchParams.set("sslmode", "require");
    }
    return url.toString();
  } catch {
    return rawUrl;
  }
}

for (const key of ["DATABASE_URL", "DIRECT_URL", "DIRECT_DATABASE_URL"]) {
  if (process.env[key]) process.env[key] = withConnectionDefaults(process.env[key]);
}

const [command, ...args] = process.argv.slice(2);

if (!command) {
  console.error("Usage: node scripts/with-env.mjs <command> [args...]");
  process.exit(1);
}

/**
 * Resolves a locally-installed CLI to the JavaScript file it actually runs.
 *
 * Two Windows constraints meet here and rule out the obvious approaches:
 *   • `shell: true` re-parses arguments through cmd.exe, which treats `&` as a
 *     command separator — and every Postgres connection string contains one.
 *   • Without a shell, Node 24 refuses to spawn the `.cmd` shim at all
 *     (EINVAL, from the CVE-2024-27980 hardening).
 *
 * Running the package's own entrypoint under the current Node binary sidesteps
 * both: no shell to mangle the arguments, no `.cmd` to be refused.
 */
function resolveNodeCli(cmd, cmdArgs) {
  // `npx <pkg> …` and a bare `<pkg> …` both mean the local install here.
  const [pkg, ...rest] = cmd === "npx" ? cmdArgs : [cmd, ...cmdArgs];

  try {
    const manifestPath = path.join(ROOT, "node_modules", pkg, "package.json");
    if (existsSync(manifestPath)) {
      const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
      const binField = manifest.bin;
      const relative =
        typeof binField === "string" ? binField : binField?.[pkg];

      if (relative) {
        return {
          executable: process.execPath,
          argv: [path.join(ROOT, "node_modules", pkg, relative), ...rest],
        };
      }
    }
  } catch {
    // Fall through to running the command as given.
  }

  return { executable: cmd, argv: cmdArgs };
}

const { executable, argv } = resolveNodeCli(command, args);

const child = spawn(executable, argv, {
  stdio: "inherit",
  shell: false,
  env: process.env,
});

child.on("error", (error) => {
  console.error(`Failed to start "${executable}": ${error.message}`);
  process.exit(1);
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 0);
});

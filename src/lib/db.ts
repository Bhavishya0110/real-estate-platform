import "server-only";

import { PrismaClient } from "@prisma/client";

/**
 * THE PRISMA CLIENT
 *
 * SERVER ONLY. One instance per process.
 *
 * Held on `globalThis` in development because hot reload re-evaluates modules
 * on every edit; without this, each reload opens a fresh connection pool and
 * Postgres runs out of connections within a few minutes of ordinary work.
 * Production evaluates the module once, so the global is unnecessary there —
 * but harmless, and keeping one code path avoids an environment-specific bug.
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Connection defaults applied in code rather than in the credential file.
 *
 * The database is a Supabase pooler in ap-northeast-1 and the TCP handshake
 * from outside that region routinely takes longer than Prisma's five-second
 * default, which surfaces as an intermittent P1001 that reads like an outage
 * but is really a stopwatch. Setting it here means the fix travels with the
 * code — the build, a Vercel deployment and a developer's clone all get it,
 * and nobody has to remember to paste tuning parameters into a connection
 * string. An explicitly configured value always wins.
 */
function withConnectionDefaults(rawUrl: string | undefined): string | undefined {
  if (!rawUrl) return rawUrl;

  try {
    const url = new URL(rawUrl);
    if (!url.searchParams.has("connect_timeout")) {
      url.searchParams.set("connect_timeout", "30");
    }
    if (!url.searchParams.has("pool_timeout")) {
      url.searchParams.set("pool_timeout", "30");
    }
    return url.toString();
  } catch {
    // Not a URL we can parse — hand it to Prisma unchanged and let it report.
    return rawUrl;
  }
}

const connectionUrl = withConnectionDefaults(process.env.DATABASE_URL);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    ...(connectionUrl ? { datasources: { db: { url: connectionUrl } } } : {}),
    // Errors and warnings always; queries only when explicitly asked for, since
    // logging every query in production is both noise and a PII leak.
    log:
      process.env.PRISMA_LOG_QUERIES === "true"
        ? ["query", "warn", "error"]
        : ["warn", "error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

/**
 * Whether a database is configured at all.
 *
 * The composition root uses this to choose an implementation. Without it, a
 * missing DATABASE_URL would surface as a connection error on every page render
 * rather than a clean fallback to the JSON fixtures.
 */
export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

import "server-only";

import { createHash } from "node:crypto";
import { isDatabaseConfigured, prisma } from "@/lib/db";

/**
 * SESSION PERSISTENCE
 *
 * Phase 5 issued a stateless signed cookie: fast to verify anywhere, but
 * impossible to revoke. A token stayed valid until it expired, so "sign this
 * person out of everywhere, now" — the thing you need on the day someone leaves
 * — could not be done at all.
 *
 * This adds the server-side half without changing the cookie or the login flow:
 *
 *   • The signature is still what the middleware checks. It runs on the Edge
 *     runtime, where Prisma cannot follow, and it must stay cheap enough to run
 *     on every request.
 *   • The database row is what the admin layout checks, once per page render.
 *     That is where revocation, expiry and last-seen actually take effect.
 *
 * Only a SHA-256 of the token is stored. A leaked `sessions` table then yields
 * nothing usable: the hash cannot be replayed as a cookie.
 */

export interface SessionRecord {
  id: string;
  userId: string;
  expiresAt: Date;
  revokedAt: Date | null;
}

/**
 * Why a lookup did not yield a live session.
 *
 * "absent" and "revoked" must be distinguishable. Collapsing both to null makes
 * a revoked session indistinguishable from a session issued before persistence
 * existed — and the safe default for one is the opposite of the other.
 */
export type SessionLookup =
  | { status: "live"; record: SessionRecord }
  | { status: "absent" }
  | { status: "revoked" }
  | { status: "expired" };

export interface SessionRepository {
  create(input: {
    userId: string;
    token: string;
    expiresAt: Date;
    ipAddress?: string | null;
    userAgent?: string | null;
  }): Promise<void>;
  find(token: string): Promise<SessionLookup>;
  revoke(token: string, reason?: string): Promise<void>;
  /** Ends every session for a user — the "sign out everywhere" operation. */
  revokeAllForUser(userId: string, reason?: string): Promise<number>;
  /** Housekeeping: drop rows that can never be valid again. */
  purgeExpired(): Promise<number>;
}

/** Never store the token itself; a hash is enough to recognise it. */
function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

class PrismaSessionRepository implements SessionRepository {
  async create(input: {
    userId: string;
    token: string;
    expiresAt: Date;
    ipAddress?: string | null;
    userAgent?: string | null;
  }): Promise<void> {
    await prisma.session.create({
      data: {
        userId: input.userId,
        tokenHash: hashToken(input.token),
        expiresAt: input.expiresAt,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
      },
    });
  }

  async find(token: string): Promise<SessionLookup> {
    const row = await prisma.session.findUnique({
      where: { tokenHash: hashToken(token) },
      select: { id: true, userId: true, expiresAt: true, revokedAt: true },
    });

    if (!row) return { status: "absent" };
    if (row.revokedAt) return { status: "revoked" };
    if (row.expiresAt <= new Date()) return { status: "expired" };

    /* `lastSeenAt` is useful for showing an operator their active devices, but
       it must never make a page render fail — hence fire-and-forget. */
    prisma.session
      .update({ where: { id: row.id }, data: { lastSeenAt: new Date() } })
      .catch(() => undefined);

    return { status: "live", record: row };
  }

  async revoke(token: string, reason?: string): Promise<void> {
    await prisma.session.updateMany({
      where: { tokenHash: hashToken(token), revokedAt: null },
      data: { revokedAt: new Date(), revokedReason: reason ?? "signed out" },
    });
  }

  async revokeAllForUser(userId: string, reason?: string): Promise<number> {
    const result = await prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date(), revokedReason: reason ?? "revoked" },
    });
    return result.count;
  }

  async purgeExpired(): Promise<number> {
    const result = await prisma.session.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    return result.count;
  }
}

/**
 * The no-database implementation.
 *
 * `find` returns null rather than throwing, and the caller treats a null record
 * as "no server-side record exists" rather than "revoked" — so signature-only
 * verification still authenticates. Without this, running with no DATABASE_URL
 * would lock everyone out of the admin panel.
 */
class NoopSessionRepository implements SessionRepository {
  async create(): Promise<void> {}
  async find(): Promise<SessionLookup> {
    return { status: "absent" };
  }
  async revoke(): Promise<void> {}
  async revokeAllForUser(): Promise<number> {
    return 0;
  }
  async purgeExpired(): Promise<number> {
    return 0;
  }
}

export const sessionRepository: SessionRepository = isDatabaseConfigured()
  ? new PrismaSessionRepository()
  : new NoopSessionRepository();

/** Whether sessions are actually revocable in this deployment. */
export const sessionsArePersisted = isDatabaseConfigured();

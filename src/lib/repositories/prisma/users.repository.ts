import "server-only";

import { verifyPassword } from "@/features/auth/lib/password";
import { prisma } from "@/lib/db";
import type { AdminUser, UserRepository } from "../types";
import { toAdminUser } from "./mappers";

/**
 * OPERATOR ACCOUNTS, ON POSTGRESQL
 *
 * SERVER ONLY. Replaces `EnvUserRepository` behind the identical
 * `UserRepository` interface, so the login action and the admin layout are
 * untouched.
 *
 * The PBKDF2 hash format migrates verbatim — `verifyPassword` is the same
 * function Phase 5 shipped — so nobody is signed out and no password is reset
 * by this change. When Argon2id replaces it, the stored format is
 * self-describing and can be upgraded on next successful sign-in.
 */

/* Roles are ranked, and the highest-ranked one is what the session carries. */
const WITH_ROLES = {
  roles: {
    include: { role: true },
    orderBy: { role: { rank: "desc" as const } },
  },
} as const;

export class PrismaUserRepository implements UserRepository {
  async findAll(): Promise<AdminUser[]> {
    const rows = await prisma.user.findMany({
      where: { deletedAt: null },
      include: WITH_ROLES,
      orderBy: { createdAt: "asc" },
    });
    return rows.map(toAdminUser);
  }

  async findById(id: string): Promise<AdminUser | null> {
    const row = await prisma.user.findFirst({
      where: { id, deletedAt: null },
      include: WITH_ROLES,
    });
    return row ? toAdminUser(row) : null;
  }

  async findByEmail(email: string): Promise<AdminUser | null> {
    const row = await prisma.user.findFirst({
      // citext, so the comparison is already case-insensitive in the database.
      where: { email: email.trim(), deletedAt: null },
      include: WITH_ROLES,
    });
    return row ? toAdminUser(row) : null;
  }

  async count(): Promise<number> {
    return prisma.user.count({ where: { deletedAt: null } });
  }

  /**
   * Verifies a credential and records the attempt.
   *
   * Two behaviours worth stating plainly:
   *   • An unknown email still pays for a hash comparison, so "no such account"
   *     is not measurably faster than "wrong password" — otherwise the timing
   *     difference enumerates who has access.
   *   • Every attempt is written to `login_attempts` and failures increment a
   *     counter that locks the account, which is the part `EnvUserRepository`
   *     could not do at all.
   */
  async verifyCredentials(
    email: string,
    password: string,
  ): Promise<AdminUser | null> {
    const normalised = email.trim();

    const user = await prisma.user.findFirst({
      where: { email: normalised, deletedAt: null },
      include: WITH_ROLES,
    });

    const record = (successful: boolean, failureCode?: string) =>
      prisma.loginAttempt
        .create({
          data: {
            email: normalised,
            userId: user?.id ?? null,
            successful,
            failureCode: failureCode ?? null,
          },
        })
        .catch(() => undefined); // auditing must never block a sign-in

    // A locked account is refused before the password is even considered.
    if (user?.lockedUntil && user.lockedUntil > new Date()) {
      await record(false, "LOCKED");
      return null;
    }

    if (user && user.status !== "ACTIVE") {
      await record(false, "INACTIVE");
      return null;
    }

    const hash =
      user?.passwordHash ??
      "pbkdf2.210000.AAAAAAAAAAAAAAAAAAAAAA.AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

    const matches = await verifyPassword(password, hash);

    if (!matches || !user) {
      if (user) {
        const attempts = user.failedLoginCount + 1;
        await prisma.user.update({
          where: { id: user.id },
          data: {
            failedLoginCount: attempts,
            // Ten wrong guesses buys a fifteen-minute pause. Long enough to
            // make automation expensive, short enough that a real operator who
            // fumbled their password is not locked out of their afternoon.
            lockedUntil:
              attempts >= 10 ? new Date(Date.now() + 15 * 60 * 1000) : null,
          },
        });
      }
      await record(false, user ? "BAD_PASSWORD" : "UNKNOWN_USER");
      return null;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginCount: 0, lockedUntil: null, lastLoginAt: new Date() },
    });
    await record(true);

    return toAdminUser(user);
  }
}

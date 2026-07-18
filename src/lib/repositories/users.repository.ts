import { verifyPassword } from "@/features/auth/lib/password";
import { isRole, type Role } from "@/features/auth/lib/roles";
import type { AdminUser, UserRepository } from "./types";

/**
 * Operator accounts, configured through the environment.
 *
 * SERVER ONLY.
 *
 * There is no user table yet, and inventing a JSON one would put password
 * hashes in the repository next to editorial content — the wrong place for
 * them, and easy to commit by accident. Environment configuration keeps
 * credentials out of the codebase entirely, which is where they belong whether
 * or not a database exists.
 *
 * Configured as (see .env.example):
 *
 *   ADMIN_USERS="owner@example.com|Priya Nair|owner|pbkdf2$210000$…"
 *
 * Multiple accounts are separated by newlines or semicolons. When PostgreSQL
 * arrives this file is replaced by a `PrismaUserRepository` satisfying the same
 * interface, and the composition root swaps one line.
 */

interface StoredUser extends AdminUser {
  passwordHash: string;
}

function parseUsers(): StoredUser[] {
  const raw = process.env.ADMIN_USERS?.trim();
  if (!raw) return [];

  return raw
    .split(/[\n;]+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index): StoredUser | null => {
      const [email, name, role, passwordHash] = line
        .split("|")
        .map((field) => field.trim());

      // A malformed entry is dropped rather than half-built: a user record
      // missing its hash would otherwise be an account nobody can audit.
      if (!email || !name || !passwordHash) return null;
      if (!isRole(role)) return null;

      return {
        id: `user_${index + 1}`,
        email: email.toLowerCase(),
        name,
        role: role as Role,
        passwordHash,
        createdAt: new Date(0).toISOString(),
      };
    })
    .filter((user): user is StoredUser => user !== null);
}

/** Strips the credential before a record leaves this module. */
function toPublic(user: StoredUser): AdminUser {
  const { passwordHash: _passwordHash, ...safe } = user;
  void _passwordHash;
  return safe;
}

export class EnvUserRepository implements UserRepository {
  private users(): StoredUser[] {
    // Read per call rather than cached at module load, so rotating a hash takes
    // effect on restart without a stale copy surviving in memory.
    return parseUsers();
  }

  async findAll(): Promise<AdminUser[]> {
    return this.users().map(toPublic);
  }

  async findById(id: string): Promise<AdminUser | null> {
    const user = this.users().find((candidate) => candidate.id === id);
    return user ? toPublic(user) : null;
  }

  async findByEmail(email: string): Promise<AdminUser | null> {
    const normalised = email.trim().toLowerCase();
    const user = this.users().find((candidate) => candidate.email === normalised);
    return user ? toPublic(user) : null;
  }

  async count(): Promise<number> {
    return this.users().length;
  }

  async verifyCredentials(
    email: string,
    password: string,
  ): Promise<AdminUser | null> {
    const normalised = email.trim().toLowerCase();
    const user = this.users().find((candidate) => candidate.email === normalised);

    /* An unknown email still pays for a hash comparison. Returning early would
       make "no such user" measurably faster than "wrong password", which is
       enough to enumerate who has an account. */
    const hash =
      user?.passwordHash ??
      "pbkdf2.210000.AAAAAAAAAAAAAAAAAAAAAA.AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

    const matches = await verifyPassword(password, hash);

    return matches && user ? toPublic(user) : null;
  }
}

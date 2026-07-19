import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  signToken,
  verifyToken,
  type SessionPayload,
} from "./token";
import { can, type Permission } from "./roles";
import { sessionRepository, sessionsArePersisted } from "./session-store";
import type { AdminUser } from "@/lib/repositories/types";

/**
 * SERVER-SIDE SESSION
 *
 * The cookie half of authentication, kept apart from `token.ts` because that
 * module has to stay importable from the middleware, which runs on the Edge
 * runtime and has no `next/headers`.
 *
 * SERVER ONLY — server components and server actions.
 */

/** The signed-in operator, as the rest of the app sees them. */
export type Session = SessionPayload;

export async function createSession(user: AdminUser): Promise<void> {
  const token = await signToken({
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });

  /* Record the session server-side so it can be revoked before it expires.
     Failure here must not block a sign-in — the signed cookie is still valid on
     its own, so the operator gets in and only loses revocability. */
  await sessionRepository
    .create({
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000),
    })
    .catch((error) => {
      console.error("[auth] could not persist session:", error);
    });

  const store = await cookies();

  store.set(SESSION_COOKIE, token, {
    // Unreadable from JavaScript, so an XSS bug cannot walk off with a session.
    httpOnly: true,
    // HTTPS only in production; plain HTTP in development so localhost works.
    secure: process.env.NODE_ENV === "production",
    // `lax` still sends the cookie on a normal top-level navigation into the
    // panel, while withholding it from cross-site form posts (CSRF).
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;

  // Revoke the server-side record too, so a copied cookie cannot outlive the
  // sign-out that was meant to end it.
  if (token) {
    await sessionRepository.revoke(token, "signed out").catch(() => undefined);
  }

  store.delete(SESSION_COOKIE);
}

/**
 * The current session, or null when signed out, expired or revoked.
 *
 * Two checks, in cost order: the signature first (cheap, no I/O), then the
 * server-side record. A token whose row is absent is still accepted — that is
 * either a session issued before persistence existed, or a deployment with no
 * database — but a row that says *revoked* always wins.
 */
export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;

  const payload = await verifyToken(token);
  if (!payload || !token) return null;

  if (sessionsArePersisted) {
    // A lookup failure is a database problem, not an authorisation decision:
    // treat it as "absent" so an outage degrades to signature-only auth rather
    // than signing every operator out at once.
    const lookup = await sessionRepository
      .find(token)
      .catch(() => ({ status: "absent" as const }));

    // Revoked and expired are refusals. Absent is not: it means either a
    // session issued before persistence existed, or a deployment without a
    // database — in both cases the signature is the whole truth.
    if (lookup.status === "revoked" || lookup.status === "expired") return null;

    // A row belonging to a different user than the token claims means the token
    // has been tampered with or replayed.
    if (lookup.status === "live" && lookup.record.userId !== payload.sub) {
      return null;
    }
  }

  return payload;
}

/** Ends every session a user holds. The "someone has left" operation. */
export async function revokeAllSessions(userId: string): Promise<number> {
  return sessionRepository.revokeAllForUser(userId, "revoked by administrator");
}

/**
 * The current session, or a redirect to sign in.
 *
 * This is the guard the admin layout uses. The middleware already turns
 * unauthenticated requests away before they reach a page — this is the second
 * lock on the same door, and the one that cannot be bypassed by a deployment
 * that mis-configures the matcher or by a request that never passes through the
 * middleware at all.
 */
export async function requireSession(returnTo?: string): Promise<Session> {
  const session = await getSession();
  if (session) return session;

  redirect(returnTo ? `/login?from=${encodeURIComponent(returnTo)}` : "/login");
}

/**
 * The current session, or a redirect, having also checked a permission.
 *
 * Nothing needs this yet — every admin module today is readable by every role
 * that can sign in. It exists because the point of a role system is that the
 * *next* module can be guarded in one line rather than growing its own idea of
 * what an editor may do.
 */
export async function requirePermission(
  permission: Permission,
  returnTo?: string,
): Promise<Session> {
  const session = await requireSession(returnTo);
  if (can(session.role, permission)) return session;

  redirect("/admin?denied=1");
}

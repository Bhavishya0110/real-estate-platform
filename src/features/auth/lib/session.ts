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
  store.delete(SESSION_COOKIE);
}

/** The current session, or null when signed out or expired. */
export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  return verifyToken(store.get(SESSION_COOKIE)?.value);
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

"use server";

import { redirect } from "next/navigation";
import {
  createSession,
  destroySession,
  getSession,
} from "@/features/auth/lib/session";
import { userRepository } from "@/lib/repositories";

/**
 * Server actions for signing in and out.
 *
 * Credentials are only ever compared on the server, through the repository —
 * the browser never receives a hash, and the client form knows nothing about
 * how users are stored.
 */

export interface AuthResult {
  ok: boolean;
  /** Safe to show the user. Never says which half of the pair was wrong. */
  message?: string;
}

/** Only same-origin paths, so `?from=` cannot bounce a signed-in operator off-site. */
function safeReturnPath(value: string | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/admin";
  return value.startsWith("/admin") ? value : "/admin";
}

export async function signIn(
  email: string,
  password: string,
  from?: string,
): Promise<AuthResult> {
  if (!email.trim() || !password) {
    return { ok: false, message: "Enter your email address and password." };
  }

  const user = await userRepository.verifyCredentials(email, password);

  if (!user) {
    /* One message for an unknown account and for a wrong password alike.
       Distinguishing them would confirm which email addresses have access. */
    return { ok: false, message: "Those details do not match an account." };
  }

  await createSession(user);
  redirect(safeReturnPath(from));
}

export async function signOut(): Promise<void> {
  await destroySession();
  redirect("/login");
}

/** Whether anyone is signed in — used by the login page to skip the form. */
export async function isSignedIn(): Promise<boolean> {
  return (await getSession()) !== null;
}

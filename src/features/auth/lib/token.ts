import { isRole, type Role } from "./roles";

/**
 * SESSION TOKENS
 *
 * A signed, stateless session token: `base64url(payload).base64url(signature)`,
 * signed with HMAC-SHA256.
 *
 * Deliberate constraints:
 *   • Built on the Web Crypto API, not `node:crypto`, because this module is
 *     imported by the middleware, which runs on the Edge runtime. The same code
 *     therefore verifies a session in the middleware, in a server component and
 *     in a server action.
 *   • No new dependency. A JWT library would add a supply-chain surface for a
 *     format we can express correctly in a few dozen lines.
 *   • Stateless on purpose. There is no session table to read, which is exactly
 *     why every token carries its own expiry and why signing out clears the
 *     cookie. When PostgreSQL arrives, a revocation list belongs here — the
 *     seam is `verifyToken`, and nothing that calls it needs to change.
 *
 * The token is *signed*, not encrypted: it proves the payload came from us and
 * has not been altered. Nothing secret is ever put inside it.
 */

export const SESSION_COOKIE = "jms_session";

/** How long a session lasts before the operator must sign in again. */
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8; // one working day

export interface SessionPayload {
  /** Stable user id. */
  sub: string;
  email: string;
  name: string;
  role: Role;
  /** Issued-at and expiry, both epoch seconds. */
  iat: number;
  exp: number;
}

/* ------------------------------------------------------------ base64url */

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/* Returns an ArrayBuffer rather than a typed-array view: both consumers here
   (`crypto.subtle.verify` and `TextDecoder`) take a BufferSource, and a plain
   buffer sidesteps the view-over-SharedArrayBuffer type that `Uint8Array.from`
   is inferred as. */
function fromBase64Url(value: string): ArrayBuffer {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded.padEnd(Math.ceil(padded.length / 4) * 4, "="));

  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return buffer;
}

/* --------------------------------------------------------------- secret */

/**
 * The signing secret.
 *
 * Missing in production is a hard failure, not a warning: falling back to a
 * built-in value would mean every deployment of this code shares a secret, and
 * anyone who has read the source could mint themselves an admin session. Better
 * a deployment that refuses to start than one that is silently wide open.
 */
function readSecret(): string {
  const secret = process.env.AUTH_SECRET;

  if (secret && secret.length >= 32) return secret;

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "AUTH_SECRET is missing or shorter than 32 characters. Set it to a random value (see .env.example) before deploying — authentication is disabled without it.",
    );
  }

  // Development only, and only so a fresh clone runs without setup. Sessions
  // signed with this are worthless the moment a real secret is configured.
  return "development-only-insecure-secret-do-not-use-in-production";
}

async function signingKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(readSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

/* ---------------------------------------------------------------- sign */

export async function signToken(
  payload: Omit<SessionPayload, "iat" | "exp">,
): Promise<string> {
  const issuedAt = Math.floor(Date.now() / 1000);

  const body: SessionPayload = {
    ...payload,
    iat: issuedAt,
    exp: issuedAt + SESSION_MAX_AGE_SECONDS,
  };

  const encoded = toBase64Url(new TextEncoder().encode(JSON.stringify(body)));

  const signature = await crypto.subtle.sign(
    "HMAC",
    await signingKey(),
    new TextEncoder().encode(encoded),
  );

  return `${encoded}.${toBase64Url(new Uint8Array(signature))}`;
}

/* -------------------------------------------------------------- verify */

/**
 * Returns the payload of a valid, unexpired token, or null.
 *
 * Every failure — malformed, wrong signature, expired, unknown role — returns
 * null rather than throwing, because a caller's only sensible response to any
 * of them is the same: treat the request as signed out.
 */
export async function verifyToken(
  token: string | undefined,
): Promise<SessionPayload | null> {
  if (!token) return null;

  const separator = token.lastIndexOf(".");
  if (separator <= 0) return null;

  const encoded = token.slice(0, separator);
  const signature = token.slice(separator + 1);

  try {
    const valid = await crypto.subtle.verify(
      "HMAC",
      await signingKey(),
      // `crypto.subtle.verify` is constant-time, so this comparison does not
      // leak the signature a byte at a time the way `===` on strings would.
      fromBase64Url(signature),
      new TextEncoder().encode(encoded),
    );

    if (!valid) return null;

    const parsed: unknown = JSON.parse(
      new TextDecoder().decode(fromBase64Url(encoded)),
    );

    if (!isSessionPayload(parsed)) return null;
    if (parsed.exp <= Math.floor(Date.now() / 1000)) return null;

    return parsed;
  } catch {
    // Corrupt base64, corrupt JSON, or a secret that has since been rotated.
    return null;
  }
}

function isSessionPayload(value: unknown): value is SessionPayload {
  if (typeof value !== "object" || value === null) return false;

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.sub === "string" &&
    typeof candidate.email === "string" &&
    typeof candidate.name === "string" &&
    typeof candidate.iat === "number" &&
    typeof candidate.exp === "number" &&
    isRole(candidate.role)
  );
}

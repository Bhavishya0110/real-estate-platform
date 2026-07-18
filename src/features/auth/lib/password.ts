/**
 * PASSWORD HASHING
 *
 * PBKDF2-HMAC-SHA256, expressed through the Web Crypto API so it runs anywhere
 * the rest of the auth code does and adds no dependency.
 *
 * bcrypt or argon2 would be the stronger choice and are what a database-backed
 * user table should move to. PBKDF2 is the honest option available in the
 * platform itself: it is a recognised password KDF, it is correctly salted and
 * iterated here, and swapping it out later means changing this file only —
 * `verifyPassword` is the seam, and the stored format carries its own
 * parameters so old hashes stay verifiable through the change.
 *
 * Stored format:  pbkdf2.<iterations>.<salt>.<hash>   (both values base64url)
 *
 * The separator is a dot and the encoding is base64url — deliberately, not by
 * convention. The usual `$`-delimited, standard-base64 shape (`pbkdf2$210000$…`)
 * is silently destroyed when the hash is stored in an environment file: Next
 * runs env values through variable expansion, so `$210000` is read as a
 * reference to an undefined variable and vanishes. The result is a hash that
 * looks configured and can never match, and a login that fails with no
 * explanation. Choosing characters with no meaning to a shell or an expander
 * removes the whole class of problem rather than relying on whoever sets the
 * variable to escape it correctly.
 */

const ITERATIONS = 210_000; // OWASP's PBKDF2-SHA256 floor
const KEY_LENGTH = 32; // bytes
const SALT_LENGTH = 16; // bytes

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/* An ArrayBuffer, not a view — see the matching note in token.ts. */
function fromBase64(value: string): ArrayBuffer {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded.padEnd(Math.ceil(padded.length / 4) * 4, "="));

  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return buffer;
}

async function derive(
  password: string,
  salt: BufferSource,
  iterations: number,
): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );

  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
    key,
    KEY_LENGTH * 8,
  );

  return new Uint8Array(bits);
}

/** Hashes a password for storage. Each call produces a fresh salt. */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const hash = await derive(password, salt, ITERATIONS);

  return `pbkdf2.${ITERATIONS}.${toBase64(salt)}.${toBase64(hash)}`;
}

/**
 * Checks a password against a stored hash.
 *
 * Returns false for anything it cannot parse, so a malformed record in
 * configuration denies access rather than accidentally granting it.
 */
export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const parts = stored.split(".");
  if (parts.length !== 4 || parts[0] !== "pbkdf2") return false;

  const iterations = Number.parseInt(parts[1], 10);
  if (!Number.isFinite(iterations) || iterations < 1) return false;

  try {
    const salt = fromBase64(parts[2]);
    const expected = new Uint8Array(fromBase64(parts[3]));
    const actual = await derive(password, salt, iterations);

    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

/**
 * Compares two byte strings in time independent of where they first differ.
 *
 * A short-circuiting comparison leaks how much of a guess was correct, which is
 * enough to recover a hash one byte at a time.
 */
function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;

  let difference = 0;
  for (let index = 0; index < a.length; index += 1) {
    difference |= a[index] ^ b[index];
  }

  return difference === 0;
}

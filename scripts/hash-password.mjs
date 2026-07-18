/**
 * Generates a password hash for ADMIN_USERS.
 *
 *   npm run auth:hash -- 'the-password'
 *
 * Mirrors src/features/auth/lib/password.ts exactly — same algorithm, same
 * iteration count, same stored format — so a hash produced here verifies in the
 * app. If one changes, change both.
 */

const ITERATIONS = 210_000;
const KEY_LENGTH = 32;
const SALT_LENGTH = 16;

const password = process.argv[2];

if (!password) {
  console.error("Usage: npm run auth:hash -- 'the-password'");
  process.exit(1);
}

if (password.length < 12) {
  console.error(
    `Refusing to hash a ${password.length}-character password. Use at least 12 characters — this credential is the only thing standing in front of the control panel.`,
  );
  process.exit(1);
}

const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));

const key = await crypto.subtle.importKey(
  "raw",
  new TextEncoder().encode(password),
  "PBKDF2",
  false,
  ["deriveBits"],
);

const bits = await crypto.subtle.deriveBits(
  { name: "PBKDF2", salt, iterations: ITERATIONS, hash: "SHA-256" },
  key,
  KEY_LENGTH * 8,
);

// base64url and dot separators, so the value survives environment-file
// variable expansion untouched — see the note in src/features/auth/lib/password.ts.
const toBase64Url = (bytes) => Buffer.from(bytes).toString("base64url");

console.log(
  `pbkdf2.${ITERATIONS}.${toBase64Url(salt)}.${toBase64Url(new Uint8Array(bits))}`,
);

import "server-only";

import { createHash, randomUUID } from "node:crypto";
import { bucketDefinition, isPublicBucket, type BucketName } from "./buckets";
import { storageAdmin } from "./client";

/**
 * STORAGE OPERATIONS
 *
 * SERVER ONLY. Every write to Supabase Storage goes through here, so the rules
 * that matter — allowed types, size ceilings, path conventions, public vs
 * signed delivery — are enforced in one place rather than at each call site.
 *
 * The database stores metadata; this module moves the bytes. Nothing here
 * writes to `media_assets` — that is the media repository's job, so a failed
 * upload can never leave a row pointing at an object that does not exist.
 */

export { BUCKETS, type BucketName } from "./buckets";

/** How long a private asset's signed URL stays valid. */
const SIGNED_URL_TTL_SECONDS = 300;

export interface UploadInput {
  bucket: BucketName;
  /** Logical owner, e.g. a project id — becomes the path prefix. */
  entityId?: string;
  /** Sub-grouping within the entity, e.g. "gallery" or "floor-plans". */
  role?: string;
  fileName: string;
  contentType: string;
  body: Buffer | Uint8Array | ArrayBuffer | Blob;
}

export interface UploadResult {
  bucket: string;
  storagePath: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  checksumSha256: string;
  publicUrl: string | null;
}

/** Filesystem-safe, collision-free, and still readable in a bucket listing. */
function safeFileName(original: string): string {
  const dot = original.lastIndexOf(".");
  const stem = dot > 0 ? original.slice(0, dot) : original;
  const extension = dot > 0 ? original.slice(dot + 1).toLowerCase() : "";

  const slug =
    stem
      .normalize("NFKD")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "file";

  // A random prefix rather than a timestamp: two uploads in the same
  // millisecond must not collide, and replacing an asset must produce a new URL
  // so CDN caches are bypassed without cache-busting query strings.
  return extension ? `${randomUUID()}-${slug}.${extension}` : `${randomUUID()}-${slug}`;
}

/** `{entity}/{id}/{role}/{unique-name}` — see the approved storage strategy. */
export function buildStoragePath(input: {
  entityId?: string;
  role?: string;
  fileName: string;
}): string {
  const segments = [input.entityId, input.role]
    .filter((segment): segment is string => Boolean(segment && segment.trim()))
    .map((segment) => segment.replace(/[^a-zA-Z0-9._-]/g, "-"));

  return [...segments, safeFileName(input.fileName)].join("/");
}

function toBuffer(body: UploadInput["body"]): Buffer {
  if (Buffer.isBuffer(body)) return body;
  if (body instanceof Uint8Array) return Buffer.from(body);
  if (body instanceof ArrayBuffer) return Buffer.from(new Uint8Array(body));
  throw new TypeError("Unsupported upload body — pass a Buffer or Uint8Array.");
}

/**
 * Uploads an object after checking it against its bucket's declared rules.
 *
 * The MIME type is validated against the bucket rather than trusted, because
 * the browser supplies it and the browser can be lied to.
 */
export async function uploadObject(input: UploadInput): Promise<UploadResult> {
  const definition = bucketDefinition(input.bucket);
  if (!definition) {
    throw new Error(`Unknown storage bucket "${input.bucket}".`);
  }

  if (!definition.allowedMimeTypes.includes(input.contentType)) {
    throw new Error(
      `${input.contentType} is not permitted in the "${input.bucket}" bucket. Allowed: ${definition.allowedMimeTypes.join(", ")}.`,
    );
  }

  const buffer = toBuffer(input.body);

  if (buffer.byteLength > definition.fileSizeLimit) {
    const limitMb = Math.round(definition.fileSizeLimit / (1024 * 1024));
    throw new Error(
      `File is ${Math.round(buffer.byteLength / (1024 * 1024))} MB; the "${input.bucket}" bucket allows ${limitMb} MB.`,
    );
  }

  const storagePath = buildStoragePath(input);

  const { error } = await storageAdmin()
    .storage.from(input.bucket)
    .upload(storagePath, buffer, {
      contentType: input.contentType,
      // Never overwrite: paths are unique by construction, so a collision means
      // something is wrong and should surface rather than silently replace.
      upsert: false,
      cacheControl: isPublicBucket(input.bucket) ? "31536000" : "0",
    });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  return {
    bucket: input.bucket,
    storagePath,
    fileName: input.fileName,
    mimeType: input.contentType,
    sizeBytes: buffer.byteLength,
    checksumSha256: createHash("sha256").update(buffer).digest("hex"),
    publicUrl: isPublicBucket(input.bucket) ? publicUrl(input.bucket, storagePath) : null,
  };
}

/** Removes an object. Missing objects are not an error — the goal is absence. */
export async function deleteObject(bucket: string, storagePath: string): Promise<void> {
  const { error } = await storageAdmin().storage.from(bucket).remove([storagePath]);
  if (error && !/not found/i.test(error.message)) {
    throw new Error(`Delete failed: ${error.message}`);
  }
}

/** Replaces the bytes at an existing path, keeping the path stable. */
export async function replaceObject(
  bucket: string,
  storagePath: string,
  body: Buffer | Uint8Array,
  contentType: string,
): Promise<{ sizeBytes: number; checksumSha256: string }> {
  const buffer = toBuffer(body);

  const { error } = await storageAdmin()
    .storage.from(bucket)
    .upload(storagePath, buffer, { contentType, upsert: true });

  if (error) throw new Error(`Replace failed: ${error.message}`);

  return {
    sizeBytes: buffer.byteLength,
    checksumSha256: createHash("sha256").update(buffer).digest("hex"),
  };
}

/** The permanent CDN URL for an object in a public bucket. */
export function publicUrl(bucket: string, storagePath: string): string {
  return storageAdmin().storage.from(bucket).getPublicUrl(storagePath).data.publicUrl;
}

/**
 * A short-lived URL for a private object.
 *
 * The caller is responsible for authorising the request *before* asking for
 * this — a signed URL is a bearer token, and issuing one is the moment access
 * is actually granted.
 */
export async function signedUrl(
  bucket: string,
  storagePath: string,
  expiresInSeconds = SIGNED_URL_TTL_SECONDS,
): Promise<string> {
  const { data, error } = await storageAdmin()
    .storage.from(bucket)
    .createSignedUrl(storagePath, expiresInSeconds);

  if (error || !data) {
    throw new Error(`Could not sign URL: ${error?.message ?? "unknown error"}`);
  }
  return data.signedUrl;
}

/**
 * The URL to serve an asset from, choosing by bucket visibility.
 *
 * Callers should not have to remember which buckets are private — getting that
 * wrong means either a broken image or a leaked résumé.
 */
export async function resolveAssetUrl(
  bucket: string,
  storagePath: string,
): Promise<string> {
  return isPublicBucket(bucket) ? publicUrl(bucket, storagePath) : signedUrl(bucket, storagePath);
}

/**
 * A signed upload URL, so large files go browser → Storage directly.
 *
 * Routing a 500 MB walkthrough through a serverless function would hit its body
 * limit and its timeout; this keeps the bytes off our compute entirely.
 */
export async function createSignedUploadUrl(input: {
  bucket: BucketName;
  entityId?: string;
  role?: string;
  fileName: string;
}): Promise<{ uploadUrl: string; token: string; storagePath: string }> {
  const definition = bucketDefinition(input.bucket);
  if (!definition) throw new Error(`Unknown storage bucket "${input.bucket}".`);

  const storagePath = buildStoragePath(input);

  const { data, error } = await storageAdmin()
    .storage.from(input.bucket)
    .createSignedUploadUrl(storagePath);

  if (error || !data) {
    throw new Error(`Could not create upload URL: ${error?.message ?? "unknown error"}`);
  }

  return { uploadUrl: data.signedUrl, token: data.token, storagePath };
}

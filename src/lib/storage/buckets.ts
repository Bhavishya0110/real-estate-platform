import definitions from "./buckets.json";

/**
 * STORAGE BUCKETS
 *
 * The declarations themselves live in `buckets.json`, because the provisioning
 * script needs the same list and inert data is the one form both a TypeScript
 * module and a plain Node script can read without either parsing the other's
 * source. Types are applied here.
 *
 * `isPublic` is a security boundary, not a convention. A public bucket is
 * served straight from the CDN and is readable by anyone who guesses the URL —
 * so résumés, brochures and internal documents are private and reachable only
 * through a short-lived signed URL issued after an authorisation check.
 *
 * SVG is deliberately absent from every image bucket: it can carry script, and
 * an SVG served from our own origin is a stored-XSS vector.
 */

export interface BucketDefinition {
  /** Bucket name as created in Supabase Storage. */
  name: string;
  /** Public buckets are CDN-served; private ones require a signed URL. */
  isPublic: boolean;
  /** Upload ceiling in bytes — enforced by Supabase and re-checked by us. */
  fileSizeLimit: number;
  /** Allowed MIME types. Anything else is rejected before it is stored. */
  allowedMimeTypes: string[];
  /** What belongs here, for the media library UI. */
  description: string;
}

type MimeGroup = keyof typeof definitions.mimeGroups;

function resolveMimeTypes(bucket: {
  mimeGroups: string[];
  extraMimeTypes?: string[];
}): string[] {
  const fromGroups = bucket.mimeGroups.flatMap(
    (group) => definitions.mimeGroups[group as MimeGroup] ?? [],
  );
  return [...new Set([...fromGroups, ...(bucket.extraMimeTypes ?? [])])];
}

export const BUCKET_DEFINITIONS: BucketDefinition[] = definitions.buckets.map(
  (bucket) => ({
    name: bucket.name,
    isPublic: bucket.isPublic,
    fileSizeLimit: bucket.fileSizeLimit,
    allowedMimeTypes: resolveMimeTypes(bucket),
    description: bucket.description,
  }),
);

export const BUCKETS = {
  PROJECTS: "projects",
  GALLERY: "gallery",
  HOMEPAGE: "homepage",
  BLOGS: "blogs",
  BROCHURES: "brochures",
  FLOOR_PLANS: "floor-plans",
  MASTER_PLANS: "master-plans",
  VIDEOS: "videos",
  TOURS_360: "360",
  DOCUMENTS: "documents",
  AVATARS: "avatars",
  COMPANY: "company",
  TESTIMONIALS: "testimonials",
  CAREERS: "careers",
} as const;

export type BucketName = (typeof BUCKETS)[keyof typeof BUCKETS];

const BY_NAME = new Map(BUCKET_DEFINITIONS.map((b) => [b.name, b]));

export function bucketDefinition(name: string): BucketDefinition | undefined {
  return BY_NAME.get(name);
}

export function isPublicBucket(name: string): boolean {
  return BY_NAME.get(name)?.isPublic ?? false;
}

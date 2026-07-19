import "server-only";

import type {
  BlogPost,
  Job,
  Project,
  ProjectCategory,
  ProjectStatus,
  Testimonial,
} from "@/types";
import type { AdminUser } from "../types";

/**
 * DATABASE ROW → DOMAIN TYPE
 *
 * The one place that knows how a normalised row becomes the shape the UI has
 * always consumed. Nothing above this layer learns that `priceLabel` is now
 * computed, that amenities live in a join table, or that possession is a date
 * with a precision flag.
 *
 * Presentation strings are rebuilt here rather than stored, per the approved
 * design — except where an editorial override exists, which always wins because
 * the business wrote it deliberately.
 */

/* ------------------------------------------------------------ formatting -- */

/** Paise → "₹ 1.45 Cr onwards", matching the phrasing the site already uses. */
function formatPriceLabel(minor: bigint | null, onRequest: boolean): string {
  if (onRequest || minor === null) return "Price on request";

  const rupees = Number(minor) / 100;
  if (rupees >= 10000000) return `₹ ${(rupees / 10000000).toFixed(2)} Cr onwards`;
  if (rupees >= 100000) return `₹ ${Math.round(rupees / 100000)} L onwards`;
  return `₹ ${rupees.toLocaleString("en-IN")}`;
}

const AREA_UNIT_LABEL: Record<string, string> = {
  SQFT: "sq.ft.",
  SQM: "sq.m.",
  SQYD: "sq.yd.",
  ACRE: "acres",
};

/** 1180 / 1640 / SQFT → "1,180 – 1,640 sq.ft." (en-dash, as the copy uses). */
function formatAreaRange(
  min: unknown,
  max: unknown,
  unit: string,
): string {
  const low = min === null || min === undefined ? null : Number(min);
  const high = max === null || max === undefined ? null : Number(max);
  if (low === null && high === null) return "";

  const suffix = AREA_UNIT_LABEL[unit] ?? "sq.ft.";
  const format = (value: number) => value.toLocaleString("en-IN");

  if (low !== null && high !== null && low !== high) {
    return `${format(low)} – ${format(high)} ${suffix}`;
  }
  return `${format((low ?? high) as number)} ${suffix}`;
}

const MONTH_FORMAT = new Intl.DateTimeFormat("en-IN", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

/**
 * Rebuilds the possession phrasing.
 *
 * The override wins whenever it exists: six of the seeded projects describe
 * handover in words no date can express ("Ready for Fit-out", "Phase-wise from
 * 2026"), and inventing a month for them would misinform a buyer.
 */
function formatPossession(
  on: Date | null,
  precision: string,
  override: string | null,
): string {
  if (override) return override;
  if (!on) return "";

  if (precision === "YEAR") return String(on.getUTCFullYear());
  if (precision === "QUARTER") {
    return `Q${Math.floor(on.getUTCMonth() / 3) + 1} ${on.getUTCFullYear()}`;
  }
  if (precision === "DAY") {
    return new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(on);
  }
  return MONTH_FORMAT.format(on);
}

/* --------------------------------------------------------------- project -- */

/** Exactly the relations `toProject` needs — kept beside it so they cannot drift. */
export const PROJECT_INCLUDE = {
  category: true,
  projectStatus: true,
  location: true,
  highlights: { orderBy: { sortOrder: "asc" } },
  amenities: {
    orderBy: { sortOrder: "asc" },
    include: { amenity: true },
  },
  unitTypes: {
    orderBy: { sortOrder: "asc" },
    include: { configuration: true },
  },
  reraRegistrations: { where: { isActive: true }, take: 1 },
  virtualTours: { select: { id: true } },
  documents: { where: { kind: "BROCHURE" as const }, select: { id: true } },
  media: {
    where: { role: "HERO" as const },
    orderBy: { sortOrder: "asc" },
    take: 1,
    include: { media: true },
  },
} as const;

type ProjectRow = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string;
  displayLocality: string;
  priceFromMinor: bigint | null;
  priceOnRequest: boolean;
  priceLabelOverride: string | null;
  areaMin: unknown;
  areaMax: unknown;
  areaUnit: string;
  possessionOn: Date | null;
  possessionPrecision: string;
  possessionLabelOverride: string | null;
  isFeatured: boolean;
  category: { name: string };
  projectStatus: { name: string };
  location: { name: string } | null;
  highlights: { label: string }[];
  amenities: { amenity: { name: string } }[];
  unitTypes: { label: string | null; configuration: { name: string } }[];
  reraRegistrations: { registrationNumber: string }[];
  virtualTours: { id: string }[];
  documents: { id: string }[];
  media: { media: { bucket: string; storagePath: string } }[];
};

export function toProject(
  row: ProjectRow,
  heroUrl?: string | null,
): Project {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: row.category.name as ProjectCategory,
    status: row.projectStatus.name as ProjectStatus,
    tagline: row.tagline ?? "",
    description: row.description,
    location: row.displayLocality,
    city: row.location?.name ?? "Gurugram",
    priceLabel:
      row.priceLabelOverride ??
      formatPriceLabel(row.priceFromMinor, row.priceOnRequest),
    // The UI sorts and filters on rupees, as it always has.
    priceFrom: row.priceFromMinor === null ? 0 : Number(row.priceFromMinor) / 100,
    configurations: row.unitTypes.map((u) => u.label ?? u.configuration.name),
    areaRange: formatAreaRange(row.areaMin, row.areaMax, row.areaUnit),
    possession: formatPossession(
      row.possessionOn,
      row.possessionPrecision,
      row.possessionLabelOverride,
    ),
    reraId: row.reraRegistrations[0]?.registrationNumber ?? "",
    amenities: row.amenities.map((a) => a.amenity.name),
    highlights: row.highlights.map((h) => h.label),
    // Existence of a row, not a stored boolean — per the approved design.
    hasVirtualTour: row.virtualTours.length > 0,
    hasBrochure: row.documents.length > 0,
    featured: row.isFeatured,
    ...(heroUrl ? { image: heroUrl } : {}),
  };
}

/* ------------------------------------------------------------------ blog -- */

export const BLOG_INCLUDE = { author: true, category: true } as const;

export function toBlogPost(row: {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: unknown;
  readTimeMinutes: number | null;
  publishedAt: Date | null;
  createdAt: Date;
  author: { name: string } | null;
  category: { name: string } | null;
}): BlogPost {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    category: row.category?.name ?? "Insights",
    author: row.author?.name ?? "JMS Group",
    // Date-only, matching the original JSON, so formatDate keeps rendering the
    // same string on the server and in the browser.
    publishedAt: (row.publishedAt ?? row.createdAt).toISOString().slice(0, 10),
    readTimeMinutes: row.readTimeMinutes ?? 5,
    content: Array.isArray(row.content)
      ? (row.content as BlogPost["content"])
      : [],
  };
}

/* ------------------------------------------------------------------- job -- */

export const JOB_INCLUDE = { department: true } as const;

export function toJob(row: {
  id: string;
  slug: string;
  title: string;
  employmentType: string;
  locationText: string;
  experienceLabel: string | null;
  summary: string;
  responsibilities: string[];
  requirements: string[];
  department: { name: string } | null;
}): Job {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    department: row.department?.name ?? "General",
    type: row.employmentType as Job["type"],
    location: row.locationText,
    experience: row.experienceLabel ?? "",
    summary: row.summary,
    responsibilities: row.responsibilities,
    requirements: row.requirements,
  };
}

/* ----------------------------------------------------------- testimonial -- */

export const TESTIMONIAL_INCLUDE = { project: true } as const;

/** Initials are derived, not stored — the same two letters, computed once. */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1][0] ?? "") : "";
  return (first + last).toUpperCase();
}

export function toTestimonial(row: {
  id: string;
  authorName: string;
  authorRole: string | null;
  rating: number;
  quote: string;
  isVideo: boolean;
  project: { name: string } | null;
}): Testimonial {
  return {
    id: row.id,
    name: row.authorName,
    role: row.authorRole ?? "",
    projectName: row.project?.name ?? "",
    rating: row.rating,
    quote: row.quote,
    type: row.isVideo ? "video" : "text",
    avatarInitials: initials(row.authorName),
  };
}

/* ------------------------------------------------------------------ user -- */

export function toAdminUser(row: {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  roles: { role: { slug: string } }[];
}): AdminUser {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    // A user may hold several roles; the highest-ranked one is what the session
    // carries, and the ordering is applied by the query.
    role: (row.roles[0]?.role.slug ?? "viewer") as AdminUser["role"],
    createdAt: row.createdAt.toISOString(),
  };
}

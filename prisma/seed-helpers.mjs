/**
 * Transformations from the seeded JSON into the database's typed columns.
 *
 * These carry the interesting part of the migration: today's JSON stores
 * *renderings* ("₹ 1.45 Cr onwards", "1,180 – 1,640 sq.ft.", "December 2027")
 * and the database stores the facts underneath them. Each function here is one
 * of those conversions, kept separate so it can be reasoned about and — when
 * the numbers matter — checked.
 */

/** Rupees → paise. Money is integer minor units everywhere below this line. */
export function toMinor(rupees) {
  if (rupees === null || rupees === undefined) return null;
  return BigInt(Math.round(Number(rupees) * 100));
}

const MONTHS = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
  july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
};

/**
 * "December 2027" → { on: 2027-12-01, precision: MONTH }
 * "Q4 2027"       → { on: 2027-10-01, precision: QUARTER }
 * "2027"          → { on: 2027-01-01, precision: YEAR }
 * "Ready"/""      → { on: null,       precision: MONTH }
 *
 * A sortable date plus a record of how precisely it is actually known, so the
 * UI can re-render the original phrasing while the database can still filter
 * and order by it.
 */
export function parsePossession(raw) {
  const text = String(raw ?? "").trim();
  if (!text) return { on: null, precision: "MONTH" };

  const monthYear = text.match(/^([A-Za-z]+)\s+(\d{4})$/);
  if (monthYear) {
    const month = MONTHS[monthYear[1].toLowerCase()];
    if (month) {
      return {
        on: new Date(Date.UTC(Number(monthYear[2]), month - 1, 1)),
        precision: "MONTH",
      };
    }
  }

  const quarter = text.match(/^Q([1-4])\s*[- ]?\s*(\d{4})$/i);
  if (quarter) {
    return {
      on: new Date(Date.UTC(Number(quarter[2]), (Number(quarter[1]) - 1) * 3, 1)),
      precision: "QUARTER",
    };
  }

  const year = text.match(/^(\d{4})$/);
  if (year) {
    return { on: new Date(Date.UTC(Number(year[1]), 0, 1)), precision: "YEAR" };
  }

  // "Ready to move", "On request" and anything else unparseable: keep the
  // project, lose only the sortable date. Guessing one would be worse.
  return { on: null, precision: "MONTH" };
}

/**
 * "1,180 – 1,640 sq.ft." → { min: 1180, max: 1640, unit: SQFT }
 *
 * Handles the en-dash the copy actually uses, plain hyphens, and a single
 * value with no range.
 */
export function parseAreaRange(raw) {
  const text = String(raw ?? "").trim();
  if (!text) return { min: null, max: null, unit: "SQFT" };

  const unit = /sq\.?\s*m/i.test(text)
    ? "SQM"
    : /sq\.?\s*yd|sq\.?\s*yard/i.test(text)
      ? "SQYD"
      : /acre/i.test(text)
        ? "ACRE"
        : "SQFT";

  const numbers = text
    .replace(/,/g, "")
    .match(/\d+(?:\.\d+)?/g);

  if (!numbers || numbers.length === 0) return { min: null, max: null, unit };

  const values = numbers.map(Number).filter((n) => Number.isFinite(n));
  if (values.length === 0) return { min: null, max: null, unit };

  return {
    min: values[0],
    max: values.length > 1 ? values[values.length - 1] : values[0],
    unit,
  };
}

/**
 * "2 BHK" → { slug: "2-bhk", name: "2 BHK", bedrooms: 2, isCommercial: false }
 * "Retail Shop" → { slug: "retail-shop", …, bedrooms: null, isCommercial: true }
 *
 * Replaces the /(\d+)\s*BHK/i regex the client-side filter runs on every
 * project on every keystroke.
 */
export function parseConfiguration(raw) {
  const name = String(raw ?? "").trim();
  const bhk = name.match(/(\d+)\s*BHK/i);
  const commercial = /shop|retail|office|showroom|sco|food court|anchor/i.test(name);

  return {
    slug: slugify(name),
    name,
    bedrooms: bhk ? Number(bhk[1]) : null,
    isCommercial: Boolean(commercial),
  };
}

export function slugify(value) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

/**
 * "+91 96102 11822" / "9610211822" → "+919610211822"
 *
 * The dedup key for `contacts`. Two rows that are the same person must
 * normalise to the same string, or the CRM is just a list again.
 */
export function normalizePhone(raw, defaultCountry = "91") {
  const text = String(raw ?? "").trim();
  if (!text) return null;

  const hasPlus = text.startsWith("+");
  const digits = text.replace(/\D/g, "");
  if (!digits) return null;

  if (hasPlus) return `+${digits}`;
  // A bare 10-digit Indian mobile gets the country code it implies.
  if (digits.length === 10) return `+${defaultCountry}${digits}`;
  if (digits.length > 10 && digits.startsWith(defaultCountry)) return `+${digits}`;
  return `+${digits}`;
}

/** Flattens the blog's section array into one string for the search index. */
export function flattenArticle(sections) {
  if (!Array.isArray(sections)) return "";
  return sections
    .map((section) => `${section.heading ?? ""} ${section.body ?? ""}`)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Human-quotable identifiers: LEAD-2026-000123. */
export function reference(prefix, sequence, year = new Date().getUTCFullYear()) {
  return `${prefix}-${year}-${String(sequence).padStart(6, "0")}`;
}

/** Splits "Rohan & Aditi Deshpande" into first/last without being clever. */
export function splitName(fullName) {
  const parts = String(fullName ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: null, lastName: null };
  if (parts.length === 1) return { firstName: parts[0], lastName: null };
  return {
    firstName: parts.slice(0, -1).join(" "),
    lastName: parts[parts.length - 1],
  };
}

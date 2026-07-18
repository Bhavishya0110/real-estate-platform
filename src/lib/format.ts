/** Presentation-only formatters. Kept free of domain logic so they stay reusable. */

const INR = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

/** Full rupee amount, e.g. ₹1,23,456. */
export function formatCurrency(value: number): string {
  return INR.format(Math.round(value));
}

/** Compact Indian rupee band, e.g. ₹1.45 Cr / ₹98 L. */
export function formatCompactCurrency(value: number): string {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`;
  if (value >= 100000) return `₹${Math.round(value / 100000)} L`;
  return formatCurrency(value);
}

/** Grouped number without a currency symbol, e.g. 4,200. */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-IN").format(value);
}

const DATE = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "long",
  year: "numeric",
  /* Pinned to UTC on purpose.
     A date-only string like "2026-06-28" is parsed as UTC midnight, so a
     browser west of Greenwich renders the *previous* day while the server
     renders the intended one — a hydration mismatch on every dated card. These
     are editorial publish dates, not moments in the reader's day, so rendering
     them identically everywhere is both correct and stable. */
  timeZone: "UTC",
});

/** e.g. "28 June 2026". Stable across server and client. */
export function formatDate(iso: string): string {
  const date = new Date(iso);
  // Never render "Invalid Date" to a visitor.
  return Number.isNaN(date.getTime()) ? "" : DATE.format(date);
}

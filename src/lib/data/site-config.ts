import navigationJson from "@/data/navigation.json";
import siteJson from "@/data/site.json";
import type { NavLink, SiteConfig } from "@/types";

/**
 * STATIC SITE CONFIGURATION — client-safe.
 *
 * Deliberately separate from `data/content.ts`. That module now reaches the
 * repository layer, which reaches Prisma, which is `server-only`; anything a
 * client component imports from it would drag the database client into the
 * browser bundle and fail the build.
 *
 * Branding and menus are read by client components (the navbar, the global
 * error boundary) and in module scope during metadata generation, so they live
 * here as plain constants with no dependencies beyond the JSON itself.
 *
 * These values are also seeded into `site_settings`, `navigation_menus` and
 * `social_links`, and `siteConfigRepository` reads them from there for server
 * callers. The switch belongs with the CMS module that makes them editable.
 */

export const siteConfig = siteJson as SiteConfig;

export const navigation = navigationJson as {
  main: NavLink[];
  explore: NavLink[];
  company: NavLink[];
};

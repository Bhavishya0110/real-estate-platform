import projectsJson from "@/data/projects.json";
import type { Project, ProjectCategory } from "@/types";

/**
 * PROJECT REPOSITORY
 *
 * The only module in the app that knows where project data physically lives.
 * Today: a local JSON file. Tomorrow: `prisma.project.findMany(...)`.
 *
 * Every function is async on purpose — callers already `await`, so swapping the
 * body for a database query is a one-file change with zero UI churn.
 */

const projects = projectsJson as Project[];

/**
 * The business splits the portfolio two ways for navigation: everything people
 * live in, and everything people trade from. Plots, senior living and luxury all
 * belong on the residential side, so the rule lives here — in the repository —
 * rather than being re-derived by each page.
 */
const RESIDENTIAL_CATEGORIES: ProjectCategory[] = [
  "Residential",
  "Plots",
  "Senior Living",
  "Luxury",
];

export async function getProjects(): Promise<Project[]> {
  return projects;
}

export async function getFeaturedProjects(limit = 6): Promise<Project[]> {
  const featured = projects.filter((project) => project.featured);
  // Fall back to the newest projects so the grid is never short of `limit`.
  const filler = projects.filter((project) => !project.featured);
  return [...featured, ...filler].slice(0, limit);
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  return projects.find((project) => project.slug === slug) ?? null;
}

/** Everything a buyer would live in — BRD §5 "Residential portfolio". */
export async function getResidentialProjects(): Promise<Project[]> {
  return projects.filter((project) =>
    RESIDENTIAL_CATEGORIES.includes(project.category),
  );
}

/** Everything an investor would let or trade from — BRD §5 "Commercial". */
export async function getCommercialProjects(): Promise<Project[]> {
  return projects.filter((project) => project.category === "Commercial");
}

/**
 * Projects to show at the foot of a detail page: same category first, then
 * anything else, never the project you are already looking at.
 */
export async function getRelatedProjects(
  slug: string,
  limit = 3,
): Promise<Project[]> {
  const current = projects.find((project) => project.slug === slug);
  if (!current) return projects.slice(0, limit);

  const others = projects.filter((project) => project.slug !== slug);
  const sameCategory = others.filter(
    (project) => project.category === current.category,
  );
  const rest = others.filter((project) => project.category !== current.category);

  return [...sameCategory, ...rest].slice(0, limit);
}

/** Distinct categories present in the portfolio, for filter tabs. */
export async function getProjectCategories(): Promise<ProjectCategory[]> {
  return [...new Set(projects.map((project) => project.category))];
}

export async function getProjectCount(): Promise<number> {
  return projects.length;
}

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

export async function getProjectsByCategory(
  category: ProjectCategory,
): Promise<Project[]> {
  return projects.filter((project) => project.category === category);
}

/** Distinct categories present in the portfolio, for filter tabs. */
export async function getProjectCategories(): Promise<ProjectCategory[]> {
  return [...new Set(projects.map((project) => project.category))];
}

export async function getProjectCount(): Promise<number> {
  return projects.length;
}

import { projectRepository } from "@/lib/repositories";
import type { Project, ProjectCategory } from "@/types";

/**
 * PROJECT READ API
 *
 * The signatures below are unchanged from the JSON era on purpose — every page
 * and component that calls them is untouched by the PostgreSQL migration.
 *
 * What changed is one level down: this module no longer knows where projects
 * live. It delegates to whichever `ProjectReadRepository` the composition root
 * selected, which is the seam the original comment here promised:
 * "Today: a local JSON file. Tomorrow: prisma.project.findMany(...)".
 */

export async function getProjects(): Promise<Project[]> {
  return projectRepository.findAll();
}

export async function getFeaturedProjects(limit = 6): Promise<Project[]> {
  return projectRepository.findFeatured(limit);
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  return projectRepository.findBySlug(slug);
}

/** Everything a buyer would live in — BRD §5 "Residential portfolio". */
export async function getResidentialProjects(): Promise<Project[]> {
  return projectRepository.findResidential();
}

/** Everything an investor would let or trade from — BRD §5 "Commercial". */
export async function getCommercialProjects(): Promise<Project[]> {
  return projectRepository.findCommercial();
}

/**
 * Projects to show at the foot of a detail page: same category first, then
 * anything else, never the project you are already looking at.
 */
export async function getRelatedProjects(
  slug: string,
  limit = 3,
): Promise<Project[]> {
  return projectRepository.findRelated(slug, limit);
}

/** Distinct categories present in the portfolio, for filter tabs. */
export async function getProjectCategories(): Promise<ProjectCategory[]> {
  return projectRepository.categories();
}

export async function getProjectCount(): Promise<number> {
  return projectRepository.count();
}

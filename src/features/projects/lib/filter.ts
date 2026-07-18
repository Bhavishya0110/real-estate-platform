import type { Project, ProjectCategory } from "@/types";

/**
 * Pure filtering + sorting for the portfolio.
 *
 * Deliberately free of React and of the data source: the listing pages, the
 * hero search and (later) the database-backed queries all agree on this one
 * definition of what a filter means. Phase 3 extends this module rather than
 * scattering new predicates through components.
 */

export const ANY = "any";

export interface ProjectFilters {
  /** A category name, or ANY for no category constraint. */
  category: ProjectCategory | typeof ANY;
  /** City name, or ANY. */
  city: string | typeof ANY;
  /** Inclusive upper bound on `priceFrom`, or ANY. */
  budget: number | typeof ANY;
  /** "2" | "3" | "4" (4 means 4 or more), or ANY. */
  bhk: string | typeof ANY;
  /** Free-text search. Empty string means no text constraint. */
  query: string;
  /** Project status, or ANY. */
  status: string | typeof ANY;
}

export const EMPTY_FILTERS: ProjectFilters = {
  category: ANY,
  city: ANY,
  budget: ANY,
  bhk: ANY,
  query: "",
  status: ANY,
};

export type SortKey = "featured" | "price-asc" | "price-desc" | "name";

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "featured", label: "Featured first" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "name", label: "Name: A to Z" },
];

/** A configuration matches when it names the requested BHK ("4" means 4+). */
function matchesBhk(project: Project, bhk: string): boolean {
  const wanted = Number(bhk);
  if (!Number.isFinite(wanted)) return true;

  return project.configurations.some((configuration) => {
    const found = configuration.match(/(\d+)\s*BHK/i);
    if (!found) return false;
    const value = Number(found[1]);
    return wanted >= 4 ? value >= 4 : value === wanted;
  });
}

/**
 * Free-text search across the fields a buyer would actually type: the project
 * name, its pitch, where it is, what type it is, and what it has.
 *
 * Every whitespace-separated term must match somewhere (AND), so "retail baner"
 * narrows rather than widens. Deliberately simple and dependency-free — the
 * corpus is fourteen records, so an index would be over-engineering.
 */
export function matchesQuery(project: Project, query: string): boolean {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return true;

  const haystack = [
    project.name,
    project.tagline,
    project.description,
    project.category,
    project.status,
    project.location,
    project.city,
    project.priceLabel,
    project.possession,
    ...project.configurations,
    ...project.amenities,
    ...project.highlights,
  ]
    .join(" ")
    .toLowerCase();

  return terms.every((term) => haystack.includes(term));
}

export function applyFilters(
  projects: Project[],
  filters: ProjectFilters,
): Project[] {
  return projects.filter((project) => {
    if (filters.category !== ANY && project.category !== filters.category) {
      return false;
    }
    if (filters.city !== ANY && project.city !== filters.city) {
      return false;
    }
    if (filters.budget !== ANY && project.priceFrom > filters.budget) {
      return false;
    }
    if (filters.bhk !== ANY && !matchesBhk(project, filters.bhk)) {
      return false;
    }
    if (filters.status !== ANY && project.status !== filters.status) {
      return false;
    }
    if (filters.query && !matchesQuery(project, filters.query)) {
      return false;
    }
    return true;
  });
}

export function sortProjects(projects: Project[], sort: SortKey): Project[] {
  const sorted = [...projects];

  switch (sort) {
    case "price-asc":
      return sorted.sort((a, b) => a.priceFrom - b.priceFrom);
    case "price-desc":
      return sorted.sort((a, b) => b.priceFrom - a.priceFrom);
    case "name":
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case "featured":
    default:
      return sorted.sort((a, b) => Number(b.featured) - Number(a.featured));
  }
}

/**
 * Reads filters out of a URL query object — the contract the homepage hero
 * search posts to (`/projects?type=…&bhk=…&budget=…&city=…`).
 */
export function filtersFromQuery(
  query: Record<string, string | string[] | undefined>,
): ProjectFilters {
  const read = (key: string) => {
    const value = query[key];
    const single = Array.isArray(value) ? value[0] : value;
    return single && single !== ANY ? single : ANY;
  };

  const budget = read("budget");
  const parsedBudget = budget === ANY ? ANY : Number(budget);
  const searchTerm = read("q");

  return {
    category: read("type") as ProjectFilters["category"],
    city: read("city"),
    budget:
      parsedBudget === ANY || !Number.isFinite(parsedBudget) ? ANY : parsedBudget,
    bhk: read("bhk"),
    query: searchTerm === ANY ? "" : searchTerm,
    status: read("status"),
  };
}

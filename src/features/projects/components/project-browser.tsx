"use client";

import { useMemo, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProjectCard } from "@/features/projects/components/project-card";
import {
  ANY,
  applyFilters,
  sortProjects,
  SORT_OPTIONS,
  type ProjectFilters,
  type SortKey,
} from "@/features/projects/lib/filter";
import { formatCompactCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Project, ProjectCategory } from "@/types";

/**
 * The shared portfolio browser used by /projects, /residential and /commercial.
 *
 * Server pages fetch the right slice of the portfolio from the repository and
 * hand it here; this component owns only presentation and local filter state,
 * so it works unchanged once the data comes from Prisma.
 *
 * Filters arrive pre-seeded from the homepage hero search
 * (`/projects?type=…&bhk=…&budget=…&city=…`) and can be cleared individually.
 */
export function ProjectBrowser({
  projects,
  categories,
  initialFilters,
  className,
}: {
  projects: Project[];
  /** Category tabs to offer. Omit or pass one category to hide the tab row. */
  categories?: ProjectCategory[];
  initialFilters: ProjectFilters;
  className?: string;
}) {
  const [filters, setFilters] = useState<ProjectFilters>(initialFilters);
  const [sort, setSort] = useState<SortKey>("featured");

  const visible = useMemo(
    () => sortProjects(applyFilters(projects, filters), sort),
    [projects, filters, sort],
  );

  const showTabs = (categories?.length ?? 0) > 1;

  /** Chips for the filters that came from the hero search. */
  const chips = [
    filters.city !== ANY
      ? { key: "city" as const, label: filters.city as string }
      : null,
    filters.budget !== ANY
      ? {
          key: "budget" as const,
          label: `Under ${formatCompactCurrency(filters.budget as number)}`,
        }
      : null,
    filters.bhk !== ANY
      ? {
          key: "bhk" as const,
          label: filters.bhk === "4" ? "4 BHK+" : `${filters.bhk} BHK`,
        }
      : null,
  ].filter(Boolean) as { key: keyof ProjectFilters; label: string }[];

  function clearChip(key: keyof ProjectFilters) {
    setFilters((current) => ({ ...current, [key]: ANY }));
  }

  function clearAll() {
    setFilters({ category: ANY, city: ANY, budget: ANY, bhk: ANY });
  }

  return (
    <div className={className}>
      {/* --- Toolbar ------------------------------------------------------ */}
      <div className="flex flex-col gap-5 border-b border-border pb-6">
        {showTabs ? (
          <div
            role="tablist"
            aria-label="Filter by category"
            className="flex flex-wrap gap-2"
          >
            <CategoryTab
              active={filters.category === ANY}
              onClick={() =>
                setFilters((current) => ({ ...current, category: ANY }))
              }
            >
              All
            </CategoryTab>

            {categories?.map((category) => (
              <CategoryTab
                key={category}
                active={filters.category === category}
                onClick={() =>
                  setFilters((current) => ({ ...current, category }))
                }
              >
                {category}
              </CategoryTab>
            ))}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground" aria-live="polite">
            Showing{" "}
            <span className="font-semibold text-navy-900">{visible.length}</span>{" "}
            of {projects.length} projects
          </p>

          <label className="flex items-center gap-2 text-sm">
            <SlidersHorizontal
              className="size-4 text-gold-600"
              aria-hidden="true"
            />
            <span className="sr-only sm:not-sr-only sm:text-muted-foreground">
              Sort by
            </span>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as SortKey)}
              className="h-10 rounded-sm border border-border bg-white px-3 text-sm text-navy-900 focus:border-gold-500 focus:outline-none"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* --- Active filter chips ---------------------------------------- */}
        {chips.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="eyebrow text-muted-foreground">Filters</span>

            {chips.map((chip) => (
              <button
                key={chip.key}
                type="button"
                onClick={() => clearChip(chip.key)}
                className="inline-flex items-center gap-1.5 rounded-sm border border-navy-900/15 bg-navy-50 px-3 py-1.5 text-xs text-navy-800 transition-colors hover:border-gold-500 hover:bg-white"
              >
                {chip.label}
                <X className="size-3" aria-hidden="true" />
                <span className="sr-only">Remove filter</span>
              </button>
            ))}

            <button
              type="button"
              onClick={clearAll}
              className="text-xs font-medium text-gold-600 underline-offset-4 hover:underline"
            >
              Clear all
            </button>
          </div>
        ) : null}
      </div>

      {/* --- Results ------------------------------------------------------- */}
      {visible.length > 0 ? (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3">
          {visible.map((project, index) => (
            <ProjectCard
              key={project.id}
              project={project}
              priority={index < 3}
            />
          ))}
        </div>
      ) : (
        <div className="mt-12 rounded-sm border border-dashed border-border bg-navy-50 p-10 text-center sm:p-16">
          <h2 className="font-display text-xl text-navy-900 sm:text-2xl">
            Nothing matches that combination — yet.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
            Try widening the budget or clearing a filter. Our advisors can also
            tell you what is releasing next in this bracket.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button onClick={clearAll} variant="primary" size="md">
              Clear all filters
            </Button>
            <Button href="/contact" variant="outline" size="md">
              Ask an advisor
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function CategoryTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "h-11 rounded-sm border px-4 text-sm font-medium tracking-wide transition-all duration-200 sm:px-5",
        active
          ? "border-navy-900 bg-navy-900 text-white"
          : "border-border bg-white text-navy-700 hover:border-navy-900/40 hover:bg-navy-50",
      )}
    >
      {children}
    </button>
  );
}

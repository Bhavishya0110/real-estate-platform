"use client";

import { useMemo, useState } from "react";
import { ProjectCard } from "@/features/projects/components/project-card";
import { cn } from "@/lib/utils";
import type { Project } from "@/types";

/** Tabs required by the BRD blueprint. "All" is the default. */
const TABS = ["All", "Residential", "Commercial"] as const;
type Tab = (typeof TABS)[number];

const VISIBLE = 6;

export function FeaturedProjectsGrid({
  projects,
  className,
}: {
  projects: Project[];
  className?: string;
}) {
  const [tab, setTab] = useState<Tab>("All");

  const visible = useMemo(() => {
    const matches =
      tab === "All"
        ? projects
        : projects.filter((project) => project.category === tab);

    // Featured projects float to the top of every tab.
    return [...matches]
      .sort((a, b) => Number(b.featured) - Number(a.featured))
      .slice(0, VISIBLE);
  }, [projects, tab]);

  return (
    <div className={className}>
      {/* --- Filter tabs -------------------------------------------------- */}
      <div role="tablist" aria-label="Filter projects" className="flex flex-wrap gap-2">
        {TABS.map((option) => {
          const active = option === tab;

          return (
            <button
              key={option}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(option)}
              className={cn(
                "h-11 rounded-sm border px-4 text-sm font-medium tracking-wide transition-all duration-200 sm:px-5",
                active
                  ? "border-navy-900 bg-navy-900 text-white"
                  : "border-border bg-white text-navy-700 hover:border-navy-900/40 hover:bg-navy-50",
              )}
            >
              {option}
            </button>
          );
        })}
      </div>

      {/* --- Grid ---------------------------------------------------------- */}
      <div className="mt-8 grid gap-6 sm:grid-cols-2 sm:gap-8 lg:mt-10 lg:grid-cols-3">
        {visible.map((project, index) => (
          <ProjectCard
            key={project.id}
            project={project}
            priority={index < 3}
          />
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="mt-10 text-center text-sm text-muted-foreground">
          No projects in this category yet. Check back soon.
        </p>
      ) : null}
    </div>
  );
}

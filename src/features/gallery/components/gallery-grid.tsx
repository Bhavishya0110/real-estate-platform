"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { ProjectMedia } from "@/components/common/project-media";
import { cn } from "@/lib/utils";
import type { Project } from "@/types";

/**
 * BRD §5 Gallery — "Display images, display videos, categorise media".
 *
 * A CSS-columns masonry of the portfolio, filterable by category. Real
 * photography drops into <ProjectMedia> unchanged; until it arrives the branded
 * architectural motif renders instead of grey placeholders.
 */

const TABS = ["All", "Residential", "Commercial", "Plots"] as const;
type Tab = (typeof TABS)[number];

/** Alternating aspect ratios give the masonry its cadence. */
const RATIOS = ["aspect-4/5", "aspect-square", "aspect-3/4"];

export function GalleryGrid({ projects }: { projects: Project[] }) {
  const [tab, setTab] = useState<Tab>("All");

  const visible = useMemo(
    () =>
      tab === "All"
        ? projects
        : projects.filter((project) => project.category === tab),
    [projects, tab],
  );

  return (
    <div>
      {/* --- Category tabs ------------------------------------------------ */}
      <div
        role="group"
        aria-label="Filter gallery"
        className="flex flex-wrap gap-2"
      >
        {TABS.map((option) => {
          const active = option === tab;

          return (
            <button
              key={option}
              type="button"
              aria-pressed={active}
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

      <p className="mt-6 text-sm text-muted-foreground" aria-live="polite">
        Showing{" "}
        <span className="font-semibold text-navy-900">{visible.length}</span>{" "}
        {visible.length === 1 ? "project" : "projects"}
      </p>

      {/* --- Masonry ------------------------------------------------------- */}
      {visible.length > 0 ? (
        <div className="mt-8 columns-1 gap-4 sm:columns-2 sm:gap-5 lg:columns-3">
          {visible.map((project, index) => (
            <Link
              key={project.id}
              href={`/projects/${project.slug}`}
              className="group mb-4 block break-inside-avoid overflow-hidden rounded-sm border border-border transition-shadow duration-300 hover:shadow-luxe-lg sm:mb-5"
            >
              <div
                className={cn(
                  "relative overflow-hidden",
                  RATIOS[index % RATIOS.length],
                )}
              >
                <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-105">
                  <ProjectMedia project={project} priority={index < 3} />
                </div>

                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-navy-950/85 via-navy-950/10 to-transparent"
                />

                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5">
                  <div className="min-w-0">
                    <p className="eyebrow text-gold-500">{project.category}</p>
                    <p className="mt-1.5 font-display text-lg text-white sm:text-xl">
                      {project.name}
                    </p>
                  </div>

                  <span
                    aria-hidden="true"
                    className="flex size-9 shrink-0 items-center justify-center rounded-full border border-white/30 text-white transition-colors duration-300 group-hover:border-gold-500 group-hover:bg-gold-500 group-hover:text-navy-900"
                  >
                    <ArrowUpRight className="size-4" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <p className="mt-10 rounded-sm border border-dashed border-border bg-navy-50 p-10 text-center text-sm text-muted-foreground">
          No media in this category yet. Check back soon.
        </p>
      )}
    </div>
  );
}

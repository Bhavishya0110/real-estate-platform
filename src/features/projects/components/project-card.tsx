import Link from "next/link";
import { ArrowUpRight, MapPin, Maximize2 } from "lucide-react";
import { ProjectMedia } from "@/components/common/project-media";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { CompareButton } from "@/features/compare/components/compare-button";
import { FavoriteButton } from "@/features/favorites/components/favorite-button";
import { cn } from "@/lib/utils";
import type { Project } from "@/types";

/**
 * The portfolio's primary card. Used by the Home featured grid, /projects,
 * /residential and /commercial — so it must stay presentational and prop-driven.
 */
export function ProjectCard({
  project,
  priority = false,
  className,
}: {
  project: Project;
  priority?: boolean;
  className?: string;
}) {
  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-sm border border-border bg-white",
        "transition-all duration-500 hover:-translate-y-1 hover:border-gold-500/40 hover:shadow-luxe-lg",
        className,
      )}
    >
      {/* --- Media ------------------------------------------------------- */}
      <div className="relative aspect-4/3 overflow-hidden">
        <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-105">
          <ProjectMedia project={project} priority={priority} />
        </div>

        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3 sm:p-4">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={project.status} />
            {project.hasVirtualTour ? (
              <Badge variant="outline" className="gap-1">
                <Maximize2 className="size-3" aria-hidden="true" />
                360° Tour
              </Badge>
            ) : null}
          </div>

          {/* The only interactive parts of this otherwise-server card. */}
          <div className="flex shrink-0 items-center gap-2">
            <CompareButton slug={project.slug} name={project.name} />
            <FavoriteButton slug={project.slug} name={project.name} />
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 p-4 transition-transform duration-500 group-hover:-translate-y-1 sm:p-5">
          <p className="font-display text-base text-white/90 italic sm:text-lg">
            {project.tagline}
          </p>
        </div>
      </div>

      {/* --- Body --------------------------------------------------------- */}
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        {/* Wraps rather than squeezing "Residential" against "2 BHK · 3 BHK". */}
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <span className="eyebrow text-gold-600">{project.category}</span>
          <span className="text-xs text-muted-foreground">
            {project.configurations.join(" · ")}
          </span>
        </div>

        <h3 className="mt-2 text-xl text-navy-900 sm:text-2xl">
          {/* Stretched link: the whole card is clickable, but only one link is
              exposed to assistive tech and the keyboard. */}
          <Link
            href={`/projects/${project.slug}`}
            /* Gold underline wipes in on hover. No `relative` here on purpose:
               the ::after stretches to the card (the nearest positioned
               ancestor), which is what makes the whole card clickable. */
            className={cn(
              "bg-gradient-to-r from-gold-500 to-gold-500 bg-[length:0%_1px] bg-bottom bg-no-repeat pb-0.5",
              "transition-[background-size] duration-500 group-hover:bg-[length:100%_1px]",
              "after:absolute after:inset-0 after:content-['']",
            )}
          >
            {project.name}
          </Link>
        </h3>

        <p className="mt-2 flex items-start gap-1.5 text-sm text-muted-foreground">
          <MapPin
            className="mt-0.5 size-3.5 shrink-0 text-gold-600"
            aria-hidden="true"
          />
          <span className="min-w-0">
            {project.location}, {project.city}
          </span>
        </p>

        <div className="mt-5 flex items-end justify-between gap-3 border-t border-border pt-5 sm:mt-6">
          <div className="min-w-0">
            <p className="eyebrow text-muted-foreground">Starting at</p>
            <p className="mt-1 font-display text-lg text-navy-900 sm:text-xl">
              {project.priceLabel}
            </p>
          </div>

          <span
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-full border border-navy-900/15 text-navy-900",
              "transition-colors duration-300 group-hover:border-gold-500 group-hover:bg-gold-500",
            )}
            aria-hidden="true"
          >
            <ArrowUpRight className="size-4" />
          </span>
        </div>
      </div>
    </article>
  );
}

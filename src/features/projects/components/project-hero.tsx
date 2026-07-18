import Link from "next/link";
import { ChevronRight, MapPin, Maximize2 } from "lucide-react";
import { ProjectMedia } from "@/components/common/project-media";
import { WhatsAppIcon } from "@/components/common/whatsapp-icon";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { projectEnquiryUrl } from "@/lib/whatsapp";
import type { Project } from "@/types";

/**
 * The masthead of a project detail page — full-bleed project media behind a
 * navy scrim, carrying the identity, the price and the two actions that matter
 * (enquire, and see it for yourself).
 */
export function ProjectHero({ project }: { project: Project }) {
  return (
    <section className="relative isolate overflow-hidden bg-navy-950 pt-32 pb-14 sm:pt-36 sm:pb-16 lg:pt-44 lg:pb-20">
      {/* --- Media backdrop --------------------------------------------- */}
      <div className="absolute inset-0 -z-10">
        <ProjectMedia project={project} priority />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/85 to-navy-950/70" />
      </div>

      <Container>
        {/* --- Breadcrumb ------------------------------------------------- */}
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-navy-300">
            <li>
              <Link href="/" className="transition-colors hover:text-gold-500">
                Home
              </Link>
            </li>
            <li className="flex items-center gap-2">
              <ChevronRight className="size-3 text-navy-500" aria-hidden="true" />
              <Link
                href="/projects"
                className="transition-colors hover:text-gold-500"
              >
                Projects
              </Link>
            </li>
            <li className="flex items-center gap-2">
              <ChevronRight className="size-3 text-navy-500" aria-hidden="true" />
              <span aria-current="page" className="text-gold-500">
                {project.name}
              </span>
            </li>
          </ol>
        </nav>

        {/* --- Identity ---------------------------------------------------- */}
        <div className="mt-8 flex flex-wrap items-center gap-2">
          <StatusBadge status={project.status} />
          <Badge variant="outline">{project.category}</Badge>
          {project.hasVirtualTour ? (
            <Badge variant="gold" className="gap-1">
              <Maximize2 className="size-3" aria-hidden="true" />
              360° Tour
            </Badge>
          ) : null}
        </div>

        <h1 className="mt-6 max-w-3xl text-[2.25rem] leading-[1.08] text-white sm:text-5xl lg:text-6xl">
          {project.name}
        </h1>

        <p className="mt-4 max-w-2xl font-display text-lg text-gold-500 italic sm:text-2xl">
          {project.tagline}
        </p>

        <p className="mt-5 flex items-start gap-2 text-sm text-navy-200 sm:text-base">
          <MapPin
            className="mt-0.5 size-4 shrink-0 text-gold-500"
            aria-hidden="true"
          />
          <span>
            {project.location}, {project.city}
          </span>
        </p>

        {/* --- Price + actions --------------------------------------------- */}
        <div className="mt-10 flex flex-col gap-6 border-t border-white/15 pt-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="eyebrow text-navy-300">Starting at</p>
            <p className="mt-2 font-display text-3xl text-white sm:text-4xl">
              {project.priceLabel}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap lg:shrink-0">
            <Button
              href={projectEnquiryUrl(project.name)}
              target="_blank"
              rel="noopener noreferrer"
              variant="gold"
              size="lg"
              className="w-full sm:w-auto"
            >
              <WhatsAppIcon className="size-4" />
              Enquire Now
            </Button>

            <Button
              href="/contact"
              variant="onDark"
              size="lg"
              className="w-full sm:w-auto"
            >
              Book a Site Visit
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}

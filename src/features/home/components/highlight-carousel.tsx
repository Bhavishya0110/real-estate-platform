"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowRight, CalendarCheck } from "lucide-react";
import { ProjectMedia } from "@/components/common/project-media";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { projectEnquiryUrl } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";
import type { Project } from "@/types";

const ROTATE_MS = 6500;

export function HighlightCarousel({ projects }: { projects: Project[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  const goTo = useCallback(
    (next: number) => setIndex(((next % projects.length) + projects.length) % projects.length),
    [projects.length],
  );

  /* Read as state rather than inline, so turning the OS setting on stops a
     carousel that is already running instead of waiting for a remount. */
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(query.matches);

    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  // Auto-rotate, but never fight the user: pause on hover/focus, and stop
  // entirely for anyone who prefers reduced motion.
  useEffect(() => {
    if (paused || reducedMotion || projects.length < 2) return;

    /* Advancing from the previous value rather than from a captured `index`
       keeps the interval out of the dependency list — otherwise every slide
       change tore the timer down and restarted the clock. */
    const timer = setInterval(
      () => setIndex((current) => (current + 1) % projects.length),
      ROTATE_MS,
    );
    return () => clearInterval(timer);
  }, [paused, reducedMotion, projects.length]);

  const active = projects[index];

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Premium highlights"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      className="relative isolate min-h-[32rem] overflow-hidden bg-navy-950 sm:min-h-[36rem] lg:min-h-[42rem]"
    >
      {/* --- Slides ------------------------------------------------------ */}
      {projects.map((project, slide) => (
        <div
          key={project.id}
          aria-hidden={slide !== index}
          className={cn(
            "absolute inset-0 transition-opacity duration-1000",
            slide === index ? "opacity-100" : "opacity-0",
          )}
        >
          <ProjectMedia project={project} />
          {/* Vertical scrim on mobile (text sits over the image), horizontal on
              desktop (text sits beside it). */}
          <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/85 to-navy-950/40 md:bg-gradient-to-r md:from-navy-950 md:via-navy-950/80 md:to-navy-950/30" />
        </div>
      ))}

      {/* --- Copy --------------------------------------------------------- */}
      {/* pb clears the absolutely-positioned slide dots at every width. */}
      <Container className="relative flex min-h-[32rem] items-center py-16 pb-24 sm:min-h-[36rem] sm:py-20 sm:pb-28 lg:min-h-[42rem]">
        <div
          key={active.id}
          className="max-w-2xl animate-fade-up"
          aria-live="polite"
        >
          <Badge variant="gold">{active.category}</Badge>

          <h2 className="mt-5 text-[2rem] leading-[1.1] text-white sm:mt-6 sm:text-5xl lg:text-6xl">
            {active.name}
          </h2>

          <p className="mt-3 font-display text-lg text-gold-500 italic sm:mt-4 sm:text-2xl">
            {active.tagline}
          </p>

          <p className="mt-5 max-w-xl text-sm leading-relaxed text-navy-200 sm:mt-6 sm:text-base">
            {active.description}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:flex-wrap sm:gap-4">
            <Button
              href={`/projects/${active.slug}`}
              variant="gold"
              size="lg"
              className="w-full sm:w-auto"
            >
              Explore
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>

            <Button
              href={projectEnquiryUrl(active.name)}
              target="_blank"
              rel="noopener noreferrer"
              variant="onDark"
              size="lg"
              className="w-full sm:w-auto"
            >
              <CalendarCheck className="size-4" aria-hidden="true" />
              Book a Site Visit
            </Button>
          </div>
        </div>
      </Container>

      {/* --- Slide controls ----------------------------------------------- */}
      <Container className="absolute inset-x-0 bottom-8 sm:bottom-10">
        <div className="flex gap-3">
          {projects.map((project, slide) => (
            <button
              key={project.id}
              type="button"
              onClick={() => goTo(slide)}
              aria-label={`Show ${project.name}`}
              aria-current={slide === index}
              /* The visible bar is 4px, but the button is 44px tall so it is
                 actually tappable on a phone. */
              className="group/dot flex h-11 items-center"
            >
              <span
                className={cn(
                  "block h-1 rounded-full transition-all duration-300",
                  slide === index
                    ? "w-12 bg-gold-500 sm:w-16"
                    : "w-8 bg-white/30 group-hover/dot:bg-white/60",
                )}
              />
            </button>
          ))}
        </div>
      </Container>
    </section>
  );
}

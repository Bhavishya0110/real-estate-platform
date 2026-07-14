import { ArrowRight, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { getProjectCount } from "@/lib/data/projects";
import { HeroSearch } from "./hero-search";

/**
 * BRD Home blueprint §02 — Hero Section:
 * full-width video/slider, headline "Build Your Future With Us",
 * smart search (Type / BHK / Budget / Location).
 * CTAs: Search · Explore · Watch Video.
 */
export async function Hero() {
  const projectCount = await getProjectCount();

  return (
    <section className="relative isolate flex min-h-svh items-center overflow-hidden bg-navy-900 pt-28 pb-14 sm:pt-32 sm:pb-16 lg:min-h-[92vh]">
      {/* --- Backdrop ---------------------------------------------------- */}
      {/* A video plate drops in here once the business supplies it (BRD §8). */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800" />

      {/* Gold aura */}
      <div
        aria-hidden="true"
        className="absolute top-1/4 -right-40 -z-10 size-[36rem] rounded-full bg-gold-500/10 blur-[120px]"
      />

      {/* Architectural grid */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(#C9A84C 1px, transparent 1px), linear-gradient(90deg, #C9A84C 1px, transparent 1px)",
          backgroundSize: "72px 72px",
        }}
      />

      <Container className="relative">
        <div className="max-w-3xl">
          <div className="flex items-center gap-3">
            <span className="gold-rule shrink-0" aria-hidden="true" />
            <span className="eyebrow text-gold-500">
              {projectCount} Landmark Projects · Gurugram &amp; NCR
            </span>
          </div>

          <h1 className="mt-6 text-[2.5rem] leading-[1.08] text-white sm:mt-8 sm:text-6xl sm:leading-[1.05] lg:text-7xl">
            Build Your Future
            <span className="block text-gold-500 italic">With Us</span>
          </h1>

          <p className="mt-6 max-w-xl text-base leading-relaxed text-navy-200 sm:mt-8 sm:text-lg">
            Residential, commercial and plotted developments across Gurugram and
            the NCR — RERA-certified, delivered on time, and priced on a single
            transparent sheet.
          </p>

          {/* Buttons go full-width on the narrowest phones — two cramped pills
              side by side read worse than one confident CTA per row. */}
          <div className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
            <Button href="/projects" variant="gold" size="lg" className="w-full sm:w-auto">
              Explore Projects
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>

            <Button href="/gallery" variant="onDark" size="lg" className="w-full sm:w-auto">
              <PlayCircle className="size-4" aria-hidden="true" />
              Watch Film
            </Button>
          </div>
        </div>

        {/* --- Smart search ---------------------------------------------- */}
        <HeroSearch className="mt-12 sm:mt-14 lg:mt-20" />
      </Container>
    </section>
  );
}

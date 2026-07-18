import type { Metadata } from "next";
import { ArrowRight, Camera, Film, Maximize2 } from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";
import { Button } from "@/components/ui/button";
import { Container, Section } from "@/components/ui/container";
import { GalleryGrid } from "@/features/gallery/components/gallery-grid";
import { getProjects } from "@/lib/data/projects";

export const metadata: Metadata = {
  title: "Gallery",
  description:
    "Project photography, drone visuals and films from across the JMS Group portfolio in Gurugram and the NCR.",
  alternates: { canonical: "/gallery" },
};

const MEDIA_TYPES = [
  {
    icon: Camera,
    title: "Project photography",
    body: "Elevations, interiors and amenity spaces, shot on site rather than rendered.",
  },
  {
    icon: Film,
    title: "Drone & progress films",
    body: "Aerial context for every address, plus month-by-month construction updates.",
  },
  {
    icon: Maximize2,
    title: "360° virtual tours",
    body: "Walk seven of our projects room by room without leaving your desk.",
  },
];

export default async function GalleryPage() {
  const projects = await getProjects();

  return (
    <>
      <PageHero
        eyebrow="Media"
        title="See it before you visit."
        description="Project photography, drone visuals, construction progress and handover films — organised by project so you can find exactly what you came for."
        breadcrumb={[{ label: "Gallery" }]}
      />

      {/* --- What's in the gallery --------------------------------------- */}
      <Section className="bg-white !pb-0">
        <Container>
          <div className="grid gap-6 md:grid-cols-3 lg:gap-8">
            {MEDIA_TYPES.map((item) => (
              <article
                key={item.title}
                className="rounded-sm border border-border bg-navy-50 p-6 sm:p-8"
              >
                <span className="flex size-12 items-center justify-center rounded-sm border border-gold-500/30 bg-white text-gold-600">
                  <item.icon className="size-5" aria-hidden="true" />
                </span>
                <h2 className="mt-5 text-lg text-navy-900 sm:text-xl">
                  {item.title}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {item.body}
                </p>
              </article>
            ))}
          </div>
        </Container>
      </Section>

      {/* --- Masonry ------------------------------------------------------- */}
      <Section className="bg-white">
        <Container>
          <GalleryGrid projects={projects} />

          <p className="mt-10 rounded-sm border border-border bg-navy-50 p-5 text-xs leading-relaxed text-muted-foreground">
            Final photography for each project is being shot and added
            progressively. Every tile links through to the project it belongs to,
            where the full specification and floor plans live.
          </p>
        </Container>
      </Section>

      {/* --- CTA ------------------------------------------------------------ */}
      <Section className="bg-navy-50 !py-16">
        <Container>
          <div className="flex flex-col items-start justify-between gap-6 rounded-sm bg-navy-900 p-8 sm:p-10 lg:flex-row lg:items-center">
            <div className="max-w-xl">
              <h2 className="text-2xl text-white sm:text-3xl">
                Photographs only tell you so much.
              </h2>
              <p className="mt-3 leading-relaxed text-navy-200">
                Book a site visit and see the finish level, the light and the
                neighbourhood for yourself.
              </p>
            </div>

            <Button
              href="/contact"
              variant="gold"
              size="lg"
              className="w-full shrink-0 lg:w-auto"
            >
              Book a Site Visit
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </Container>
      </Section>
    </>
  );
}

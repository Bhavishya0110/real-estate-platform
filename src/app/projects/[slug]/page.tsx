import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { UnderDevelopment } from "@/components/common/under-development";
import { PageHero } from "@/components/layout/page-hero";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Container, Section } from "@/components/ui/container";
import { getProjectBySlug, getProjects } from "@/lib/data/projects";

/**
 * Project detail — reachable from every ProjectCard and from the footer, so it
 * must exist today or those links are 404s.
 *
 * The facts we already hold in JSON are rendered for real; the deep-dive
 * features (gallery, floor plans, brochure gate, map) are stubbed.
 */

/** Pre-renders all 14 projects at build time — each returns 200, statically. */
export async function generateStaticParams() {
  const projects = await getProjects();
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project) return { title: "Project Not Found" };

  return {
    title: `${project.name} — ${project.tagline}`,
    description: project.description,
    alternates: { canonical: `/projects/${project.slug}` },
  };
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  // A slug we never linked to is genuinely not found — a 404 is the correct,
  // SEO-honest answer here. Every slug the site links to is generated above.
  if (!project) notFound();

  return (
    <>
      <PageHero
        eyebrow={`${project.category} · ${project.location}`}
        title={project.name}
        description={project.description}
        breadcrumb={[
          { label: "Projects", href: "/projects" },
          { label: project.name },
        ]}
      />

      {/* --- Facts we already hold ------------------------------------- */}
      <Section className="bg-white">
        <Container>
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={project.status} />
            <Badge variant="outline">{project.category}</Badge>
            {project.hasVirtualTour ? (
              <Badge variant="muted">360° Tour Available</Badge>
            ) : null}
          </div>

          <p className="mt-6 font-display text-2xl text-gold-600 italic sm:text-3xl">
            {project.tagline}
          </p>

          <dl className="mt-12 grid gap-px overflow-hidden rounded-sm bg-border sm:grid-cols-2 lg:grid-cols-4">
            <Fact label="Starting Price" value={project.priceLabel} />
            <Fact label="Configurations" value={project.configurations.join(" · ")} />
            <Fact label="Area" value={project.areaRange} />
            <Fact label="Possession" value={project.possession} />
          </dl>

          <div className="mt-12">
            <h2 className="eyebrow font-sans text-gold-600">Amenities</h2>
            <ul className="mt-5 flex flex-wrap gap-2">
              {project.amenities.map((amenity) => (
                <li
                  key={amenity}
                  className="rounded-sm border border-border bg-navy-50 px-3 py-1.5 text-sm text-navy-700"
                >
                  {amenity}
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </Section>

      <UnderDevelopment
        planned={[
          "The full project gallery — photography, drone visuals and site progress.",
          "Floor plans and carpet-area breakdowns per configuration.",
          "Brochure download, released after lead capture.",
          "Google Maps location with connectivity and catchment detail.",
          project.hasVirtualTour
            ? "The 360° virtual tour, launchable from this page."
            : "An enquiry form wired straight into the CRM.",
        ]}
      />
    </>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white p-6">
      <dt className="eyebrow text-muted-foreground">{label}</dt>
      <dd className="mt-2 font-display text-lg text-navy-900">{value}</dd>
    </div>
  );
}

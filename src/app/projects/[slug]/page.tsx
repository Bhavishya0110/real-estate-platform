import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  Check,
  Download,
  ExternalLink,
  Maximize2,
  ShieldCheck,
} from "lucide-react";
import { WhatsAppIcon } from "@/components/common/whatsapp-icon";
import { Button } from "@/components/ui/button";
import { Container, Section } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { EmiCalculator } from "@/features/emi/components/emi-calculator";
import { ProjectCard } from "@/features/projects/components/project-card";
import { ProjectHero } from "@/features/projects/components/project-hero";
import {
  getProjectBySlug,
  getProjects,
  getRelatedProjects,
} from "@/lib/data/projects";
import { breadcrumbSchema, projectSchema } from "@/lib/schema";
import { projectEnquiryUrl } from "@/lib/whatsapp";

/**
 * Project detail — BRD §5 "Display project details": full information, gallery,
 * brochure, floor plans, location, plus the buyer tools (EMI) and the lead paths
 * (WhatsApp enquiry, site visit, brochure-after-capture).
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
    openGraph: {
      title: `${project.name} — ${project.tagline}`,
      description: project.description,
      type: "article",
    },
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
  // SEO-honest answer. Every slug the site links to is generated above.
  if (!project) notFound();

  const related = await getRelatedProjects(slug, 3);
  const mapsQuery = encodeURIComponent(
    `${project.name}, ${project.location}, ${project.city}`,
  );

  /* BRD §7 SEO — project and breadcrumb structured data. */
  const schema = [
    projectSchema(project),
    breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Projects", path: "/projects" },
      { name: project.name, path: `/projects/${project.slug}` },
    ]),
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <ProjectHero project={project} />

      {/* --- Key facts ---------------------------------------------------- */}
      <Section className="bg-white !pb-0">
        <Container>
          <dl className="grid gap-px overflow-hidden rounded-sm bg-border sm:grid-cols-2 lg:grid-cols-4">
            <Fact label="Configurations" value={project.configurations.join(" · ")} />
            <Fact label="Area" value={project.areaRange} />
            <Fact label="Possession" value={project.possession} />
            <Fact label="Status" value={project.status} />
          </dl>
        </Container>
      </Section>

      {/* --- Overview + amenities ----------------------------------------- */}
      <Section className="bg-white">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[1.2fr_1fr] lg:gap-20">
            <div>
              <div className="flex items-center gap-3">
                <span className="gold-rule shrink-0" aria-hidden="true" />
                <span className="eyebrow text-gold-600">Overview</span>
              </div>

              <h2 className="mt-5 text-[1.75rem] leading-[1.2] text-navy-900 sm:text-3xl md:text-4xl">
                {project.tagline}
              </h2>

              <p className="mt-6 text-[15px] leading-relaxed text-muted-foreground sm:text-base">
                {project.description}
              </p>

              {/* Feature flags from the BRD portfolio table. */}
              <ul className="mt-8 flex flex-wrap gap-2">
                {project.highlights.map((highlight) => (
                  <li
                    key={highlight}
                    className="rounded-sm border border-border bg-navy-50 px-3 py-1.5 text-xs text-navy-700"
                  >
                    {highlight}
                  </li>
                ))}
              </ul>

              <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                {project.hasBrochure ? (
                  <Button href="/contact" variant="primary" size="lg" className="w-full sm:w-auto">
                    <Download className="size-4" aria-hidden="true" />
                    Download Brochure
                  </Button>
                ) : null}

                {project.hasVirtualTour ? (
                  <Button href="/virtual-tour" variant="outline" size="lg" className="w-full sm:w-auto">
                    <Maximize2 className="size-4" aria-hidden="true" />
                    Take the 360° Tour
                  </Button>
                ) : null}
              </div>

              {project.hasBrochure ? (
                <p className="mt-4 text-xs text-muted-foreground">
                  The brochure is released once we have your contact details, so an
                  advisor can answer the questions it raises.
                </p>
              ) : null}
            </div>

            {/* --- Amenities --------------------------------------------- */}
            <div>
              <div className="rounded-sm border border-border bg-navy-50 p-7 sm:p-9">
                <h2 className="eyebrow font-sans text-gold-600">Amenities</h2>

                <ul className="mt-6 space-y-4">
                  {project.amenities.map((amenity) => (
                    <li key={amenity} className="flex items-start gap-3">
                      <span
                        aria-hidden="true"
                        className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-navy-900 text-gold-500"
                      >
                        <Check className="size-3" strokeWidth={3} />
                      </span>
                      <span className="text-sm text-navy-800">{amenity}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-8 border-t border-border pt-6">
                  <p className="inline-flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
                    <ShieldCheck
                      className="mt-0.5 size-4 shrink-0 text-gold-600"
                      aria-hidden="true"
                    />
                    {project.reraId
                      ? `HRERA registration: ${project.reraId}`
                      : "HRERA registered. The registration number for this project is issued with the price sheet."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* --- Location ------------------------------------------------------ */}
      <Section className="bg-navy-900">
        <Container>
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
            <div>
              <SectionHeading
                onDark
                eyebrow="Location"
                title={project.location}
                description={`${project.name} sits in ${project.location}, ${project.city} — chosen for connectivity years before the corridor matured.`}
                className="md:flex-col md:items-start"
              />

              <Button
                href={`https://maps.google.com/?q=${mapsQuery}`}
                target="_blank"
                rel="noopener noreferrer"
                variant="gold"
                size="lg"
                className="mt-8 w-full sm:w-auto"
              >
                Open in Google Maps
                <ExternalLink className="size-4" aria-hidden="true" />
              </Button>
            </div>

            {/* An embedded interactive map is a Phase 4 integration (BRD §6);
                until the API key is provisioned we link out rather than ship a
                dead grey rectangle. */}
            <div className="rounded-sm border border-white/10 bg-white/5 p-8 sm:p-10">
              <dl className="space-y-6">
                <div>
                  <dt className="eyebrow text-navy-300">Address</dt>
                  <dd className="mt-2 text-lg text-white">
                    {project.location}, {project.city}
                  </dd>
                </div>
                <div>
                  <dt className="eyebrow text-navy-300">Possession</dt>
                  <dd className="mt-2 text-lg text-white">{project.possession}</dd>
                </div>
                <div>
                  <dt className="eyebrow text-navy-300">Configurations</dt>
                  <dd className="mt-2 text-lg text-white">
                    {project.configurations.join(" · ")}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </Container>
      </Section>

      {/* --- EMI, seeded with this project's entry price ------------------- */}
      <Section className="bg-navy-50">
        <Container>
          <SectionHeading
            align="center"
            eyebrow="Buyer Tools"
            title={`What ${project.name} costs per month.`}
            description="Pre-filled with this project's starting price. Move the sliders to match your own down payment and tenure."
          />

          <div className="mx-auto mt-12 max-w-5xl sm:mt-16">
            <div className="rounded-sm bg-white p-6 shadow-luxe sm:p-10">
              <EmiCalculator defaultPrincipal={project.priceFrom} />
            </div>
          </div>
        </Container>
      </Section>

      {/* --- Enquiry CTA ---------------------------------------------------- */}
      <Section className="bg-white !py-16">
        <Container>
          <div className="flex flex-col items-start justify-between gap-6 rounded-sm bg-navy-900 p-8 sm:p-10 lg:flex-row lg:items-center lg:p-12">
            <div className="max-w-xl">
              <h2 className="text-2xl text-white sm:text-3xl">
                Ask us anything about {project.name}.
              </h2>
              <p className="mt-3 leading-relaxed text-navy-200">
                Availability, floor preference, payment plan or the RERA paperwork —
                you will get a straight answer, usually within the hour.
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto lg:shrink-0">
              <Button
                href={projectEnquiryUrl(project.name)}
                target="_blank"
                rel="noopener noreferrer"
                variant="gold"
                size="lg"
                className="w-full sm:w-auto"
              >
                <WhatsAppIcon className="size-4" />
                WhatsApp Us
              </Button>

              <Button href="/contact" variant="onDark" size="lg" className="w-full sm:w-auto">
                Request a Callback
              </Button>
            </div>
          </div>
        </Container>
      </Section>

      {/* --- Related projects ------------------------------------------------ */}
      {related.length > 0 ? (
        <Section className="bg-navy-50">
          <Container>
            <SectionHeading
              eyebrow="Also Consider"
              title="Others in the portfolio."
              action={
                <Button href="/projects" variant="outline" size="md">
                  View All Projects
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Button>
              }
            />

            <div className="mt-12 grid gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3">
              {related.map((item) => (
                <ProjectCard key={item.id} project={item} />
              ))}
            </div>
          </Container>
        </Section>
      ) : null}
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

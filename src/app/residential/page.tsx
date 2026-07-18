import type { Metadata } from "next";
import { ArrowRight, Home, Ruler, Trees } from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";
import { Button } from "@/components/ui/button";
import { Container, Section } from "@/components/ui/container";
import { ProjectBrowser } from "@/features/projects/components/project-browser";
import { EMPTY_FILTERS } from "@/features/projects/lib/filter";
import { getResidentialProjects } from "@/lib/data/projects";

export const metadata: Metadata = {
  title: "Residential Projects",
  description:
    "Apartments, independent floors, plots and senior living from JMS Group across Gurugram and the NCR.",
  alternates: { canonical: "/residential" },
};

const HIGHLIGHTS = [
  {
    icon: Home,
    title: "Homes, not inventory",
    body: "Every layout is planned around light, cross-ventilation and how a family actually moves through a home.",
  },
  {
    icon: Ruler,
    title: "Carpet area, stated plainly",
    body: "We publish carpet area alongside built-up, so you can compare us against anyone else honestly.",
  },
  {
    icon: Trees,
    title: "Low-density living",
    body: "Fewer units per acre, more open ground — the single biggest predictor of how a community ages.",
  },
];

export default async function ResidentialPage() {
  const projects = await getResidentialProjects();

  // Only offer tabs for the categories that actually exist in this slice.
  const categories = [...new Set(projects.map((project) => project.category))];

  return (
    <>
      <PageHero
        eyebrow="For Home Buyers"
        title="Homes built for how you actually live."
        description="Apartments, low-density independent floors, plotted development and senior living — planned around light, air and the way a family really moves through a home."
        breadcrumb={[{ label: "Residential" }]}
      />

      {/* --- What sets the residential portfolio apart -------------------- */}
      <Section className="bg-white !pb-0">
        <Container>
          <div className="grid gap-6 md:grid-cols-3 lg:gap-8">
            {HIGHLIGHTS.map((item) => (
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

      {/* --- Portfolio ----------------------------------------------------- */}
      <Section className="bg-white">
        <Container>
          <ProjectBrowser
            projects={projects}
            categories={categories}
            initialFilters={EMPTY_FILTERS}
          />
        </Container>
      </Section>

      <Section className="bg-navy-50 !py-16">
        <Container>
          <div className="flex flex-col items-start justify-between gap-6 rounded-sm bg-navy-900 p-8 sm:p-10 lg:flex-row lg:items-center">
            <div className="max-w-xl">
              <h2 className="text-2xl text-white sm:text-3xl">
                Work out what you can comfortably carry.
              </h2>
              <p className="mt-3 leading-relaxed text-navy-200">
                Run the numbers before you shortlist — our EMI calculator shows the
                true cost of the loan, not just the monthly figure.
              </p>
            </div>

            <Button
              href="/emi-calculator"
              variant="gold"
              size="lg"
              className="w-full shrink-0 lg:w-auto"
            >
              Open EMI Calculator
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </Container>
      </Section>
    </>
  );
}

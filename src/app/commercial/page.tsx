import type { Metadata } from "next";
import { ArrowRight, Building2, TrendingUp, Users } from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";
import { Button } from "@/components/ui/button";
import { Container, Section } from "@/components/ui/container";
import { ProjectBrowser } from "@/features/projects/components/project-browser";
import { EMPTY_FILTERS } from "@/features/projects/lib/filter";
import { getCommercialProjects } from "@/lib/data/projects";

export const metadata: Metadata = {
  title: "Commercial & Retail",
  description:
    "High-street retail, Grade-A offices and investment-grade commercial units from JMS Group in Gurugram.",
  alternates: { canonical: "/commercial" },
};

const INVESTOR_NOTES = [
  {
    icon: TrendingUp,
    title: "Bought on yield, not on a brochure",
    body: "Every unit is priced against a realistic rent, so the return you model is the return you can actually let it at.",
  },
  {
    icon: Users,
    title: "Catchment before frontage",
    body: "We buy where the footfall already is — signalled junctions, metro exits and dense resident catchments.",
  },
  {
    icon: Building2,
    title: "Ready for fit-out",
    body: "Power, services and loading are in place on handover, so a tenant can open without waiting on us.",
  },
];

export default async function CommercialPage() {
  const projects = await getCommercialProjects();

  return (
    <>
      <PageHero
        eyebrow="For Investors"
        title="Assets that pay for themselves."
        description="High-street retail, Grade-A office floors and anchor units on Gurugram's highest-footfall corridors — bought on yield, not on a brochure."
        breadcrumb={[{ label: "Commercial" }]}
      />

      {/* --- Investor notes ----------------------------------------------- */}
      <Section className="bg-white !pb-0">
        <Container>
          <div className="grid gap-6 md:grid-cols-3 lg:gap-8">
            {INVESTOR_NOTES.map((item) => (
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
          <ProjectBrowser projects={projects} initialFilters={EMPTY_FILTERS} />
        </Container>
      </Section>

      <Section className="bg-navy-50 !py-16">
        <Container>
          <div className="flex flex-col items-start justify-between gap-6 rounded-sm bg-navy-900 p-8 sm:p-10 lg:flex-row lg:items-center">
            <div className="max-w-xl">
              <h2 className="text-2xl text-white sm:text-3xl">
                Want the rent roll and the yield working?
              </h2>
              <p className="mt-3 leading-relaxed text-navy-200">
                Our commercial desk will send the catchment study and the assumptions
                behind every number — not just the headline return.
              </p>
            </div>

            <Button
              href="/contact"
              variant="gold"
              size="lg"
              className="w-full shrink-0 lg:w-auto"
            >
              Request the Numbers
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </Container>
      </Section>
    </>
  );
}

import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";
import { Button } from "@/components/ui/button";
import { Container, Section } from "@/components/ui/container";
import { ProjectBrowser } from "@/features/projects/components/project-browser";
import { filtersFromQuery } from "@/features/projects/lib/filter";
import { getProjectCategories, getProjects } from "@/lib/data/projects";

export const metadata: Metadata = {
  title: "All Projects",
  description:
    "Browse every JMS Group development across Gurugram and the NCR — residential, commercial, plotted, senior living and luxury.",
  alternates: { canonical: "/projects" },
};

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // The homepage hero search posts its filters here, so they are read on the
  // server and rendered already applied — no flash of unfiltered results.
  const [query, projects, categories] = await Promise.all([
    searchParams,
    getProjects(),
    getProjectCategories(),
  ]);

  return (
    <>
      <PageHero
        eyebrow="The Portfolio"
        title={`${projects.length} addresses. One standard.`}
        description="Residential, commercial, plotted, senior living and luxury developments — every one RERA-certified and priced on a single transparent sheet."
        breadcrumb={[{ label: "Projects" }]}
      />

      <Section className="bg-white">
        <Container>
          <ProjectBrowser
            projects={projects}
            categories={categories}
            initialFilters={filtersFromQuery(query)}
          />
        </Container>
      </Section>

      {/* --- Advisor CTA -------------------------------------------------- */}
      <Section className="bg-navy-50 !py-16">
        <Container>
          <div className="flex flex-col items-start justify-between gap-6 rounded-sm bg-navy-900 p-8 sm:p-10 lg:flex-row lg:items-center">
            <div className="max-w-xl">
              <h2 className="text-2xl text-white sm:text-3xl">
                Not sure which one fits?
              </h2>
              <p className="mt-3 leading-relaxed text-navy-200">
                Tell an advisor your budget and where you work. They will shortlist
                three, and tell you honestly which to rule out.
              </p>
            </div>

            <Button
              href="/contact"
              variant="gold"
              size="lg"
              className="w-full shrink-0 lg:w-auto"
            >
              Get a Shortlist
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </Container>
      </Section>
    </>
  );
}

import type { Metadata } from "next";
import { UnderDevelopment } from "@/components/common/under-development";
import { PageHero } from "@/components/layout/page-hero";
import { getProjectCount } from "@/lib/data/projects";

export const metadata: Metadata = {
  title: "All Projects",
  description:
    "Browse every JMS Group development across Gurugram and the NCR — residential, commercial, plotted, senior living and luxury.",
  alternates: { canonical: "/projects" },
};

export default async function ProjectsPage() {
  const count = await getProjectCount();

  return (
    <>
      <PageHero
        eyebrow="The Portfolio"
        title={`${count} addresses. One standard.`}
        description="Residential, commercial, plotted, senior living and luxury developments — every one RERA-certified and priced on a single transparent sheet."
        breadcrumb={[{ label: "Projects" }]}
      />

      <UnderDevelopment
        planned={[
          "A filterable grid of all 14 projects — by type, status, budget, configuration and location.",
          "Free-text search across the portfolio.",
          "The smart search on the homepage already submits its filters here as query params.",
          "Sort by price, possession date or newest launch.",
          "Shortlist up to three projects and compare them side by side.",
        ]}
      />
    </>
  );
}

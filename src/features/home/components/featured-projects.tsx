import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container, Section } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { getProjects } from "@/lib/data/projects";
import { FeaturedProjectsGrid } from "./featured-projects-grid";

/**
 * BRD Home blueprint §04 — Featured Projects:
 * grid of 6 (name, type, status badge, price) with All / Residential /
 * Commercial filter tabs. CTAs: View Details · Enquire · View All.
 *
 * Data is fetched on the server; only the tab interaction is client-side.
 */
export async function FeaturedProjects() {
  const projects = await getProjects();

  return (
    <Section id="projects">
      <Container>
        <SectionHeading
          eyebrow="The Portfolio"
          title="Fourteen addresses. One standard."
          description="From waterfront residences to high-street retail — every project is RERA-certified, third-party audited and priced on one transparent sheet."
          action={
            <Button href="/projects" variant="outline" size="md">
              View All Projects
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          }
        />

        <FeaturedProjectsGrid projects={projects} className="mt-10 sm:mt-14" />
      </Container>
    </Section>
  );
}

import type { Metadata } from "next";
import { UnderDevelopment } from "@/components/common/under-development";
import { PageHero } from "@/components/layout/page-hero";
import { getJobCount } from "@/lib/data/content";

export const metadata: Metadata = {
  title: "Careers",
  description:
    "Open roles at JMS Group across sales, projects, marketing and customer success in Gurugram.",
  alternates: { canonical: "/careers" },
};

export default async function CareersPage() {
  const openings = await getJobCount();

  return (
    <>
      <PageHero
        eyebrow="Careers"
        title="Join our growing team."
        description={`Over 100 people build JMS Group. We are hiring across sales, projects and marketing — ${openings} open positions right now, and a policy of promoting from within.`}
        breadcrumb={[{ label: "Careers" }]}
      />

      <UnderDevelopment
        planned={[
          "Every open role, filterable by department, location, type and experience.",
          "A multi-step application form with résumé upload.",
          "Automatic notification to HR on every submission.",
          "Culture visuals and employee testimonials.",
          "Individual job-detail pages with full role descriptions.",
        ]}
      />
    </>
  );
}

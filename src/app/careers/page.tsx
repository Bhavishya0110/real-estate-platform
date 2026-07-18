import type { Metadata } from "next";
import { GraduationCap, HeartHandshake, TrendingUp } from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";
import { Container, Section } from "@/components/ui/container";
import { JobList } from "@/features/careers/components/job-list";
import { getJobDepartments, getJobs } from "@/lib/data/content";

export const metadata: Metadata = {
  title: "Careers",
  description:
    "Open roles at JMS Group across sales, projects, marketing and customer success in Gurugram.",
  alternates: { canonical: "/careers" },
};

const CULTURE = [
  {
    icon: TrendingUp,
    title: "We promote from within",
    body: "Most of our senior sales and CRM staff joined in junior roles. Growth here is a policy, not a perk.",
  },
  {
    icon: HeartHandshake,
    title: "One price sheet, no games",
    body: "You will never be asked to mislead a buyer. It makes the job harder to win and far easier to keep.",
  },
  {
    icon: GraduationCap,
    title: "Real ownership, early",
    body: "Teams are small enough that your work is visible and your judgement is actually used.",
  },
];

export default async function CareersPage() {
  const [jobs, departments] = await Promise.all([
    getJobs(),
    getJobDepartments(),
  ]);

  return (
    <>
      <PageHero
        eyebrow="Careers"
        title="Join our growing team."
        description={`Over 100 people build JMS Group. We are hiring across sales, projects and marketing — ${jobs.length} open positions right now, and a policy of promoting from within.`}
        breadcrumb={[{ label: "Careers" }]}
      />

      {/* --- Culture ------------------------------------------------------ */}
      <Section className="bg-white !pb-0">
        <Container>
          <div className="grid gap-6 md:grid-cols-3 lg:gap-8">
            {CULTURE.map((item) => (
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

      {/* --- Openings ------------------------------------------------------ */}
      <Section className="bg-white">
        <Container>
          <JobList jobs={jobs} departments={departments} />
        </Container>
      </Section>
    </>
  );
}

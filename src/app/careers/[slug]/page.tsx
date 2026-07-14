import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { UnderDevelopment } from "@/components/common/under-development";
import { PageHero } from "@/components/layout/page-hero";
import { getJobBySlug, getJobs } from "@/lib/data/content";

/** Linked from the homepage Career Teaser cards, so it must resolve today. */
export async function generateStaticParams() {
  const jobs = await getJobs();
  return jobs.map((job) => ({ slug: job.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const job = await getJobBySlug(slug);

  if (!job) return { title: "Role Not Found" };

  return {
    title: `${job.title} — ${job.location}`,
    description: `${job.type} · ${job.department} · ${job.experience} · ${job.location}. Apply to JMS Group.`,
    alternates: { canonical: `/careers/${job.slug}` },
  };
}

export default async function JobPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const job = await getJobBySlug(slug);

  if (!job) notFound();

  return (
    <>
      <PageHero
        eyebrow={`${job.department} · ${job.type} · ${job.experience}`}
        title={job.title}
        description={`Based in ${job.location}. We are looking for ${job.experience} of experience, and we promote from within.`}
        breadcrumb={[
          { label: "Careers", href: "/careers" },
          { label: job.title },
        ]}
      />

      <UnderDevelopment
        planned={[
          "The full role description, responsibilities and success criteria.",
          "Compensation band and benefits, stated openly.",
          "A multi-step application form with résumé upload.",
          "Automatic notification to HR, routed to the hiring manager.",
          "Interview process and expected timeline.",
        ]}
      />
    </>
  );
}

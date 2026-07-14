import Link from "next/link";
import { ArrowRight, Briefcase, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container, Section } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { getJobCount, getJobs } from "@/lib/data/content";

/**
 * BRD Home blueprint §10 — Career Teaser:
 * "Join our growing team · X openings" + 2 featured job cards, linking to /careers.
 * CTA: See Open Positions.
 */
export async function CareerTeaser() {
  const [jobs, openings] = await Promise.all([getJobs(2), getJobCount()]);

  return (
    <Section className="bg-navy-900">
      <Container>
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-20">
          <SectionHeading
            onDark
            eyebrow="Careers"
            title="Join our growing team."
            description={`We are hiring across sales, projects and marketing. ${openings} open positions right now — and a policy of promoting from within.`}
            action={
              <Button href="/careers" variant="gold" size="lg">
                See Open Positions
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
            }
            className="md:flex-col md:items-start"
          />

          <ul className="flex flex-col gap-4">
            {jobs.map((job) => (
              <li key={job.id}>
                <Link
                  href={`/careers/${job.slug}`}
                  className="group flex items-center justify-between gap-4 rounded-sm border border-white/10 bg-white/5 p-5 transition-all duration-300 hover:border-gold-500/50 hover:bg-white/10 sm:gap-6 sm:p-6"
                >
                  <div className="min-w-0">
                    <h3 className="truncate text-base text-white sm:text-lg">
                      {job.title}
                    </h3>

                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-navy-300">
                      <span className="inline-flex items-center gap-1.5">
                        <Briefcase className="size-3.5 text-gold-500" aria-hidden="true" />
                        {job.department} · {job.type}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="size-3.5 text-gold-500" aria-hidden="true" />
                        {job.location}
                      </span>
                      <span>{job.experience}</span>
                    </div>
                  </div>

                  <span
                    className="flex size-10 shrink-0 items-center justify-center rounded-full border border-white/20 text-white transition-colors duration-300 group-hover:border-gold-500 group-hover:bg-gold-500 group-hover:text-navy-900"
                    aria-hidden="true"
                  >
                    <ArrowRight className="size-4" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </Section>
  );
}

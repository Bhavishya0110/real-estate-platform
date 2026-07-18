import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowRight, Briefcase, Check, Clock, Mail, MapPin } from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";
import { WhatsAppIcon } from "@/components/common/whatsapp-icon";
import { Button } from "@/components/ui/button";
import { Container, Section } from "@/components/ui/container";
import { getJobBySlug, getJobs, siteConfig } from "@/lib/data/content";
import { breadcrumbSchema, jobPostingSchema } from "@/lib/schema";
import { whatsappUrl } from "@/lib/whatsapp";

/** Linked from the homepage teaser and the careers listing. */
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
    description: job.summary,
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

  const applySubject = encodeURIComponent(`Application — ${job.title}`);

  /* BRD §7 SEO — a job rich result carries the role straight into search. */
  const schema = [
    jobPostingSchema(job),
    breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Careers", path: "/careers" },
      { name: job.title, path: `/careers/${job.slug}` },
    ]),
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <PageHero
        eyebrow={`${job.department} · ${job.type}`}
        title={job.title}
        description={job.summary}
        breadcrumb={[
          { label: "Careers", href: "/careers" },
          { label: job.title },
        ]}
      />

      {/* --- Role facts --------------------------------------------------- */}
      <Section className="bg-white !pb-0">
        <Container>
          <dl className="grid gap-px overflow-hidden rounded-sm bg-border sm:grid-cols-2 lg:grid-cols-4">
            <Fact icon={Briefcase} label="Department" value={job.department} />
            <Fact icon={Clock} label="Experience" value={job.experience} />
            <Fact icon={MapPin} label="Location" value={job.location} />
            <Fact icon={Briefcase} label="Type" value={job.type} />
          </dl>
        </Container>
      </Section>

      {/* --- Detail ------------------------------------------------------- */}
      <Section className="bg-white">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[1.3fr_1fr] lg:gap-20">
            <div>
              <section>
                <h2 className="font-display text-2xl text-navy-900 sm:text-3xl">
                  What you will do
                </h2>
                <ul className="mt-6 space-y-4">
                  {job.responsibilities.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span
                        aria-hidden="true"
                        className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-navy-900 text-gold-500"
                      >
                        <Check className="size-3" strokeWidth={3} />
                      </span>
                      <span className="text-[15px] leading-relaxed text-muted-foreground">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="mt-12">
                <h2 className="font-display text-2xl text-navy-900 sm:text-3xl">
                  What we are looking for
                </h2>
                <ul className="mt-6 space-y-4">
                  {job.requirements.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span
                        aria-hidden="true"
                        className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-gold-500 text-navy-900"
                      >
                        <Check className="size-3" strokeWidth={3} />
                      </span>
                      <span className="text-[15px] leading-relaxed text-muted-foreground">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            {/* --- Apply panel --------------------------------------------- */}
            <aside className="lg:sticky lg:top-28 lg:self-start">
              <div className="rounded-sm bg-navy-900 p-7 sm:p-9">
                <h2 className="text-xl text-white sm:text-2xl">
                  Apply for this role
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-navy-200">
                  Send your CV with the role title in the subject line. Every
                  application is read by a person, and you will hear back either
                  way.
                </p>

                <div className="mt-7 flex flex-col gap-3">
                  <Button
                    href={`mailto:${siteConfig.email}?subject=${applySubject}`}
                    variant="gold"
                    size="lg"
                  >
                    <Mail className="size-4" aria-hidden="true" />
                    Email Your CV
                  </Button>

                  <Button
                    href={whatsappUrl(
                      `Hi JMS Group, I'd like to apply for the ${job.title} role.`,
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="onDark"
                    size="lg"
                  >
                    <WhatsAppIcon className="size-4" />
                    Ask About the Role
                  </Button>
                </div>

                <p className="mt-6 border-t border-white/10 pt-5 text-xs leading-relaxed text-navy-300">
                  In-browser résumé upload with automatic routing to HR is being
                  wired in. Until then, email reaches the same hiring manager.
                </p>
              </div>

              <Button
                href="/careers"
                variant="outline"
                size="md"
                className="mt-6 w-full"
              >
                View All Openings
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
            </aside>
          </div>
        </Container>
      </Section>
    </>
  );
}

function Fact({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Briefcase;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-white p-6">
      <dt className="inline-flex items-center gap-2">
        <Icon className="size-3.5 text-gold-600" aria-hidden="true" />
        <span className="eyebrow text-muted-foreground">{label}</span>
      </dt>
      <dd className="mt-2 font-display text-lg text-navy-900">{value}</dd>
    </div>
  );
}

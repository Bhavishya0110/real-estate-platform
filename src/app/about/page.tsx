import type { Metadata } from "next";
import { ArrowRight, Building2, Compass, Target } from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";
import { Button } from "@/components/ui/button";
import { Container, Section } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import {
  getLeadership,
  getMilestones,
  getStats,
  siteConfig,
} from "@/lib/data/content";
import { getProjectCount } from "@/lib/data/projects";
import { formatNumber } from "@/lib/format";

export const metadata: Metadata = {
  title: "About Us",
  description: siteConfig.description,
  alternates: { canonical: "/about" },
};

export default async function AboutPage() {
  const [stats, milestones, leaders, projectCount] = await Promise.all([
    getStats(),
    getMilestones(),
    getLeadership(4),
    getProjectCount(),
  ]);

  return (
    <>
      <PageHero
        eyebrow="Company Profile"
        title="Turning aspirations into reality."
        description={siteConfig.positioning}
        breadcrumb={[{ label: "About Us" }]}
      />

      {/* --- Story + credentials ---------------------------------------- */}
      <Section className="bg-white">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[1.15fr_1fr] lg:gap-20">
            <div>
              <div className="flex items-center gap-3">
                <span className="gold-rule shrink-0" aria-hidden="true" />
                <span className="eyebrow text-gold-600">Who we are</span>
              </div>

              <h2 className="mt-5 text-[1.75rem] leading-[1.2] text-navy-900 sm:text-3xl md:text-4xl">
                A future-forward and accountable developer.
              </h2>

              <div className="mt-6 space-y-5 text-[15px] leading-relaxed text-muted-foreground sm:text-base">
                <p>{siteConfig.description}</p>
                <p>
                  Founded in {siteConfig.foundedYear}, we have spent over a
                  decade in Gurugram&apos;s key micro-markets — buying land on
                  growth corridors years before the market catches on, and
                  building on it to a standard we are happy to have audited.
                </p>
                <p>
                  Today the portfolio runs to {projectCount} landmark addresses
                  across residential, commercial, plotted, senior living and
                  luxury development, backed by a team of more than a hundred
                  people and the trust of over a thousand customers.
                </p>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Button href="/projects" variant="primary" size="lg" className="w-full sm:w-auto">
                  Explore the Portfolio
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Button>
                <Button href="/contact" variant="outline" size="lg" className="w-full sm:w-auto">
                  Talk to Us
                </Button>
              </div>
            </div>

            {/* Credentials — static here; the animated counters stay on Home. */}
            <div>
              <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-sm bg-border">
                {stats.map((stat) => (
                  <div key={stat.id} className="bg-navy-50 p-6 sm:p-8">
                    <dt className="eyebrow text-muted-foreground">
                      {stat.label}
                    </dt>
                    <dd className="mt-2 font-display text-3xl text-navy-900 sm:text-4xl">
                      {formatNumber(stat.value)}
                      {stat.suffix}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </Container>
      </Section>

      {/* --- Vision & Mission -------------------------------------------- */}
      <Section className="bg-navy-900">
        <Container>
          <SectionHeading
            onDark
            align="center"
            eyebrow="What drives us"
            title="Vision and mission."
          />

          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:mt-16 lg:gap-8">
            {[
              {
                icon: Compass,
                label: "Our Vision",
                body: siteConfig.vision,
              },
              {
                icon: Target,
                label: "Our Mission",
                body: siteConfig.mission,
              },
            ].map((item) => (
              <article
                key={item.label}
                className="rounded-sm border border-white/10 bg-white/5 p-8 transition-colors duration-300 hover:border-gold-500/40 sm:p-10"
              >
                <span className="flex size-12 items-center justify-center rounded-sm border border-gold-500/30 text-gold-500">
                  <item.icon className="size-5" aria-hidden="true" />
                </span>

                <h3 className="mt-6 text-xl text-white sm:text-2xl">
                  {item.label}
                </h3>

                <p className="mt-4 leading-relaxed text-navy-200">
                  {item.body}
                </p>
              </article>
            ))}
          </div>
        </Container>
      </Section>

      {/* --- Milestones --------------------------------------------------- */}
      <Section className="bg-white">
        <Container>
          <SectionHeading
            eyebrow="Our Journey"
            title="Thirteen years, one standard."
            description="The moments that shaped how JMS Group buys land, builds on it and hands it over."
          />

          <ol className="mt-12 sm:mt-16">
            {milestones.map((milestone) => (
              <li
                key={milestone.id}
                className="grid gap-3 border-t border-border py-7 sm:grid-cols-[9rem_1fr] sm:gap-8 sm:py-8"
              >
                <p className="font-display text-2xl text-gold-600 sm:text-3xl">
                  {milestone.year}
                </p>

                <div>
                  <h3 className="text-lg text-navy-900 sm:text-xl">
                    {milestone.title}
                  </h3>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                    {milestone.description}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </Container>
      </Section>

      {/* --- Leadership --------------------------------------------------- */}
      <Section className="bg-navy-50">
        <Container>
          <SectionHeading
            eyebrow="Leadership"
            title="Names against every function."
            description="If something goes wrong on your project, you will know exactly whose desk it lands on."
            action={
              <Button href="/management" variant="outline" size="md">
                Meet the Team
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
            }
          />

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:mt-16 lg:grid-cols-4">
            {leaders.map((leader) => (
              <article
                key={leader.id}
                className="rounded-sm border border-border bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-gold-500/40 hover:shadow-luxe"
              >
                <span
                  aria-hidden="true"
                  className="flex size-14 items-center justify-center rounded-full bg-navy-900 font-display text-lg text-gold-500"
                >
                  {leader.initials}
                </span>

                <h3 className="mt-5 text-lg text-navy-900">{leader.name}</h3>
                <p className="mt-1 text-xs font-medium tracking-wide text-gold-600">
                  {leader.role}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {leader.bio}
                </p>
              </article>
            ))}
          </div>
        </Container>
      </Section>

      {/* --- Closing CTA --------------------------------------------------- */}
      <Section className="bg-white">
        <Container>
          <div className="flex flex-col items-start gap-8 rounded-sm bg-navy-900 p-8 sm:p-12 lg:flex-row lg:items-center lg:justify-between lg:p-16">
            <div className="max-w-2xl">
              <span className="flex size-12 items-center justify-center rounded-sm border border-gold-500/30 text-gold-500">
                <Building2 className="size-5" aria-hidden="true" />
              </span>
              <h2 className="mt-6 text-2xl text-white sm:text-3xl lg:text-4xl">
                Come and see one for yourself.
              </h2>
              <p className="mt-4 leading-relaxed text-navy-200">
                Book a site visit at any of our {projectCount} addresses. No
                obligation, no pressure — and the same price sheet everyone else
                gets.
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto lg:shrink-0 lg:flex-col">
              <Button href="/contact" variant="gold" size="lg" className="w-full">
                Book a Site Visit
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
              <Button href="/projects" variant="onDark" size="lg" className="w-full">
                Browse Projects
              </Button>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}

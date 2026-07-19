import type { Metadata } from "next";
import { Mail } from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";
import { Button } from "@/components/ui/button";
import { Container, Section } from "@/components/ui/container";
import { getLegalDocument } from "@/lib/data/content";
import { siteConfig } from "@/lib/data/site-config";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "Privacy & Legal",
  description:
    "How JMS Group collects, stores and uses your data, plus our terms and RERA disclosures.",
  alternates: { canonical: "/privacy" },
  robots: { index: false, follow: true },
};

export default async function PrivacyPage() {
  const legal = await getLegalDocument();

  return (
    <>
      <PageHero
        eyebrow="Legal"
        title="Privacy & legal disclosures."
        description="What we collect, why we collect it, how long we keep it, and how to make us delete it."
        breadcrumb={[{ label: "Privacy" }]}
      />

      <Section className="bg-white">
        <Container>
          <div className="mx-auto max-w-3xl">
            <p className="text-sm text-muted-foreground">
              Last updated{" "}
              <time dateTime={legal.lastUpdated}>
                {formatDate(legal.lastUpdated)}
              </time>
            </p>

            {/* --- Section index ------------------------------------------ */}
            <nav
              aria-label="On this page"
              className="mt-8 rounded-sm border border-border bg-navy-50 p-6"
            >
              <h2 className="eyebrow font-sans text-gold-600">On this page</h2>
              <ol className="mt-4 grid gap-2 sm:grid-cols-2">
                {legal.sections.map((section) => (
                  <li key={section.id}>
                    <a
                      href={`#${section.id}`}
                      className="text-sm text-navy-700 underline-offset-4 transition-colors hover:text-gold-600 hover:underline"
                    >
                      {section.heading}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>

            {/* --- Body ---------------------------------------------------- */}
            <div className="mt-12 flex flex-col gap-10">
              {legal.sections.map((section) => (
                <section
                  key={section.id}
                  id={section.id}
                  className="scroll-mt-28"
                >
                  <h2 className="font-display text-2xl text-navy-900">
                    {section.heading}
                  </h2>

                  <p className="mt-4 leading-relaxed text-muted-foreground">
                    {section.body}
                  </p>

                  {section.items ? (
                    <ul className="mt-4 space-y-2.5">
                      {section.items.map((item) => (
                        <li
                          key={item}
                          className="flex items-start gap-3 text-[15px] leading-relaxed text-muted-foreground"
                        >
                          <span
                            aria-hidden="true"
                            className="mt-2 size-1.5 shrink-0 rounded-full bg-gold-500"
                          />
                          {item}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </section>
              ))}
            </div>

            {/* --- Contact ------------------------------------------------- */}
            <div className="mt-14 rounded-sm bg-navy-900 p-8 sm:p-10">
              <h2 className="text-xl text-white sm:text-2xl">
                Questions about your data?
              </h2>
              <p className="mt-3 leading-relaxed text-navy-200">
                Write to us and a person will answer — including if you want your
                records deleted.
              </p>

              <Button
                href={`mailto:${siteConfig.email}?subject=${encodeURIComponent("Privacy enquiry")}`}
                variant="gold"
                size="lg"
                className="mt-6"
              >
                <Mail className="size-4" aria-hidden="true" />
                {siteConfig.email}
              </Button>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}

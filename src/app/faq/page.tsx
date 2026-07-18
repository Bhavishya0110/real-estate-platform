import type { Metadata } from "next";
import { ChevronDown } from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";
import { WhatsAppIcon } from "@/components/common/whatsapp-icon";
import { Button } from "@/components/ui/button";
import { Container, Section } from "@/components/ui/container";
import { getFaqs, getFaqsByCategory } from "@/lib/data/content";
import { whatsappUrl } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Common questions about booking, pricing, home loans, possession, RERA and site visits at JMS Group.",
  alternates: { canonical: "/faq" },
};

export default async function FaqPage() {
  const [groups, all] = await Promise.all([getFaqsByCategory(), getFaqs()]);

  /* BRD §7 SEO — FAQPage structured data so answers can surface in search. */
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: all.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <PageHero
        eyebrow="Support"
        title="The questions everyone asks."
        description="Booking, home loans, possession timelines, RERA and what happens after handover — answered without the sales gloss."
        breadcrumb={[{ label: "FAQ" }]}
      />

      <Section className="bg-white">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[16rem_1fr] lg:gap-16">
            {/* --- Category index ---------------------------------------- */}
            <nav aria-label="FAQ categories" className="lg:sticky lg:top-28 lg:self-start">
              <h2 className="eyebrow font-sans text-gold-600">Categories</h2>
              <ul className="mt-5 flex flex-wrap gap-2 lg:flex-col lg:gap-1">
                {groups.map((group) => (
                  <li key={group.category}>
                    <a
                      href={`#${slugify(group.category)}`}
                      className="inline-block rounded-sm px-3 py-2 text-sm text-navy-700 transition-colors hover:bg-navy-50 hover:text-navy-900"
                    >
                      {group.category}
                      <span className="ml-2 text-xs text-muted-foreground">
                        {group.items.length}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            {/* --- Accordions --------------------------------------------- */}
            <div className="flex flex-col gap-12">
              {groups.map((group) => (
                <section
                  key={group.category}
                  id={slugify(group.category)}
                  className="scroll-mt-28"
                >
                  <h2 className="font-display text-2xl text-navy-900 sm:text-3xl">
                    {group.category}
                  </h2>

                  <div className="mt-6 divide-y divide-border border-t border-border">
                    {group.items.map((faq) => (
                      /* Native <details> — keyboard and screen-reader correct
                         with no JavaScript at all. */
                      <details key={faq.id} className="group py-5">
                        <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-left [&::-webkit-details-marker]:hidden">
                          <span className="text-[15px] font-medium text-navy-900 sm:text-base">
                            {faq.question}
                          </span>
                          <ChevronDown
                            className="mt-0.5 size-5 shrink-0 text-gold-600 transition-transform duration-300 group-open:rotate-180"
                            aria-hidden="true"
                          />
                        </summary>

                        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                          {faq.answer}
                        </p>
                      </details>
                    ))}
                  </div>
                </section>
              ))}

              {/* --- Escalation ------------------------------------------- */}
              <div className="rounded-sm bg-navy-900 p-8 sm:p-10">
                <h2 className="text-xl text-white sm:text-2xl">
                  Still not answered?
                </h2>
                <p className="mt-3 leading-relaxed text-navy-200">
                  Ask us directly. If we do not know, we will say so rather than
                  guess.
                </p>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <Button
                    href={whatsappUrl(
                      "Hi JMS Group, I have a question that wasn't covered in your FAQ.",
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="gold"
                    size="lg"
                    className="w-full sm:w-auto"
                  >
                    <WhatsAppIcon className="size-4" />
                    Ask on WhatsApp
                  </Button>

                  <Button href="/contact" variant="onDark" size="lg" className="w-full sm:w-auto">
                    Send an Enquiry
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

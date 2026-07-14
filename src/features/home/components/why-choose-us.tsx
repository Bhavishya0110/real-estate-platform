import {
  HardHat,
  LifeBuoy,
  MapPin,
  ReceiptIndianRupee,
  type LucideIcon,
} from "lucide-react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container, Section } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { getPillars } from "@/lib/data/content";

/**
 * BRD Home blueprint §05 — Why Choose Us:
 * 4 pillars — Quality Construction · Prime Locations · Transparent Pricing ·
 * After-Sale Support. CTA: Know More.
 */

/** Data stores an icon *name*; the UI owns the icon *component*. */
const icons: Record<string, LucideIcon> = {
  HardHat,
  MapPin,
  ReceiptIndianRupee,
  LifeBuoy,
};

export async function WhyChooseUs() {
  const pillars = await getPillars();

  return (
    <Section className="bg-navy-900">
      <Container>
        <SectionHeading
          onDark
          eyebrow="Why JMS"
          title="Four promises we put in writing."
          description="Anyone can build a tower. We compete on the things that are harder to fake — and easier to verify."
          action={
            <Button href="/about" variant="onDark" size="md">
              Know More
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          }
        />

        <div className="mt-10 grid gap-px overflow-hidden rounded-sm bg-white/10 sm:grid-cols-2 lg:mt-16 lg:grid-cols-4">
          {pillars.map((pillar) => {
            const Icon = icons[pillar.icon] ?? HardHat;

            return (
              <article
                key={pillar.id}
                className="group bg-navy-900 p-6 transition-colors duration-300 hover:bg-navy-800 sm:p-8"
              >
                <span className="flex size-12 items-center justify-center rounded-sm border border-gold-500/30 text-gold-500 transition-colors duration-300 group-hover:bg-gold-500 group-hover:text-navy-900 sm:size-14">
                  <Icon className="size-5 sm:size-6" aria-hidden="true" />
                </span>

                <h3 className="mt-6 text-lg text-white sm:mt-8 sm:text-xl">
                  {pillar.title}
                </h3>

                <p className="mt-3 text-sm leading-relaxed text-navy-300">
                  {pillar.description}
                </p>
              </article>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}

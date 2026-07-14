import type { Metadata } from "next";
import { PageHero } from "@/components/layout/page-hero";
import { Container, Section } from "@/components/ui/container";
import { EmiCalculator } from "@/features/emi/components/emi-calculator";

export const metadata: Metadata = {
  title: "EMI Calculator",
  description:
    "Work out your home-loan EMI, total interest and true cost of borrowing instantly — no forms, no sales call.",
  alternates: { canonical: "/emi-calculator" },
};

/**
 * This route is fully implemented, not a placeholder — the calculator component
 * already exists, so there was no reason to stub it. BRD §5 acceptance criteria:
 * "EMI is calculated accurately without page refresh."
 */
export default function EmiCalculatorPage() {
  return (
    <>
      <PageHero
        eyebrow="Buyer Tools"
        title="Know the number before you fall in love."
        description="Move the sliders. Your EMI, the total interest and the true cost of the loan update instantly — nothing is submitted, and nobody calls you."
        breadcrumb={[{ label: "EMI Calculator" }]}
      />

      <Section className="bg-white">
        <Container>
          <EmiCalculator showFullEmiLink={false} />

          <div className="mt-14 grid gap-6 border-t border-border pt-10 md:grid-cols-3">
            <Note title="Reducing balance">
              Interest is charged on the outstanding principal, which shrinks
              every month. This is how every Indian home loan actually works.
            </Note>
            <Note title="What is not included">
              Processing fees, stamp duty, registration and GST sit outside the
              loan. Budget for them separately.
            </Note>
            <Note title="Your real rate">
              The rate on your sanction letter depends on your credit profile.
              Treat the default here as indicative, not a quote.
            </Note>
          </div>
        </Container>
      </Section>
    </>
  );
}

function Note({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="eyebrow font-sans text-gold-600">{title}</h2>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        {children}
      </p>
    </div>
  );
}

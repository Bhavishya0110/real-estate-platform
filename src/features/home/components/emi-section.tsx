import { Container, Section } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { EmiCalculator } from "@/features/emi/components/emi-calculator";

/** BRD Home blueprint §07 — the quick EMI tool, embedded on the homepage. */
export function EmiSection() {
  return (
    <Section id="emi" className="bg-white">
      <Container>
        <SectionHeading
          eyebrow="Buyer Tools"
          title="Know the number before you fall in love."
          description="Move the sliders. The EMI, the total interest and the true cost of the loan update instantly — no forms, no page reloads, no sales call required."
        />

        <div className="mt-10 sm:mt-14">
          <EmiCalculator />
        </div>
      </Container>
    </Section>
  );
}

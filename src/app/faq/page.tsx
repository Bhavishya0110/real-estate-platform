import type { Metadata } from "next";
import { UnderDevelopment } from "@/components/common/under-development";
import { PageHero } from "@/components/layout/page-hero";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Common questions about booking, home loans, possession, RERA and after-sale support at JMS Group.",
  alternates: { canonical: "/faq" },
};

export default function FaqPage() {
  return (
    <>
      <PageHero
        eyebrow="Support"
        title="The questions everyone asks."
        description="Booking, home loans, possession timelines, RERA and what happens after handover — answered without the sales gloss."
        breadcrumb={[{ label: "FAQ" }]}
      />

      <UnderDevelopment
        planned={[
          "A searchable, categorised FAQ covering booking, loans, possession and RERA.",
          "Accordion answers, so the page stays scannable.",
          "FAQ structured data, so answers can surface directly in Google.",
          "Deep links to individual questions for the sales team to share.",
          "An escalation path to WhatsApp when the answer is not here.",
        ]}
      />
    </>
  );
}

import type { Metadata } from "next";
import { UnderDevelopment } from "@/components/common/under-development";
import { PageHero } from "@/components/layout/page-hero";

export const metadata: Metadata = {
  title: "Residential Projects",
  description:
    "Apartments, independent floors and senior living from JMS Group across Gurugram and the NCR.",
  alternates: { canonical: "/residential" },
};

export default function ResidentialPage() {
  return (
    <>
      <PageHero
        eyebrow="For Home Buyers"
        title="Homes built for how you actually live."
        description="Apartments, low-density independent floors and senior living — planned around light, air and the way a family really moves through a home."
        breadcrumb={[{ label: "Residential" }]}
      />

      <UnderDevelopment
        planned={[
          "The residential portfolio, separated cleanly from commercial as the BRD requires.",
          "Filter by configuration (2/3/4 BHK), budget band, possession date and micro-market.",
          "Floor plans and carpet-area breakdowns for every configuration.",
          "Downloadable brochures, released after a lead is captured.",
          "Google Maps location and connectivity scores for each address.",
        ]}
      />
    </>
  );
}

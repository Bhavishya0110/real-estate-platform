import type { Metadata } from "next";
import { UnderDevelopment } from "@/components/common/under-development";
import { PageHero } from "@/components/layout/page-hero";

export const metadata: Metadata = {
  title: "Commercial & Retail",
  description:
    "High-street retail, Grade-A offices and investment-grade commercial units from JMS Group in Gurugram.",
  alternates: { canonical: "/commercial" },
};

export default function CommercialPage() {
  return (
    <>
      <PageHero
        eyebrow="For Investors"
        title="Assets that pay for themselves."
        description="High-street retail, Grade-A office floors and anchor units on Gurugram's highest-footfall corridors — bought on yield, not on a brochure."
        breadcrumb={[{ label: "Commercial" }]}
      />

      <UnderDevelopment
        planned={[
          "The commercial portfolio, with unit-level availability per project.",
          "An ROI and rental-yield calculator — enter your investment, see the return.",
          "Footfall, catchment and connectivity data for every retail address.",
          "Side-by-side comparison of units across projects.",
          "Assured-yield and pre-leasing options, stated up front.",
        ]}
      />
    </>
  );
}

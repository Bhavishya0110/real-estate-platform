import type { Metadata } from "next";
import { UnderDevelopment } from "@/components/common/under-development";
import { PageHero } from "@/components/layout/page-hero";
import { siteConfig } from "@/lib/data/content";

export const metadata: Metadata = {
  title: "About Us",
  description: siteConfig.description,
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="Company Profile"
        title="Turning aspirations into reality."
        description={siteConfig.description}
        breadcrumb={[{ label: "About Us" }]}
      />

      <UnderDevelopment
        planned={[
          "The full JMS Group story — founded in 2013, now over a decade deep in Gurugram's key micro-markets.",
          "Our vision and mission, stated plainly and held to.",
          "The leadership team, with names and accountability against every function.",
          "Awards, press coverage and RERA registrations in one verifiable place.",
          "Construction standards and the third-party audit reports behind them.",
        ]}
      />
    </>
  );
}

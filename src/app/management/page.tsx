import type { Metadata } from "next";
import { UnderDevelopment } from "@/components/common/under-development";
import { PageHero } from "@/components/layout/page-hero";

export const metadata: Metadata = {
  title: "Management",
  description:
    "The leadership team behind JMS Group — founders, directors and function heads.",
  alternates: { canonical: "/management" },
};

export default function ManagementPage() {
  return (
    <>
      <PageHero
        eyebrow="Leadership"
        title="The people accountable for it."
        description="Every function at JMS Group has a name against it. If something goes wrong on your project, you will know exactly whose desk it lands on."
        breadcrumb={[
          { label: "About Us", href: "/about" },
          { label: "Management" },
        ]}
      />

      <UnderDevelopment
        planned={[
          "Profiles for the founder, directors and every function head.",
          "The legacy and track record behind more than a decade in Gurugram.",
          "Direct escalation contacts for projects, sales and CRM.",
          "Board and governance structure.",
          "Press coverage and leadership commentary.",
        ]}
      />
    </>
  );
}

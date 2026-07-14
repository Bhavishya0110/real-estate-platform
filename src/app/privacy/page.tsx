import type { Metadata } from "next";
import { UnderDevelopment } from "@/components/common/under-development";
import { PageHero } from "@/components/layout/page-hero";

export const metadata: Metadata = {
  title: "Privacy & Legal",
  description:
    "How JMS Group collects, stores and uses your data, plus our terms and RERA disclosures.",
  alternates: { canonical: "/privacy" },
  robots: { index: false, follow: true },
};

export default function PrivacyPage() {
  return (
    <>
      <PageHero
        eyebrow="Legal"
        title="Privacy & legal disclosures."
        description="What we collect, why we collect it, how long we keep it, and how to make us delete it."
        breadcrumb={[{ label: "Privacy" }]}
      />

      <UnderDevelopment
        planned={[
          "The full privacy policy — data collected, lawful basis, retention and deletion.",
          "Cookie and analytics disclosure covering GA4, GTM and Hotjar.",
          "How enquiry data flows into the CRM, and who can see it.",
          "Terms of use and RERA disclaimers.",
          "A data-deletion request route, reviewed by legal before publication.",
        ]}
      />
    </>
  );
}

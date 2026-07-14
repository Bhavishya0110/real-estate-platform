import type { Metadata } from "next";
import { UnderDevelopment } from "@/components/common/under-development";
import { PageHero } from "@/components/layout/page-hero";

export const metadata: Metadata = {
  title: "Testimonials",
  description:
    "Reviews and video testimonials from JMS Group homeowners and investors.",
  alternates: { canonical: "/testimonials" },
};

export default function TestimonialsPage() {
  return (
    <>
      <PageHero
        eyebrow="Social Proof"
        title="A thousand customers. Ask any of them."
        description="We did not write these. Every review is tied to a real booking, a real handover and a real name."
        breadcrumb={[{ label: "Testimonials" }]}
      />

      <UnderDevelopment
        planned={[
          "The full review archive — text and video testimonials, with star ratings.",
          "Filter reviews by project.",
          "An embedded live Google Reviews widget.",
          "A 'Leave a Review' flow for verified homeowners.",
          "Video testimonials from Silver Living, The Pearl and Elegante residents.",
        ]}
      />
    </>
  );
}

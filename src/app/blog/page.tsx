import type { Metadata } from "next";
import { UnderDevelopment } from "@/components/common/under-development";
import { PageHero } from "@/components/layout/page-hero";

export const metadata: Metadata = {
  title: "Blog & Insights",
  description:
    "Market analysis, buying guides and project updates from the people who build in Gurugram.",
  alternates: { canonical: "/blog" },
};

export default function BlogPage() {
  return (
    <>
      <PageHero
        eyebrow="Insights"
        title="Read before you buy."
        description="Market analysis and buying guides from the people who actually build here — not a content farm."
        breadcrumb={[{ label: "Blog" }]}
      />

      <UnderDevelopment
        planned={[
          "The full article archive, with categories for market trends, buying guides and project updates.",
          "Search across every article.",
          "Related-article recommendations at the end of each piece.",
          "Author profiles and read-time estimates.",
          "SEO-friendly URLs, structured data and a sitemap entry per article.",
        ]}
      />
    </>
  );
}

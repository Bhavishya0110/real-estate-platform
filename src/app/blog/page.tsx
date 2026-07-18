import type { Metadata } from "next";
import { PageHero } from "@/components/layout/page-hero";
import { Container, Section } from "@/components/ui/container";
import { BlogList } from "@/features/blog/components/blog-list";
import { getBlogCategories, getBlogPosts } from "@/lib/data/content";

export const metadata: Metadata = {
  title: "Blog & Insights",
  description:
    "Market analysis, buying guides and project updates from the people who build in Gurugram.",
  alternates: { canonical: "/blog" },
};

export default async function BlogPage() {
  const [posts, categories] = await Promise.all([
    getBlogPosts(),
    getBlogCategories(),
  ]);

  return (
    <>
      <PageHero
        eyebrow="Insights"
        title="Read before you buy."
        description="Market analysis and buying guides from the people who actually build here — not a content farm."
        breadcrumb={[{ label: "Blog" }]}
      />

      <Section className="bg-white">
        <Container>
          <BlogList posts={posts} categories={categories} />
        </Container>
      </Section>
    </>
  );
}

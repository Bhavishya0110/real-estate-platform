import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { UnderDevelopment } from "@/components/common/under-development";
import { PageHero } from "@/components/layout/page-hero";
import { getBlogPostBySlug, getBlogPosts } from "@/lib/data/content";
import { formatDate } from "@/lib/format";

/** Linked from the homepage Blog & Insights cards, so it must resolve today. */
export async function generateStaticParams() {
  const posts = await getBlogPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) return { title: "Article Not Found" };

  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `/blog/${post.slug}` },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) notFound();

  return (
    <>
      <PageHero
        eyebrow={`${post.category} · ${formatDate(post.publishedAt)} · ${post.readTimeMinutes} min read`}
        title={post.title}
        description={post.excerpt}
        breadcrumb={[{ label: "Blog", href: "/blog" }, { label: post.category }]}
      />

      <UnderDevelopment
        planned={[
          `The full article by ${post.author}, with editorial layout and pull quotes.`,
          "Related-article recommendations at the end of the piece.",
          "Share links and a newsletter opt-in.",
          "Article structured data for rich search results.",
          "Author profile and archive.",
        ]}
      />
    </>
  );
}

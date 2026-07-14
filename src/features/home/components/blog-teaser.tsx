import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container, Section } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { getBlogPosts } from "@/lib/data/content";
import { formatDate } from "@/lib/format";

/**
 * BRD Home blueprint §09 — Blog & Insights:
 * latest 3 articles (market trends, buying guides, project updates),
 * with date + read time. CTAs: Read Article · View All.
 */
export async function BlogTeaser() {
  const posts = await getBlogPosts(3);

  return (
    <Section>
      <Container>
        <SectionHeading
          eyebrow="Insights"
          title="Read before you buy."
          description="Market analysis and buying guides from the people who actually build here — not a content farm."
          action={
            <Button href="/blog" variant="outline" size="md">
              View All Articles
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          }
        />

        <div className="mt-10 grid gap-8 sm:mt-14 sm:grid-cols-2 md:grid-cols-3">
          {posts.map((post) => (
            <article
              key={post.id}
              className="group relative flex flex-col border-t-2 border-navy-900 pt-6 transition-colors duration-300 hover:border-gold-500"
            >
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span className="eyebrow text-gold-600">{post.category}</span>
                <span aria-hidden="true" className="hidden sm:inline">
                  ·
                </span>
                <time dateTime={post.publishedAt}>
                  {formatDate(post.publishedAt)}
                </time>
              </div>

              <h3 className="mt-4 text-lg leading-snug text-navy-900 transition-colors group-hover:text-navy-700 sm:text-xl">
                <Link
                  href={`/blog/${post.slug}`}
                  className="after:absolute after:inset-0 after:content-['']"
                >
                  {post.title}
                </Link>
              </h3>

              <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                {post.excerpt}
              </p>

              <div className="mt-6 flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="size-3.5" aria-hidden="true" />
                  {post.readTimeMinutes} min read
                </span>

                <span
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-navy-900 transition-colors group-hover:text-gold-600"
                  aria-hidden="true"
                >
                  Read Article
                  <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
                </span>
              </div>
            </article>
          ))}
        </div>
      </Container>
    </Section>
  );
}

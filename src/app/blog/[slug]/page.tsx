import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Clock, User } from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";
import { Button } from "@/components/ui/button";
import { Container, Section } from "@/components/ui/container";
import { getBlogPostBySlug, getBlogPosts } from "@/lib/data/content";
import { formatDate } from "@/lib/format";

/** Linked from the homepage teaser and the blog listing, so it must resolve. */
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
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      publishedTime: post.publishedAt,
      authors: [post.author],
    },
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

  const related = (await getBlogPosts()).filter(
    (item) => item.slug !== post.slug,
  );

  return (
    <>
      <PageHero
        eyebrow={post.category}
        title={post.title}
        description={post.excerpt}
        breadcrumb={[{ label: "Blog", href: "/blog" }, { label: post.category }]}
      />

      <Section className="bg-white">
        <Container>
          <div className="mx-auto max-w-3xl">
            {/* --- Byline -------------------------------------------------- */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-border pb-6 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <User className="size-4 text-gold-600" aria-hidden="true" />
                {post.author}
              </span>
              <time dateTime={post.publishedAt}>
                {formatDate(post.publishedAt)}
              </time>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="size-3.5" aria-hidden="true" />
                {post.readTimeMinutes} min read
              </span>
            </div>

            {/* --- Body ---------------------------------------------------- */}
            <div className="mt-10 space-y-10">
              {post.content.map((section) => (
                <section key={section.heading}>
                  <h2 className="font-display text-2xl text-navy-900 sm:text-3xl">
                    {section.heading}
                  </h2>
                  <p className="mt-4 leading-relaxed text-muted-foreground">
                    {section.body}
                  </p>
                </section>
              ))}
            </div>

            {/* --- Advisor note -------------------------------------------- */}
            <div className="mt-14 rounded-sm bg-navy-900 p-8 sm:p-10">
              <h2 className="text-xl text-white sm:text-2xl">
                Want this applied to your own shortlist?
              </h2>
              <p className="mt-3 leading-relaxed text-navy-200">
                Send us your budget and where you work. An advisor will tell you
                which of our projects fit — and which to rule out.
              </p>
              <Button href="/contact" variant="gold" size="lg" className="mt-6">
                Talk to an Advisor
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </Container>
      </Section>

      {/* --- Related articles ------------------------------------------- */}
      {related.length > 0 ? (
        <Section className="bg-navy-50">
          <Container>
            <div className="mx-auto max-w-5xl">
              <h2 className="eyebrow font-sans text-gold-600">
                Related reading
              </h2>

              <div className="mt-8 grid gap-8 sm:grid-cols-2">
                {related.map((item) => (
                  <article
                    key={item.id}
                    className="group relative border-t-2 border-navy-900 pt-6 transition-colors duration-300 hover:border-gold-500"
                  >
                    <span className="eyebrow text-gold-600">
                      {item.category}
                    </span>

                    <h3 className="mt-3 font-display text-xl leading-snug text-navy-900">
                      <Link
                        href={`/blog/${item.slug}`}
                        className="after:absolute after:inset-0 after:content-['']"
                      >
                        {item.title}
                      </Link>
                    </h3>

                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {item.excerpt}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </Container>
        </Section>
      ) : null}
    </>
  );
}

"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Clock } from "lucide-react";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { BlogPost } from "@/types";

/**
 * BRD §5 Blog — "Display articles, categorise blogs, search blogs".
 * Category filtering lives here; free-text search is a Phase 3 deliverable.
 */
export function BlogList({
  posts,
  categories,
}: {
  posts: BlogPost[];
  categories: string[];
}) {
  const [category, setCategory] = useState<string>("All");

  const visible = useMemo(
    () =>
      category === "All"
        ? posts
        : posts.filter((post) => post.category === category),
    [posts, category],
  );

  return (
    <div>
      {/* --- Category filter ---------------------------------------------- */}
      <div
        role="group"
        aria-label="Filter articles by category"
        className="flex flex-wrap gap-2"
      >
        {["All", ...categories].map((option) => {
          const active = option === category;

          return (
            <button
              key={option}
              type="button"
              aria-pressed={active}
              onClick={() => setCategory(option)}
              className={cn(
                "h-11 rounded-sm border px-4 text-sm font-medium tracking-wide transition-all duration-200 sm:px-5",
                active
                  ? "border-navy-900 bg-navy-900 text-white"
                  : "border-border bg-white text-navy-700 hover:border-navy-900/40 hover:bg-navy-50",
              )}
            >
              {option}
            </button>
          );
        })}
      </div>

      {/* --- Articles ------------------------------------------------------ */}
      <div className="mt-10 grid gap-8 sm:grid-cols-2 md:gap-10 lg:grid-cols-3">
        {visible.map((post) => (
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

            <h2 className="mt-4 font-display text-xl leading-snug text-navy-900 transition-colors group-hover:text-navy-700">
              <Link
                href={`/blog/${post.slug}`}
                className="after:absolute after:inset-0 after:content-['']"
              >
                {post.title}
              </Link>
            </h2>

            <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
              {post.excerpt}
            </p>

            <div className="mt-6 flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="size-3.5" aria-hidden="true" />
                {post.readTimeMinutes} min read
              </span>

              <span
                aria-hidden="true"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-navy-900 transition-colors group-hover:text-gold-600"
              >
                Read Article
                <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
              </span>
            </div>
          </article>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="mt-10 rounded-sm border border-dashed border-border bg-navy-50 p-10 text-center text-sm text-muted-foreground">
          No articles in this category yet.
        </p>
      ) : null}
    </div>
  );
}

import type { MetadataRoute } from "next";
import { getBlogPosts, getJobs } from "@/lib/data/content";
import { getProjects } from "@/lib/data/projects";
import { absoluteUrl } from "@/lib/schema";

/** BRD §7 SEO — "All pages include metadata, SEO-friendly URLs, and sitemap support." */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [projects, posts, jobs] = await Promise.all([
    getProjects(),
    getBlogPosts(),
    getJobs(),
  ]);

  // The build stamps this once. Nothing here is edited at runtime — content
  // changes arrive with a deployment — so the build time is the honest answer.
  const lastModified = new Date();

  /* `/privacy` is deliberately absent: robots.ts disallows it and the page
     itself sets `robots: { index: false }`. Advertising a URL in the sitemap
     that the same site tells crawlers to skip is a contradiction search
     consoles report as an error. */
  const staticRoutes: { path: string; priority: number }[] = [
    { path: "", priority: 1 },
    { path: "/projects", priority: 0.9 },
    { path: "/residential", priority: 0.9 },
    { path: "/commercial", priority: 0.9 },
    { path: "/about", priority: 0.7 },
    { path: "/management", priority: 0.5 },
    { path: "/blog", priority: 0.7 },
    { path: "/gallery", priority: 0.6 },
    { path: "/testimonials", priority: 0.6 },
    { path: "/careers", priority: 0.6 },
    { path: "/contact", priority: 0.8 },
    { path: "/faq", priority: 0.6 },
    { path: "/emi-calculator", priority: 0.6 },
    { path: "/virtual-tour", priority: 0.5 },
  ];

  return [
    ...staticRoutes.map(({ path, priority }) => ({
      url: absoluteUrl(path || "/"),
      lastModified,
      changeFrequency: "weekly" as const,
      priority,
    })),
    ...projects.map((project) => ({
      url: absoluteUrl(`/projects/${project.slug}`),
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    })),
    ...posts.map((post) => ({
      url: absoluteUrl(`/blog/${post.slug}`),
      // Articles carry a real publish date, so use it rather than the build.
      lastModified: new Date(post.publishedAt),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...jobs.map((job) => ({
      url: absoluteUrl(`/careers/${job.slug}`),
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
  ];
}

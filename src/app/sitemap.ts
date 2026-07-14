import type { MetadataRoute } from "next";
import { getBlogPosts, getJobs } from "@/lib/data/content";
import { getProjects } from "@/lib/data/projects";

const BASE = "https://jmsgroup.co.in";

/** BRD §7 SEO — "All pages include metadata, SEO-friendly URLs, and sitemap support." */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [projects, posts, jobs] = await Promise.all([
    getProjects(),
    getBlogPosts(),
    getJobs(),
  ]);

  const staticRoutes = [
    "",
    "/about",
    "/management",
    "/projects",
    "/residential",
    "/commercial",
    "/blog",
    "/gallery",
    "/testimonials",
    "/careers",
    "/contact",
    "/faq",
    "/privacy",
    "/emi-calculator",
    "/virtual-tour",
  ].map((route) => ({
    url: `${BASE}${route}`,
    changeFrequency: "weekly" as const,
    priority: route === "" ? 1 : 0.8,
  }));

  return [
    ...staticRoutes,
    ...projects.map((project) => ({
      url: `${BASE}/projects/${project.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    })),
    ...posts.map((post) => ({
      url: `${BASE}/blog/${post.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...jobs.map((job) => ({
      url: `${BASE}/careers/${job.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
  ];
}

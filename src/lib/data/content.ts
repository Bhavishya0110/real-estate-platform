import blogJson from "@/data/blog.json";
import jobsJson from "@/data/jobs.json";
import navigationJson from "@/data/navigation.json";
import pillarsJson from "@/data/pillars.json";
import siteJson from "@/data/site.json";
import statsJson from "@/data/stats.json";
import testimonialsJson from "@/data/testimonials.json";
import type {
  BlogPost,
  Job,
  NavLink,
  SiteConfig,
  Stat,
  Testimonial,
  ValuePillar,
} from "@/types";

/**
 * CONTENT REPOSITORY
 *
 * Same contract as the project repository: JSON in, domain types out.
 * Replace the bodies with Prisma/CMS calls tomorrow — signatures stay identical.
 */

/** Site config is static branding, so it is exported directly (no await needed). */
export const siteConfig = siteJson as SiteConfig;

export const navigation = navigationJson as {
  main: NavLink[];
  explore: NavLink[];
  company: NavLink[];
};

export async function getStats(): Promise<Stat[]> {
  return statsJson as Stat[];
}

export async function getPillars(): Promise<ValuePillar[]> {
  return pillarsJson as ValuePillar[];
}

export async function getTestimonials(): Promise<Testimonial[]> {
  return testimonialsJson as Testimonial[];
}

export async function getBlogPosts(limit?: number): Promise<BlogPost[]> {
  const posts = [...(blogJson as BlogPost[])].sort(
    (a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt),
  );
  return limit ? posts.slice(0, limit) : posts;
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  return (blogJson as BlogPost[]).find((post) => post.slug === slug) ?? null;
}

export async function getJobs(limit?: number): Promise<Job[]> {
  const jobs = jobsJson as Job[];
  return limit ? jobs.slice(0, limit) : jobs;
}

export async function getJobBySlug(slug: string): Promise<Job | null> {
  return (jobsJson as Job[]).find((job) => job.slug === slug) ?? null;
}

export async function getJobCount(): Promise<number> {
  return (jobsJson as Job[]).length;
}

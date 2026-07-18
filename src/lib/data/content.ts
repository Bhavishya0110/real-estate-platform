import blogJson from "@/data/blog.json";
import faqJson from "@/data/faq.json";
import jobsJson from "@/data/jobs.json";
import leadershipJson from "@/data/leadership.json";
import legalJson from "@/data/legal.json";
import milestonesJson from "@/data/milestones.json";
import navigationJson from "@/data/navigation.json";
import pillarsJson from "@/data/pillars.json";
import siteJson from "@/data/site.json";
import statsJson from "@/data/stats.json";
import testimonialsJson from "@/data/testimonials.json";
import type {
  BlogPost,
  FaqItem,
  Job,
  Leader,
  LegalDocument,
  Milestone,
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

export async function getLeadership(limit?: number): Promise<Leader[]> {
  const leaders = leadershipJson as Leader[];
  return limit ? leaders.slice(0, limit) : leaders;
}

export async function getMilestones(): Promise<Milestone[]> {
  return milestonesJson as Milestone[];
}

/** Distinct blog categories, for the listing filter. */
export async function getBlogCategories(): Promise<string[]> {
  return [...new Set((blogJson as BlogPost[]).map((post) => post.category))];
}

export async function getFaqs(): Promise<FaqItem[]> {
  return faqJson as FaqItem[];
}

/** FAQ grouped by category, in the order the categories first appear. */
export async function getFaqsByCategory(): Promise<
  { category: string; items: FaqItem[] }[]
> {
  const faqs = faqJson as FaqItem[];
  const categories = [...new Set(faqs.map((faq) => faq.category))];

  return categories.map((category) => ({
    category,
    items: faqs.filter((faq) => faq.category === category),
  }));
}

export async function getLegalDocument(): Promise<LegalDocument> {
  return legalJson as LegalDocument;
}

/** Distinct departments present in the openings, for the careers filter. */
export async function getJobDepartments(): Promise<string[]> {
  return [...new Set((jobsJson as Job[]).map((job) => job.department))];
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

import { contentRepository } from "@/lib/repositories";
import type {
  BlogPost,
  FaqItem,
  Job,
  Leader,
  LegalDocument,
  Milestone,
  Stat,
  Testimonial,
  ValuePillar,
} from "@/types";

/**
 * CONTENT READ API
 *
 * Signatures unchanged from the JSON era on purpose — every page and component
 * calling them is untouched by the PostgreSQL migration. The bodies delegate to
 * whichever `ContentReadRepository` the composition root selected.
 */

/**
 * `siteConfig` and `navigation` have moved to `@/lib/data/site-config`.
 *
 * This module reaches the repository layer, which reaches Prisma, which is
 * `server-only`. Re-exporting the static constants from here would pull the
 * database client into every client component that reads the company phone
 * number — the navbar, the global error boundary — and fail the build.
 */

export async function getStats(): Promise<Stat[]> {
  return contentRepository.stats();
}

export async function getPillars(): Promise<ValuePillar[]> {
  return contentRepository.pillars();
}

export async function getTestimonials(): Promise<Testimonial[]> {
  return contentRepository.testimonials();
}

export async function getLeadership(limit?: number): Promise<Leader[]> {
  return contentRepository.leadership(limit);
}

export async function getMilestones(): Promise<Milestone[]> {
  return contentRepository.milestones();
}

/** Distinct blog categories, for the listing filter. */
export async function getBlogCategories(): Promise<string[]> {
  return contentRepository.blogCategories();
}

export async function getFaqs(): Promise<FaqItem[]> {
  return contentRepository.faqs();
}

/** FAQ grouped by category, in the order the categories first appear. */
export async function getFaqsByCategory(): Promise<
  { category: string; items: FaqItem[] }[]
> {
  return contentRepository.faqsByCategory();
}

export async function getLegalDocument(): Promise<LegalDocument> {
  return contentRepository.legalDocument();
}

/** Distinct departments present in the openings, for the careers filter. */
export async function getJobDepartments(): Promise<string[]> {
  return contentRepository.jobDepartments();
}

export async function getBlogPosts(limit?: number): Promise<BlogPost[]> {
  return contentRepository.blogPosts(limit);
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  return contentRepository.blogPostBySlug(slug);
}

export async function getJobs(limit?: number): Promise<Job[]> {
  return contentRepository.jobs(limit);
}

export async function getJobBySlug(slug: string): Promise<Job | null> {
  return contentRepository.jobBySlug(slug);
}

export async function getJobCount(): Promise<number> {
  return contentRepository.jobCount();
}

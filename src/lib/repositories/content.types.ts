import type {
  BlogPost,
  FaqItem,
  Job,
  Leader,
  LegalDocument,
  Milestone,
  NavLink,
  Project,
  ProjectCategory,
  SiteConfig,
  Stat,
  Testimonial,
  ValuePillar,
} from "@/types";

/**
 * READ CONTRACTS FOR THE PUBLIC SITE
 *
 * `src/lib/data/*` has always been the app's read API — plain async functions
 * returning domain types. These interfaces make the implementation behind those
 * functions swappable in the composition root, exactly as the lead and callback
 * repositories already were.
 *
 * The method names and return types mirror the existing exported functions
 * one-for-one, so nothing that consumes them changes.
 */

export interface ProjectReadRepository {
  findAll(): Promise<Project[]>;
  findFeatured(limit?: number): Promise<Project[]>;
  findBySlug(slug: string): Promise<Project | null>;
  findResidential(): Promise<Project[]>;
  findCommercial(): Promise<Project[]>;
  findRelated(slug: string, limit?: number): Promise<Project[]>;
  categories(): Promise<ProjectCategory[]>;
  count(): Promise<number>;
}

export interface ContentReadRepository {
  stats(): Promise<Stat[]>;
  pillars(): Promise<ValuePillar[]>;
  testimonials(): Promise<Testimonial[]>;
  leadership(limit?: number): Promise<Leader[]>;
  milestones(): Promise<Milestone[]>;
  blogCategories(): Promise<string[]>;
  blogPosts(limit?: number): Promise<BlogPost[]>;
  blogPostBySlug(slug: string): Promise<BlogPost | null>;
  faqs(): Promise<FaqItem[]>;
  faqsByCategory(): Promise<{ category: string; items: FaqItem[] }[]>;
  legalDocument(): Promise<LegalDocument>;
  jobs(limit?: number): Promise<Job[]>;
  jobBySlug(slug: string): Promise<Job | null>;
  jobDepartments(): Promise<string[]>;
  jobCount(): Promise<number>;
}

/**
 * Site configuration and menus.
 *
 * These are read synchronously today (`siteConfig`, `navigation` are exported
 * constants used in module scope and in metadata generation), so the contract
 * exposes an async loader plus the cached snapshot the synchronous callers use.
 */
export interface SiteConfigRepository {
  config(): Promise<SiteConfig>;
  navigation(): Promise<{
    main: NavLink[];
    explore: NavLink[];
    company: NavLink[];
  }>;
}

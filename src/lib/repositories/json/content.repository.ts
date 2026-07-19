import blogJson from "@/data/blog.json";
import faqJson from "@/data/faq.json";
import jobsJson from "@/data/jobs.json";
import leadershipJson from "@/data/leadership.json";
import legalJson from "@/data/legal.json";
import milestonesJson from "@/data/milestones.json";
import navigationJson from "@/data/navigation.json";
import pillarsJson from "@/data/pillars.json";
import projectsJson from "@/data/projects.json";
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
  Project,
  ProjectCategory,
  SiteConfig,
  Stat,
  Testimonial,
  ValuePillar,
} from "@/types";
import type {
  ContentReadRepository,
  ProjectReadRepository,
  SiteConfigRepository,
} from "../content.types";

/**
 * THE JSON IMPLEMENTATIONS, PRESERVED.
 *
 * These are the original `src/lib/data` bodies, moved behind the same contracts
 * the Prisma versions implement. They are not dead code: the composition root
 * falls back to them when no database is configured, which keeps the site
 * buildable and runnable on a machine with no credentials — a contributor
 * cloning the repository, or a CI job that only needs to typecheck.
 *
 * Keeping them also made the migration checkable: both implementations satisfy
 * one interface, so their outputs can be compared row for row.
 */

const projects = projectsJson as Project[];

const RESIDENTIAL_CATEGORIES: ProjectCategory[] = [
  "Residential",
  "Plots",
  "Senior Living",
  "Luxury",
];

export class JsonProjectRepository implements ProjectReadRepository {
  async findAll(): Promise<Project[]> {
    return projects;
  }

  async findFeatured(limit = 6): Promise<Project[]> {
    const featured = projects.filter((project) => project.featured);
    const filler = projects.filter((project) => !project.featured);
    return [...featured, ...filler].slice(0, limit);
  }

  async findBySlug(slug: string): Promise<Project | null> {
    return projects.find((project) => project.slug === slug) ?? null;
  }

  async findResidential(): Promise<Project[]> {
    return projects.filter((project) =>
      RESIDENTIAL_CATEGORIES.includes(project.category),
    );
  }

  async findCommercial(): Promise<Project[]> {
    return projects.filter((project) => project.category === "Commercial");
  }

  async findRelated(slug: string, limit = 3): Promise<Project[]> {
    const current = projects.find((project) => project.slug === slug);
    if (!current) return projects.slice(0, limit);

    const others = projects.filter((project) => project.slug !== slug);
    const sameCategory = others.filter(
      (project) => project.category === current.category,
    );
    const rest = others.filter((project) => project.category !== current.category);

    return [...sameCategory, ...rest].slice(0, limit);
  }

  async categories(): Promise<ProjectCategory[]> {
    return [...new Set(projects.map((project) => project.category))];
  }

  async count(): Promise<number> {
    return projects.length;
  }
}

export class JsonContentRepository implements ContentReadRepository {
  async stats(): Promise<Stat[]> {
    return statsJson as Stat[];
  }

  async pillars(): Promise<ValuePillar[]> {
    return pillarsJson as ValuePillar[];
  }

  async testimonials(): Promise<Testimonial[]> {
    return testimonialsJson as Testimonial[];
  }

  async leadership(limit?: number): Promise<Leader[]> {
    const leaders = leadershipJson as Leader[];
    return limit ? leaders.slice(0, limit) : leaders;
  }

  async milestones(): Promise<Milestone[]> {
    return milestonesJson as Milestone[];
  }

  async blogCategories(): Promise<string[]> {
    return [...new Set((blogJson as BlogPost[]).map((post) => post.category))];
  }

  async blogPosts(limit?: number): Promise<BlogPost[]> {
    const posts = [...(blogJson as BlogPost[])].sort(
      (a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt),
    );
    return limit ? posts.slice(0, limit) : posts;
  }

  async blogPostBySlug(slug: string): Promise<BlogPost | null> {
    return (blogJson as BlogPost[]).find((post) => post.slug === slug) ?? null;
  }

  async faqs(): Promise<FaqItem[]> {
    return faqJson as FaqItem[];
  }

  async faqsByCategory(): Promise<{ category: string; items: FaqItem[] }[]> {
    const faqs = faqJson as FaqItem[];
    const categories = [...new Set(faqs.map((faq) => faq.category))];
    return categories.map((category) => ({
      category,
      items: faqs.filter((faq) => faq.category === category),
    }));
  }

  async legalDocument(): Promise<LegalDocument> {
    return legalJson as LegalDocument;
  }

  async jobs(limit?: number): Promise<Job[]> {
    const jobs = jobsJson as Job[];
    return limit ? jobs.slice(0, limit) : jobs;
  }

  async jobBySlug(slug: string): Promise<Job | null> {
    return (jobsJson as Job[]).find((job) => job.slug === slug) ?? null;
  }

  async jobDepartments(): Promise<string[]> {
    return [...new Set((jobsJson as Job[]).map((job) => job.department))];
  }

  async jobCount(): Promise<number> {
    return (jobsJson as Job[]).length;
  }
}

export class JsonSiteConfigRepository implements SiteConfigRepository {
  async config(): Promise<SiteConfig> {
    return siteJson as SiteConfig;
  }

  async navigation(): Promise<{
    main: NavLink[];
    explore: NavLink[];
    company: NavLink[];
  }> {
    return navigationJson as {
      main: NavLink[];
      explore: NavLink[];
      company: NavLink[];
    };
  }
}

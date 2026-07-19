import { siteConfig } from "@/lib/data/site-config";
import type { BlogPost, Job, Project } from "@/types";

/**
 * JSON-LD builders.
 *
 * Kept in one place so every page emits the same shapes, and so the canonical
 * base URL is defined once.
 */

/**
 * The canonical origin, with no trailing slash.
 *
 * Environment-backed so a preview or staging deployment advertises its own
 * origin instead of emitting production canonicals that point search engines
 * (and social scrapers) at a different site. Production simply leaves the
 * variable unset and gets the real domain.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://jmsgroup.co.in"
).replace(/\/+$/, "");

/** An absolute URL for a site-relative path. */
export function absoluteUrl(path = "/"): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * The organisation itself — emitted once, in the root layout, so every page
 * inherits it and search engines can resolve the brand, its contact route and
 * its verified social profiles.
 */
export const organizationSchema: Record<string, unknown> = {
  "@context": "https://schema.org",
  "@type": "RealEstateAgent",
  "@id": `${SITE_URL}/#organization`,
  name: siteConfig.legalName,
  alternateName: siteConfig.name,
  url: SITE_URL,
  description: siteConfig.description,
  foundingDate: String(siteConfig.foundedYear),
  telephone: siteConfig.phone,
  email: siteConfig.email,
  address: {
    "@type": "PostalAddress",
    streetAddress: "M3M Tee Point, 7th Floor, North Block, Sector 65",
    addressLocality: "Gurugram",
    addressRegion: "Haryana",
    postalCode: "122018",
    addressCountry: "IN",
  },
  areaServed: "Gurugram and the National Capital Region",
  sameAs: siteConfig.social.map((social) => social.href),
};

/** The site as a searchable entity. */
export const websiteSchema: Record<string, unknown> = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  url: SITE_URL,
  name: siteConfig.name,
  description: siteConfig.description,
  publisher: { "@id": `${SITE_URL}/#organization` },
};

/**
 * A published article.
 *
 * `BlogPosting` rather than the generic `Article` — it is the type Google
 * expects for editorial posts, and it inherits everything `Article` offers.
 */
export function blogPostingSchema(post: BlogPost): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.publishedAt,
    // No editorial revision history is tracked, so the publish date is the
    // honest answer for both rather than inventing a modification date.
    dateModified: post.publishedAt,
    articleSection: post.category,
    wordCount: post.content.reduce(
      (total, section) => total + section.body.split(/\s+/).length,
      0,
    ),
    timeRequired: `PT${post.readTimeMinutes}M`,
    author: { "@type": "Person", name: post.author },
    publisher: { "@id": `${SITE_URL}/#organization` },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": absoluteUrl(`/blog/${post.slug}`),
    },
  };
}

/**
 * An open role.
 *
 * `hiringOrganization` and `jobLocation` are the two fields Google treats as
 * mandatory for a job rich result; the rest is what we actually hold. Salary is
 * deliberately absent — it is not in the data, and guessing one would be worse
 * than omitting it.
 */
export function jobPostingSchema(job: Job): Record<string, unknown> {
  const EMPLOYMENT_TYPE: Record<Job["type"], string> = {
    "Full-time": "FULL_TIME",
    "Part-time": "PART_TIME",
    Contract: "CONTRACTOR",
  };

  return {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: [
      job.summary,
      `Responsibilities: ${job.responsibilities.join("; ")}`,
      `Requirements: ${job.requirements.join("; ")}`,
    ].join(" "),
    employmentType: EMPLOYMENT_TYPE[job.type],
    occupationalCategory: job.department,
    experienceRequirements: job.experience,
    url: absoluteUrl(`/careers/${job.slug}`),
    hiringOrganization: { "@id": `${SITE_URL}/#organization` },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: job.location,
        addressRegion: "Haryana",
        addressCountry: "IN",
      },
    },
  };
}

/** BreadcrumbList — helps search engines render the trail under a result. */
export function breadcrumbSchema(
  crumbs: { name: string; path: string }[],
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  };
}

/**
 * A project, described as a Residence or a real-estate listing.
 *
 * Only fields we actually hold are emitted — an absent price or possession date
 * is omitted rather than guessed, for the same reason the assistant refuses to
 * invent one.
 */
export function projectSchema(project: Project): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Residence",
    name: project.name,
    description: project.description,
    url: absoluteUrl(`/projects/${project.slug}`),
    address: {
      "@type": "PostalAddress",
      streetAddress: project.location,
      addressLocality: project.city,
      addressRegion: "Haryana",
      addressCountry: "IN",
    },
    ...(project.amenities.length > 0
      ? {
          amenityFeature: project.amenities.map((amenity) => ({
            "@type": "LocationFeatureSpecification",
            name: amenity,
            value: true,
          })),
        }
      : {}),
    ...(project.priceFrom > 0
      ? {
          offers: {
            "@type": "Offer",
            price: project.priceFrom,
            priceCurrency: "INR",
            availability:
              project.status === "Ready to Move" || project.status === "Available"
                ? "https://schema.org/InStock"
                : "https://schema.org/PreOrder",
          },
        }
      : {}),
  };
}

import type { Project } from "@/types";

/**
 * JSON-LD builders.
 *
 * Kept in one place so every page emits the same shapes, and so the canonical
 * base URL is defined once.
 */

export const SITE_URL = "https://jmsgroup.co.in";

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
      item: `${SITE_URL}${crumb.path}`,
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
    url: `${SITE_URL}/projects/${project.slug}`,
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

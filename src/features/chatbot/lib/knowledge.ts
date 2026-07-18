import { getFaqs, siteConfig } from "@/lib/data/content";
import { getProjects } from "@/lib/data/projects";
import type { KnowledgeSnapshot } from "../types";

/**
 * KNOWLEDGE SERVICE
 *
 * Builds the assistant's entire world from the existing repository layer — the
 * same functions the pages use. Nothing else is in scope for the assistant, by
 * construction: if a fact is not in this snapshot, the engine cannot state it.
 *
 * Because it reads through the repository rather than the JSON files directly,
 * swapping JSON for Prisma later changes nothing here.
 */
export async function buildKnowledgeSnapshot(): Promise<KnowledgeSnapshot> {
  const [projects, faqs] = await Promise.all([getProjects(), getFaqs()]);

  return {
    // Trimmed to the fields the assistant actually reasons over, so the payload
    // shipped to the browser stays small.
    projects: projects.map((project) => ({
      slug: project.slug,
      name: project.name,
      category: project.category,
      status: project.status,
      tagline: project.tagline,
      description: project.description,
      location: project.location,
      city: project.city,
      priceLabel: project.priceLabel,
      priceFrom: project.priceFrom,
      configurations: project.configurations,
      areaRange: project.areaRange,
      possession: project.possession,
      amenities: project.amenities,
      hasVirtualTour: project.hasVirtualTour,
      hasBrochure: project.hasBrochure,
    })),

    faqs: faqs.map((faq) => ({
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
    })),

    company: {
      name: siteConfig.name,
      phone: siteConfig.phone,
      whatsapp: siteConfig.whatsapp,
      email: siteConfig.email,
      address: siteConfig.address,
      foundedYear: siteConfig.foundedYear,
    },
  };
}

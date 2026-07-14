import { getProjectBySlug } from "@/lib/data/projects";
import { HighlightCarousel } from "./highlight-carousel";
import type { Project } from "@/types";

/**
 * BRD Home blueprint §06 — Premium Highlights:
 * full-width rotating banner for Majestic, Marine Square and Pearl.
 * CTAs: Explore · Book Visit.
 */
const HIGHLIGHTED = ["majestic", "marine-square", "pearl"];

export async function PremiumHighlights() {
  const projects = (
    await Promise.all(HIGHLIGHTED.map((slug) => getProjectBySlug(slug)))
  ).filter((project): project is Project => project !== null);

  if (projects.length === 0) return null;

  return <HighlightCarousel projects={projects} />;
}

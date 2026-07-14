import type { Metadata } from "next";
import { BlogTeaser } from "@/features/home/components/blog-teaser";
import { CareerTeaser } from "@/features/home/components/career-teaser";
import { EmiSection } from "@/features/home/components/emi-section";
import { FeaturedProjects } from "@/features/home/components/featured-projects";
import { Hero } from "@/features/home/components/hero";
import { PremiumHighlights } from "@/features/home/components/premium-highlights";
import { Testimonials } from "@/features/home/components/testimonials";
import { TrustBar } from "@/features/home/components/trust-bar";
import { WhyChooseUs } from "@/features/home/components/why-choose-us";
import { siteConfig } from "@/lib/data/content";

export const metadata: Metadata = {
  title: `${siteConfig.name} — ${siteConfig.tagline}`,
  description: siteConfig.description,
  alternates: { canonical: "/" },
};

/**
 * HOME — assembled exactly to the BRD's section-by-section blueprint.
 *
 *   01 Navigation Bar ....... <Navbar />           (root layout)
 *   02 Hero Section ......... <Hero />
 *   03 Trust Bar ............ <TrustBar />
 *   04 Featured Projects .... <FeaturedProjects />
 *   05 Why Choose Us ........ <WhyChooseUs />
 *   06 Premium Highlights ... <PremiumHighlights />
 *   07 EMI Calculator ....... <EmiSection />
 *   08 Testimonials ......... <Testimonials />
 *   09 Blog & Insights ...... <BlogTeaser />
 *   10 Career Teaser ........ <CareerTeaser />
 *   11 Chatbot Bubble ....... <FloatingActions />  (root layout)
 *   12 Footer ............... <Footer />           (root layout)
 *
 * Every section is a server component reading from the repository layer, so the
 * page ships as static HTML with JS only where there is real interaction —
 * which is what keeps us inside the BRD's 2-second load budget (§7).
 */
export default function HomePage() {
  return (
    <>
      <Hero />
      <TrustBar />
      <FeaturedProjects />
      <WhyChooseUs />
      <PremiumHighlights />
      <EmiSection />
      <Testimonials />
      <BlogTeaser />
      <CareerTeaser />
    </>
  );
}

import type { Metadata } from "next";
import { UnderDevelopment } from "@/components/common/under-development";
import { PageHero } from "@/components/layout/page-hero";

export const metadata: Metadata = {
  title: "Gallery",
  description:
    "Photography, drone footage and project films from across the JMS Group portfolio.",
  alternates: { canonical: "/gallery" },
};

export default function GalleryPage() {
  return (
    <>
      <PageHero
        eyebrow="Media"
        title="See it before you visit."
        description="Project photography, drone visuals, construction progress and handover films — organised by project so you can find exactly what you came for."
        breadcrumb={[{ label: "Gallery" }]}
      />

      <UnderDevelopment
        planned={[
          "Image and video galleries, categorised by project and by media type.",
          "Drone flythroughs and lifestyle photography for every address.",
          "Construction-progress updates, published month by month.",
          "A project video hub — site progress, testimonials and handover ceremonies.",
          "Lazy-loaded and CDN-served, to hold the sub-two-second load budget.",
        ]}
      />
    </>
  );
}

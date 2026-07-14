import type { Metadata } from "next";
import { UnderDevelopment } from "@/components/common/under-development";
import { PageHero } from "@/components/layout/page-hero";

export const metadata: Metadata = {
  title: "Virtual Tour",
  description:
    "Walk through JMS Group show homes and retail units in 360° — from anywhere.",
  alternates: { canonical: "/virtual-tour" },
};

export default function VirtualTourPage() {
  return (
    <>
      <PageHero
        eyebrow="Immersive"
        title="Walk the home from wherever you are."
        description="For buyers who are not in Gurugram this week — a full 360° walkthrough of the show home, room by room, at your own pace."
        breadcrumb={[{ label: "Virtual Tour" }]}
      />

      <UnderDevelopment
        planned={[
          "360° walkthroughs, launchable from any project page.",
          "Room-by-room navigation with hotspot annotations.",
          "Available today for Crosswalk, Marine Square, The Pearl, Silver Living, The Majestic, Mega City and Capital Square.",
          "Guided live tours, hosted over video with a sales advisor.",
          "A 'Book a Site Visit' handoff at the end of every tour.",
        ]}
        phase="Phase 2"
      />
    </>
  );
}

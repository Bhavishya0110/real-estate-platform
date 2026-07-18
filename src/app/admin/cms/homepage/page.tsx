import type { Metadata } from "next";
import { PlaceholderModule } from "@/features/admin/components/placeholder-module";

export const metadata: Metadata = { title: "Homepage CMS" };

export default function AdminHomepageCmsPage() {
  return (
    <PlaceholderModule
      title="Homepage CMS"
      description="The twelve homepage sections defined in the BRD blueprint, from the hero through to the footer."
      planned={[
        "Edit the hero headline, sub-copy and calls to action.",
        "Choose which projects appear in the featured grid and premium highlights.",
        "Reorder, show and hide individual sections.",
        "Edit the trust-bar counters and the four value pillars.",
        "Preview changes before publishing them.",
      ]}
    />
  );
}

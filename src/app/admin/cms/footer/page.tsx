import type { Metadata } from "next";
import { PlaceholderModule } from "@/features/admin/components/placeholder-module";

export const metadata: Metadata = { title: "Footer CMS" };

export default function AdminFooterCmsPage() {
  return (
    <PlaceholderModule
      title="Footer"
      description="The three-column footer: brand blurb, project links, explore and company menus, social icons and the legal bar."
      planned={[
        "Edit the newsletter heading and supporting copy.",
        "Choose which projects are listed in the footer.",
        "Manage social icons and their links.",
        "Edit the RERA and copyright line.",
      ]}
    />
  );
}

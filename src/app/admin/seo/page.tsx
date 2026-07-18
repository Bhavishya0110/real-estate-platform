import type { Metadata } from "next";
import { AdminCard, AdminBadge } from "@/features/admin/components/admin-ui";
import { PlaceholderModule } from "@/features/admin/components/placeholder-module";

export const metadata: Metadata = { title: "SEO" };

const IMPLEMENTED = [
  "robots.txt",
  "sitemap.xml",
  "Canonical URLs on every page",
  "OpenGraph tags",
  "Twitter cards",
  "Organization / RealEstateAgent schema",
  "Breadcrumb schema",
  "Project (Residence) schema",
  "FAQPage schema",
  "Per-page titles and descriptions",
];

export default function AdminSeoPage() {
  return (
    <PlaceholderModule
      title="SEO"
      description="What is already emitted site-wide, and what will become editable."
      reads={
        <AdminCard>
          <h2 className="font-display text-lg text-white">Live on the site</h2>
          <ul className="mt-5 grid gap-2.5 sm:grid-cols-2">
            {IMPLEMENTED.map((item) => (
              <li key={item} className="flex items-center gap-2.5 text-sm">
                <AdminBadge tone="success">On</AdminBadge>
                <span className="text-navy-200">{item}</span>
              </li>
            ))}
          </ul>
        </AdminCard>
      }
      planned={[
        "Override the title and meta description per page.",
        "Upload a custom OpenGraph image per project and article.",
        "Manage redirects when a project slug changes.",
        "Surface Search Console and GA4 metrics next to each page.",
      ]}
    />
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import {
  AdminBadge,
  AdminEmpty,
  AdminPageHeader,
  AdminTable,
  ReadOnlyNotice,
} from "@/features/admin/components/admin-ui";
import { getProjects } from "@/lib/data/projects";
import { formatCompactCurrency } from "@/lib/format";

export const metadata: Metadata = { title: "Projects" };

export default async function AdminProjectsPage() {
  const projects = await getProjects();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Projects"
        description="The full portfolio, read through the project repository."
      />

      <ReadOnlyNotice resource="the project portfolio" />

      <AdminTable
        columns={["Project", "Category", "Status", "From", "Location", ""]}
        empty={
          projects.length === 0 ? (
            <AdminEmpty
              title="No projects yet"
              description="Projects added through the repository will appear here."
            />
          ) : undefined
        }
      >
        {projects.map((project) => (
          <tr key={project.id} className="hover:bg-white/[0.02]">
            <td className="px-4 py-3">
              <p className="font-medium text-white">{project.name}</p>
              <p className="text-xs text-navy-500">{project.slug}</p>
            </td>
            <td className="px-4 py-3 text-navy-300">{project.category}</td>
            <td className="px-4 py-3">
              <AdminBadge
                tone={
                  project.status === "Ready to Move" ||
                  project.status === "Available"
                    ? "success"
                    : project.status === "Pre-Launch"
                      ? "gold"
                      : "neutral"
                }
              >
                {project.status}
              </AdminBadge>
            </td>
            <td className="px-4 py-3 text-navy-300 tabular-nums">
              {formatCompactCurrency(project.priceFrom)}
            </td>
            <td className="px-4 py-3 text-navy-300">
              {project.location}, {project.city}
            </td>
            <td className="px-4 py-3 text-right">
              <Link
                href={`/projects/${project.slug}`}
                target="_blank"
                className="inline-flex items-center gap-1 text-xs text-gold-400 hover:underline"
              >
                View
                <ExternalLink className="size-3" aria-hidden="true" />
              </Link>
            </td>
          </tr>
        ))}
      </AdminTable>
    </div>
  );
}

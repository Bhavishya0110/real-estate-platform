import type { Metadata } from "next";
import {
  AdminBadge,
  AdminEmpty,
  AdminPageHeader,
  AdminTable,
  ReadOnlyNotice,
} from "@/features/admin/components/admin-ui";
import { getCommercialProjects } from "@/lib/data/projects";
import { formatCompactCurrency } from "@/lib/format";

export const metadata: Metadata = { title: "Commercial" };

export default async function AdminCommercialPage() {
  const projects = await getCommercialProjects();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Commercial"
        description="High-street retail, office floors and anchor units."
      />

      <ReadOnlyNotice resource="the commercial portfolio" />

      <AdminTable
        columns={["Project", "Status", "Unit types", "From", "Location"]}
        empty={
          projects.length === 0 ? (
            <AdminEmpty
              title="No commercial projects"
              description="Commercial projects will appear here."
            />
          ) : undefined
        }
      >
        {projects.map((project) => (
          <tr key={project.id} className="hover:bg-white/[0.02]">
            <td className="px-4 py-3 font-medium text-white">{project.name}</td>
            <td className="px-4 py-3">
              <AdminBadge
                tone={project.status === "Available" ? "success" : "neutral"}
              >
                {project.status}
              </AdminBadge>
            </td>
            <td className="px-4 py-3 text-navy-300">
              {project.configurations.join(" · ")}
            </td>
            <td className="px-4 py-3 text-navy-300 tabular-nums">
              {formatCompactCurrency(project.priceFrom)}
            </td>
            <td className="px-4 py-3 text-navy-300">{project.location}</td>
          </tr>
        ))}
      </AdminTable>
    </div>
  );
}

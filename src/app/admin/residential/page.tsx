import type { Metadata } from "next";
import {
  AdminBadge,
  AdminEmpty,
  AdminPageHeader,
  AdminTable,
  ReadOnlyNotice,
} from "@/features/admin/components/admin-ui";
import { getResidentialProjects } from "@/lib/data/projects";
import { formatCompactCurrency } from "@/lib/format";

export const metadata: Metadata = { title: "Residential" };

export default async function AdminResidentialPage() {
  const projects = await getResidentialProjects();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Residential"
        description="Apartments, independent floors, plots and senior living — the split is defined once, in the repository."
      />

      <ReadOnlyNotice resource="the residential portfolio" />

      <AdminTable
        columns={["Project", "Category", "Configurations", "From", "Possession"]}
        empty={
          projects.length === 0 ? (
            <AdminEmpty
              title="No residential projects"
              description="Residential projects will appear here."
            />
          ) : undefined
        }
      >
        {projects.map((project) => (
          <tr key={project.id} className="hover:bg-white/[0.02]">
            <td className="px-4 py-3 font-medium text-white">{project.name}</td>
            <td className="px-4 py-3">
              <AdminBadge>{project.category}</AdminBadge>
            </td>
            <td className="px-4 py-3 text-navy-300">
              {project.configurations.join(" · ")}
            </td>
            <td className="px-4 py-3 text-navy-300 tabular-nums">
              {formatCompactCurrency(project.priceFrom)}
            </td>
            <td className="px-4 py-3 text-navy-300">{project.possession}</td>
          </tr>
        ))}
      </AdminTable>
    </div>
  );
}

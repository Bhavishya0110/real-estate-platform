import type { Metadata } from "next";
import {
  AdminBadge,
  AdminEmpty,
  AdminPageHeader,
  AdminTable,
  ReadOnlyNotice,
} from "@/features/admin/components/admin-ui";
import { getProjects } from "@/lib/data/projects";

export const metadata: Metadata = { title: "Gallery" };

export default async function AdminGalleryPage() {
  const projects = await getProjects();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Gallery"
        description="Media grouped by project. Photography is supplied by the business and is still being shot for several addresses."
      />

      <ReadOnlyNotice resource="project media" />

      <AdminTable
        columns={["Project", "Category", "Photography", "Virtual tour", "Brochure"]}
        empty={
          projects.length === 0 ? (
            <AdminEmpty
              title="No media yet"
              description="Project media will appear here."
            />
          ) : undefined
        }
      >
        {projects.map((project) => (
          <tr key={project.id} className="hover:bg-white/[0.02]">
            <td className="px-4 py-3 font-medium text-white">{project.name}</td>
            <td className="px-4 py-3 text-navy-300">{project.category}</td>
            <td className="px-4 py-3">
              <AdminBadge tone={project.image ? "success" : "warning"}>
                {project.image ? "Supplied" : "Pending"}
              </AdminBadge>
            </td>
            <td className="px-4 py-3">
              <AdminBadge tone={project.hasVirtualTour ? "success" : "neutral"}>
                {project.hasVirtualTour ? "Yes" : "No"}
              </AdminBadge>
            </td>
            <td className="px-4 py-3">
              <AdminBadge tone={project.hasBrochure ? "success" : "neutral"}>
                {project.hasBrochure ? "Yes" : "No"}
              </AdminBadge>
            </td>
          </tr>
        ))}
      </AdminTable>
    </div>
  );
}

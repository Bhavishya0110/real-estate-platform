import type { Metadata } from "next";
import {
  AdminBadge,
  AdminEmpty,
  AdminPageHeader,
  AdminTable,
  ReadOnlyNotice,
} from "@/features/admin/components/admin-ui";
import { getJobs } from "@/lib/data/content";

export const metadata: Metadata = { title: "Careers" };

export default async function AdminCareersPage() {
  const jobs = await getJobs();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Careers"
        description="Open positions listed on the careers page."
      />

      <ReadOnlyNotice resource="job openings" />

      <AdminTable
        columns={["Role", "Department", "Type", "Location", "Experience"]}
        empty={
          jobs.length === 0 ? (
            <AdminEmpty
              title="No open positions"
              description="Published roles will appear here."
            />
          ) : undefined
        }
      >
        {jobs.map((job) => (
          <tr key={job.id} className="hover:bg-white/[0.02]">
            <td className="px-4 py-3">
              <p className="font-medium text-white">{job.title}</p>
              <p className="max-w-md truncate text-xs text-navy-500">
                {job.summary}
              </p>
            </td>
            <td className="px-4 py-3">
              <AdminBadge tone="gold">{job.department}</AdminBadge>
            </td>
            <td className="px-4 py-3 text-navy-300">{job.type}</td>
            <td className="px-4 py-3 text-navy-300">{job.location}</td>
            <td className="px-4 py-3 text-navy-300">{job.experience}</td>
          </tr>
        ))}
      </AdminTable>
    </div>
  );
}

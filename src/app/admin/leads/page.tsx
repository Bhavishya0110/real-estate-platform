import type { Metadata } from "next";
import { AdminPageHeader } from "@/features/admin/components/admin-ui";
import { LeadTable } from "@/features/admin/components/lead-table";
import { leadRepository } from "@/lib/repositories";

export const metadata: Metadata = { title: "All Leads" };

export default async function AdminLeadsPage() {
  const leads = await leadRepository.findAll();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="All Leads"
        description="Every enquiry captured across the site, newest first."
      />

      <LeadTable
        leads={leads}
        emptyTitle="No leads captured yet"
        emptyDescription="Enquiries from the contact form, project pages and the assistant all arrive here."
      />
    </div>
  );
}

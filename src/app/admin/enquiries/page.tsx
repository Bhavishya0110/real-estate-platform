import type { Metadata } from "next";
import { AdminPageHeader } from "@/features/admin/components/admin-ui";
import { LeadTable } from "@/features/admin/components/lead-table";
import { leadRepository } from "@/lib/repositories";

export const metadata: Metadata = { title: "Contact Enquiries" };

export default async function AdminEnquiriesPage() {
  const leads = await leadRepository.findAll();
  const enquiries = leads.filter((lead) => lead.source === "contact-form");

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Contact Enquiries"
        description="Submissions from the contact form on the public site."
      />

      <LeadTable
        leads={enquiries}
        emptyTitle="No contact enquiries yet"
        emptyDescription="Submissions from the contact form appear here the moment they are received."
      />
    </div>
  );
}

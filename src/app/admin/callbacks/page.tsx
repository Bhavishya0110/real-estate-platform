import type { Metadata } from "next";
import { AdminPageHeader } from "@/features/admin/components/admin-ui";
import { CallbackTable } from "@/features/admin/components/lead-table";
import { callbackRepository } from "@/lib/repositories";

export const metadata: Metadata = { title: "Callback Requests" };

export default async function AdminCallbacksPage() {
  const requests = await callbackRepository.findAll();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Callback Requests"
        description="Raised when the assistant could not answer. The question that stumped it travels with the request, so whoever calls back already has context."
      />

      <CallbackTable requests={requests} />
    </div>
  );
}

import {
  AdminBadge,
  AdminEmpty,
  AdminTable,
} from "./admin-ui";
import type { CallbackRequest, Lead } from "@/lib/repositories";
import { formatDate } from "@/lib/format";

/**
 * Shared renderers for the three lead-facing modules, so All Leads, Contact
 * Enquiries and Callback Requests stay consistent.
 */

function statusTone(status: string) {
  if (status === "new") return "gold" as const;
  if (status === "qualified") return "success" as const;
  if (status === "closed") return "neutral" as const;
  return "warning" as const;
}

export function LeadTable({
  leads,
  emptyTitle,
  emptyDescription,
}: {
  leads: Lead[];
  emptyTitle: string;
  emptyDescription: string;
}) {
  return (
    <AdminTable
      columns={["Name", "Contact", "Interest", "Source", "Status", "Received"]}
      empty={
        leads.length === 0 ? (
          <AdminEmpty title={emptyTitle} description={emptyDescription} />
        ) : undefined
      }
    >
      {leads.map((lead) => (
        <tr key={lead.id} className="hover:bg-white/[0.02]">
          <td className="px-4 py-3">
            <p className="font-medium text-white">{lead.name}</p>
            {lead.message ? (
              <p className="mt-1 max-w-xs truncate text-xs text-navy-500">
                {lead.message}
              </p>
            ) : null}
          </td>
          <td className="px-4 py-3 text-navy-300">
            <a href={`tel:${lead.phone}`} className="hover:text-gold-400">
              {lead.phone}
            </a>
            {lead.email ? (
              <a
                href={`mailto:${lead.email}`}
                className="block truncate text-xs text-navy-500 hover:text-gold-400"
              >
                {lead.email}
              </a>
            ) : null}
          </td>
          <td className="px-4 py-3 text-navy-300">{lead.interest ?? "—"}</td>
          <td className="px-4 py-3">
            <AdminBadge>{lead.source}</AdminBadge>
          </td>
          <td className="px-4 py-3">
            <AdminBadge tone={statusTone(lead.status)}>{lead.status}</AdminBadge>
          </td>
          <td className="px-4 py-3 text-xs text-navy-500">
            {formatDate(lead.createdAt)}
          </td>
        </tr>
      ))}
    </AdminTable>
  );
}

export function CallbackTable({
  requests,
}: {
  requests: CallbackRequest[];
}) {
  return (
    <AdminTable
      columns={["Name", "Mobile", "Preferred time", "Unanswered question", "Status", "Received"]}
      empty={
        requests.length === 0 ? (
          <AdminEmpty
            title="No callback requests yet"
            description="When the assistant cannot answer a question, the visitor is offered a callback. Those requests land here with the question that stumped it."
          />
        ) : undefined
      }
    >
      {requests.map((request) => (
        <tr key={request.id} className="hover:bg-white/[0.02]">
          <td className="px-4 py-3">
            <p className="font-medium text-white">{request.name}</p>
            {request.message ? (
              <p className="mt-1 max-w-xs truncate text-xs text-navy-500">
                {request.message}
              </p>
            ) : null}
          </td>
          <td className="px-4 py-3 text-navy-300">
            <a href={`tel:${request.phone}`} className="hover:text-gold-400">
              {request.phone}
            </a>
          </td>
          <td className="px-4 py-3 text-navy-300">{request.preferredTime}</td>
          <td className="px-4 py-3">
            <p className="max-w-xs truncate text-xs text-navy-400">
              {request.unansweredQuestion ?? "—"}
            </p>
          </td>
          <td className="px-4 py-3">
            <AdminBadge tone={statusTone(request.status)}>
              {request.status}
            </AdminBadge>
          </td>
          <td className="px-4 py-3 text-xs text-navy-500">
            {formatDate(request.createdAt)}
          </td>
        </tr>
      ))}
    </AdminTable>
  );
}

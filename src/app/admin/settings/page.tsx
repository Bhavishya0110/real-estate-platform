import type { Metadata } from "next";
import { AdminCard, AdminBadge } from "@/features/admin/components/admin-ui";
import { PlaceholderModule } from "@/features/admin/components/placeholder-module";

export const metadata: Metadata = { title: "Settings" };

const INTEGRATIONS: { name: string; status: string; tone: "success" | "warning" | "neutral" }[] = [
  { name: "Lead storage", status: "JSON repository", tone: "warning" },
  { name: "Notifications", status: "Logging only", tone: "neutral" },
  { name: "WhatsApp", status: "Deep links only", tone: "success" },
  { name: "CRM", status: "Not connected", tone: "neutral" },
  { name: "Email service", status: "Not connected", tone: "neutral" },
  { name: "Google Analytics 4", status: "Not connected", tone: "neutral" },
  { name: "Google Maps", status: "Links out", tone: "success" },
  { name: "Authentication", status: "Not enabled", tone: "warning" },
];

export default function AdminSettingsPage() {
  return (
    <PlaceholderModule
      title="Settings"
      description="Integrations and system configuration. Each one sits behind an interface, so connecting it is a new implementation rather than a rewrite."
      reads={
        <AdminCard>
          <h2 className="font-display text-lg text-white">Integrations</h2>
          <ul className="mt-5 divide-y divide-white/5">
            {INTEGRATIONS.map((integration) => (
              <li
                key={integration.name}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <span className="text-sm text-navy-200">{integration.name}</span>
                <AdminBadge tone={integration.tone}>
                  {integration.status}
                </AdminBadge>
              </li>
            ))}
          </ul>
        </AdminCard>
      }
      planned={[
        "Connect the CRM and map lead fields to it.",
        "Configure the transactional email sender.",
        "Add GA4 and Tag Manager identifiers.",
        "Provision the Google Maps key for embedded project maps.",
      ]}
    />
  );
}

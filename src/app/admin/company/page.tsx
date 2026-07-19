import type { Metadata } from "next";
import { AdminCard } from "@/features/admin/components/admin-ui";
import { PlaceholderModule } from "@/features/admin/components/placeholder-module";
import { siteConfig } from "@/lib/data/site-config";

export const metadata: Metadata = { title: "Company Information" };

export default function AdminCompanyPage() {
  const rows: { label: string; value: string }[] = [
    { label: "Trading name", value: siteConfig.name },
    { label: "Legal name", value: siteConfig.legalName },
    { label: "Founded", value: String(siteConfig.foundedYear) },
    { label: "Phone", value: siteConfig.phone },
    { label: "Email", value: siteConfig.email },
    { label: "WhatsApp", value: `+${siteConfig.whatsapp}` },
    { label: "Address", value: siteConfig.address },
    {
      label: "RERA number",
      value: siteConfig.reraNumber || "Not published — listed per project",
    },
  ];

  return (
    <PlaceholderModule
      title="Company Information"
      description="Contact details and social links. These flow from one source into the navbar, footer, contact page, every WhatsApp link and the metadata."
      reads={
        <div className="grid gap-6 lg:grid-cols-2">
          <AdminCard>
            <h2 className="font-display text-lg text-white">Contact details</h2>
            <dl className="mt-5 space-y-3.5">
              {rows.map((row) => (
                <div
                  key={row.label}
                  className="flex flex-wrap items-start justify-between gap-3 border-b border-white/5 pb-3 last:border-0"
                >
                  <dt className="text-xs tracking-wide text-navy-500 uppercase">
                    {row.label}
                  </dt>
                  <dd className="max-w-xs text-right text-sm text-navy-200">
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>
          </AdminCard>

          <AdminCard>
            <h2 className="font-display text-lg text-white">Social links</h2>
            <ul className="mt-5 space-y-3">
              {siteConfig.social.map((social) => (
                <li
                  key={social.label}
                  className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-3 last:border-0"
                >
                  <span className="text-sm text-navy-200">{social.label}</span>
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="max-w-[16rem] truncate text-xs text-gold-400 hover:underline"
                  >
                    {social.href}
                  </a>
                </li>
              ))}
            </ul>
          </AdminCard>
        </div>
      }
      planned={[
        "Edit contact details, addresses and social links in place.",
        "Multiple office locations with their own contact routes.",
        "Per-project RERA registration numbers.",
        "An audit trail of who changed what, and when.",
      ]}
    />
  );
}

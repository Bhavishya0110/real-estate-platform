import type { Metadata } from "next";
import { AdminShell } from "@/features/admin/components/admin-shell";

export const metadata: Metadata = {
  title: {
    default: "Admin — JMS Group",
    template: "%s | JMS Admin",
  },
  // The control panel must never be indexed.
  robots: { index: false, follow: false },
};

/**
 * Admin section layout.
 *
 * Authentication is deliberately not implemented yet — this is the shell the
 * auth layer will wrap. When it arrives, the session check belongs here, so
 * every admin route inherits it without touching a single page.
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminShell>{children}</AdminShell>;
}

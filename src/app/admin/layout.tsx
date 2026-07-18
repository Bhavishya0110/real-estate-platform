import type { Metadata } from "next";
import { AdminShell } from "@/features/admin/components/admin-shell";
import { requireSession } from "@/features/auth/lib/session";

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
 * The session check lives here, so every admin route inherits it without a
 * single page having to remember. The middleware turns unauthenticated requests
 * away earlier and more cheaply; this is the guard that still holds if the
 * middleware matcher is ever narrowed by mistake, and it is what supplies the
 * signed-in operator to the shell.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();

  return <AdminShell session={session}>{children}</AdminShell>;
}

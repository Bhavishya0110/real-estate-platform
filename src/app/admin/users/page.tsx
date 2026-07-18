import type { Metadata } from "next";
import { PlaceholderModule } from "@/features/admin/components/placeholder-module";

export const metadata: Metadata = { title: "Users & Roles" };

export default function AdminUsersPage() {
  return (
    <PlaceholderModule
      title="Users & Roles"
      description="Who can sign in to this panel, and what each of them may do. Authentication is deliberately not enabled yet."
      planned={[
        "Email and password sign-in, with session handling in the admin layout.",
        "Roles: administrator, sales, content editor and read-only.",
        "Per-module permissions, enforced in the repository layer rather than only hidden in the UI.",
        "An audit log of who changed what, and when.",
        "Because the session check lives in one layout, every admin route inherits it at once.",
      ]}
    />
  );
}

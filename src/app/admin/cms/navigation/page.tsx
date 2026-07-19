import type { Metadata } from "next";
import { AdminCard } from "@/features/admin/components/admin-ui";
import { PlaceholderModule } from "@/features/admin/components/placeholder-module";
import { navigation } from "@/lib/data/site-config";

export const metadata: Metadata = { title: "Navigation CMS" };

export default function AdminNavigationCmsPage() {
  const groups = [
    { title: "Main menu", links: navigation.main },
    { title: "Explore", links: navigation.explore },
    { title: "Company", links: navigation.company },
  ];

  return (
    <PlaceholderModule
      title="Navigation"
      description="The menus rendered in the navbar and footer, read from the navigation repository."
      reads={
        <div className="grid gap-6 md:grid-cols-3">
          {groups.map((group) => (
            <AdminCard key={group.title}>
              <h2 className="font-display text-lg text-white">{group.title}</h2>
              <ul className="mt-4 space-y-2.5">
                {group.links.map((link) => (
                  <li
                    key={link.href}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span className="text-navy-200">{link.label}</span>
                    <code className="truncate text-xs text-navy-500">
                      {link.href}
                    </code>
                  </li>
                ))}
              </ul>
            </AdminCard>
          ))}
        </div>
      }
      planned={[
        "Add, rename, reorder and remove menu items.",
        "Nested dropdown menus for the project categories.",
        "Per-item visibility, so a menu entry can be staged before launch.",
      ]}
    />
  );
}

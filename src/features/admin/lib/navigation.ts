/**
 * The admin information architecture, in one place.
 *
 * The sidebar, the mobile drawer and the breadcrumb trail all derive from this,
 * so a new module is added once rather than in three places.
 */

export interface AdminNavItem {
  label: string;
  href: string;
  /** lucide-react icon name, resolved by the UI. */
  icon: string;
  /** Shown as a pill when the module is not yet wired to writes. */
  badge?: string;
}

export interface AdminNavSection {
  title: string;
  items: AdminNavItem[];
}

export const ADMIN_NAV: AdminNavSection[] = [
  {
    title: "Overview",
    items: [{ label: "Dashboard", href: "/admin", icon: "LayoutDashboard" }],
  },
  {
    title: "Portfolio",
    items: [
      { label: "Projects", href: "/admin/projects", icon: "Building2" },
      { label: "Residential", href: "/admin/residential", icon: "Home" },
      { label: "Commercial", href: "/admin/commercial", icon: "Store" },
      { label: "Media Library", href: "/admin/media", icon: "Images" },
    ],
  },
  {
    title: "Content",
    items: [
      { label: "Blogs", href: "/admin/blogs", icon: "Newspaper" },
      { label: "Gallery", href: "/admin/gallery", icon: "GalleryHorizontal" },
      { label: "Testimonials", href: "/admin/testimonials", icon: "Quote" },
      { label: "Careers", href: "/admin/careers", icon: "Briefcase" },
    ],
  },
  {
    title: "Leads",
    items: [
      { label: "All Leads", href: "/admin/leads", icon: "Users" },
      { label: "Contact Enquiries", href: "/admin/enquiries", icon: "Inbox" },
      { label: "Callback Requests", href: "/admin/callbacks", icon: "PhoneCall" },
    ],
  },
  {
    title: "Site",
    items: [
      { label: "Homepage CMS", href: "/admin/cms/homepage", icon: "LayoutTemplate" },
      { label: "Navigation", href: "/admin/cms/navigation", icon: "Menu" },
      { label: "Footer", href: "/admin/cms/footer", icon: "PanelBottom" },
      { label: "Company Info", href: "/admin/company", icon: "Landmark" },
      { label: "SEO", href: "/admin/seo", icon: "Search" },
    ],
  },
  {
    title: "System",
    items: [
      { label: "Settings", href: "/admin/settings", icon: "Settings" },
      { label: "Users & Roles", href: "/admin/users", icon: "ShieldCheck", badge: "Soon" },
    ],
  },
];

/** Flattened lookup for breadcrumbs. */
export const ADMIN_NAV_INDEX: Record<string, string> = Object.fromEntries(
  ADMIN_NAV.flatMap((section) =>
    section.items.map((item) => [item.href, item.label]),
  ),
);

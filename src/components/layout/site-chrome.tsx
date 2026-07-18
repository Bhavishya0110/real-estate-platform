"use client";

import { usePathname } from "next/navigation";

/**
 * Hides the public site chrome (navbar, footer, assistant) on admin routes.
 *
 * The admin panel supplies its own shell, so the marketing header, footer and
 * customer-facing assistant must not bleed into it.
 *
 * Route groups with separate root layouts would express this more declaratively;
 * this wrapper achieves the same separation without restructuring every existing
 * route, and keeps the rule in one readable place.
 */
export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;

  // `data-site-chrome` is the hook for the CSS rule in globals.css that hides
  // this at first paint when an admin shell is present. Belt and braces: the
  // pathname check above cannot run before hydration, and a flash of the
  // marketing header inside the control panel would be plainly wrong.
  return <div data-site-chrome>{children}</div>;
}

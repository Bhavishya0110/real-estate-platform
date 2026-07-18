"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Bell,
  Building2,
  Briefcase,
  ChevronRight,
  GalleryHorizontal,
  Home,
  Images,
  Inbox,
  Landmark,
  LayoutDashboard,
  LayoutTemplate,
  Menu,
  Newspaper,
  PanelBottom,
  PhoneCall,
  Quote,
  Search,
  Settings,
  ShieldCheck,
  Store,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { ADMIN_NAV, ADMIN_NAV_INDEX } from "../lib/navigation";
import { cn } from "@/lib/utils";

/**
 * The admin chrome: sidebar, top bar, breadcrumbs.
 *
 * Dark enterprise theme, deliberately distinct from the public site so an
 * operator always knows which surface they are on — while keeping the same navy
 * and gold so it still reads as one brand.
 *
 * Authentication is intentionally absent at this stage; this is the shell the
 * auth layer will wrap.
 */

const ICONS: Record<string, LucideIcon> = {
  LayoutDashboard,
  Building2,
  Home,
  Store,
  Images,
  Newspaper,
  GalleryHorizontal,
  Quote,
  Briefcase,
  Users,
  Inbox,
  PhoneCall,
  LayoutTemplate,
  Menu,
  PanelBottom,
  Landmark,
  Search,
  Settings,
  ShieldCheck,
};

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close the mobile drawer on navigation.
  useEffect(() => setSidebarOpen(false), [pathname]);

  // Lock the page behind the drawer while it is open.
  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  const crumbs = buildCrumbs(pathname);

  return (
    <div data-admin-root className="min-h-svh bg-[#0a1420] text-navy-100">
      {/* --- Sidebar ----------------------------------------------------- */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-white/10 bg-navy-950 transition-transform duration-300 lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
        aria-label="Admin navigation"
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-5">
          <Link href="/admin" className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-sm bg-gold-500 font-display text-sm text-navy-900">
              J
            </span>
            <span className="flex flex-col leading-none">
              <span className="font-display text-base text-white">JMS Admin</span>
              <span className="mt-0.5 text-[9px] tracking-[0.18em] text-navy-400 uppercase">
                Control Panel
              </span>
            </span>
          </Link>

          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close navigation"
            className="flex size-9 items-center justify-center rounded-sm text-navy-300 hover:bg-white/5 hover:text-white lg:hidden"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-5">
          {ADMIN_NAV.map((section) => (
            <div key={section.title} className="mb-6">
              <p className="px-3 pb-2 text-[10px] font-semibold tracking-[0.18em] text-navy-500 uppercase">
                {section.title}
              </p>

              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = ICONS[item.icon] ?? LayoutDashboard;
                  const active =
                    item.href === "/admin"
                      ? pathname === "/admin"
                      : pathname.startsWith(item.href);

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm transition-colors",
                          active
                            ? "bg-gold-500/10 text-gold-400"
                            : "text-navy-300 hover:bg-white/5 hover:text-white",
                        )}
                      >
                        <Icon className="size-4 shrink-0" aria-hidden="true" />
                        <span className="flex-1 truncate">{item.label}</span>
                        {item.badge ? (
                          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-navy-300">
                            {item.badge}
                          </span>
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="shrink-0 border-t border-white/10 p-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs text-navy-400 transition-colors hover:text-gold-400"
          >
            <ChevronRight className="size-3 rotate-180" aria-hidden="true" />
            Back to website
          </Link>
        </div>
      </aside>

      {/* Scrim behind the mobile drawer */}
      {sidebarOpen ? (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 cursor-default bg-navy-950/70 backdrop-blur-sm lg:hidden"
        />
      ) : null}

      {/* --- Main column -------------------------------------------------- */}
      <div className="lg:pl-72">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-white/10 bg-[#0a1420]/95 px-4 backdrop-blur-md sm:px-6">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation"
            className="flex size-10 shrink-0 items-center justify-center rounded-sm text-navy-300 hover:bg-white/5 hover:text-white lg:hidden"
          >
            <Menu className="size-5" aria-hidden="true" />
          </button>

          {/* Global search — placeholder until the search service is built. */}
          <div className="relative min-w-0 flex-1 sm:max-w-md">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-navy-500"
              aria-hidden="true"
            />
            <label htmlFor="admin-search" className="sr-only">
              Search the admin panel
            </label>
            <input
              id="admin-search"
              type="search"
              disabled
              placeholder="Search… (coming soon)"
              className="h-10 w-full rounded-sm border border-white/10 bg-white/5 pr-3 pl-9 text-sm text-white placeholder:text-navy-500 focus:border-gold-500 focus:outline-none disabled:cursor-not-allowed"
            />
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-2">
            <button
              type="button"
              aria-label="Notifications (coming soon)"
              disabled
              className="relative flex size-10 items-center justify-center rounded-sm text-navy-300 hover:bg-white/5 disabled:cursor-not-allowed"
            >
              <Bell className="size-4" aria-hidden="true" />
              <span className="absolute top-2 right-2 size-1.5 rounded-full bg-gold-500" />
            </button>

            <button
              type="button"
              aria-label="Profile menu (coming soon)"
              disabled
              className="flex items-center gap-2 rounded-sm px-2 py-1.5 hover:bg-white/5 disabled:cursor-not-allowed"
            >
              <span className="flex size-8 items-center justify-center rounded-full bg-gold-500 font-display text-xs text-navy-900">
                A
              </span>
              <span className="hidden text-left sm:block">
                <span className="block text-xs font-medium text-white">
                  Admin
                </span>
                <span className="block text-[10px] text-navy-400">
                  Not signed in
                </span>
              </span>
            </button>
          </div>
        </header>

        {/* Breadcrumbs */}
        <nav
          aria-label="Breadcrumb"
          className="border-b border-white/5 px-4 py-3 sm:px-6"
        >
          <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-navy-400">
            {crumbs.map((crumb, index) => {
              const last = index === crumbs.length - 1;
              return (
                <li key={crumb.href} className="flex items-center gap-2">
                  {index > 0 ? (
                    <ChevronRight className="size-3 text-navy-600" aria-hidden="true" />
                  ) : null}
                  {last ? (
                    <span aria-current="page" className="text-gold-400">
                      {crumb.label}
                    </span>
                  ) : (
                    <Link
                      href={crumb.href}
                      className="transition-colors hover:text-white"
                    >
                      {crumb.label}
                    </Link>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>

        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

/** Derives the trail from the path, naming known modules from the nav index. */
function buildCrumbs(pathname: string) {
  const crumbs = [{ label: "Admin", href: "/admin" }];
  if (pathname === "/admin") return crumbs;

  const segments = pathname.split("/").filter(Boolean).slice(1);

  segments.forEach((segment, index) => {
    const href = `/admin/${segments.slice(0, index + 1).join("/")}`;
    crumbs.push({
      label:
        ADMIN_NAV_INDEX[href] ??
        segment.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      href,
    });
  });

  return crumbs;
}

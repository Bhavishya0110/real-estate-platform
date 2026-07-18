import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import {
  AdminBadge,
  AdminCard,
  AdminPageHeader,
  AdminStat,
} from "@/features/admin/components/admin-ui";
import {
  getBlogPosts,
  getJobs,
  getTestimonials,
} from "@/lib/data/content";
import {
  getCommercialProjects,
  getProjects,
  getResidentialProjects,
} from "@/lib/data/projects";
import { callbackRepository, leadRepository } from "@/lib/repositories";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Dashboard" };

/**
 * Admin dashboard.
 *
 * Every figure is read through the repository layer — nothing here reaches a
 * JSON file directly, so these widgets keep working unchanged once the data
 * comes from PostgreSQL.
 */
export default async function AdminDashboardPage() {
  const [
    projects,
    residential,
    commercial,
    posts,
    testimonials,
    jobs,
    leads,
    callbacks,
  ] = await Promise.all([
    getProjects(),
    getResidentialProjects(),
    getCommercialProjects(),
    getBlogPosts(),
    getTestimonials(),
    getJobs(),
    leadRepository.findAll(),
    callbackRepository.findAll(),
  ]);

  const active = projects.filter(
    (project) => project.status !== "Upcoming",
  ).length;

  const enquiries = leads.filter((lead) => lead.source === "contact-form");
  const recent = [...leads].slice(0, 5);

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Dashboard"
        description="Everything on the site at a glance, read live through the repository layer."
      />

      {/* --- Widgets ------------------------------------------------------ */}
      <section aria-label="Key figures">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <AdminStat
            label="Total Projects"
            value={projects.length}
            hint={`${residential.length} residential · ${commercial.length} commercial`}
            href="/admin/projects"
          />
          <AdminStat
            label="Active Projects"
            value={active}
            hint="Excludes upcoming launches"
            href="/admin/projects"
          />
          <AdminStat
            label="Leads"
            value={leads.length}
            hint="All sources"
            href="/admin/leads"
          />
          <AdminStat
            label="Contact Enquiries"
            value={enquiries.length}
            hint="From the contact form"
            href="/admin/enquiries"
          />
          <AdminStat
            label="Callback Requests"
            value={callbacks.length}
            hint="Raised via the assistant"
            href="/admin/callbacks"
          />
          <AdminStat
            label="Blog Posts"
            value={posts.length}
            href="/admin/blogs"
          />
          <AdminStat
            label="Gallery Items"
            value={projects.length}
            hint="One set per project"
            href="/admin/gallery"
          />
          <AdminStat
            label="Testimonials"
            value={testimonials.length}
            href="/admin/testimonials"
          />
          <AdminStat
            label="Careers"
            value={jobs.length}
            hint="Open positions"
            href="/admin/careers"
          />
        </div>
      </section>

      {/* --- Recent leads -------------------------------------------------- */}
      <section aria-label="Recent leads" className="grid gap-6 xl:grid-cols-3">
        <AdminCard className="xl:col-span-2">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-display text-lg text-white">Recent leads</h2>
            <Link
              href="/admin/leads"
              className="inline-flex items-center gap-1 text-xs text-gold-400 hover:underline"
            >
              View all
              <ArrowUpRight className="size-3.5" aria-hidden="true" />
            </Link>
          </div>

          {recent.length > 0 ? (
            <ul className="mt-5 divide-y divide-white/5">
              {recent.map((lead) => (
                <li
                  key={lead.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">
                      {lead.name}
                    </p>
                    <p className="truncate text-xs text-navy-400">
                      {lead.phone}
                      {lead.interest ? ` · ${lead.interest}` : ""}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-3">
                    <AdminBadge tone="gold">{lead.source}</AdminBadge>
                    <span className="text-xs text-navy-500">
                      {formatDate(lead.createdAt)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-5 text-sm leading-relaxed text-navy-400">
              No leads captured yet. Enquiries submitted through the contact form
              and callback requests raised through the assistant will appear here.
            </p>
          )}
        </AdminCard>

        {/* --- System status ---------------------------------------------- */}
        <AdminCard>
          <h2 className="font-display text-lg text-white">System</h2>

          <dl className="mt-5 space-y-4 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-navy-400">Data source</dt>
              <dd>
                <AdminBadge tone="warning">JSON</AdminBadge>
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-navy-400">Lead storage</dt>
              <dd>
                <AdminBadge tone="success">Active</AdminBadge>
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-navy-400">Notifications</dt>
              <dd>
                <AdminBadge>Logging only</AdminBadge>
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-navy-400">Authentication</dt>
              <dd>
                <AdminBadge tone="warning">Not enabled</AdminBadge>
              </dd>
            </div>
          </dl>

          <p className="mt-6 border-t border-white/10 pt-5 text-xs leading-relaxed text-navy-400">
            Content is read through the repository layer. Swapping JSON for
            PostgreSQL replaces the repository implementations only — no page or
            component changes.
          </p>
        </AdminCard>
      </section>
    </div>
  );
}

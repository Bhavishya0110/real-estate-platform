"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Briefcase, Clock, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Job } from "@/types";

/**
 * BRD §5 Careers — "Display job openings, filter jobs".
 * Résumé upload and submission are handled on the job detail page.
 */
export function JobList({
  jobs,
  departments,
}: {
  jobs: Job[];
  departments: string[];
}) {
  const [department, setDepartment] = useState<string>("All");

  const visible = useMemo(
    () =>
      department === "All"
        ? jobs
        : jobs.filter((job) => job.department === department),
    [jobs, department],
  );

  return (
    <div>
      {/* --- Department filter -------------------------------------------- */}
      <div
        role="tablist"
        aria-label="Filter roles by department"
        className="flex flex-wrap gap-2"
      >
        {["All", ...departments].map((option) => {
          const active = option === department;

          return (
            <button
              key={option}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setDepartment(option)}
              className={cn(
                "h-11 rounded-sm border px-4 text-sm font-medium tracking-wide transition-all duration-200 sm:px-5",
                active
                  ? "border-navy-900 bg-navy-900 text-white"
                  : "border-border bg-white text-navy-700 hover:border-navy-900/40 hover:bg-navy-50",
              )}
            >
              {option}
            </button>
          );
        })}
      </div>

      <p className="mt-6 text-sm text-muted-foreground" aria-live="polite">
        <span className="font-semibold text-navy-900">{visible.length}</span>{" "}
        {visible.length === 1 ? "open position" : "open positions"}
      </p>

      {/* --- Openings ------------------------------------------------------ */}
      <ul className="mt-8 flex flex-col gap-4">
        {visible.map((job) => (
          <li key={job.id}>
            <Link
              href={`/careers/${job.slug}`}
              className="group flex flex-col gap-4 rounded-sm border border-border bg-white p-6 transition-all duration-300 hover:border-gold-500/50 hover:shadow-luxe sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:p-8"
            >
              <div className="min-w-0">
                <h2 className="font-display text-xl text-navy-900 sm:text-2xl">
                  {job.title}
                </h2>

                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {job.summary}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <Briefcase
                      className="size-3.5 text-gold-600"
                      aria-hidden="true"
                    />
                    {job.department} · {job.type}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin
                      className="size-3.5 text-gold-600"
                      aria-hidden="true"
                    />
                    {job.location}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="size-3.5 text-gold-600" aria-hidden="true" />
                    {job.experience}
                  </span>
                </div>
              </div>

              <span
                aria-hidden="true"
                className="flex size-11 shrink-0 items-center justify-center rounded-full border border-navy-900/15 text-navy-900 transition-colors duration-300 group-hover:border-gold-500 group-hover:bg-gold-500"
              >
                <ArrowRight className="size-4" />
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {visible.length === 0 ? (
        <p className="mt-8 rounded-sm border border-dashed border-border bg-navy-50 p-10 text-center text-sm text-muted-foreground">
          No open roles in this department right now.
        </p>
      ) : null}
    </div>
  );
}

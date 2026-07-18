"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Scale, X } from "lucide-react";
import { ProjectMedia } from "@/components/common/project-media";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLocalSet } from "@/lib/use-local-set";
import { COMPARE_KEY, COMPARE_LIMIT } from "@/features/favorites/lib/keys";
import { projectEnquiryUrl } from "@/lib/whatsapp";
import type { Project } from "@/types";

/**
 * BRD innovation list — "Shortlist & Compare Tool: users shortlist up to 3
 * projects and compare them side by side".
 *
 * Rendered inside the listing pages (which already hold the full project list),
 * so no new route is introduced. A docked tray summarises the selection; the
 * comparison itself opens in a dialog.
 */

/** The rows of the comparison table, in reading order. */
const ROWS: { label: string; value: (project: Project) => string }[] = [
  { label: "Category", value: (p) => p.category },
  { label: "Status", value: (p) => p.status },
  { label: "Starting price", value: (p) => p.priceLabel },
  { label: "Configurations", value: (p) => p.configurations.join(" · ") },
  { label: "Area", value: (p) => p.areaRange },
  { label: "Possession", value: (p) => p.possession },
  { label: "Location", value: (p) => `${p.location}, ${p.city}` },
  { label: "Amenities", value: (p) => p.amenities.join(", ") },
  { label: "Virtual tour", value: (p) => (p.hasVirtualTour ? "Available" : "Not yet") },
  { label: "Brochure", value: (p) => (p.hasBrochure ? "Available" : "On request") },
];

export function CompareTray({ projects }: { projects: Project[] }) {
  const { items, ready, remove, clear } = useLocalSet(COMPARE_KEY, COMPARE_LIMIT);
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  const selected = useMemo(
    () => items
      .map((slug) => projects.find((project) => project.slug === slug))
      .filter((project): project is Project => Boolean(project)),
    [items, projects],
  );

  // Close on Escape, lock the page behind the dialog, and move focus into it.
  useEffect(() => {
    if (!open) return;

    closeRef.current?.focus();
    document.body.style.overflow = "hidden";

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  // Nothing selected (or storage not read yet) → stay out of the way entirely.
  if (!ready || selected.length === 0) return null;

  return (
    <>
      {/* --- Docked tray ------------------------------------------------- */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-navy-900/95 backdrop-blur-md">
        {/* Right padding clears the floating assistant launcher, which sits in
            the same corner — without it the Compare button is unreachable on a
            phone. */}
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-4 pr-20 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:pr-24 md:px-8 lg:px-12 lg:pr-24">
          <div className="flex min-w-0 items-center gap-3">
            <Scale className="size-5 shrink-0 text-gold-500" aria-hidden="true" />
            <p className="truncate text-sm text-navy-200">
              <span className="font-semibold text-white">{selected.length}</span>{" "}
              of {COMPARE_LIMIT} selected —{" "}
              <span className="truncate">
                {selected.map((project) => project.name).join(", ")}
              </span>
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <button
              type="button"
              onClick={clear}
              className="text-sm text-navy-300 underline-offset-4 transition-colors hover:text-white hover:underline"
            >
              Clear
            </button>

            <Button
              onClick={() => setOpen(true)}
              variant="gold"
              size="md"
              disabled={selected.length < 2}
            >
              Compare {selected.length > 1 ? `(${selected.length})` : ""}
            </Button>
          </div>
        </div>

        {selected.length < 2 ? (
          <p className="pb-3 text-center text-xs text-navy-400">
            Add one more project to compare them side by side.
          </p>
        ) : null}
      </div>

      {/* --- Comparison dialog -------------------------------------------- */}
      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Project comparison"
          className="fixed inset-0 z-50 flex items-end justify-center bg-navy-950/70 p-0 backdrop-blur-sm sm:items-center sm:p-6"
        >
          {/* Click-outside to dismiss. */}
          <button
            type="button"
            aria-label="Close comparison"
            onClick={() => setOpen(false)}
            className="absolute inset-0 cursor-default"
          />

          <div className="relative flex max-h-[92svh] w-full max-w-5xl flex-col overflow-hidden rounded-t-sm bg-white sm:rounded-sm">
            <header className="flex items-center justify-between gap-4 border-b border-border p-5 sm:p-6">
              <h2 className="font-display text-xl text-navy-900 sm:text-2xl">
                Side by side
              </h2>

              <button
                ref={closeRef}
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close comparison"
                className="flex size-10 items-center justify-center rounded-full border border-border text-navy-700 transition-colors hover:bg-navy-50"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </header>

            {/* The table scrolls in both axes rather than squashing columns. */}
            <div className="min-h-0 flex-1 overflow-auto">
              <table className="w-full min-w-[36rem] border-collapse text-left">
                <caption className="sr-only">
                  Comparison of {selected.map((p) => p.name).join(", ")}
                </caption>

                <thead>
                  <tr>
                    <th scope="col" className="sticky left-0 z-10 w-32 bg-white p-4">
                      <span className="sr-only">Attribute</span>
                    </th>

                    {selected.map((project) => (
                      <th
                        key={project.id}
                        scope="col"
                        className="min-w-[13rem] border-l border-border p-4 align-top"
                      >
                        <div className="relative aspect-4/3 overflow-hidden rounded-sm">
                          <ProjectMedia project={project} />
                        </div>

                        <div className="mt-3 flex items-start justify-between gap-2">
                          <p className="font-display text-lg text-navy-900">
                            {project.name}
                          </p>
                          <button
                            type="button"
                            onClick={() => remove(project.slug)}
                            aria-label={`Remove ${project.name} from comparison`}
                            className="flex size-7 shrink-0 items-center justify-center rounded-full border border-border text-navy-600 transition-colors hover:bg-navy-50"
                          >
                            <X className="size-3.5" aria-hidden="true" />
                          </button>
                        </div>

                        <div className="mt-2 flex flex-wrap gap-1.5">
                          <StatusBadge status={project.status} />
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {ROWS.map((row) => (
                    <tr key={row.label} className="border-t border-border align-top">
                      <th
                        scope="row"
                        className="sticky left-0 z-10 bg-navy-50 p-4 text-xs font-semibold tracking-wide text-navy-700 uppercase"
                      >
                        {row.label}
                      </th>

                      {selected.map((project) => (
                        <td
                          key={project.id}
                          className="border-l border-border p-4 text-sm text-navy-800"
                        >
                          {row.value(project)}
                        </td>
                      ))}
                    </tr>
                  ))}

                  {/* Actions row */}
                  <tr className="border-t border-border">
                    <th scope="row" className="sticky left-0 z-10 bg-navy-50 p-4">
                      <span className="sr-only">Actions</span>
                    </th>

                    {selected.map((project) => (
                      <td key={project.id} className="border-l border-border p-4">
                        <div className="flex flex-col gap-2">
                          <Button
                            href={`/projects/${project.slug}`}
                            variant="primary"
                            size="sm"
                          >
                            View details
                          </Button>
                          <Button
                            href={projectEnquiryUrl(project.name)}
                            target="_blank"
                            rel="noopener noreferrer"
                            variant="outline"
                            size="sm"
                          >
                            Enquire
                          </Button>
                        </div>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border p-5 sm:p-6">
              <Badge variant="muted">
                Comparing {selected.length} of {COMPARE_LIMIT}
              </Badge>

              <button
                type="button"
                onClick={() => {
                  clear();
                  setOpen(false);
                }}
                className="text-sm font-medium text-gold-600 underline-offset-4 hover:underline"
              >
                Clear comparison
              </button>
            </footer>
          </div>
        </div>
      ) : null}
    </>
  );
}

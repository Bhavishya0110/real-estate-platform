/**
 * Admin loading state.
 *
 * The global skeleton is built for the light marketing pages; inside the dark
 * control panel it would flash white. This mirrors the admin layout instead —
 * header, widget grid, table — so content lands where the skeleton sat and
 * nothing shifts.
 */
function Block({ className }: { className: string }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-sm bg-white/[0.06] ${className}`} />;
}

export default function AdminLoading() {
  return (
    <div className="space-y-8" role="status" aria-label="Loading">
      <span className="sr-only">Loading…</span>

      {/* Page header */}
      <div className="border-b border-white/10 pb-6">
        <Block className="h-8 w-56" />
        <Block className="mt-3 h-4 w-full max-w-md" />
      </div>

      {/* Widget grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="rounded-sm border border-white/10 bg-navy-950/60 p-5 sm:p-6"
          >
            <Block className="h-2.5 w-24" />
            <Block className="mt-4 h-9 w-20" />
            <Block className="mt-3 h-3 w-32" />
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-sm border border-white/10">
        <div className="border-b border-white/10 bg-white/[0.03] px-4 py-3">
          <Block className="h-3 w-40" />
        </div>
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="border-b border-white/5 px-4 py-4 last:border-0">
            <Block className="h-4 w-full max-w-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

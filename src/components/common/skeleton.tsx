import { cn } from "@/lib/utils";

/** A shimmering placeholder block. Purely decorative — hidden from screen readers. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse rounded-sm bg-navy-100", className)}
    />
  );
}

/** Matches the footprint of a ProjectCard so the grid does not jump on load. */
export function ProjectCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-sm border border-border bg-white">
      <Skeleton className="aspect-4/3 rounded-none" />
      <div className="space-y-3 p-5 sm:p-6">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex items-end justify-between border-t border-border pt-5">
          <div className="space-y-2">
            <Skeleton className="h-2.5 w-16" />
            <Skeleton className="h-5 w-28" />
          </div>
          <Skeleton className="size-10 rounded-full" />
        </div>
      </div>
    </div>
  );
}

/** A generic page-level skeleton: masthead band plus a card grid. */
export function PageSkeleton() {
  return (
    <div role="status" aria-label="Loading">
      <span className="sr-only">Loading…</span>

      <div className="bg-navy-900 pt-32 pb-16 sm:pt-36 sm:pb-20 lg:pt-44 lg:pb-24">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 md:px-8 lg:px-12">
          <Skeleton className="h-3 w-40 bg-white/10" />
          <Skeleton className="mt-8 h-12 w-3/4 bg-white/10 sm:h-16" />
          <Skeleton className="mt-6 h-4 w-full max-w-xl bg-white/10" />
        </div>
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 sm:py-28 md:px-8 lg:px-12">
        <div className="grid gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <ProjectCardSkeleton key={index} />
          ))}
        </div>
      </div>
    </div>
  );
}

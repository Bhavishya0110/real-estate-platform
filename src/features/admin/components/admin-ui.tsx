import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * The admin design-system primitives.
 *
 * Every module page is composed from these, so the dashboard, the resource
 * lists and the CMS screens stay visually identical without repeating markup.
 */

/* ------------------------------------------------------------------ header */

export function AdminPageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="font-display text-2xl text-white sm:text-3xl">{title}</h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-navy-400">
            {description}
          </p>
        ) : null}
      </div>

      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

/* -------------------------------------------------------------------- card */

export function AdminCard({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-sm border border-white/10 bg-navy-950/60 p-5 sm:p-6",
        className,
      )}
    >
      {children}
    </div>
  );
}

/* -------------------------------------------------------------- stat widget */

export function AdminStat({
  label,
  value,
  hint,
  href,
}: {
  label: string;
  value: number | string;
  hint?: string;
  href?: string;
}) {
  const body = (
    <>
      <p className="text-[11px] font-semibold tracking-[0.16em] text-navy-500 uppercase">
        {label}
      </p>
      <p className="mt-3 font-display text-3xl text-white sm:text-4xl">{value}</p>
      {hint ? <p className="mt-2 text-xs text-navy-400">{hint}</p> : null}
    </>
  );

  const classes =
    "block rounded-sm border border-white/10 bg-navy-950/60 p-5 transition-colors sm:p-6";

  return href ? (
    <Link href={href} className={cn(classes, "hover:border-gold-500/40")}>
      {body}
    </Link>
  ) : (
    <div className={classes}>{body}</div>
  );
}

/* -------------------------------------------------------------------- table */

/**
 * A responsive data table.
 *
 * Scrolls horizontally inside its own container rather than letting a wide table
 * push the page sideways — the single most common cause of horizontal scroll on
 * an admin screen.
 */
export function AdminTable({
  columns,
  children,
  empty,
}: {
  columns: string[];
  children: React.ReactNode;
  /** Rendered instead of the table when there are no rows. */
  empty?: React.ReactNode;
}) {
  if (empty) {
    return (
      <div className="rounded-sm border border-dashed border-white/15 bg-navy-950/40 p-10 text-center">
        {empty}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-sm border border-white/10">
      <table className="w-full min-w-[42rem] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-white/10 bg-white/[0.03]">
            {columns.map((column) => (
              <th
                key={column}
                scope="col"
                className="px-4 py-3 text-[11px] font-semibold tracking-[0.14em] text-navy-400 uppercase"
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">{children}</tbody>
      </table>
    </div>
  );
}

export function AdminEmpty({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <>
      <p className="font-display text-lg text-white">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-navy-400">
        {description}
      </p>
    </>
  );
}

/* -------------------------------------------------------------------- badge */

export function AdminBadge({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "gold" | "success" | "warning";
  children: React.ReactNode;
}) {
  const tones = {
    neutral: "bg-white/10 text-navy-200",
    gold: "bg-gold-500/15 text-gold-400",
    success: "bg-emerald-500/15 text-emerald-400",
    warning: "bg-amber-500/15 text-amber-400",
  } as const;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-wide uppercase",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

/* --------------------------------------------------------------- read-only */

/**
 * States plainly that a module reads live data but cannot yet write it.
 *
 * Editing arrives with PostgreSQL; saying so is more useful than a dead "Save"
 * button that silently does nothing.
 */
export function ReadOnlyNotice({ resource }: { resource: string }) {
  return (
    <AdminCard className="border-gold-500/25 bg-gold-500/[0.06]">
      <p className="text-sm leading-relaxed text-navy-200">
        <span className="font-semibold text-gold-400">Read-only.</span> This
        module reads {resource} live through the repository layer. Creating and
        editing is wired up with the PostgreSQL migration — the repository
        interfaces and server actions for it already exist.
      </p>
    </AdminCard>
  );
}

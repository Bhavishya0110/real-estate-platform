import type { ReactNode } from "react";
import type { ProjectStatus } from "@/types";
import { cn } from "@/lib/utils";

type BadgeVariant = "navy" | "gold" | "outline" | "success" | "muted";

const variants: Record<BadgeVariant, string> = {
  navy: "bg-navy-900 text-white",
  gold: "bg-gold-500 text-navy-900",
  outline: "border border-navy-900/20 bg-white/90 text-navy-900",
  success: "bg-emerald-600 text-white",
  muted: "bg-navy-50 text-navy-600",
};

export function Badge({
  variant = "navy",
  className,
  children,
}: {
  variant?: BadgeVariant;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "eyebrow inline-flex items-center rounded-sm px-2.5 py-1 backdrop-blur-sm",
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Each project status gets a consistent colour across every surface of the site. */
const statusVariant: Record<ProjectStatus, BadgeVariant> = {
  Ongoing: "navy",
  "Ready to Move": "success",
  "Pre-Launch": "gold",
  Available: "success",
  Upcoming: "muted",
};

export function StatusBadge({
  status,
  className,
}: {
  status: ProjectStatus;
  className?: string;
}) {
  return (
    <Badge variant={statusVariant[status]} className={className}>
      {status}
    </Badge>
  );
}

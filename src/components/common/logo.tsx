import Link from "next/link";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/lib/data/content";

/** Wordmark + gold monogram. `onDark` flips it for navy surfaces. */
export function Logo({
  onDark = false,
  className,
}: {
  onDark?: boolean;
  className?: string;
}) {
  return (
    <Link
      href="/"
      aria-label={`${siteConfig.name} — home`}
      className={cn("group inline-flex items-center gap-3", className)}
    >
      <span
        className={cn(
          "flex size-10 items-center justify-center rounded-sm border font-display text-lg leading-none transition-colors",
          onDark
            ? "border-gold-500/50 bg-gold-500 text-navy-900"
            : "border-navy-900/15 bg-navy-900 text-gold-500 group-hover:bg-navy-800",
        )}
      >
        J
      </span>

      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "font-display text-xl tracking-tight",
            onDark ? "text-white" : "text-navy-900",
          )}
        >
          {siteConfig.name}
        </span>
        <span
          className={cn(
            "mt-1 text-[9px] font-semibold tracking-[0.24em] uppercase",
            onDark ? "text-navy-300" : "text-muted-foreground",
          )}
        >
          Since {siteConfig.foundedYear}
        </span>
      </span>
    </Link>
  );
}

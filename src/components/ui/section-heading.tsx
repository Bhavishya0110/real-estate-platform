import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * The luxury-editorial heading block used at the top of every section:
 *   EYEBROW  ──  Display headline  ──  supporting line
 */
export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  onDark = false,
  action,
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: string;
  align?: "left" | "center";
  onDark?: boolean;
  action?: ReactNode;
  className?: string;
}) {
  const centered = align === "center";

  return (
    <div
      className={cn(
        "flex flex-col gap-6 md:flex-row md:items-end md:justify-between",
        centered && "md:flex-col md:items-center",
        className,
      )}
    >
      <div className={cn("max-w-2xl", centered && "text-center")}>
        {eyebrow ? (
          <div
            className={cn(
              "flex items-center gap-3",
              centered && "justify-center",
            )}
          >
            <span className="gold-rule" aria-hidden="true" />
            <span
              className={cn(
                "eyebrow",
                onDark ? "text-gold-500" : "text-gold-600",
              )}
            >
              {eyebrow}
            </span>
          </div>
        ) : null}

        <h2
          className={cn(
            "mt-4 text-[1.75rem] leading-[1.2] sm:text-3xl md:text-4xl lg:text-[2.75rem] lg:leading-[1.15]",
            onDark ? "text-white" : "text-navy-900",
          )}
        >
          {title}
        </h2>

        {description ? (
          <p
            className={cn(
              "mt-4 text-[15px] leading-relaxed sm:mt-5 sm:text-base",
              onDark ? "text-navy-200" : "text-muted-foreground",
            )}
          >
            {description}
          </p>
        ) : null}
      </div>

      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

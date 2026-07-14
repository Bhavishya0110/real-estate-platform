import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils";

/** The single source of truth for page gutters and max width. */
export function Container({
  as: Tag = "div",
  className,
  children,
}: {
  as?: ElementType;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Tag
      className={cn(
        // 16px gutters at 320px — anything more starves the content column.
        "mx-auto w-full max-w-7xl px-4 sm:px-6 md:px-8 lg:px-12",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

/** Consistent vertical rhythm between page sections. */
export function Section({
  as: Tag = "section",
  className,
  children,
  ...rest
}: {
  as?: ElementType;
  className?: string;
  children: ReactNode;
  id?: string;
}) {
  return (
    <Tag className={cn("py-16 sm:py-20 lg:py-28", className)} {...rest}>
      {children}
    </Tag>
  );
}

import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "gold" | "outline" | "ghost" | "onDark";
type ButtonSize = "sm" | "md" | "lg";

/* `whitespace-nowrap` deliberately starts at `sm` rather than at every width.
   At 320px the content column is 288px, and a long uppercase CTA ("Request the
   Numbers", an email address on the privacy page) exceeded it. Because the
   document clips horizontal overflow rather than scrolling it, the failure was
   silently *truncated text* rather than a visible scrollbar — the kind of thing
   that survives testing. Below `sm` the label wraps instead; from `sm` up there
   is room, and buttons stay on one line as designed. */
const base =
  "inline-flex max-w-full items-center justify-center gap-2 text-center rounded-sm font-sans font-medium " +
  "sm:whitespace-nowrap " +
  "transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-navy-900 text-white hover:bg-navy-800 hover:shadow-luxe active:bg-navy-950",
  gold: "bg-gold-500 text-navy-900 hover:bg-gold-400 hover:shadow-luxe active:bg-gold-600",
  outline:
    "border border-navy-900/20 bg-transparent text-navy-900 hover:border-navy-900 hover:bg-navy-900 hover:text-white",
  ghost: "bg-transparent text-navy-900 hover:bg-navy-50",
  onDark:
    "border border-white/30 bg-transparent text-white hover:border-gold-500 hover:bg-gold-500 hover:text-navy-900",
};

/* Heights hold a ≥44px touch target from `md` up — the smallest comfortable
   tap area. `sm` is 40px and is only used on pointer-first surfaces.
   Horizontal padding and letter-spacing relax as the viewport grows, so an
   uppercase CTA like "Book a Site Visit" still fits inside a 320px column.

   `min-h` rather than a fixed `h`: paired with the wrapping allowed below `sm`
   above, a long label grows the button instead of spilling out of it. At every
   width where the label fits on one line — which is all of them from `sm` up —
   the rendered height is identical to a fixed one. */
const sizes: Record<ButtonSize, string> = {
  sm: "min-h-10 px-4 py-2 text-xs tracking-wide",
  md: "min-h-11 px-5 py-2.5 text-sm tracking-wide sm:px-6",
  lg: "min-h-12 px-5 py-3 text-xs tracking-[0.08em] uppercase sm:min-h-13 sm:px-8 sm:text-sm sm:tracking-[0.12em]",
};

interface BaseProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: ReactNode;
}

/** Renders an <a> (via next/link) when `href` is present, otherwise a <button>. */
type ButtonProps = BaseProps &
  (
    | ({ href: string } & Omit<ComponentProps<typeof Link>, "href" | "className">)
    | ({ href?: undefined } & Omit<
        ComponentProps<"button">,
        "className" | "children"
      >)
  );

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonProps) {
  const classes = cn(base, variants[variant], sizes[size], className);

  if ("href" in props && props.href) {
    const { href, ...linkProps } = props;
    return (
      <Link href={href} className={classes} {...linkProps}>
        {children}
      </Link>
    );
  }

  const { href: _href, ...buttonProps } = props as { href?: undefined } & ComponentProps<"button">;
  void _href;

  return (
    <button className={classes} {...buttonProps}>
      {children}
    </button>
  );
}

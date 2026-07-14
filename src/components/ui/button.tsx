import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "gold" | "outline" | "ghost" | "onDark";
type ButtonSize = "sm" | "md" | "lg";

const base =
  "inline-flex max-w-full items-center justify-center gap-2 text-center whitespace-nowrap rounded-sm font-sans font-medium " +
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
   uppercase CTA like "Book a Site Visit" still fits inside a 320px column. */
const sizes: Record<ButtonSize, string> = {
  sm: "h-10 px-4 text-xs tracking-wide",
  md: "h-11 px-5 text-sm tracking-wide sm:px-6",
  lg: "h-12 px-5 text-xs tracking-[0.08em] uppercase sm:h-13 sm:px-8 sm:text-sm sm:tracking-[0.12em]",
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

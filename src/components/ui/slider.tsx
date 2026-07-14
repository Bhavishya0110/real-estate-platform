"use client";

import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/**
 * A styled native range input.
 *
 * Native `<input type="range">` is keyboard-operable (arrows, Home/End) and
 * announced correctly by screen readers with no extra work — which is why we
 * are not reaching for a custom-drawn thumb here.
 */
export function Slider({
  label,
  valueLabel,
  className,
  ...props
}: {
  label: string;
  valueLabel: string;
} & ComponentProps<"input">) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-baseline justify-between gap-4">
        <label
          htmlFor={props.id}
          className="text-sm font-medium text-navy-700"
        >
          {label}
        </label>
        <span className="font-display text-lg text-navy-900 tabular-nums">
          {valueLabel}
        </span>
      </div>

      <input
        type="range"
        {...props}
        className={cn(
          "h-1.5 w-full cursor-pointer appearance-none rounded-full bg-navy-100",
          // WebKit thumb
          "[&::-webkit-slider-thumb]:size-5 [&::-webkit-slider-thumb]:appearance-none",
          "[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2",
          "[&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-gold-500",
          "[&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:transition-transform",
          "hover:[&::-webkit-slider-thumb]:scale-110",
          // Firefox thumb
          "[&::-moz-range-thumb]:size-5 [&::-moz-range-thumb]:rounded-full",
          "[&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white",
          "[&::-moz-range-thumb]:bg-gold-500 [&::-moz-range-thumb]:shadow-md",
        )}
      />
    </div>
  );
}

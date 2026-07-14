import { ChevronDown } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/**
 * A styled native <select>.
 *
 * Native is deliberate: it is keyboard-accessible and screen-reader correct for
 * free, and on mobile it opens the OS picker — which is what buyers expect.
 */
export function Select({
  label,
  options,
  className,
  ...props
}: {
  label: string;
  options: { value: string; label: string }[];
} & ComponentProps<"select">) {
  return (
    <label className={cn("group flex flex-col gap-2", className)}>
      <span className="eyebrow text-navy-400">{label}</span>

      <span className="relative flex items-center">
        <select
          {...props}
          className="w-full appearance-none rounded-sm border border-white/15 bg-white/5 py-3 pr-10 pl-4 text-sm text-white transition-colors focus:border-gold-500 focus:outline-none"
        >
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              className="bg-navy-900 text-white"
            >
              {option.label}
            </option>
          ))}
        </select>

        <ChevronDown
          className="pointer-events-none absolute right-3 size-4 text-gold-500"
          aria-hidden="true"
        />
      </span>
    </label>
  );
}

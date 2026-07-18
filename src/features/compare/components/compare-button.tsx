"use client";

import { useState } from "react";
import { Check, Scale } from "lucide-react";
import { useTransientTimeout } from "@/lib/use-dialog";
import { useLocalSet } from "@/lib/use-local-set";
import { cn } from "@/lib/utils";
import { COMPARE_KEY, COMPARE_LIMIT } from "@/features/favorites/lib/keys";

/**
 * Adds a project to the side-by-side comparison tray (max 3, per the BRD's
 * "shortlist up to 3 projects and compare" tool).
 *
 * When the tray is full the button explains why it did nothing rather than
 * failing silently.
 */
export function CompareButton({
  slug,
  name,
  className,
}: {
  slug: string;
  name: string;
  className?: string;
}) {
  const { has, toggle } = useLocalSet(COMPARE_KEY, COMPARE_LIMIT);
  const [rejected, setRejected] = useState(false);
  const selected = has(slug);

  // Cards unmount whenever a filter changes, and the hint outlives the card it
  // belongs to — so the timer is owned by the component, not by the click.
  const scheduleHintDismissal = useTransientTimeout();

  function handleClick() {
    const accepted = toggle(slug);
    if (!accepted) {
      setRejected(true);
      scheduleHintDismissal(() => setRejected(false), 2200);
    }
  }

  return (
    <span className="relative z-10">
      <button
        type="button"
        onClick={handleClick}
        aria-pressed={selected}
        aria-label={
          selected
            ? `Remove ${name} from comparison`
            : `Add ${name} to comparison`
        }
        className={cn(
          "flex size-9 items-center justify-center rounded-full backdrop-blur-md transition-all duration-300",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500",
          selected
            ? "bg-white text-navy-900"
            : "bg-navy-950/50 text-white ring-1 ring-white/20 hover:bg-navy-950/70",
          className,
        )}
      >
        {selected ? (
          <Check className="size-4" aria-hidden="true" />
        ) : (
          <Scale className="size-4" aria-hidden="true" />
        )}
      </button>

      {rejected ? (
        <span
          role="status"
          className="absolute top-full right-0 z-20 mt-2 w-max max-w-[12rem] rounded-sm bg-navy-900 px-3 py-2 text-xs text-white shadow-luxe"
        >
          You can compare {COMPARE_LIMIT} projects at a time.
        </span>
      ) : null}
    </span>
  );
}

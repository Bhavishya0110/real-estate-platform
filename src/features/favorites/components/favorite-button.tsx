"use client";

import { Heart } from "lucide-react";
import { useLocalSet } from "@/lib/use-local-set";
import { cn } from "@/lib/utils";
import { FAVORITES_KEY } from "../lib/keys";

/**
 * Saves a project to the visitor's shortlist, in localStorage.
 *
 * Sits inside the (server-rendered) ProjectCard, so it is deliberately the only
 * client-side part of that card. `z-10` lifts it above the card's stretched
 * link so the heart stays clickable without navigating.
 */
export function FavoriteButton({
  slug,
  name,
  className,
}: {
  slug: string;
  name: string;
  className?: string;
}) {
  const { has, toggle, ready } = useLocalSet(FAVORITES_KEY);
  const saved = has(slug);

  return (
    <button
      type="button"
      onClick={() => toggle(slug)}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${name} from shortlist` : `Save ${name} to shortlist`}
      className={cn(
        "relative z-10 flex size-9 items-center justify-center rounded-full backdrop-blur-md transition-all duration-300",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500",
        saved
          ? "bg-gold-500 text-navy-900"
          : "bg-navy-950/50 text-white ring-1 ring-white/20 hover:bg-navy-950/70",
        className,
      )}
    >
      <Heart
        className={cn("size-4 transition-transform duration-300", saved && "scale-110 fill-current")}
        aria-hidden="true"
      />
      {/* Until storage is read the button renders in its default state; this
          keeps the server and client markup identical on first paint. */}
      <span className="sr-only">{ready && saved ? "Saved" : "Not saved"}</span>
    </button>
  );
}

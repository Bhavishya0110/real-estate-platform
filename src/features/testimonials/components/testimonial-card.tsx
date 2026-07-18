import { Play, Quote, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Testimonial } from "@/types";

/**
 * Reusable review card for the /testimonials page.
 *
 * Deliberately matches the approved homepage treatment so the two surfaces read
 * as one system — video reviews on navy, text reviews on white.
 */
export function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  const isVideo = testimonial.type === "video";

  return (
    <article
      className={cn(
        "flex h-full flex-col rounded-sm border p-6 transition-shadow duration-300 hover:shadow-luxe sm:p-8",
        isVideo ? "border-navy-800 bg-navy-900" : "border-border bg-white",
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <Quote
          className={cn(
            "size-8 shrink-0",
            isVideo ? "text-gold-500" : "text-navy-200",
          )}
          aria-hidden="true"
        />

        {isVideo ? (
          <button
            type="button"
            className="flex items-center gap-2 rounded-sm border border-gold-500/40 px-3 py-1.5 text-xs font-medium text-gold-500 transition-colors hover:bg-gold-500 hover:text-navy-900"
          >
            <Play className="size-3 fill-current" aria-hidden="true" />
            Watch
          </button>
        ) : null}
      </div>

      <div
        className="mt-6 flex gap-0.5"
        role="img"
        aria-label={`${testimonial.rating} out of 5 stars`}
      >
        {Array.from({ length: 5 }).map((_, index) => (
          <Star
            key={index}
            aria-hidden="true"
            className={cn(
              "size-4",
              index < testimonial.rating
                ? "fill-gold-500 text-gold-500"
                : isVideo
                  ? "text-navy-700"
                  : "text-navy-200",
            )}
          />
        ))}
      </div>

      <blockquote
        className={cn(
          "mt-5 flex-1 text-[15px] leading-relaxed",
          isVideo ? "text-navy-200" : "text-navy-700",
        )}
      >
        &ldquo;{testimonial.quote}&rdquo;
      </blockquote>

      <footer
        className={cn(
          "mt-8 flex flex-wrap items-center gap-x-4 gap-y-3 border-t pt-6",
          isVideo ? "border-white/10" : "border-border",
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-full font-display text-sm",
            isVideo ? "bg-gold-500 text-navy-900" : "bg-navy-900 text-gold-500",
          )}
        >
          {testimonial.avatarInitials}
        </span>

        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "truncate text-sm font-semibold",
              isVideo ? "text-white" : "text-navy-900",
            )}
          >
            {testimonial.name}
          </p>
          <p
            className={cn(
              "text-xs",
              isVideo ? "text-navy-400" : "text-muted-foreground",
            )}
          >
            {testimonial.role}
          </p>
        </div>

        <Badge variant={isVideo ? "gold" : "muted"} className="shrink-0">
          {testimonial.projectName}
        </Badge>
      </footer>
    </article>
  );
}

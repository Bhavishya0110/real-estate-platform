import { Play, Quote, Star } from "lucide-react";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Container, Section } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { getTestimonials } from "@/lib/data/content";
import { cn } from "@/lib/utils";
import type { Testimonial } from "@/types";

/**
 * BRD Home blueprint §08 — Testimonials:
 * 3 video + 2 text, star ratings, project tags, mobile carousel.
 * CTAs: Leave a Review · Watch More.
 *
 * The mobile carousel is CSS scroll-snap — no JS, no library, and it keeps
 * native momentum scrolling and keyboard/screen-reader behaviour intact.
 */
export async function Testimonials() {
  const testimonials = await getTestimonials();

  return (
    <Section className="bg-navy-50">
      <Container>
        <SectionHeading
          eyebrow="Social Proof"
          title="A thousand customers. Ask any of them."
          description="We did not write these. Every review is tied to a real booking, a real handover and a real name."
          action={
            <Button href="/testimonials" variant="outline" size="md">
              Watch More
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          }
        />

        {/* Horizontal snap-scroll on mobile, grid from md up. */}
        <ul
          className={cn(
            "mt-10 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4 sm:mt-14 sm:gap-6",
            "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
            "md:grid md:grid-cols-2 md:gap-6 md:overflow-visible lg:grid-cols-3",
          )}
        >
          {testimonials.map((testimonial) => (
            <li
              key={testimonial.id}
              className="w-[82vw] shrink-0 snap-start sm:w-[58vw] md:w-auto"
            >
              <TestimonialCard testimonial={testimonial} />
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  const isVideo = testimonial.type === "video";

  return (
    <article
      className={cn(
        "flex h-full flex-col rounded-sm border p-6 transition-shadow duration-300 hover:shadow-luxe sm:p-8",
        isVideo
          ? "border-navy-800 bg-navy-900"
          : "border-border bg-white",
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

      {/* --- Rating --------------------------------------------------------- */}
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
        “{testimonial.quote}”
      </blockquote>

      {/* --- Attribution ----------------------------------------------------- */}
      {/* Wraps so the project tag drops to its own line rather than crushing the
          name at 320px. */}
      <footer
        className={cn(
          "mt-8 flex flex-wrap items-center gap-x-4 gap-y-3 border-t pt-6",
          isVideo ? "border-white/10" : "border-border",
        )}
      >
        <span
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-full font-display text-sm",
            isVideo
              ? "bg-gold-500 text-navy-900"
              : "bg-navy-900 text-gold-500",
          )}
          aria-hidden="true"
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

import type { Metadata } from "next";
import { ArrowRight, Star } from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";
import { Button } from "@/components/ui/button";
import { Container, Section } from "@/components/ui/container";
import { TestimonialCard } from "@/features/testimonials/components/testimonial-card";
import { getTestimonials } from "@/lib/data/content";

export const metadata: Metadata = {
  title: "Testimonials",
  description:
    "Reviews and video testimonials from JMS Group homeowners and investors across Gurugram and the NCR.",
  alternates: { canonical: "/testimonials" },
};

export default async function TestimonialsPage() {
  const testimonials = await getTestimonials();

  const average =
    testimonials.reduce((total, item) => total + item.rating, 0) /
    (testimonials.length || 1);
  const videoCount = testimonials.filter((item) => item.type === "video").length;

  return (
    <>
      <PageHero
        eyebrow="Social Proof"
        title="A thousand customers. Ask any of them."
        description="We did not write these. Every review is tied to a real booking, a real handover and a real name."
        breadcrumb={[{ label: "Testimonials" }]}
      />

      {/* --- Rating summary ---------------------------------------------- */}
      <Section className="bg-white !pb-0">
        <Container>
          <dl className="grid gap-px overflow-hidden rounded-sm bg-border sm:grid-cols-3">
            <div className="bg-navy-50 p-6 sm:p-8">
              <dt className="eyebrow text-muted-foreground">Average rating</dt>
              <dd className="mt-2 flex items-center gap-3">
                <span className="font-display text-3xl text-navy-900 sm:text-4xl">
                  {average.toFixed(1)}
                </span>
                <span
                  className="flex gap-0.5"
                  role="img"
                  aria-label={`${average.toFixed(1)} out of 5 stars`}
                >
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star
                      key={index}
                      aria-hidden="true"
                      className={
                        index < Math.round(average)
                          ? "size-4 fill-gold-500 text-gold-500"
                          : "size-4 text-navy-200"
                      }
                    />
                  ))}
                </span>
              </dd>
            </div>

            <div className="bg-navy-50 p-6 sm:p-8">
              <dt className="eyebrow text-muted-foreground">Published reviews</dt>
              <dd className="mt-2 font-display text-3xl text-navy-900 sm:text-4xl">
                {testimonials.length}
              </dd>
            </div>

            <div className="bg-navy-50 p-6 sm:p-8">
              <dt className="eyebrow text-muted-foreground">On video</dt>
              <dd className="mt-2 font-display text-3xl text-navy-900 sm:text-4xl">
                {videoCount}
              </dd>
            </div>
          </dl>
        </Container>
      </Section>

      {/* --- Reviews ------------------------------------------------------- */}
      <Section className="bg-white">
        <Container>
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
            {testimonials.map((testimonial) => (
              <li key={testimonial.id}>
                <TestimonialCard testimonial={testimonial} />
              </li>
            ))}
          </ul>

          <p className="mt-10 rounded-sm border border-border bg-navy-50 p-5 text-xs leading-relaxed text-muted-foreground">
            Every review here is from a verified buyer, tied to a booking in our
            CRM. Video playback and live Google Reviews are being wired in as part
            of the media integration.
          </p>
        </Container>
      </Section>

      {/* --- CTA ------------------------------------------------------------ */}
      <Section className="bg-navy-50 !py-16">
        <Container>
          <div className="flex flex-col items-start justify-between gap-6 rounded-sm bg-navy-900 p-8 sm:p-10 lg:flex-row lg:items-center">
            <div className="max-w-xl">
              <h2 className="text-2xl text-white sm:text-3xl">
                Bought with us? Tell the next buyer the truth.
              </h2>
              <p className="mt-3 leading-relaxed text-navy-200">
                Good or bad, we publish it. Reviews are what let a stranger trust
                us without taking our word for it.
              </p>
            </div>

            <Button
              href="/contact"
              variant="gold"
              size="lg"
              className="w-full shrink-0 lg:w-auto"
            >
              Leave a Review
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </Container>
      </Section>
    </>
  );
}

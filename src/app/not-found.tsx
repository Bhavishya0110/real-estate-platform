import { ArrowRight, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

/**
 * Every route in the BRD sitemap resolves, so this is only reached by a mistyped
 * or stale URL. When it is, it stays on-brand and routes the visitor somewhere
 * useful rather than dead-ending them.
 */
export default function NotFound() {
  return (
    <section className="relative isolate flex min-h-svh items-center overflow-hidden bg-navy-900 py-32">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(#C9A84C 1px, transparent 1px), linear-gradient(90deg, #C9A84C 1px, transparent 1px)",
          backgroundSize: "72px 72px",
        }}
      />

      <Container>
        <div className="max-w-2xl">
          <div className="flex items-center gap-3">
            <span className="gold-rule shrink-0" aria-hidden="true" />
            <span className="eyebrow text-gold-500">Error 404</span>
          </div>

          <h1 className="mt-6 text-[2.5rem] leading-[1.08] text-white sm:text-6xl">
            This address
            <span className="block text-gold-500 italic">does not exist.</span>
          </h1>

          <p className="mt-6 text-base leading-relaxed text-navy-200 sm:text-lg">
            The page you were looking for has moved or never existed. Our
            fourteen that definitely do exist are one click away.
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button href="/projects" variant="gold" size="lg" className="w-full sm:w-auto">
              <Compass className="size-4" aria-hidden="true" />
              Explore Projects
            </Button>

            <Button href="/" variant="onDark" size="lg" className="w-full sm:w-auto">
              Back to Home
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}

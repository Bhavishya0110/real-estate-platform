"use client";

import { useEffect } from "react";
import { ArrowRight, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

/**
 * Route-level error boundary.
 *
 * Says plainly that something broke on our side and offers a way forward, rather
 * than a blank screen or a stack trace. The digest is surfaced so a visitor can
 * quote it to support.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Replaced by the real telemetry sink when analytics is wired up.
    console.error(error);
  }, [error]);

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
            <span className="eyebrow text-gold-500">Something went wrong</span>
          </div>

          <h1 className="mt-6 text-[2.5rem] leading-[1.08] text-white sm:text-5xl">
            That is on us, not you.
          </h1>

          <p className="mt-6 text-base leading-relaxed text-navy-200 sm:text-lg">
            This page failed to load. Try again — and if it keeps happening, our
            team can help you directly.
          </p>

          {error.digest ? (
            <p className="mt-4 font-mono text-xs text-navy-400">
              Reference: {error.digest}
            </p>
          ) : null}

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button onClick={reset} variant="gold" size="lg" className="w-full sm:w-auto">
              <RefreshCw className="size-4" aria-hidden="true" />
              Try Again
            </Button>

            <Button href="/projects" variant="onDark" size="lg" className="w-full sm:w-auto">
              Browse Projects
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}

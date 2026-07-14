"use client";

import { useEffect, useRef, useState } from "react";
import { formatNumber } from "@/lib/format";

/**
 * Counts up once, the first time it scrolls into view.
 *
 * IntersectionObserver rather than a scroll listener so it costs nothing while
 * off-screen; honours prefers-reduced-motion by snapping straight to the value.
 */
export function Counter({
  value,
  suffix = "",
  durationMs = 1600,
}: {
  value: number;
  suffix?: string;
  durationMs?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setDisplay(value);
      return;
    }

    let frame = 0;
    let start: number | null = null;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();

        const tick = (timestamp: number) => {
          start ??= timestamp;
          const progress = Math.min((timestamp - start) / durationMs, 1);
          // easeOutExpo — fast start, gentle settle.
          const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

          setDisplay(Math.round(eased * value));
          if (progress < 1) frame = requestAnimationFrame(tick);
        };

        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value, durationMs]);

  return (
    <span ref={ref} className="tabular-nums">
      {formatNumber(display)}
      {suffix}
    </span>
  );
}

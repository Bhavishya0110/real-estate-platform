"use client";

import { useEffect } from "react";
import { siteConfig } from "@/lib/data/site-config";

/**
 * The last-resort error boundary.
 *
 * `error.tsx` handles a failure inside a page, but it renders *inside* the root
 * layout — so if the root layout itself throws, there is nothing left to catch
 * it and the visitor gets the browser's blank error page. This replaces the
 * whole document, which is why it carries its own <html> and <body> and why its
 * styling is inline: the stylesheet is part of what may have failed to load.
 */
export default function GlobalError({
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
    <html lang="en-IN">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0d1b2a",
          color: "#e3eaf1",
          fontFamily: "Georgia, 'Times New Roman', serif",
          padding: "2rem 1rem",
        }}
      >
        <main style={{ maxWidth: "34rem", textAlign: "center" }}>
          <p
            style={{
              margin: 0,
              fontFamily: "ui-sans-serif, system-ui, sans-serif",
              fontSize: "0.6875rem",
              fontWeight: 600,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "#c9a84c",
            }}
          >
            JMS Group
          </p>

          <h1
            style={{
              margin: "1.5rem 0 0",
              fontSize: "clamp(1.75rem, 6vw, 2.5rem)",
              lineHeight: 1.1,
              color: "#ffffff",
            }}
          >
            That is on us, not you.
          </h1>

          <p
            style={{
              margin: "1.5rem 0 0",
              fontFamily: "ui-sans-serif, system-ui, sans-serif",
              fontSize: "1rem",
              lineHeight: 1.7,
              color: "#c0d0df",
            }}
          >
            Something failed badly enough that we could not load the page at all.
            Try again — and if it keeps happening, call us on {siteConfig.phone}{" "}
            and we will help you directly.
          </p>

          {error.digest ? (
            <p
              style={{
                margin: "1rem 0 0",
                fontFamily: "ui-monospace, monospace",
                fontSize: "0.75rem",
                color: "#8aa7c4",
              }}
            >
              Reference: {error.digest}
            </p>
          ) : null}

          <button
            type="button"
            onClick={reset}
            style={{
              margin: "2.5rem 0 0",
              minHeight: "3rem",
              padding: "0.75rem 2rem",
              border: "none",
              borderRadius: "2px",
              backgroundColor: "#c9a84c",
              color: "#0d1b2a",
              fontFamily: "ui-sans-serif, system-ui, sans-serif",
              fontSize: "0.875rem",
              fontWeight: 500,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            Try Again
          </button>
        </main>
      </body>
    </html>
  );
}

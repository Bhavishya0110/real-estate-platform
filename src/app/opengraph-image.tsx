import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/data/site-config";

/**
 * The social card, generated at build time from the brand tokens.
 *
 * The root metadata declares `twitter.card: "summary_large_image"`, which
 * promises an image — without one, every share rendered as a bare text card.
 * Drawing it here rather than committing a PNG means the card cannot drift out
 * of step with the brand colours or the company name, and there is no binary in
 * the repository for someone to forget to update.
 *
 * No web font is loaded on purpose: fetching one would put a network call back
 * into the build, which is exactly what self-hosting the fonts removed. The
 * system serif is close enough at this size and cannot fail.
 */

export const alt = `${siteConfig.name} — ${siteConfig.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#0d1b2a",
          padding: "72px 80px",
        }}
      >
        {/* Brand mark */}
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 64,
              height: 64,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#c9a84c",
              color: "#0d1b2a",
              fontSize: 38,
              fontWeight: 700,
            }}
          >
            J
          </div>
          <div
            style={{
              color: "#ffffff",
              fontSize: 30,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
            }}
          >
            {siteConfig.name}
          </div>
        </div>

        {/* Positioning */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", width: 96, height: 4, backgroundColor: "#c9a84c" }} />
          <div
            style={{
              marginTop: 32,
              color: "#ffffff",
              fontSize: 68,
              lineHeight: 1.1,
              maxWidth: 900,
            }}
          >
            {siteConfig.tagline}
          </div>
          <div
            style={{
              marginTop: 28,
              color: "#c0d0df",
              fontSize: 30,
              lineHeight: 1.4,
              maxWidth: 860,
            }}
          >
            {siteConfig.positioning}
          </div>
        </div>

        {/* Footprint */}
        <div
          style={{
            display: "flex",
            color: "#8aa7c4",
            fontSize: 24,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}
        >
          Gurugram · National Capital Region
        </div>
      </div>
    ),
    size,
  );
}

import { ImageResponse } from "next/og";

/**
 * The site icon.
 *
 * There was no favicon of any kind, so every page load ended with the browser
 * asking for `/favicon.ico` and getting a 404, and the tab showed a blank
 * document sheet. Generated from the brand tokens for the same reason as the
 * social card: no binary to drift, and nothing fetched at build time.
 */

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0d1b2a",
          color: "#c9a84c",
          fontSize: 22,
          fontWeight: 700,
        }}
      >
        J
      </div>
    ),
    size,
  );
}

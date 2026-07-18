import localFont from "next/font/local";

/**
 * SELF-HOSTED TYPOGRAPHY
 *
 * The display serif and UI sans are served from this repository rather than
 * fetched from Google at build time. A build must never depend on reaching an
 * external host: `next/font/google` resolves its CSS and font binaries over the
 * network during the build, so an offline machine, a locked-down CI runner or a
 * Google outage turns into a failed deploy. These files are checked in, so the
 * build is hermetic and the browser makes no third-party request either.
 *
 * Both families are variable fonts — one file covers the whole weight axis,
 * which is why there is no file per weight.
 *
 * SUBSETS: Google splits each family by unicode range, and the rupee sign
 * (U+20B9) — which appears in almost every price on this site — lives in
 * `latin-ext`, not `latin`. `next/font/local` cannot put two unicode ranges in
 * one call, so each subset is its own face and they are chained in the font
 * stack (see `--font-sans` / `--font-display` in globals.css). The browser then
 * resolves per character: letters come from `latin`, ₹ comes from `latin-ext`,
 * and the larger extended file is only fetched when a page actually needs it.
 */

/* The unicode ranges below are repeated in full at every call site rather than
   shared through a constant: the font loader is compiled ahead of the module,
   so it only accepts literals and rejects any value it has to evaluate. The
   two ranges are Google's own `latin` and `latin-ext` definitions, unmodified —
   they must stay in step with the subset files they describe. */

/* --------------------------------------------------------------- UI sans */

export const inter = localFont({
  src: [{ path: "./inter-latin.woff2", weight: "100 900", style: "normal" }],
  variable: "--font-inter",
  display: "swap",
  // Metrics are measured from the file so the fallback occupies the same space
  // — this is what keeps swapping the real font in from shifting the layout.
  adjustFontFallback: "Arial",
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
  declarations: [
    {
      prop: "unicode-range",
      value:
        "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD",
    },
  ],
});

export const interExtended = localFont({
  src: [{ path: "./inter-latin-ext.woff2", weight: "100 900", style: "normal" }],
  variable: "--font-inter-ext",
  display: "swap",
  // Only reached for ₹ and other extended characters, so it must not compete
  // with the primary face for early bandwidth.
  preload: false,
  adjustFontFallback: false,
  declarations: [
    {
      prop: "unicode-range",
      value:
        "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF",
    },
  ],
});

/* ---------------------------------------------------------- display serif */

export const playfair = localFont({
  src: [
    { path: "./playfair-latin.woff2", weight: "400 900", style: "normal" },
    { path: "./playfair-italic-latin.woff2", weight: "400 900", style: "italic" },
  ],
  variable: "--font-playfair",
  display: "swap",
  adjustFontFallback: "Times New Roman",
  fallback: ["Georgia", "Times New Roman", "serif"],
  declarations: [
    {
      prop: "unicode-range",
      value:
        "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD",
    },
  ],
});

export const playfairExtended = localFont({
  src: [
    { path: "./playfair-latin-ext.woff2", weight: "400 900", style: "normal" },
  ],
  variable: "--font-playfair-ext",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  declarations: [
    {
      prop: "unicode-range",
      value:
        "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF",
    },
  ],
});

/** Every font variable, ready to hang on <body>. */
export const fontVariables = [
  inter.variable,
  interExtended.variable,
  playfair.variable,
  playfairExtended.variable,
].join(" ");

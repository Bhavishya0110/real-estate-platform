import type { MetadataRoute } from "next";
import { absoluteUrl, SITE_URL } from "@/lib/schema";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // The control panel and its sign-in route must never be indexed, and the
      // privacy notice is deliberately kept out of results. Trailing wildcards
      // so every nested path is covered, not just the exact segment.
      disallow: ["/admin", "/admin/*", "/login", "/privacy"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
    host: SITE_URL,
  };
}

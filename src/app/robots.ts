import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    // The control panel must never be indexed.
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/privacy"] },
    sitemap: "https://jmsgroup.co.in/sitemap.xml",
  };
}

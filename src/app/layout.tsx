import type { Metadata } from "next";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { SiteChrome } from "@/components/layout/site-chrome";
import { ChatbotWidget } from "@/features/chatbot/components/chatbot-widget";
import { buildKnowledgeSnapshot } from "@/features/chatbot/lib/knowledge";
import { siteConfig } from "@/lib/data/site-config";
import { organizationSchema, SITE_URL, websiteSchema } from "@/lib/schema";
import { fontVariables } from "./fonts";
import "./globals.css";

/* BRD §7 SEO — meta tags, friendly URLs, structured data, social cards. */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${siteConfig.name} — ${siteConfig.positioning}`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [
    "real estate Gurugram",
    "property in NCR",
    "residential projects Gurgaon",
    "commercial property Gurugram",
    "RERA approved",
    "JMS Group",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "/",
    siteName: siteConfig.name,
    title: `${siteConfig.name} — ${siteConfig.tagline}`,
    description: siteConfig.description,
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} — ${siteConfig.tagline}`,
    description: siteConfig.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Built on the server from the repository layer and handed to the assistant
  // once, so it answers instantly with no API call and no external service.
  const knowledge = await buildKnowledgeSnapshot();

  return (
    <html lang="en-IN">
      <body className={`${fontVariables} antialiased`}>
        {/* BRD §7 SEO — the brand and the site as entities, emitted once here
            so every page inherits them and pages only add what is specific to
            them (a project, an article, a role). */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([organizationSchema, websiteSchema]),
          }}
        />

        {/* Keyboard navigation — BRD §7 Accessibility */}
        <SiteChrome>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-100 focus:rounded-sm focus:bg-gold-500 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-navy-900"
          >
            Skip to content
          </a>

          <Navbar />
        </SiteChrome>

        <main id="main" className="min-h-screen">
          {children}
        </main>

        <SiteChrome>
          <Footer />

          {/* BRD §11 — the floating assistant, on every page of the public site.
              It carries the WhatsApp and call escalations, and escalates to a
              callback request when it cannot answer. */}
          <ChatbotWidget knowledge={knowledge} />
        </SiteChrome>
      </body>
    </html>
  );
}

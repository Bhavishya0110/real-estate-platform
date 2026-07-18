import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { ChatbotWidget } from "@/features/chatbot/components/chatbot-widget";
import { buildKnowledgeSnapshot } from "@/features/chatbot/lib/knowledge";
import { siteConfig } from "@/lib/data/content";
import "./globals.css";

/* Typography — a display serif for luxury headlines, a neutral sans for UI.
   BRD §12: "Consistent typeface hierarchy for readability and brand consistency". */
const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

/* BRD §7 SEO — meta tags, friendly URLs, structured data, social cards. */
export const metadata: Metadata = {
  metadataBase: new URL("https://jmsgroup.co.in"),
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
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: siteConfig.name,
    title: `${siteConfig.name} — ${siteConfig.tagline}`,
    description: siteConfig.description,
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} — ${siteConfig.tagline}`,
    description: siteConfig.description,
  },
  robots: { index: true, follow: true },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Built on the server from the repository layer and handed to the assistant
  // once, so it answers instantly with no API call and no external service.
  const knowledge = await buildKnowledgeSnapshot();

  /* BRD §7 SEO — Organization structured data, so search engines resolve the
     brand, its contact route and its verified social profiles. */
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    name: siteConfig.legalName,
    alternateName: siteConfig.name,
    url: "https://jmsgroup.co.in",
    description: siteConfig.description,
    foundingDate: String(siteConfig.foundedYear),
    telephone: siteConfig.phone,
    email: siteConfig.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: "M3M Tee Point, 7th Floor, North Block, Sector 65",
      addressLocality: "Gurugram",
      addressRegion: "Haryana",
      postalCode: "122018",
      addressCountry: "IN",
    },
    areaServed: "Gurugram and the National Capital Region",
    sameAs: siteConfig.social.map((social) => social.href),
  };

  return (
    <html lang="en-IN">
      <body className={`${playfair.variable} ${inter.variable} antialiased`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema),
          }}
        />

        {/* Keyboard navigation — BRD §7 Accessibility */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-100 focus:rounded-sm focus:bg-gold-500 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-navy-900"
        >
          Skip to content
        </a>

        <Navbar />

        <main id="main" className="min-h-screen">
          {children}
        </main>

        <Footer />

        {/* BRD §11 — the floating assistant, on every page. It carries the
            WhatsApp and call escalations that the old action bubble held. */}
        <ChatbotWidget knowledge={knowledge} />
      </body>
    </html>
  );
}

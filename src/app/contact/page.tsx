import type { Metadata } from "next";
import { Mail, MapPin, Phone } from "lucide-react";
import { UnderDevelopment } from "@/components/common/under-development";
import { WhatsAppIcon } from "@/components/common/whatsapp-icon";
import { PageHero } from "@/components/layout/page-hero";
import { Button } from "@/components/ui/button";
import { Container, Section } from "@/components/ui/container";
import { siteConfig } from "@/lib/data/content";
import { whatsappUrl } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Contact Us",
  description: `Speak to JMS Group — ${siteConfig.phone} · ${siteConfig.email} · ${siteConfig.address}`,
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Get In Touch"
        title="Talk to someone who can actually decide."
        description="No call-centre script and no gatekeeping — you reach the sales desk that owns the project you are asking about."
        breadcrumb={[{ label: "Contact" }]}
      />

      {/* --- Real, verified office details ------------------------------- */}
      <Section className="bg-white">
        <Container>
          <div className="grid gap-6 md:grid-cols-3">
            <ContactCard
              icon={<MapPin className="size-5" aria-hidden="true" />}
              label="Corporate Office"
              lines={[siteConfig.address]}
              action={{
                label: "Get Directions",
                href: `https://maps.google.com/?q=${encodeURIComponent(siteConfig.address)}`,
                external: true,
              }}
            />

            <ContactCard
              icon={<Phone className="size-5" aria-hidden="true" />}
              label="Call the Sales Desk"
              lines={[siteConfig.phone, siteConfig.landline]}
              action={{
                label: "Call Now",
                href: `tel:${siteConfig.phone.replace(/\s/g, "")}`,
              }}
            />

            <ContactCard
              icon={<Mail className="size-5" aria-hidden="true" />}
              label="Email Us"
              lines={[siteConfig.email]}
              action={{
                label: "Send an Email",
                href: `mailto:${siteConfig.email}`,
              }}
            />
          </div>

          <div className="mt-10 flex flex-col items-start gap-4 rounded-sm bg-navy-900 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div>
              <h2 className="text-xl text-white sm:text-2xl">
                Prefer WhatsApp? Most people do.
              </h2>
              <p className="mt-2 text-sm text-navy-300">
                Message the sales desk directly — typical reply inside the hour.
              </p>
            </div>

            <Button
              href={whatsappUrl(
                "Hi JMS Group, I'd like to speak to a sales advisor about your projects.",
              )}
              target="_blank"
              rel="noopener noreferrer"
              variant="gold"
              size="lg"
              className="w-full shrink-0 sm:w-auto"
            >
              <WhatsAppIcon className="size-4" />
              Chat on WhatsApp
            </Button>
          </div>
        </Container>
      </Section>

      <UnderDevelopment
        planned={[
          "A validated enquiry form with CAPTCHA, pushing leads straight into the CRM.",
          "Callback requests, with lead source captured automatically.",
          "An embedded Google Map of the Sector 65 corporate office.",
          "Site-visit scheduling, synced to Google Calendar with a WhatsApp reminder.",
          "GA4 event tracking on every form submission and WhatsApp click.",
        ]}
      />
    </>
  );
}

function ContactCard({
  icon,
  label,
  lines,
  action,
}: {
  icon: React.ReactNode;
  label: string;
  lines: string[];
  action: { label: string; href: string; external?: boolean };
}) {
  return (
    <article className="group flex flex-col rounded-sm border border-border bg-white p-6 transition-all duration-300 hover:border-gold-500/40 hover:shadow-luxe sm:p-8">
      <span className="flex size-12 items-center justify-center rounded-sm border border-navy-900/10 bg-navy-50 text-navy-900 transition-colors duration-300 group-hover:bg-gold-500 group-hover:text-navy-900">
        {icon}
      </span>

      <h2 className="mt-6 text-lg text-navy-900">{label}</h2>

      <div className="mt-3 flex-1 space-y-1">
        {lines.map((line) => (
          <p key={line} className="text-sm leading-relaxed text-muted-foreground">
            {line}
          </p>
        ))}
      </div>

      <Button
        href={action.href}
        {...(action.external
          ? { target: "_blank", rel: "noopener noreferrer" }
          : {})}
        variant="outline"
        size="sm"
        className="mt-6 self-start"
      >
        {action.label}
      </Button>
    </article>
  );
}

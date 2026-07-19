import type { Metadata } from "next";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";
import { WhatsAppIcon } from "@/components/common/whatsapp-icon";
import { Button } from "@/components/ui/button";
import { Container, Section } from "@/components/ui/container";
import { EnquiryForm } from "@/features/contact/components/enquiry-form";
import { siteConfig } from "@/lib/data/site-config";
import { getProjects } from "@/lib/data/projects";
import { telHref, whatsappUrl } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Contact Us",
  description: `Speak to JMS Group — ${siteConfig.phone} · ${siteConfig.email} · ${siteConfig.address}`,
  alternates: { canonical: "/contact" },
};

export default async function ContactPage() {
  const projects = await getProjects();
  const projectNames = projects.map((project) => project.name);
  const mapsQuery = encodeURIComponent(siteConfig.address);

  return (
    <>
      <PageHero
        eyebrow="Get In Touch"
        title="Talk to someone who can actually decide."
        description="No call-centre script and no gatekeeping — you reach the sales desk that owns the project you are asking about."
        breadcrumb={[{ label: "Contact" }]}
      />

      {/* --- Enquiry form + office details -------------------------------- */}
      <Section className="bg-white">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-20">
            {/* --- Form ---------------------------------------------------- */}
            <div>
              <div className="flex items-center gap-3">
                <span className="gold-rule shrink-0" aria-hidden="true" />
                <span className="eyebrow text-gold-600">Send an enquiry</span>
              </div>

              <h2 className="mt-5 text-[1.75rem] leading-[1.2] text-navy-900 sm:text-3xl">
                Tell us what you are looking for.
              </h2>

              <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
                Budget, location and timeline are enough for us to be useful. An
                advisor will come back to you — usually within the hour during
                business hours.
              </p>

              <div className="mt-10">
                <EnquiryForm projectNames={projectNames} />
              </div>
            </div>

            {/* --- Office ------------------------------------------------- */}
            <aside className="flex flex-col gap-6">
              <div className="rounded-sm bg-navy-900 p-7 sm:p-9">
                <h2 className="text-xl text-white sm:text-2xl">
                  Corporate office
                </h2>

                <address className="mt-6 space-y-5 text-sm not-italic">
                  <p className="flex items-start gap-3 text-navy-200">
                    <MapPin
                      className="mt-0.5 size-4 shrink-0 text-gold-500"
                      aria-hidden="true"
                    />
                    <span>{siteConfig.address}</span>
                  </p>

                  <a
                    href={telHref()}
                    className="flex items-start gap-3 text-navy-200 transition-colors hover:text-gold-500"
                  >
                    <Phone
                      className="mt-0.5 size-4 shrink-0 text-gold-500"
                      aria-hidden="true"
                    />
                    <span>
                      {siteConfig.phone}
                      {siteConfig.landline ? (
                        <span className="block text-xs text-navy-400">
                          {siteConfig.landline}
                        </span>
                      ) : null}
                    </span>
                  </a>

                  <a
                    href={`mailto:${siteConfig.email}`}
                    className="flex items-start gap-3 break-all text-navy-200 transition-colors hover:text-gold-500"
                  >
                    <Mail
                      className="mt-0.5 size-4 shrink-0 text-gold-500"
                      aria-hidden="true"
                    />
                    {siteConfig.email}
                  </a>

                  <p className="flex items-start gap-3 text-navy-200">
                    <Clock
                      className="mt-0.5 size-4 shrink-0 text-gold-500"
                      aria-hidden="true"
                    />
                    <span>
                      Monday to Saturday, 10am – 7pm
                      <span className="block text-xs text-navy-400">
                        Site visits can be arranged on Sundays by appointment.
                      </span>
                    </span>
                  </p>
                </address>

                <div className="mt-8 flex flex-col gap-3">
                  <Button
                    href={whatsappUrl(
                      "Hi JMS Group, I'd like to speak to a sales advisor about your projects.",
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="gold"
                    size="lg"
                  >
                    <WhatsAppIcon className="size-4" />
                    Chat on WhatsApp
                  </Button>

                  <Button
                    href={`https://maps.google.com/?q=${mapsQuery}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="onDark"
                    size="lg"
                  >
                    Get Directions
                  </Button>
                </div>
              </div>

              {/* An embedded interactive map arrives with the Maps API key. */}
              <div className="rounded-sm border border-border bg-navy-50 p-6">
                <h3 className="eyebrow font-sans text-gold-600">
                  Finding us
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  We are on the 7th floor of M3M Tee Point in Sector 65, on the
                  Golf Course Extension Road corridor. Visitor parking is
                  available in the basement.
                </p>
              </div>
            </aside>
          </div>
        </Container>
      </Section>
    </>
  );
}

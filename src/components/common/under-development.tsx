import { ArrowRight, Check, Compass } from "lucide-react";
import { WhatsAppIcon } from "@/components/common/whatsapp-icon";
import { Button } from "@/components/ui/button";
import { Container, Section } from "@/components/ui/container";
import { whatsappUrl } from "@/lib/whatsapp";

/**
 * The Phase 1 notice.
 *
 * Every route in the BRD sitemap resolves and returns 200 from day one. Where
 * the feature itself is still on the roadmap, this component states that
 * plainly — but presents it as a considered roadmap panel with live CTAs, so a
 * visitor who lands here still has somewhere to go and the sales team still
 * gets the lead.
 */
export function UnderDevelopment({
  /** What this page will do once built — written from the BRD. */
  planned,
  /** The BRD phase this feature is scheduled for. */
  phase = "Phase 1",
}: {
  planned: string[];
  phase?: string;
}) {
  return (
    <Section className="bg-white">
      <Container>
        <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
          {/* --- Status ---------------------------------------------------- */}
          <div>
            <span className="inline-flex items-center gap-2 rounded-sm border border-gold-500/40 bg-gold-50 px-3 py-1.5">
              {/* Pulsing dot reads as "actively being worked on", not "broken". */}
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-gold-500 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-gold-600" />
              </span>
              <span className="eyebrow text-gold-700">In Development</span>
            </span>

            <h2 className="mt-6 text-[1.75rem] leading-[1.2] text-navy-900 sm:text-3xl lg:text-4xl">
              This section is currently under development as part of {phase}.
            </h2>

            <p className="mt-5 text-[15px] leading-relaxed text-muted-foreground sm:text-base">
              We are building this page to the standard the rest of the site is
              held to, rather than shipping a placeholder that wastes your time.
              In the meantime, our sales team can answer anything this page would
              have told you — usually within the hour.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button href="/contact" variant="primary" size="lg" className="w-full sm:w-auto">
                Contact Us
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>

              <Button href="/projects" variant="outline" size="lg" className="w-full sm:w-auto">
                <Compass className="size-4" aria-hidden="true" />
                Explore Projects
              </Button>
            </div>
          </div>

          {/* --- What's coming --------------------------------------------- */}
          <div className="rounded-sm bg-navy-900 p-6 sm:p-8 lg:p-10">
            <span className="eyebrow text-gold-500">What this page will do</span>

            <ul className="mt-6 space-y-4">
              {planned.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span
                    className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-gold-500 text-navy-900"
                    aria-hidden="true"
                  >
                    <Check className="size-3" strokeWidth={3} />
                  </span>
                  <span className="text-sm leading-relaxed text-navy-200">
                    {item}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-8 border-t border-white/10 pt-6">
              <p className="text-sm text-navy-300">
                Need this information today?
              </p>

              <Button
                href={whatsappUrl(
                  "Hi JMS Group, I was browsing your website and would like to speak to an advisor.",
                )}
                target="_blank"
                rel="noopener noreferrer"
                variant="gold"
                size="md"
                className="mt-4 w-full sm:w-auto"
              >
                <WhatsAppIcon className="size-4" />
                Talk to an Advisor
              </Button>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}

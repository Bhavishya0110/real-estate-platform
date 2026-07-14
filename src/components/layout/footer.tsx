import Link from "next/link";
import { ArrowRight, Mail, MapPin, Phone, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/common/logo";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { getFeaturedProjects } from "@/lib/data/projects";
import { navigation, siteConfig } from "@/lib/data/content";

/**
 * BRD Home blueprint §12 — Footer:
 * Logo · Links · Projects · Social · RERA · Privacy · Contact,
 * 3-column dark navy layout, with Subscribe and Get Directions CTAs.
 *
 * Server component — it reads the project repository directly.
 */
export async function Footer() {
  const projects = await getFeaturedProjects(6);
  const year = new Date().getFullYear();

  return (
    <footer className="bg-navy-900 text-navy-200">
      {/* --- Newsletter band ------------------------------------------- */}
      <div className="border-b border-white/10">
        <Container>
          <div className="flex flex-col gap-8 py-12 lg:flex-row lg:items-center lg:justify-between lg:py-14">
            <div className="max-w-xl">
              <h2 className="text-xl text-white sm:text-2xl lg:text-3xl">
                New launches, before the market hears about them.
              </h2>
              <p className="mt-3 text-sm text-navy-300">
                Pre-launch pricing and project updates. No spam — unsubscribe in one click.
              </p>
            </div>

            {/* Wired to CRM/email service on a later milestone (BRD §6).
                Stacks on phones — an input and a button side by side inside a
                288px column leaves neither usable. */}
            <form
              className="flex w-full flex-col gap-3 sm:max-w-md sm:flex-row sm:gap-2"
              action="/contact"
            >
              <label htmlFor="footer-email" className="sr-only">
                Email address
              </label>
              <input
                id="footer-email"
                name="email"
                type="email"
                required
                placeholder="you@example.com"
                className="h-12 w-full min-w-0 rounded-sm border border-white/15 bg-white/5 px-4 text-sm text-white placeholder:text-navy-400 focus:border-gold-500 focus:outline-none"
              />
              <Button
                type="submit"
                variant="gold"
                size="md"
                className="h-12 w-full shrink-0 sm:w-auto"
              >
                Subscribe
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
            </form>
          </div>
        </Container>
      </div>

      {/* --- Three columns ---------------------------------------------- */}
      <Container>
        <div className="grid gap-10 py-12 sm:gap-12 md:grid-cols-2 lg:grid-cols-12 lg:gap-8 lg:py-16">
          {/* Column 1 — Brand + contact */}
          <div className="lg:col-span-5">
            <Logo onDark />

            <p className="mt-6 max-w-sm text-sm leading-relaxed text-navy-300">
              {siteConfig.description}
            </p>

            <address className="mt-8 space-y-3 text-sm not-italic">
              <a
                href={`tel:${siteConfig.phone.replace(/\s/g, "")}`}
                className="flex items-center gap-3 transition-colors hover:text-gold-500"
              >
                <Phone className="size-4 shrink-0 text-gold-500" aria-hidden="true" />
                {siteConfig.phone}
              </a>

              <a
                href={`mailto:${siteConfig.email}`}
                className="flex items-center gap-3 transition-colors hover:text-gold-500"
              >
                <Mail className="size-4 shrink-0 text-gold-500" aria-hidden="true" />
                {siteConfig.email}
              </a>

              <p className="flex items-start gap-3">
                <MapPin className="mt-0.5 size-4 shrink-0 text-gold-500" aria-hidden="true" />
                <span>{siteConfig.address}</span>
              </p>
            </address>

            <Button
              href={`https://maps.google.com/?q=${encodeURIComponent(siteConfig.address)}`}
              target="_blank"
              rel="noopener noreferrer"
              variant="onDark"
              size="sm"
              className="mt-6"
            >
              Get Directions
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          </div>

          {/* Column 2 — Projects */}
          <div className="lg:col-span-3">
            <FooterHeading>Projects</FooterHeading>
            <ul className="mt-6 space-y-3 text-sm">
              {projects.map((project) => (
                <li key={project.id}>
                  <Link
                    href={`/projects/${project.slug}`}
                    className="transition-colors hover:text-gold-500"
                  >
                    {project.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/projects"
                  className="inline-flex items-center gap-1 text-gold-500 hover:text-gold-400"
                >
                  View all 14
                  <ArrowRight className="size-3.5" aria-hidden="true" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3 — Explore + Company */}
          <div className="grid grid-cols-2 gap-6 sm:gap-8 lg:col-span-4">
            <div>
              <FooterHeading>Explore</FooterHeading>
              <ul className="mt-6 space-y-3 text-sm">
                {navigation.explore.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="transition-colors hover:text-gold-500"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <FooterHeading>Company</FooterHeading>
              <ul className="mt-6 space-y-3 text-sm">
                {navigation.company.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="transition-colors hover:text-gold-500"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </Container>

      {/* --- Legal bar --------------------------------------------------- */}
      <div className="border-t border-white/10">
        <Container>
          <div className="flex flex-col gap-6 py-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
              <p className="inline-flex items-center gap-2 text-xs text-navy-300">
                <ShieldCheck className="size-4 text-gold-500" aria-hidden="true" />
                MahaRERA: {siteConfig.reraNumber}
              </p>
              <p className="text-xs text-navy-400">
                © {year} {siteConfig.legalName}. All rights reserved.
              </p>
            </div>

            {/* Four labels + gaps exceed a 288px column, so they wrap. */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 sm:gap-x-6">
              {siteConfig.social.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs tracking-wide text-navy-300 transition-colors hover:text-gold-500"
                >
                  {social.label}
                </a>
              ))}
            </div>
          </div>
        </Container>
      </div>
    </footer>
  );
}

function FooterHeading({ children }: { children: React.ReactNode }) {
  return <h3 className="eyebrow font-sans text-gold-500">{children}</h3>;
}

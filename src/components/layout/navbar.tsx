"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, Phone, X } from "lucide-react";
import { Logo } from "@/components/common/logo";
import { WhatsAppIcon } from "@/components/common/whatsapp-icon";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { navigation, siteConfig } from "@/lib/data/content";
import { whatsappUrl } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

/**
 * BRD Home blueprint §01 — Navigation Bar:
 * Logo · Home · Projects · About · Blog · Careers · Contact + WhatsApp,
 * with Call Now and WhatsApp CTAs.
 *
 * Transparent over the hero, solid navy once scrolled.
 */
export function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  // The navbar sits over the hero on the homepage only; elsewhere it is solid
  // from the first pixel so text never lands on white.
  const overlay = pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the drawer on navigation, and lock body scroll while it is open.
  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const solid = scrolled || !overlay || open;

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        solid
          ? "border-b border-white/10 bg-navy-900/95 backdrop-blur-md"
          : "bg-transparent",
      )}
    >
      <Container>
        <div
          className={cn(
            "flex items-center justify-between gap-4 transition-all duration-300",
            scrolled ? "h-16 sm:h-18" : "h-18 sm:h-22",
          )}
        >
          <Logo onDark />

          {/* --- Desktop navigation ------------------------------------- */}
          <nav
            aria-label="Primary"
            className="hidden items-center gap-1 lg:flex"
          >
            {navigation.main.map((link) => {
              const active =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative px-4 py-2 text-sm font-medium tracking-wide transition-colors",
                    "after:absolute after:inset-x-4 after:-bottom-0.5 after:h-px after:origin-left after:scale-x-0",
                    "after:bg-gold-500 after:transition-transform after:duration-300 hover:after:scale-x-100",
                    active
                      ? "text-gold-500 after:scale-x-100"
                      : "text-navy-100 hover:text-white",
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* --- Desktop CTAs -------------------------------------------- */}
          <div className="hidden items-center gap-3 lg:flex">
            <a
              href={`tel:${siteConfig.phone.replace(/\s/g, "")}`}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm text-navy-100 transition-colors hover:text-gold-500"
            >
              <Phone className="size-4" aria-hidden="true" />
              Call Now
            </a>

            <Button
              href={whatsappUrl("Hi JMS Group, I'd like to know more about your projects.")}
              target="_blank"
              rel="noopener noreferrer"
              variant="gold"
              size="sm"
            >
              <WhatsAppIcon className="size-4" />
              WhatsApp
            </Button>
          </div>

          {/* --- Mobile trigger ------------------------------------------ */}
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            className="-mr-2 flex size-11 shrink-0 items-center justify-center text-white lg:hidden"
          >
            {open ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
      </Container>

      {/* --- Mobile drawer ---------------------------------------------- */}
      {/* The drawer can be taller than a short phone in landscape, so it scrolls
          within whatever height is left below the bar rather than clipping. */}
      <div
        id="mobile-nav"
        hidden={!open}
        className="max-h-[calc(100svh-4rem)] overflow-y-auto overscroll-contain border-t border-white/10 bg-navy-900 sm:max-h-[calc(100svh-4.5rem)] lg:hidden"
      >
        <Container className="py-6">
          <nav aria-label="Mobile" className="flex flex-col">
            {navigation.main.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="border-b border-white/5 py-4 font-display text-xl text-white transition-colors hover:text-gold-500 sm:text-2xl"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="mt-8 flex flex-col gap-3">
            <Button
              href={whatsappUrl("Hi JMS Group, I'd like to know more about your projects.")}
              target="_blank"
              rel="noopener noreferrer"
              variant="gold"
              size="lg"
            >
              <WhatsAppIcon className="size-4" />
              WhatsApp Us
            </Button>

            <Button
              href={`tel:${siteConfig.phone.replace(/\s/g, "")}`}
              variant="onDark"
              size="lg"
            >
              <Phone className="size-4" />
              {siteConfig.phone}
            </Button>
          </div>
        </Container>
      </div>
    </header>
  );
}

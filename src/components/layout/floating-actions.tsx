"use client";

import { useState } from "react";
import { MessageSquare, Phone, X } from "lucide-react";
import { WhatsAppIcon } from "@/components/common/whatsapp-icon";
import { siteConfig } from "@/lib/data/content";
import { whatsappUrl } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

/**
 * BRD Home blueprint §11 — Chatbot Bubble:
 * floating on all pages, pulsing availability dot, WhatsApp + brand colours.
 *
 * The 7 conversational flows are a Phase 2 deliverable; today this is the
 * entry point and it escalates straight to WhatsApp, which the BRD requires.
 */
export function FloatingActions() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed right-4 bottom-4 z-40 flex flex-col items-end gap-3 sm:right-8 sm:bottom-8">
      {/* --- Expanded actions ------------------------------------------- */}
      <div
        hidden={!open}
        className="flex flex-col items-end gap-3"
      >
        <FloatingLink
          href={whatsappUrl("Hi JMS Group, I'd like to speak to a sales advisor.")}
          label="Chat on WhatsApp"
          external
        >
          <WhatsAppIcon className="size-5" />
        </FloatingLink>

        <FloatingLink
          href={`tel:${siteConfig.phone.replace(/\s/g, "")}`}
          label={`Call ${siteConfig.phone}`}
        >
          <Phone className="size-5" />
        </FloatingLink>
      </div>

      {/* --- Trigger ------------------------------------------------------ */}
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={open ? "Close contact options" : "Open contact options"}
        className={cn(
          "relative flex size-14 items-center justify-center rounded-full shadow-luxe-lg transition-all duration-300",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500",
          open
            ? "bg-navy-800 text-white"
            : "bg-navy-900 text-gold-500 hover:bg-navy-800",
        )}
      >
        {open ? (
          <X className="size-6" />
        ) : (
          <>
            <MessageSquare className="size-6" />
            {/* Pulsing availability dot */}
            <span className="absolute top-1 right-1 flex size-3">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-3 rounded-full bg-emerald-500" />
            </span>
          </>
        )}
      </button>
    </div>
  );
}

function FloatingLink({
  href,
  label,
  external = false,
  children,
}: {
  href: string;
  label: string;
  external?: boolean;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      aria-label={label}
      {...(external
        ? { target: "_blank", rel: "noopener noreferrer" }
        : {})}
      className="group flex items-center gap-3"
    >
      <span className="rounded-sm bg-navy-900 px-3 py-1.5 text-xs font-medium text-white opacity-0 shadow-luxe transition-opacity duration-200 group-hover:opacity-100">
        {label}
      </span>
      <span className="flex size-12 items-center justify-center rounded-full bg-gold-500 text-navy-900 shadow-luxe transition-transform duration-200 group-hover:scale-105">
        {children}
      </span>
    </a>
  );
}

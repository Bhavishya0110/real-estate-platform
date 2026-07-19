import { siteConfig } from "@/lib/data/site-config";

/**
 * BRD acceptance criteria — "Clicking WhatsApp opens a conversation with the
 * configured business number." Centralised so every CTA prefills consistently
 * and the number is configured in exactly one place.
 */
export function whatsappUrl(message: string): string {
  return `https://wa.me/${siteConfig.whatsapp}?text=${encodeURIComponent(message)}`;
}

/**
 * A dialable `tel:` href.
 *
 * The stored number is formatted for reading, and a dialer will not accept the
 * spaces — the strip was being repeated at every call site, which is one edit
 * away from a CTA that silently does nothing.
 */
export function telHref(phone: string = siteConfig.phone): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

/** Project-scoped enquiry — lets the sales team see lead source immediately. */
export function projectEnquiryUrl(projectName: string): string {
  return whatsappUrl(
    `Hi JMS Group, I'm interested in ${projectName}. Please share the price list and availability.`,
  );
}

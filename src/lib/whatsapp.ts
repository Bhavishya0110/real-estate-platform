import { siteConfig } from "@/lib/data/content";

/**
 * BRD acceptance criteria — "Clicking WhatsApp opens a conversation with the
 * configured business number." Centralised so every CTA prefills consistently
 * and the number is configured in exactly one place.
 */
export function whatsappUrl(message: string): string {
  return `https://wa.me/${siteConfig.whatsapp}?text=${encodeURIComponent(message)}`;
}

/** Project-scoped enquiry — lets the sales team see lead source immediately. */
export function projectEnquiryUrl(projectName: string): string {
  return whatsappUrl(
    `Hi JMS Group, I'm interested in ${projectName}. Please share the price list and availability.`,
  );
}

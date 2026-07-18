"use server";

import {
  callbackRepository,
  leadRepository,
  notificationService,
  type CreateCallbackInput,
  type CreateLeadInput,
} from "@/lib/repositories";

/**
 * Server actions for lead capture.
 *
 * These are the *only* route by which the browser reaches the repository layer.
 * They are Next.js server actions rather than REST endpoints — no API surface is
 * introduced, and no external service is contacted.
 *
 * Validation is repeated here on purpose: the client validates for a fast, kind
 * user experience, and the server validates because client-side checks are a
 * convenience, never a guarantee.
 */

export interface ActionResult {
  ok: boolean;
  /** Field-level errors, keyed by field name. */
  errors?: Record<string, string>;
  /** A message safe to show the user. */
  message?: string;
}

function validateContact(name: string, phone: string) {
  const errors: Record<string, string> = {};

  if (!name.trim()) errors.name = "Please tell us your name.";
  const digits = phone.replace(/\D/g, "");
  if (!digits) errors.phone = "A phone number lets us call you back.";
  else if (digits.length < 10) errors.phone = "That number looks too short.";

  return errors;
}

export async function submitEnquiry(
  input: CreateLeadInput,
): Promise<ActionResult> {
  const errors = validateContact(input.name, input.phone);

  if (input.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
    errors.email = "That email address does not look right.";
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors, message: "Please check the highlighted fields." };
  }

  try {
    const lead = await leadRepository.create(input);
    // Notification failure must never lose a captured lead.
    await notificationService.notifyLead(lead).catch(() => undefined);

    return {
      ok: true,
      message: "Thank you — your enquiry has reached our sales desk.",
    };
  } catch {
    return {
      ok: false,
      message:
        "We could not save that just now. Please try again, or reach us on WhatsApp.",
    };
  }
}

export async function submitCallbackRequest(
  input: CreateCallbackInput,
): Promise<ActionResult> {
  const errors = validateContact(input.name, input.phone);
  if (!input.preferredTime.trim()) {
    errors.preferredTime = "When would suit you?";
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors, message: "Please check the highlighted fields." };
  }

  try {
    const request = await callbackRepository.create(input);
    await notificationService.notifyCallback(request).catch(() => undefined);

    return {
      ok: true,
      message: "Thank you — an advisor will call you at the time you asked for.",
    };
  } catch {
    return {
      ok: false,
      message:
        "We could not save that just now. Please try again, or reach us on WhatsApp.",
    };
  }
}

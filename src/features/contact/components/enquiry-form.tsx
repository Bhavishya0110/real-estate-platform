"use client";

import { useState } from "react";
import { AlertCircle, Send } from "lucide-react";
import { WhatsAppIcon } from "@/components/common/whatsapp-icon";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/data/content";
import { whatsappUrl } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

/**
 * BRD §5 Contact — "Submit enquiry, validate mandatory fields".
 *
 * There is no backend yet (CRM push is a later integration), so rather than
 * accepting a submission and quietly dropping it, this form validates the input
 * and then *delivers* it: the composed enquiry is handed to WhatsApp — or email
 * as a fallback — so the lead genuinely reaches the sales desk. The user is told
 * exactly what is happening, which a fake "thanks, we'll be in touch" would not.
 *
 * When the CRM endpoint lands, only `handleSubmit` changes.
 */

interface Fields {
  name: string;
  phone: string;
  email: string;
  interest: string;
  message: string;
}

type Errors = Partial<Record<keyof Fields, string>>;

const EMPTY: Fields = {
  name: "",
  phone: "",
  email: "",
  interest: "",
  message: "",
};

function validate(fields: Fields): Errors {
  const errors: Errors = {};

  if (!fields.name.trim()) errors.name = "Please tell us your name.";

  const digits = fields.phone.replace(/\D/g, "");
  if (!digits) errors.phone = "A phone number lets us call you back.";
  else if (digits.length < 10) errors.phone = "That number looks too short.";

  if (!fields.email.trim()) errors.email = "Please add an email address.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email))
    errors.email = "That email address does not look right.";

  return errors;
}

export function EnquiryForm({ projectNames }: { projectNames: string[] }) {
  const [fields, setFields] = useState<Fields>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [sent, setSent] = useState(false);

  function update(key: keyof Fields) {
    return (
      event: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) => {
      setFields((current) => ({ ...current, [key]: event.target.value }));
      setErrors((current) => ({ ...current, [key]: undefined }));
    };
  }

  /** The enquiry, formatted for a human reading it on a phone. */
  function composeMessage() {
    return [
      "New enquiry from the JMS Group website",
      `Name: ${fields.name}`,
      `Phone: ${fields.phone}`,
      `Email: ${fields.email}`,
      fields.interest ? `Interested in: ${fields.interest}` : null,
      fields.message ? `Message: ${fields.message}` : null,
    ]
      .filter(Boolean)
      .join("\n");
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const found = validate(fields);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    window.open(whatsappUrl(composeMessage()), "_blank", "noopener,noreferrer");
    setSent(true);
  }

  const mailtoHref = `mailto:${siteConfig.email}?subject=${encodeURIComponent(
    "Website enquiry",
  )}&body=${encodeURIComponent(composeMessage())}`;

  if (sent) {
    return (
      <div className="rounded-sm border border-border bg-navy-50 p-8 sm:p-10">
        <h2 className="font-display text-2xl text-navy-900">
          Your enquiry is ready to send.
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          We opened WhatsApp with your details filled in — press send there and it
          reaches the sales desk straight away. If the window did not open, use
          either option below.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Button
            href={whatsappUrl(composeMessage())}
            target="_blank"
            rel="noopener noreferrer"
            variant="gold"
            size="lg"
            className="w-full sm:w-auto"
          >
            <WhatsAppIcon className="size-4" />
            Open WhatsApp Again
          </Button>

          <Button href={mailtoHref} variant="outline" size="lg" className="w-full sm:w-auto">
            Send by Email Instead
          </Button>
        </div>

        <button
          type="button"
          onClick={() => {
            setFields(EMPTY);
            setSent(false);
          }}
          className="mt-6 text-sm font-medium text-gold-600 underline-offset-4 hover:underline"
        >
          Send another enquiry
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <Field
          id="enquiry-name"
          label="Your name"
          required
          value={fields.name}
          onChange={update("name")}
          error={errors.name}
          autoComplete="name"
        />

        <Field
          id="enquiry-phone"
          label="Phone number"
          required
          type="tel"
          value={fields.phone}
          onChange={update("phone")}
          error={errors.phone}
          autoComplete="tel"
        />
      </div>

      <Field
        id="enquiry-email"
        label="Email address"
        required
        type="email"
        value={fields.email}
        onChange={update("email")}
        error={errors.email}
        autoComplete="email"
      />

      {/* --- Project interest ------------------------------------------- */}
      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-navy-800">
          Which project are you interested in?
        </span>
        <select
          value={fields.interest}
          onChange={update("interest")}
          className="h-12 rounded-sm border border-border bg-white px-4 text-sm text-navy-900 focus:border-gold-500 focus:outline-none"
        >
          <option value="">Not sure yet — advise me</option>
          {projectNames.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </label>

      {/* --- Message ------------------------------------------------------ */}
      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-navy-800">
          Anything you want us to know?
        </span>
        <textarea
          value={fields.message}
          onChange={update("message")}
          rows={4}
          placeholder="Budget, preferred location, timeline…"
          className="rounded-sm border border-border bg-white p-4 text-sm text-navy-900 placeholder:text-muted-foreground focus:border-gold-500 focus:outline-none"
        />
      </label>

      <div className="flex flex-col gap-4">
        <Button type="submit" variant="primary" size="lg" className="w-full sm:w-auto">
          <Send className="size-4" aria-hidden="true" />
          Send Enquiry
        </Button>

        <p className="text-xs leading-relaxed text-muted-foreground">
          Your details go straight to our sales desk over WhatsApp. We do not sell
          your data — see our{" "}
          <a href="/privacy" className="text-gold-600 underline-offset-4 hover:underline">
            privacy policy
          </a>
          .
        </p>
      </div>
    </form>
  );
}

function Field({
  id,
  label,
  error,
  required = false,
  ...props
}: {
  id: string;
  label: string;
  error?: string;
  required?: boolean;
} & React.ComponentProps<"input">) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-medium text-navy-800">
        {label}
        {required ? (
          <span className="text-gold-600" aria-hidden="true">
            {" "}
            *
          </span>
        ) : null}
      </label>

      <input
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        {...props}
        className={cn(
          "h-12 rounded-sm border bg-white px-4 text-sm text-navy-900 focus:outline-none",
          error
            ? "border-red-500 focus:border-red-500"
            : "border-border focus:border-gold-500",
        )}
      />

      {error ? (
        <p
          id={`${id}-error`}
          role="alert"
          className="inline-flex items-center gap-1.5 text-xs text-red-600"
        >
          <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : null}
    </div>
  );
}

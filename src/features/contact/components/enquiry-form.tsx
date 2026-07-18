"use client";

import { useState, useTransition } from "react";
import { AlertCircle, CheckCircle2, Loader2, Send } from "lucide-react";
import { WhatsAppIcon } from "@/components/common/whatsapp-icon";
import { Button } from "@/components/ui/button";
import { submitEnquiry } from "@/lib/actions/leads";
import { whatsappUrl } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

/**
 * BRD §5 Contact — "Submit enquiry, validate mandatory fields".
 *
 * Submits through a server action into the lead repository. The client validates
 * first for a fast, kind experience; the server validates again because client
 * checks are a convenience, not a guarantee.
 *
 * WhatsApp remains available as a parallel route, not a substitute — some people
 * simply prefer it.
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

  if (fields.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) {
    errors.email = "That email address does not look right.";
  }

  return errors;
}

export function EnquiryForm({ projectNames }: { projectNames: string[] }) {
  const [fields, setFields] = useState<Fields>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [feedback, setFeedback] = useState("");
  const [pending, startTransition] = useTransition();

  function update(key: keyof Fields) {
    return (
      event: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) => {
      setFields((current) => ({ ...current, [key]: event.target.value }));
      setErrors((current) => ({ ...current, [key]: undefined }));
      if (status !== "idle") setStatus("idle");
    };
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (pending) return;

    const found = validate(fields);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setStatus("error");
      setFeedback("Please check the highlighted fields.");
      return;
    }

    startTransition(async () => {
      const result = await submitEnquiry({
        source: "contact-form",
        name: fields.name.trim(),
        phone: fields.phone.trim(),
        email: fields.email.trim() || undefined,
        interest: fields.interest || undefined,
        message: fields.message.trim() || undefined,
      });

      if (result.ok) {
        setStatus("success");
        setFeedback(result.message ?? "Thank you — we have your enquiry.");
        // Reset only on success, so a failure never destroys their typing.
        setFields(EMPTY);
        setErrors({});
      } else {
        setStatus("error");
        setErrors(result.errors ?? {});
        setFeedback(result.message ?? "Something went wrong. Please try again.");
      }
    });
  }

  /* --- Success ------------------------------------------------------------ */
  if (status === "success") {
    return (
      <div
        role="status"
        className="rounded-sm border border-emerald-600/30 bg-emerald-50 p-8 sm:p-10"
      >
        <span className="flex size-12 items-center justify-center rounded-full bg-emerald-600 text-white">
          <CheckCircle2 className="size-6" aria-hidden="true" />
        </span>

        <h2 className="mt-6 font-display text-2xl text-navy-900">
          Enquiry received.
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-navy-700">
          {feedback} An advisor will be in touch — usually within the hour during
          business hours.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Button
            href={whatsappUrl(
              "Hi JMS Group, I just submitted an enquiry on your website.",
            )}
            target="_blank"
            rel="noopener noreferrer"
            variant="gold"
            size="lg"
            className="w-full sm:w-auto"
          >
            <WhatsAppIcon className="size-4" />
            Continue on WhatsApp
          </Button>

          <Button
            onClick={() => setStatus("idle")}
            variant="outline"
            size="lg"
            className="w-full sm:w-auto"
          >
            Send another enquiry
          </Button>
        </div>
      </div>
    );
  }

  /* --- Form --------------------------------------------------------------- */
  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <Field
          id="enquiry-name"
          label="Your name"
          required
          disabled={pending}
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
          disabled={pending}
          value={fields.phone}
          onChange={update("phone")}
          error={errors.phone}
          autoComplete="tel"
        />
      </div>

      <Field
        id="enquiry-email"
        label="Email address"
        type="email"
        disabled={pending}
        value={fields.email}
        onChange={update("email")}
        error={errors.email}
        autoComplete="email"
      />

      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-navy-800">
          Which project are you interested in?
        </span>
        <select
          value={fields.interest}
          onChange={update("interest")}
          disabled={pending}
          className="h-12 rounded-sm border border-border bg-white px-4 text-sm text-navy-900 focus:border-gold-500 focus:outline-none disabled:opacity-60"
        >
          <option value="">Not sure yet — advise me</option>
          {projectNames.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-navy-800">
          Anything you want us to know?
        </span>
        <textarea
          value={fields.message}
          onChange={update("message")}
          disabled={pending}
          rows={4}
          placeholder="Budget, preferred location, timeline…"
          className="rounded-sm border border-border bg-white p-4 text-sm text-navy-900 placeholder:text-muted-foreground focus:border-gold-500 focus:outline-none disabled:opacity-60"
        />
      </label>

      {/* --- Error banner ---------------------------------------------------- */}
      {status === "error" && feedback ? (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-sm border border-red-500/30 bg-red-50 p-4 text-sm text-red-700"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {feedback}
        </p>
      ) : null}

      <div className="flex flex-col gap-4">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={pending}
          className="w-full sm:w-auto"
        >
          {pending ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Sending…
            </>
          ) : (
            <>
              <Send className="size-4" aria-hidden="true" />
              Send Enquiry
            </>
          )}
        </Button>

        {/* Announced to assistive tech without stealing focus. */}
        <span aria-live="polite" className="sr-only">
          {pending ? "Sending your enquiry" : ""}
        </span>

        <p className="text-xs leading-relaxed text-muted-foreground">
          We do not sell your data — see our{" "}
          <a
            href="/privacy"
            className="text-gold-600 underline-offset-4 hover:underline"
          >
            privacy policy
          </a>
          . Prefer WhatsApp?{" "}
          <a
            href={whatsappUrl("Hi JMS Group, I'd like to speak to an advisor.")}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gold-600 underline-offset-4 hover:underline"
          >
            Message us instead
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
          "h-12 rounded-sm border bg-white px-4 text-sm text-navy-900 focus:outline-none disabled:opacity-60",
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

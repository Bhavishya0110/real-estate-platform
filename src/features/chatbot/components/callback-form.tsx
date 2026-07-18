"use client";

import { useState, useTransition } from "react";
import { AlertCircle, CheckCircle2, Loader2, PhoneCall } from "lucide-react";
import { submitCallbackRequest } from "@/lib/actions/leads";
import { cn } from "@/lib/utils";

/**
 * The "Schedule a Call" path the assistant offers when it cannot answer.
 *
 * Stored through the callback repository, so it will migrate to PostgreSQL by
 * swapping the implementation. The question the assistant failed on travels with
 * the request, so the advisor who calls back already knows what was asked.
 */

const TIME_SLOTS = [
  "As soon as possible",
  "This morning",
  "This afternoon",
  "This evening",
  "Tomorrow morning",
  "Tomorrow afternoon",
  "This weekend",
];

export function CallbackForm({
  unansweredQuestion,
  onDone,
}: {
  unansweredQuestion?: string;
  onDone?: () => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [preferredTime, setPreferredTime] = useState(TIME_SLOTS[0]);
  const [message, setMessage] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);
  const [failure, setFailure] = useState("");
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (pending) return;

    const found: Record<string, string> = {};
    if (!name.trim()) found.name = "Please tell us your name.";
    const digits = phone.replace(/\D/g, "");
    if (!digits) found.phone = "We need a number to call.";
    else if (digits.length < 10) found.phone = "That number looks too short.";

    setErrors(found);
    if (Object.keys(found).length > 0) return;

    startTransition(async () => {
      const result = await submitCallbackRequest({
        name: name.trim(),
        phone: phone.trim(),
        preferredTime,
        message: message.trim() || undefined,
        unansweredQuestion,
      });

      if (result.ok) {
        setDone(true);
        onDone?.();
      } else {
        setErrors(result.errors ?? {});
        setFailure(result.message ?? "Could not save that. Please try again.");
      }
    });
  }

  if (done) {
    return (
      <div
        role="status"
        className="rounded-sm border border-emerald-600/30 bg-emerald-50 p-4"
      >
        <p className="flex items-start gap-2 text-sm text-navy-800">
          <CheckCircle2
            className="mt-0.5 size-4 shrink-0 text-emerald-600"
            aria-hidden="true"
          />
          <span>
            Thank you, {name.split(" ")[0]}. An advisor will call you{" "}
            <span className="font-semibold">{preferredTime.toLowerCase()}</span>.
          </span>
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="rounded-sm border border-border bg-white p-4"
    >
      <p className="flex items-center gap-2 text-sm font-semibold text-navy-900">
        <PhoneCall className="size-4 text-gold-600" aria-hidden="true" />
        Schedule a call
      </p>

      <div className="mt-3 flex flex-col gap-3">
        <MiniField
          id="cb-name"
          label="Name"
          value={name}
          disabled={pending}
          onChange={(event) => setName(event.target.value)}
          error={errors.name}
          autoComplete="name"
        />

        <MiniField
          id="cb-phone"
          label="Mobile number"
          type="tel"
          value={phone}
          disabled={pending}
          onChange={(event) => setPhone(event.target.value)}
          error={errors.phone}
          autoComplete="tel"
        />

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="cb-time"
            className="text-xs font-medium text-navy-700"
          >
            Preferred time
          </label>
          <select
            id="cb-time"
            value={preferredTime}
            disabled={pending}
            onChange={(event) => setPreferredTime(event.target.value)}
            className="h-10 rounded-sm border border-border bg-white px-3 text-sm text-navy-900 focus:border-gold-500 focus:outline-none disabled:opacity-60"
          >
            {TIME_SLOTS.map((slot) => (
              <option key={slot} value={slot}>
                {slot}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="cb-message"
            className="text-xs font-medium text-navy-700"
          >
            Message <span className="text-muted-foreground">(optional)</span>
          </label>
          <textarea
            id="cb-message"
            value={message}
            disabled={pending}
            onChange={(event) => setMessage(event.target.value)}
            rows={2}
            className="rounded-sm border border-border bg-white p-3 text-sm text-navy-900 focus:border-gold-500 focus:outline-none disabled:opacity-60"
          />
        </div>

        {failure ? (
          <p role="alert" className="text-xs text-red-600">
            {failure}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-sm bg-gold-500 text-sm font-medium text-navy-900 transition-colors hover:bg-gold-400 disabled:opacity-60"
        >
          {pending ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Requesting…
            </>
          ) : (
            "Request Call"
          )}
        </button>
      </div>
    </form>
  );
}

function MiniField({
  id,
  label,
  error,
  ...props
}: {
  id: string;
  label: string;
  error?: string;
} & React.ComponentProps<"input">) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-medium text-navy-700">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        {...props}
        className={cn(
          "h-10 rounded-sm border bg-white px-3 text-sm text-navy-900 focus:outline-none disabled:opacity-60",
          error ? "border-red-500" : "border-border focus:border-gold-500",
        )}
      />
      {error ? (
        <p
          id={`${id}-error`}
          role="alert"
          className="inline-flex items-center gap-1 text-[11px] text-red-600"
        >
          <AlertCircle className="size-3 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : null}
    </div>
  );
}

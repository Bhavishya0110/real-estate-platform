"use client";

import { useState, useTransition } from "react";
import { AlertCircle, Loader2, LogIn } from "lucide-react";
import { signIn } from "@/lib/actions/auth";

/**
 * The sign-in form.
 *
 * The only client-side validation is "both fields are filled" — anything more
 * would be pretending to know something about the credentials, and the server
 * is the only thing that actually decides.
 */
export function LoginForm({ from }: { from?: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      // A successful sign-in redirects from the server, so this only ever
      // returns when something went wrong.
      const result = await signIn(email, password, from);
      if (result && !result.ok) setError(result.message ?? "Sign-in failed.");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {error ? (
        <p
          role="alert"
          className="flex items-start gap-2.5 rounded-sm border border-red-500/30 bg-red-500/10 p-3.5 text-sm text-red-200"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      ) : null}

      <div>
        <label
          htmlFor="email"
          className="mb-2 block text-xs font-medium tracking-wide text-navy-300"
        >
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          aria-invalid={error ? true : undefined}
          className="h-12 w-full rounded-sm border border-white/15 bg-white/5 px-3.5 text-sm text-white placeholder:text-navy-500 focus:border-gold-500 focus:outline-none"
          placeholder="you@jmsgroup.co.in"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="mb-2 block text-xs font-medium tracking-wide text-navy-300"
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          aria-invalid={error ? true : undefined}
          className="h-12 w-full rounded-sm border border-white/15 bg-white/5 px-3.5 text-sm text-white focus:border-gold-500 focus:outline-none"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-sm bg-gold-500 text-sm font-medium tracking-wide text-navy-900 transition-colors hover:bg-gold-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <LogIn className="size-4" aria-hidden="true" />
        )}
        {pending ? "Signing in…" : "Sign in"}
      </button>

      {/* Announced to a screen reader without stealing focus from the form. */}
      <p aria-live="polite" className="sr-only">
        {pending ? "Signing in, please wait." : ""}
      </p>
    </form>
  );
}

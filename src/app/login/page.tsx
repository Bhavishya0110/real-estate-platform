import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { LoginForm } from "@/features/auth/components/login-form";
import { userRepository } from "@/lib/repositories";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to the JMS Group control panel.",
  // A sign-in page has nothing to offer a search result.
  robots: { index: false, follow: false },
};

/**
 * The control panel sign-in.
 *
 * Lives outside `/admin` so it is reachable without a session — the middleware
 * lets exactly this one route through unauthenticated, and bounces an operator
 * who is already signed in straight to the dashboard.
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const { from } = await searchParams;

  /* If no account has been configured, say so plainly. A sign-in form that can
     only ever fail is worse than an explanation of what is missing — and this
     tells an operator setting the site up exactly where to look, without
     revealing anything to anyone else (there is nothing to reveal yet). */
  const configured = (await userRepository.count()) > 0;

  return (
    <div
      data-bare-root
      className="flex min-h-svh flex-col items-center justify-center bg-[#0a1420] px-4 py-12 text-navy-100"
    >
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="flex size-11 items-center justify-center rounded-sm bg-gold-500 font-display text-lg text-navy-900">
            J
          </span>
          <h1 className="mt-5 font-display text-2xl text-white">JMS Admin</h1>
          <p className="mt-1.5 text-xs tracking-[0.18em] text-navy-400 uppercase">
            Control Panel
          </p>
        </div>

        <div className="rounded-sm border border-white/10 bg-navy-950 p-6 sm:p-8">
          {configured ? (
            <LoginForm from={from} />
          ) : (
            <div className="space-y-3 text-sm leading-relaxed text-navy-300">
              <p className="flex items-center gap-2 font-medium text-white">
                <ShieldCheck className="size-4 text-gold-500" aria-hidden="true" />
                No account configured
              </p>
              <p>
                Set <code className="text-gold-400">AUTH_SECRET</code> and{" "}
                <code className="text-gold-400">ADMIN_USERS</code> in the
                environment, then restart. See{" "}
                <code className="text-gold-400">.env.example</code> for the
                format and the command that generates a password hash.
              </p>
            </div>
          )}
        </div>

        <Link
          href="/"
          className="mt-6 flex items-center justify-center gap-2 text-xs text-navy-400 transition-colors hover:text-gold-400"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          Back to website
        </Link>
      </div>
    </div>
  );
}

"use client";

import { useTransition } from "react";
import { Loader2, LogOut } from "lucide-react";
import { signOut } from "@/lib/actions/auth";

/**
 * Ends the session.
 *
 * A button running a server action rather than a link, because signing out
 * changes state — a GET that a browser or a link-prefetcher could follow on its
 * own would sign an operator out for simply hovering.
 */
export function SignOutButton() {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() => startTransition(() => signOut())}
      disabled={pending}
      className="flex size-10 shrink-0 items-center justify-center rounded-sm text-navy-300 transition-colors hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
      aria-label={pending ? "Signing out" : "Sign out"}
    >
      {pending ? (
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      ) : (
        <LogOut className="size-4" aria-hidden="true" />
      )}
    </button>
  );
}

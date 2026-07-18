"use client";

import { useCallback, useEffect, useRef } from "react";

/**
 * Modal behaviour, in one place.
 *
 * Four surfaces open over the page — the mobile nav drawer, the admin sidebar,
 * the compare dialog and the assistant — and each had previously grown its own
 * copy of "lock the body, listen for Escape". They clobbered one another: every
 * cleanup wrote `overflow = ""` unconditionally, so closing one released the
 * lock still owned by another, and the page scrolled behind an open dialog.
 *
 * The lock is therefore ref-counted here rather than owned per component: the
 * body is unlocked only when the *last* holder lets go, and the value that was
 * there before is restored rather than assumed to be "".
 */

/* ------------------------------------------------------------- scroll lock */

let lockCount = 0;
let restoreOverflow = "";
let restorePaddingRight = "";

function acquireScrollLock() {
  if (lockCount === 0) {
    restoreOverflow = document.body.style.overflow;
    restorePaddingRight = document.body.style.paddingRight;

    // Removing the scrollbar reflows the page and shifts every fixed element.
    // Replacing its width with padding keeps the layout perfectly still — this
    // is the difference between a dialog that opens cleanly and one that makes
    // the whole page jump (a visible CLS hit).
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    if (scrollbar > 0) {
      document.body.style.paddingRight = `${scrollbar}px`;
    }

    document.body.style.overflow = "hidden";
  }

  lockCount += 1;
}

function releaseScrollLock() {
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount > 0) return;

  document.body.style.overflow = restoreOverflow;
  document.body.style.paddingRight = restorePaddingRight;
}

/**
 * Holds the page still while `active` is true.
 *
 * Safe to nest: two components holding the lock at once release it correctly in
 * either order, and unmounting while locked still releases.
 */
export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;

    acquireScrollLock();
    return releaseScrollLock;
  }, [active]);
}

/* -------------------------------------------------------------- focus trap */

/** Everything a keyboard can reach, in document order. */
const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

function focusableWithin(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE),
  ).filter(
    (element) =>
      !element.hasAttribute("aria-hidden") &&
      element.offsetWidth + element.offsetHeight > 0,
  );
}

export interface DialogOptions {
  open: boolean;
  onClose: () => void;
  /** Whether to hold the page still. Off for non-modal panels. */
  lockScroll?: boolean;
  /** Whether Tab is confined to the dialog. Off for non-modal panels. */
  trapFocus?: boolean;
}

/**
 * Wires up the behaviour a dialog owes a keyboard user: Escape closes it, focus
 * moves in on open, Tab cycles inside it, and focus returns to whatever opened
 * it on close.
 *
 * Returns the ref to spread onto the dialog container.
 */
export function useDialog<T extends HTMLElement>({
  open,
  onClose,
  lockScroll = true,
  trapFocus = true,
}: DialogOptions) {
  const containerRef = useRef<T>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  // Kept in a ref so an inline arrow from the caller does not re-run the effect
  // on every render and steal focus back mid-interaction.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useScrollLock(lockScroll && open);

  useEffect(() => {
    if (!open) return;

    // Remember where focus came from so it can be handed back on close.
    const opener =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    returnFocusRef.current = opener;

    // Captured for the cleanup below: by the time it runs the dialog is often
    // already unmounted and the ref has been nulled out.
    const container = containerRef.current;

    if (container) {
      // Prefer an explicitly marked target, then the first focusable control,
      // then the container itself so focus never stays behind the dialog.
      const target =
        container.querySelector<HTMLElement>("[data-autofocus]") ??
        focusableWithin(container)[0] ??
        container;

      if (target === container && !container.hasAttribute("tabindex")) {
        container.setAttribute("tabindex", "-1");
      }
      target.focus();
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onCloseRef.current();
        return;
      }

      if (event.key !== "Tab" || !trapFocus) return;

      const node = containerRef.current;
      if (!node) return;

      const focusable = focusableWithin(node);
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      // Wrap at both ends, and pull focus back if it has escaped the dialog.
      if (event.shiftKey && (active === first || !node.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || !node.contains(active))) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown, true);

    return () => {
      document.removeEventListener("keydown", onKeyDown, true);

      /* Only take focus back if it is still inside the dialog we are closing —
         if the user has already clicked elsewhere, leave them where they are.
         When the dialog unmounts, the focused element goes with it and the
         browser parks focus on <body>, which the second check catches. */
      const stillInside = container?.contains(document.activeElement) ?? false;
      if (stillInside || document.activeElement === document.body) {
        returnFocusRef.current?.focus?.();
      }
      returnFocusRef.current = null;
    };
  }, [open, trapFocus]);

  return containerRef;
}

/**
 * A timeout that cannot outlive the component that started it.
 *
 * Transient UI (a "you have reached the limit" hint, a "copied" flash) needs to
 * clear itself, and a bare `setTimeout` in a click handler will happily fire
 * into an unmounted tree — the exact shape of a React state-update warning.
 */
export function useTransientTimeout() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    },
    [],
  );

  return useCallback((callback: () => void, delayMs: number) => {
    if (timerRef.current !== null) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      callback();
    }, delayMs);
  }, []);
}

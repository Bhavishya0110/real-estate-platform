"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * A set of string ids persisted to localStorage and shared across every
 * component that reads the same key.
 *
 * Powers both Favorites and Compare — the only difference between them is the
 * storage key and an optional cap on how many items may be selected.
 *
 * Design notes:
 *   • SSR-safe. The first render always returns an empty set (matching the
 *     server-rendered HTML), then hydrates from storage in an effect. That
 *     avoids a hydration mismatch, which is why `ready` is exposed — callers
 *     use it to avoid flashing an empty state before storage has been read.
 *   • Cross-component sync. Storage events only fire in *other* tabs, so we
 *     also dispatch our own event to keep components in this tab in step.
 */

const SYNC_EVENT = "jms:local-set-change";

function read(key: string): string[] {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === "string") : [];
  } catch {
    // Private mode, quota errors, or corrupt data — behave as if empty.
    return [];
  }
}

function write(key: string, values: string[]) {
  try {
    window.localStorage.setItem(key, JSON.stringify(values));
  } catch {
    // Storage unavailable: the in-memory state still works for this session.
  }
  window.dispatchEvent(new CustomEvent(SYNC_EVENT, { detail: key }));
}

export function useLocalSet(key: string, max?: number) {
  const [items, setItems] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  // Hydrate after mount, and stay in sync with other components and tabs.
  useEffect(() => {
    setItems(read(key));
    setReady(true);

    const sync = (event: Event) => {
      if (event instanceof CustomEvent && event.detail !== key) return;
      setItems(read(key));
    };

    window.addEventListener(SYNC_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(SYNC_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [key]);

  const has = useCallback((id: string) => items.includes(id), [items]);

  /** Returns false when the item could not be added because the cap was hit. */
  const toggle = useCallback(
    (id: string) => {
      const current = read(key);

      if (current.includes(id)) {
        write(key, current.filter((value) => value !== id));
        return true;
      }

      if (max !== undefined && current.length >= max) return false;

      write(key, [...current, id]);
      return true;
    },
    [key, max],
  );

  const remove = useCallback(
    (id: string) => {
      write(key, read(key).filter((value) => value !== id));
    },
    [key],
  );

  const clear = useCallback(() => write(key, []), [key]);

  return { items, ready, has, toggle, remove, clear, isFull: max !== undefined && items.length >= max };
}

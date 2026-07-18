/**
 * Storage keys for the client-side selections.
 *
 * Namespaced so that a future migration to server-side saved searches (once
 * there are user accounts) can find and migrate them deterministically.
 */
export const FAVORITES_KEY = "jms:favorites";
export const COMPARE_KEY = "jms:compare";

/** The BRD's shortlist tool caps comparison at three projects. */
export const COMPARE_LIMIT = 3;

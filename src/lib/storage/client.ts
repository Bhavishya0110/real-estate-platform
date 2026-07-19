import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * SUPABASE STORAGE CLIENTS
 *
 * SERVER ONLY. Two clients, deliberately distinct:
 *
 *   • the anon client, which can read public buckets and nothing else;
 *   • the service client, which bypasses every storage policy.
 *
 * The service key must never reach the browser — it is unrestricted, and
 * anything holding it can read every résumé and every private document. It is
 * therefore read from a non-`NEXT_PUBLIC_` variable, and this module is marked
 * `server-only` so an accidental client import fails the build rather than
 * shipping the key to visitors.
 */

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `${name} is not set. Storage is unavailable — see .env.example for the required Supabase variables.`,
    );
  }
  return value;
}

let serviceClient: SupabaseClient | null = null;

/** Full-privilege client. Only for server actions that have already authorised. */
export function storageAdmin(): SupabaseClient {
  if (serviceClient) return serviceClient;

  serviceClient = createClient(
    required("NEXT_PUBLIC_SUPABASE_URL"),
    required("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );

  return serviceClient;
}

/** True when storage is configured at all, so callers can degrade gracefully. */
export function isStorageConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

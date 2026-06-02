import { createClient } from "@supabase/supabase-js"
import { SUPABASE_URL } from "./env"

/**
 * Service-role Supabase client — BYPASSES Row Level Security.
 *
 * SECURITY: this uses SUPABASE_SERVICE_ROLE_KEY, a server-only env var (NOT
 * NEXT_PUBLIC_). It must never be imported into a Client Component or shipped to
 * the browser. Only call it from server code that has already verified isAdmin().
 */
export function createAdminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY (server-only env var).")
  }
  return createClient(SUPABASE_URL, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

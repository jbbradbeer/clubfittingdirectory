import { createBrowserClient } from "@supabase/ssr"
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./env"

/**
 * Browser-side Supabase client.
 * Use this only inside Client Components ("use client").
 */
export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY)
}

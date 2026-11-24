import { createServerClient } from "@supabase/ssr"
import { createClient as createBrowserClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./env"

/**
 * Server-side Supabase client.
 * Used inside Server Components, Route Handlers, and Server Actions.
 * Reads cookies so it works with Row Level Security.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            )
          } catch {
            // setAll called from a Server Component — safe to ignore
          }
        },
      },
    },
  )
}

/**
 * Cookie-free static client for generateStaticParams and build-time fetches.
 * Uses the anon key — only reads public data.
 */
export function createStaticClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY)
}

/**
 * Static client whose reads carry the LISTING_SET_TAG cache tag. Use ONLY for
 * "list every shop" reads behind the sitemaps, llms.txt and
 * generateStaticParams — never inside a listing/city/state page render: the tag
 * would attach to that page and one hidden shop would rebuild all of them.
 *
 * Why it exists: revalidatePath("/sitemap.xml") rebuilt the file but could
 * still reuse a cached database response, so hidden shops stayed listed.
 */
export const LISTING_SET_TAG = "listing-set"

export function createListingSetClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      fetch: (input, init) =>
        fetch(input, { ...init, next: { tags: [LISTING_SET_TAG], revalidate: 86400 } }),
    },
  })
}

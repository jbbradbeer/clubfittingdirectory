/**
 * Reads and validates the Supabase connection settings in ONE place.
 *
 * If either value is missing this throws immediately with a clear message, so a
 * misconfigured deploy FAILS THE BUILD loudly instead of shipping a site that
 * silently can't reach the database.
 *
 * This is the exact failure mode that took the live site down: the variables
 * were never set in Vercel, the build succeeded anyway, and every page quietly
 * showed empty/blank content. With this guard in place, that build would stop
 * with the message below instead.
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  throw new Error(
    [
      "",
      "──────────────────────────────────────────────────────────────",
      " Missing Supabase environment variables.",
      "",
      " Set BOTH of these:",
      "   • NEXT_PUBLIC_SUPABASE_URL",
      "   • NEXT_PUBLIC_SUPABASE_ANON_KEY",
      "",
      " Where:",
      "   • Local dev  → web/.env.local",
      "   • Live site  → Vercel → Project → Settings → Environment Variables",
      "                  (then redeploy so the build picks them up)",
      "──────────────────────────────────────────────────────────────",
      "",
    ].join("\n"),
  )
}

export const SUPABASE_URL = url
export const SUPABASE_ANON_KEY = anonKey

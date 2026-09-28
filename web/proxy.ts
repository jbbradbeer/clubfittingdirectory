import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server"
import { matchAiBot } from "@/lib/ai-bots"

// Inlined (not imported from admin-auth.ts) so this stays free of node:crypto,
// which the Edge runtime can't load. Must match ADMIN_COOKIE there.
const ADMIN_COOKIE = "cfd_admin"
// Must match PORTAL_COOKIE in portal-auth.ts (same inlining rule).
const PORTAL_COOKIE = "cfd_portal"

/**
 * Edge gate for /admin (Next 16 "proxy" convention, formerly middleware). Runs
 * BEFORE any admin page renders, so an unauthenticated request to /admin never
 * reaches the server component (no page body, no metadata, no data fetch). The
 * page-level isAdmin() check still runs as defence-in-depth.
 *
 * Note: we only check that the cookie is PRESENT here (the edge can't safely
 * read ADMIN_PASSWORD/crypto). The authoritative constant-time hash comparison
 * happens in the page/action via isAdmin(). A forged-but-wrong cookie still gets
 * bounced there.
 */
/* ── AI-crawler hit logging (Phase 5 measurement) ──
   When a named AI crawler (lib/ai-bots.ts) fetches a page, record the hit in
   crawler_hits (migration 018) — the leading indicator that AI engines are
   reading the site. Strictly fire-and-forget: the insert is handed to
   event.waitUntil and every failure path is swallowed, so logging can never
   slow down or break a page response. */
/* Per-instance dedupe: the same bot re-fetching the same path within the
   window is not new information, and the User-Agent is client-supplied, so
   without this a loop of `curl -A GPTBot` could insert unbounded rows with
   the service key. The map is capped so it can't grow without limit. */
const HIT_DEDUPE_WINDOW_MS = 60_000
const HIT_DEDUPE_MAX_KEYS = 5_000
const recentHits = new Map<string, number>()

function isDuplicateHit(bot: string, pathname: string, now: number): boolean {
  const key = `${bot}\n${pathname}`
  const last = recentHits.get(key)
  if (last !== undefined && now - last < HIT_DEDUPE_WINDOW_MS) return true
  if (recentHits.size >= HIT_DEDUPE_MAX_KEYS) {
    for (const [k, t] of recentHits) if (now - t >= HIT_DEDUPE_WINDOW_MS) recentHits.delete(k)
    if (recentHits.size >= HIT_DEDUPE_MAX_KEYS) recentHits.clear()
  }
  recentHits.set(key, now)
  return false
}

function logCrawlerHit(bot: string, pathname: string, ua: string | null, event: NextFetchEvent) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!base || !key) return
  if (isDuplicateHit(bot, pathname, Date.now())) return
  try {
    event.waitUntil(
      fetch(`${base}/rest/v1/crawler_hits`, {
        method: "POST",
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({ bot, path: pathname, ua }),
      }).catch(() => {}),
    )
  } catch {
    /* never let telemetry affect the response */
  }
}

export function proxy(request: NextRequest, event: NextFetchEvent) {
  const { pathname } = request.nextUrl

  const ua = request.headers.get("user-agent")
  const bot = matchAiBot(ua)
  if (bot) logCrawlerHit(bot, pathname, ua, event)

  // Allow the login page through
  if (pathname === "/admin/login") return NextResponse.next()

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    const hasCookie = request.cookies.get(ADMIN_COOKIE)?.value
    if (!hasCookie) {
      const url = request.nextUrl.clone()
      url.pathname = "/admin/login"
      url.search = ""
      return NextResponse.redirect(url)
    }
  }

  // Owner portal: /portal (request-link page) and /portal/auth (magic-link
  // landing) are public; everything else needs the session cookie present.
  // Presence-only here — the authoritative HMAC check runs server-side in
  // getPortalSession() on every page and action.
  if (pathname.startsWith("/portal/") && pathname !== "/portal/auth") {
    const hasCookie = request.cookies.get(PORTAL_COOKIE)?.value
    if (!hasCookie) {
      const url = request.nextUrl.clone()
      url.pathname = "/portal"
      url.search = ""
      return NextResponse.redirect(url)
    }
  }
  return NextResponse.next()
}

export const config = {
  /* First entry covers every page route for crawler logging while excluding
     _next assets, /api, and any path with a file extension (images, icons,
     sitemap.xml is fine to skip). Admin/portal entries kept explicit so the
     auth gate's coverage is obvious and survives edits to the catch-all. */
  matcher: [
    "/((?!_next|api|.*\\..*).*)",
    "/admin",
    "/admin/:path*",
    "/portal",
    "/portal/:path*",
  ],
}

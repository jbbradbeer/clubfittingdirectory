import { NextResponse, type NextRequest } from "next/server"

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
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

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
  matcher: ["/admin", "/admin/:path*", "/portal", "/portal/:path*"],
}

import { NextResponse } from "next/server"
import { buildSessionCookie, verifyMagicToken, PORTAL_COOKIE } from "@/lib/portal-auth"
import { rateLimitOk, clientIp } from "@/lib/rate-limit"

/**
 * Magic-link landing: verify the signed token, set the 30-day session cookie,
 * send the owner to their edit page. Failures all land on /portal?error=expired
 * — no distinction between tampered and expired (nothing to learn).
 */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const fail = NextResponse.redirect(new URL("/portal?error=expired", url.origin))

  if (!rateLimitOk(`portal-auth:${clientIp(request)}`, 10, 15 * 60 * 1000)) return fail

  const email = verifyMagicToken(
    url.searchParams.get("e") ?? "",
    url.searchParams.get("x") ?? "",
    url.searchParams.get("s") ?? "",
  )
  if (!email) return fail

  const cookieValue = buildSessionCookie(email)
  if (!cookieValue) return fail

  const res = NextResponse.redirect(new URL("/portal/edit", url.origin))
  res.cookies.set(PORTAL_COOKIE, cookieValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
  })
  return res
}

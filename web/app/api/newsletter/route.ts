import { NextResponse } from "next/server"
import { log } from "@/lib/logger"
import { rateLimitOk, clientIp } from "@/lib/rate-limit"
import { str, isValidEmail, parseJsonBody, invalidBodyResponse, honeypotTripped } from "@/lib/api/validation"

/**
 * Public newsletter signup endpoint.
 * POST /api/newsletter  → adds the email to the beehiiv audience
 * ("The Tuxedo Collective") via beehiiv's API.
 *
 * The API key lives ONLY on the server (BEEHIIV_API_KEY, never NEXT_PUBLIC_),
 * so it is never exposed to the browser.
 */

const BEEHIIV_API = "https://api.beehiiv.com/v2"

export async function POST(request: Request) {
  // Same throttle the other public write routes use — the honeypot alone
  // doesn't stop a targeted script.
  if (!rateLimitOk(`newsletter:${clientIp(request)}`, 5, 10 * 60 * 1000)) {
    log.warn("api/newsletter", "rate limited", { ip: clientIp(request) })
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 })
  }

  const body = await parseJsonBody(request)
  if (!body) return invalidBodyResponse()
  if (honeypotTripped(body)) return NextResponse.json({ ok: true })

  // ── Validate ──
  const email = str(body.email, 200)
  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 })
  }

  const apiKey = process.env.BEEHIIV_API_KEY
  const pubId = process.env.BEEHIIV_PUBLICATION_ID
  if (!apiKey || !pubId) {
    log.error("api/newsletter", "missing BEEHIIV_API_KEY or BEEHIIV_PUBLICATION_ID env var")
    return NextResponse.json(
      { error: "Newsletter signup is temporarily unavailable. Please try again later." },
      { status: 500 },
    )
  }

  // Where on the site the visitor signed up (for beehiiv acquisition reporting).
  const source = str(body.source, 200)

  // ── Send to beehiiv ──
  try {
    const res = await fetch(`${BEEHIIV_API}/publications/${pubId}/subscriptions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        email,
        reactivate_existing: false,
        send_welcome_email: true,
        utm_source: "golf-directory",
        utm_medium: "website",
        referring_site: source || "club-fitting-directory",
      }),
    })

    if (!res.ok) {
      const detail = await res.text().catch(() => "")
      log.error("api/newsletter", "beehiiv request failed", { status: res.status, detail })
      return NextResponse.json(
        { error: "We couldn't sign you up just now. Please try again in a moment." },
        { status: 502 },
      )
    }
  } catch (e) {
    log.error("api/newsletter", "request to beehiiv failed", { error: e })
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    )
  }

  return NextResponse.json({ ok: true })
}

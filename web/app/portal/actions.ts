"use server"

import { cookies, headers } from "next/headers"
import { redirect } from "next/navigation"
import { buildMagicLink, getOwnedShops, PORTAL_COOKIE } from "@/lib/portal-auth"
import { sendPortalMagicLink } from "@/lib/email"
import { rateLimitOk } from "@/lib/rate-limit"
import { log } from "@/lib/logger"
import { SITE_URL } from "@/lib/constants"

/**
 * Request a magic sign-in link. ALWAYS returns the same neutral message —
 * whether or not the email matches a claimed shop — so the endpoint can't be
 * used to enumerate owner emails.
 */
export async function requestMagicLink(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase()

  // Rate limit per IP AND per email (3 per 15 min each).
  const h = await headers()
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
  if (
    !rateLimitOk(`portal-link:ip:${ip}`, 3, 15 * 60 * 1000) ||
    !rateLimitOk(`portal-link:email:${email}`, 3, 15 * 60 * 1000)
  ) {
    redirect("/portal?sent=1") // same neutral outcome — no signal
  }

  if (email && email.includes("@")) {
    try {
      const shops = await getOwnedShops(email)
      if (shops.length > 0) {
        const link = buildMagicLink(email, SITE_URL)
        if (link) await sendPortalMagicLink({ email, magicLink: link })
      }
    } catch (e) {
      log.error("portal", "magic-link request failed", { error: e })
    }
  }
  redirect("/portal?sent=1")
}

export async function portalLogout(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(PORTAL_COOKIE)
  redirect("/portal")
}

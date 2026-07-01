import { Resend } from "resend"
import { log } from "@/lib/logger"

/**
 * Transactional email via Resend.
 *
 * SECURITY / ENV: RESEND_API_KEY is a server-only env var (never NEXT_PUBLIC_).
 * Until it is set, sending is skipped silently — the booking flow still saves
 * every request to the database, so no lead is ever lost. Add the key locally
 * (web/.env.local) and in Vercel → Settings → Environment Variables, then redeploy.
 *
 * FROM: defaults to Resend's shared testing sender (onboarding@resend.dev), which
 * only delivers to the Resend account owner's address — perfect for the concierge
 * MVP where leads go to the founder. Once a domain is verified in Resend, set
 * BOOKING_FROM_EMAIL to a branded address (e.g. bookings@clubfittingdirectory.com).
 * TO: BOOKING_NOTIFY_EMAIL, defaulting to the founder's inbox.
 */

const FROM = process.env.BOOKING_FROM_EMAIL || "Club Fitting Directory <onboarding@resend.dev>"
const NOTIFY_TO = process.env.BOOKING_NOTIFY_EMAIL || "jamesbradbeer3@gmail.com"

export type FittingLead = {
  shopName: string | null
  shopSlug: string | null
  visitorName: string
  visitorEmail: string
  visitorPhone?: string | null
  fittingType?: string | null
  preferredDate?: string | null
  preferredTime?: string | null
  notes?: string | null
}

function row(label: string, value?: string | null): string {
  if (!value) return ""
  return `<tr><td style="padding:4px 12px 4px 0;color:#6b6b6b;font-size:13px;">${label}</td><td style="padding:4px 0;color:#0a0a0a;font-size:14px;font-weight:600;">${value}</td></tr>`
}

/**
 * Email the founder a new fitting lead. Returns true if sent, false if skipped
 * or failed — callers should treat this as best-effort and never block on it.
 */
export async function notifyNewFittingRequest(lead: FittingLead): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    log.warn("email", "RESEND_API_KEY not set — skipping lead notification (lead was still saved)")
    return false
  }

  const shopLine = lead.shopName || "a shop"
  const listingUrl = lead.shopSlug
    ? `https://clubfittingdirectory.com/listing/${lead.shopSlug}`
    : null

  const html = `
    <div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:560px;margin:0 auto;">
      <p style="font-size:18px;font-weight:700;color:#1B4332;margin:0 0 4px;">New fitting request</p>
      <p style="font-size:14px;color:#6b6b6b;margin:0 0 16px;">for <strong>${shopLine}</strong></p>
      <table style="border-collapse:collapse;width:100%;">
        ${row("Golfer", lead.visitorName)}
        ${row("Email", lead.visitorEmail)}
        ${row("Phone", lead.visitorPhone)}
        ${row("Fitting type", lead.fittingType)}
        ${row("Preferred date", lead.preferredDate)}
        ${row("Preferred time", lead.preferredTime)}
        ${row("Notes", lead.notes)}
      </table>
      ${listingUrl ? `<p style="margin-top:16px;font-size:13px;"><a href="${listingUrl}" style="color:#1B4332;">View the shop listing →</a></p>` : ""}
      <p style="margin-top:20px;font-size:12px;color:#9b9b9b;">Reply to this golfer directly, then relay the request to the shop.</p>
    </div>`

  try {
    const resend = new Resend(apiKey)
    const { error } = await resend.emails.send({
      from: FROM,
      to: NOTIFY_TO,
      replyTo: lead.visitorEmail,
      subject: `New fitting request — ${shopLine}`,
      html,
    })
    if (error) throw error
    return true
  } catch (e) {
    log.error("email", "failed to send fitting lead notification", { error: e })
    return false
  }
}

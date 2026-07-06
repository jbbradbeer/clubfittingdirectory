import { Resend } from "resend"
import { log } from "@/lib/logger"
import { CAL_FOUNDING_CALL_URL } from "@/lib/constants"

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
  /** Claimed shop's owner email — when set, the lead goes to the shop with the founder cc'd. */
  ownerEmail?: string | null
  visitorName: string
  visitorEmail: string
  visitorPhone?: string | null
  fittingType?: string | null
  preferredDate?: string | null
  preferredTime?: string | null
  notes?: string | null
}

/* Escape user-typed text before embedding it in email HTML, so a visitor
   can't inject markup/scripts into the notification email. */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function row(label: string, value?: string | null): string {
  if (!value) return ""
  return `<tr><td style="padding:4px 12px 4px 0;color:#6b6b6b;font-size:13px;">${label}</td><td style="padding:4px 0;color:#0a0a0a;font-size:14px;font-weight:600;">${escapeHtml(value)}</td></tr>`
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
  // shopSlug is visitor-supplied: only build the link from a strictly valid
  // slug so a crafted value can't inject markup/links into this email.
  const safeSlug = lead.shopSlug && /^[a-z0-9-]+$/.test(lead.shopSlug) ? lead.shopSlug : null
  const listingUrl = safeSlug
    ? `https://clubfittingdirectory.com/listing/${safeSlug}`
    : null

  const html = `
    <div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:560px;margin:0 auto;">
      <p style="font-size:18px;font-weight:700;color:#1B4332;margin:0 0 4px;">New fitting request</p>
      <p style="font-size:14px;color:#6b6b6b;margin:0 0 16px;">for <strong>${escapeHtml(shopLine)}</strong></p>
      <table style="border-collapse:collapse;width:100%;">
        ${row("Golfer", lead.visitorName)}
        ${row("Email", lead.visitorEmail)}
        ${row("Phone", lead.visitorPhone)}
        ${row("Fitting type", lead.fittingType)}
        ${row("Preferred date", lead.preferredDate)}
        ${row("Preferred time", lead.preferredTime)}
        ${row("Notes", lead.notes)}
      </table>
      ${listingUrl ? `<p style="margin-top:16px;font-size:13px;"><a href="${escapeHtml(listingUrl)}" style="color:#1B4332;">View the shop listing →</a></p>` : ""}
      <p style="margin-top:20px;font-size:12px;color:#9b9b9b;">${
        lead.ownerEmail
          ? "This golfer found you on Club Fitting Directory — just hit reply to reach them directly."
          : "Reply to this golfer directly, then relay the request to the shop."
      }</p>
    </div>`

  try {
    const resend = new Resend(apiKey)
    // Claimed shop: the lead goes straight to the owner (the free-claim
    // promise), with the founder cc'd for visibility. Unclaimed: founder-only.
    const { error } = await resend.emails.send({
      from: FROM,
      to: lead.ownerEmail || NOTIFY_TO,
      ...(lead.ownerEmail ? { cc: NOTIFY_TO } : {}),
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

/**
 * Confirm a shop claim to the claimant and invite them to book the founding
 * partner intro call. The founder is cc'd, which doubles as the new-claim
 * alert. Best-effort like the lead email: the claim row is already saved, so
 * a send failure must never fail the request.
 */
export async function sendClaimConfirmation(claim: {
  shopName: string
  claimantName: string
  claimantEmail: string
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    log.warn("email", "RESEND_API_KEY not set — skipping claim confirmation (claim was still saved)")
    return false
  }

  const html = `
    <div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:560px;margin:0 auto;">
      <p style="font-size:18px;font-weight:700;color:#1B4332;margin:0 0 4px;">We got your claim</p>
      <p style="font-size:14px;color:#6b6b6b;margin:0 0 16px;">for <strong>${escapeHtml(claim.shopName)}</strong></p>
      <p style="font-size:14px;color:#0a0a0a;line-height:1.6;margin:0 0 16px;">
        Hi ${escapeHtml(claim.claimantName)} — thanks for claiming your listing on
        Club Fitting Directory. We verify every claim by hand, usually within a
        day or two. Once approved, fitting requests from golfers go straight to
        this email address.
      </p>
      <p style="font-size:14px;color:#0a0a0a;line-height:1.6;margin:0 0 20px;">
        Want to skip the queue? Grab 15 minutes with the founder — we'll verify
        you on the call, fix anything on your listing, and walk through what
        founding partner shops get.
      </p>
      <p style="margin:0 0 24px;">
        <a href="${CAL_FOUNDING_CALL_URL}" style="display:inline-block;background:#1B4332;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 24px;border-radius:999px;">Book your intro call →</a>
      </p>
      <p style="font-size:12px;color:#9b9b9b;">Or just reply to this email — it reaches us directly.</p>
    </div>`

  try {
    const resend = new Resend(apiKey)
    const { error } = await resend.emails.send({
      from: FROM,
      to: claim.claimantEmail,
      cc: NOTIFY_TO,
      replyTo: NOTIFY_TO,
      subject: `Claim received — ${claim.shopName}`,
      html,
    })
    if (error) throw error
    return true
  } catch (e) {
    log.error("email", "failed to send claim confirmation", { error: e })
    return false
  }
}

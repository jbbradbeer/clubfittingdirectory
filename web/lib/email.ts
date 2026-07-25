import { Resend } from "resend"
import { log } from "@/lib/logger"
import { CAL_FOUNDING_CALL_URL, SITE_URL } from "@/lib/constants"
import { FEATURED_PERKS } from "@/lib/plans"

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
        day or two. Once approved, the free Verified badge goes live on your
        listing and fitting requests from golfers go straight to this email
        address.
      </p>
      <p style="font-size:14px;color:#0a0a0a;line-height:1.6;margin:0 0 20px;">
        Want to skip the queue? Grab 15 minutes with the founder — we'll verify
        you on the call and fix anything on your listing while we talk.
      </p>
      <p style="margin:0 0 24px;">
        <a href="${CAL_FOUNDING_CALL_URL}" style="display:inline-block;background:#1B4332;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 24px;border-radius:999px;">Begin verification on a call →</a>
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

/* Only build listing/pay links from strictly valid slugs so a crafted value
   can never inject markup into an email. */
const SLUG_RE = /^[a-z0-9-]+$/

/**
 * Sent automatically when the founder approves a claim (admin approveClaim).
 * Two jobs: confirm the free part is live (the Verified badge + leads now
 * forward to the owner), and pitch Featured while interest is at its peak —
 * perks + a payment-page link, which works immediately because /onboard/pay
 * is gated on claimed_at.
 */
export async function sendClaimApprovedEmail(args: {
  shopName: string
  slug: string
  ownerEmail: string
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    log.warn("email", "RESEND_API_KEY not set — skipping claim approved email")
    return false
  }
  if (!SLUG_RE.test(args.slug)) {
    log.error("email", "refusing claim approved email: invalid slug", { slug: args.slug })
    return false
  }

  const payUrl = `${SITE_URL}/onboard/pay/${args.slug}`
  const listingUrl = `${SITE_URL}/listing/${args.slug}`
  const perksHtml = FEATURED_PERKS.map(
    (p) => `<li style="margin:0 0 8px;">${escapeHtml(p.short)}</li>`,
  ).join("")

  const html = `
    <div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:560px;margin:0 auto;">
      <p style="font-size:18px;font-weight:700;color:#1B4332;margin:0 0 4px;">
        You're Verified — ${escapeHtml(args.shopName)} is yours
      </p>
      <p style="font-size:14px;color:#0a0a0a;line-height:1.6;margin:16px 0;">
        Your claim is approved. The green Verified badge is now live on
        <a href="${listingUrl}" style="color:#1B4332;">your listing</a> — free,
        permanently — and every fitting request golfers send through the page
        lands straight in this inbox.
      </p>
      <p style="font-size:14px;color:#0a0a0a;line-height:1.6;margin:0 0 8px;">
        <strong>Want more golfers landing on that listing?</strong> Featured is
        the growth layer on top:
      </p>
      <ul style="font-size:14px;color:#0a0a0a;line-height:1.6;margin:0 0 16px;padding-left:20px;">
        ${perksHtml}
      </ul>
      <p style="margin:0 0 8px;">
        <a href="${payUrl}" style="display:inline-block;background:#1B4332;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 24px;border-radius:999px;">
          Go Featured — $49/mo or $499/yr →
        </a>
      </p>
      <p style="font-size:12px;color:#9b9b9b;margin:0 0 16px;">
        Two months free on the annual plan. Secured by Stripe, cancel anytime.
      </p>
      <p style="font-size:14px;color:#0a0a0a;line-height:1.6;margin:0;">
        Questions first? Just reply — it reaches the founder directly.
      </p>
    </div>`

  try {
    const resend = new Resend(apiKey)
    const { error } = await resend.emails.send({
      from: FROM,
      to: args.ownerEmail,
      cc: NOTIFY_TO,
      replyTo: NOTIFY_TO,
      subject: `You're Verified — leads from ${args.shopName} now come to you`,
      html,
    })
    if (error) throw error
    return true
  } catch (e) {
    log.error("email", "failed to send claim approved email", { error: e })
    return false
  }
}

/**
 * Send a claimed shop's owner the payment link for Featured ($49/mo or
 * $499/yr — they pick the plan on the pay page). Triggered by the admin
 * "Send payment link" button — after the claim is approved (and usually
 * after the intro call). With renewal=true the copy shifts to the friendly
 * renewal note from the runbook.
 */
export async function sendPaymentLinkEmail(args: {
  shopName: string
  slug: string
  ownerEmail: string
  renewal?: boolean
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    log.warn("email", "RESEND_API_KEY not set — skipping payment link email")
    return false
  }
  if (!SLUG_RE.test(args.slug)) {
    log.error("email", "refusing payment link email: invalid slug", { slug: args.slug })
    return false
  }

  const payUrl = `${SITE_URL}/onboard/pay/${args.slug}`
  const intro = args.renewal
    ? `Your Featured membership for <strong>${escapeHtml(args.shopName)}</strong> is
       coming up for renewal. Renew and the top placement and Gear Shelf rotation
       carry straight on — $49/month or $499/year, whichever suits. (Your free
       Verified badge is never affected.)`
    : `Your Verified badge is already live, free. Featured is the growth layer:
       within minutes of payment, <strong>${escapeHtml(args.shopName)}</strong>
       moves to the top of its state and city pages, and we start your AI
       search tune-up. $49/month or $499/year (two months free on annual) —
       pick your plan on the payment page.`

  const html = `
    <div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:560px;margin:0 auto;">
      <p style="font-size:18px;font-weight:700;color:#1B4332;margin:0 0 4px;">
        ${args.renewal ? "Time to renew — Featured" : "Go Featured — put your shop at the top"}
      </p>
      <p style="font-size:14px;color:#0a0a0a;line-height:1.6;margin:16px 0;">${intro}</p>
      <p style="margin:0 0 24px;">
        <a href="${payUrl}" style="display:inline-block;background:#1B4332;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 24px;border-radius:999px;">
          ${args.renewal ? "Renew Featured" : "Activate Featured"} →
        </a>
      </p>
      <p style="font-size:12px;color:#9b9b9b;">
        Payment is handled securely by Stripe. Questions? Just reply — it reaches us directly.
      </p>
    </div>`

  try {
    const resend = new Resend(apiKey)
    const { error } = await resend.emails.send({
      from: FROM,
      to: args.ownerEmail,
      cc: NOTIFY_TO,
      replyTo: NOTIFY_TO,
      subject: args.renewal
        ? `Renew Featured — ${args.shopName}`
        : `Go Featured — ${args.shopName}`,
      html,
    })
    if (error) throw error
    return true
  } catch (e) {
    log.error("email", "failed to send payment link email", { error: e })
    return false
  }
}

/**
 * Welcome email after a successful Stripe payment — sent automatically by the
 * webhook. Automates the manual welcome step from
 * tasks/paid-activation-runbook.md; the founder cc doubles as the "payment
 * arrived" alert.
 */
export async function sendPaymentReceivedEmail(args: {
  shopName: string
  slug: string
  ownerEmail: string
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    log.warn("email", "RESEND_API_KEY not set — skipping payment welcome email")
    return false
  }
  if (!SLUG_RE.test(args.slug)) {
    log.error("email", "refusing payment welcome email: invalid slug", { slug: args.slug })
    return false
  }

  const listingUrl = `${SITE_URL}/listing/${args.slug}`
  const changesUrl = `${SITE_URL}/onboard/request-changes?shop=${args.slug}`

  const html = `
    <div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:560px;margin:0 auto;">
      <p style="font-size:18px;font-weight:700;color:#1B4332;margin:0 0 4px;">
        You're in — Featured
      </p>
      <p style="font-size:14px;color:#6b6b6b;margin:0 0 16px;">
        <strong>${escapeHtml(args.shopName)}</strong> is now Featured on the directory.
      </p>
      <p style="font-size:14px;color:#0a0a0a;line-height:1.6;margin:0 0 12px;">
        Payment received — your shop now sits at the top of its state, city, and
        category pages, with the gold Featured tag on
        <a href="${listingUrl}" style="color:#1B4332;">your listing</a>
        (give it a minute; the pages refresh automatically).
      </p>
      <p style="font-size:14px;color:#0a0a0a;line-height:1.6;margin:0 0 8px;">
        Four things to make the most of it:
      </p>
      <ol style="font-size:14px;color:#0a0a0a;line-height:1.7;margin:0 0 16px;padding-left:20px;">
        <li>Reply with your booking link and we'll put it on your profile.</li>
        <li><a href="${changesUrl}" style="color:#1B4332;">Send any corrections</a> (hours, services, photos) and we'll apply them.</li>
        <li>You're in the Gear Shelf rotation in The Tuxedo Collective newsletter (6,600 subscribers) — we'll let you know when your slot runs.</li>
        <li>Add a link to your listing from your website — "Featured on Club Fitting Directory" in the footer works. It helps your profile rank on Google, which sends more golfers through it.</li>
      </ol>
      <p style="font-size:14px;color:#0a0a0a;line-height:1.6;margin:0 0 16px;">
        Fitting requests golfers submit on your page go straight to this email.
        Questions, just reply.
      </p>
    </div>`

  try {
    const resend = new Resend(apiKey)
    const { error } = await resend.emails.send({
      from: FROM,
      to: args.ownerEmail,
      cc: NOTIFY_TO,
      replyTo: NOTIFY_TO,
      subject: `You're in — Featured on Club Fitting Directory`,
      html,
    })
    if (error) throw error
    return true
  } catch (e) {
    log.error("email", "failed to send payment welcome email", { error: e })
    return false
  }
}

/**
 * Founder-only alert for a new listing update request (mirrors
 * notifyNewFittingRequest). The request row is already saved — best-effort.
 */
export async function notifyUpdateRequest(args: {
  shopName: string
  shopSlug: string
  requesterName: string
  requesterEmail: string
  ownerMismatch: boolean
  fields: { label: string; value: string }[]
  message?: string | null
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    log.warn("email", "RESEND_API_KEY not set — skipping update request alert (request was still saved)")
    return false
  }

  const listingUrl = SLUG_RE.test(args.shopSlug)
    ? `${SITE_URL}/listing/${args.shopSlug}`
    : null

  const html = `
    <div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:560px;margin:0 auto;">
      <p style="font-size:18px;font-weight:700;color:#1B4332;margin:0 0 4px;">New listing update request</p>
      <p style="font-size:14px;color:#6b6b6b;margin:0 0 16px;">for <strong>${escapeHtml(args.shopName)}</strong></p>
      ${args.ownerMismatch ? `<p style="font-size:13px;color:#b45309;margin:0 0 12px;">⚠️ Requester email doesn't match the shop's owner email — double-check before applying.</p>` : ""}
      <table style="border-collapse:collapse;width:100%;">
        ${row("From", `${args.requesterName} <${args.requesterEmail}>`)}
        ${args.fields.map((f) => row(f.label, f.value)).join("")}
        ${row("Message", args.message)}
      </table>
      <p style="margin-top:16px;font-size:13px;">
        ${listingUrl ? `<a href="${escapeHtml(listingUrl)}" style="color:#1B4332;">View the listing →</a> · ` : ""}
        <a href="${SITE_URL}/admin/updates" style="color:#1B4332;">Review in admin →</a>
      </p>
    </div>`

  try {
    const resend = new Resend(apiKey)
    const { error } = await resend.emails.send({
      from: FROM,
      to: NOTIFY_TO,
      replyTo: args.requesterEmail,
      subject: `Listing update request — ${args.shopName}`,
      html,
    })
    if (error) throw error
    return true
  } catch (e) {
    log.error("email", "failed to send update request alert", { error: e })
    return false
  }
}

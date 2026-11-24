import { redactContact } from "@/lib/leads/redact"
import { MAILING_ADDRESS, SITE_URL } from "@/lib/constants"

/**
 * What an UNVERIFIED shop is told about a golfer's request. Pure, and the only
 * builder: the admin preview and the email both render exactly this, so what
 * the founder approves is what gets sent.
 *
 * The input type has no golfer name, email, or phone on purpose. They can't
 * leak through here.
 */
export type ShopRequest = {
  shopName: string
  shopSlug: string
  fittingType: string | null
  preferredDate: string | null
  preferredTime: string | null
  notes: string | null
}

const FITTING_LABELS: Record<string, string> = {
  driver: "Driver", irons: "Irons", wedges: "Wedges",
  putter: "Putter", full_bag: "Full bag", other: "Other / not sure",
}
const TIMES = new Set(["morning", "afternoon", "evening", "flexible"])

export type ShopMessage = {
  subject: string
  intro: string
  details: { label: string; value: string }[]
  reply: string
  claim: string
  claimUrl: string
  footer: string
}

export function buildShopMessage(r: ShopRequest): ShopMessage {
  const details: { label: string; value: string }[] = []
  details.push({ label: "Looking for", value: FITTING_LABELS[r.fittingType ?? ""] ?? "A fitting" })
  // Only the date picker's own format; anything else was typed past the form.
  if (r.preferredDate && /^\d{4}-\d{2}-\d{2}$/.test(r.preferredDate)) {
    details.push({ label: "Preferred date", value: r.preferredDate })
  }
  if (r.preferredTime && TIMES.has(r.preferredTime)) {
    details.push({ label: "Preferred time", value: r.preferredTime })
  }
  const notes = redactContact(r.notes)
  if (notes) details.push({ label: "Notes", value: notes })

  return {
    subject: `A golfer asked about a fitting at ${r.shopName}`.replace(/[\r\n]+/g, " "),
    intro: `A golfer used Club Fitting Directory to ask about a fitting at ${r.shopName}.`,
    details,
    reply: "Reply to this email and we'll check with the golfer and connect you.",
    claim: "Or claim your listing, free. Once we confirm you run the shop, we'll send you the golfer's contact details, and future requests come straight to you.",
    claimUrl: `${SITE_URL}/claim/${r.shopSlug}?src=outreach`,
    footer: `You're receiving this because ${r.shopName} is listed on Club Fitting Directory. If you'd rather not get golfer requests, reply "no thanks" and we'll stop. ${MAILING_ADDRESS}`,
  }
}

/** A single plain address: one recipient, nothing that could add another. */
export function isSingleAddress(email: string): boolean {
  return email.length <= 200 && /^[^@\s,;<>"()[\]\\]+@[^@\s,;<>"()[\]\\]+\.[^@\s,;<>"()[\]\\]+$/.test(email)
}

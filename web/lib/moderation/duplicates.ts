import { namesSimilar, ownHost, phoneDigits } from "@/lib/moderation/normalize"

/**
 * Duplicate detection for new-shop submissions. Of the first 7 submissions
 * approved by hand, 5 were already listed under a slightly different name,
 * suburb, or phone format — this makes that visible before approval.
 *
 * Pure: the caller supplies the existing shops (INCLUDING inactive ones, so a
 * shop we deliberately removed doesn't come back through the form).
 */

export type DuplicateCandidate = {
  name: string
  city: string
  state_code: string
  website: string | null
  phone: string | null
}

export type ExistingShop = {
  id: string
  slug: string
  name: string
  city: string | null
  state_code: string | null
  website: string | null
  phone: string | null
  status: string | null
}

export type DuplicateMatch = {
  shop: ExistingShop
  reasons: string[]
  /** Strong enough to block one-click approval. Otherwise it's just a hint. */
  likely: boolean
}

export function findDuplicates(sub: DuplicateCandidate, existing: ExistingShop[]): DuplicateMatch[] {
  const host = ownHost(sub.website)
  const phone = phoneDigits(sub.phone)
  const city = sub.city.trim().toLowerCase()
  const state = sub.state_code.toUpperCase()

  const matches: DuplicateMatch[] = []
  for (const shop of existing) {
    const sameState = (shop.state_code ?? "").toUpperCase() === state
    const sameCity = sameState && (shop.city ?? "").trim().toLowerCase() === city
    const samePhone = phone !== null && phoneDigits(shop.phone) === phone
    const sameHost = host !== null && ownHost(shop.website) === host
    const similarName = namesSimilar(sub.name, shop.name)

    const reasons: string[] = []
    if (samePhone) reasons.push("same phone number")
    if (sameHost) reasons.push("same website")
    if (similarName && sameState) reasons.push(sameCity ? "similar name in the same city" : "similar name in the same state")
    if (reasons.length === 0) continue

    matches.push({
      shop,
      reasons,
      // A chain's other branch shares a website but sits in another state or
      // has its own name; that stays a hint. The same site in the same state
      // is treated as likely — a person can confirm it's a second location.
      likely: samePhone || (sameHost && sameState) || (similarName && sameCity),
    })
  }
  return matches.sort(
    (a, b) => Number(b.likely) - Number(a.likely) || b.reasons.length - a.reasons.length || a.shop.slug.localeCompare(b.shop.slug),
  )
}

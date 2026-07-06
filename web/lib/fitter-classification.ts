/* ─────────────────────────────────────────────────────────
   FITTER CLASSIFICATION — the ownership_type vocabulary
   (shops.ownership_type, backfilled by migration 012 through
   the provenance ledger). Values must match the CHECK
   constraint in migration 011. `unknown`/null render nothing.
   This is descriptive metadata, NOT a quality tier — keep it
   out of lib/badges.ts (Verified/Featured/Top Rated).
   ───────────────────────────────────────────────────────── */

import type { Shop } from "@/types/shop"

export interface OwnershipOptionDef {
  /** shops.ownership_type value, embedded in a PostgREST .in() filter */
  value: string
  /** Checkbox / chip label shown in the UI */
  label: string
}

export const OWNERSHIP_OPTIONS: OwnershipOptionDef[] = [
  { value: "independent", label: "Independent Fitter" },
  { value: "national_chain", label: "National Fitting Chain" },
  { value: "big_box", label: "Big Box Retailer" },
  { value: "oem", label: "Brand Fitting Studio" },
]

const LABELS: Record<string, string> = Object.fromEntries(
  OWNERSHIP_OPTIONS.map((o) => [o.value, o.label]),
)

/** Display label for an ownership_type; null for unknown/unset. */
export function ownershipLabel(type: Shop["ownership_type"]): string | null {
  if (!type) return null
  return LABELS[type] ?? null
}

/* Compact card labels — cards skip big_box (the shop_type eyebrow already says
   "Retailer" there) and unknown/null; the full label still shows on the
   listing page. */
const CARD_LABELS: Record<string, string> = {
  independent: "Independent",
  national_chain: "National Chain",
  oem: "Brand Studio",
}

/** Short label for ListingCard; null when the card shouldn't show one. */
export function ownershipCardLabel(type: Shop["ownership_type"]): string | null {
  if (!type) return null
  return CARD_LABELS[type] ?? null
}

/** Price range in whole USD → display string ("From $150" / "$150–$400"). */
export function formatFittingPrice(
  min: number | null | undefined,
  max: number | null | undefined,
): string | null {
  if (min != null && max != null && max !== min) return `$${min}–$${max}`
  if (min != null) return `From $${min}`
  if (max != null) return `Up to $${max}`
  return null
}

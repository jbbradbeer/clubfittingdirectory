import { ShieldCheck, ShieldAlert, ShieldQuestion } from "lucide-react"
import type { VerificationLevel } from "@/lib/supabase/queries/provenance"

/**
 * Provenance / confidence badge for a listing, driven by the facts ledger.
 * Distinct from the solid Google "Verified" badge: this is an outline "meta"
 * chip with a tooltip explaining where the data stands. "Unverified" is styled
 * muted (informational, not alarming) and invites the owner to claim the shop.
 */
const CONFIG: Record<
  VerificationLevel,
  { icon: typeof ShieldCheck; label: string; title: string; cls: string }
> = {
  owner_verified: {
    icon: ShieldCheck,
    label: "Owner-verified",
    title: "Key details on this listing have been confirmed by the shop owner.",
    cls: "border-[var(--color-forest)]/30 text-[var(--color-forest)] bg-[var(--color-forest)]/5",
  },
  partially_verified: {
    icon: ShieldAlert,
    label: "Partly verified",
    title: "Some details have been confirmed by the shop owner; others are from public listings.",
    cls: "border-[var(--color-gold)]/40 text-[var(--color-gold-ink)] bg-[var(--color-gold)]/10",
  },
  unverified: {
    icon: ShieldQuestion,
    label: "Unverified",
    title:
      "Sourced from public listings and not yet confirmed by the shop. Own this shop? Claim it to verify these details.",
    cls: "border-[var(--color-border)] text-[var(--color-charcoal-light)] bg-[var(--color-cream)]",
  },
}

export function ProvenanceBadge({ level }: { level: VerificationLevel }) {
  // Positive-only signal: default scraped data shows NO chip (avoids an
  // "Unverified" label across the whole directory). The badge appears only once
  // a listing has real owner/admin verification. Flip this guard to also render
  // the muted "unverified" state if you ever want full transparency.
  if (level === "unverified") return null

  const { icon: Icon, label, title, cls } = CONFIG[level]
  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${cls}`}
    >
      <Icon size={13} aria-hidden="true" />
      {label}
    </span>
  )
}

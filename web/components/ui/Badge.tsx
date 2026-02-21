import { type ReactNode } from "react"

/* ─────────────────────────────────────────────────────────
   BADGE
   Small pill labels used for shop_type, services, and
   verification status throughout the directory.

   Variants:
   • default  — ivory text, green border (neutral tags)
   • brass    — brass text + border (premium / highlight)
   • verified — small brass checkmark + "Verified" label
   ───────────────────────────────────────────────────────── */

type BadgeVariant = "default" | "brass" | "verified"

interface BadgeProps {
  children?: ReactNode
  variant?: BadgeVariant
  className?: string
}

export function Badge({
  children,
  variant = "default",
  className = "",
}: BadgeProps) {
  const base =
    "inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-medium tracking-wide whitespace-nowrap transition-colors"

  const variants: Record<BadgeVariant, string> = {
    default:
      "border border-[color-mix(in_srgb,var(--color-ivory)_30%,transparent)] text-[var(--color-ivory-warm)] bg-[color-mix(in_srgb,var(--color-green-light)_20%,transparent)]",
    brass:
      "border border-[var(--color-brass)] text-[var(--color-brass)] bg-[color-mix(in_srgb,var(--color-brass)_8%,transparent)]",
    verified:
      "border border-[var(--color-brass)] text-[var(--color-brass)] bg-[color-mix(in_srgb,var(--color-brass)_8%,transparent)]",
  }

  if (variant === "verified") {
    return (
      <span className={`${base} ${variants.verified} ${className}`}>
        <CheckmarkIcon />
        Verified
      </span>
    )
  }

  return (
    <span className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </span>
  )
}

/* Small inline brass checkmark SVG */
function CheckmarkIcon() {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M1.5 5L4 7.5L8.5 2.5"
        stroke="var(--color-brass)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

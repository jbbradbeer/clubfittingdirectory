import { type ReactNode } from "react"

/* ─────────────────────────────────────────────────────────
   BADGE
   Small pill labels for shop types, services, and status.

   Variants:
   • default   — green outlined pill
   • highlight — solid green fill, white text (highlight)
   • verified  — green checkmark + "Verified" label
   ───────────────────────────────────────────────────────── */

type BadgeVariant = "default" | "highlight" | "verified"

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
      "border border-[var(--color-green-deep)] text-[var(--color-green-deep)] bg-transparent",
    highlight:
      "border border-[var(--color-green-deep)] text-white bg-[var(--color-green-deep)]",
    verified:
      "border border-[var(--color-green-deep)] text-[var(--color-green-deep)] bg-[#1B43320A]",
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
        stroke="var(--color-green-deep)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

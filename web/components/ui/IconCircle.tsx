import type { ReactNode } from "react"

/**
 * Circular icon badge used for feature trios (about pillars, contact
 * reasons, newsletter perks) and card accents.
 */

const SIZES = {
  sm: "w-10 h-10",
  md: "w-12 h-12",
  lg: "w-16 h-16",
} as const

const TONES = {
  tint: "bg-[var(--color-forest-tint)] text-[var(--color-forest)]",
  forest: "bg-[var(--color-forest)] text-white",
  whiteOnDark: "bg-white/10 text-[var(--color-gold)]",
} as const

interface IconCircleProps {
  children: ReactNode
  size?: keyof typeof SIZES
  tone?: keyof typeof TONES
  className?: string
}

export function IconCircle({
  children,
  size = "md",
  tone = "tint",
  className = "",
}: IconCircleProps) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full ${SIZES[size]} ${TONES[tone]} ${className}`}
      aria-hidden="true"
    >
      {children}
    </span>
  )
}

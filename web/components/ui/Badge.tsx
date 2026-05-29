import { CheckCircle } from "lucide-react"

type BadgeVariant = "default" | "gold" | "verified" | "forest"

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
}

const variantStyles: Record<BadgeVariant, string> = {
  default:
    "bg-[var(--color-cream)] text-[var(--color-charcoal-light)]",
  gold:
    "bg-[var(--color-gold-tint)] text-[var(--color-gold-ink)]",
  verified:
    "bg-[var(--color-forest-tint)] text-[var(--color-forest)]",
  forest:
    "bg-[var(--color-forest)] text-white",
}

export function Badge({ variant = "default", children, className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full ${variantStyles[variant]} ${className}`}
    >
      {variant === "verified" && <CheckCircle size={12} />}
      {children}
    </span>
  )
}

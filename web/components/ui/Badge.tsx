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
    "bg-[var(--color-gold)] text-[var(--color-forest-deep)]",
  verified:
    "bg-[var(--color-forest-tint)] text-[var(--color-forest)]",
  forest:
    "bg-[var(--color-forest)] text-white",
}

export function Badge({ variant = "default", children, className = "" }: BadgeProps) {
  // Two visual classes share this component:
  //  • status labels (gold/verified/forest) → squared cartographic tags,
  //    matching the tier tags on ListingCard.
  //  • the default variant → a soft rounded chip used for services/meta.
  const shape =
    variant === "default"
      ? "px-3 py-1 text-xs rounded-full"
      : "px-2 py-1 text-[0.6rem] uppercase tracking-[0.12em] rounded-[3px]"
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold ${shape} ${variantStyles[variant]} ${className}`}
    >
      {variant === "verified" && <CheckCircle size={12} />}
      {children}
    </span>
  )
}

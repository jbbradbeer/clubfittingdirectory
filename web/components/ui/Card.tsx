import { type HTMLAttributes, forwardRef } from "react"

/* ─────────────────────────────────────────────────────────
   CARD
   Base container component used for shop listings, stat
   blocks, and any boxed content.

   Styling:
   • Dark green mid background  (--color-green-mid)
   • 1px brass border at 20 % opacity  (subtle, not garish)
   • Gentle box-shadow for depth
   • Hover: lifts 2px + brass border brightens
   ───────────────────────────────────────────────────────── */

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Remove the default hover lift effect (e.g. for static info panels) */
  interactive?: boolean
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ interactive = true, className = "", children, ...props }, ref) => {
    const base = [
      "rounded-sm",
      "bg-[var(--color-green-mid)]",
      "border border-[color-mix(in_srgb,var(--color-brass)_20%,transparent)]",
      "shadow-[0_2px_12px_color-mix(in_srgb,#000_30%,transparent)]",
    ].join(" ")

    const hoverClasses = interactive
      ? [
          "transition-all duration-200 ease-out",
          "hover:-translate-y-0.5",
          "hover:border-[color-mix(in_srgb,var(--color-brass)_45%,transparent)]",
          "hover:shadow-[0_6px_24px_color-mix(in_srgb,#000_40%,transparent)]",
        ].join(" ")
      : ""

    return (
      <div
        ref={ref}
        className={`${base} ${hoverClasses} ${className}`}
        {...props}
      >
        {children}
      </div>
    )
  },
)

Card.displayName = "Card"

/* ── Convenience sub-components ── */

export function CardHeader({
  className = "",
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`p-5 pb-3 ${className}`} {...props}>
      {children}
    </div>
  )
}

export function CardBody({
  className = "",
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`px-5 py-3 ${className}`} {...props}>
      {children}
    </div>
  )
}

export function CardFooter({
  className = "",
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`px-5 pt-3 pb-5 border-t border-[color-mix(in_srgb,var(--color-brass)_15%,transparent)] ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

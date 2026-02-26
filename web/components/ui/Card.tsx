import { type HTMLAttributes, forwardRef } from "react"

/* ─────────────────────────────────────────────────────────
   CARD
   Base container for shop listings and boxed content.
   White background, light gray border, no shadow.
   Hover: subtle green left border accent.
   ───────────────────────────────────────────────────────── */

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ interactive = true, className = "", children, ...props }, ref) => {
    const base = [
      "rounded-md",
      "bg-white",
      "border border-[var(--color-gray-light)]",
    ].join(" ")

    const hoverClasses = interactive
      ? [
          "transition-all duration-200 ease-out",
          "hover:border-l-[3px] hover:border-l-[var(--color-green-deep)]",
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
      className={`px-5 pt-3 pb-5 border-t border-[var(--color-gray-light)] ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

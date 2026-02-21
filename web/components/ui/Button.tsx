import { type ButtonHTMLAttributes, type AnchorHTMLAttributes, forwardRef, Children, cloneElement, isValidElement } from "react"

/* ─────────────────────────────────────────────────────────
   BUTTON
   Primary CTA component.  All variants share a subtle
   lift animation on hover (translateY -1px + shadow).

   Variants:
   • primary  — solid brass background, dark charcoal text
   • outline  — brass border + text, transparent background
   • ghost    — ivory text only, no background or border

   asChild prop: when true, merges styles onto the single
   child element (e.g. a Next.js <Link>) instead of rendering
   a <button>. This lets CTAs be real anchor tags for SEO.
   ───────────────────────────────────────────────────────── */

type ButtonVariant = "primary" | "outline" | "ghost"
type ButtonSize    = "sm" | "md" | "lg"

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  /** Render as the single child element (e.g. Link) instead of <button> */
  asChild?: boolean
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-4 py-1.5 text-xs",
  md: "px-6 py-2.5 text-sm",
  lg: "px-8 py-3.5 text-base",
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: [
    "bg-[var(--color-brass)] text-[var(--color-charcoal)]",
    "border border-[var(--color-brass)]",
    "hover:bg-[var(--color-brass-light)] hover:border-[var(--color-brass-light)]",
    "hover:shadow-[0_4px_16px_color-mix(in_srgb,var(--color-brass)_30%,transparent)]",
    "font-semibold",
  ].join(" "),

  outline: [
    "bg-transparent text-[var(--color-brass)]",
    "border border-[var(--color-brass)]",
    "hover:bg-[color-mix(in_srgb,var(--color-brass)_8%,transparent)]",
    "hover:border-[var(--color-brass-light)] hover:text-[var(--color-brass-light)]",
    "hover:shadow-[0_4px_16px_color-mix(in_srgb,var(--color-brass)_15%,transparent)]",
    "font-medium",
  ].join(" "),

  ghost: [
    "bg-transparent text-[var(--color-ivory)] border border-transparent",
    "hover:text-[var(--color-brass-light)]",
    "hover:shadow-none",
    "font-medium",
  ].join(" "),
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      className = "",
      asChild = false,
      children,
      ...props
    },
    ref,
  ) => {
    const combinedClass = [
      "inline-flex items-center justify-center gap-2",
      "rounded-sm",
      "font-[family-name:var(--font-body)]",
      "tracking-wide",
      "transition-all duration-200 ease-out",
      "active:translate-y-0",
      "hover:-translate-y-px",
      "cursor-pointer",
      "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brass)]",
      "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0",
      sizeClasses[size],
      variantClasses[variant],
      className,
    ].join(" ")

    /* asChild: clone the single child and inject our classes onto it */
    if (asChild) {
      const child = Children.only(children)
      if (isValidElement<AnchorHTMLAttributes<HTMLAnchorElement>>(child)) {
        return cloneElement(child, {
          className: [child.props.className ?? "", combinedClass].filter(Boolean).join(" "),
        })
      }
    }

    return (
      <button
        ref={ref}
        className={combinedClass}
        {...props}
      >
        {children}
      </button>
    )
  },
)

Button.displayName = "Button"

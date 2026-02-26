import { type ButtonHTMLAttributes, type AnchorHTMLAttributes, forwardRef, Children, cloneElement, isValidElement } from "react"

/* ─────────────────────────────────────────────────────────
   BUTTON
   Primary CTA component.

   Variants:
   • primary  — solid deep green background, white text
   • outline  — green border + text, transparent background
   • ghost    — black text only, green hover
   ───────────────────────────────────────────────────────── */

type ButtonVariant = "primary" | "outline" | "ghost"
type ButtonSize    = "sm" | "md" | "lg"

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  asChild?: boolean
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-4 py-1.5 text-xs",
  md: "px-6 py-2.5 text-sm",
  lg: "px-8 py-3.5 text-base",
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: [
    "bg-[var(--color-green-deep)] text-white",
    "border border-[var(--color-green-deep)]",
    "hover:bg-[var(--color-green-hover)] hover:border-[var(--color-green-hover)]",
    "font-semibold",
  ].join(" "),

  outline: [
    "bg-transparent text-[var(--color-green-deep)]",
    "border border-[var(--color-green-deep)]",
    "hover:bg-[#1B43320A]",
    "hover:border-[var(--color-green-hover)] hover:text-[var(--color-green-hover)]",
    "font-medium",
  ].join(" "),

  ghost: [
    "bg-transparent text-[var(--color-black)] border border-transparent",
    "hover:text-[var(--color-green-deep)]",
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
      "rounded-md",
      "font-[family-name:var(--font-body)]",
      "tracking-wide",
      "transition-colors duration-200 ease-out",
      "cursor-pointer",
      "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-green-deep)]",
      "disabled:opacity-50 disabled:cursor-not-allowed",
      sizeClasses[size],
      variantClasses[variant],
      className,
    ].join(" ")

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

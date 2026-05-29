import Link from "next/link"

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost"
type ButtonSize = "sm" | "md" | "lg"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  href?: string
  external?: boolean
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--color-forest)] text-[var(--color-paper)] hover:bg-[var(--color-forest-dark)] border border-transparent",
  secondary:
    "bg-[var(--color-gold)] text-[var(--color-forest-deep)] hover:bg-[var(--color-gold-dark)] border border-transparent",
  outline:
    "bg-transparent text-[var(--color-forest)] border border-[var(--color-forest)]/35 hover:border-[var(--color-forest)] hover:bg-[var(--color-forest)] hover:text-[var(--color-paper)]",
  ghost:
    "bg-transparent text-[var(--color-forest)] hover:bg-[var(--color-cream)] border border-transparent",
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-5 py-2 text-xs tracking-[0.08em]",
  md: "px-7 py-3 text-sm tracking-[0.05em]",
  lg: "px-9 py-4 text-sm tracking-[0.08em]",
}

export function Button({
  variant = "primary",
  size = "md",
  href,
  external,
  className = "",
  children,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center font-[var(--font-body)] font-semibold rounded-full transition-all duration-200 cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--color-gold)] focus-visible:outline-offset-2"
  const classes = `${base} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`

  if (href) {
    if (external) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={classes}
        >
          {children}
        </a>
      )
    }
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    )
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  )
}

import Link from "next/link"

/**
 * Rounded pill link used for city/state chip lists. `count` renders as a
 * muted number after the label. `size="sm"` is the denser category-page look.
 */
export function ChipLink({
  href,
  label,
  count,
  size = "md",
}: {
  href: string
  label: string
  count?: number
  size?: "sm" | "md"
}) {
  const sizing =
    size === "sm" ? "px-3 py-1.5 text-xs font-medium" : "px-4 py-2 text-sm"
  return (
    <Link
      href={href}
      className={`${sizing} bg-white border border-[var(--color-border)] rounded-full hover:bg-[var(--color-forest)] hover:text-white hover:border-[var(--color-forest)] transition-all`}
    >
      {label}
      {count !== undefined && (
        <span className="ml-1.5 text-[var(--color-charcoal-light)]">{count}</span>
      )}
    </Link>
  )
}

/**
 * Number-led section head — the homepage's "yardage-book" voice ("50 states,
 * every one covered.") extended to collection pages. Replaces the repeated
 * eyebrow → h2 → subtitle unit: the mono gold figure IS the eyebrow.
 * Keep at most one gold uppercase eyebrow per page (the PageHeader's).
 */
export function IndexHead({
  value,
  children,
  className = "",
}: {
  /** The leading figure, set in the mono `.data` voice (e.g. a count). */
  value: string | number
  /** Rest of the heading, e.g. "fitters in Texas." */
  children: React.ReactNode
  className?: string
}) {
  return (
    <h2
      className={`font-display text-[1.7rem] sm:text-3xl md:text-4xl font-bold leading-[1.05] tracking-[-0.025em] ${className}`}
    >
      <span className="data font-semibold text-[var(--color-gold-ink)]">{value}</span>{" "}
      {children}
    </h2>
  )
}

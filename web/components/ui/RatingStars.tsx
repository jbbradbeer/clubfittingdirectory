/* ─────────────────────────────────────────────────────────
   RATING STARS
   Renders a row of green star SVGs representing a 0–5
   rating. Each star can be: filled, half-filled, or empty.
   ───────────────────────────────────────────────────────── */

type StarSize = "sm" | "md" | "lg"

interface RatingStarsProps {
  rating: number
  size?: StarSize
  showLabel?: boolean
  className?: string
}

const sizeMap: Record<StarSize, number> = {
  sm: 12,
  md: 16,
  lg: 20,
}

export function RatingStars({
  rating,
  size = "md",
  showLabel = false,
  className = "",
}: RatingStarsProps) {
  const px = sizeMap[size]
  const clamped = Math.max(0, Math.min(5, rating))
  const stars = Array.from({ length: 5 }, (_, i) => {
    const fill = Math.min(1, Math.max(0, clamped - i))
    if (fill >= 0.75) return "full"
    if (fill >= 0.25) return "half"
    return "empty"
  })

  return (
    <span
      className={`inline-flex items-center gap-0.5 ${className}`}
      aria-label={`Rating: ${clamped.toFixed(1)} out of 5 stars`}
    >
      {stars.map((type, i) => (
        <StarIcon key={i} type={type} size={px} />
      ))}
      {showLabel && (
        <span
          className="ml-1.5 text-[var(--color-green-deep)] font-[family-name:var(--font-body)] text-xs font-medium tabular-nums"
          aria-hidden="true"
        >
          {clamped.toFixed(1)}
        </span>
      )}
    </span>
  )
}

function StarIcon({
  type,
  size,
}: {
  type: "full" | "half" | "empty"
  size: number
}) {
  const id = `half-${Math.random().toString(36).slice(2, 7)}`

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {type === "half" && (
        <defs>
          <linearGradient id={id} x1="0" x2="1" y1="0" y2="0">
            <stop offset="50%" stopColor="var(--color-green-deep)" />
            <stop offset="50%" stopColor="transparent" />
          </linearGradient>
        </defs>
      )}

      <path
        d="M10 1.5L12.39 7.26L18.51 7.76L14 11.65L15.47 17.64L10 14.4L4.53 17.64L6 11.65L1.49 7.76L7.61 7.26L10 1.5Z"
        fill={
          type === "full"
            ? "var(--color-green-deep)"
            : type === "half"
              ? `url(#${id})`
              : "none"
        }
        stroke="var(--color-green-deep)"
        strokeWidth={type === "empty" ? "1.2" : "0"}
        strokeLinejoin="round"
        opacity={type === "empty" ? 0.35 : 1}
      />
    </svg>
  )
}

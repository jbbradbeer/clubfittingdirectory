import { useId } from "react"

interface RatingStarsProps {
  rating: number | null
  reviews?: number | null
  showNumeric?: boolean
  size?: "sm" | "md"
}

export function RatingStars({ rating, reviews, showNumeric = true, size = "md" }: RatingStarsProps) {
  const clipId = useId()
  if (!rating) return null

  const starSize = size === "sm" ? 14 : 18
  const fullStars = Math.floor(rating)
  const hasHalf = rating - fullStars >= 0.25 && rating - fullStars < 0.75
  const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0)

  return (
    <div className="inline-flex items-center gap-1.5">
      <span
        role="img"
        aria-label={`Rated ${rating.toFixed(1)} out of 5${reviews != null && reviews > 0 ? ` from ${reviews.toLocaleString()} reviews` : ""}`}
        className="flex items-center gap-0.5"
      >
        {Array.from({ length: fullStars }).map((_, i) => (
          <Star key={`full-${i}`} size={starSize} fill="var(--color-gold)" />
        ))}
        {hasHalf && <StarHalf key="half" size={starSize} clipId={`${clipId}-half`} />}
        {Array.from({ length: emptyStars }).map((_, i) => (
          <Star key={`empty-${i}`} size={starSize} fill="none" />
        ))}
      </span>
      {showNumeric && (
        <span
          aria-hidden="true"
          className={`font-semibold text-[var(--color-charcoal)] ${size === "sm" ? "text-xs" : "text-sm"}`}
        >
          {rating.toFixed(1)}
        </span>
      )}
      {reviews != null && reviews > 0 && (
        <span
          aria-hidden="true"
          className={`text-[var(--color-charcoal-light)] ${size === "sm" ? "text-xs" : "text-sm"}`}
        >
          ({reviews.toLocaleString()})
        </span>
      )}
    </div>
  )
}

function Star({ size, fill }: { size: number; fill: string }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="var(--color-gold)" strokeWidth={1.5}>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  )
}

function StarHalf({ size, clipId }: { size: number; clipId: string }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" stroke="var(--color-gold)" strokeWidth={1.5} fill="none">
      <defs>
        <clipPath id={clipId}>
          <rect x="0" y="0" width="12" height="24" />
        </clipPath>
      </defs>
      <path
        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        fill="var(--color-gold)"
        clipPath={`url(#${clipId})`}
      />
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  )
}

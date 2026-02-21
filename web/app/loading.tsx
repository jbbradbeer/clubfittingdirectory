/* ─────────────────────────────────────────────────────────
   ROOT LOADING STATE
   Shown by Next.js while any top-level page is fetching data.
   Uses skeleton cards with an animated brass shimmer —
   same dimensions as the real ListingCard so the layout
   doesn't jump when content loads.
   ───────────────────────────────────────────────────────── */

export default function Loading() {
  return (
    <div className="min-h-screen bg-[var(--color-green-deep)] px-4 sm:px-6 py-16">
      <div className="max-w-7xl mx-auto">

        {/* Skeleton section heading */}
        <div className="mb-10 space-y-3">
          <div className="skeleton-shimmer h-3 w-32 rounded-sm" />
          <div className="skeleton-shimmer h-8 w-56 rounded-sm" />
        </div>

        {/* Skeleton card grid — 3 columns, 6 cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>

      </div>

      <style>{`
        @keyframes brass-shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        .skeleton-shimmer {
          background: linear-gradient(
            90deg,
            color-mix(in srgb, var(--color-green-mid) 80%, transparent) 25%,
            color-mix(in srgb, var(--color-brass)     15%, var(--color-green-mid)) 50%,
            color-mix(in srgb, var(--color-green-mid) 80%, transparent) 75%
          );
          background-size: 200% auto;
          animation: brass-shimmer 1.8s linear infinite;
        }
      `}</style>
    </div>
  )
}

/* Individual skeleton card — mirrors ListingCard layout */
function SkeletonCard() {
  return (
    <div className="relative overflow-hidden flex flex-col bg-[var(--color-green-mid)] border border-[color-mix(in_srgb,var(--color-brass)_15%,transparent)] rounded-sm">

      {/* Left brass accent bar */}
      <span
        className="absolute left-0 top-0 bottom-0 w-[3px] bg-[color-mix(in_srgb,var(--color-brass)_40%,transparent)]"
        aria-hidden="true"
      />

      {/* Top row: fitting badge + type badge */}
      <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-0 pl-7">
        <div className="skeleton-shimmer h-3 w-28 rounded-sm" />
        <div className="skeleton-shimmer h-5 w-20 rounded-sm" />
      </div>

      {/* Main content */}
      <div className="flex-1 px-5 pt-4 pb-4 pl-7 space-y-3">
        {/* Name */}
        <div className="skeleton-shimmer h-6 w-4/5 rounded-sm" />
        {/* City */}
        <div className="skeleton-shimmer h-4 w-2/5 rounded-sm" />
        {/* Rating row */}
        <div className="skeleton-shimmer h-4 w-36 rounded-sm" />
        {/* Service pills */}
        <div className="flex gap-1.5 flex-wrap pt-1">
          {[48, 64, 56, 40].map((w, i) => (
            <div
              key={i}
              className="skeleton-shimmer h-5 rounded-sm"
              style={{ width: `${w}px` }}
            />
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-[color-mix(in_srgb,var(--color-brass)_10%,transparent)] px-5 py-3 pl-7 flex items-center justify-between">
        <div className="skeleton-shimmer h-3 w-28 rounded-sm" />
        <div className="skeleton-shimmer h-3 w-20 rounded-sm" />
      </div>

    </div>
  )
}

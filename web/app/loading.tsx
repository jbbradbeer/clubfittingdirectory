/* ─────────────────────────────────────────────────────────
   ROOT LOADING STATE
   Off-white background, white skeleton cards with gray
   shimmer animation.
   ───────────────────────────────────────────────────────── */

export default function Loading() {
  return (
    <div className="min-h-screen bg-[var(--color-off-white)] px-4 sm:px-6 py-16">
      <div className="max-w-7xl mx-auto">

        {/* Skeleton section heading */}
        <div className="mb-10 space-y-3">
          <div className="skeleton-shimmer h-3 w-32 rounded-md" />
          <div className="skeleton-shimmer h-8 w-56 rounded-md" />
        </div>

        {/* Skeleton card grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes gray-shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        .skeleton-shimmer {
          background: linear-gradient(
            90deg,
            var(--color-gray-light) 25%,
            #d4d4d4 50%,
            var(--color-gray-light) 75%
          );
          background-size: 200% auto;
          animation: gray-shimmer 1.8s linear infinite;
        }
      `}</style>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="flex flex-col bg-white border border-[var(--color-gray-light)] rounded-md overflow-hidden">
      {/* Top row */}
      <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-0">
        <div className="skeleton-shimmer h-3 w-28 rounded-md" />
        <div className="skeleton-shimmer h-5 w-20 rounded-md" />
      </div>

      {/* Main content */}
      <div className="flex-1 px-5 pt-4 pb-4 space-y-3">
        <div className="skeleton-shimmer h-6 w-4/5 rounded-md" />
        <div className="skeleton-shimmer h-4 w-2/5 rounded-md" />
        <div className="skeleton-shimmer h-4 w-36 rounded-md" />
        <div className="flex gap-1.5 flex-wrap pt-1">
          {[48, 64, 56, 40].map((w, i) => (
            <div key={i} className="skeleton-shimmer h-5 rounded-md" style={{ width: `${w}px` }} />
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-[var(--color-gray-light)] px-5 py-3 flex items-center justify-between">
        <div className="skeleton-shimmer h-3 w-28 rounded-md" />
        <div className="skeleton-shimmer h-3 w-20 rounded-md" />
      </div>
    </div>
  )
}

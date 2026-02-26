/* ---------------------------------------------------------
   DIRECTORY PAGE LOADING STATE
   Mirrors the /directory page layout: sidebar filters on
   the left, results grid on the right. Cards use a gray
   shimmer animation matching the new design system.
   --------------------------------------------------------- */

export default function DirectoryLoading() {
  return (
    <div className="min-h-screen bg-[var(--color-off-white)] px-4 sm:px-6 py-12">
      <div className="max-w-7xl mx-auto">

        {/* Page heading skeleton */}
        <div className="mb-8 space-y-3">
          <div className="skeleton-shimmer h-3 w-28 rounded-md" />
          <div className="skeleton-shimmer h-10 w-64 rounded-md" />
          <div className="skeleton-shimmer h-4 w-80 rounded-md" />
        </div>

        <div className="flex flex-col lg:flex-row gap-8">

          {/* -- Sidebar skeleton -- */}
          <aside className="lg:w-64 shrink-0 space-y-5">
            {[120, 90, 110, 80].map((h, i) => (
              <div
                key={i}
                className="skeleton-shimmer rounded-md"
                style={{ height: `${h}px` }}
              />
            ))}
          </aside>

          {/* -- Results grid skeleton -- */}
          <div className="flex-1 min-w-0">
            {/* Result count / sort row */}
            <div className="flex items-center justify-between mb-6">
              <div className="skeleton-shimmer h-4 w-32 rounded-md" />
              <div className="skeleton-shimmer h-8 w-36 rounded-md" />
            </div>

            {/* Card grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {Array.from({ length: 9 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          </div>

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
    <div className="relative overflow-hidden flex flex-col bg-white border border-[var(--color-gray-light)] rounded-md">
      <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-0">
        <div className="skeleton-shimmer h-3 w-28 rounded-md" />
        <div className="skeleton-shimmer h-5 w-20 rounded-md" />
      </div>
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
      <div className="border-t border-[var(--color-gray-light)] px-5 py-3 flex items-center justify-between">
        <div className="skeleton-shimmer h-3 w-28 rounded-md" />
        <div className="skeleton-shimmer h-3 w-20 rounded-md" />
      </div>
    </div>
  )
}

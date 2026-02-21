/* ─────────────────────────────────────────────────────────
   DIRECTORY PAGE LOADING STATE
   Mirrors the /directory page layout: sidebar filters on
   the left, results grid on the right. Cards use the same
   brass shimmer animation as the root loading state.
   ───────────────────────────────────────────────────────── */

export default function DirectoryLoading() {
  return (
    <div className="min-h-screen bg-[var(--color-green-deep)] px-4 sm:px-6 py-12">
      <div className="max-w-7xl mx-auto">

        {/* Page heading skeleton */}
        <div className="mb-8 space-y-3">
          <div className="skeleton-shimmer h-3 w-28 rounded-sm" />
          <div className="skeleton-shimmer h-10 w-64 rounded-sm" />
          <div className="skeleton-shimmer h-4 w-80 rounded-sm" />
        </div>

        <div className="flex flex-col lg:flex-row gap-8">

          {/* ── Sidebar skeleton ── */}
          <aside className="lg:w-64 shrink-0 space-y-5">
            {[120, 90, 110, 80].map((h, i) => (
              <div
                key={i}
                className="skeleton-shimmer rounded-sm"
                style={{ height: `${h}px` }}
              />
            ))}
          </aside>

          {/* ── Results grid skeleton ── */}
          <div className="flex-1 min-w-0">
            {/* Result count / sort row */}
            <div className="flex items-center justify-between mb-6">
              <div className="skeleton-shimmer h-4 w-32 rounded-sm" />
              <div className="skeleton-shimmer h-8 w-36 rounded-sm" />
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

function SkeletonCard() {
  return (
    <div className="relative overflow-hidden flex flex-col bg-[var(--color-green-mid)] border border-[color-mix(in_srgb,var(--color-brass)_15%,transparent)] rounded-sm">
      <span
        className="absolute left-0 top-0 bottom-0 w-[3px] bg-[color-mix(in_srgb,var(--color-brass)_40%,transparent)]"
        aria-hidden="true"
      />
      <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-0 pl-7">
        <div className="skeleton-shimmer h-3 w-28 rounded-sm" />
        <div className="skeleton-shimmer h-5 w-20 rounded-sm" />
      </div>
      <div className="flex-1 px-5 pt-4 pb-4 pl-7 space-y-3">
        <div className="skeleton-shimmer h-6 w-4/5 rounded-sm" />
        <div className="skeleton-shimmer h-4 w-2/5 rounded-sm" />
        <div className="skeleton-shimmer h-4 w-36 rounded-sm" />
        <div className="flex gap-1.5 flex-wrap pt-1">
          {[48, 64, 56, 40].map((w, i) => (
            <div key={i} className="skeleton-shimmer h-5 rounded-sm" style={{ width: `${w}px` }} />
          ))}
        </div>
      </div>
      <div className="border-t border-[color-mix(in_srgb,var(--color-brass)_10%,transparent)] px-5 py-3 pl-7 flex items-center justify-between">
        <div className="skeleton-shimmer h-3 w-28 rounded-sm" />
        <div className="skeleton-shimmer h-3 w-20 rounded-sm" />
      </div>
    </div>
  )
}

export default function DirectoryLoadingSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="h-12 bg-[var(--color-cream)] rounded-lg animate-pulse mb-8" />
      <div className="flex gap-8">
        <div className="hidden lg:block w-56 shrink-0 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 bg-[var(--color-cream)] rounded animate-pulse" />
          ))}
        </div>
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-56 bg-[var(--color-cream)] border border-[var(--color-border)] rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  )
}

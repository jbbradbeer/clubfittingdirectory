export default function RootLoading() {
  return (
    <div className="bg-[var(--color-cream)] bg-grain min-h-[60vh] flex items-center justify-center">
      <div className="text-center relative z-10">
        <div className="w-10 h-10 border-3 border-[var(--color-cream-dark)] border-t-[var(--color-gold)] rounded-full animate-spin mx-auto" />
        <p className="mt-4 text-sm text-[var(--color-charcoal-light)]">Loading...</p>
      </div>
    </div>
  )
}

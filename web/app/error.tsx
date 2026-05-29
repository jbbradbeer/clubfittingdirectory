"use client"

import { Button } from "@/components/ui/Button"

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <section className="bg-[var(--color-cream)] bg-grain min-h-[60vh] flex items-center justify-center">
      <div className="max-w-md mx-auto px-4 text-center relative z-10">
        <p className="section-label mb-4">Error</p>
        <h1
          className="text-4xl font-normal text-[var(--color-charcoal)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          An Unexpected Lie
        </h1>
        <p className="mt-4 text-[var(--color-charcoal-light)]">
          Something went wrong loading this page. It&apos;s likely a temporary issue — try refreshing.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="px-6 py-2.5 bg-[var(--color-gold)] text-white text-sm font-semibold rounded hover:bg-[var(--color-gold-dark)] transition-colors cursor-pointer"
          >
            Try Again
          </button>
          <Button href="/" variant="outline" size="md">
            Return Home
          </Button>
        </div>
      </div>
    </section>
  )
}

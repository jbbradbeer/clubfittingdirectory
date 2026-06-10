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
    <section className="bg-[var(--color-cream)] grain min-h-[60vh] flex items-center justify-center">
      <div className="max-w-md mx-auto px-4 text-center relative z-10">
        <p className="section-label mb-4">Error</p>
        <h1 className="font-display text-4xl font-normal text-[var(--color-charcoal)]">
          An Unexpected Lie
        </h1>
        <p className="mt-4 text-[var(--color-charcoal-light)]">
          Something went wrong loading this page. It&apos;s likely a temporary issue — try refreshing.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Button onClick={reset} variant="secondary" size="md">
            Try Again
          </Button>
          <Button href="/" variant="outline" size="md">
            Return Home
          </Button>
        </div>
      </div>
    </section>
  )
}

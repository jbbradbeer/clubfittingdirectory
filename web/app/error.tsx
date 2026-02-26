"use client"

/* ─────────────────────────────────────────────────────────
   ERROR BOUNDARY
   Off-white background, green accents, clean layout.
   ───────────────────────────────────────────────────────── */

import { useEffect } from "react"
import { Button } from "@/components/ui/Button"

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-[70vh] bg-[var(--color-off-white)] flex flex-col items-center justify-center px-4 sm:px-6 text-center">

      {/* Eyebrow */}
      <p className="font-[family-name:var(--font-body)] text-xs tracking-[0.35em] uppercase text-[var(--color-green-deep)] mb-4">
        Something went wrong
      </p>

      {/* Headline */}
      <h1
        className="font-[family-name:var(--font-display)] font-normal text-[var(--color-black)] leading-[1.05] mb-5"
        style={{ fontSize: "clamp(2rem,6vw,3.5rem)" }}
      >
        An unexpected lie.
      </h1>

      {/* Subtext */}
      <p className="font-[family-name:var(--font-body)] text-base text-[var(--color-gray)] max-w-sm leading-relaxed mb-10">
        The page encountered an error it couldn&rsquo;t recover from.
        Try again — it usually sorts itself out.
      </p>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <Button variant="primary" size="lg" onClick={() => reset()}>
          Try Again
        </Button>
        <Button variant="outline" size="lg" asChild>
          <a href="/">Return Home</a>
        </Button>
      </div>

      {/* Error digest */}
      {error.digest && (
        <p className="mt-8 font-[family-name:var(--font-body)] text-[10px] text-[var(--color-gray)] tracking-widest tabular-nums">
          ref: {error.digest}
        </p>
      )}
    </div>
  )
}

"use client"

/* ─────────────────────────────────────────────────────────
   ERROR BOUNDARY
   Next.js renders this when a page throws an unexpected
   error. Must be a Client Component ("use client") because
   it receives the error object and a reset() function.

   Voice: dry, brief, Tuxedo Collective — not apologetic,
   not technical, not alarming.
   ───────────────────────────────────────────────────────── */

import { useEffect } from "react"
import { Button } from "@/components/ui/Button"

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    /* Log to your error monitoring service here if you add one */
    console.error(error)
  }, [error])

  return (
    <div className="min-h-[70vh] bg-[var(--color-green-deep)] flex flex-col items-center justify-center px-4 sm:px-6 text-center">

      {/* Decorative rule */}
      <div className="flex items-center gap-4 mb-10 w-full max-w-xs" aria-hidden="true">
        <span className="flex-1 h-px bg-[color-mix(in_srgb,var(--color-brass)_30%,transparent)]" />
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-brass)] opacity-60" />
        <span className="flex-1 h-px bg-[color-mix(in_srgb,var(--color-brass)_30%,transparent)]" />
      </div>

      {/* Eyebrow */}
      <p className="font-[family-name:var(--font-mono)] text-xs tracking-[0.35em] uppercase text-[var(--color-brass)] mb-4">
        Something went wrong
      </p>

      {/* Headline */}
      <h1
        className="font-[family-name:var(--font-display)] font-black text-[var(--color-ivory)] leading-[1.05] mb-5"
        style={{ fontSize: "clamp(2rem,6vw,3.5rem)" }}
      >
        An unexpected lie.
      </h1>

      {/* Subtext */}
      <p className="font-[family-name:var(--font-body)] text-base text-[var(--color-ivory-warm)] max-w-sm leading-relaxed mb-10">
        The page encountered an error it couldn&rsquo;t recover from.
        Try again — it usually sorts itself out.
      </p>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <Button
          variant="primary"
          size="lg"
          onClick={() => reset()}
        >
          Try Again
        </Button>
        <Button variant="outline" size="lg" asChild>
          <a href="/">Return Home</a>
        </Button>
      </div>

      {/* Error digest for support reference — shown only in production */}
      {error.digest && (
        <p className="mt-8 font-[family-name:var(--font-mono)] text-[10px] text-[color-mix(in_srgb,var(--color-ivory-warm)_35%,transparent)] tracking-widest">
          ref: {error.digest}
        </p>
      )}

      {/* Decorative rule */}
      <div className="flex items-center gap-4 mt-10 w-full max-w-xs" aria-hidden="true">
        <span className="flex-1 h-px bg-[color-mix(in_srgb,var(--color-brass)_30%,transparent)]" />
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-brass)] opacity-60" />
        <span className="flex-1 h-px bg-[color-mix(in_srgb,var(--color-brass)_30%,transparent)]" />
      </div>

    </div>
  )
}

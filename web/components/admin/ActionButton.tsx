"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

/**
 * Generic admin mutation button — replaces the old one-<form>-per-button
 * pattern that forced a full page reload on every click. Runs the server
 * action in a transition (button spinner, page stays put), then refreshes the
 * current route so the server components re-render with fresh data. Errors
 * returned by the action ({ error }) show inline under the button instead of
 * the opaque error boundary.
 */
export function ActionButton({
  action,
  fields,
  children,
  className,
  successLabel,
}: {
  action: (formData: FormData) => Promise<{ error?: string } | void>
  fields: Record<string, string>
  children: React.ReactNode
  className?: string
  /** Shown on the button after success, for actions with no visible effect
      on the page (e.g. "Sent ✓" for emails). */
  successLabel?: string
}) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState("")
  const [done, setDone] = useState(false)
  const router = useRouter()

  function run() {
    setError("")
    startTransition(async () => {
      const fd = new FormData()
      for (const [k, v] of Object.entries(fields)) fd.set(k, v)
      const result = await action(fd)
      if (result && "error" in result && result.error) {
        setError(result.error)
        return
      }
      setDone(true)
      router.refresh()
    })
  }

  return (
    <div>
      <button
        type="button"
        onClick={run}
        disabled={isPending || (done && Boolean(successLabel))}
        className={`inline-flex items-center gap-1.5 disabled:opacity-60 ${className ?? ""}`}
      >
        {isPending && <Loader2 size={13} className="animate-spin" />}
        {done && successLabel ? successLabel : children}
      </button>
      {error && <p className="mt-1.5 text-xs text-red-600 max-w-xs">{error}</p>}
    </div>
  )
}

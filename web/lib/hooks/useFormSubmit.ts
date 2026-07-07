"use client"

import { useState } from "react"

/**
 * Shared submit lifecycle for the public POST forms (newsletter, submit-shop,
 * claim-shop, request-fitting). Each form previously reimplemented the same
 * status state machine + fetch/JSON/error handling.
 */

export type FormStatus = "idle" | "submitting" | "success" | "error"

export function useFormSubmit(
  endpoint: string,
  fallbackError = "Something went wrong. Please try again.",
) {
  const [status, setStatus] = useState<FormStatus>("idle")
  const [errorMsg, setErrorMsg] = useState("")

  /** POSTs the payload as JSON. Resolves true on success (for follow-up side effects). */
  async function submit(payload: unknown): Promise<boolean> {
    setStatus("submitting")
    setErrorMsg("")
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || fallbackError)
      setStatus("success")
      return true
    } catch (err) {
      setStatus("error")
      setErrorMsg(err instanceof Error ? err.message : fallbackError)
      return false
    }
  }

  /** Back to "idle" — e.g. when a modal form is reopened. */
  const reset = () => {
    setStatus("idle")
    setErrorMsg("")
  }

  return { status, errorMsg, submit, reset }
}

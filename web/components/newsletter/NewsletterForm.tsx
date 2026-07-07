"use client"

import { CheckCircle, Loader2 } from "lucide-react"
import { darkInputBase, darkButtonBase } from "@/lib/form-styles"
import { useFormSubmit } from "@/lib/hooks/useFormSubmit"
import { Honeypot } from "@/components/forms/FormBits"

/**
 * Newsletter signup form for "The Tuxedo Collective".
 * Posts to /api/newsletter, which adds the email to the beehiiv audience.
 *
 * Designed to sit on the site's dark forest backgrounds (footer, homepage
 * band, /newsletter hero). The `variant` only adjusts sizing/width.
 */

type Variant = "footer" | "section" | "page"

export function NewsletterForm({
  variant = "section",
  buttonLabel = "Subscribe",
}: {
  variant?: Variant
  buttonLabel?: string
}) {
  const { status, errorMsg, submit } = useFormSubmit("/api/newsletter")

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    await submit({
      email: fd.get("email"),
      company_website: fd.get("company_website"), // honeypot
      source: typeof window !== "undefined" ? window.location.pathname : undefined,
    })
  }

  const big = variant === "page"

  if (status === "success") {
    return (
      <div
        className={`flex items-center gap-3 rounded-full bg-white/10 border border-[var(--color-gold)]/40 text-white ${
          big ? "px-6 py-4 text-base" : "px-5 py-3.5 text-sm"
        }`}
      >
        <CheckCircle size={big ? 24 : 20} className="shrink-0 text-[var(--color-gold)]" />
        <span>
          <strong className="font-semibold text-white">You&apos;re in!</strong> Check your inbox
          to confirm your subscription.
        </span>
      </div>
    )
  }

  const inputClass = `${darkInputBase} ${big ? "px-5 py-3.5 text-base" : "px-4 py-3 text-sm"}`
  const buttonClass = `${darkButtonBase} ${big ? "px-7 py-3.5 text-base" : "px-6 py-3 text-sm"}`

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Honeypot />

      <div className="flex flex-col sm:flex-row gap-3">
        <label htmlFor={`newsletter-email-${variant}`} className="sr-only">
          Email address
        </label>
        <input
          id={`newsletter-email-${variant}`}
          name="email"
          type="email"
          required
          maxLength={200}
          autoComplete="email"
          placeholder="you@email.com"
          className={inputClass}
        />
        <button type="submit" disabled={status === "submitting"} className={buttonClass}>
          {status === "submitting" ? (
            <>
              <Loader2 size={18} className="animate-spin" /> Joining…
            </>
          ) : (
            buttonLabel
          )}
        </button>
      </div>

      {status === "error" && <p className="mt-2.5 text-sm text-[var(--color-gold)]">{errorMsg}</p>}

      <p className={`mt-3 text-white/50 ${big ? "text-sm" : "text-xs"}`}>
        Free. Weekly. Unsubscribe anytime.
      </p>
    </form>
  )
}

"use client"

import { useEffect, useRef, useState } from "react"
import { track } from "@vercel/analytics"
import { CalendarCheck, CheckCircle, Loader2, ChevronDown, X } from "lucide-react"
import { fieldClass, selectClass, labelClass } from "@/lib/form-styles"
import { Button } from "@/components/ui/Button"
import { useFormSubmit } from "@/lib/hooks/useFormSubmit"
import { Honeypot, Req } from "@/components/forms/FormBits"

const FITTING_TYPES = [
  { value: "driver", label: "Driver" },
  { value: "irons", label: "Irons" },
  { value: "wedges", label: "Wedges" },
  { value: "putter", label: "Putter" },
  { value: "full_bag", label: "Full bag" },
  { value: "other", label: "Other / not sure" },
]

const TIMES = [
  { value: "morning", label: "Morning" },
  { value: "afternoon", label: "Afternoon" },
  { value: "evening", label: "Evening" },
  { value: "flexible", label: "Flexible" },
]

type Props = {
  shopId: string
  shopName: string
  shopSlug: string
  /** Optional override for the trigger button classes (to fit the contact card). */
  className?: string
}

export function RequestFittingButton({ shopId, shopName, shopSlug, className }: Props) {
  const [open, setOpen] = useState(false)
  const { status, errorMsg, submit, reset } = useFormSubmit(
    "/api/request-fitting",
    "Request failed. Please try again.",
  )
  const firstFieldRef = useRef<HTMLInputElement>(null)

  // Close on Escape + lock body scroll while the modal is open.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false) }
    document.addEventListener("keydown", onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    firstFieldRef.current?.focus()
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [open])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const ok = await submit({
      shop_id: shopId,
      shop_name: shopName,
      shop_slug: shopSlug,
      visitor_name: fd.get("visitor_name"),
      visitor_email: fd.get("visitor_email"),
      visitor_phone: fd.get("visitor_phone"),
      fitting_type: fd.get("fitting_type"),
      preferred_date: fd.get("preferred_date"),
      preferred_time: fd.get("preferred_time"),
      notes: fd.get("notes"),
      company_website: fd.get("company_website"), // honeypot
    })
    if (ok) track("fitting_request", { slug: shopSlug })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => { setOpen(true); reset() }}
        className={
          className ??
          "flex w-full items-center justify-center gap-2 py-2.5 bg-[var(--color-gold)] text-[var(--color-forest-deep)]! font-semibold text-sm rounded-full hover:bg-[var(--color-gold-dark)] transition-colors cursor-pointer"
        }
      >
        <CalendarCheck size={16} />
        Request a Fitting
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="request-fitting-title"
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Panel */}
          <div className="relative w-full sm:max-w-lg max-h-[92vh] overflow-y-auto bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl">
            <span aria-hidden="true" className="block h-1 w-full bg-gradient-to-r from-[var(--color-forest)] to-[var(--color-gold)]" />

            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="absolute right-3 top-3 p-2 rounded-full text-[var(--color-charcoal-light)] hover:bg-[var(--color-cream)] transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            {status === "success" ? (
              <div className="p-8 text-center">
                <CheckCircle size={44} className="mx-auto text-[var(--color-forest)] mb-4" />
                <h2 className="font-display text-2xl text-[var(--color-charcoal)]">Request sent</h2>
                <p className="mt-3 text-[var(--color-charcoal-light)] leading-relaxed">
                  Thanks{shopName ? `,` : ""}! We&apos;ve received your fitting request for{" "}
                  <strong>{shopName}</strong> and will get it to the shop. They&apos;ll be in touch
                  to confirm a time.
                </p>
                <div className="mt-6">
                  <Button type="button" variant="primary" onClick={() => setOpen(false)}>
                    Done
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-6 sm:p-8 pt-7 space-y-5">
                <div>
                  <h2 id="request-fitting-title" className="font-display text-2xl text-[var(--color-charcoal)]">
                    Request a Fitting
                  </h2>
                  <p className="mt-1 text-sm text-[var(--color-charcoal-light)]">
                    at <strong>{shopName}</strong>. Tell us what you&apos;re after and the shop will
                    reach out to confirm.
                  </p>
                </div>

                <Honeypot />

                <div>
                  <label htmlFor="visitor_name" className={labelClass}>Your name<Req /></label>
                  <input ref={firstFieldRef} id="visitor_name" name="visitor_name" required maxLength={120} className={fieldClass} placeholder="e.g. Jordan Smith" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="visitor_email" className={labelClass}>Email<Req /></label>
                    <input id="visitor_email" name="visitor_email" type="email" required maxLength={200} className={fieldClass} placeholder="you@email.com" />
                  </div>
                  <div>
                    <label htmlFor="visitor_phone" className={labelClass}>Phone</label>
                    <input id="visitor_phone" name="visitor_phone" maxLength={40} className={fieldClass} placeholder="(555) 123-4567" />
                  </div>
                </div>

                <div>
                  <label htmlFor="fitting_type" className={labelClass}>What do you want fitted?</label>
                  <div className="relative">
                    <select id="fitting_type" name="fitting_type" defaultValue="" className={selectClass}>
                      <option value="">Not sure yet</option>
                      {FITTING_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-charcoal-light)] pointer-events-none" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="preferred_date" className={labelClass}>Preferred date</label>
                    <input id="preferred_date" name="preferred_date" type="date" maxLength={40} className={fieldClass} />
                  </div>
                  <div>
                    <label htmlFor="preferred_time" className={labelClass}>Preferred time</label>
                    <div className="relative">
                      <select id="preferred_time" name="preferred_time" defaultValue="" className={selectClass}>
                        <option value="">Any time</option>
                        {TIMES.map((t) => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                      <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-charcoal-light)] pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="notes" className={labelClass}>Anything else?</label>
                  <textarea id="notes" name="notes" maxLength={1000} rows={3} className={fieldClass} placeholder="Current clubs, goals, budget, questions…" />
                </div>

                {status === "error" && <p className="text-sm text-red-600">{errorMsg}</p>}

                <Button type="submit" variant="primary" className="w-full" disabled={status === "submitting"}>
                  {status === "submitting" ? (
                    <><Loader2 size={18} className="animate-spin" /> Sending…</>
                  ) : (
                    "Send request"
                  )}
                </Button>
                <p className="text-xs text-[var(--color-charcoal-light)] text-center">
                  No payment now. The shop confirms your fitting directly.
                </p>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}

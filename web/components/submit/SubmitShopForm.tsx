"use client"

import { useState } from "react"
import { CheckCircle, Loader2 } from "lucide-react"
import { US_STATES } from "@/lib/constants"
import { SHOP_TYPES } from "@/lib/shop-types"

type Status = "idle" | "submitting" | "success" | "error"

const fieldClass =
  "w-full px-4 py-2.5 bg-white border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-charcoal)] placeholder:text-[var(--color-charcoal-light)] focus:outline-none focus:border-[var(--color-forest)] focus:ring-2 focus:ring-[var(--color-forest)]/15 transition-all"
const labelClass =
  "block text-xs font-semibold uppercase tracking-wider text-[var(--color-charcoal-light)] mb-1.5"

export function SubmitShopForm() {
  const [status, setStatus] = useState<Status>("idle")
  const [errorMsg, setErrorMsg] = useState("")

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus("submitting")
    setErrorMsg("")

    const fd = new FormData(e.currentTarget)
    const payload = {
      name: fd.get("name"),
      city: fd.get("city"),
      state_code: fd.get("state_code"),
      shop_type: fd.get("shop_type"),
      website: fd.get("website"),
      phone: fd.get("phone"),
      offers_fitting: fd.get("offers_fitting") === "on",
      notes: fd.get("notes"),
      submitter_email: fd.get("submitter_email"),
      company_website: fd.get("company_website"), // honeypot
    }

    try {
      const res = await fetch("/api/submit-shop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Submission failed. Please try again.")
      setStatus("success")
    } catch (err) {
      setStatus("error")
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong. Please try again.")
    }
  }

  if (status === "success") {
    return (
      <div className="bg-white border border-[var(--color-border)] rounded-2xl shadow-card p-10 text-center">
        <CheckCircle size={44} className="mx-auto text-[var(--color-forest)] mb-4" />
        <h2 className="text-2xl text-[var(--color-charcoal)]" style={{ fontFamily: "var(--font-display)" }}>
          Thank you!
        </h2>
        <p className="mt-3 text-[var(--color-charcoal-light)] leading-relaxed">
          Your shop has been submitted for review. We check every entry before it goes live,
          and we&apos;ll add it to the directory soon.
        </p>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-[var(--color-border)] rounded-2xl shadow-card p-6 sm:p-8 space-y-5"
    >
      {/* Honeypot — visually hidden; real users never fill it */}
      <div aria-hidden="true" className="absolute -left-[9999px] w-px h-px overflow-hidden">
        <label>
          Company website
          <input type="text" name="company_website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div>
        <label htmlFor="name" className={labelClass}>Shop name *</label>
        <input id="name" name="name" required maxLength={120} className={fieldClass} placeholder="e.g. Precision Golf Fitting" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="city" className={labelClass}>City *</label>
          <input id="city" name="city" required maxLength={80} className={fieldClass} placeholder="e.g. Austin" />
        </div>
        <div>
          <label htmlFor="state_code" className={labelClass}>State *</label>
          <select id="state_code" name="state_code" required defaultValue="" className={fieldClass}>
            <option value="" disabled>Select a state</option>
            {US_STATES.map((s) => (
              <option key={s.code} value={s.code}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="shop_type" className={labelClass}>Shop type</label>
        <select id="shop_type" name="shop_type" defaultValue="" className={fieldClass}>
          <option value="">Not sure / other</option>
          {SHOP_TYPES.map((t) => (
            <option key={t.dbType} value={t.dbType}>{t.singular}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="website" className={labelClass}>Website</label>
          <input id="website" name="website" maxLength={300} className={fieldClass} placeholder="https://…" />
        </div>
        <div>
          <label htmlFor="phone" className={labelClass}>Phone</label>
          <input id="phone" name="phone" maxLength={40} className={fieldClass} placeholder="(555) 123-4567" />
        </div>
      </div>

      <label className="flex items-center gap-2.5 cursor-pointer">
        <input type="checkbox" name="offers_fitting" className="w-4 h-4 rounded border-[var(--color-border)] accent-[var(--color-forest)] cursor-pointer" />
        <span className="text-sm text-[var(--color-charcoal)]">This shop offers club fitting</span>
      </label>

      <div>
        <label htmlFor="notes" className={labelClass}>Anything else?</label>
        <textarea id="notes" name="notes" maxLength={1000} rows={3} className={fieldClass} placeholder="Services offered, what makes them great, etc." />
      </div>

      <div>
        <label htmlFor="submitter_email" className={labelClass}>Your email *</label>
        <input id="submitter_email" name="submitter_email" type="email" required maxLength={200} className={fieldClass} placeholder="So we can follow up about your submission" />
      </div>

      {status === "error" && (
        <p className="text-sm text-red-600">{errorMsg}</p>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="inline-flex items-center justify-center gap-2 w-full py-3 bg-[var(--color-forest)] text-white font-semibold rounded-full hover:bg-[var(--color-forest-dark)] transition-colors cursor-pointer disabled:opacity-60"
      >
        {status === "submitting" ? (
          <><Loader2 size={18} className="animate-spin" /> Submitting…</>
        ) : (
          "Submit shop"
        )}
      </button>
      <p className="text-xs text-[var(--color-charcoal-light)] text-center">
        Every submission is reviewed before it appears in the directory.
      </p>
    </form>
  )
}

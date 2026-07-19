"use client"

import { CheckCircle, Loader2, ChevronDown } from "lucide-react"
import { US_STATES } from "@/lib/constants"
import { SHOP_TYPES } from "@/lib/shop-types"
import { fieldClass, selectClass, labelClass, checkboxClass } from "@/lib/form-styles"
import { Button } from "@/components/ui/Button"
import { useFormSubmit } from "@/lib/hooks/useFormSubmit"
import { Honeypot, Req } from "@/components/forms/FormBits"

export function SubmitShopForm() {
  const { status, errorMsg, submit } = useFormSubmit(
    "/api/submit-shop",
    "Submission failed. Please try again.",
  )

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    await submit({
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
    })
  }

  if (status === "success") {
    return (
      <div className="relative overflow-hidden bg-white border border-[var(--color-border)] rounded-2xl shadow-card">
        <span aria-hidden="true" className="block h-1 w-full bg-[var(--color-forest)]" />
        <div className="p-8 text-center">
          <CheckCircle size={44} className="mx-auto text-[var(--color-forest)] mb-4" />
          <h2 className="font-display text-2xl text-[var(--color-charcoal)]">
            Thank you
          </h2>
          <p className="mt-3 text-[var(--color-charcoal-light)] leading-relaxed">
            Your shop has been submitted for review. We check every entry before it goes live,
            and we&apos;ll add it to the directory soon.
          </p>
        </div>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="relative overflow-hidden bg-white border border-[var(--color-border)] rounded-2xl shadow-card"
    >
      {/* Brand accent strip */}
      <span aria-hidden="true" className="block h-1 w-full bg-[var(--color-forest)]" />

      <div className="p-6 sm:p-8 space-y-5">
        <Honeypot />

        <div>
          <label htmlFor="name" className={labelClass}>Shop name<Req /></label>
          <input id="name" name="name" required maxLength={120} className={fieldClass} placeholder="e.g. Precision Golf Fitting" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="city" className={labelClass}>City<Req /></label>
            <input id="city" name="city" required maxLength={80} className={fieldClass} placeholder="e.g. Austin" />
          </div>
          <div>
            <label htmlFor="state_code" className={labelClass}>State<Req /></label>
            <div className="relative">
              <select id="state_code" name="state_code" required defaultValue="" className={selectClass}>
                <option value="" disabled>Select a state</option>
                {US_STATES.map((s) => (
                  <option key={s.code} value={s.code}>{s.name}</option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-charcoal-light)] pointer-events-none" />
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="shop_type" className={labelClass}>Shop type</label>
          <div className="relative">
            <select id="shop_type" name="shop_type" defaultValue="" className={selectClass}>
              <option value="">Not sure / other</option>
              {SHOP_TYPES.map((t) => (
                <option key={t.dbType} value={t.dbType}>{t.singular}</option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-charcoal-light)] pointer-events-none" />
          </div>
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
          <input type="checkbox" name="offers_fitting" className={checkboxClass} />
          <span className="text-sm text-[var(--color-charcoal)]">This shop offers club fitting</span>
        </label>

        <div>
          <label htmlFor="notes" className={labelClass}>Anything else?</label>
          <textarea id="notes" name="notes" maxLength={1000} rows={3} className={fieldClass} placeholder="Services offered, what makes them great, etc." />
        </div>

        <div>
          <label htmlFor="submitter_email" className={labelClass}>Your email<Req /></label>
          <input id="submitter_email" name="submitter_email" type="email" required maxLength={200} className={fieldClass} placeholder="So we can follow up about your submission" />
        </div>

        {status === "error" && (
          <p className="text-sm text-red-600">{errorMsg}</p>
        )}

        <Button
          type="submit"
          variant="primary"
          className="w-full"
          disabled={status === "submitting"}
        >
          {status === "submitting" ? (
            <><Loader2 size={18} className="animate-spin" /> Submitting…</>
          ) : (
            "Submit shop"
          )}
        </Button>
        <p className="text-xs text-[var(--color-charcoal-light)] text-center">
          Every submission is reviewed before it appears in the directory.
        </p>
      </div>
    </form>
  )
}

"use client"

import { useState } from "react"
import { CheckCircle, Loader2 } from "lucide-react"
import { fieldClass, labelClass } from "@/lib/form-styles"
import { Button } from "@/components/ui/Button"
import { useFormSubmit } from "@/lib/hooks/useFormSubmit"
import { Honeypot, Req } from "@/components/forms/FormBits"
import { ShopFinder } from "@/components/submit/ShopFinder"
import type { SearchSuggestion } from "@/lib/supabase/queries/shops"

/**
 * "Request listing updates" form — the v1 self-serve way for owners to send
 * corrections (hours, services, pricing, photos) without a login. Requests
 * land in the admin Update Requests queue; the founder applies them by hand.
 */
export function UpdateRequestForm({
  initialShop,
}: {
  /** Pre-selected shop when arriving via ?shop=slug (e.g. from the welcome email). */
  initialShop?: { slug: string; name: string; city: string | null; state_code: string | null }
}) {
  const [shopSlug, setShopSlug] = useState(initialShop?.slug ?? "")
  const [shopLabel, setShopLabel] = useState(
    initialShop
      ? `${initialShop.name} — ${[initialShop.city, initialShop.state_code].filter(Boolean).join(", ")}`
      : "",
  )
  const { status, errorMsg, submit } = useFormSubmit(
    "/api/update-request",
    "Sending failed. Please try again.",
  )

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    await submit({
      shop_slug: shopSlug,
      requester_name: fd.get("requester_name"),
      requester_email: fd.get("requester_email"),
      hours: fd.get("hours"),
      services: fd.get("services"),
      pricing: fd.get("pricing"),
      photos_url: fd.get("photos_url"),
      message: fd.get("message"),
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
            Request received
          </h2>
          <p className="mt-3 text-[var(--color-charcoal-light)] leading-relaxed">
            We apply every update by hand, usually within a day or two. You&apos;ll
            see the changes live on your listing — no reply needed unless we have
            a question.
          </p>
        </div>
      </div>
    )
  }

  const selectShop = (s: SearchSuggestion) => setShopSlug(s.slug)

  return (
    <form
      onSubmit={handleSubmit}
      className="relative overflow-hidden bg-white border border-[var(--color-border)] rounded-2xl shadow-card"
    >
      <span aria-hidden="true" className="block h-1 w-full bg-[var(--color-forest)]" />

      <div className="p-6 sm:p-8 space-y-5">
        <Honeypot />

        <div>
          <label className={labelClass}>Your shop<Req /></label>
          {shopLabel ? (
            <div className="flex items-center justify-between gap-3 px-4 py-3 bg-[var(--color-cream)] border border-[var(--color-border)] rounded-lg">
              <p className="text-sm font-semibold text-[var(--color-charcoal)] truncate">{shopLabel}</p>
              <button
                type="button"
                onClick={() => { setShopSlug(""); setShopLabel("") }}
                className="text-xs font-semibold text-[var(--color-forest)] hover:underline shrink-0 cursor-pointer"
              >
                Change
              </button>
            </div>
          ) : (
            <ShopFinder
              placeholder="Search your shop name or city…"
              onSelect={selectShop}
            />
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="requester_name" className={labelClass}>Your name<Req /></label>
            <input id="requester_name" name="requester_name" required maxLength={120} className={fieldClass} placeholder="e.g. Sam Torrance" />
          </div>
          <div>
            <label htmlFor="requester_email" className={labelClass}>Your email<Req /></label>
            <input id="requester_email" name="requester_email" type="email" required maxLength={200} className={fieldClass} placeholder="So we can confirm it's you" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="hours" className={labelClass}>Hours</label>
            <input id="hours" name="hours" maxLength={300} className={fieldClass} placeholder="e.g. Mon–Fri 9–6, Sat 9–1" />
          </div>
          <div>
            <label htmlFor="pricing" className={labelClass}>Fitting pricing</label>
            <input id="pricing" name="pricing" maxLength={300} className={fieldClass} placeholder="e.g. Full bag $175, driver $85" />
          </div>
        </div>

        <div>
          <label htmlFor="services" className={labelClass}>Services to add or fix</label>
          <input id="services" name="services" maxLength={500} className={fieldClass} placeholder="e.g. putter fitting, lie/loft adjustment, regripping" />
        </div>

        <div>
          <label htmlFor="photos_url" className={labelClass}>Photos or booking link</label>
          <input id="photos_url" name="photos_url" maxLength={500} className={fieldClass} placeholder="Link to photos (Drive/Dropbox) or your booking page" />
        </div>

        <div>
          <label htmlFor="message" className={labelClass}>Anything else?</label>
          <textarea id="message" name="message" maxLength={1000} rows={3} className={fieldClass} placeholder="Wrong phone number, new address, description tweaks — anything." />
        </div>

        {status === "error" && <p className="text-sm text-red-600">{errorMsg}</p>}

        <Button type="submit" variant="primary" className="w-full" disabled={status === "submitting" || !shopSlug}>
          {status === "submitting" ? (
            <><Loader2 size={18} className="animate-spin" /> Sending…</>
          ) : (
            "Send update request"
          )}
        </Button>
        <p className="text-xs text-[var(--color-charcoal-light)] text-center">
          We apply updates by hand and may email to confirm ownership first.
        </p>
      </div>
    </form>
  )
}

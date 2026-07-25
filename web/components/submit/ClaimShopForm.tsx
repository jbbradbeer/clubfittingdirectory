"use client"

import { BadgeCheck, CheckCircle, Loader2 } from "lucide-react"
import Link from "next/link"
import { fieldClass, labelClass } from "@/lib/form-styles"
import { Button } from "@/components/ui/Button"
import { CAL_FOUNDING_CALL_URL } from "@/lib/constants"
import { VERIFIED_PERKS } from "@/lib/plans"
import { useFormSubmit } from "@/lib/hooks/useFormSubmit"
import { Honeypot, Req } from "@/components/forms/FormBits"

export function ClaimShopForm({ shopSlug, shopName, source }: {
  shopSlug: string
  shopName: string
  source?: string
}) {
  const { status, errorMsg, submit } = useFormSubmit(
    "/api/claim-shop",
    "Claim failed. Please try again.",
  )

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    await submit({
      shop_slug: shopSlug,
      claimant_name: fd.get("claimant_name"),
      claimant_role: fd.get("claimant_role"),
      claimant_email: fd.get("claimant_email"),
      claimant_phone: fd.get("claimant_phone"),
      message: fd.get("message"),
      source,
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
            Claim received
          </h2>
          <p className="mt-3 text-[var(--color-charcoal-light)] leading-relaxed">
            We verify every claim by hand, usually within a day or two. Once approved,
            fitting requests golfers send through your page are forwarded straight to
            the email you provided — check your inbox for a confirmation.
          </p>
          <div className="mt-6 pt-6 border-t border-[var(--color-border)] text-left">
            <p className="font-display text-lg text-[var(--color-charcoal)] text-center">
              While you wait — what Verified adds
            </p>
            <p className="mt-2 text-sm text-[var(--color-charcoal-light)] leading-relaxed text-center">
              Approval usually takes a day. Once you&apos;re in, Verified is the
              growth layer most claimed shops add:
            </p>
            <ul className="mt-4 space-y-2 max-w-md mx-auto">
              {VERIFIED_PERKS.map((perk) => (
                <li key={perk.title} className="flex gap-2 text-sm text-[var(--color-charcoal)] leading-relaxed">
                  <BadgeCheck size={16} className="text-[var(--color-forest)] shrink-0 mt-0.5" />
                  {perk.short}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm text-[var(--color-charcoal-light)] text-center">
              $49/month or $499/year (two months free).{" "}
              <Link href="/for-shops" className="font-semibold text-[var(--color-forest)] hover:underline">
                Full details →
              </Link>
            </p>
            <div className="mt-5 text-center">
              <p className="text-sm text-[var(--color-charcoal-light)] leading-relaxed">
                Want to skip the queue? Book 15 minutes with the founder — we&apos;ll
                verify you on the call and fix anything on your listing while we talk.
              </p>
              <Button href={CAL_FOUNDING_CALL_URL} external variant="primary" size="lg" className="mt-4">
                Book your intro call
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="relative overflow-hidden bg-white border border-[var(--color-border)] rounded-2xl shadow-card"
    >
      <span aria-hidden="true" className="block h-1 w-full bg-[var(--color-forest)]" />

      <div className="p-6 sm:p-8 space-y-5">
        <Honeypot />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="claimant_name" className={labelClass}>Your name<Req /></label>
            <input id="claimant_name" name="claimant_name" required maxLength={120} className={fieldClass} placeholder="e.g. Sam Torrance" />
          </div>
          <div>
            <label htmlFor="claimant_role" className={labelClass}>Your role</label>
            <input id="claimant_role" name="claimant_role" maxLength={60} className={fieldClass} placeholder="Owner, manager, head fitter…" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="claimant_email" className={labelClass}>Your email<Req /></label>
            <input id="claimant_email" name="claimant_email" type="email" required maxLength={200} className={fieldClass} placeholder="Where we send edit access + leads" />
          </div>
          <div>
            <label htmlFor="claimant_phone" className={labelClass}>Phone</label>
            <input id="claimant_phone" name="claimant_phone" maxLength={40} className={fieldClass} placeholder="(555) 123-4567" />
          </div>
        </div>

        <div>
          <label htmlFor="message" className={labelClass}>Anything to fix or add on the listing?</label>
          <textarea id="message" name="message" maxLength={1000} rows={3} className={fieldClass} placeholder="Wrong hours, missing services, new photos, anything." />
        </div>

        {status === "error" && <p className="text-sm text-red-600">{errorMsg}</p>}

        <Button type="submit" variant="primary" className="w-full" disabled={status === "submitting"}>
          {status === "submitting" ? (
            <><Loader2 size={18} className="animate-spin" /> Sending…</>
          ) : (
            `Claim ${shopName} — free`
          )}
        </Button>
        <p className="text-xs text-[var(--color-charcoal-light)] text-center">
          Claiming is free and always will be. We verify ownership before approving.
        </p>
      </div>
    </form>
  )
}

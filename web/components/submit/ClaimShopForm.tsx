"use client"

import { useState } from "react"
import { CheckCircle, Loader2 } from "lucide-react"
import { fieldClass, labelClass } from "@/lib/form-styles"
import { Button } from "@/components/ui/Button"

type Status = "idle" | "submitting" | "success" | "error"

const Req = () => <span className="text-[var(--color-gold-ink)]"> *</span>

export function ClaimShopForm({ shopSlug, shopName, source }: {
  shopSlug: string
  shopName: string
  source?: string
}) {
  const [status, setStatus] = useState<Status>("idle")
  const [errorMsg, setErrorMsg] = useState("")

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus("submitting")
    setErrorMsg("")

    const fd = new FormData(e.currentTarget)
    const payload = {
      shop_slug: shopSlug,
      claimant_name: fd.get("claimant_name"),
      claimant_role: fd.get("claimant_role"),
      claimant_email: fd.get("claimant_email"),
      claimant_phone: fd.get("claimant_phone"),
      message: fd.get("message"),
      source,
      company_website: fd.get("company_website"), // honeypot
    }

    try {
      const res = await fetch("/api/claim-shop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Claim failed. Please try again.")
      setStatus("success")
    } catch (err) {
      setStatus("error")
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong. Please try again.")
    }
  }

  if (status === "success") {
    return (
      <div className="relative overflow-hidden bg-white border border-[var(--color-border)] rounded-2xl shadow-card">
        <span aria-hidden="true" className="block h-1 w-full bg-gradient-to-r from-[var(--color-forest)] to-[var(--color-gold)]" />
        <div className="p-8 text-center">
          <CheckCircle size={44} className="mx-auto text-[var(--color-forest)] mb-4" />
          <h2 className="font-display text-2xl text-[var(--color-charcoal)]">
            Claim received
          </h2>
          <p className="mt-3 text-[var(--color-charcoal-light)] leading-relaxed">
            We verify every claim by hand, usually within a day or two. Once approved,
            fitting requests golfers send through your page are forwarded straight to
            the email you provided — and you can reply to us anytime to correct
            details or add photos on your listing.
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
      <span aria-hidden="true" className="block h-1 w-full bg-gradient-to-r from-[var(--color-forest)] to-[var(--color-gold)]" />

      <div className="p-6 sm:p-8 space-y-5">
        {/* Honeypot — visually hidden; real users never fill it */}
        <div aria-hidden="true" className="absolute -left-[9999px] w-px h-px overflow-hidden">
          <label>
            Company website
            <input type="text" name="company_website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>

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

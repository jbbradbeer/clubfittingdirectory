"use client"

import { useState } from "react"
import { Loader2, Lock } from "lucide-react"
import { Button } from "@/components/ui/Button"

/**
 * "Pay with Stripe" button for /onboard/pay/[slug]. Creates a fresh Checkout
 * Session on click (Checkout URLs expire after 24h, so they're never emailed
 * directly) and redirects the owner to Stripe's hosted payment page.
 */
export function PayButton({ shopSlug, renewal }: { shopSlug: string; renewal?: boolean }) {
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState("")

  async function startCheckout() {
    setStatus("loading")
    setErrorMsg("")
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shop_slug: shopSlug }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.url) {
        throw new Error(data.error || "Could not start the payment. Please try again.")
      }
      window.location.href = data.url
    } catch (err) {
      setStatus("error")
      setErrorMsg(
        err instanceof Error ? err.message : "Could not start the payment. Please try again.",
      )
    }
  }

  return (
    <div>
      <Button
        type="button"
        variant="primary"
        size="lg"
        className="w-full"
        disabled={status === "loading"}
        onClick={startCheckout}
      >
        {status === "loading" ? (
          <><Loader2 size={18} className="animate-spin" /> Opening secure checkout…</>
        ) : (
          <><Lock size={16} /> {renewal ? "Renew" : "Activate"} Founding Verified — $349/yr</>
        )}
      </Button>
      {status === "error" && <p className="mt-3 text-sm text-red-600 text-center">{errorMsg}</p>}
      <p className="mt-3 text-xs text-[var(--color-charcoal-light)] text-center">
        Secure payment by Stripe. Billed yearly — cancel anytime and the badge
        stays through your paid year.
      </p>
    </div>
  )
}

import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { KeyRound, MailCheck } from "lucide-react"
import { getPortalSession } from "@/lib/portal-auth"
import { requestMagicLink } from "@/app/portal/actions"
import { Button } from "@/components/ui/Button"
import { fieldClass, labelClass } from "@/lib/form-styles"

export const metadata: Metadata = {
  title: "Shop Owner Portal",
  robots: { index: false, follow: false },
}

export const dynamic = "force-dynamic"

/**
 * Portal entrance: request a magic sign-in link. The response copy is ALWAYS
 * the same neutral "if that email matches a claimed listing, a link is on its
 * way" — never confirms whether an email owns a shop (no enumeration).
 */
export default async function PortalPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string }>
}) {
  const email = await getPortalSession()
  if (email) redirect("/portal/edit")

  const { sent, error } = await searchParams

  return (
    <section className="bg-[var(--color-ivory)] min-h-[70vh] py-16">
      <div className="max-w-md mx-auto px-4 sm:px-6">
        <div className="bg-white border border-[var(--color-border)] rounded-2xl shadow-card p-8">
          <KeyRound size={28} className="text-[var(--color-forest)]" />
          <h1 className="mt-4 font-display text-3xl text-[var(--color-charcoal)]">
            Shop owner portal
          </h1>
          <p className="mt-2 text-sm text-[var(--color-charcoal-light)] leading-relaxed">
            Manage your listing without a password. Enter the email you claimed
            your shop with and we&apos;ll send a sign-in link.
          </p>

          {sent ? (
            <div className="mt-6 flex items-start gap-3 bg-[var(--color-ivory)] border border-[var(--color-border)] rounded-xl p-4">
              <MailCheck size={18} className="shrink-0 mt-0.5 text-[var(--color-forest)]" />
              <p className="text-sm text-[var(--color-charcoal)]">
                If that email matches a claimed listing, a sign-in link is on
                its way. It expires in 20 minutes — check spam if it doesn&apos;t
                arrive.
              </p>
            </div>
          ) : (
            <form action={requestMagicLink} className="mt-6 space-y-4">
              {error === "expired" && (
                <p className="text-sm text-red-600">
                  That link expired or was invalid — request a fresh one below.
                </p>
              )}
              <div>
                <label htmlFor="email" className={labelClass}>
                  Owner email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  maxLength={200}
                  className={fieldClass}
                  placeholder="you@yourshop.com"
                />
              </div>
              <Button type="submit" variant="primary" className="w-full">
                Email me a sign-in link
              </Button>
            </form>
          )}

          <p className="mt-6 text-xs text-[var(--color-charcoal-light)]">
            Haven&apos;t claimed your shop yet? Claiming is free — find your shop
            via{" "}
            <a href="/for-shops" className="font-semibold text-[var(--color-forest)] hover:underline">
              the shop owners page
            </a>
            .
          </p>
        </div>
      </div>
    </section>
  )
}

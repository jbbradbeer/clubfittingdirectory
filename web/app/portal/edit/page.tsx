import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { CheckCircle } from "lucide-react"
import { getPortalSession, getOwnedShops } from "@/lib/portal-auth"
import { createAdminClient } from "@/lib/supabase/admin"
import { portalLogout } from "@/app/portal/actions"
import { EditListingForm } from "@/components/portal/EditListingForm"

export const metadata: Metadata = {
  title: "Edit Your Listing",
  robots: { index: false, follow: false },
}

export const dynamic = "force-dynamic"

/**
 * The portal's edit surface (Phase 2 core — the leads/home tabs come later).
 * One shop at a time; a pill switcher appears when the signed-in email owns
 * more than one claimed shop.
 */
export default async function PortalEditPage({
  searchParams,
}: {
  searchParams: Promise<{ shop?: string; sent?: string; error?: string }>
}) {
  const email = await getPortalSession()
  if (!email) redirect("/portal")

  const shops = await getOwnedShops(email)
  if (shops.length === 0) {
    // Session is valid but the email no longer owns anything (revoked).
    redirect("/portal")
  }

  const params = await searchParams
  const selected = shops.find((s) => s.slug === params.shop) ?? shops[0]

  // Pending banner: is there a 'new' batch for this shop?
  const supabase = createAdminClient()
  const { data: pending } = await supabase
    .from("owner_edit_batches")
    .select("id, created_at")
    .eq("shop_id", selected.id)
    .eq("review_status", "new")
    .limit(1)
  const hasPending = (pending ?? []).length > 0

  return (
    <section className="bg-[var(--color-ivory)] min-h-[70vh] py-12">
      <div className="max-w-xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="font-display text-3xl text-[var(--color-charcoal)]">Your listing</h1>
            <p className="mt-1 text-sm text-[var(--color-charcoal-light)]">Signed in as {email}</p>
          </div>
          <form action={portalLogout}>
            <button
              type="submit"
              className="text-sm font-semibold text-[var(--color-charcoal-light)] hover:text-[var(--color-forest)] transition-colors cursor-pointer"
            >
              Sign out
            </button>
          </form>
        </div>

        {shops.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {shops.map((s) => (
              <Link
                key={s.id}
                href={`/portal/edit?shop=${s.slug}`}
                className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-colors ${
                  s.id === selected.id
                    ? "bg-[var(--color-forest)] text-white"
                    : "border border-[var(--color-border)] text-[var(--color-charcoal-light)] hover:bg-[var(--color-cream)]"
                }`}
              >
                {s.name}
              </Link>
            ))}
          </div>
        )}

        {params.sent && (
          <div className="mb-6 flex items-start gap-3 bg-white border border-[var(--color-border)] rounded-xl p-4">
            <CheckCircle size={18} className="shrink-0 mt-0.5 text-[var(--color-forest)]" />
            <p className="text-sm text-[var(--color-charcoal)]">
              Changes submitted — we&apos;ll review them and email you when they&apos;re live.
            </p>
          </div>
        )}
        {params.error === "rate" && (
          <p className="mb-6 text-sm text-red-600">Too many submissions — try again in an hour.</p>
        )}
        {params.error === "empty" && (
          <p className="mb-6 text-sm text-red-600">Nothing changed — edit a field or add a message first.</p>
        )}
        {params.error === "save" && (
          <p className="mb-6 text-sm text-red-600">Something went wrong saving your changes — try again.</p>
        )}
        {hasPending && !params.sent && (
          <p className="mb-6 text-sm text-[var(--color-charcoal-light)] bg-white border border-[var(--color-border)] rounded-xl p-4">
            You have changes awaiting review. Submitting again replaces them.
          </p>
        )}

        <div className="bg-white border border-[var(--color-border)] rounded-2xl shadow-card p-6 sm:p-8">
          <EditListingForm shop={selected} />
        </div>
      </div>
    </section>
  )
}

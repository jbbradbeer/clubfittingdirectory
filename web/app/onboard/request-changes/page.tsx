import type { Metadata } from "next"
import { getShopBySlug } from "@/lib/supabase/queries/shops"
import { UpdateRequestForm } from "@/components/submit/UpdateRequestForm"

export const metadata: Metadata = {
  title: "Request listing updates — Club Fitting Directory",
  robots: { index: false, follow: false },
}

/**
 * Owner-facing "request changes to my listing" page. Linked from the welcome
 * email (?shop=slug pre-selects the shop) and the payment success page.
 */
export default async function RequestChangesPage({
  searchParams,
}: {
  searchParams: Promise<{ shop?: string }>
}) {
  const { shop: shopParam } = await searchParams
  const shop = shopParam ? await getShopBySlug(shopParam) : null

  return (
    <section className="bg-[var(--color-ivory)] min-h-screen py-14">
      <div className="max-w-xl mx-auto px-4 sm:px-6">
        <p className="section-label mb-3">Owner updates</p>
        <h1 className="font-display text-3xl sm:text-4xl text-[var(--color-charcoal)]">
          Request listing updates
        </h1>
        <p className="mt-4 mb-8 text-[var(--color-charcoal-light)] leading-relaxed">
          Hours changed? New services, pricing, or photos? Tell us what to update
          and we&apos;ll apply it by hand — every listing stays reviewed, never
          auto-edited.
        </p>

        <UpdateRequestForm
          initialShop={
            shop
              ? { slug: shop.slug, name: shop.name, city: shop.city, state_code: shop.state_code }
              : undefined
          }
        />
      </div>
    </section>
  )
}

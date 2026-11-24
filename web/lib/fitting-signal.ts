/**
 * Should this listing show the "Request a Fitting" button? A lead sent to a
 * shop that doesn't fit clubs helps nobody.
 *
 * Our stored data alone can't answer "no": of 72 listings with no fitting
 * signal at all, 27 mention fittings on their own website. So the button is
 * hidden only when BOTH hold: nothing on record points to fitting, AND the
 * shop's website was checked (NO_FITTING_FOUND). Anything uncertain keeps it,
 * and a fact added later (price, brands, services…) brings it back by itself.
 */

/** Website checked 2026-11-24, no mention of fittings found. TOURSPECWRX told
 *  us directly that it offers no fitting sessions. */
const NO_FITTING_FOUND: ReadonlySet<string> = new Set([
  "802-golf-manchester-vt",
  "alaska-sim-72-golf-anchorage-ak",
  "bomb-discs-lexington-ky",
  "bushwood-golf-shack-auburndale-fl",
  "chisdaddy-golf-lexington-nc",
  "club-house-llc-lafayette-in",
  "club-repair-bolingbrook-il",
  "club-shop-peanuts-golf-boone-nc",
  "discount-golf-royal-oak-mi",
  "fore-3-fore-golf-shop-llc-charlottesville-va",
  "glopro-golf-st-paul-mn",
  "greater-golf-express-pineville-nc",
  "hickory-golf-workshop-burlington-vt",
  "j-p-lann-golf-royal-oak-mi",
  "neighborhood-golf-shopmuni-kids-portland-or",
  "par-excellence-golf-school-mesa-az",
  "purchase-and-resell-vista-ca",
  "shopgolfguys-portland-or",
  "t-s-golf-taunton-ma",
  "the-golf-guy-llc-warrenville-il",
  "the-golf-lab-chantilly-va",
  "the-golf-shop-brazil-in",
  "the-golf-shop-gulfport-fl",
  "the-golfer-dude-llc-lexington-ky",
  "the-pointe-golf-club-powells-point-nc",
  "tourspecwrx-west-hills-ca",
  "under-cover-golf-rice-lake-wi",
])

export type FittingSignalShop = {
  slug: string
  name: string
  offers_fitting?: boolean | null
  fitting_price_min?: number | null
  fitting_price_max?: number | null
  launch_monitors?: string[] | null
  brands_fitted?: string[] | null
  services?: string | null
  services_array?: string[] | null
}

export function acceptsFittingRequests(shop: FittingSignalShop): boolean {
  if (!NO_FITTING_FOUND.has(shop.slug)) return true
  const services = [...(shop.services_array ?? []), shop.services ?? ""].join(" ")
  return (
    Boolean(shop.offers_fitting) ||
    shop.fitting_price_min != null ||
    shop.fitting_price_max != null ||
    (shop.launch_monitors?.length ?? 0) > 0 ||
    (shop.brands_fitted?.length ?? 0) > 0 ||
    /club fitting/i.test(services) ||
    /\bfitt(ing|er)s?\b/i.test(shop.name)
  )
}

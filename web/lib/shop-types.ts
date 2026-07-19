/**
 * Canonical shop-type taxonomy — the SINGLE SOURCE OF TRUTH.
 *
 * `dbType` MUST match the `shop_type` values stored in Supabase exactly.
 * (Confirmed values: Clubfitter, Retailer, Simulator, Golf Course / Pro Shop,
 *  Instruction, Driving Range.)
 *
 * The homepage category circles, the /category/[type] pages, and the sitemap
 * all read from this list so they can never drift out of sync again.
 */
export interface ShopTypeDef {
  /** Exact value in the shops.shop_type column */
  dbType: string
  /** URL segment: /category/<slug> */
  slug: string
  /** Plural display name */
  label: string
  /** Singular display name */
  singular: string
}

export const SHOP_TYPES: ShopTypeDef[] = [
  { dbType: "Clubfitter",             slug: "club-fitters",    label: "Club Fitters",    singular: "Club Fitter" },
  { dbType: "Retailer",               slug: "golf-retailers",  label: "Golf Retailers",  singular: "Golf Retailer" },
  { dbType: "Simulator",              slug: "golf-simulators", label: "Golf Simulators", singular: "Golf Simulator" },
  { dbType: "Golf Course / Pro Shop", slug: "pro-shops",       label: "Pro Shops",       singular: "Pro Shop" },
  { dbType: "Instruction",            slug: "instruction",     label: "Instruction",     singular: "Instruction" },
  { dbType: "Driving Range",          slug: "driving-ranges",  label: "Driving Ranges",  singular: "Driving Range" },
]

/** Look up a type by its URL slug (e.g. "club-fitters"). */
export function slugToShopType(slug: string): ShopTypeDef | undefined {
  return SHOP_TYPES.find((t) => t.slug === slug)
}

/** Look up a type by its database value (e.g. "Clubfitter"). */
export function dbTypeToShopType(dbType: string): ShopTypeDef | undefined {
  return SHOP_TYPES.find((t) => t.dbType === dbType)
}

/**
 * Count phrase for hero subtitles: "3 club fitters", "1 pro shop".
 * Uses the taxonomy's singular/plural labels instead of naive `+ "s"`,
 * which produced artifacts like "golf course / pro shops" and "instructions".
 */
export function shopTypeCountPhrase(dbType: string, count: number): string {
  const def = dbTypeToShopType(dbType)
  const name = def
    ? (count === 1 ? def.singular : def.label).toLowerCase()
    : count === 1
      ? "other listing"
      : "other listings"
  return `${count} ${name}`
}

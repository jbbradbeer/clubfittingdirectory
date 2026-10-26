import { toCitySlug } from "@/lib/slugs"
import { dbTypeToShopType } from "@/lib/shop-types"
import { SERVICE_FILTERS } from "@/lib/service-filters"

/**
 * Which pages show a given shop — the blast radius of one on-demand
 * revalidation (app/api/revalidate). Kept out of the route file so it can be
 * unit-tested (Next.js only allows HTTP-handler exports from route.ts).
 */

export type ShopRow = {
  slug?: string | null
  state_code?: string | null
  city?: string | null
  shop_type?: string | null
  services?: string | null
  rating?: number | null
  is_featured?: boolean | null
  listing_tier?: string | null
  claimed_at?: string | null
  latitude?: number | null
  longitude?: number | null
  name?: string | null
}

export function pathsForShop(row: ShopRow): string[] {
  const paths: string[] = []
  if (row.slug) paths.push(`/listing/${row.slug}`)
  if (row.state_code) paths.push(`/state/${row.state_code.toLowerCase()}`)
  if (row.city && row.state_code) paths.push(`/city/${toCitySlug(row.city, row.state_code)}`)
  if (row.shop_type) {
    const cat = dbTypeToShopType(row.shop_type)
    if (cat) paths.push(`/category/${cat.slug}`)
  }
  // Service landing pages (/repair) list shops by services text, so a change
  // to a shop with a matching service must refresh them too. Case-insensitive
  // to match the page's own `.ilike` query (a shop stored as "club repair"
  // is listed there, so its edits must refresh it too).
  if (row.services) {
    const services = row.services.toLowerCase()
    if (SERVICE_FILTERS.some((s) => services.includes(s.value.toLowerCase()))) {
      paths.push("/repair")
    }
  }
  return paths
}

/* The national /map page renders every active shop's pin, so it must refresh
   whenever a shop is added/removed or its pin (coordinates) or label (name)
   changes. Anything else about the shop is invisible on the map. */
export function mapNeedsRefresh(type: string, record: ShopRow | null, oldRecord: ShopRow | null): boolean {
  if (type === "INSERT" || type === "DELETE") return true
  if (!record || !oldRecord) return false
  return (
    record.latitude !== oldRecord.latitude ||
    record.longitude !== oldRecord.longitude ||
    record.name !== oldRecord.name ||
    record.slug !== oldRecord.slug
  )
}

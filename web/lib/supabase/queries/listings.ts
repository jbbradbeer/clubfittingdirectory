/**
 * Client-side directory query — safe to import in Client Components.
 * Uses the browser Supabase client (no next/headers dependency).
 *
 * This mirrors the getListings() logic from shops.ts but is designed
 * for use inside "use client" components where server.ts cannot be used.
 */
import { createClient } from "@/lib/supabase/client"
import type { Shop } from "@/types/shop"

const CARD_FIELDS = [
  "id", "slug", "name", "shop_type", "primary_service",
  "city", "state", "state_code", "phone", "website",
  "rating", "rating_tier", "reviews", "photos_count", "has_photos",
  "offers_fitting", "fitting_environment", "services", "services_array",
  "num_services", "verified", "location_link", "is_featured", "listing_tier",
  "latitude", "longitude",
].join(", ")

export interface DirectoryFilters {
  q?: string
  state?: string
  shopTypes?: string[]
  services?: string[]
  fitting?: boolean
  fittingEnv?: string
  minRating?: number
  sort?: "rating" | "name" | "services" | "fitting"
  page?: number
  perPage?: number
}

export interface DirectoryResult {
  shops: Shop[]
  total: number
  page: number
  perPage: number
  totalPages: number
}

export async function getListings(
  filters: DirectoryFilters = {},
): Promise<DirectoryResult> {
  const supabase = createClient()
  const page     = Math.max(1, filters.page    ?? 1)
  const perPage  = Math.max(1, filters.perPage ?? 24)
  const from     = (page - 1) * perPage
  const to       = from + perPage - 1

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const applyFilters = (q: any) => {
    if (filters.q) {
      const term = filters.q.trim()
      q = q.or(`name.ilike.%${term}%,city.ilike.%${term}%`)
    }
    if (filters.state)                            q = q.eq("state_code", filters.state)
    if (filters.shopTypes?.length)                q = q.in("shop_type", filters.shopTypes)
    if (filters.services?.length) {
      const orClauses = filters.services.map((s) => `services.ilike.%${s}%`).join(",")
      q = q.or(orClauses)
    }
    if (filters.fitting === true)                 q = q.eq("offers_fitting", true)
    if (filters.fittingEnv)                       q = q.eq("fitting_environment", filters.fittingEnv)
    if (filters.minRating && filters.minRating > 0) q = q.gte("rating", filters.minRating)
    return q
  }

  let countQ = applyFilters(
    supabase.from("shops").select("id", { count: "exact", head: true }).eq("status", "active"),
  )
  let dataQ = applyFilters(
    supabase.from("shops").select(CARD_FIELDS).eq("status", "active"),
  )

  // Sort
  if (filters.sort === "name") {
    dataQ = dataQ.order("name", { ascending: true })
  } else if (filters.sort === "services") {
    dataQ = dataQ
      .order("num_services", { ascending: false, nullsFirst: false })
      .order("rating",       { ascending: false, nullsFirst: false })
  } else if (filters.sort === "fitting") {
    dataQ = dataQ
      .order("offers_fitting", { ascending: false })
      .order("rating",         { ascending: false, nullsFirst: false })
  } else {
    dataQ = dataQ
      .order("is_featured", { ascending: false })
      .order("rating",      { ascending: false, nullsFirst: false })
  }

  dataQ = dataQ.range(from, to)

  const [{ count }, { data, error }] = await Promise.all([countQ, dataQ])
  if (error) throw error

  const total      = count ?? 0
  const totalPages = Math.max(1, Math.ceil(total / perPage))

  return {
    shops:      (data as unknown as Shop[]) ?? [],
    total,
    page,
    perPage,
    totalPages,
  }
}

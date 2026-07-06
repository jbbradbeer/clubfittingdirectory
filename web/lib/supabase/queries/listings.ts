/**
 * Client-side directory query — safe to import in Client Components.
 * Uses the browser Supabase client (no next/headers dependency).
 *
 * This mirrors the getListings() logic from shops.ts but is designed
 * for use inside "use client" components where server.ts cannot be used.
 */
import { createClient } from "@/lib/supabase/client"
import type { Shop } from "@/types/shop"
import {
  CARD_FIELDS,
  sanitizeSearchTerm,
  type DirectoryFilters,
  type DirectoryResult,
} from "./shared"

export type { DirectoryFilters, DirectoryResult }

export async function getListings(
  filters: DirectoryFilters = {},
): Promise<DirectoryResult> {
  const supabase = createClient()
  const page     = Math.max(1, filters.page    ?? 1)
  const perPage  = Math.max(1, filters.perPage ?? 24)
  const from     = (page - 1) * perPage
  const to       = from + perPage - 1

   
  const applyFilters = (q: any) => {
    if (filters.q) {
      const term = sanitizeSearchTerm(filters.q)
      if (term) q = q.or(`name.ilike.%${term}%,city.ilike.%${term}%,state.ilike.%${term}%`)
    }
    if (filters.state)                            q = q.eq("state_code", filters.state)
    if (filters.shopTypes?.length)                q = q.in("shop_type", filters.shopTypes)
    if (filters.services?.length) {
      const orClauses = filters.services
        .map((s) => sanitizeSearchTerm(s))
        .filter(Boolean)
        .map((s) => `services.ilike.%${s}%`)
        .join(",")
      if (orClauses) q = q.or(orClauses)
    }
    if (filters.ownership?.length)                q = q.in("ownership_type", filters.ownership)
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

  // Stable tiebreaker: without a final unique sort key, rows that tie on the
  // chosen sort can shuffle between page requests (duplicated/skipped shops).
  dataQ = dataQ.order("id", { ascending: true }).range(from, to)

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

/* ─────────────────────────────────────────────────────────
   NEAR ME — Proximity search using PostGIS RPC
   Returns shops sorted by distance from a lat/lng point.
   ───────────────────────────────────────────────────────── */

export interface NearMeShop extends Shop {
  distance_km: number
}

export async function getNearMeListings(
  lat: number,
  lng: number,
  radiusKm = 80,
  limit = 50,
): Promise<NearMeShop[]> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc("search_shops_near", {
    lat,
    lng,
    radius_km: radiusKm,
    p_limit:   limit,
  })
  if (error) throw error
  return (data ?? []) as NearMeShop[]
}

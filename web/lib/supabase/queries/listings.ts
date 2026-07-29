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
  queryListings,
  type DirectoryFilters,
  type DirectoryResult,
} from "./shared"

export type { DirectoryFilters, DirectoryResult }

export async function getListings(
  filters: DirectoryFilters = {},
): Promise<DirectoryResult> {
  return queryListings(createClient(), filters)
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

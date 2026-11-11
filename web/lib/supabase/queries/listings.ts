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
  // Step 1: the DB does the geo math (strict radius, migration 022) and hands
  // back ids nearest-first. Step 2: load the same card columns every other grid
  // uses, so cards and Map view (latitude/longitude) get everything they need.
  const { data: hits, error } = await supabase.rpc("nearby_shop_ids", {
    lat,
    lng,
    radius_km: radiusKm,
    p_limit:   limit,
  })
  if (error) throw error
  const ranked = (hits ?? []) as { id: string; distance_km: number }[]
  if (ranked.length === 0) return []

  const { data: rows, error: rowsError } = await supabase
    .from("shops")
    .select(CARD_FIELDS)
    .in("id", ranked.map((h) => h.id))
    .eq("status", "active")
  if (rowsError) throw rowsError

  const byId = new Map(((rows ?? []) as unknown as Shop[]).map((s) => [s.id, s]))
  return ranked.flatMap((h) => {
    const shop = byId.get(h.id)
    return shop ? [{ ...shop, distance_km: h.distance_km }] : []
  })
}

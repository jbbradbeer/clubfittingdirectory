import { log } from "@/lib/logger"

export type Pin = { latitude: number; longitude: number }
export type Address = { street: string; city: string; stateCode: string; postalCode: string | null }

type CensusMatch = {
  coordinates?: { x?: unknown; y?: unknown }
  addressComponents?: { city?: string; state?: string; zip?: string }
}

const same = (a: string | undefined, b: string) => (a ?? "").trim().toLowerCase() === b.trim().toLowerCase()

/**
 * The first match in the right state and the right ZIP or city. A wrong pin
 * sends golfers to the wrong place, so anything else is "no pin". Pure.
 */
export function pickMatch(matches: CensusMatch[], a: Address): Pin | null {
  for (const m of matches) {
    const c = m.addressComponents ?? {}
    const { x, y } = m.coordinates ?? {}
    if (typeof x !== "number" || typeof y !== "number" || !Number.isFinite(x) || !Number.isFinite(y)) continue
    if (!same(c.state, a.stateCode)) continue
    if ((a.postalCode && same(c.zip, a.postalCode)) || same(c.city, a.city)) {
      return { latitude: Number(y.toFixed(7)), longitude: Number(x.toFixed(7)) }
    }
  }
  return null
}

/**
 * Map pin for a street address from the free US Census geocoder. Null when
 * there's no confident match, no street, or the service is slow or down: an
 * approval never waits on it, and never falls back to a city-centre guess.
 */
export async function geocodeAddress(a: Address): Promise<Pin | null> {
  if (!a.street.trim()) return null
  const params = new URLSearchParams({
    street: a.street, city: a.city, state: a.stateCode,
    benchmark: "Public_AR_Current", format: "json",
  })
  if (a.postalCode) params.set("zip", a.postalCode)
  try {
    const res = await fetch(`https://geocoding.geo.census.gov/geocoder/locations/address?${params}`, {
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json = await res.json()
    const matches = json?.result?.addressMatches
    return Array.isArray(matches) ? pickMatch(matches, a) : null
  } catch (e) {
    log.warn("geocode", "lookup failed, publishing without a pin", { error: e })
    return null
  }
}

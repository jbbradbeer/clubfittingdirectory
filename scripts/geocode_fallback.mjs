// Fallback geocoder for shops the Census batch couldn't match.
// Uses OpenStreetMap Nominatim (1 req/sec, real User-Agent) — tries the full
// street address first, then falls back to city+state (approximate centroid,
// good enough to anchor the "nearby fitters" module).
// Usage: node scripts/geocode_fallback.mjs [--commit]
import fs from "fs"
import { createRequire } from "module"
const require = createRequire(new URL("../web/package.json", import.meta.url))
const { createClient } = require("@supabase/supabase-js")

const COMMIT = process.argv.includes("--commit")
const env = fs.readFileSync(new URL("../web/.env.local", import.meta.url), "utf8")
  .split("\n").reduce((a, l) => { const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m) a[m[1]] = m[2].replace(/^["']|["']$/g, ""); return a }, {})
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_KEY)

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const UA = "clubfittingdirectory-geocoder/1.0 (jamesbradbeer3@gmail.com)"

async function nominatim(params) {
  const url = "https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=us&" + new URLSearchParams(params)
  const res = await fetch(url, { headers: { "User-Agent": UA } })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const j = await res.json()
  if (!j.length) return null
  return { lat: Number(j[0].lat), lon: Number(j[0].lon) }
}

;(async () => {
  const { data: rows, error } = await supabase
    .from("shops").select("id,name,street,city,state_code,postal_code")
    .eq("status", "active").or("latitude.is.null,longitude.is.null")
  if (error) { console.error("fetch ERR", error.message); process.exit(1) }
  console.log(`still missing coords: ${rows.length}`)
  console.log(COMMIT ? "MODE: COMMIT" : "MODE: DRY-RUN (pass --commit to write)")

  let street = 0, city = 0, miss = 0, wrote = 0
  for (const r of rows) {
    let hit = null, via = ""
    if (r.street && r.street.trim()) {
      hit = await nominatim({ street: r.street, city: r.city || "", state: r.state_code || "", postalcode: r.postal_code || "" })
      if (hit) via = "street"
      await sleep(1100)
    }
    if (!hit) {
      hit = await nominatim({ city: r.city || "", state: r.state_code || "" })
      if (hit) via = "city"
      await sleep(1100)
    }
    if (!hit) { miss++; console.log(`  MISS ${r.name} (${r.city}, ${r.state_code})`); continue }
    if (via === "street") street++; else city++
    console.log(`  ${via.padEnd(6)} ${r.name} → ${hit.lat.toFixed(4)},${hit.lon.toFixed(4)}`)
    if (COMMIT) {
      const { error: e } = await supabase.from("shops").update({ latitude: hit.lat, longitude: hit.lon }).eq("id", r.id)
      if (e) console.log("    update ERR", e.message); else wrote++
    }
  }
  console.log(`\nstreet-matched: ${street} | city-centroid: ${city} | missed: ${miss}` + (COMMIT ? ` | wrote: ${wrote}` : ""))
})()

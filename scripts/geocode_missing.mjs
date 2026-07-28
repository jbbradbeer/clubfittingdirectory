// Geocode active shops missing latitude/longitude using the free US Census
// batch geocoder (no API key). Matches by full street address; updates Supabase.
// Usage: node scripts/geocode_missing.mjs [--commit]   (dry-run without --commit)
import fs from "fs"
import { createRequire } from "module"
// @supabase/supabase-js lives in web/node_modules — anchor require there.
const require = createRequire(new URL("../web/package.json", import.meta.url))
const { createClient } = require("@supabase/supabase-js")

const COMMIT = process.argv.includes("--commit")
const ROOT = new URL("../web/.env.local", import.meta.url)
const env = fs.readFileSync(ROOT, "utf8").split("\n").reduce((a, l) => {
  const m = l.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m) a[m[1]] = m[2].replace(/^["']|["']$/g, "")
  return a
}, {})
const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_KEY,
)

const clean = (s) => (s ?? "").toString().replace(/[,\n\r"]/g, " ").trim()

async function censusBatch(rows) {
  // Census batch CSV (no header): UniqueID, Street, City, State, ZIP
  const csv = rows
    .map((r) => [r.id, clean(r.street), clean(r.city), clean(r.state_code), clean(r.postal_code)].join(","))
    .join("\n")
  const form = new FormData()
  form.append("benchmark", "Public_AR_Current")
  form.append("addressFile", new Blob([csv], { type: "text/csv" }), "addresses.csv")

  const res = await fetch(
    "https://geocoding.geo.census.gov/geocoder/locations/addressbatch",
    { method: "POST", body: form },
  )
  if (!res.ok) throw new Error(`Census HTTP ${res.status}`)
  const text = await res.text()

  // Response CSV: ID,"input",Match|No_Match,MatchType,"matched addr","lon,lat",tigerline,side
  const out = new Map()
  for (const line of text.split("\n")) {
    if (!line.trim()) continue
    const cols = line.match(/("([^"]|"")*"|[^,]*)(,|$)/g)?.map((c) => c.replace(/,$/, "").replace(/^"|"$/g, "")) ?? []
    const id = cols[0]
    const matched = cols[2] === "Match"
    if (id && matched && cols[5]) {
      const [lon, lat] = cols[5].split(",").map(Number)
      if (Number.isFinite(lat) && Number.isFinite(lon)) out.set(id, { lat, lon })
    }
  }
  return out
}

const chunk = (arr, n) => Array.from({ length: Math.ceil(arr.length / n) }, (_, i) => arr.slice(i * n, i * n + n))

;(async () => {
  const { data: rows, error } = await supabase
    .from("shops")
    .select("id,name,street,city,state_code,postal_code")
    .eq("status", "active")
    .or("latitude.is.null,longitude.is.null")
  if (error) { console.error("fetch ERR", error.message); process.exit(1) }

  const geocodable = rows.filter((r) => r.street && r.street.trim())
  console.log(`missing coords: ${rows.length} | geocodable (has street): ${geocodable.length}`)
  console.log(COMMIT ? "MODE: COMMIT (will write)" : "MODE: DRY-RUN (no writes; pass --commit to write)")

  const matched = new Map()
  for (const [i, part] of chunk(geocodable, 150).entries()) {
    process.stdout.write(`  batch ${i + 1}: ${part.length} addresses … `)
    try {
      const m = await censusBatch(part)
      m.forEach((v, k) => matched.set(k, v))
      console.log(`${m.size} matched`)
    } catch (e) {
      console.log(`FAILED (${e.message})`)
    }
  }

  console.log(`\nTOTAL matched: ${matched.size}/${geocodable.length}`)
  const unmatched = geocodable.filter((r) => !matched.has(String(r.id)) && !matched.has(r.id))
  fs.writeFileSync(new URL("./geocode_unmatched.json", import.meta.url),
    JSON.stringify(unmatched.map((r) => ({ id: r.id, name: r.name, city: r.city, state: r.state_code })), null, 2))
  console.log(`unmatched written to scripts/geocode_unmatched.json (${unmatched.length})`)

  if (!COMMIT) {
    const sample = [...matched.entries()].slice(0, 5)
    console.log("sample matches:", sample.map(([id, c]) => `${id}:${c.lat.toFixed(4)},${c.lon.toFixed(4)}`).join("  "))
    return
  }

  let ok = 0, fail = 0
  for (const [id, { lat, lon }] of matched) {
    const { error: e } = await supabase.from("shops").update({ latitude: lat, longitude: lon }).eq("id", id)
    if (e) { fail++; if (fail <= 3) console.log("update ERR", id, e.message) } else ok++
  }
  console.log(`\nWROTE ${ok} rows, ${fail} failed.`)
})()

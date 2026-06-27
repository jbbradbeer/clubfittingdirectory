import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { toCitySlug } from "@/lib/slugs"
import { dbTypeToShopType } from "@/lib/shop-types"

/**
 * On-demand revalidation endpoint.
 *
 * WHY THIS EXISTS:
 * Listing pages are cached for 30 days (export const revalidate) to keep Vercel
 * ISR write volume low. That long window means a passive background refresh will
 * NOT pick up an edit for up to a month. This endpoint closes that gap: when a
 * shop row actually changes in Supabase, we rebuild ONLY the handful of pages
 * that show that shop — never the whole site.
 *
 * SECURITY:
 * Protected by a shared secret in REVALIDATE_SECRET. The caller must send it as
 *   Authorization: Bearer <secret>
 * (Supabase Database Webhooks let you add this header.) Without the secret the
 * request is rejected, so a stranger can't force-rebuild pages to run up costs.
 *
 * EXPECTED PAYLOAD (Supabase webhook shape):
 *   { type: "INSERT" | "UPDATE" | "DELETE", record: {...}, old_record: {...} }
 * A manual/test call can instead post a flat object: { slug, state_code, city, shop_type }.
 */

export const dynamic = "force-dynamic"

type ShopRow = {
  slug?: string | null
  state_code?: string | null
  city?: string | null
  shop_type?: string | null
}

function pathsForShop(row: ShopRow): string[] {
  const paths: string[] = []
  if (row.slug) paths.push(`/listing/${row.slug}`)
  if (row.state_code) paths.push(`/state/${row.state_code.toLowerCase()}`)
  if (row.city && row.state_code) paths.push(`/city/${toCitySlug(row.city, row.state_code)}`)
  if (row.shop_type) {
    const cat = dbTypeToShopType(row.shop_type)
    if (cat) paths.push(`/category/${cat.slug}`)
  }
  return paths
}

export async function POST(request: Request) {
  // ── Auth ──
  const secret = process.env.REVALIDATE_SECRET
  if (!secret) {
    console.error("[api/revalidate] REVALIDATE_SECRET is not set")
    return NextResponse.json({ error: "Revalidation is not configured." }, { status: 500 })
  }
  const auth = request.headers.get("authorization") ?? ""
  const provided = auth.replace(/^Bearer\s+/i, "").trim()
  if (provided !== secret) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }

  // ── Parse payload ──
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 })
  }

  const type = typeof body.type === "string" ? body.type : "UPDATE"
  // Supabase webhook nests the row under record/old_record; a manual call can
  // pass the fields at the top level.
  const record = (body.record as ShopRow) ?? null
  const oldRecord = (body.old_record as ShopRow) ?? null
  const flat: ShopRow = record ?? {
    slug: body.slug as string | undefined,
    state_code: body.state_code as string | undefined,
    city: body.city as string | undefined,
    shop_type: body.shop_type as string | undefined,
  }

  // Collect the affected paths from the new row AND the old row (so a shop that
  // moves city/state/type invalidates both its old and new index pages).
  const paths = new Set<string>([...pathsForShop(flat), ...(oldRecord ? pathsForShop(oldRecord) : [])])

  // Inserts and deletes change the shop COUNT, so the site-wide aggregates need
  // refreshing too: homepage stats, the directory shell, the states index and
  // the sitemap. A plain content edit (UPDATE) does not touch counts, so we skip
  // these to keep the blast radius — and the write count — as small as possible.
  if (type === "INSERT" || type === "DELETE") {
    paths.add("/")
    paths.add("/directory")
    paths.add("/states")
    paths.add("/sitemap.xml")
  }

  if (paths.size === 0) {
    return NextResponse.json({ ok: true, revalidated: [], note: "No identifiable shop in payload." })
  }

  for (const p of paths) revalidatePath(p)

  return NextResponse.json({ ok: true, type, revalidated: [...paths] })
}

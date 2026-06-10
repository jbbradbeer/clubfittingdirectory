import { NextResponse } from "next/server"
import { searchShops } from "@/lib/supabase/queries/shops"

/**
 * Type-ahead search endpoint for the homepage hero (and header).
 * GET /api/search?q=austin → { suggestions: [...] }
 * Public, read-only — only returns active listings.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get("q") ?? ""

  try {
    const suggestions = await searchShops(q, 6)
    return NextResponse.json(
      { suggestions },
      // s-maxage is what Vercel's edge cache keys off (max-age is browser-only),
      // so popular prefixes are served from the CDN instead of re-querying the DB.
      { headers: { "Cache-Control": "public, max-age=30, s-maxage=30, stale-while-revalidate=120" } },
    )
  } catch (e) {
    // Log so a broken search backend is visible in Vercel logs, but still
    // return an empty list (200) so the type-ahead UI degrades gracefully.
    console.error("[api/search] searchShops failed:", e)
    return NextResponse.json({ suggestions: [] }, { status: 200 })
  }
}

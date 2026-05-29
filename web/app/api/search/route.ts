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
      { headers: { "Cache-Control": "public, max-age=30, stale-while-revalidate=120" } },
    )
  } catch {
    return NextResponse.json({ suggestions: [] }, { status: 200 })
  }
}

import { renderOgImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og-image"
import { getAllStatesWithShops } from "@/lib/supabase/queries/shops"
import { logQueryError } from "@/lib/utils"

export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE
export const alt = "Golf club fitters by state"

/* Per-state social card: "Golf Club Fitters in {State}". */
export default async function Image({ params }: { params: Promise<{ state_code: string }> }) {
  const { state_code } = await params
  const code = state_code.toUpperCase()
  const states = await getAllStatesWithShops().catch((e) =>
    logQueryError("og state getAllStatesWithShops", e, []),
  )
  const stateName = states.find((s) => s.state_code === code)?.state ?? code

  return renderOgImage(`Golf Club Fitters in ${stateName}`, "Browse by State")
}

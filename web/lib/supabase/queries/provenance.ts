import { cache } from "react"
import { createStaticClient } from "@/lib/supabase/server"
import { logQueryError } from "@/lib/utils"

/**
 * Per-listing verification level, derived from the provenance ledger
 * (listing_facts). Reads the current, published facts for a shop and reports how
 * many are human/owner-verified vs sourced from the automated scrape. Powers the
 * "Owner-verified / Unverified" badge on listing pages.
 *
 * Cookie-free static client so listing pages stay statically generated.
 */
export type VerificationLevel = "owner_verified" | "partially_verified" | "unverified"

export interface ListingVerification {
  level: VerificationLevel
  verifiedCount: number
  totalCount: number
}

const UNVERIFIED: ListingVerification = { level: "unverified", verifiedCount: 0, totalCount: 0 }

export const getListingVerification = cache(
  async (listingId: string): Promise<ListingVerification> => {
    try {
      const supabase = createStaticClient()
      const { data, error } = await supabase
        .from("listing_current_facts")
        .select("verified_by")
        .eq("listing_id", listingId)
      if (error) throw error

      const total = data?.length ?? 0
      const verified = (data ?? []).filter((r) => r.verified_by === "human").length
      const level: VerificationLevel =
        total === 0 || verified === 0
          ? "unverified"
          : verified === total
            ? "owner_verified"
            : "partially_verified"

      return { level, verifiedCount: verified, totalCount: total }
    } catch (e) {
      return logQueryError("getListingVerification", e, UNVERIFIED)
    }
  },
)

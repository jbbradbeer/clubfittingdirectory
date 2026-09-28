import { createAdminClient } from "@/lib/supabase/admin"

/**
 * App-side writer for the Phase 1 provenance ledger (listing_facts).
 *
 * THE ONE CORRECT APPLY PATH for owner-approved data: upsert a fact row for
 * source 'owner', then call recompute_current_fact() — the SECURITY DEFINER
 * RPC that picks the winner (human first, then confidence, then precedence)
 * and promotes the winning value into the shops cache with proper casting.
 *
 * NEVER write pending/unreviewed values through this module: an owner fact is
 * human-verified and wins the winner-rule instantly. Callers must be admin
 * approve actions only. Never hand-edit fact-tracked shops columns either —
 * the next recompute would clobber them.
 */

/** From fact_sources seed (005): owner sits below admin (100/1.0), above scrapes. */
const OWNER_SOURCE = "owner"
const OWNER_CONFIDENCE = 0.9

export async function applyOwnerFact(
  listingId: string,
  attribute: string,
  value: unknown,
): Promise<void> {
  const supabase = createAdminClient()

  // An owner clearing a field arrives as null. listing_facts.value is NOT
  // NULL, so "no owner value" is represented by REMOVING the owner row; the
  // recompute then falls back to the next-best source (or clears the cache).
  // Upserting null here used to throw 23502 and jam the whole approval batch.
  if (value === null || value === undefined) {
    const { error: delErr } = await supabase
      .from("listing_facts")
      .delete()
      .eq("listing_id", listingId)
      .eq("attribute", attribute)
      .eq("source", OWNER_SOURCE)
    if (delErr) throw delErr
    const { error: rpcErr } = await supabase.rpc("recompute_current_fact", {
      p_listing_id: listingId,
      p_attribute: attribute,
    })
    if (rpcErr) throw rpcErr
    return
  }

  const { error: upsertErr } = await supabase
    .from("listing_facts")
    .upsert(
      {
        listing_id: listingId,
        attribute,
        source: OWNER_SOURCE,
        value,
        confidence: OWNER_CONFIDENCE,
        verified_by: "human",
        fetched_at: new Date().toISOString(),
      },
      { onConflict: "listing_id,attribute,source" },
    )
  if (upsertErr) throw upsertErr

  const { error: rpcErr } = await supabase.rpc("recompute_current_fact", {
    p_listing_id: listingId,
    p_attribute: attribute,
  })
  if (rpcErr) throw rpcErr
}

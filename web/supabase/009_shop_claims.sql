-- ============================================================
-- Club Fitting Directory — Claim-your-shop + paid Verified tier
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
--
-- 1. shop_claims: quarantined "I own this shop" requests from the public
--    claim form (/claim/[slug]) — the landing page outreach emails link to.
--    Mirrors shop_submissions (002): anon may INSERT only, never read.
-- 2. shops gains claim + paid-tier bookkeeping columns, and listing_tier
--    learns the value 'verified' (the $39/mo / $349/yr product).
--    Claimed ≠ Verified: claiming is free; the badge + placement is paid.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.shop_claims (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id        UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  claimant_name  TEXT NOT NULL,
  claimant_role  TEXT,            -- owner / manager / fitter etc (free text)
  claimant_email TEXT NOT NULL,
  claimant_phone TEXT,
  message        TEXT,
  source         TEXT DEFAULT 'listing_page'
                 CHECK (source IN ('listing_page','outreach')),
  review_status  TEXT NOT NULL DEFAULT 'new'
                 CHECK (review_status IN ('new','approved','rejected')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shop_claims_status ON public.shop_claims (review_status);
CREATE INDEX IF NOT EXISTS idx_shop_claims_shop   ON public.shop_claims (shop_id);

ALTER TABLE public.shop_claims ENABLE ROW LEVEL SECURITY;

-- Public claim form may INSERT; nobody public can read/update/delete.
CREATE POLICY "Public can claim a shop"
  ON public.shop_claims FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

REVOKE ALL ON public.shop_claims FROM anon, authenticated;
GRANT INSERT ON public.shop_claims TO anon, authenticated;

-- ── shops: claim + paid-tier bookkeeping ──────────────────────
ALTER TABLE public.shops
  ADD COLUMN IF NOT EXISTS claimed_at          TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS owner_email         TEXT,
  ADD COLUMN IF NOT EXISTS verified_at         TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verified_expires_at TIMESTAMPTZ;

-- listing_tier gains 'verified' (paid tier; display keys off this value).
ALTER TABLE public.shops DROP CONSTRAINT IF EXISTS shops_listing_tier_check;
ALTER TABLE public.shops ADD CONSTRAINT shops_listing_tier_check
  CHECK (listing_tier IN ('free','basic','featured','verified'));

-- Sanity: SELECT count(*) FROM public.shop_claims;  -- 0
-- To activate a paying shop:
--   UPDATE public.shops SET listing_tier='verified', is_featured=true,
--     verified_at=NOW() WHERE slug='<their-slug>';

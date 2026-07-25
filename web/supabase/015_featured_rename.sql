-- 015: Paid tier renamed Verified → Featured.
--
-- The Verified badge is now FREE — granted when an owner claims the listing
-- and the claim is approved (badge logic keys off shops.claimed_at).
-- What shops pay $49/mo | $499/yr for is the Featured tier: placement,
-- AI search optimization, newsletter rotation, priority updates.
--
-- Pre-flight (run first, eyeball the counts):
--   SELECT listing_tier, count(*), count(verified_at) AS with_verified_at
--   FROM public.shops GROUP BY listing_tier;
--
-- Legacy rows that carry listing_tier='featured' WITHOUT verified_at were
-- never paid activations (the value predates the paid tier) — reset them so
-- they don't suddenly rank as paying shops.
UPDATE public.shops
  SET listing_tier = 'free'
  WHERE listing_tier = 'featured' AND verified_at IS NULL;

-- Migrate paid rows (Stripe was not live at rename time, so this is expected
-- to touch zero or a handful of manually activated rows).
UPDATE public.shops
  SET listing_tier = 'featured'
  WHERE listing_tier = 'verified';

-- Tighten the CHECK back to three values ('verified' no longer written).
ALTER TABLE public.shops DROP CONSTRAINT IF EXISTS shops_listing_tier_check;
ALTER TABLE public.shops ADD CONSTRAINT shops_listing_tier_check
  CHECK (listing_tier IN ('free', 'basic', 'featured'));

-- Column names are legacy from the old paid-Verified naming; they now track
-- the Featured subscription. Renaming them would churn PostgREST caches and
-- every code path for zero user-visible gain, so document instead.
COMMENT ON COLUMN public.shops.verified_at         IS 'Featured subscription first-activated timestamp (legacy column name).';
COMMENT ON COLUMN public.shops.verified_expires_at IS 'Featured subscription expiry (legacy column name).';
COMMENT ON COLUMN public.shops.verified_plan       IS 'Featured subscription plan: monthly | annual (legacy column name).';

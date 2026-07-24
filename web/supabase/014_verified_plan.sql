-- 014: Verified plan (monthly vs annual)
--
-- Pricing moved from a single $349/yr product to two plans:
--   monthly  $49/mo   (4900 cents)
--   annual   $499/yr  (49900 cents)
--
-- The plan a shop is on drives:
--   * expiry math on renewal (+1 month vs +1 year)
--   * the admin MRR number (monthly*49 + annual*499/12)
--   * the checkout double-subscribe gate (an active monthly subscriber
--     must not be able to start a second subscription)
--
-- Run in the Supabase SQL editor BEFORE deploying the pricing update.

ALTER TABLE shops
  ADD COLUMN IF NOT EXISTS verified_plan TEXT
    CHECK (verified_plan IN ('monthly', 'annual'));

COMMENT ON COLUMN shops.verified_plan IS
  'Billing plan for the Verified tier: monthly ($49/mo) or annual ($499/yr). NULL = never verified.';

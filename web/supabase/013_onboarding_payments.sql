-- ─────────────────────────────────────────────────────────────
-- 013_onboarding_payments.sql
-- Self-serve onboarding: Stripe payment ledger + listing update requests.
--
-- Run this in the Supabase Dashboard → SQL Editor. Idempotent — safe to
-- re-run.
--
-- 1. shop_payments — one row per successful Stripe Checkout payment.
--    Written ONLY by the server (service role) from the Stripe webhook.
--    The UNIQUE stripe_session_id is the webhook idempotency key: a
--    replayed event hits the unique constraint and is ignored, so a shop
--    can never be double-extended by the same payment.
--
-- 2. listing_update_requests — the v1 "request changes to my listing"
--    queue. Anon INSERT only (same quarantine pattern as shop_claims);
--    the founder reviews in /admin and applies changes by hand. The
--    Phase 2 owner portal's structured owner_edit_batches will supersede
--    this — see tasks/phase-2-portal-plan.md. Nothing here ever writes
--    to listing_facts.
-- ─────────────────────────────────────────────────────────────

-- ── 1. Stripe payment ledger ──
CREATE TABLE IF NOT EXISTS public.shop_payments (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id               UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  stripe_session_id     TEXT NOT NULL UNIQUE,  -- idempotency key for webhook replays
  stripe_payment_intent TEXT,
  amount_total          INTEGER,               -- in cents (34900 = $349.00)
  customer_email        TEXT,
  paid_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shop_payments_shop_id
  ON public.shop_payments (shop_id);

-- RLS on, NO policies: only the service-role key (webhook + admin) can
-- read or write. The anon key sees nothing.
ALTER TABLE public.shop_payments ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.shop_payments FROM anon, authenticated;

-- ── 2. Listing update requests ──
CREATE TABLE IF NOT EXISTS public.listing_update_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id         UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  requester_name  TEXT NOT NULL,
  requester_email TEXT NOT NULL,
  -- Structured request fields, keyed: {hours, services, pricing, photos_url}
  payload         JSONB NOT NULL DEFAULT '{}'::jsonb,
  message         TEXT,
  review_status   TEXT NOT NULL DEFAULT 'new'
                  CHECK (review_status IN ('new', 'done', 'rejected')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_listing_update_requests_status
  ON public.listing_update_requests (review_status);

ALTER TABLE public.listing_update_requests ENABLE ROW LEVEL SECURITY;

-- Anon can INSERT (submit a request) but never read/update/delete —
-- identical quarantine to shop_claims (009).
DROP POLICY IF EXISTS "Public can request listing updates" ON public.listing_update_requests;
CREATE POLICY "Public can request listing updates"
  ON public.listing_update_requests
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

REVOKE ALL ON public.listing_update_requests FROM anon, authenticated;
GRANT INSERT ON public.listing_update_requests TO anon, authenticated;

-- ─────────────────────────────────────────────────────────────
-- VERIFY (run after; both should return rows with rowsecurity = true)
-- ─────────────────────────────────────────────────────────────
-- SELECT tablename, rowsecurity FROM pg_tables
--   WHERE tablename IN ('shop_payments', 'listing_update_requests');
-- SELECT polname, polcmd FROM pg_policy
--   WHERE polrelid = 'public.listing_update_requests'::regclass;

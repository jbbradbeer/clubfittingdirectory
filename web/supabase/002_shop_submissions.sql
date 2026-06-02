-- ============================================================
-- Club Fitting Directory — Shop Submissions
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
--
-- A QUARANTINED table for public "Submit a Shop" form entries. It is
-- deliberately separate from public.shops so untrusted input can never touch
-- live listings. The public (anon) role may INSERT only — it cannot read,
-- update, or delete. You review rows here and promote good ones to shops.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.shop_submissions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Submitted shop details (all optional except the essentials below)
  name          TEXT NOT NULL,
  shop_type     TEXT,
  city          TEXT NOT NULL,
  state_code    TEXT NOT NULL,
  website       TEXT,
  phone         TEXT,
  offers_fitting BOOLEAN DEFAULT FALSE,
  notes         TEXT,

  -- Who submitted it (optional, for follow-up)
  submitter_email TEXT,

  -- Review workflow
  review_status TEXT NOT NULL DEFAULT 'new'
                CHECK (review_status IN ('new', 'approved', 'rejected')),

  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shop_submissions_review_status
  ON public.shop_submissions (review_status);
CREATE INDEX IF NOT EXISTS idx_shop_submissions_created_at
  ON public.shop_submissions (created_at DESC);

-- ============================================================
-- ROW LEVEL SECURITY — insert-only for the public
-- ============================================================

ALTER TABLE public.shop_submissions ENABLE ROW LEVEL SECURITY;

-- The public form (anon key) may INSERT a submission...
CREATE POLICY "Public can submit a shop"
  ON public.shop_submissions FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- ...but there is intentionally NO SELECT/UPDATE/DELETE policy, so the anon key
-- cannot read back, edit, or delete submissions. Only the service_role (used in
-- the Supabase dashboard / server-side) can see and manage them.

-- Belt-and-suspenders: ensure the public roles only have INSERT at the grant
-- level too (RLS already blocks the rest, but this keeps grants explicit).
REVOKE ALL ON public.shop_submissions FROM anon, authenticated;
GRANT INSERT ON public.shop_submissions TO anon, authenticated;

-- ============================================================
-- Club Fitting Directory — Fitting Requests (the booking engine)
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
--
-- Stores every "Request a Fitting" lead a golfer submits from a shop page.
-- This is the core asset of the booking engine: each row is a measurable,
-- monetizable lead. Like shop_submissions, the public (anon) role may INSERT
-- only — it can never read, update, or delete. You (service_role / the /admin
-- dashboard) review and work these leads.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.fitting_requests (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Which shop the request is for. FK is nullable + ON DELETE SET NULL so a
  -- lead is never lost if a shop listing is later removed. The slug/name are
  -- snapshotted so the lead is still readable on its own.
  shop_id       UUID REFERENCES public.shops(id) ON DELETE SET NULL,
  shop_slug     TEXT,
  shop_name     TEXT,

  -- The golfer
  visitor_name   TEXT NOT NULL,
  visitor_email  TEXT NOT NULL,
  visitor_phone  TEXT,

  -- What they want
  fitting_type   TEXT CHECK (fitting_type IN (
                   'driver','irons','wedges','putter','full_bag','other')),
  preferred_date TEXT,   -- free-form preference (e.g. '2026-07-15'), not a hard booking
  preferred_time TEXT CHECK (preferred_time IN (
                   'morning','afternoon','evening','flexible') OR preferred_time IS NULL),
  notes          TEXT,

  -- Lead workflow (you advance this as you work the lead)
  status        TEXT NOT NULL DEFAULT 'new'
                CHECK (status IN ('new','contacted','booked','closed')),
  source        TEXT DEFAULT 'listing',

  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fitting_requests_status
  ON public.fitting_requests (status);
CREATE INDEX IF NOT EXISTS idx_fitting_requests_created_at
  ON public.fitting_requests (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fitting_requests_shop_id
  ON public.fitting_requests (shop_id);

-- ============================================================
-- ROW LEVEL SECURITY — insert-only for the public
-- (mirrors public.shop_submissions; see 002 for the full rationale)
-- ============================================================

ALTER TABLE public.fitting_requests ENABLE ROW LEVEL SECURITY;

-- The public form (anon key) may INSERT a request. INTENTIONALLY WITH CHECK
-- (true): anyone may request a fitting. There is deliberately NO
-- SELECT/UPDATE/DELETE policy, so the public cannot read back, edit, or delete
-- leads — only the service_role (server-side / dashboard) can.
CREATE POLICY "Public can request a fitting"
  ON public.fitting_requests FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Belt-and-suspenders at the grant level too.
REVOKE ALL ON public.fitting_requests FROM anon, authenticated;
GRANT INSERT ON public.fitting_requests TO anon, authenticated;

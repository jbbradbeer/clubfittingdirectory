-- ============================================================
-- Club Fitting Directory — Fitter Outreach Engine
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
--
-- Tracks the "Founding Verified Listing" email outreach pipeline.
-- One row per active shop; contact emails are DISCOVERED by
-- outreach/find_emails.py (the shops table has no email column and
-- is never modified by outreach). Emails are PII: both tables are
-- RLS-enabled with NO public policies — service_role only.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.outreach (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- One outreach row per shop, forever (unique). Cascade keeps the
  -- pipeline clean if a listing is ever deleted.
  shop_id       UUID NOT NULL UNIQUE REFERENCES public.shops(id) ON DELETE CASCADE,

  -- A = founder-known/featured (CSV import), B = priority states with a
  -- website and Clubfitter/Retailer type, C = everyone else.
  segment       TEXT CHECK (segment IN ('A','B','C')),

  -- Pipeline state. do_not_contact is TERMINAL — never re-queued.
  status        TEXT NOT NULL DEFAULT 'not_contacted'
                CHECK (status IN ('not_contacted','drafted','sent_1','sent_2','sent_3',
                                  'replied','call_booked','closed_won','closed_lost',
                                  'do_not_contact')),

  -- Contact info lives HERE, not on shops.
  contact_name  TEXT,
  contact_email TEXT,
  email_source  TEXT,   -- 'mailto' | 'regex' | 'obfuscated' | 'manual'
  email_search_status TEXT NOT NULL DEFAULT 'pending'
                CHECK (email_search_status IN ('pending','found','not_found','fetch_failed','no_website')),
  email_verified TEXT NOT NULL DEFAULT 'unverified'
                CHECK (email_verified IN ('unverified','valid','invalid','risky','unknown')),

  -- The one specific hook used in the personalized line.
  personalization_notes TEXT,

  -- Gmail draft id of the most recent touch (history in outreach_events).
  draft_gmail_id TEXT,

  touches       INT NOT NULL DEFAULT 0,          -- completed (sent) touches
  last_touch_at TIMESTAMPTZ,
  next_touch_at TIMESTAMPTZ,                     -- when the next follow-up is due

  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Append-only audit log: one row per draft, status change, reply, etc.
CREATE TABLE IF NOT EXISTS public.outreach_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outreach_id UUID NOT NULL REFERENCES public.outreach(id) ON DELETE CASCADE,
  event_type  TEXT NOT NULL
              CHECK (event_type IN ('seeded','email_discovered','segment_assigned',
                                    'verification_result','draft_created','send_detected',
                                    'reply_received','status_changed','note_added')),
  detail      JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_outreach_status  ON public.outreach (status);
CREATE INDEX IF NOT EXISTS idx_outreach_seg_status ON public.outreach (segment, status);
CREATE INDEX IF NOT EXISTS idx_outreach_next_touch ON public.outreach (next_touch_at)
  WHERE next_touch_at IS NOT NULL;
-- Chains share one email across locations: only ONE row may hold a given
-- address (scraper handles the conflict by leaving duplicates null + noted).
CREATE UNIQUE INDEX IF NOT EXISTS idx_outreach_email_unique
  ON public.outreach (LOWER(contact_email)) WHERE contact_email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_outreach_events_outreach ON public.outreach_events (outreach_id);

-- ============================================================
-- ROW LEVEL SECURITY — service_role only (emails are PII).
-- RLS on + NO policies = nothing readable/writable by the public.
-- ============================================================
ALTER TABLE public.outreach        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outreach_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.outreach, public.outreach_events FROM anon, authenticated;

-- ============================================================
-- SEED — one row per active shop (true funnel denominators from day
-- one; the email scraper is then a pure UPDATE). Idempotent.
-- ============================================================
INSERT INTO public.outreach (shop_id, email_search_status)
SELECT id, CASE WHEN website IS NULL OR website = '' THEN 'no_website' ELSE 'pending' END
FROM public.shops
WHERE status = 'active'
ON CONFLICT (shop_id) DO NOTHING;

-- Sanity: SELECT count(*) FROM public.outreach;  -- ≈ number of active shops

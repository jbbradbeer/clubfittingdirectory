-- ─────────────────────────────────────────────────────────────
-- 016_owner_portal.sql
-- Owner portal (Phase 2 core): pending owner edits queue.
--
-- Run this in the Supabase Dashboard → SQL Editor. Idempotent — safe to
-- re-run.
--
-- owner_edit_batches holds STRUCTURED edits submitted by claimed shop
-- owners through the magic-link portal (/portal). One 'new' batch per
-- shop at a time (submits replace in place). Nothing here ever writes to
-- listing_facts — owner facts are created ONLY inside the admin approve
-- action (see tasks/phase-2-portal-plan.md, the pending-facts-poisoning
-- rule): recompute_current_fact() has no "pending" concept, and a
-- human-verified owner row wins the winner-rule instantly, so pending
-- data must never reach the ledger.
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.owner_edit_batches (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id       UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  owner_email   TEXT NOT NULL,
  -- 'edit' = structured field changes; 'identity_request' = free-text ask
  -- to change locked fields (name/city/state) that needs human judgement.
  kind          TEXT NOT NULL DEFAULT 'edit'
                CHECK (kind IN ('edit', 'identity_request')),
  -- Proposed values keyed by attribute (whitelist enforced server-side).
  proposed      JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Snapshot of the live values at submit time — keeps the admin diff
  -- stable even if the live row drifts before review.
  previous      JSONB NOT NULL DEFAULT '{}'::jsonb,
  message       TEXT,
  review_status TEXT NOT NULL DEFAULT 'new'
                CHECK (review_status IN ('new', 'approved', 'rejected')),
  reviewed_at   TIMESTAMPTZ,
  review_note   TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_owner_edit_batches_status
  ON public.owner_edit_batches (review_status);
CREATE INDEX IF NOT EXISTS idx_owner_edit_batches_shop
  ON public.owner_edit_batches (shop_id);

-- RLS on, NO policies: service-role only. All reads/writes go through
-- guarded server actions (isShopOwner / isAdmin). The anon key sees nothing.
ALTER TABLE public.owner_edit_batches ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.owner_edit_batches FROM anon, authenticated;

-- ─────────────────────────────────────────────────────────────
-- VERIFY (run after; expect rowsecurity = true and zero policies)
-- ─────────────────────────────────────────────────────────────
-- SELECT tablename, rowsecurity FROM pg_tables
--   WHERE tablename = 'owner_edit_batches';
-- SELECT count(*) AS policy_count FROM pg_policy
--   WHERE polrelid = 'public.owner_edit_batches'::regclass;  -- expect 0

-- ─────────────────────────────────────────────────────────────
-- ROLLBACK (manual, if ever needed)
-- ─────────────────────────────────────────────────────────────
-- DROP TABLE IF EXISTS public.owner_edit_batches;

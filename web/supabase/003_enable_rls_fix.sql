-- ============================================================
-- Club Fitting Directory — RLS SECURITY FIX
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query → paste → Run)
--
-- WHY: Supabase flagged that Row-Level Security (RLS) is not enabled on a
-- public table, meaning anyone with the project URL could read/edit/delete data.
-- This script turns RLS ON and (re)creates the intended access policies.
--
-- SAFE TO RE-RUN: every statement is idempotent (uses IF EXISTS / IF NOT EXISTS),
-- so running it more than once causes no harm. It does not touch your data — only
-- the security rules around it.
-- ============================================================

-- ------------------------------------------------------------
-- 1. SHOPS TABLE — public may READ active shops, nothing else.
--    (Writes happen only via the service_role key, which bypasses RLS.)
-- ------------------------------------------------------------
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read active shops" ON public.shops;
CREATE POLICY "Public read active shops"
  ON public.shops FOR SELECT
  USING (status = 'active');

-- ------------------------------------------------------------
-- 2. SHOP_SUBMISSIONS TABLE — public may only INSERT (submit a shop).
--    No read/update/delete for the public; only service_role can manage.
--    (Skipped automatically if this table doesn't exist yet.)
-- ------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'shop_submissions'
  ) THEN
    EXECUTE 'ALTER TABLE public.shop_submissions ENABLE ROW LEVEL SECURITY';

    EXECUTE 'DROP POLICY IF EXISTS "Public can submit a shop" ON public.shop_submissions';
    EXECUTE 'CREATE POLICY "Public can submit a shop"
               ON public.shop_submissions FOR INSERT
               TO anon, authenticated
               WITH CHECK (true)';

    EXECUTE 'REVOKE ALL ON public.shop_submissions FROM anon, authenticated';
    EXECUTE 'GRANT INSERT ON public.shop_submissions TO anon, authenticated';
  END IF;
END
$$;

-- ============================================================
-- VERIFY — after running, this should show rowsecurity = true for each table.
-- ============================================================
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('shops', 'shop_submissions')
ORDER BY tablename;

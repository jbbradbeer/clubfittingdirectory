-- ============================================================
-- 023 — Drop the old Near Me search function
-- ============================================================
-- search_shops_near (001/004) was replaced by nearby_shop_ids (022) and the
-- app stopped calling it in PR #109 (deployed 2026-11-11). Nothing else uses it.
--
-- Run in: Supabase Dashboard → SQL Editor. Safe to re-run.
-- ============================================================

DROP FUNCTION IF EXISTS public.search_shops_near(FLOAT, FLOAT, FLOAT, TEXT, TEXT, BOOLEAN, INT);

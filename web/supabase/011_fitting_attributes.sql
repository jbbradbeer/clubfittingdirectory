-- ============================================================
-- 011 — Fitting attributes: price range columns + ownership vocabulary
-- Run in Supabase → SQL Editor.
--
-- WHAT THIS DOES (plain English):
--   1. Adds two columns to shops for a fitting price range in whole US dollars
--      (fitting_price_min / fitting_price_max). Both nullable — most shops
--      won't have a price until we crawl their site or the owner tells us.
--      "From $150" renders when only min is known; "$150–$400" when both are.
--   2. Locks ownership_type (added empty in 005) to an agreed vocabulary and
--      adds the value 'national_chain' (fitting-first chains like Club
--      Champion) alongside independent / big_box / oem / unknown.
--   3. Registers the two price attributes in fact_attributes so the provenance
--      ledger (listing_facts + recompute_current_fact) can manage them like
--      every other tracked field.
--   Only ADDS things; existing shop data is untouched. Safe on the live DB.
--
-- Idempotent: safe to run more than once.
-- ============================================================

alter table public.shops add column if not exists fitting_price_min integer;
alter table public.shops add column if not exists fitting_price_max integer;

-- Sanity band: fittings run ~$40 (single club, minimum) to ~$10,000 ceiling
-- (guards against scraper garbage like phone numbers landing in a price).
alter table public.shops drop constraint if exists shops_fitting_price_check;
alter table public.shops add constraint shops_fitting_price_check check (
  (fitting_price_min is null or fitting_price_min between 0 and 10000)
  and (fitting_price_max is null or fitting_price_max between 0 and 10000)
  and (fitting_price_min is null or fitting_price_max is null
       or fitting_price_min <= fitting_price_max)
);

-- ownership_type had no CHECK (005 documented the intended values in a comment
-- only). Enforce the vocabulary now, with national_chain added.
alter table public.shops drop constraint if exists shops_ownership_type_check;
alter table public.shops add constraint shops_ownership_type_check check (
  ownership_type is null
  or ownership_type in ('independent','big_box','national_chain','oem','unknown')
);

-- Register the price attributes in the provenance ledger. conflict_delta 25:
-- two sources must disagree by more than $25 to count as a real conflict.
insert into public.fact_attributes (attribute, label, shops_column, value_kind, conflict_delta) values
  ('fitting_price_min', 'Fitting price (from)', 'fitting_price_min', 'number', 25),
  ('fitting_price_max', 'Fitting price (to)',   'fitting_price_max', 'number', 25)
on conflict (attribute) do nothing;

-- ============================================================
-- VERIFY (run these after; expected results in comments)
--   select count(*) from public.fact_attributes;                       -- 12
--   select column_name from information_schema.columns
--     where table_name = 'shops' and column_name like 'fitting_price%'; -- 2 rows
--   select conname from pg_constraint
--     where conname in ('shops_fitting_price_check','shops_ownership_type_check'); -- 2 rows
-- ============================================================

-- ============================================================
-- ROLLBACK (only if you need to undo this migration):
--   delete from public.fact_attributes
--     where attribute in ('fitting_price_min','fitting_price_max');
--   alter table public.shops drop constraint if exists shops_ownership_type_check;
--   alter table public.shops drop constraint if exists shops_fitting_price_check;
--   alter table public.shops
--     drop column if exists fitting_price_min,
--     drop column if exists fitting_price_max;
-- ============================================================

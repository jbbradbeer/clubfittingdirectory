-- ============================================================
-- 017 — Listing-depth attributes (AI-search legibility, Phase 3a)
--
-- Adds the differentiating fields that make a listing page worth citing
-- in an AI answer: when the shop was founded, fitter credentials, bay
-- count, mobile fitting, in-house club building, and the Google place_id.
-- Each is registered in fact_attributes so the provenance ledger
-- (listing_facts -> recompute_current_fact) governs every value — the
-- enrichment crawler writes facts with a source + confidence, never the
-- shops columns directly.
--
-- HOW TO APPLY: paste this whole file into the Supabase SQL editor
-- (supabase.com -> project -> SQL Editor) and click Run. Safe to re-run.
-- ============================================================

-- ── New shops columns ──
alter table public.shops add column if not exists year_established integer;
alter table public.shops add column if not exists credentials      text[];
alter table public.shops add column if not exists bay_count        integer;
alter table public.shops add column if not exists mobile_fitting   boolean;
alter table public.shops add column if not exists in_house_build   boolean;
alter table public.shops add column if not exists google_place_id  text;

-- Sanity bounds: golf retail doesn't predate the 1890s boom, and a "bay
-- count" beyond two digits is a scrape error, not a fitting studio.
alter table public.shops drop constraint if exists shops_year_established_check;
alter table public.shops add constraint shops_year_established_check check (
  year_established is null or year_established between 1850 and 2100
);
alter table public.shops drop constraint if exists shops_bay_count_check;
alter table public.shops add constraint shops_bay_count_check check (
  bay_count is null or bay_count between 1 and 99
);

-- ── Register in the provenance ledger ──
-- year_established conflict_delta 0: any two differing years is a real
-- conflict. bay_count delta 1: off-by-one between sources is noise.
insert into public.fact_attributes (attribute, label, shops_column, value_kind, conflict_delta) values
  ('year_established', 'Year established',      'year_established', 'number',     0),
  ('credentials',      'Credentials',           'credentials',      'text_array', null),
  ('bay_count',        'Fitting bays',          'bay_count',        'number',     1),
  ('mobile_fitting',   'Mobile fitting',        'mobile_fitting',   'boolean',    null),
  ('in_house_build',   'In-house club building','in_house_build',   'boolean',    null),
  ('google_place_id',  'Google place ID',       'google_place_id',  'text',       null)
on conflict (attribute) do nothing;

-- ============================================================
-- VERIFY (run after; expected results in comments)
--   select count(*) from public.fact_attributes;                         -- 18
--   select column_name from information_schema.columns
--     where table_name = 'shops'
--       and column_name in ('year_established','credentials','bay_count',
--                           'mobile_fitting','in_house_build','google_place_id'); -- 6 rows
-- ============================================================

-- ============================================================
-- ROLLBACK (only if you need to undo this migration):
--   delete from public.fact_attributes where attribute in
--     ('year_established','credentials','bay_count','mobile_fitting',
--      'in_house_build','google_place_id');
--   alter table public.shops
--     drop column if exists year_established,
--     drop column if exists credentials,
--     drop column if exists bay_count,
--     drop column if exists mobile_fitting,
--     drop column if exists in_house_build,
--     drop column if exists google_place_id;
-- ============================================================

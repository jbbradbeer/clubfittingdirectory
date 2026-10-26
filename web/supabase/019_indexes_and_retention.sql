-- ============================================================
-- 019 — Query indexes + crawler_hits retention (audit 2026-09)
--
-- WHY:
--   * /directory search runs `name ILIKE '%term%' OR city ILIKE '%term%'`
--     from the browser on every keystroke, twice (count + data). pg_trgm was
--     enabled in 001 but no trigram index was ever created, so each keystroke
--     is two full sequential scans. A GIN trigram index makes them index scans.
--   * The state / category / city pages all filter `status = 'active' AND
--     <column> = …`. Composite indexes leading with status serve those directly.
--   * idx_shops_slug duplicates the UNIQUE(slug) index (extra write cost on
--     every update — and 010's webhook makes updates frequent). idx_shops_status
--     is near-useless (almost every row is 'active'). Both dropped.
--   * crawler_hits has no retention. The daily cron (web/app/api/cron/daily)
--     prunes rows older than 90 days; if pg_cron is available on this project
--     the job below does the same inside the database as a belt-and-braces.
--
-- HOW TO APPLY: paste into the Supabase SQL editor and Run. Safe to re-run.
-- ============================================================

create extension if not exists pg_trgm;

-- Trigram indexes for the directory's substring search.
create index if not exists shops_name_trgm_idx
  on public.shops using gin (name gin_trgm_ops);
create index if not exists shops_city_trgm_idx
  on public.shops using gin (city gin_trgm_ops);

-- Composite indexes for the hot page queries (status always leads).
create index if not exists shops_status_state_code_idx
  on public.shops (status, state_code);
create index if not exists shops_status_shop_type_idx
  on public.shops (status, shop_type);
create index if not exists shops_status_city_idx
  on public.shops (status, city);

-- Owner-portal lookup and admin "claimed shops" count.
create index if not exists shops_owner_email_lower_idx
  on public.shops (lower(owner_email));
create index if not exists shops_claimed_at_idx
  on public.shops (claimed_at) where claimed_at is not null;

-- Featured expiry sweep (daily cron).
create index if not exists shops_featured_expiry_idx
  on public.shops (verified_expires_at) where listing_tier = 'featured';

-- Redundant / low-value indexes from 001.
drop index if exists public.idx_shops_slug;    -- duplicate of the UNIQUE(slug) index
drop index if exists public.idx_shops_status;  -- ~all rows are 'active'

-- crawler_hits retention inside the DB (only if pg_cron is installed on this
-- project; the app-side daily cron does the same regardless).
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule('crawler_hits_retention')
      where exists (select 1 from cron.job where jobname = 'crawler_hits_retention');
    perform cron.schedule(
      'crawler_hits_retention',
      '15 3 * * *',
      $job$ delete from public.crawler_hits where ts < now() - interval '90 days' $job$
    );
  end if;
end $$;

-- ============================================================
-- VERIFY:
--   select indexname from pg_indexes where tablename = 'shops' order by 1;
--   explain analyze select id from public.shops
--     where status = 'active' and name ilike '%champion%';   -- Bitmap Index Scan on shops_name_trgm_idx
-- ROLLBACK:
--   drop index if exists shops_name_trgm_idx, shops_city_trgm_idx,
--     shops_status_state_code_idx, shops_status_shop_type_idx, shops_status_city_idx,
--     shops_owner_email_lower_idx, shops_claimed_at_idx, shops_featured_expiry_idx;
-- ============================================================

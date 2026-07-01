-- ============================================================
-- 006 — Provenance backfill + promotion + views (Phase 1, chunk 2)
-- Run in Supabase → SQL Editor, AFTER 005.
--
-- WHAT THIS DOES (plain English):
--   1. Teaches the DB how to pick the WINNING value per field and copy it into
--      shops (the promotion function).
--   2. Seeds the ledger from your current shop data — every existing value is
--      recorded as coming from the Google/Outscraper scrape. This writes ONLY to
--      the new ledger; it does NOT touch shops (so it won't trigger the
--      revalidation webhook or change anything on the live site).
--   3. Builds three views: the current winners, the public-safe published subset,
--      and the CONFLICTS view that flags where two sources disagree.
--
-- Idempotent: safe to run more than once.
-- ============================================================

-- ── Promotion: choose the winning fact for one (listing, attribute) and copy
--    its value into the matching shops column. SECURITY DEFINER so the pipeline
--    can write to shops; EXECUTE is revoked from public so it can't be abused. ──
create or replace function public.recompute_current_fact(p_listing_id uuid, p_attribute text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_winner uuid;
  v_value  jsonb;
  v_col    text;
  v_kind   text;
begin
  -- Winner rule: human-verified first, then confidence, then source
  -- precedence, then most recently fetched.
  select f.id, f.value
    into v_winner, v_value
  from public.listing_facts f
  join public.fact_sources s on s.source = f.source
  where f.listing_id = p_listing_id
    and f.attribute  = p_attribute
  order by (f.verified_by = 'human') desc,
           f.confidence desc,
           s.precedence desc,
           f.fetched_at desc
  limit 1;

  update public.listing_facts
     set is_current = (id = v_winner)
   where listing_id = p_listing_id
     and attribute  = p_attribute;

  if v_winner is null then
    return;
  end if;

  select shops_column, value_kind into v_col, v_kind
  from public.fact_attributes where attribute = p_attribute;
  if v_col is null then
    return;
  end if;

  -- Promote the winning value into the shops materialized cache, cast to the
  -- column's real type.
  if v_kind = 'text' then
    execute format('update public.shops set %I = $1 where id = $2', v_col)
      using (v_value #>> '{}'), p_listing_id;
  elsif v_kind = 'number' then
    execute format('update public.shops set %I = $1 where id = $2', v_col)
      using (v_value #>> '{}')::numeric, p_listing_id;
  elsif v_kind = 'boolean' then
    execute format('update public.shops set %I = $1 where id = $2', v_col)
      using (v_value #>> '{}')::boolean, p_listing_id;
  elsif v_kind = 'text_array' then
    execute format('update public.shops set %I = $1 where id = $2', v_col)
      using array(select jsonb_array_elements_text(v_value)), p_listing_id;
  elsif v_kind = 'jsonb' then
    execute format('update public.shops set %I = $1 where id = $2', v_col)
      using v_value, p_listing_id;
  end if;
end;
$$;

revoke all on function public.recompute_current_fact(uuid, text) from public, anon, authenticated;
grant execute on function public.recompute_current_fact(uuid, text) to service_role;

-- ── Backfill the ledger from current shop values (source = scrape:google).
--    Writes ONLY to listing_facts. is_current=true because it is the only
--    source so far. ON CONFLICT DO NOTHING makes re-runs safe. ──
insert into public.listing_facts (listing_id, attribute, value, source, confidence, verified_by, is_current, fetched_at)
select id, 'phone', to_jsonb(phone), 'scrape:google', 0.600, 'system', true, coalesce(updated_at, created_at, now())
from public.shops where phone is not null
on conflict (listing_id, attribute, source) do nothing;

insert into public.listing_facts (listing_id, attribute, value, source, confidence, verified_by, is_current, fetched_at)
select id, 'website', to_jsonb(website), 'scrape:google', 0.600, 'system', true, coalesce(updated_at, created_at, now())
from public.shops where website is not null
on conflict (listing_id, attribute, source) do nothing;

insert into public.listing_facts (listing_id, attribute, value, source, confidence, verified_by, is_current, fetched_at)
select id, 'street', to_jsonb(street), 'scrape:google', 0.600, 'system', true, coalesce(updated_at, created_at, now())
from public.shops where street is not null
on conflict (listing_id, attribute, source) do nothing;

insert into public.listing_facts (listing_id, attribute, value, source, confidence, verified_by, is_current, fetched_at)
select id, 'rating', to_jsonb(rating), 'scrape:google', 0.600, 'system', true, coalesce(updated_at, created_at, now())
from public.shops where rating is not null
on conflict (listing_id, attribute, source) do nothing;

insert into public.listing_facts (listing_id, attribute, value, source, confidence, verified_by, is_current, fetched_at)
select id, 'working_hours', working_hours, 'scrape:google', 0.600, 'system', true, coalesce(updated_at, created_at, now())
from public.shops where working_hours is not null
on conflict (listing_id, attribute, source) do nothing;

insert into public.listing_facts (listing_id, attribute, value, source, confidence, verified_by, is_current, fetched_at)
select id, 'services_array', to_jsonb(services_array), 'scrape:google', 0.600, 'system', true, coalesce(updated_at, created_at, now())
from public.shops where services_array is not null and array_length(services_array, 1) >= 1
on conflict (listing_id, attribute, source) do nothing;

insert into public.listing_facts (listing_id, attribute, value, source, confidence, verified_by, is_current, fetched_at)
select id, 'offers_fitting', to_jsonb(offers_fitting), 'scrape:google', 0.600, 'system', true, coalesce(updated_at, created_at, now())
from public.shops where offers_fitting is not null
on conflict (listing_id, attribute, source) do nothing;

-- brands_fitted / launch_monitors / ownership_type have no source data yet —
-- they stay empty until owner/OEM/scrape pipelines populate them.

-- ============================================================
-- VIEWS  (security_invoker = true → each view respects the RLS of whoever
--         queries it, so anon sees only published facts through them)
-- ============================================================

-- The winning fact per attribute.
create or replace view public.listing_current_facts
with (security_invoker = true) as
select f.listing_id, f.attribute, f.value, f.source, f.source_url,
       f.confidence, f.verified_by, f.fetched_at
from public.listing_facts f
where f.is_current;

-- Public-safe subset: current AND confident enough to surface.
create or replace view public.listing_facts_published
with (security_invoker = true) as
select listing_id, attribute, value, source, confidence, verified_by, fetched_at
from public.listing_facts
where is_current and confidence >= 0.5;

-- CONFLICTS: any (listing, attribute) where sources disagree beyond threshold.
-- Text attributes: any differing value is a conflict. Number attributes: only
-- if the spread exceeds the attribute's conflict_delta (e.g. rating > 0.3).
create or replace view public.listing_fact_conflicts
with (security_invoker = true) as
with cand as (
  select f.listing_id, f.attribute, f.value, f.source, f.confidence,
         a.value_kind, a.conflict_delta,
         (f.value #>> '{}') as vtext
  from public.listing_facts f
  join public.fact_attributes a on a.attribute = f.attribute
  where f.confidence >= 0.4              -- ignore very-low-confidence noise
),
agg as (
  select listing_id, attribute,
         min(value_kind)       as value_kind,
         min(conflict_delta)   as conflict_delta,
         count(distinct vtext) as distinct_values,
         max(vtext::numeric) filter (where value_kind = 'number') as max_num,
         min(vtext::numeric) filter (where value_kind = 'number') as min_num,
         jsonb_agg(distinct jsonb_build_object('source', source, 'value', value, 'confidence', confidence)) as candidates
  from cand
  group by listing_id, attribute
)
select listing_id, attribute, distinct_values, candidates
from agg
where (value_kind <> 'number' and distinct_values > 1)
   or (value_kind =  'number' and coalesce(max_num - min_num, 0) > coalesce(conflict_delta, 0));

-- Grants: winners + published are public-readable (RLS still filters via
-- security_invoker); the conflicts view is internal (admin / service-role only).
grant select on public.listing_current_facts   to anon, authenticated;
grant select on public.listing_facts_published  to anon, authenticated;
revoke all   on public.listing_fact_conflicts   from anon, authenticated;

-- ============================================================
-- VERIFY (run after; tell me the results)
--   -- total facts seeded (expect a few thousand; roughly sum of non-null fields):
--   select count(*) from public.listing_facts;
--   -- breakdown by attribute:
--   select attribute, count(*) from public.listing_facts group by attribute order by 1;
--   -- conflicts should be 0 for now (only one source exists):
--   select count(*) from public.listing_fact_conflicts;
--   -- see the full provenance picture for one shop:
--   select attribute, value, source, confidence, verified_by
--   from public.listing_current_facts
--   where listing_id = (select id from public.shops limit 1)
--   order by attribute;
-- ============================================================

-- ============================================================
-- ROLLBACK (undo this migration only; leaves 005 intact):
--   drop view if exists public.listing_fact_conflicts;
--   drop view if exists public.listing_facts_published;
--   drop view if exists public.listing_current_facts;
--   drop function if exists public.recompute_current_fact(uuid, text);
--   delete from public.listing_facts where source = 'scrape:google';
-- ============================================================

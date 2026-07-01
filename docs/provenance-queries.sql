-- ============================================================
-- Provenance model — example queries + live conflict demo
-- Phase 1 deliverable: prove every field can answer
--   "where did this come from, how sure are we, does anything disagree?"
-- Run any block in Supabase → SQL Editor.
-- ============================================================

-- ── Q1. WHERE DID THIS COME FROM? — the current winning fact per field,
--        with its source, for one shop. ──
select attribute, value, source, confidence, verified_by, fetched_at
from public.listing_current_facts
where listing_id = (select id from public.shops order by name limit 1)
order by attribute;

-- ── Q2. HOW SURE ARE WE? — published (>=0.5) vs unverified, per field. ──
select attribute, value, confidence,
       case when confidence >= 0.5 then 'published' else 'unverified' end as status
from public.listing_current_facts
where listing_id = (select id from public.shops order by name limit 1)
order by confidence desc;

-- ── Q3. DOES ANYTHING DISAGREE? — every field where sources conflict beyond
--        threshold, across the whole directory. ──
select * from public.listing_fact_conflicts;

-- ── Q4. FULL HISTORY for one field — every source's answer, winner first. ──
select attribute, value, source, confidence, verified_by, is_current, fetched_at
from public.listing_facts
where listing_id = (select id from public.shops order by name limit 1)
  and attribute = 'rating'
order by is_current desc, confidence desc;


-- ============================================================
-- LIVE CONFLICT DEMO — 3 steps. Safe: only touches the ledger, never `shops`,
-- and step 3 restores everything. (is_current stays false, so no promotion.)
-- ============================================================

-- STEP 1 — inject a fake "owner says the rating is different" fact for one shop.
insert into public.listing_facts
  (listing_id, attribute, value, source, confidence, verified_by, is_current)
select id, 'rating', to_jsonb(round((rating - 1.2)::numeric, 1)),
       'owner', 0.9, 'human', false
from public.shops
where rating is not null and rating >= 3
order by name
limit 1;

-- STEP 2 — watch the conflicts view light up (you should get 1 row: the scrape
--          rating vs the owner rating, both listed under "candidates").
select c.*
from public.listing_fact_conflicts c
where c.attribute = 'rating'
  and c.listing_id in (
    select listing_id from public.listing_facts
    where source = 'owner' and attribute = 'rating'
  );

-- STEP 3 — clean up. Removes the demo fact; conflicts view returns to 0.
delete from public.listing_facts
where source = 'owner' and attribute = 'rating';

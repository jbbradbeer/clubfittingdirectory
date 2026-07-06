-- ============================================================
-- 012 — Ownership classification backfill (independent / chain / big box / OEM)
-- Run in Supabase → SQL Editor. Run 011 first.
--
-- WHAT THIS DOES (plain English):
--   Labels every active shop with an ownership_type, written through the
--   provenance ledger (listing_facts + recompute_current_fact) rather than a
--   direct UPDATE — so a future owner claim (confidence 0.9) or admin edit
--   (1.0) automatically outranks and replaces these system guesses.
--
--   The rules were tuned against the LIVE data on 2026-07-06. This directory
--   was deliberately built from independents: it contains ZERO Club Champion /
--   GOLFTEC / True Spec / PGA TOUR Superstore / Golf Galaxy locations (their
--   patterns are still included below so future imports classify correctly).
--   What it does contain: 23 PXG studios + a handful of Titleist / TaylorMade /
--   Mizuno / Ping / Callaway brand facilities (→ oem), Dick's House of Sport,
--   Golfers' Warehouse and Roger Dunn (→ big_box), GOLF USA + Golf Etc
--   franchises, 2nd Swing outlets and Tour Van studios (→ national_chain).
--   Everything unmatched is labeled independent — the founder-approved default
--   and this directory's actual character. Note: shops.is_chain is FALSE for
--   every live row (never populated), so name patterns are the only signal.
--
--   Patterns anchor to the START of the name ('pxg %') wherever possible to
--   avoid substring accidents (a '%ping%' match would catch "GalloPING Hill
--   Golf Course"; '%carl%' would catch "CARLsbad Golf Center").
--
-- The shops_revalidate_webhook trigger (010) fires once PER ROW; the promotion
-- step updates ~1,250 rows, so the trigger is disabled around this migration
-- (010's documented bulk procedure). Trigger one manual revalidation after.
--
-- Idempotent: safe to run more than once (facts upsert; recompute is pure).
-- ============================================================

alter table public.shops disable trigger shops_revalidate_webhook;

-- ── Tier 1: OEM brand-owned fitting facilities (confidence 0.70) ──
insert into public.listing_facts (listing_id, attribute, value, source, confidence, verified_by)
select id, 'ownership_type', to_jsonb('oem'::text), 'heuristic', 0.700, 'system'
from public.shops
where lower(name) like 'pxg %' or lower(name) = 'pxg'
   or lower(name) like 'titleist %'
   or lower(name) like 'taylormade %'
   or lower(name) like 'mizuno foundry%'
   or lower(name) like 'ping inc%'
   or lower(name) like 'callaway golf co%'
   or lower(name) like 'cobra puma%'
   or lower(name) like 'club fitting by titleist%'
on conflict (listing_id, attribute, source) do update
  set value = excluded.value, confidence = excluded.confidence, fetched_at = now();

-- ── Tier 2: national fitting-first chains (0.70) ──
-- (Club Champion / GOLFTEC / True Spec / Cool Clubs / Hot Stix: zero rows
-- today; patterns kept so future imports self-classify.)
insert into public.listing_facts (listing_id, attribute, value, source, confidence, verified_by)
select s.id, 'ownership_type', to_jsonb('national_chain'::text), 'heuristic', 0.700, 'system'
from public.shops s
where (lower(s.name) like 'club champion%'
   or lower(s.name) like 'golftec%'
   or lower(s.name) like 'true spec%'
   or lower(s.name) like 'cool clubs%'
   or lower(s.name) like 'hot stix%'
   or lower(s.name) like '%2nd swing%'
   or lower(s.name) like 'tour van%'
   or lower(s.name) like 'golf usa%'      -- franchise stores named "GOLF USA <city>"
   or lower(s.name) like 'golf etc%')
  and not exists (select 1 from public.listing_facts f
                  where f.listing_id = s.id and f.attribute = 'ownership_type'
                    and f.source = 'heuristic')
on conflict (listing_id, attribute, source) do update
  set value = excluded.value, confidence = excluded.confidence, fetched_at = now();

-- ── Tier 3: big-box sporting/golf retail (0.70) ──
insert into public.listing_facts (listing_id, attribute, value, source, confidence, verified_by)
select s.id, 'ownership_type', to_jsonb('big_box'::text), 'heuristic', 0.700, 'system'
from public.shops s
where (lower(s.name) like 'dick''s house of sport%'
   or lower(s.name) like 'dick''s sporting%'
   or lower(s.name) like 'golfers'' warehouse%'
   or lower(s.name) like 'roger dunn%'
   or lower(s.name) like 'pga tour superstore%'
   or lower(s.name) like 'golf galaxy%'
   or lower(s.name) like 'edwin watts%'
   or lower(s.name) like 'worldwide golf%')
  and not exists (select 1 from public.listing_facts f
                  where f.listing_id = s.id and f.attribute = 'ownership_type'
                    and f.source = 'heuristic')
on conflict (listing_id, attribute, source) do update
  set value = excluded.value, confidence = excluded.confidence, fetched_at = now();

-- ── Tier 4: everything else = independent (0.55, founder-approved default) ──
-- 0.55 keeps these above the 0.5 publish threshold (so the provenance views
-- agree with the site) but below the 0.70 curated matches and far below any
-- owner (0.9) or admin (1.0) correction.
insert into public.listing_facts (listing_id, attribute, value, source, confidence, verified_by)
select s.id, 'ownership_type', to_jsonb('independent'::text), 'heuristic', 0.550, 'system'
from public.shops s
where not exists (select 1 from public.listing_facts f
                  where f.listing_id = s.id and f.attribute = 'ownership_type'
                    and f.source = 'heuristic')
on conflict (listing_id, attribute, source) do update
  set value = excluded.value, confidence = excluded.confidence, fetched_at = now();

-- ── Promote: pick the winner per shop and copy into shops.ownership_type ──
select public.recompute_current_fact(t.listing_id, 'ownership_type')
from (select distinct listing_id from public.listing_facts
      where attribute = 'ownership_type') t;

alter table public.shops enable trigger shops_revalidate_webhook;

-- ============================================================
-- VERIFY (run these after; expected shape in comments)
--   select ownership_type, count(*) from public.shops group by 1 order by 2 desc;
--     -- independent ≈ 1,200+; oem ≈ 30; big_box ≈ 15; national_chain ≈ 20; null = inactive rows only
--   select name, city, state_code from public.shops
--     where ownership_type in ('oem','big_box','national_chain') order by ownership_type, name;
--     -- eyeball: every row here should genuinely be a brand/chain/big-box location
--   select name from public.shops where ownership_type = 'independent'
--     order by random() limit 10;  -- eyeball: no obvious chains hiding here
--   select tgenabled from pg_trigger where tgname = 'shops_revalidate_webhook'; -- 'O' (enabled)
-- ============================================================

-- ============================================================
-- ROLLBACK (only if you need to undo this migration):
--   alter table public.shops disable trigger shops_revalidate_webhook;
--   delete from public.listing_facts
--     where attribute = 'ownership_type' and source = 'heuristic';
--   update public.shops set ownership_type = null;
--   alter table public.shops enable trigger shops_revalidate_webhook;
-- ============================================================

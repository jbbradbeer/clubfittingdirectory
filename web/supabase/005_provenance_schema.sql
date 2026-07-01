-- ============================================================
-- 005 — Provenance & confidence data model (Phase 1, chunk 1: SCHEMA)
-- Run in Supabase → SQL Editor.
--
-- WHAT THIS DOES (plain English):
--   Sets up the tables that let every shop field remember WHERE its value came
--   from, HOW SURE we are (confidence 0–1), and keeps every source's answer so
--   we can later see if two sources DISAGREE. This migration only ADDS things —
--   it never changes or deletes existing shop data, so it is safe on the live DB.
--
-- Idempotent: safe to run more than once.
-- ============================================================

-- ── New "current best" columns on shops (the materialized cache) ──
-- These three attributes have no flat column yet. Adding them (nullable /
-- defaulted) is invisible to existing queries, which select explicit columns.
alter table public.shops add column if not exists brands_fitted   text[] default '{}';
alter table public.shops add column if not exists launch_monitors text[] default '{}';
alter table public.shops add column if not exists ownership_type  text;  -- independent | oem | big_box | unknown

-- ── Source registry: precedence (higher wins ties) + default confidence ──
create table if not exists public.fact_sources (
  source          text primary key,
  label           text not null,
  precedence      int  not null,
  base_confidence numeric(4,3) not null check (base_confidence between 0 and 1)
);

insert into public.fact_sources (source, label, precedence, base_confidence) values
  ('admin',         'Admin / manual verification', 100, 1.000),
  ('owner',         'Verified shop owner claim',     90, 0.900),
  ('oem',           'OEM authorized-fitter list',    80, 0.800),
  ('geocoder',      'Address geocoder',              70, 0.750),
  ('scrape:google', 'Google / Outscraper scrape',    50, 0.600),
  ('scrape:web',    'Shop website scrape',           45, 0.550),
  ('heuristic',     'Heuristic / inferred',          20, 0.300)
on conflict (source) do nothing;

-- ── Attribute registry: which attributes are tracked, the shops column each
--    promotes into, its value kind, and the numeric "conflict delta" (how far
--    two numbers must differ to count as a real disagreement; null = exact). ──
create table if not exists public.fact_attributes (
  attribute      text primary key,
  label          text not null,
  shops_column   text not null,
  value_kind     text not null check (value_kind in ('text','number','boolean','text_array','jsonb')),
  conflict_delta numeric
);

insert into public.fact_attributes (attribute, label, shops_column, value_kind, conflict_delta) values
  ('phone',           'Phone',           'phone',           'text',       null),
  ('website',         'Website',         'website',         'text',       null),
  ('street',          'Street address',  'street',          'text',       null),
  ('rating',          'Rating',          'rating',          'number',     0.3),
  ('working_hours',   'Hours',           'working_hours',   'jsonb',      null),
  ('services_array',  'Services',        'services_array',  'text_array', null),
  ('offers_fitting',  'Offers fitting',  'offers_fitting',  'boolean',    null),
  ('brands_fitted',   'Brands fitted',   'brands_fitted',   'text_array', null),
  ('launch_monitors', 'Launch monitors', 'launch_monitors', 'text_array', null),
  ('ownership_type',  'Ownership type',  'ownership_type',  'text',       null)
on conflict (attribute) do nothing;

-- ── The provenance store: one row per (listing, attribute, source) ──
create table if not exists public.listing_facts (
  id          uuid primary key default gen_random_uuid(),
  listing_id  uuid not null references public.shops(id) on delete cascade,
  attribute   text not null references public.fact_attributes(attribute),
  value       jsonb not null,                      -- typed value: "512...", 4.7, ["Ping"], {...}, true
  source      text not null references public.fact_sources(source),
  source_url  text,
  fetched_at  timestamptz not null default now(),
  confidence  numeric(4,3) not null default 0.5 check (confidence between 0 and 1),
  verified_by text not null default 'system' check (verified_by in ('system','human')),
  is_current  boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (listing_id, attribute, source)
);

create index if not exists idx_listing_facts_listing on public.listing_facts (listing_id);
create index if not exists idx_listing_facts_lookup  on public.listing_facts (listing_id, attribute);

-- Exactly one winning fact per (listing, attribute).
create unique index if not exists uq_listing_facts_current
  on public.listing_facts (listing_id, attribute) where is_current;

-- Reuse the existing updated_at trigger function from 001_schema.sql.
drop trigger if exists listing_facts_updated_at on public.listing_facts;
create trigger listing_facts_updated_at
  before update on public.listing_facts
  for each row execute function public.handle_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
--   Public may read only PUBLISHED facts (current winner + confident enough).
--   There is NO write policy, so anon/authenticated cannot write — only the
--   service-role pipelines (which bypass RLS) can. Registries are public-read
--   reference data.
-- ============================================================

alter table public.listing_facts enable row level security;
drop policy if exists "Public read published facts" on public.listing_facts;
create policy "Public read published facts"
  on public.listing_facts for select
  using (is_current = true and confidence >= 0.5);
revoke all on public.listing_facts from anon, authenticated;
grant select on public.listing_facts to anon, authenticated;

alter table public.fact_sources    enable row level security;
alter table public.fact_attributes enable row level security;
drop policy if exists "Public read fact sources" on public.fact_sources;
create policy "Public read fact sources" on public.fact_sources for select using (true);
drop policy if exists "Public read fact attributes" on public.fact_attributes;
create policy "Public read fact attributes" on public.fact_attributes for select using (true);
revoke all on public.fact_sources    from anon, authenticated;
revoke all on public.fact_attributes from anon, authenticated;
grant select on public.fact_sources    to anon, authenticated;
grant select on public.fact_attributes to anon, authenticated;

-- ============================================================
-- VERIFY (run these after; expected results in comments)
--   select count(*) from public.fact_sources;      -- 7
--   select count(*) from public.fact_attributes;   -- 10
--   select count(*) from public.listing_facts;     -- 0 (backfill is chunk 2)
--   \d public.listing_facts
-- ============================================================

-- ============================================================
-- ROLLBACK (only if you need to undo this migration):
--   drop table if exists public.listing_facts cascade;
--   drop table if exists public.fact_attributes cascade;
--   drop table if exists public.fact_sources cascade;
--   alter table public.shops
--     drop column if exists brands_fitted,
--     drop column if exists launch_monitors,
--     drop column if exists ownership_type;
-- ============================================================

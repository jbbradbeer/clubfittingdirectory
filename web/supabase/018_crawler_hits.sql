-- ============================================================
-- 018 — AI-crawler hit log (measurement, Phase 5)
--
-- One row per page fetch by a named AI crawler (GPTBot, ClaudeBot,
-- PerplexityBot, …), inserted fire-and-forget from web/proxy.ts.
-- The leading indicator that AI engines are reading the site —
-- fetch volume moves weeks before rankings or citations do.
-- Read with: python3 scripts/crawler_report.py
--
-- HOW TO APPLY: paste into the Supabase SQL editor and Run.
-- Safe to re-run.
-- ============================================================

create table if not exists public.crawler_hits (
  id   uuid primary key default gen_random_uuid(),
  bot  text not null,          -- canonical bot name from AI_SEARCH_BOTS
  path text not null,          -- request pathname, e.g. /listing/foo-bar
  ua   text,                   -- full user-agent string as received
  ts   timestamptz not null default now()
);

create index if not exists crawler_hits_bot_ts_idx on public.crawler_hits (bot, ts desc);
create index if not exists crawler_hits_ts_idx on public.crawler_hits (ts desc);

-- Service-role only: RLS on with NO policies means anon/authenticated see
-- nothing and cannot write; the proxy inserts with the service key.
alter table public.crawler_hits enable row level security;
revoke all on public.crawler_hits from anon, authenticated;

-- ============================================================
-- VERIFY:
--   select count(*) from public.crawler_hits;   -- 0 (until deploy)
--   \d public.crawler_hits                       -- 5 columns, RLS enabled
-- ROLLBACK:
--   drop table if exists public.crawler_hits;
-- ============================================================

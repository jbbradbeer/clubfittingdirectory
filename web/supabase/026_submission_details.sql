-- ============================================================
-- 026 — Fuller shop submissions
--
-- WHY: approving a submission publishes it, but the form only collected a name,
-- city, website and phone. This adds the street, ZIP, hours and services, and
-- remembers which listing each approval created so the admin can link to it.
-- It also stops outsiders from setting the review columns themselves.
--
-- HOW TO APPLY: run in the Supabase SQL editor BEFORE the new code goes live.
-- Safe with the code that's live today, and safe to re-run.
-- ============================================================

begin;

alter table public.shop_submissions
  add column if not exists street            text,
  add column if not exists postal_code       text,
  -- { "hours": {"Monday": ["9AM-5PM"], ...}, "services": ["Club Fitting", ...] }
  add column if not exists details           jsonb,
  add column if not exists published_shop_id uuid references public.shops(id) on delete set null,
  add column if not exists published_at      timestamptz;

alter table public.shop_submissions drop constraint if exists shop_submissions_details_size;
alter table public.shop_submissions add constraint shop_submissions_details_size check (
  coalesce(length(street), 0) <= 200
  and coalesce(length(postal_code), 0) <= 10
  and coalesce(octet_length(details::text), 0) <= 4000
);

create index if not exists idx_shop_submissions_published
  on public.shop_submissions (published_shop_id);

-- The public may fill in the form's own fields and nothing else.
revoke all on public.shop_submissions from anon, authenticated;
grant insert (
  name, shop_type, city, state_code, website, phone, offers_fitting, notes,
  submitter_email, street, postal_code, details
) on public.shop_submissions to anon, authenticated;

drop policy if exists "Public can submit a shop" on public.shop_submissions;
create policy "Public can submit a shop"
  on public.shop_submissions for insert to anon, authenticated
  with check (review_status = 'new' and published_shop_id is null and published_at is null);

-- Details a submitter typed and an admin published. Beats the scrapes; loses to
-- anything a verified owner or an admin says. Never counts as human-verified.
insert into public.fact_sources (source, label, precedence, base_confidence)
values ('submission', 'Shop submission (reviewed before publishing)', 60, 0.700)
on conflict (source) do nothing;

-- Link past approvals where exactly one listing has the same name and city, created after the submission.
update public.shop_submissions s
   set published_shop_id = m.shop_id
  from (
    select sub.id as submission_id, (array_agg(sh.id))[1] as shop_id
      from public.shop_submissions sub
      join public.shops sh
        on lower(sh.name) = lower(sub.name) and sh.city = sub.city
     where sub.review_status = 'approved'
       and sub.published_shop_id is null
       and sh.created_at >= sub.created_at
     group by sub.id
    having count(*) = 1
  ) m
 where s.id = m.submission_id;

commit;

-- Check: expect one 'submission' row, then the five new columns.
select source, precedence, base_confidence from public.fact_sources where source = 'submission';
select column_name from information_schema.columns
 where table_schema = 'public' and table_name = 'shop_submissions'
   and column_name in ('street', 'postal_code', 'details', 'published_shop_id', 'published_at')
 order by 1;

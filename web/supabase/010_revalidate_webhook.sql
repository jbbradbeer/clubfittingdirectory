-- 010: Database webhook → on-demand page revalidation
--
-- WHAT THIS DOES:
-- Whenever a row in public.shops is inserted, updated or deleted, Supabase
-- calls POST https://clubfittingdirectory.com/api/revalidate with the standard
-- webhook payload ({ type, record, old_record }). The endpoint then rebuilds
-- only the pages that show that shop. This closes the gap left by the 30-day
-- passive ISR window (see web/app/api/revalidate/route.ts).
--
-- SECRET: replace <REVALIDATE_SECRET> below with the value of REVALIDATE_SECRET
-- (stored in web/.env.local and on Vercel). Do NOT commit the real secret here.
--
-- CAUTION — BULK UPDATES: this trigger fires once PER ROW. If a Python script
-- updates hundreds of shops at once it will send hundreds of webhook calls and
-- cause exactly the ISR write spike this system was built to avoid. Before a
-- bulk run, disable it:
--   alter table public.shops disable trigger shops_revalidate_webhook;
-- ...and re-enable afterwards:
--   alter table public.shops enable trigger shops_revalidate_webhook;

drop trigger if exists shops_revalidate_webhook on public.shops;

create trigger shops_revalidate_webhook
after insert or update or delete on public.shops
for each row
execute function supabase_functions.http_request(
  'https://clubfittingdirectory.com/api/revalidate',
  'POST',
  '{"Content-Type":"application/json","Authorization":"Bearer <REVALIDATE_SECRET>"}',
  '{}',
  '5000'
);

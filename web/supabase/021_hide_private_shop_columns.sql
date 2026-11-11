-- ============================================================
-- 021 — Hide private owner columns on public.shops from the public key
-- ============================================================
-- Problem (found 2026-11-11 site evaluation): RLS limits anon to
-- status='active' ROWS, but every COLUMN was readable — so anyone holding the
-- public anon key (shipped in the site's JS) could request
--   /rest/v1/shops?select=owner_email
-- and read every claimed owner's email.
--
-- Fix: column-level privileges. anon/authenticated lose table-wide SELECT and
-- get it back on the public columns only. owner_email, owner_title and
-- outreach_ready become service-role only (admin, portal, API, cron all use
-- the service-role client, which is unaffected).
--
-- ORDER: deploy the app code that replaced SELECT * (getShopBySlug →
-- PUBLIC_SHOP_FIELDS) BEFORE running this, or listing pages will error.
--
-- MAINTENANCE: a NEW public column on shops must be added to the GRANT below
-- (and to PUBLIC_SHOP_FIELDS in web/lib/supabase/queries/shared.ts), otherwise
-- the public site can't read it.
--
-- Run in: Supabase Dashboard → SQL Editor. Safe to re-run.
-- ============================================================

REVOKE SELECT ON public.shops FROM anon, authenticated;

GRANT SELECT (
  id, slug, name, shop_type, primary_service, query,
  street, city, state, state_code, postal_code, time_zone,
  phone, website, location_link, google_place_id,
  latitude, longitude, location,
  rating, rating_tier, reviews, photos_count, has_photos,
  offers_fitting, fitting_environment, public_fitting, mobile_fitting,
  in_house_build, bay_count, brands_fitted, launch_monitors,
  credentials, ownership_type, is_chain, year_established, about,
  area_service, fitting_price_min, fitting_price_max,
  services, services_array, services_source, num_services,
  working_hours, open_on_weekends, business_status,
  verified, verified_at, verified_expires_at, verified_plan,
  claimed_at, is_featured, listing_tier,
  status, created_at, updated_at
) ON public.shops TO anon, authenticated;

-- Verify (should return "permission denied for table shops" / 401 via REST):
--   SET ROLE anon; SELECT owner_email FROM public.shops LIMIT 1; RESET ROLE;

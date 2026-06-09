-- ============================================================
-- Club Fitting Directory — SECURITY ADVISOR FIXES (round 2)
-- Run in Supabase SQL Editor (Dashboard → SQL Editor → New query → paste → Run)
--
-- Fixes the 5 warnings that are genuinely ours to fix:
--   1-3. "Function Search Path Mutable" on our 3 functions
--   4.   Lock down the unused `rls_auto_enable` function (revoke public EXECUTE)
--
-- It deliberately does NOT touch:
--   • shops / shop_submissions public access  → intentional (public directory + submission form)
--   • PostGIS internals (postgis, pg_trgm, geometry_columns, geography_columns,
--     spatial_ref_sys, st_estimatedextent)    → owned by Supabase admin, not us
--
-- SAFE TO RE-RUN. Does not change any data — only function definitions / grants.
-- ============================================================

-- ------------------------------------------------------------
-- 1. handle_updated_at — pin search_path
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ------------------------------------------------------------
-- 2. search_shops_near — pin search_path (uses PostGIS funcs in public)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.search_shops_near(
  lat        FLOAT,
  lng        FLOAT,
  radius_km  FLOAT DEFAULT 80,
  p_state    TEXT  DEFAULT NULL,
  p_type     TEXT  DEFAULT NULL,
  p_fitting  BOOLEAN DEFAULT NULL,
  p_limit    INT   DEFAULT 50
)
RETURNS TABLE (
  id                  UUID,
  slug                TEXT,
  name                TEXT,
  shop_type           TEXT,
  city                TEXT,
  state_code          TEXT,
  rating              NUMERIC,
  rating_tier         TEXT,
  photos_count        INTEGER,
  offers_fitting      BOOLEAN,
  fitting_environment TEXT,
  location_link       TEXT,
  website             TEXT,
  phone               TEXT,
  distance_km         FLOAT
)
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id, s.slug, s.name, s.shop_type, s.city, s.state_code,
    s.rating, s.rating_tier, s.photos_count,
    s.offers_fitting, s.fitting_environment,
    s.location_link, s.website, s.phone,
    ROUND((ST_Distance(
      s.location,
      ST_MakePoint(lng, lat)::geography
    ) / 1000)::numeric, 1)::float AS distance_km
  FROM public.shops s
  WHERE s.status = 'active'
    AND (p_state IS NULL OR s.state_code = p_state)
    AND (p_type IS NULL OR s.shop_type = p_type)
    AND (p_fitting IS NULL OR s.offers_fitting = p_fitting)
    AND (s.location IS NULL OR ST_DWithin(
          s.location,
          ST_MakePoint(lng, lat)::geography,
          radius_km * 1000
        ))
  ORDER BY distance_km ASC NULLS LAST, s.is_featured DESC, s.rating DESC NULLS LAST
  LIMIT p_limit;
END;
$$;

-- ------------------------------------------------------------
-- 3. search_shops_text — pin search_path
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.search_shops_text(
  query_text TEXT,
  p_state    TEXT  DEFAULT NULL,
  p_limit    INT   DEFAULT 50
)
RETURNS TABLE (
  id          UUID,
  slug        TEXT,
  name        TEXT,
  shop_type   TEXT,
  city        TEXT,
  state_code  TEXT,
  rating      NUMERIC,
  rating_tier TEXT,
  website     TEXT,
  rank        FLOAT
)
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id, s.slug, s.name, s.shop_type, s.city, s.state_code,
    s.rating, s.rating_tier, s.website,
    ts_rank(
      to_tsvector('english',
        coalesce(s.name, '') || ' ' ||
        coalesce(s.city, '') || ' ' ||
        coalesce(s.state, '') || ' ' ||
        coalesce(s.services, '')
      ),
      plainto_tsquery('english', query_text)
    )::float AS rank
  FROM public.shops s
  WHERE s.status = 'active'
    AND (p_state IS NULL OR s.state_code = p_state)
    AND to_tsvector('english',
          coalesce(s.name, '') || ' ' ||
          coalesce(s.city, '') || ' ' ||
          coalesce(s.state, '') || ' ' ||
          coalesce(s.services, '')
        ) @@ plainto_tsquery('english', query_text)
  ORDER BY rank DESC, s.rating DESC NULLS LAST
  LIMIT p_limit;
END;
$$;

-- ------------------------------------------------------------
-- 4. rls_auto_enable — unused + publicly executable SECURITY DEFINER.
--    Revoke EXECUTE from everyone except the service_role / postgres.
--    (Wrapped so the script still runs cleanly if the function is absent
--     or we lack permission to change it.)
-- ------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'rls_auto_enable'
  ) THEN
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated';
    RAISE NOTICE 'rls_auto_enable: EXECUTE revoked from public/anon/authenticated';
  ELSE
    RAISE NOTICE 'rls_auto_enable: not found (nothing to do)';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'rls_auto_enable: skipped (%).', SQLERRM;
END
$$;

-- ============================================================
-- VERIFY
-- ============================================================

-- (a) Our 3 functions should now show search_path=public in proconfig:
SELECT p.proname AS function_name, p.proconfig AS settings
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN ('handle_updated_at', 'search_shops_near', 'search_shops_text')
ORDER BY p.proname;

-- (b) Show the source of the mystery function so we can decide whether to DROP it.
--     If it does not exist this returns no rows.
SELECT pg_get_functiondef(p.oid) AS rls_auto_enable_source
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.proname = 'rls_auto_enable';

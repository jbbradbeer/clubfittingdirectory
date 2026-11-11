-- ============================================================
-- 022 — Fix "Near Me" search
-- ============================================================
-- Problems (found 2026-11-11 site evaluation):
--   1. ~258 active shops had latitude/longitude but no `location` point
--      (nothing ever filled it after the original import), and
--      search_shops_near's filter `s.location IS NULL OR ST_DWithin(...)`
--      let every one of them into EVERY nearby search, anywhere in the US.
--   2. search_shops_near returned no latitude/longitude, so Near Me + Map
--      view always showed an empty map.
--
-- Fix:
--   a. Backfill location from latitude/longitude, and a trigger keeps it in
--      sync on every insert/update from now on.
--   b. New function nearby_shop_ids() returns only (id, distance_km), with a
--      strict radius filter. The app then loads the full card columns itself,
--      so the card shape can change without another migration.
--   The old search_shops_near is left in place so the live site keeps working
--   until the new code deploys; it can be dropped afterwards (see bottom).
--
-- Run in: Supabase Dashboard → SQL Editor. Safe to re-run.
-- ============================================================

-- a. keep location in sync with latitude/longitude ---------------------------
CREATE OR REPLACE FUNCTION public.shops_sync_location()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    NEW.location := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
  ELSE
    NEW.location := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS shops_sync_location ON public.shops;
CREATE TRIGGER shops_sync_location
  BEFORE INSERT OR UPDATE OF latitude, longitude ON public.shops
  FOR EACH ROW EXECUTE FUNCTION public.shops_sync_location();

-- Backfill rows whose point is missing (~255 active shops as of 2026-11-11).
UPDATE public.shops
   SET location = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
 WHERE latitude IS NOT NULL AND longitude IS NOT NULL AND location IS NULL;

-- b. strict radius search returning ids + distance --------------------------
CREATE OR REPLACE FUNCTION public.nearby_shop_ids(
  lat        FLOAT,
  lng        FLOAT,
  radius_km  FLOAT DEFAULT 80,
  p_limit    INT   DEFAULT 50
)
RETURNS TABLE (id UUID, distance_km FLOAT)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT s.id,
         ROUND((ST_Distance(s.location, ST_MakePoint(lng, lat)::geography) / 1000)::numeric, 1)::float
  FROM public.shops s
  WHERE s.status = 'active'
    AND s.location IS NOT NULL
    AND ST_DWithin(s.location, ST_MakePoint(lng, lat)::geography, radius_km * 1000)
  ORDER BY 2 ASC, s.is_featured DESC, s.rating DESC NULLS LAST
  LIMIT LEAST(p_limit, 200);
$$;

GRANT EXECUTE ON FUNCTION public.nearby_shop_ids(FLOAT, FLOAT, FLOAT, INT) TO anon, authenticated;

-- Verify (Austin, TX — every row should be <= 80 km):
--   SELECT * FROM public.nearby_shop_ids(30.2672, -97.7431);
--   SELECT count(*) FROM public.shops
--    WHERE status='active' AND latitude IS NOT NULL AND location IS NULL;  -- expect 0

-- AFTER the new app code is live, the old function can go:
--   DROP FUNCTION IF EXISTS public.search_shops_near(FLOAT, FLOAT, FLOAT, TEXT, TEXT, BOOLEAN, INT);

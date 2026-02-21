-- ============================================================
-- Club Fitting Directory — Supabase Schema
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor)
-- ============================================================

-- Enable PostGIS for geo queries (proximity search)
CREATE EXTENSION IF NOT EXISTS postgis;
-- Enable trigram search for fuzzy name matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================================
-- SHOPS TABLE
-- Maps directly to golf_directory_MASTER.csv (35 columns)
-- + id, slug, status, is_featured, listing_tier, created_at, updated_at
-- ============================================================

CREATE TABLE IF NOT EXISTS public.shops (
  -- Internal DB fields
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug             TEXT UNIQUE NOT NULL,
  status           TEXT NOT NULL DEFAULT 'active'
                   CHECK (status IN ('pending', 'active', 'inactive')),
  is_featured      BOOLEAN DEFAULT FALSE,
  listing_tier     TEXT NOT NULL DEFAULT 'free'
                   CHECK (listing_tier IN ('free', 'basic', 'featured')),

  -- Identity (CSV cols 1-4)
  name             TEXT NOT NULL,
  shop_type        TEXT,  -- Clubfitter | Retailer | Simulator | Driving Range | Instruction | Golf Course / Pro Shop | Mixed / Unknown
  primary_service  TEXT,
  is_chain         BOOLEAN DEFAULT FALSE,

  -- Contact (CSV cols 5-6)
  phone            TEXT,
  website          TEXT,

  -- Location (CSV cols 7-14)
  street           TEXT,
  city             TEXT NOT NULL,
  state            TEXT NOT NULL,      -- Full name: "Texas"
  state_code       TEXT NOT NULL,      -- Abbreviation: "TX"
  postal_code      TEXT,
  latitude         NUMERIC(10, 7),
  longitude        NUMERIC(10, 7),
  time_zone        TEXT,
  -- PostGIS geography point (populated by migration script)
  location         GEOGRAPHY(POINT, 4326),

  -- Google data (CSV cols 15-21)
  rating           NUMERIC(3, 1),
  rating_tier      TEXT,  -- Top Rated | Highly Rated | Well Reviewed | Standard
  reviews          INTEGER,
  photos_count     INTEGER DEFAULT 0,
  has_photos       BOOLEAN DEFAULT FALSE,
  verified         BOOLEAN DEFAULT FALSE,
  location_link    TEXT,  -- Direct Google Maps URL

  -- Services (CSV cols 22-26)
  services         TEXT,              -- Pipe-delimited: "Club Fitting | Launch Monitor | ..."
  services_array   TEXT[] DEFAULT '{}', -- Array version for filtering
  num_services     INTEGER DEFAULT 0,
  offers_fitting   BOOLEAN DEFAULT FALSE,
  fitting_environment TEXT,           -- Indoor | Outdoor | Indoor & Outdoor
  public_fitting   BOOLEAN DEFAULT FALSE,

  -- Hours (CSV cols 27-28)
  working_hours    JSONB,             -- Raw JSON from Outscraper
  open_on_weekends BOOLEAN,

  -- Meta (CSV cols 29-35)
  business_status  TEXT DEFAULT 'OPERATIONAL',
  outreach_ready   BOOLEAN DEFAULT FALSE,
  services_source  TEXT,              -- crawled | recrawled | heuristic | no_website
  query            TEXT,              -- Original Outscraper search query
  area_service     BOOLEAN DEFAULT FALSE,
  owner_title      TEXT,
  about            JSONB,             -- Raw JSON from Outscraper (accessibility, highlights, etc.)

  -- Timestamps
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

-- Primary lookups
CREATE INDEX IF NOT EXISTS idx_shops_slug        ON public.shops (slug);
CREATE INDEX IF NOT EXISTS idx_shops_state_code  ON public.shops (state_code);
CREATE INDEX IF NOT EXISTS idx_shops_status      ON public.shops (status);
CREATE INDEX IF NOT EXISTS idx_shops_shop_type   ON public.shops (shop_type);
CREATE INDEX IF NOT EXISTS idx_shops_offers_fitting ON public.shops (offers_fitting);
CREATE INDEX IF NOT EXISTS idx_shops_rating      ON public.shops (rating DESC NULLS LAST);

-- PostGIS spatial index for proximity queries
CREATE INDEX IF NOT EXISTS idx_shops_location    ON public.shops USING GIST (location);

-- Full-text search across name + city + state
CREATE INDEX IF NOT EXISTS idx_shops_fts ON public.shops
  USING GIN (to_tsvector('english',
    coalesce(name, '') || ' ' ||
    coalesce(city, '') || ' ' ||
    coalesce(state, '') || ' ' ||
    coalesce(services, '')
  ));

-- Array containment for service filtering
CREATE INDEX IF NOT EXISTS idx_shops_services_array ON public.shops USING GIN (services_array);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;

-- Anyone can read active shops (public directory)
CREATE POLICY "Public read active shops"
  ON public.shops FOR SELECT
  USING (status = 'active');

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER shops_updated_at
  BEFORE UPDATE ON public.shops
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- PROXIMITY SEARCH FUNCTION
-- Returns shops within radius_km of a lat/lng point
-- Usage: SELECT * FROM search_shops_near(40.7128, -74.0060, 50);
-- ============================================================

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
LANGUAGE plpgsql AS $$
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

-- ============================================================
-- FULL-TEXT SEARCH FUNCTION
-- Returns shops matching a text query
-- Usage: SELECT * FROM search_shops_text('trackman fitting texas');
-- ============================================================

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
LANGUAGE plpgsql AS $$
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

-- ============================================================
-- VERIFY
-- ============================================================
-- After running, confirm with:
--   SELECT COUNT(*) FROM public.shops;  -- should be 0 (before migration)
--   \d public.shops                     -- show table structure

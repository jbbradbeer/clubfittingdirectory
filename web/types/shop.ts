export interface Shop {
  id: string
  slug: string
  status: "pending" | "active" | "inactive"
  is_featured: boolean
  listing_tier: "free" | "basic" | "featured"

  // Identity
  name: string
  shop_type: string | null
  primary_service: string | null
  is_chain: boolean

  // Contact
  phone: string | null
  website: string | null

  // Location
  street: string | null
  city: string
  state: string
  state_code: string
  postal_code: string | null
  latitude: number | null
  longitude: number | null
  time_zone: string | null

  // Google data
  rating: number | null
  /** @deprecated scraped snapshot, goes stale — use isTopRated() in lib/badges.ts */
  rating_tier: string | null
  reviews: number | null
  photos_count: number
  has_photos: boolean
  verified: boolean
  location_link: string | null

  // Services
  services: string | null
  services_array: string[]
  num_services: number
  offers_fitting: boolean
  fitting_environment: string | null
  public_fitting: boolean

  // Fitting attributes (migrations 005/011/017; values managed by the
  // provenance ledger and promoted into these columns — empty/null until
  // populated. Optional where rows may predate migration 017.)
  launch_monitors: string[]
  brands_fitted?: string[] | null
  ownership_type: "independent" | "big_box" | "national_chain" | "oem" | "unknown" | null
  /** Fitting price range in whole USD; "From $150" when only min is known */
  fitting_price_min: number | null
  fitting_price_max: number | null
  year_established?: number | null
  credentials?: string[] | null
  bay_count?: number | null
  mobile_fitting?: boolean | null
  in_house_build?: boolean | null
  google_place_id?: string | null

  // Hours — a day's value is usually a string ("9 AM–5 PM") but can be an
  // array of strings for split hours (e.g. ["9 AM–1 PM", "2 PM–6 PM"]).
  working_hours: Record<string, string | string[]> | null
  open_on_weekends: boolean | null

  // Claim + paid Verified bookkeeping (migration 009; stamped by admin actions)
  claimed_at?: string | null
  owner_email?: string | null
  verified_at?: string | null
  verified_expires_at?: string | null
  verified_plan?: "monthly" | "annual" | null

  // Meta
  business_status: string
  outreach_ready: boolean
  services_source: string | null
  query: string | null
  area_service: boolean
  owner_title: string | null
  about: Record<string, unknown> | null

  created_at: string
  updated_at: string
}

/** Subset of Shop used by ListingCard — keeps component props clean */
export interface ListingCardProps {
  name: string
  shop_type: string | null
  primary_service: string | null
  city: string
  state: string
  state_code: string
  rating: number | null
  rating_tier: string | null
  services: string | null
  services_array: string[]
  offers_fitting: boolean
  fitting_environment: string | null
  phone: string | null
  website: string | null
  verified: boolean
  slug: string
  ownership_type?: Shop["ownership_type"]
  launch_monitors?: string[]
  /** Distance in km — shown as a badge when the user uses "Near Me" */
  distance_km?: number
}

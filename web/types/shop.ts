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

  // Hours
  working_hours: Record<string, string> | null
  open_on_weekends: boolean | null

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

export interface ShopFilters {
  state?: string
  shopType?: string
  offersFitting?: boolean
  search?: string
  sort?: "rating" | "name" | "reviews"
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
}

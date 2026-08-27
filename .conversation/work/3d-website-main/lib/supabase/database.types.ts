// ─── Supabase Database Types ────────────────────────────────────────────────────
// Hand-maintained to match supabase/schema.sql + supabase/migrations/*.
//
// Shape note: each table is declared once as a Row interface, and Insert/Update
// are derived from it via the TableOf<> helper below. The previous version of
// this file declared `portfolio_media` and a few others twice (a TS2300
// duplicate-identifier error) and set every `Update: {}`, which made *any*
// typed .update() call fail to compile.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

/**
 * Derives the Insert/Update shapes from a Row.
 * - Insert: server-defaulted columns (id / timestamps) are optional.
 * - Update: everything optional.
 */
type TableOf<Row> = {
  Row: Row
  // Written as homomorphic mapped types, NOT as `Omit<Row, …> & Partial<…>`.
  // postgrest-js constrains Insert/Update to `Record<string, unknown>`, and an
  // *intersection* type has no implicit index signature, so the intersection
  // form silently resolved these to `never` and made every .insert()/.update()
  // call fail to compile. A mapped type satisfies the constraint.
  //
  // Every column is optional here: Postgres still enforces NOT NULL and
  // defaults, and this keeps partial updates (the common admin case) typed.
  Insert: { [K in keyof Row]?: Row[K] }
  Update: { [K in keyof Row]?: Row[K] }
  // postgrest-js requires this key to exist on every table, otherwise it
  // resolves query results to `never` and every column access errors out.
  Relationships: []
}

// ─── Row shapes ───────────────────────────────────────────────────────────────

export type ProfileRow = {
  id: string
  /** 'customer' | 'admin' | 'team' — drives the /admin route guard. */
  role: string
  display_name: string | null
  phone: string | null
  email: string | null
  created_at: string
  updated_at: string
}

export type BusinessSettingsRow = {
  id: string
  phone: string | null
  whatsapp: string | null
  email: string | null
  address: string | null
  city: string | null
  state: string | null
  pincode: string | null
  business_hours: Json | null
  /** Open key-value map of platform -> url, so new platforms need no code change. */
  social_links: Json | null
  map_embed_url: string | null
  updated_at: string
}

export type PortfolioItemRow = {
  id: string
  slug: string
  title: string
  category_id: string | null
  event_type: string
  location: string | null
  price_range: string | null
  description: string | null
  services_included: string[] | null
  tags: string[] | null
  is_featured: boolean
  is_public: boolean
  seo_title: string | null
  seo_description: string | null
  created_at: string
  updated_at: string
}

export type PortfolioMediaRow = {
  id: string
  portfolio_item_id: string
  media_type: string | null
  url: string
  alt_text: string | null
  width: number | null
  height: number | null
  is_before_after: boolean | null
  /** Admin-typed label for this look, e.g. "प्रीमियम लुक". Free text. */
  variant_label: string | null
  /** Price of this specific look. null ⇒ plain reference photo (no price badge). */
  price: number | null
  is_bookable: boolean
  /** Cover image used on the public gallery card. */
  is_cover: boolean
  sort_order: number
  created_at: string
}

/**
 * Mirrors the columns written by `app/api/booking-requests/route.ts`. Keep the
 * two in step — that route is the only writer, so it defines the real shape.
 */
export type BookingRequestRow = {
  id: string
  reference_number: string | null
  status: string | null
  event_type: string | null
  event_date: string | null
  city: string | null
  area: string | null
  address: string | null
  venue_name: string | null
  budget: string | null
  custom_budget: number | null
  style: string[] | null
  guest_count: number | null
  venue_type: string | null
  setting: string | null
  requirements: string | null
  reference_files: string[] | null
  contact_name: string | null
  contact_phone: string | null
  contact_whatsapp: string | null
  contact_email: string | null
  /** The exact priced look the customer picked in the gallery (nullable). */
  selected_portfolio_media_id: string | null
  created_at: string
}

export type BookingRow = {
  id: string
  customer_id: string | null
  event_type: string | null
  event_date: string | null
  event_time: string | null
  location: string | null
  decoration_area_sqft: number | null
  occasion_name: string | null
  notes: string | null
  status: string | null
  quotation_status: string | null
  advance_required: number | null
  advance_paid: number | null
  total_quote: number | null
  quotation_notes: string | null
  quotation_terms: string | null
  quotation_validity_date: string | null
  is_urgent: boolean | null
  selected_portfolio_media_id: string | null
  created_at: string
  updated_at: string
}

export type CustomerRow = {
  id: string
  name: string | null
  phone: string | null
  whatsapp: string | null
  email: string | null
  created_at: string
}

export type PortfolioCategoryRow = {
  id: string
  slug: string
  name: string
  sort_order: number
  created_at: string
}

export type ServiceAreaRow = {
  id: string
  name: string
  name_hindi: string | null
  is_home_base: boolean
  lat: number | null
  lng: number | null
  created_at: string
}

export type ReviewRow = {
  id: string
  customer_name: string
  customer_location: string | null
  event_type: string | null
  rating: number
  review_text: string | null
  event_photo_url: string | null
  event_photo_alt: string | null
  customer_photo_url: string | null
  customer_photo_alt: string | null
  date: string | null
  featured: boolean
  approved: boolean
  created_at: string
}

export type PackageRow = {
  id: string
  slug: string
  name: string
  name_en: string | null
  event_type: string | null
  starting_price: number | null
  price_range: string | null
  inclusions: string[] | null
  estimated_setup_time: string | null
  decoration_area: string | null
  customization_available: boolean
  image_url: string | null
  image_alt: string | null
  featured: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

// ─── Database ─────────────────────────────────────────────────────────────────

export type Database = {
  public: {
    Tables: {
      profiles: TableOf<ProfileRow>
      business_settings: TableOf<BusinessSettingsRow>
      portfolio_categories: TableOf<PortfolioCategoryRow>
      portfolio_items: TableOf<PortfolioItemRow>
      portfolio_media: TableOf<PortfolioMediaRow>
      booking_requests: TableOf<BookingRequestRow>
      bookings: TableOf<BookingRow>
      customers: TableOf<CustomerRow>
      service_areas: TableOf<ServiceAreaRow>
      reviews: TableOf<ReviewRow>
      packages: TableOf<PackageRow>
    }
    Views: Record<string, never>
    Functions: {
      is_admin: {
        Args: Record<string, never>
        Returns: boolean
      }
    }
    Enums: Record<string, never>
  }
}

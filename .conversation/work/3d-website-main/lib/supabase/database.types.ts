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

type TableOf<Row> = {
  Row: Row
  Insert: { [K in keyof Row]?: Row[K] }
  Update: { [K in keyof Row]?: Row[K] }
  Relationships: []
}

export type ProfileRow = {
  id: string
  role: string
  full_name: string | null
  phone: string | null
  whatsapp: string | null
  email: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export type BusinessSettingsRow = {
  id: string
  phone: string | null
  whatsapp: string | null
  email: string | null
  address: string | null
  business_hours: Json | null
  social_links: Json | null
  updated_at: string
}

export type PortfolioItemRow = {
  id: string
  title: string
  category_id: string | null
  event_type: string
  location: string | null
  price_range: string | null
  description: string | null
  services_included: string[] | null
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
  is_before_after: boolean | null
  variant_label: string | null
  price: number | null
  is_bookable: boolean
  sort_order: number
  created_at: string
}

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
  selected_portfolio_media_id: string | null
  selected_variant_label_snapshot: string | null
  selected_price_snapshot: number | null
  selected_image_url_snapshot: string | null
  selected_item_title_snapshot: string | null
  created_at: string
}

export type NotificationRow = {
  id: string
  type: string
  booking_request_id: string | null
  title: string
  message: string
  image_url_snapshot: string | null
  is_read: boolean
  read_at: string | null
  created_at: string
}

/**
 * Live public.bookings shape. `booking_request_id` is the canonical foreign
 * key added by migration 0012. Keep it here because admin workflow actions
 * use it to synchronize a converted booking with its originating request.
 */
export type BookingRow = {
  id: string
  booking_request_id: string | null
  customer_id: string | null
  event_type: string | null
  event_date: string | null
  city: string | null
  area: string | null
  address: string | null
  venue_name: string | null
  map_location: Json | null
  budget_range: string | null
  decoration_styles: string[] | null
  guest_count: number | null
  venue_type: string | null
  is_indoor: boolean | null
  special_requirements: string | null
  additional_notes: string | null
  status: string | null
  total_price: number | null
  advance_paid: number | null
  remaining_amount: number | null
  admin_notes: string | null
  customer_notes: string | null
  created_at: string
  updated_at: string
  selected_portfolio_media_id: string | null
  selected_service_id: string | null
  selected_package_id: string | null
  selected_service_name_snapshot: string | null
  selected_package_name_snapshot: string | null
  selected_price_snapshot: number | null
  selected_image_url_snapshot: string | null
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
  updated_at: string
}

export type PackageRow = {
  id: string
  slug: string
  name: string
  description: string | null
  starting_price: number | null
  price_max: number | null
  setup_time_minutes: number | null
  decoration_area: string | null
  customizable: boolean
  is_featured: boolean
  is_active: boolean
  image_url: string | null
  image_alt: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

export type PackageItemRow = {
  id: string
  package_id: string
  label: string
  sort_order: number
}

export type ServiceRow = {
  id: string
  slug: string
  name: string
  name_en: string
  description: string
  description_en: string | null
  icon: string | null
  event_type: string
  starting_price: number
  image_url: string | null
  image_alt: string | null
  is_featured: boolean
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export type TeamMemberRow = {
  id: string
  name: string
  role: string
  photo_url: string | null
  phone: string | null
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export type PaymentRow = {
  id: string
  booking_id: string | null
  customer_id: string | null
  razorpay_order_id: string | null
  razorpay_payment_id: string | null
  payment_type: string | null
  amount: number | null
  status: string | null
  created_at: string
}

export type OccasionRow = {
  id: string
  slug: string
  name: string
  name_en: string
  description: string
  event_type: string
  starting_price: number
  image_url: string
  image_alt: string
  icon: string
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

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
      package_items: TableOf<PackageItemRow>
      occasions: TableOf<OccasionRow>
      services: TableOf<ServiceRow>
      team_members: TableOf<TeamMemberRow>
      payments: TableOf<PaymentRow>
      notifications: TableOf<NotificationRow>
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

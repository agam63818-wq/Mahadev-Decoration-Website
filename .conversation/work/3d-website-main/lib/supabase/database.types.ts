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
  /** Live Supabase column is full_name (verified against the live PostgREST spec). */
  full_name: string | null
  phone: string | null
  whatsapp: string | null
  email: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

/**
 * Live shape of public.business_settings (verified against the live PostgREST
 * spec): phone, whatsapp, email, address, business_hours (jsonb),
 * social_links (jsonb). There are NO city/state/pincode/map_embed_url columns
 * — writing them makes PostgREST reject the request, which is why settings
 * saves silently failed before this fix.
 */
export type BusinessSettingsRow = {
  id: string
  phone: string | null
  whatsapp: string | null
  email: string | null
  address: string | null
  /** Day-by-day open/close editor state: Array<{day, dayHindi, open, close, isClosed}>. */
  business_hours: Json | null
  /** Open key-value map of platform -> url, so new platforms need no code change. */
  social_links: Json | null
  updated_at: string
}

/**
 * Live shape of public.portfolio_items (verified against the live PostgREST
 * spec). NOTE: the live table has NO `slug` and NO `tags` column — the URL
 * identifier is the `id` itself. Querying slug/tags makes PostgREST return an
 * error, which previously made the whole gallery fall back to seed data.
 */
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

/**
 * Live shape of public.portfolio_media (verified against the live PostgREST
 * spec). NOTE: there is NO `is_cover` column in the live table — the cover is
 * derived (the lowest sort_order image), so setting a cover = moving that
 * image to the front.
 */
export type PortfolioMediaRow = {
  id: string
  portfolio_item_id: string
  media_type: string | null
  url: string
  alt_text: string | null
  // NOTE: live table has NO width/height columns (verified against the live
  // PostgREST spec) — the UI falls back to 800x600 defaults.
  is_before_after: boolean | null
  /** Admin-typed label for this look, e.g. "प्रीमियम लुक". Free text. */
  variant_label: string | null
  /** Price of this specific look. null ⇒ plain reference photo (no price badge). */
  price: number | null
  is_bookable: boolean
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
  /*
   * Historical snapshots, written ONCE at booking creation (migration 0011).
   *
   * These exist so a later catalog edit cannot rewrite booking history. Read
   * these — never re-derive a past booking's price or photo by joining to the
   * current portfolio_media row.
   *
   * Null on bookings created before 0011 ran: those genuinely have no recorded
   * historical value, and inventing one would be fabricated data.
   */
  selected_variant_label_snapshot: string | null
  selected_price_snapshot: number | null
  selected_image_url_snapshot: string | null
  selected_item_title_snapshot: string | null
  created_at: string
}

/**
 * public.notifications (migration 0011) — the admin bell.
 *
 * Admin-only by RLS: there is no public read policy. Inserted server-side by
 * /api/booking-requests; a UNIQUE index on (booking_request_id, type) makes
 * that insert idempotent.
 */
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

/**
 * Live shape of public.portfolio_categories (verified against the live
 * PostgREST spec): id, name, slug, sort_order. The public gallery filter
 * pills come from here, so the admin can add Anniversary/Mandap/Home/etc.
 * without a code change.
 */
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

/**
 * public.reviews — created by migration 0009, which was written to match THIS
 * pre-existing Row type rather than renaming its columns: the date column is
 * `date` (not event_date) and the flag is `featured` (not is_featured).
 * Only APPROVED rows are readable with the anon key (RLS).
 */
export type ReviewRow = {
  id: string
  customer_name: string
  customer_location: string | null
  event_type: string | null
  rating: number
  review_text: string | null
  /** Photo of the decorated event. Resolve with cardImagePublicUrl(). */
  event_photo_url: string | null
  event_photo_alt: string | null
  customer_photo_url: string | null
  customer_photo_alt: string | null
  /** Date of the event being reviewed (DATE column). */
  date: string | null
  featured: boolean
  approved: boolean
  created_at: string
  updated_at: string
}

/**
 * Live shape of public.packages (verified against the live PostgREST spec):
 * `customizable`, `is_featured`, `setup_time_minutes` — not the older
 * customization_available / featured / estimated_setup_time names.
 */
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
  /**
   * Added by migration 0010. Same convention as services.image_url: a
   * bucket-relative path in `card-images`, a /assets/... site path, or an
   * absolute URL. Resolve with cardImagePublicUrl().
   */
  image_url: string | null
  image_alt: string | null
  /** Added by migration 0010 — owner-controlled grid position. */
  sort_order: number
  created_at: string
  updated_at: string
}

/** Bullet-point inclusion rows belonging to a package. */
export type PackageItemRow = {
  id: string
  package_id: string
  label: string
  sort_order: number
}

/**
 * public.services — the twelve service cards on /services (migration 0005).
 * Column set matches 0005_services.sql exactly.
 */
export type ServiceRow = {
  id: string
  slug: string
  name: string
  name_en: string
  description: string
  description_en: string | null
  /** Lucide icon name, used only when image_url is empty. */
  icon: string | null
  event_type: string
  starting_price: number
  /**
   * Either a bucket-relative object path in the `card-images` bucket, a
   * site-relative /assets/... path, or an absolute URL. Resolve with
   * cardImagePublicUrl().
   */
  image_url: string | null
  image_alt: string | null
  is_featured: boolean
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

/** public.team_members — /about "हमारी टीम" cards (migration 0006). */
export type TeamMemberRow = {
  id: string
  name: string
  /** Hindi role label shown on the card. */
  role: string
  photo_url: string | null
  /** Owner's internal contact number — never selected by the public query. */
  phone: string | null
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

/**
 * public.payments — the only source of truth for the /admin/payments totals.
 * Column set matches supabase/schema.sql (defensively re-asserted by
 * migration 0008). `status` is free text; the values the UI groups on are
 * 'captured'/'completed'/'success' (received), 'created'/'pending'
 * (pending), 'failed', 'refunded'.
 */
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

/** public.occasions — home page "अपने अवसर को चुनें" cards (migration 0004). */
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

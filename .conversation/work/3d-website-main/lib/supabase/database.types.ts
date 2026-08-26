// ─── Supabase Database Types ────────────────────────────────────────────────────
// Auto-generated from your Supabase schema. Update after migrating.
// These mirror the tables listed in Part 3 spec.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      business_settings: {
        Row: {
          id: string
          phone: string
          whatsapp: string
          email: string
          address: string
          city: string
          state: string
          pincode: string
          business_hours: Json
          social_links: Json
          map_embed_url: string
          updated_at: string
        }
        Insert: {
          id: string
          phone: string
          whatsapp: string
          email: string
          address: string
          city: string
          state: string
          pincode: string
          business_hours: Json
          social_links: Json
          map_embed_url: string
          updated_at?: string
        }
        Update: {}
      }
      service_areas: {
        Row: {
          id: string
          name: string
          name_hindi: string
          is_home_base: boolean
          lat: number
          lng: number
          created_at: string
        }
        Insert: {
          id: string
          name: string
          name_hindi: string
          is_home_base: boolean
          lat: number
          lng: number
          created_at?: string
        }
        Update: {}
      }
      service_areas_translations: {
        Row: {
          id: string
          service_area_id: string
          language: string
          name: string
          created_at: string
        }
        Insert: {
          id: string
          service_area_id: string
          language: string
          name: string
          created_at?: string
        }
        Update: {}
      }
      services: {
        Row: {
          id: string
          slug: string
          name: string
          name_en: string
          description: string
          description_en: string
          icon: string
          event_type: string
          starting_price: number
          image_url: string
          image_alt: string
          featured: boolean
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          slug: string
          name: string
          name_en: string
          description: string
          description_en: string
          icon: string
          event_type: string
          starting_price: number
          image_url: string
          image_alt: string
          featured: boolean
          sort_order: number
          created_at?: string
          updated_at?: string
        }
        Update: {}
      }
      occasions: {
        Row: {
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
          created_at: string
        }
        Insert: {
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
          created_at?: string
        }
        Update: {}
      }
      portfolio_items: {
        Row: {
          id: string
          slug: string
          title: string
          event_type: string
          location: string
          price_range: string
          description: string
          services_included: string[]
          tags: string[]
          featured: boolean
          is_public: boolean
          seo_title: string
          seo_description: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          slug: string
          title: string
          event_type: string
          location: string
          price_range: string
          description: string
          services_included: string[]
          tags: string[]
          featured: boolean
          is_public: boolean
          seo_title: string
          seo_description: string
          created_at?: string
          updated_at?: string
        }
        Update: {}
      }
      portfolio_media: {
        Row: {
          id: string
          portfolio_item_id: string
          url: string
          alt: string
          width: number
          height: number
          is_primary: boolean
          sort_order: number
          created_at: string
        }
        Insert: {
          id: string
          portfolio_item_id: string
          url: string
          alt: string
          width: number
          height: number
          is_primary: boolean
          sort_order: number
          created_at?: string
        }
        Update: {}
      }
      packages: {
        Row: {
          id: string
          slug: string
          name: string
          name_en: string
          event_type: string
          starting_price: number
          price_range: string
          inclusions: string[]
          estimated_setup_time: string
          decoration_area: string
          customization_available: boolean
          image_url: string
          image_alt: string
          featured: boolean
          is_active: boolean
          faq: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          slug: string
          name: string
          name_en: string
          event_type: string
          starting_price: number
          price_range: string
          inclusions: string[]
          estimated_setup_time: string
          decoration_area: string
          customization_available: boolean
          image_url: string
          image_alt: string
          featured: boolean
          is_active: boolean
          faq: string
          created_at?: string
          updated_at?: string
        }
        Update: {}
      }
      reviews: {
        Row: {
          id: string
          customer_name: string
          customer_location: string
          event_type: string
          rating: number
          review_text: string
          event_photo_url: string
          event_photo_alt: string
          customer_photo_url: string
          customer_photo_alt: string
          date: string
          featured: boolean
          approved: boolean
          display_settings: Json
          created_at: string
        }
        Insert: {
          id: string
          customer_name: string
          customer_location: string
          event_type: string
          rating: number
          review_text: string
          event_photo_url: string
          event_photo_alt: string
          customer_photo_url: string
          customer_photo_alt: string
          date: string
          featured: boolean
          approved: boolean
          display_settings: Json
          created_at?: string
        }
        Update: {}
      }
      customers: {
        Row: {
          id: string
          name: string
          phone: string
          whatsapp: string
          email: string
          created_at: string
        }
        Insert: {
          id: string
          name: string
          phone: string
          whatsapp: string
          email: string
          created_at?: string
        }
        Update: {}
      }
      bookings: {
        Row: {
          id: string
          customer_id: string
          event_type: string
          event_date: string
          event_time: string
          location: string
          decoration_area_sqft: number
          occasion_name: string
          notes: string
          status: string
          quotation_status: string
          advance_required: number
          advance_paid: number
          total_quote: number
          quotation_notes: string
          quotation_terms: string
          quotation_validity_date: string
          is_urgent: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          customer_id: string
          event_type: string
          event_date: string
          event_time: string
          location: string
          decoration_area_sqft: number
          occasion_name: string
          notes: string
          status: string
          quotation_status: string
          advance_required: number
          advance_paid: number
          total_quote: number
          quotation_notes: string
          quotation_terms: string
          quotation_validity_date: string
          is_urgent: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {}
      }
      booking_status_history: {
        Row: {
          id: string
          booking_id: string
          from_status: string
          to_status: string
          changed_by: string
          reason: string
          created_at: string
        }
        Insert: {
          id: string
          booking_id: string
          from_status: string
          to_status: string
          changed_by: string
          reason: string
          created_at?: string
        }
        Update: {}
      }
      quotation_line_items: {
        Row: {
          id: string
          booking_id: string
          description: string
          quantity: number
          unit_price: number
          discount: number
          created_at: string
        }
        Insert: {
          id: string
          booking_id: string
          description: string
          quantity: number
          unit_price: number
          discount: number
          created_at?: string
        }
        Update: {}
      }
      payments: {
        Row: {
          id: string
          booking_id: string
          customer_id: string
          amount: number
          payment_method: string
          payment_status: string
          transaction_id: string
          transaction_date: string
          notes: string
          razorpay_order_id: string
          razorpay_payment_id: string
          created_at: string
        }
        Insert: {
          id: string
          booking_id: string
          customer_id: string
          amount: number
          payment_method: string
          payment_status: string
          transaction_id: string
          transaction_date: string
          notes: string
          razorpay_order_id: string
          razorpay_payment_id: string
          created_at?: string
        }
        Update: {}
      }
      portfolio_media: {
        Row: {
          id: string
          portfolio_item_id: string
          url: string
          alt: string
          width: number
          height: number
          is_primary: boolean
          sort_order: number
          created_at: string
        }
        Insert: {
          id: string
          portfolio_item_id: string
          url: string
          alt: string
          width: number
          height: number
          is_primary: boolean
          sort_order: number
          created_at?: string
        }
        Update: {}
      }
      team_members: {
        Row: {
          id: string
          name: string
          role: string
          role_hindi: string
          bio: string
          photo_url: string
          photo_alt: string
          years_experience: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id: string
          name: string
          role: string
          role_hindi: string
          bio: string
          photo_url: string
          photo_alt: string
          years_experience: number
          is_active: boolean
          created_at?: string
        }
        Update: {}
      }
      admin_users: {
        Row: {
          id: string
          email: string
          name: string
          role: string
          password_hash: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name: string
          role: string
          password_hash: string
          created_at?: string
          updated_at?: string
        }
        Update: {}
      }
    }
  }
}

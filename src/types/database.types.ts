export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      announcement_bar: {
        Row: {
          bg_color: string | null
          created_at: string | null
          cta_link: string
          cta_text: string
          id: string
          info_text: string
          is_active: boolean | null
          is_scrolling: boolean | null
          label: string
          speed: number | null
          text_color: string | null
          times: string[]
          updated_at: string | null
        }
        Insert: {
          bg_color?: string | null
          created_at?: string | null
          cta_link?: string
          cta_text?: string
          id?: string
          info_text?: string
          is_active?: boolean | null
          is_scrolling?: boolean | null
          label?: string
          speed?: number | null
          text_color?: string | null
          times?: string[]
          updated_at?: string | null
        }
        Update: {
          bg_color?: string | null
          created_at?: string | null
          cta_link?: string
          cta_text?: string
          id?: string
          info_text?: string
          is_active?: boolean | null
          is_scrolling?: boolean | null
          label?: string
          speed?: number | null
          text_color?: string | null
          times?: string[]
          updated_at?: string | null
        }
        Relationships: []
      }
      announcements: {
        Row: {
          banner_color: string | null
          content: string
          created_at: string | null
          created_by: string | null
          display_location: string | null
          expires_at: string | null
          id: string
          image_url: string | null
          is_banner: boolean | null
          is_pinned: boolean | null
          link_text: string | null
          link_url: string | null
          priority: number | null
          starts_at: string | null
          status: Database["public"]["Enums"]["content_status"] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          banner_color?: string | null
          content: string
          created_at?: string | null
          created_by?: string | null
          display_location?: string | null
          expires_at?: string | null
          id?: string
          image_url?: string | null
          is_banner?: boolean | null
          is_pinned?: boolean | null
          link_text?: string | null
          link_url?: string | null
          priority?: number | null
          starts_at?: string | null
          status?: Database["public"]["Enums"]["content_status"] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          banner_color?: string | null
          content?: string
          created_at?: string | null
          created_by?: string | null
          display_location?: string | null
          expires_at?: string | null
          id?: string
          image_url?: string | null
          is_banner?: boolean | null
          is_pinned?: boolean | null
          link_text?: string | null
          link_url?: string | null
          priority?: number | null
          starts_at?: string | null
          status?: Database["public"]["Enums"]["content_status"] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "announcements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_records: {
        Row: {
          attendance: Database["public"]["Enums"]["attendance_type"] | null
          checked_in_at: string | null
          checked_in_by: string | null
          created_at: string | null
          guest_count: number | null
          guest_name: string | null
          id: string
          notes: string | null
          service_date: string
          service_name: string
          user_id: string | null
        }
        Insert: {
          attendance?: Database["public"]["Enums"]["attendance_type"] | null
          checked_in_at?: string | null
          checked_in_by?: string | null
          created_at?: string | null
          guest_count?: number | null
          guest_name?: string | null
          id?: string
          notes?: string | null
          service_date: string
          service_name: string
          user_id?: string | null
        }
        Update: {
          attendance?: Database["public"]["Enums"]["attendance_type"] | null
          checked_in_at?: string | null
          checked_in_by?: string | null
          created_at?: string | null
          guest_count?: number | null
          guest_name?: string | null
          id?: string
          notes?: string | null
          service_date?: string
          service_name?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_records_checked_in_by_fkey"
            columns: ["checked_in_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          created_at: string | null
          description: string | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: unknown
          new_values: Json | null
          old_values: Json | null
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string | null
          description?: string | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string | null
          description?: string | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_categories: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          slug: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          slug: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          slug?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          allow_comments: boolean | null
          author_id: string | null
          author_name: string | null
          canonical_url: string | null
          category_id: string | null
          content: string
          cover_image_url: string | null
          created_at: string | null
          excerpt: string | null
          id: string
          is_featured: boolean | null
          meta_description: string | null
          meta_title: string | null
          newsletter_sent: boolean | null
          newsletter_sent_at: string | null
          published_at: string | null
          read_time_minutes: number | null
          scheduled_for: string | null
          send_to_newsletter: boolean | null
          share_count: number | null
          slug: string
          status: Database["public"]["Enums"]["content_status"] | null
          tags: string[] | null
          title: string
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          allow_comments?: boolean | null
          author_id?: string | null
          author_name?: string | null
          canonical_url?: string | null
          category_id?: string | null
          content: string
          cover_image_url?: string | null
          created_at?: string | null
          excerpt?: string | null
          id?: string
          is_featured?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          newsletter_sent?: boolean | null
          newsletter_sent_at?: string | null
          published_at?: string | null
          read_time_minutes?: number | null
          scheduled_for?: string | null
          send_to_newsletter?: boolean | null
          share_count?: number | null
          slug: string
          status?: Database["public"]["Enums"]["content_status"] | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          allow_comments?: boolean | null
          author_id?: string | null
          author_name?: string | null
          canonical_url?: string | null
          category_id?: string | null
          content?: string
          cover_image_url?: string | null
          created_at?: string | null
          excerpt?: string | null
          id?: string
          is_featured?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          newsletter_sent?: boolean | null
          newsletter_sent_at?: string | null
          published_at?: string | null
          read_time_minutes?: number | null
          scheduled_for?: string | null
          send_to_newsletter?: boolean | null
          share_count?: number | null
          slug?: string
          status?: Database["public"]["Enums"]["content_status"] | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_posts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "blog_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      church_departments: {
        Row: {
          contact_email: string | null
          cover_image_url: string | null
          created_at: string | null
          deputy_head_id: string | null
          description: string | null
          head_id: string | null
          id: string
          is_active: boolean | null
          name: string
          slug: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          contact_email?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          deputy_head_id?: string | null
          description?: string | null
          head_id?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          slug: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          contact_email?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          deputy_head_id?: string | null
          description?: string | null
          head_id?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          slug?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "church_departments_deputy_head_id_fkey"
            columns: ["deputy_head_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "church_departments_head_id_fkey"
            columns: ["head_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      church_positions: {
        Row: {
          created_at: string | null
          current_holders: number | null
          department_id: string
          description: string | null
          id: string
          is_active: boolean | null
          is_leadership: boolean | null
          is_volunteer: boolean | null
          max_holders: number | null
          requirements: string | null
          responsibilities: string | null
          sort_order: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          current_holders?: number | null
          department_id: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_leadership?: boolean | null
          is_volunteer?: boolean | null
          max_holders?: number | null
          requirements?: string | null
          responsibilities?: string | null
          sort_order?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          current_holders?: number | null
          department_id?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_leadership?: boolean | null
          is_volunteer?: boolean | null
          max_holders?: number | null
          requirements?: string | null
          responsibilities?: string | null
          sort_order?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "church_positions_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "church_departments"
            referencedColumns: ["id"]
          },
        ]
      }
      church_settings: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          is_public: boolean | null
          key: string
          updated_at: string | null
          updated_by: string | null
          value: string | null
          value_type: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value?: string | null
          value_type?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: string | null
          value_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "church_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      church_workers: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          assigned_by: string | null
          availability_notes: string | null
          available_friday: boolean | null
          available_saturday: boolean | null
          available_sunday: boolean | null
          available_wednesday: boolean | null
          certifications: string[] | null
          created_at: string | null
          dbs_certificate_number: string | null
          dbs_check_date: string | null
          dbs_expiry_date: string | null
          department_id: string
          employment_type: string | null
          end_date: string | null
          id: string
          is_trained: boolean | null
          notes: string | null
          position_id: string
          probation_end_date: string | null
          rating: number | null
          skills: string[] | null
          start_date: string | null
          status: string | null
          total_hours: number | null
          trained_by: string | null
          training_completed_at: string | null
          updated_at: string | null
          user_id: string
          worker_id: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          assigned_by?: string | null
          availability_notes?: string | null
          available_friday?: boolean | null
          available_saturday?: boolean | null
          available_sunday?: boolean | null
          available_wednesday?: boolean | null
          certifications?: string[] | null
          created_at?: string | null
          dbs_certificate_number?: string | null
          dbs_check_date?: string | null
          dbs_expiry_date?: string | null
          department_id: string
          employment_type?: string | null
          end_date?: string | null
          id?: string
          is_trained?: boolean | null
          notes?: string | null
          position_id: string
          probation_end_date?: string | null
          rating?: number | null
          skills?: string[] | null
          start_date?: string | null
          status?: string | null
          total_hours?: number | null
          trained_by?: string | null
          training_completed_at?: string | null
          updated_at?: string | null
          user_id: string
          worker_id?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          assigned_by?: string | null
          availability_notes?: string | null
          available_friday?: boolean | null
          available_saturday?: boolean | null
          available_sunday?: boolean | null
          available_wednesday?: boolean | null
          certifications?: string[] | null
          created_at?: string | null
          dbs_certificate_number?: string | null
          dbs_check_date?: string | null
          dbs_expiry_date?: string | null
          department_id?: string
          employment_type?: string | null
          end_date?: string | null
          id?: string
          is_trained?: boolean | null
          notes?: string | null
          position_id?: string
          probation_end_date?: string | null
          rating?: number | null
          skills?: string[] | null
          start_date?: string | null
          status?: string | null
          total_hours?: number | null
          trained_by?: string | null
          training_completed_at?: string | null
          updated_at?: string | null
          user_id?: string
          worker_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "church_workers_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "church_workers_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "church_workers_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "church_departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "church_workers_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "church_positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "church_workers_trained_by_fkey"
            columns: ["trained_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "church_workers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_submissions: {
        Row: {
          auto_reply_sent: boolean | null
          created_at: string | null
          department: string | null
          email: string
          id: string
          ip_address: unknown
          is_read: boolean | null
          is_replied: boolean | null
          is_spam: boolean | null
          message: string
          name: string
          phone: string | null
          read_at: string | null
          read_by: string | null
          replied_at: string | null
          replied_by: string | null
          reply_notes: string | null
          subject: string | null
          updated_at: string | null
        }
        Insert: {
          auto_reply_sent?: boolean | null
          created_at?: string | null
          department?: string | null
          email: string
          id?: string
          ip_address?: unknown
          is_read?: boolean | null
          is_replied?: boolean | null
          is_spam?: boolean | null
          message: string
          name: string
          phone?: string | null
          read_at?: string | null
          read_by?: string | null
          replied_at?: string | null
          replied_by?: string | null
          reply_notes?: string | null
          subject?: string | null
          updated_at?: string | null
        }
        Update: {
          auto_reply_sent?: boolean | null
          created_at?: string | null
          department?: string | null
          email?: string
          id?: string
          ip_address?: unknown
          is_read?: boolean | null
          is_replied?: boolean | null
          is_spam?: boolean | null
          message?: string
          name?: string
          phone?: string | null
          read_at?: string | null
          read_by?: string | null
          replied_at?: string | null
          replied_by?: string | null
          reply_notes?: string | null
          subject?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_submissions_read_by_fkey"
            columns: ["read_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_submissions_replied_by_fkey"
            columns: ["replied_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      devotionals: {
        Row: {
          action_point: string | null
          audio_url: string | null
          author_id: string | null
          author_name: string | null
          confession: string | null
          cover_image_url: string | null
          created_at: string | null
          devotional_date: string
          email_sent: boolean | null
          email_sent_at: string | null
          id: string
          prayer: string | null
          reflection: string
          scripture_reference: string
          scripture_text: string | null
          status: Database["public"]["Enums"]["content_status"] | null
          title: string
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          action_point?: string | null
          audio_url?: string | null
          author_id?: string | null
          author_name?: string | null
          confession?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          devotional_date: string
          email_sent?: boolean | null
          email_sent_at?: string | null
          id?: string
          prayer?: string | null
          reflection: string
          scripture_reference: string
          scripture_text?: string | null
          status?: Database["public"]["Enums"]["content_status"] | null
          title: string
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          action_point?: string | null
          audio_url?: string | null
          author_id?: string | null
          author_name?: string | null
          confession?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          devotional_date?: string
          email_sent?: boolean | null
          email_sent_at?: string | null
          id?: string
          prayer?: string | null
          reflection?: string
          scripture_reference?: string
          scripture_text?: string | null
          status?: Database["public"]["Enums"]["content_status"] | null
          title?: string
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "devotionals_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      donation_categories: {
        Row: {
          created_at: string | null
          current_amount: number | null
          description: string | null
          goal_amount: number | null
          icon: string | null
          id: string
          is_active: boolean | null
          is_building_fund: boolean | null
          is_default: boolean | null
          long_description: string | null
          media_urls: Json | null
          name: string
          quote: string | null
          quote_author: string | null
          show_progress: boolean | null
          slug: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          current_amount?: number | null
          description?: string | null
          goal_amount?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_building_fund?: boolean | null
          is_default?: boolean | null
          long_description?: string | null
          media_urls?: Json | null
          name: string
          quote?: string | null
          quote_author?: string | null
          show_progress?: boolean | null
          slug: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          current_amount?: number | null
          description?: string | null
          goal_amount?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_building_fund?: boolean | null
          is_default?: boolean | null
          long_description?: string | null
          media_urls?: Json | null
          name?: string
          quote?: string | null
          quote_author?: string | null
          show_progress?: boolean | null
          slug?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      donations: {
        Row: {
          amount: number
          category_id: string | null
          created_at: string | null
          currency: string | null
          donor_email: string | null
          donor_name: string | null
          donor_phone: string | null
          frequency: Database["public"]["Enums"]["donation_frequency"] | null
          gift_aid_declaration_date: string | null
          id: string
          is_anonymous: boolean | null
          is_gift_aid: boolean | null
          notes: string | null
          paid_at: string | null
          receipt_email_sent: boolean | null
          receipt_number: string | null
          receipt_sent_at: string | null
          refund_reason: string | null
          refunded_at: string | null
          status: Database["public"]["Enums"]["donation_status"] | null
          stripe_charge_id: string | null
          stripe_customer_id: string | null
          stripe_fee: number | null
          stripe_payment_intent_id: string | null
          stripe_receipt_url: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          category_id?: string | null
          created_at?: string | null
          currency?: string | null
          donor_email?: string | null
          donor_name?: string | null
          donor_phone?: string | null
          frequency?: Database["public"]["Enums"]["donation_frequency"] | null
          gift_aid_declaration_date?: string | null
          id?: string
          is_anonymous?: boolean | null
          is_gift_aid?: boolean | null
          notes?: string | null
          paid_at?: string | null
          receipt_email_sent?: boolean | null
          receipt_number?: string | null
          receipt_sent_at?: string | null
          refund_reason?: string | null
          refunded_at?: string | null
          status?: Database["public"]["Enums"]["donation_status"] | null
          stripe_charge_id?: string | null
          stripe_customer_id?: string | null
          stripe_fee?: number | null
          stripe_payment_intent_id?: string | null
          stripe_receipt_url?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          category_id?: string | null
          created_at?: string | null
          currency?: string | null
          donor_email?: string | null
          donor_name?: string | null
          donor_phone?: string | null
          frequency?: Database["public"]["Enums"]["donation_frequency"] | null
          gift_aid_declaration_date?: string | null
          id?: string
          is_anonymous?: boolean | null
          is_gift_aid?: boolean | null
          notes?: string | null
          paid_at?: string | null
          receipt_email_sent?: boolean | null
          receipt_number?: string | null
          receipt_sent_at?: string | null
          refund_reason?: string | null
          refunded_at?: string | null
          status?: Database["public"]["Enums"]["donation_status"] | null
          stripe_charge_id?: string | null
          stripe_customer_id?: string | null
          stripe_fee?: number | null
          stripe_payment_intent_id?: string | null
          stripe_receipt_url?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "donations_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "donation_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      email_log: {
        Row: {
          body_preview: string | null
          bounce_reason: string | null
          bounced_at: string | null
          clicked_at: string | null
          created_at: string | null
          delivered_at: string | null
          error_message: string | null
          id: string
          max_retries: number | null
          next_retry_at: string | null
          opened_at: string | null
          recipient_email: string
          recipient_name: string | null
          recipient_user_id: string | null
          related_id: string | null
          related_type: string | null
          resend_email_id: string | null
          retry_count: number | null
          sent_at: string | null
          status: Database["public"]["Enums"]["email_status"] | null
          subject: string
          template_name: string
          updated_at: string | null
        }
        Insert: {
          body_preview?: string | null
          bounce_reason?: string | null
          bounced_at?: string | null
          clicked_at?: string | null
          created_at?: string | null
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          max_retries?: number | null
          next_retry_at?: string | null
          opened_at?: string | null
          recipient_email: string
          recipient_name?: string | null
          recipient_user_id?: string | null
          related_id?: string | null
          related_type?: string | null
          resend_email_id?: string | null
          retry_count?: number | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["email_status"] | null
          subject: string
          template_name: string
          updated_at?: string | null
        }
        Update: {
          body_preview?: string | null
          bounce_reason?: string | null
          bounced_at?: string | null
          clicked_at?: string | null
          created_at?: string | null
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          max_retries?: number | null
          next_retry_at?: string | null
          opened_at?: string | null
          recipient_email?: string
          recipient_name?: string | null
          recipient_user_id?: string | null
          related_id?: string | null
          related_type?: string | null
          resend_email_id?: string | null
          retry_count?: number | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["email_status"] | null
          subject?: string
          template_name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_log_recipient_user_id_fkey"
            columns: ["recipient_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_registrations: {
        Row: {
          accessibility_needs: string | null
          amount_paid: number | null
          checked_in: boolean | null
          checked_in_at: string | null
          confirmation_code: string | null
          confirmation_email_sent: boolean | null
          created_at: string | null
          dietary_requirements: string | null
          event_id: string
          guest_email: string | null
          guest_name: string | null
          guest_phone: string | null
          id: string
          is_confirmed: boolean | null
          notes: string | null
          number_of_guests: number | null
          payment_status: Database["public"]["Enums"]["donation_status"] | null
          reminder_email_sent: boolean | null
          stripe_payment_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          accessibility_needs?: string | null
          amount_paid?: number | null
          checked_in?: boolean | null
          checked_in_at?: string | null
          confirmation_code?: string | null
          confirmation_email_sent?: boolean | null
          created_at?: string | null
          dietary_requirements?: string | null
          event_id: string
          guest_email?: string | null
          guest_name?: string | null
          guest_phone?: string | null
          id?: string
          is_confirmed?: boolean | null
          notes?: string | null
          number_of_guests?: number | null
          payment_status?: Database["public"]["Enums"]["donation_status"] | null
          reminder_email_sent?: boolean | null
          stripe_payment_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          accessibility_needs?: string | null
          amount_paid?: number | null
          checked_in?: boolean | null
          checked_in_at?: string | null
          confirmation_code?: string | null
          confirmation_email_sent?: boolean | null
          created_at?: string | null
          dietary_requirements?: string | null
          event_id?: string
          guest_email?: string | null
          guest_name?: string | null
          guest_phone?: string | null
          id?: string
          is_confirmed?: boolean | null
          notes?: string | null
          number_of_guests?: number | null
          payment_status?: Database["public"]["Enums"]["donation_status"] | null
          reminder_email_sent?: boolean | null
          stripe_payment_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_registrations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          address: string | null
          city: string | null
          contact_email: string | null
          contact_phone: string | null
          cover_image_url: string | null
          created_at: string | null
          current_attendees: number | null
          description: string | null
          early_bird_deadline: string | null
          early_bird_fee: number | null
          end_date: string | null
          event_type: Database["public"]["Enums"]["event_type"] | null
          id: string
          is_all_day: boolean | null
          is_featured: boolean | null
          is_online: boolean | null
          is_recurring: boolean | null
          location_name: string | null
          map_url: string | null
          max_attendees: number | null
          online_link: string | null
          organizer_name: string | null
          postal_code: string | null
          recurrence_rule: string | null
          registration_deadline: string | null
          registration_fee: number | null
          registration_required: boolean | null
          reminder_days_before: number | null
          send_reminder_email: boolean | null
          short_description: string | null
          show_on_homepage: boolean | null
          slug: string
          start_date: string
          status: Database["public"]["Enums"]["event_status"] | null
          tags: string[] | null
          timezone: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          current_attendees?: number | null
          description?: string | null
          early_bird_deadline?: string | null
          early_bird_fee?: number | null
          end_date?: string | null
          event_type?: Database["public"]["Enums"]["event_type"] | null
          id?: string
          is_all_day?: boolean | null
          is_featured?: boolean | null
          is_online?: boolean | null
          is_recurring?: boolean | null
          location_name?: string | null
          map_url?: string | null
          max_attendees?: number | null
          online_link?: string | null
          organizer_name?: string | null
          postal_code?: string | null
          recurrence_rule?: string | null
          registration_deadline?: string | null
          registration_fee?: number | null
          registration_required?: boolean | null
          reminder_days_before?: number | null
          send_reminder_email?: boolean | null
          short_description?: string | null
          show_on_homepage?: boolean | null
          slug: string
          start_date: string
          status?: Database["public"]["Enums"]["event_status"] | null
          tags?: string[] | null
          timezone?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          current_attendees?: number | null
          description?: string | null
          early_bird_deadline?: string | null
          early_bird_fee?: number | null
          end_date?: string | null
          event_type?: Database["public"]["Enums"]["event_type"] | null
          id?: string
          is_all_day?: boolean | null
          is_featured?: boolean | null
          is_online?: boolean | null
          is_recurring?: boolean | null
          location_name?: string | null
          map_url?: string | null
          max_attendees?: number | null
          online_link?: string | null
          organizer_name?: string | null
          postal_code?: string | null
          recurrence_rule?: string | null
          registration_deadline?: string | null
          registration_fee?: number | null
          registration_required?: boolean | null
          reminder_days_before?: number | null
          send_reminder_email?: boolean | null
          short_description?: string | null
          show_on_homepage?: boolean | null
          slug?: string
          start_date?: string
          status?: Database["public"]["Enums"]["event_status"] | null
          tags?: string[] | null
          timezone?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      family_groups: {
        Row: {
          address_line_1: string | null
          address_line_2: string | null
          city: string | null
          created_at: string | null
          family_name: string
          head_of_family_id: string | null
          id: string
          notes: string | null
          postal_code: string | null
          updated_at: string | null
        }
        Insert: {
          address_line_1?: string | null
          address_line_2?: string | null
          city?: string | null
          created_at?: string | null
          family_name: string
          head_of_family_id?: string | null
          id?: string
          notes?: string | null
          postal_code?: string | null
          updated_at?: string | null
        }
        Update: {
          address_line_1?: string | null
          address_line_2?: string | null
          city?: string | null
          created_at?: string | null
          family_name?: string
          head_of_family_id?: string | null
          id?: string
          notes?: string | null
          postal_code?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "family_groups_head_of_family_id_fkey"
            columns: ["head_of_family_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      family_members: {
        Row: {
          created_at: string | null
          family_id: string
          id: string
          relationship: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          family_id: string
          id?: string
          relationship: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          family_id?: string
          id?: string
          relationship?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_members_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "family_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      giving_statements: {
        Row: {
          created_at: string | null
          currency: string | null
          donation_count: number | null
          email_sent: boolean | null
          email_sent_at: string | null
          generated_at: string | null
          id: string
          pdf_url: string | null
          statement_month: number | null
          statement_year: number
          total_amount: number
          total_gift_aid: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          donation_count?: number | null
          email_sent?: boolean | null
          email_sent_at?: string | null
          generated_at?: string | null
          id?: string
          pdf_url?: string | null
          statement_month?: number | null
          statement_year: number
          total_amount?: number
          total_gift_aid?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          donation_count?: number | null
          email_sent?: boolean | null
          email_sent_at?: string | null
          generated_at?: string | null
          id?: string
          pdf_url?: string | null
          statement_month?: number | null
          statement_year?: number
          total_amount?: number
          total_gift_aid?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "giving_statements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leadership_team: {
        Row: {
          bio: string | null
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          phone: string | null
          photo_url: string | null
          role_description: string | null
          show_on_website: boolean | null
          social_facebook: string | null
          social_instagram: string | null
          social_linkedin: string | null
          social_twitter: string | null
          sort_order: number | null
          title: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          phone?: string | null
          photo_url?: string | null
          role_description?: string | null
          show_on_website?: boolean | null
          social_facebook?: string | null
          social_instagram?: string | null
          social_linkedin?: string | null
          social_twitter?: string | null
          sort_order?: number | null
          title: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          phone?: string | null
          photo_url?: string | null
          role_description?: string | null
          show_on_website?: boolean | null
          social_facebook?: string | null
          social_instagram?: string | null
          social_linkedin?: string | null
          social_twitter?: string | null
          sort_order?: number | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leadership_team_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      live_streams: {
        Row: {
          actual_end: string | null
          actual_start: string | null
          chat_enabled: boolean | null
          created_at: string | null
          description: string | null
          embed_url: string | null
          id: string
          is_featured: boolean | null
          notification_sent: boolean | null
          notify_subscribers: boolean | null
          peak_viewers: number | null
          platform: string | null
          recording_url: string | null
          scheduled_end: string | null
          scheduled_start: string
          status: Database["public"]["Enums"]["stream_status"] | null
          stream_url: string | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
          viewer_count: number | null
        }
        Insert: {
          actual_end?: string | null
          actual_start?: string | null
          chat_enabled?: boolean | null
          created_at?: string | null
          description?: string | null
          embed_url?: string | null
          id?: string
          is_featured?: boolean | null
          notification_sent?: boolean | null
          notify_subscribers?: boolean | null
          peak_viewers?: number | null
          platform?: string | null
          recording_url?: string | null
          scheduled_end?: string | null
          scheduled_start: string
          status?: Database["public"]["Enums"]["stream_status"] | null
          stream_url?: string | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
          viewer_count?: number | null
        }
        Update: {
          actual_end?: string | null
          actual_start?: string | null
          chat_enabled?: boolean | null
          created_at?: string | null
          description?: string | null
          embed_url?: string | null
          id?: string
          is_featured?: boolean | null
          notification_sent?: boolean | null
          notify_subscribers?: boolean | null
          peak_viewers?: number | null
          platform?: string | null
          recording_url?: string | null
          scheduled_end?: string | null
          scheduled_start?: string
          status?: Database["public"]["Enums"]["stream_status"] | null
          stream_url?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          viewer_count?: number | null
        }
        Relationships: []
      }
      media_gallery: {
        Row: {
          album: string | null
          cloudinary_public_id: string
          cloudinary_url: string
          created_at: string | null
          description: string | null
          event_id: string | null
          file_size_bytes: number | null
          height: number | null
          id: string
          is_featured: boolean | null
          is_public: boolean | null
          media_type: string
          sort_order: number | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
          uploaded_by: string | null
          width: number | null
        }
        Insert: {
          album?: string | null
          cloudinary_public_id: string
          cloudinary_url: string
          created_at?: string | null
          description?: string | null
          event_id?: string | null
          file_size_bytes?: number | null
          height?: number | null
          id?: string
          is_featured?: boolean | null
          is_public?: boolean | null
          media_type: string
          sort_order?: number | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
          uploaded_by?: string | null
          width?: number | null
        }
        Update: {
          album?: string | null
          cloudinary_public_id?: string
          cloudinary_url?: string
          created_at?: string | null
          description?: string | null
          event_id?: string | null
          file_size_bytes?: number | null
          height?: number | null
          id?: string
          is_featured?: boolean | null
          is_public?: boolean | null
          media_type?: string
          sort_order?: number | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          uploaded_by?: string | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_media_event"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_gallery_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      member_milestones: {
        Row: {
          certificate_url: string | null
          created_at: string | null
          description: string | null
          id: string
          milestone: Database["public"]["Enums"]["milestone_type"]
          milestone_date: string
          notes: string | null
          officiated_by: string | null
          photo_url: string | null
          title: string | null
          updated_at: string | null
          user_id: string
          witnesses: string[] | null
        }
        Insert: {
          certificate_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          milestone: Database["public"]["Enums"]["milestone_type"]
          milestone_date: string
          notes?: string | null
          officiated_by?: string | null
          photo_url?: string | null
          title?: string | null
          updated_at?: string | null
          user_id: string
          witnesses?: string[] | null
        }
        Update: {
          certificate_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          milestone?: Database["public"]["Enums"]["milestone_type"]
          milestone_date?: string
          notes?: string | null
          officiated_by?: string | null
          photo_url?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
          witnesses?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "member_milestones_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      member_notes: {
        Row: {
          author_id: string
          category: string | null
          created_at: string | null
          follow_up_date: string | null
          id: string
          is_confidential: boolean | null
          is_follow_up_done: boolean | null
          member_id: string
          note: string
          updated_at: string | null
        }
        Insert: {
          author_id: string
          category?: string | null
          created_at?: string | null
          follow_up_date?: string | null
          id?: string
          is_confidential?: boolean | null
          is_follow_up_done?: boolean | null
          member_id: string
          note: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string
          category?: string | null
          created_at?: string | null
          follow_up_date?: string | null
          id?: string
          is_confidential?: boolean | null
          is_follow_up_done?: boolean | null
          member_id?: string
          note?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "member_notes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_notes_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ministries: {
        Row: {
          co_leader_id: string | null
          contact_email: string | null
          contact_phone: string | null
          cover_image_url: string | null
          created_at: string | null
          description: string | null
          id: string
          is_accepting_members: boolean | null
          is_active: boolean | null
          is_featured: boolean | null
          leader_id: string | null
          meeting_day: string | null
          meeting_location: string | null
          meeting_time: string | null
          member_count: number | null
          name: string
          requirements: string | null
          slug: string
          sort_order: number | null
          updated_at: string | null
          vision: string | null
        }
        Insert: {
          co_leader_id?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_accepting_members?: boolean | null
          is_active?: boolean | null
          is_featured?: boolean | null
          leader_id?: string | null
          meeting_day?: string | null
          meeting_location?: string | null
          meeting_time?: string | null
          member_count?: number | null
          name: string
          requirements?: string | null
          slug: string
          sort_order?: number | null
          updated_at?: string | null
          vision?: string | null
        }
        Update: {
          co_leader_id?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_accepting_members?: boolean | null
          is_active?: boolean | null
          is_featured?: boolean | null
          leader_id?: string | null
          meeting_day?: string | null
          meeting_location?: string | null
          meeting_time?: string | null
          member_count?: number | null
          name?: string
          requirements?: string | null
          slug?: string
          sort_order?: number | null
          updated_at?: string | null
          vision?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ministries_co_leader_id_fkey"
            columns: ["co_leader_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ministries_leader_id_fkey"
            columns: ["leader_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ministry_members: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          joined_at: string | null
          ministry_id: string
          role: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          joined_at?: string | null
          ministry_id: string
          role?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          joined_at?: string | null
          ministry_id?: string
          role?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ministry_members_ministry_id_fkey"
            columns: ["ministry_id"]
            isOneToOne: false
            referencedRelation: "ministries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ministry_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_subscribers: {
        Row: {
          bounce_count: number | null
          created_at: string | null
          email: string
          first_name: string | null
          id: string
          ip_address: unknown
          is_active: boolean | null
          last_email_opened_at: string | null
          last_email_sent_at: string | null
          last_name: string | null
          source: string | null
          subscribed_at: string | null
          unsubscribe_reason: string | null
          unsubscribed_at: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          bounce_count?: number | null
          created_at?: string | null
          email: string
          first_name?: string | null
          id?: string
          ip_address?: unknown
          is_active?: boolean | null
          last_email_opened_at?: string | null
          last_email_sent_at?: string | null
          last_name?: string | null
          source?: string | null
          subscribed_at?: string | null
          unsubscribe_reason?: string | null
          unsubscribed_at?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          bounce_count?: number | null
          created_at?: string | null
          email?: string
          first_name?: string | null
          id?: string
          ip_address?: unknown
          is_active?: boolean | null
          last_email_opened_at?: string | null
          last_email_sent_at?: string | null
          last_name?: string | null
          source?: string | null
          subscribed_at?: string | null
          unsubscribe_reason?: string | null
          unsubscribed_at?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "newsletter_subscribers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          expires_at: string | null
          icon: string | null
          id: string
          is_dismissed: boolean | null
          is_read: boolean | null
          link: string | null
          message: string
          metadata: Json | null
          read_at: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"] | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          icon?: string | null
          id?: string
          is_dismissed?: boolean | null
          is_read?: boolean | null
          link?: string | null
          message: string
          metadata?: Json | null
          read_at?: string | null
          title: string
          type?: Database["public"]["Enums"]["notification_type"] | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          icon?: string | null
          id?: string
          is_dismissed?: boolean | null
          is_read?: boolean | null
          link?: string | null
          message?: string
          metadata?: Json | null
          read_at?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      potential_family_matches: {
        Row: {
          confidence_score: number | null
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string | null
          family_group_id: string | null
          id: string
          match_reasons: string[] | null
          shared_surname: string
          status: string | null
          updated_at: string | null
          user_id_1: string
          user_id_2: string
        }
        Insert: {
          confidence_score?: number | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string | null
          family_group_id?: string | null
          id?: string
          match_reasons?: string[] | null
          shared_surname: string
          status?: string | null
          updated_at?: string | null
          user_id_1: string
          user_id_2: string
        }
        Update: {
          confidence_score?: number | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string | null
          family_group_id?: string | null
          id?: string
          match_reasons?: string[] | null
          shared_surname?: string
          status?: string | null
          updated_at?: string | null
          user_id_1?: string
          user_id_2?: string
        }
        Relationships: [
          {
            foreignKeyName: "potential_family_matches_confirmed_by_fkey"
            columns: ["confirmed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "potential_family_matches_family_group_id_fkey"
            columns: ["family_group_id"]
            isOneToOne: false
            referencedRelation: "family_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "potential_family_matches_user_id_1_fkey"
            columns: ["user_id_1"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "potential_family_matches_user_id_2_fkey"
            columns: ["user_id_2"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      prayer_intercessors: {
        Row: {
          id: string
          prayed_at: string | null
          prayer_request_id: string
          user_id: string
        }
        Insert: {
          id?: string
          prayed_at?: string | null
          prayer_request_id: string
          user_id: string
        }
        Update: {
          id?: string
          prayed_at?: string | null
          prayer_request_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prayer_intercessors_prayer_request_id_fkey"
            columns: ["prayer_request_id"]
            isOneToOne: false
            referencedRelation: "prayer_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prayer_intercessors_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      prayer_requests: {
        Row: {
          answer_testimony: string | null
          answered_at: string | null
          answered_email_sent: boolean | null
          approved_at: string | null
          approved_by: string | null
          category: Database["public"]["Enums"]["prayer_category"] | null
          confirmation_email_sent: boolean | null
          created_at: string | null
          description: string
          flag_reason: string | null
          id: string
          is_anonymous: boolean | null
          is_approved: boolean | null
          is_flagged: boolean | null
          is_public: boolean | null
          is_urgent: boolean | null
          prayer_count: number | null
          requester_email: string | null
          requester_name: string | null
          requester_phone: string | null
          scripture_reference: string | null
          share_count: number | null
          status: Database["public"]["Enums"]["prayer_status"] | null
          title: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          answer_testimony?: string | null
          answered_at?: string | null
          answered_email_sent?: boolean | null
          approved_at?: string | null
          approved_by?: string | null
          category?: Database["public"]["Enums"]["prayer_category"] | null
          confirmation_email_sent?: boolean | null
          created_at?: string | null
          description: string
          flag_reason?: string | null
          id?: string
          is_anonymous?: boolean | null
          is_approved?: boolean | null
          is_flagged?: boolean | null
          is_public?: boolean | null
          is_urgent?: boolean | null
          prayer_count?: number | null
          requester_email?: string | null
          requester_name?: string | null
          requester_phone?: string | null
          scripture_reference?: string | null
          share_count?: number | null
          status?: Database["public"]["Enums"]["prayer_status"] | null
          title: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          answer_testimony?: string | null
          answered_at?: string | null
          answered_email_sent?: boolean | null
          approved_at?: string | null
          approved_by?: string | null
          category?: Database["public"]["Enums"]["prayer_category"] | null
          confirmation_email_sent?: boolean | null
          created_at?: string | null
          description?: string
          flag_reason?: string | null
          id?: string
          is_anonymous?: boolean | null
          is_approved?: boolean | null
          is_flagged?: boolean | null
          is_public?: boolean | null
          is_urgent?: boolean | null
          prayer_count?: number | null
          requester_email?: string | null
          requester_name?: string | null
          requester_phone?: string | null
          scripture_reference?: string | null
          share_count?: number | null
          status?: Database["public"]["Enums"]["prayer_status"] | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prayer_requests_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prayer_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      prayer_updates: {
        Row: {
          created_at: string | null
          id: string
          is_answered: boolean | null
          message: string
          prayer_request_id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_answered?: boolean | null
          message: string
          prayer_request_id: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_answered?: boolean | null
          message?: string
          prayer_request_id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prayer_updates_prayer_request_id_fkey"
            columns: ["prayer_request_id"]
            isOneToOne: false
            referencedRelation: "prayer_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prayer_updates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address_line_1: string | null
          address_line_2: string | null
          alt_phone: string | null
          avatar_url: string | null
          baptism_date: string | null
          bio: string | null
          city: string | null
          country: string | null
          county: string | null
          created_at: string | null
          date_of_birth: string | null
          deactivated_at: string | null
          deactivation_reason: string | null
          department_interest: string | null
          email: string
          email_verified: boolean | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          emergency_contact_relationship: string | null
          employer: string | null
          first_name: string | null
          gender: Database["public"]["Enums"]["gender_type"] | null
          how_did_you_hear: Database["public"]["Enums"]["visitor_source"] | null
          how_did_you_hear_other: string | null
          id: string
          interests: string[] | null
          is_baptized: boolean | null
          is_member: boolean | null
          is_onboarded: boolean | null
          last_login_at: string | null
          last_name: string | null
          login_count: number | null
          marital_status:
            | Database["public"]["Enums"]["marital_status_type"]
            | null
          member_id: string | null
          member_since: string | null
          middle_name: string | null
          occupation: string | null
          phone: string | null
          position_interest: string | null
          postal_code: string | null
          preferred_name: string | null
          previous_church: string | null
          receive_birthday_greeting: boolean | null
          receive_email_devotionals: boolean | null
          receive_email_events: boolean | null
          receive_email_newsletter: boolean | null
          receive_sms_notifications: boolean | null
          salvation_date: string | null
          spiritual_gifts: string[] | null
          status: Database["public"]["Enums"]["user_status"] | null
          title: Database["public"]["Enums"]["member_title"] | null
          updated_at: string | null
          wedding_anniversary: string | null
          whatsapp_number: string | null
        }
        Insert: {
          address_line_1?: string | null
          address_line_2?: string | null
          alt_phone?: string | null
          avatar_url?: string | null
          baptism_date?: string | null
          bio?: string | null
          city?: string | null
          country?: string | null
          county?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          deactivated_at?: string | null
          deactivation_reason?: string | null
          department_interest?: string | null
          email: string
          email_verified?: boolean | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          employer?: string | null
          first_name?: string | null
          gender?: Database["public"]["Enums"]["gender_type"] | null
          how_did_you_hear?:
            | Database["public"]["Enums"]["visitor_source"]
            | null
          how_did_you_hear_other?: string | null
          id: string
          interests?: string[] | null
          is_baptized?: boolean | null
          is_member?: boolean | null
          is_onboarded?: boolean | null
          last_login_at?: string | null
          last_name?: string | null
          login_count?: number | null
          marital_status?:
            | Database["public"]["Enums"]["marital_status_type"]
            | null
          member_id?: string | null
          member_since?: string | null
          middle_name?: string | null
          occupation?: string | null
          phone?: string | null
          position_interest?: string | null
          postal_code?: string | null
          preferred_name?: string | null
          previous_church?: string | null
          receive_birthday_greeting?: boolean | null
          receive_email_devotionals?: boolean | null
          receive_email_events?: boolean | null
          receive_email_newsletter?: boolean | null
          receive_sms_notifications?: boolean | null
          salvation_date?: string | null
          spiritual_gifts?: string[] | null
          status?: Database["public"]["Enums"]["user_status"] | null
          title?: Database["public"]["Enums"]["member_title"] | null
          updated_at?: string | null
          wedding_anniversary?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          address_line_1?: string | null
          address_line_2?: string | null
          alt_phone?: string | null
          avatar_url?: string | null
          baptism_date?: string | null
          bio?: string | null
          city?: string | null
          country?: string | null
          county?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          deactivated_at?: string | null
          deactivation_reason?: string | null
          department_interest?: string | null
          email?: string
          email_verified?: boolean | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          employer?: string | null
          first_name?: string | null
          gender?: Database["public"]["Enums"]["gender_type"] | null
          how_did_you_hear?:
            | Database["public"]["Enums"]["visitor_source"]
            | null
          how_did_you_hear_other?: string | null
          id?: string
          interests?: string[] | null
          is_baptized?: boolean | null
          is_member?: boolean | null
          is_onboarded?: boolean | null
          last_login_at?: string | null
          last_name?: string | null
          login_count?: number | null
          marital_status?:
            | Database["public"]["Enums"]["marital_status_type"]
            | null
          member_id?: string | null
          member_since?: string | null
          middle_name?: string | null
          occupation?: string | null
          phone?: string | null
          position_interest?: string | null
          postal_code?: string | null
          preferred_name?: string | null
          previous_church?: string | null
          receive_birthday_greeting?: boolean | null
          receive_email_devotionals?: boolean | null
          receive_email_events?: boolean | null
          receive_email_newsletter?: boolean | null
          receive_sms_notifications?: boolean | null
          salvation_date?: string | null
          spiritual_gifts?: string[] | null
          status?: Database["public"]["Enums"]["user_status"] | null
          title?: Database["public"]["Enums"]["member_title"] | null
          updated_at?: string | null
          wedding_anniversary?: string | null
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      recurring_donations: {
        Row: {
          amount: number
          cancellation_reason: string | null
          cancelled_at: string | null
          category_id: string | null
          created_at: string | null
          currency: string | null
          donation_count: number | null
          failed_payment_count: number | null
          frequency: Database["public"]["Enums"]["donation_frequency"]
          id: string
          is_active: boolean | null
          is_gift_aid: boolean | null
          last_payment_date: string | null
          last_payment_status:
            | Database["public"]["Enums"]["donation_status"]
            | null
          next_payment_date: string | null
          paused_at: string | null
          started_at: string | null
          stripe_customer_id: string | null
          stripe_price_id: string | null
          stripe_subscription_id: string | null
          total_donated: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          cancellation_reason?: string | null
          cancelled_at?: string | null
          category_id?: string | null
          created_at?: string | null
          currency?: string | null
          donation_count?: number | null
          failed_payment_count?: number | null
          frequency: Database["public"]["Enums"]["donation_frequency"]
          id?: string
          is_active?: boolean | null
          is_gift_aid?: boolean | null
          last_payment_date?: string | null
          last_payment_status?:
            | Database["public"]["Enums"]["donation_status"]
            | null
          next_payment_date?: string | null
          paused_at?: string | null
          started_at?: string | null
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          total_donated?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          cancellation_reason?: string | null
          cancelled_at?: string | null
          category_id?: string | null
          created_at?: string | null
          currency?: string | null
          donation_count?: number | null
          failed_payment_count?: number | null
          frequency?: Database["public"]["Enums"]["donation_frequency"]
          id?: string
          is_active?: boolean | null
          is_gift_aid?: boolean | null
          last_payment_date?: string | null
          last_payment_status?:
            | Database["public"]["Enums"]["donation_status"]
            | null
          next_payment_date?: string | null
          paused_at?: string | null
          started_at?: string | null
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          total_donated?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_donations_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "donation_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_donations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          created_at: string | null
          file_url: string | null
          format: string
          id: string
          name: string
          status: string
          type: string
        }
        Insert: {
          created_at?: string | null
          file_url?: string | null
          format?: string
          id?: string
          name: string
          status?: string
          type: string
        }
        Update: {
          created_at?: string | null
          file_url?: string | null
          format?: string
          id?: string
          name?: string
          status?: string
          type?: string
        }
        Relationships: []
      }
      resources: {
        Row: {
          access_level: string | null
          category: string | null
          created_at: string | null
          download_count: number | null
          file_size: string | null
          file_url: string | null
          id: string
          name: string
          type: string
          updated_at: string | null
        }
        Insert: {
          access_level?: string | null
          category?: string | null
          created_at?: string | null
          download_count?: number | null
          file_size?: string | null
          file_url?: string | null
          id?: string
          name: string
          type: string
          updated_at?: string | null
        }
        Update: {
          access_level?: string | null
          category?: string | null
          created_at?: string | null
          download_count?: number | null
          file_size?: string | null
          file_url?: string | null
          id?: string
          name?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      roles: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_system_role: boolean | null
          name: string
          permissions: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_system_role?: boolean | null
          name: string
          permissions?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_system_role?: boolean | null
          name?: string
          permissions?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      scheduled_jobs: {
        Row: {
          created_at: string | null
          cron_expression: string
          description: string | null
          fail_count: number | null
          id: string
          is_active: boolean | null
          job_name: string
          last_error: string | null
          last_run_at: string | null
          last_run_duration_ms: number | null
          last_run_status: string | null
          metadata: Json | null
          next_run_at: string | null
          run_count: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          cron_expression: string
          description?: string | null
          fail_count?: number | null
          id?: string
          is_active?: boolean | null
          job_name: string
          last_error?: string | null
          last_run_at?: string | null
          last_run_duration_ms?: number | null
          last_run_status?: string | null
          metadata?: Json | null
          next_run_at?: string | null
          run_count?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          cron_expression?: string
          description?: string | null
          fail_count?: number | null
          id?: string
          is_active?: boolean | null
          job_name?: string
          last_error?: string | null
          last_run_at?: string | null
          last_run_duration_ms?: number | null
          last_run_status?: string | null
          metadata?: Json | null
          next_run_at?: string | null
          run_count?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      sermon_bookmarks: {
        Row: {
          created_at: string | null
          id: string
          notes: string | null
          sermon_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          notes?: string | null
          sermon_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          notes?: string | null
          sermon_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sermon_bookmarks_sermon_id_fkey"
            columns: ["sermon_id"]
            isOneToOne: false
            referencedRelation: "sermons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sermon_bookmarks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sermon_comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_approved: boolean | null
          is_pinned: boolean | null
          likes_count: number | null
          parent_id: string | null
          sermon_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_approved?: boolean | null
          is_pinned?: boolean | null
          likes_count?: number | null
          parent_id?: string | null
          sermon_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_approved?: boolean | null
          is_pinned?: boolean | null
          likes_count?: number | null
          parent_id?: string | null
          sermon_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sermon_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "sermon_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sermon_comments_sermon_id_fkey"
            columns: ["sermon_id"]
            isOneToOne: false
            referencedRelation: "sermons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sermon_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sermon_series: {
        Row: {
          cover_image_url: string | null
          created_at: string | null
          description: string | null
          end_date: string | null
          id: string
          is_featured: boolean | null
          slug: string
          sort_order: number | null
          start_date: string | null
          status: Database["public"]["Enums"]["content_status"] | null
          title: string
          total_sermons: number | null
          trailer_video_url: string | null
          updated_at: string | null
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_featured?: boolean | null
          slug: string
          sort_order?: number | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["content_status"] | null
          title: string
          total_sermons?: number | null
          trailer_video_url?: string | null
          updated_at?: string | null
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_featured?: boolean | null
          slug?: string
          sort_order?: number | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["content_status"] | null
          title?: string
          total_sermons?: number | null
          trailer_video_url?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      sermon_speakers: {
        Row: {
          bio: string | null
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          is_guest: boolean | null
          name: string
          phone: string | null
          photo_url: string | null
          social_instagram: string | null
          social_twitter: string | null
          sort_order: number | null
          title: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          is_guest?: boolean | null
          name: string
          phone?: string | null
          photo_url?: string | null
          social_instagram?: string | null
          social_twitter?: string | null
          sort_order?: number | null
          title?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          is_guest?: boolean | null
          name?: string
          phone?: string | null
          photo_url?: string | null
          social_instagram?: string | null
          social_twitter?: string | null
          sort_order?: number | null
          title?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      sermons: {
        Row: {
          allow_download: boolean | null
          audio_url: string | null
          created_at: string | null
          description: string | null
          download_count: number | null
          duration_minutes: number | null
          id: string
          is_featured: boolean | null
          notes_pdf_url: string | null
          play_count: number | null
          scripture_reference: string | null
          scripture_text: string | null
          series_id: string | null
          series_order: number | null
          sermon_date: string
          service_type: string | null
          slug: string
          speaker_id: string | null
          status: Database["public"]["Enums"]["content_status"] | null
          tags: string[] | null
          thumbnail_url: string | null
          title: string
          transcript_url: string | null
          updated_at: string | null
          video_embed_url: string | null
          video_url: string | null
          view_count: number | null
        }
        Insert: {
          allow_download?: boolean | null
          audio_url?: string | null
          created_at?: string | null
          description?: string | null
          download_count?: number | null
          duration_minutes?: number | null
          id?: string
          is_featured?: boolean | null
          notes_pdf_url?: string | null
          play_count?: number | null
          scripture_reference?: string | null
          scripture_text?: string | null
          series_id?: string | null
          series_order?: number | null
          sermon_date: string
          service_type?: string | null
          slug: string
          speaker_id?: string | null
          status?: Database["public"]["Enums"]["content_status"] | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title: string
          transcript_url?: string | null
          updated_at?: string | null
          video_embed_url?: string | null
          video_url?: string | null
          view_count?: number | null
        }
        Update: {
          allow_download?: boolean | null
          audio_url?: string | null
          created_at?: string | null
          description?: string | null
          download_count?: number | null
          duration_minutes?: number | null
          id?: string
          is_featured?: boolean | null
          notes_pdf_url?: string | null
          play_count?: number | null
          scripture_reference?: string | null
          scripture_text?: string | null
          series_id?: string | null
          series_order?: number | null
          sermon_date?: string
          service_type?: string | null
          slug?: string
          speaker_id?: string | null
          status?: Database["public"]["Enums"]["content_status"] | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string
          transcript_url?: string | null
          updated_at?: string | null
          video_embed_url?: string | null
          video_url?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sermons_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "sermon_series"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sermons_speaker_id_fkey"
            columns: ["speaker_id"]
            isOneToOne: false
            referencedRelation: "sermon_speakers"
            referencedColumns: ["id"]
          },
        ]
      }
      service_times: {
        Row: {
          created_at: string | null
          day_of_week: string
          description: string | null
          end_time: string | null
          id: string
          is_active: boolean | null
          is_online: boolean | null
          location: string | null
          name: string
          sort_order: number | null
          start_time: string
          stream_link: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          day_of_week: string
          description?: string | null
          end_time?: string | null
          id?: string
          is_active?: boolean | null
          is_online?: boolean | null
          location?: string | null
          name: string
          sort_order?: number | null
          start_time: string
          stream_link?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          day_of_week?: string
          description?: string | null
          end_time?: string | null
          id?: string
          is_active?: boolean | null
          is_online?: boolean | null
          location?: string | null
          name?: string
          sort_order?: number | null
          start_time?: string
          stream_link?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      small_group_members: {
        Row: {
          created_at: string | null
          group_id: string
          id: string
          is_active: boolean | null
          joined_at: string | null
          role: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          group_id: string
          id?: string
          is_active?: boolean | null
          joined_at?: string | null
          role?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          group_id?: string
          id?: string
          is_active?: boolean | null
          joined_at?: string | null
          role?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "small_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "small_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "small_group_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      small_groups: {
        Row: {
          area: string | null
          co_leader_id: string | null
          cover_image_url: string | null
          created_at: string | null
          current_members: number | null
          description: string | null
          group_type: string | null
          id: string
          is_accepting_members: boolean | null
          is_active: boolean | null
          is_online: boolean | null
          leader_id: string | null
          max_members: number | null
          meeting_day: string | null
          meeting_link: string | null
          meeting_location: string | null
          meeting_time: string | null
          name: string
          updated_at: string | null
        }
        Insert: {
          area?: string | null
          co_leader_id?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          current_members?: number | null
          description?: string | null
          group_type?: string | null
          id?: string
          is_accepting_members?: boolean | null
          is_active?: boolean | null
          is_online?: boolean | null
          leader_id?: string | null
          max_members?: number | null
          meeting_day?: string | null
          meeting_link?: string | null
          meeting_location?: string | null
          meeting_time?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          area?: string | null
          co_leader_id?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          current_members?: number | null
          description?: string | null
          group_type?: string | null
          id?: string
          is_accepting_members?: boolean | null
          is_active?: boolean | null
          is_online?: boolean | null
          leader_id?: string | null
          max_members?: number | null
          meeting_day?: string | null
          meeting_link?: string | null
          meeting_location?: string | null
          meeting_time?: string | null
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "small_groups_co_leader_id_fkey"
            columns: ["co_leader_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "small_groups_leader_id_fkey"
            columns: ["leader_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assignee_id: string | null
          category: string | null
          comments: Json | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          priority: string
          status: string
          subtasks: Json | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assignee_id?: string | null
          category?: string | null
          comments?: Json | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          status?: string
          subtasks?: Json | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assignee_id?: string | null
          category?: string | null
          comments?: Json | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          status?: string
          subtasks?: Json | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      testimonies: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          author_name: string
          author_photo_url: string | null
          category: string | null
          content: string
          created_at: string | null
          id: string
          is_approved: boolean | null
          is_featured: boolean | null
          photo_url: string | null
          short_quote: string | null
          status: Database["public"]["Enums"]["content_status"] | null
          title: string
          updated_at: string | null
          user_id: string | null
          video_url: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          author_name: string
          author_photo_url?: string | null
          category?: string | null
          content: string
          created_at?: string | null
          id?: string
          is_approved?: boolean | null
          is_featured?: boolean | null
          photo_url?: string | null
          short_quote?: string | null
          status?: Database["public"]["Enums"]["content_status"] | null
          title: string
          updated_at?: string | null
          user_id?: string | null
          video_url?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          author_name?: string
          author_photo_url?: string | null
          category?: string | null
          content?: string
          created_at?: string | null
          id?: string
          is_approved?: boolean | null
          is_featured?: boolean | null
          photo_url?: string | null
          short_quote?: string | null
          status?: Database["public"]["Enums"]["content_status"] | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "testimonies_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "testimonies_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          role_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          role_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          role_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      visitor_cards: {
        Row: {
          address: string | null
          city: string | null
          contact_method: string | null
          contacted_at: string | null
          contacted_by: string | null
          converted_to_member: boolean | null
          converted_user_id: string | null
          created_at: string | null
          date_of_birth: string | null
          email: string | null
          first_name: string
          follow_up_notes: string | null
          how_did_you_hear: Database["public"]["Enums"]["visitor_source"] | null
          how_did_you_hear_other: string | null
          id: string
          is_contacted: boolean | null
          last_name: string
          phone: string | null
          postal_code: string | null
          prayer_request: string | null
          second_visit: boolean | null
          updated_at: string | null
          visit_date: string | null
          visited_service: string | null
          want_more_info: boolean | null
          want_newsletter: boolean | null
          want_to_join_group: boolean | null
          want_to_volunteer: boolean | null
          welcome_email_sent: boolean | null
          welcome_email_sent_at: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          contact_method?: string | null
          contacted_at?: string | null
          contacted_by?: string | null
          converted_to_member?: boolean | null
          converted_user_id?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string | null
          first_name: string
          follow_up_notes?: string | null
          how_did_you_hear?:
            | Database["public"]["Enums"]["visitor_source"]
            | null
          how_did_you_hear_other?: string | null
          id?: string
          is_contacted?: boolean | null
          last_name: string
          phone?: string | null
          postal_code?: string | null
          prayer_request?: string | null
          second_visit?: boolean | null
          updated_at?: string | null
          visit_date?: string | null
          visited_service?: string | null
          want_more_info?: boolean | null
          want_newsletter?: boolean | null
          want_to_join_group?: boolean | null
          want_to_volunteer?: boolean | null
          welcome_email_sent?: boolean | null
          welcome_email_sent_at?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          contact_method?: string | null
          contacted_at?: string | null
          contacted_by?: string | null
          converted_to_member?: boolean | null
          converted_user_id?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string | null
          first_name?: string
          follow_up_notes?: string | null
          how_did_you_hear?:
            | Database["public"]["Enums"]["visitor_source"]
            | null
          how_did_you_hear_other?: string | null
          id?: string
          is_contacted?: boolean | null
          last_name?: string
          phone?: string | null
          postal_code?: string | null
          prayer_request?: string | null
          second_visit?: boolean | null
          updated_at?: string | null
          visit_date?: string | null
          visited_service?: string | null
          want_more_info?: boolean | null
          want_newsletter?: boolean | null
          want_to_join_group?: boolean | null
          want_to_volunteer?: boolean | null
          welcome_email_sent?: boolean | null
          welcome_email_sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "visitor_cards_contacted_by_fkey"
            columns: ["contacted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visitor_cards_converted_user_id_fkey"
            columns: ["converted_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      volunteer_applications: {
        Row: {
          applicant_email: string
          applicant_name: string
          applicant_phone: string | null
          availability: string | null
          confirmation_email_sent: boolean | null
          created_at: string | null
          decision_email_sent: boolean | null
          department_id: string
          experience: string | null
          has_dbs_check: boolean | null
          id: string
          interview_date: string | null
          interview_notes: string | null
          interviewer_id: string | null
          motivation: string
          position_id: string
          preferred_start_date: string | null
          references_provided: string | null
          rejection_reason: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          skills: string[] | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          applicant_email: string
          applicant_name: string
          applicant_phone?: string | null
          availability?: string | null
          confirmation_email_sent?: boolean | null
          created_at?: string | null
          decision_email_sent?: boolean | null
          department_id: string
          experience?: string | null
          has_dbs_check?: boolean | null
          id?: string
          interview_date?: string | null
          interview_notes?: string | null
          interviewer_id?: string | null
          motivation: string
          position_id: string
          preferred_start_date?: string | null
          references_provided?: string | null
          rejection_reason?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          skills?: string[] | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          applicant_email?: string
          applicant_name?: string
          applicant_phone?: string | null
          availability?: string | null
          confirmation_email_sent?: boolean | null
          created_at?: string | null
          decision_email_sent?: boolean | null
          department_id?: string
          experience?: string | null
          has_dbs_check?: boolean | null
          id?: string
          interview_date?: string | null
          interview_notes?: string | null
          interviewer_id?: string | null
          motivation?: string
          position_id?: string
          preferred_start_date?: string | null
          references_provided?: string | null
          rejection_reason?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          skills?: string[] | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "volunteer_applications_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "church_departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_applications_interviewer_id_fkey"
            columns: ["interviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_applications_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "church_positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_applications_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_applications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      worker_schedules: {
        Row: {
          attended: boolean | null
          created_at: string | null
          created_by: string | null
          department_id: string
          id: string
          is_confirmed: boolean | null
          is_swap_requested: boolean | null
          notes: string | null
          role_for_day: string | null
          schedule_date: string
          service_name: string | null
          shift_end: string | null
          shift_start: string | null
          swap_with_user_id: string | null
          updated_at: string | null
          user_id: string
          worker_id: string
        }
        Insert: {
          attended?: boolean | null
          created_at?: string | null
          created_by?: string | null
          department_id: string
          id?: string
          is_confirmed?: boolean | null
          is_swap_requested?: boolean | null
          notes?: string | null
          role_for_day?: string | null
          schedule_date: string
          service_name?: string | null
          shift_end?: string | null
          shift_start?: string | null
          swap_with_user_id?: string | null
          updated_at?: string | null
          user_id: string
          worker_id: string
        }
        Update: {
          attended?: boolean | null
          created_at?: string | null
          created_by?: string | null
          department_id?: string
          id?: string
          is_confirmed?: boolean | null
          is_swap_requested?: boolean | null
          notes?: string | null
          role_for_day?: string | null
          schedule_date?: string
          service_name?: string | null
          shift_end?: string | null
          shift_start?: string | null
          swap_with_user_id?: string | null
          updated_at?: string | null
          user_id?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "worker_schedules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "worker_schedules_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "church_departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "worker_schedules_swap_with_user_id_fkey"
            columns: ["swap_with_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "worker_schedules_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "worker_schedules_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "church_workers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      decrement_event_attendees: {
        Args: { event_id_param: string }
        Returns: undefined
      }
      generate_member_id: { Args: never; Returns: string }
      increment_event_attendees: {
        Args: { event_id_param: string }
        Returns: undefined
      }
      is_admin: { Args: never; Returns: boolean }
      is_pastor_or_above: { Args: never; Returns: boolean }
      is_worker: { Args: never; Returns: boolean }
      track_user_login: { Args: { p_user_id: string }; Returns: undefined }
      user_has_role: {
        Args: { p_role_name: string; p_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      attendance_type: "in_person" | "online" | "absent"
      content_status: "draft" | "published" | "archived" | "scheduled"
      donation_frequency:
        | "one-time"
        | "weekly"
        | "bi-weekly"
        | "monthly"
        | "quarterly"
        | "yearly"
      donation_status:
        | "pending"
        | "completed"
        | "failed"
        | "refunded"
        | "cancelled"
      email_status: "queued" | "sending" | "sent" | "failed" | "bounced"
      event_status:
        | "upcoming"
        | "ongoing"
        | "completed"
        | "cancelled"
        | "postponed"
      event_type:
        | "service"
        | "conference"
        | "retreat"
        | "workshop"
        | "outreach"
        | "fellowship"
        | "youth"
        | "prayer_meeting"
        | "other"
      gender_type: "male" | "female" | "prefer_not_to_say"
      marital_status_type:
        | "single"
        | "married"
        | "widowed"
        | "divorced"
        | "prefer_not_to_say"
      member_title:
        | "Mr"
        | "Mrs"
        | "Ms"
        | "Dr"
        | "Pastor"
        | "Deacon"
        | "Deaconess"
        | "Elder"
        | "Minister"
        | "Bishop"
        | "Evangelist"
        | "Apostle"
        | "Prophet"
      milestone_type:
        | "salvation"
        | "baptism"
        | "membership"
        | "marriage"
        | "child_dedication"
        | "ordination"
        | "anniversary"
        | "other"
      notification_type:
        | "info"
        | "reminder"
        | "prayer"
        | "event"
        | "donation"
        | "announcement"
        | "system"
      prayer_category:
        | "health"
        | "family"
        | "finance"
        | "salvation"
        | "marriage"
        | "career"
        | "spiritual_growth"
        | "grief"
        | "thanksgiving"
        | "other"
      prayer_status: "pending" | "praying" | "answered" | "closed"
      stream_status: "scheduled" | "live" | "ended" | "cancelled"
      user_status: "active" | "inactive" | "suspended" | "pending_verification"
      visitor_source:
        | "website"
        | "social_media"
        | "friend"
        | "family"
        | "flyer"
        | "walk_in"
        | "google"
        | "other"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      attendance_type: ["in_person", "online", "absent"],
      content_status: ["draft", "published", "archived", "scheduled"],
      donation_frequency: [
        "one-time",
        "weekly",
        "bi-weekly",
        "monthly",
        "quarterly",
        "yearly",
      ],
      donation_status: [
        "pending",
        "completed",
        "failed",
        "refunded",
        "cancelled",
      ],
      email_status: ["queued", "sending", "sent", "failed", "bounced"],
      event_status: [
        "upcoming",
        "ongoing",
        "completed",
        "cancelled",
        "postponed",
      ],
      event_type: [
        "service",
        "conference",
        "retreat",
        "workshop",
        "outreach",
        "fellowship",
        "youth",
        "prayer_meeting",
        "other",
      ],
      gender_type: ["male", "female", "prefer_not_to_say"],
      marital_status_type: [
        "single",
        "married",
        "widowed",
        "divorced",
        "prefer_not_to_say",
      ],
      member_title: [
        "Mr",
        "Mrs",
        "Ms",
        "Dr",
        "Pastor",
        "Deacon",
        "Deaconess",
        "Elder",
        "Minister",
        "Bishop",
        "Evangelist",
        "Apostle",
        "Prophet",
      ],
      milestone_type: [
        "salvation",
        "baptism",
        "membership",
        "marriage",
        "child_dedication",
        "ordination",
        "anniversary",
        "other",
      ],
      notification_type: [
        "info",
        "reminder",
        "prayer",
        "event",
        "donation",
        "announcement",
        "system",
      ],
      prayer_category: [
        "health",
        "family",
        "finance",
        "salvation",
        "marriage",
        "career",
        "spiritual_growth",
        "grief",
        "thanksgiving",
        "other",
      ],
      prayer_status: ["pending", "praying", "answered", "closed"],
      stream_status: ["scheduled", "live", "ended", "cancelled"],
      user_status: ["active", "inactive", "suspended", "pending_verification"],
      visitor_source: [
        "website",
        "social_media",
        "friend",
        "family",
        "flyer",
        "walk_in",
        "google",
        "other",
      ],
    },
  },
} as const

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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_audit_logs: {
        Row: {
          action: string
          admin_user_id: string
          claim_request_id: string | null
          id: string
          metadata: Json | null
          timestamp: string
        }
        Insert: {
          action: string
          admin_user_id: string
          claim_request_id?: string | null
          id?: string
          metadata?: Json | null
          timestamp?: string
        }
        Update: {
          action?: string
          admin_user_id?: string
          claim_request_id?: string | null
          id?: string
          metadata?: Json | null
          timestamp?: string
        }
        Relationships: []
      }
      ambassador_competitions: {
        Row: {
          created_at: string
          ended_at: string | null
          id: string
          prize_amount: number
          prize_currency: string
          round_number: number
          started_at: string
          status: string
          target_reviews: number
          winner_id: string | null
        }
        Insert: {
          created_at?: string
          ended_at?: string | null
          id?: string
          prize_amount?: number
          prize_currency?: string
          round_number?: number
          started_at?: string
          status?: string
          target_reviews?: number
          winner_id?: string | null
        }
        Update: {
          created_at?: string
          ended_at?: string | null
          id?: string
          prize_amount?: number
          prize_currency?: string
          round_number?: number
          started_at?: string
          status?: string
          target_reviews?: number
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ambassador_competitions_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "referrers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ambassador_competitions_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "referrers_leaderboard"
            referencedColumns: ["id"]
          },
        ]
      }
      benefit_confirmations: {
        Row: {
          benefit_id: string
          created_at: string
          id: string
          review_id: string
        }
        Insert: {
          benefit_id: string
          created_at?: string
          id?: string
          review_id: string
        }
        Update: {
          benefit_id?: string
          created_at?: string
          id?: string
          review_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "benefit_confirmations_benefit_id_fkey"
            columns: ["benefit_id"]
            isOneToOne: false
            referencedRelation: "company_benefits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "benefit_confirmations_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "benefit_confirmations_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews_public"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          allowed_email_domains: string[] | null
          ceo: string | null
          claimed_at: string | null
          claimed_by: string | null
          created_at: string
          description: string | null
          employee_count: string | null
          headquarters: string | null
          id: string
          industry: string | null
          is_claimed: boolean | null
          linkedin_url: string | null
          location: string | null
          logo_url: string | null
          mission: string | null
          name: string
          slug: string
          updated_at: string
          website: string | null
          year_founded: number | null
        }
        Insert: {
          allowed_email_domains?: string[] | null
          ceo?: string | null
          claimed_at?: string | null
          claimed_by?: string | null
          created_at?: string
          description?: string | null
          employee_count?: string | null
          headquarters?: string | null
          id?: string
          industry?: string | null
          is_claimed?: boolean | null
          linkedin_url?: string | null
          location?: string | null
          logo_url?: string | null
          mission?: string | null
          name: string
          slug: string
          updated_at?: string
          website?: string | null
          year_founded?: number | null
        }
        Update: {
          allowed_email_domains?: string[] | null
          ceo?: string | null
          claimed_at?: string | null
          claimed_by?: string | null
          created_at?: string
          description?: string | null
          employee_count?: string | null
          headquarters?: string | null
          id?: string
          industry?: string | null
          is_claimed?: boolean | null
          linkedin_url?: string | null
          location?: string | null
          logo_url?: string | null
          mission?: string | null
          name?: string
          slug?: string
          updated_at?: string
          website?: string | null
          year_founded?: number | null
        }
        Relationships: []
      }
      company_benefits: {
        Row: {
          benefit_name: string
          company_id: string
          created_at: string
          id: string
        }
        Insert: {
          benefit_name: string
          company_id: string
          created_at?: string
          id?: string
        }
        Update: {
          benefit_name?: string
          company_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_benefits_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_claim_requests: {
        Row: {
          anonymized_at: string | null
          authorization_confirmed: boolean
          company_name: string
          company_website: string | null
          created_at: string
          flagged: boolean | null
          full_name: string
          id: string
          job_title: string | null
          message: string | null
          phone_number: string | null
          phone_number_encrypted: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          supervisor_email: string | null
          supervisor_email_encrypted: string | null
          supervisor_name: string | null
          supervisor_name_encrypted: string | null
          user_id: string | null
          work_email: string
        }
        Insert: {
          anonymized_at?: string | null
          authorization_confirmed?: boolean
          company_name: string
          company_website?: string | null
          created_at?: string
          flagged?: boolean | null
          full_name: string
          id?: string
          job_title?: string | null
          message?: string | null
          phone_number?: string | null
          phone_number_encrypted?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          supervisor_email?: string | null
          supervisor_email_encrypted?: string | null
          supervisor_name?: string | null
          supervisor_name_encrypted?: string | null
          user_id?: string | null
          work_email: string
        }
        Update: {
          anonymized_at?: string | null
          authorization_confirmed?: boolean
          company_name?: string
          company_website?: string | null
          created_at?: string
          flagged?: boolean | null
          full_name?: string
          id?: string
          job_title?: string | null
          message?: string | null
          phone_number?: string | null
          phone_number_encrypted?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          supervisor_email?: string | null
          supervisor_email_encrypted?: string | null
          supervisor_name?: string | null
          supervisor_name_encrypted?: string | null
          user_id?: string | null
          work_email?: string
        }
        Relationships: []
      }
      company_requests: {
        Row: {
          admin_notes: string | null
          company_name: string
          created_at: string
          id: string
          industry: string | null
          location: string | null
          requester_email: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          website: string | null
        }
        Insert: {
          admin_notes?: string | null
          company_name: string
          created_at?: string
          id?: string
          industry?: string | null
          location?: string | null
          requester_email?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          website?: string | null
        }
        Update: {
          admin_notes?: string | null
          company_name?: string
          created_at?: string
          id?: string
          industry?: string | null
          location?: string | null
          requester_email?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          website?: string | null
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          read_at: string | null
          replied_at: string | null
          subject: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          read_at?: string | null
          replied_at?: string | null
          subject: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          read_at?: string | null
          replied_at?: string | null
          subject?: string
        }
        Relationships: []
      }
      employer_feedback: {
        Row: {
          company_id: string
          content: string
          created_at: string
          id: string
          title: string
        }
        Insert: {
          company_id: string
          content: string
          created_at?: string
          id?: string
          title: string
        }
        Update: {
          company_id?: string
          content?: string
          created_at?: string
          id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "employer_feedback_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      employer_profiles: {
        Row: {
          company_id: string | null
          created_at: string
          id: string
          job_title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          id?: string
          job_title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          id?: string
          job_title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employer_profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      employment_verifications: {
        Row: {
          admin_notes: string | null
          company_id: string
          contact_email_encrypted: string | null
          created_at: string
          email_domain: string
          file_path: string
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          verification_method: string
          verification_session_id: string
        }
        Insert: {
          admin_notes?: string | null
          company_id: string
          contact_email_encrypted?: string | null
          created_at?: string
          email_domain: string
          file_path: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          verification_method?: string
          verification_session_id: string
        }
        Update: {
          admin_notes?: string | null
          company_id?: string
          contact_email_encrypted?: string | null
          created_at?: string
          email_domain?: string
          file_path?: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          verification_method?: string
          verification_session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "paystub_verifications_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "paystub_verifications_verification_session_id_fkey"
            columns: ["verification_session_id"]
            isOneToOne: false
            referencedRelation: "verification_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_flags: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          flag_key: string
          flag_label: string
          id: string
          is_enabled: boolean
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          flag_key: string
          flag_label: string
          id?: string
          is_enabled?: boolean
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          flag_key?: string
          flag_label?: string
          id?: string
          is_enabled?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      form_configurations: {
        Row: {
          benefits_section_description: string | null
          benefits_section_display_order: number | null
          benefits_section_icon: string | null
          benefits_section_title: string | null
          benefits_section_visible: boolean | null
          created_at: string | null
          description: string | null
          form_type: string
          header_icon: string | null
          id: string
          is_active: boolean | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          benefits_section_description?: string | null
          benefits_section_display_order?: number | null
          benefits_section_icon?: string | null
          benefits_section_title?: string | null
          benefits_section_visible?: boolean | null
          created_at?: string | null
          description?: string | null
          form_type: string
          header_icon?: string | null
          id?: string
          is_active?: boolean | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          benefits_section_description?: string | null
          benefits_section_display_order?: number | null
          benefits_section_icon?: string | null
          benefits_section_title?: string | null
          benefits_section_visible?: boolean | null
          created_at?: string | null
          description?: string | null
          form_type?: string
          header_icon?: string | null
          id?: string
          is_active?: boolean | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      form_fields: {
        Row: {
          allow_other_text: boolean | null
          created_at: string | null
          description: string | null
          display_order: number
          field_key: string
          field_label: string
          field_type: string
          form_config_id: string
          id: string
          is_required: boolean | null
          is_visible: boolean | null
          options: Json | null
          other_text_placeholder: string | null
          placeholder: string | null
          section_id: string | null
          updated_at: string | null
          validation_rules: Json | null
        }
        Insert: {
          allow_other_text?: boolean | null
          created_at?: string | null
          description?: string | null
          display_order: number
          field_key: string
          field_label: string
          field_type: string
          form_config_id: string
          id?: string
          is_required?: boolean | null
          is_visible?: boolean | null
          options?: Json | null
          other_text_placeholder?: string | null
          placeholder?: string | null
          section_id?: string | null
          updated_at?: string | null
          validation_rules?: Json | null
        }
        Update: {
          allow_other_text?: boolean | null
          created_at?: string | null
          description?: string | null
          display_order?: number
          field_key?: string
          field_label?: string
          field_type?: string
          form_config_id?: string
          id?: string
          is_required?: boolean | null
          is_visible?: boolean | null
          options?: Json | null
          other_text_placeholder?: string | null
          placeholder?: string | null
          section_id?: string | null
          updated_at?: string | null
          validation_rules?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "form_fields_form_config_id_fkey"
            columns: ["form_config_id"]
            isOneToOne: false
            referencedRelation: "form_configurations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_fields_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "form_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      form_sections: {
        Row: {
          created_at: string | null
          display_order: number
          form_config_id: string
          id: string
          is_visible: boolean | null
          section_description: string | null
          section_icon: string | null
          section_key: string
          section_title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_order: number
          form_config_id: string
          id?: string
          is_visible?: boolean | null
          section_description?: string | null
          section_icon?: string | null
          section_key: string
          section_title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number
          form_config_id?: string
          id?: string
          is_visible?: boolean | null
          section_description?: string | null
          section_icon?: string | null
          section_key?: string
          section_title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "form_sections_form_config_id_fkey"
            columns: ["form_config_id"]
            isOneToOne: false
            referencedRelation: "form_configurations"
            referencedColumns: ["id"]
          },
        ]
      }
      job_applications: {
        Row: {
          cover_letter: string | null
          created_at: string
          email: string
          employer_notes: string | null
          full_name: string
          id: string
          job_id: string
          linkedin_url: string | null
          phone: string | null
          portfolio_url: string | null
          resume_url: string | null
          status: string
          updated_at: string
        }
        Insert: {
          cover_letter?: string | null
          created_at?: string
          email: string
          employer_notes?: string | null
          full_name: string
          id?: string
          job_id: string
          linkedin_url?: string | null
          phone?: string | null
          portfolio_url?: string | null
          resume_url?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          cover_letter?: string | null
          created_at?: string
          email?: string
          employer_notes?: string | null
          full_name?: string
          id?: string
          job_id?: string
          linkedin_url?: string | null
          phone?: string | null
          portfolio_url?: string | null
          resume_url?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          archive_reason: string | null
          archived_at: string | null
          company_id: string
          created_at: string
          department: string | null
          description: string
          experience_level: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          is_remote: boolean | null
          job_type: string
          location: string | null
          posted_by_admin: string | null
          requirements: string | null
          responsibilities: string | null
          salary_currency: string | null
          salary_max: number | null
          salary_min: number | null
          source_type: string
          source_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          archive_reason?: string | null
          archived_at?: string | null
          company_id: string
          created_at?: string
          department?: string | null
          description: string
          experience_level?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          is_remote?: boolean | null
          job_type?: string
          location?: string | null
          posted_by_admin?: string | null
          requirements?: string | null
          responsibilities?: string | null
          salary_currency?: string | null
          salary_max?: number | null
          salary_min?: number | null
          source_type?: string
          source_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          archive_reason?: string | null
          archived_at?: string | null
          company_id?: string
          created_at?: string
          department?: string | null
          description?: string
          experience_level?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          is_remote?: boolean | null
          job_type?: string
          location?: string | null
          posted_by_admin?: string | null
          requirements?: string | null
          responsibilities?: string | null
          salary_currency?: string | null
          salary_max?: number | null
          salary_min?: number | null
          source_type?: string
          source_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          description: string | null
          id: string
          setting_key: string
          setting_type: string
          setting_value: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          description?: string | null
          id?: string
          setting_key: string
          setting_type?: string
          setting_value?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          description?: string | null
          id?: string
          setting_key?: string
          setting_type?: string
          setting_value?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      rate_limit_entries: {
        Row: {
          created_at: string
          endpoint: string
          id: string
          ip_address: string
        }
        Insert: {
          created_at?: string
          endpoint: string
          id?: string
          ip_address: string
        }
        Update: {
          created_at?: string
          endpoint?: string
          id?: string
          ip_address?: string
        }
        Relationships: []
      }
      rating_categories: {
        Row: {
          category: string
          id: string
          rating: number
          review_id: string
        }
        Insert: {
          category: string
          id?: string
          rating: number
          review_id: string
        }
        Update: {
          category?: string
          id?: string
          rating?: number
          review_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rating_categories_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rating_categories_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews_public"
            referencedColumns: ["id"]
          },
        ]
      }
      rating_category_configs: {
        Row: {
          category_description: string | null
          category_key: string
          category_label: string
          created_at: string | null
          display_order: number
          id: string
          is_active: boolean | null
        }
        Insert: {
          category_description?: string | null
          category_key: string
          category_label: string
          created_at?: string | null
          display_order: number
          id?: string
          is_active?: boolean | null
        }
        Update: {
          category_description?: string | null
          category_key?: string
          category_label?: string
          created_at?: string | null
          display_order?: number
          id?: string
          is_active?: boolean | null
        }
        Relationships: []
      }
      referrer_payout_reviews: {
        Row: {
          created_at: string
          id: string
          payout_amount: number
          payout_id: string
          review_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          payout_amount: number
          payout_id: string
          review_id: string
        }
        Update: {
          created_at?: string
          id?: string
          payout_amount?: number
          payout_id?: string
          review_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrer_payout_reviews_payout_id_fkey"
            columns: ["payout_id"]
            isOneToOne: false
            referencedRelation: "referrer_payouts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrer_payout_reviews_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: true
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrer_payout_reviews_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: true
            referencedRelation: "reviews_public"
            referencedColumns: ["id"]
          },
        ]
      }
      referrer_payouts: {
        Row: {
          amount: number
          created_at: string
          created_by: string
          currency: string
          id: string
          notes: string | null
          payment_method: string
          payment_reference: string | null
          payout_date: string
          referrer_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by: string
          currency?: string
          id?: string
          notes?: string | null
          payment_method: string
          payment_reference?: string | null
          payout_date: string
          referrer_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string
          currency?: string
          id?: string
          notes?: string | null
          payment_method?: string
          payment_reference?: string | null
          payout_date?: string
          referrer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrer_payouts_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "referrers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrer_payouts_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "referrers_leaderboard"
            referencedColumns: ["id"]
          },
        ]
      }
      referrers: {
        Row: {
          admin_notes: string | null
          approved_at: string | null
          approved_by: string | null
          approved_review_count: number
          created_at: string
          email: string
          full_name: string
          id: string
          last_activity_at: string | null
          linkedin_url: string | null
          partner_status: string | null
          payout_rate: number | null
          phone_number: string | null
          referral_code: string | null
          review_count: number
          status: string
        }
        Insert: {
          admin_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          approved_review_count?: number
          created_at?: string
          email: string
          full_name: string
          id?: string
          last_activity_at?: string | null
          linkedin_url?: string | null
          partner_status?: string | null
          payout_rate?: number | null
          phone_number?: string | null
          referral_code?: string | null
          review_count?: number
          status?: string
        }
        Update: {
          admin_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          approved_review_count?: number
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          last_activity_at?: string | null
          linkedin_url?: string | null
          partner_status?: string | null
          payout_rate?: number | null
          phone_number?: string | null
          referral_code?: string | null
          review_count?: number
          status?: string
        }
        Relationships: []
      }
      review_helpful_votes: {
        Row: {
          created_at: string
          id: string
          review_id: string
          voter_ip_hash: string
        }
        Insert: {
          created_at?: string
          id?: string
          review_id: string
          voter_ip_hash: string
        }
        Update: {
          created_at?: string
          id?: string
          review_id?: string
          voter_ip_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_helpful_votes_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_helpful_votes_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews_public"
            referencedColumns: ["id"]
          },
        ]
      }
      review_reports: {
        Row: {
          created_at: string | null
          details: string | null
          id: string
          reason: string
          reported_section: string | null
          reporter_ip: string | null
          review_id: string
        }
        Insert: {
          created_at?: string | null
          details?: string | null
          id?: string
          reason: string
          reported_section?: string | null
          reporter_ip?: string | null
          review_id: string
        }
        Update: {
          created_at?: string | null
          details?: string | null
          id?: string
          reason?: string
          reported_section?: string | null
          reporter_ip?: string | null
          review_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_reports_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_reports_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews_public"
            referencedColumns: ["id"]
          },
        ]
      }
      review_responses: {
        Row: {
          company_id: string
          created_at: string
          id: string
          responder_id: string
          response_text: string
          review_id: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          responder_id: string
          response_text: string
          review_id: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          responder_id?: string
          response_text?: string
          review_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_responses_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_responses_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: true
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_responses_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: true
            referencedRelation: "reviews_public"
            referencedColumns: ["id"]
          },
        ]
      }
      review_rewards: {
        Row: {
          created_at: string
          id: string
          phone_number_encrypted: string
          review_id: string
          sent_at: string | null
          sent_by: string | null
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          phone_number_encrypted: string
          review_id: string
          sent_at?: string | null
          sent_by?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          phone_number_encrypted?: string
          review_id?: string
          sent_at?: string | null
          sent_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_rewards_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: true
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_rewards_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: true
            referencedRelation: "reviews_public"
            referencedColumns: ["id"]
          },
        ]
      }
      review_sections: {
        Row: {
          ai_fraud_summary: Json | null
          ai_moderation_summary: Json | null
          company_id: string
          created_at: string
          id: string
          moderation_status: string
          redactions: Json | null
          review_session_id: string
          section_data: Json
          section_type: string
        }
        Insert: {
          ai_fraud_summary?: Json | null
          ai_moderation_summary?: Json | null
          company_id: string
          created_at?: string
          id?: string
          moderation_status?: string
          redactions?: Json | null
          review_session_id: string
          section_data?: Json
          section_type: string
        }
        Update: {
          ai_fraud_summary?: Json | null
          ai_moderation_summary?: Json | null
          company_id?: string
          created_at?: string
          id?: string
          moderation_status?: string
          redactions?: Json | null
          review_session_id?: string
          section_data?: Json
          section_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_sections_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_sections_review_session_id_fkey"
            columns: ["review_session_id"]
            isOneToOne: false
            referencedRelation: "review_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      review_sessions: {
        Row: {
          company_id: string
          created_at: string
          expires_at: string
          id: string
          referral_code: string | null
          referrer_id: string | null
          session_token_hash: string
          verification_session_id: string | null
          verification_type: string
        }
        Insert: {
          company_id: string
          created_at?: string
          expires_at: string
          id?: string
          referral_code?: string | null
          referrer_id?: string | null
          session_token_hash: string
          verification_session_id?: string | null
          verification_type?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          referral_code?: string | null
          referrer_id?: string | null
          session_token_hash?: string
          verification_session_id?: string | null
          verification_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_sessions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_sessions_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "referrers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_sessions_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "referrers_leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_sessions_verification_session_id_fkey"
            columns: ["verification_session_id"]
            isOneToOne: false
            referencedRelation: "verification_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      review_similarity_flags: {
        Row: {
          created_at: string
          details: Json | null
          flag_type: string
          id: string
          matched_review_id: string | null
          review_id: string
        }
        Insert: {
          created_at?: string
          details?: Json | null
          flag_type: string
          id?: string
          matched_review_id?: string | null
          review_id: string
        }
        Update: {
          created_at?: string
          details?: Json | null
          flag_type?: string
          id?: string
          matched_review_id?: string | null
          review_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_similarity_flags_matched_review_id_fkey"
            columns: ["matched_review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_similarity_flags_matched_review_id_fkey"
            columns: ["matched_review_id"]
            isOneToOne: false
            referencedRelation: "reviews_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_similarity_flags_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_similarity_flags_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews_public"
            referencedColumns: ["id"]
          },
        ]
      }
      review_standard_benefits: {
        Row: {
          created_at: string | null
          id: string
          review_id: string
          standard_benefit_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          review_id: string
          standard_benefit_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          review_id?: string
          standard_benefit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_standard_benefits_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_standard_benefits_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_standard_benefits_standard_benefit_id_fkey"
            columns: ["standard_benefit_id"]
            isOneToOne: false
            referencedRelation: "standard_benefits"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          advice: string | null
          age_range: string | null
          ai_fraud_summary: Json | null
          ai_moderation_summary: Json | null
          allowances_amount: number | null
          allowances_currency: string | null
          base_salary_amount: number | null
          base_salary_currency: string | null
          bonus_amount: number | null
          bonus_currency: string | null
          ceo_approval: boolean | null
          company_id: string
          cons: string
          created_at: string
          department: string | null
          did_interview: boolean | null
          education_level: string | null
          employment_status: string | null
          employment_type: string | null
          end_year: number | null
          ethnicity: string | null
          flagged: boolean | null
          gender: string | null
          helpful_count: number | null
          hidden_fields: string[] | null
          id: string
          interview_count: number | null
          interview_description: string | null
          interview_difficulty: string | null
          interview_experience_rating: number | null
          interview_tips: string | null
          is_net_salary: boolean | null
          market_alignment: string | null
          moderated_at: string | null
          moderated_by: string | null
          moderation_justification: Json | null
          moderation_notes: string | null
          moderation_status: string | null
          pay_transparency: string | null
          private_feedback: string | null
          pros: string
          rating: number
          recommend_to_friend: boolean | null
          referral_code: string | null
          referrer_id: string | null
          report_count: number | null
          review_session_id: string | null
          role_focus: string | null
          role_level: string | null
          role_title: string | null
          salary_range: string | null
          tenure_range: string | null
          title: string
          updated_at: string
          verification_token: string
          verification_type: string
        }
        Insert: {
          advice?: string | null
          age_range?: string | null
          ai_fraud_summary?: Json | null
          ai_moderation_summary?: Json | null
          allowances_amount?: number | null
          allowances_currency?: string | null
          base_salary_amount?: number | null
          base_salary_currency?: string | null
          bonus_amount?: number | null
          bonus_currency?: string | null
          ceo_approval?: boolean | null
          company_id: string
          cons: string
          created_at?: string
          department?: string | null
          did_interview?: boolean | null
          education_level?: string | null
          employment_status?: string | null
          employment_type?: string | null
          end_year?: number | null
          ethnicity?: string | null
          flagged?: boolean | null
          gender?: string | null
          helpful_count?: number | null
          hidden_fields?: string[] | null
          id?: string
          interview_count?: number | null
          interview_description?: string | null
          interview_difficulty?: string | null
          interview_experience_rating?: number | null
          interview_tips?: string | null
          is_net_salary?: boolean | null
          market_alignment?: string | null
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_justification?: Json | null
          moderation_notes?: string | null
          moderation_status?: string | null
          pay_transparency?: string | null
          private_feedback?: string | null
          pros: string
          rating: number
          recommend_to_friend?: boolean | null
          referral_code?: string | null
          referrer_id?: string | null
          report_count?: number | null
          review_session_id?: string | null
          role_focus?: string | null
          role_level?: string | null
          role_title?: string | null
          salary_range?: string | null
          tenure_range?: string | null
          title: string
          updated_at?: string
          verification_token: string
          verification_type?: string
        }
        Update: {
          advice?: string | null
          age_range?: string | null
          ai_fraud_summary?: Json | null
          ai_moderation_summary?: Json | null
          allowances_amount?: number | null
          allowances_currency?: string | null
          base_salary_amount?: number | null
          base_salary_currency?: string | null
          bonus_amount?: number | null
          bonus_currency?: string | null
          ceo_approval?: boolean | null
          company_id?: string
          cons?: string
          created_at?: string
          department?: string | null
          did_interview?: boolean | null
          education_level?: string | null
          employment_status?: string | null
          employment_type?: string | null
          end_year?: number | null
          ethnicity?: string | null
          flagged?: boolean | null
          gender?: string | null
          helpful_count?: number | null
          hidden_fields?: string[] | null
          id?: string
          interview_count?: number | null
          interview_description?: string | null
          interview_difficulty?: string | null
          interview_experience_rating?: number | null
          interview_tips?: string | null
          is_net_salary?: boolean | null
          market_alignment?: string | null
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_justification?: Json | null
          moderation_notes?: string | null
          moderation_status?: string | null
          pay_transparency?: string | null
          private_feedback?: string | null
          pros?: string
          rating?: number
          recommend_to_friend?: boolean | null
          referral_code?: string | null
          referrer_id?: string | null
          report_count?: number | null
          review_session_id?: string | null
          role_focus?: string | null
          role_level?: string | null
          role_title?: string | null
          salary_range?: string | null
          tenure_range?: string | null
          title?: string
          updated_at?: string
          verification_token?: string
          verification_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "referrers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "referrers_leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_review_session_id_fkey"
            columns: ["review_session_id"]
            isOneToOne: false
            referencedRelation: "review_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      salaries: {
        Row: {
          company_id: string
          created_at: string
          currency: string | null
          id: string
          role_title: string
          salary_max: number | null
          salary_min: number | null
          verification_token: string
        }
        Insert: {
          company_id: string
          created_at?: string
          currency?: string | null
          id?: string
          role_title: string
          salary_max?: number | null
          salary_min?: number | null
          verification_token: string
        }
        Update: {
          company_id?: string
          created_at?: string
          currency?: string | null
          id?: string
          role_title?: string
          salary_max?: number | null
          salary_min?: number | null
          verification_token?: string
        }
        Relationships: [
          {
            foreignKeyName: "salaries_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      salary_confirmations: {
        Row: {
          company_id: string
          created_at: string
          id: string
          role_level: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          role_level: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          role_level?: string
        }
        Relationships: []
      }
      session_events: {
        Row: {
          created_at: string
          event_data: Json | null
          event_type: string
          id: string
          review_session_id: string
        }
        Insert: {
          created_at?: string
          event_data?: Json | null
          event_type: string
          id?: string
          review_session_id: string
        }
        Update: {
          created_at?: string
          event_data?: Json | null
          event_type?: string
          id?: string
          review_session_id?: string
        }
        Relationships: []
      }
      social_posts: {
        Row: {
          caption: string
          created_at: string
          id: string
          image_url: string
          platforms: Json
          posted_by: string | null
        }
        Insert: {
          caption: string
          created_at?: string
          id?: string
          image_url: string
          platforms?: Json
          posted_by?: string | null
        }
        Update: {
          caption?: string
          created_at?: string
          id?: string
          image_url?: string
          platforms?: Json
          posted_by?: string | null
        }
        Relationships: []
      }
      standard_benefits: {
        Row: {
          benefit_key: string
          benefit_label: string
          created_at: string | null
          display_order: number
          id: string
          is_active: boolean | null
        }
        Insert: {
          benefit_key: string
          benefit_label: string
          created_at?: string | null
          display_order: number
          id?: string
          is_active?: boolean | null
        }
        Update: {
          benefit_key?: string
          benefit_label?: string
          created_at?: string | null
          display_order?: number
          id?: string
          is_active?: boolean | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      verification_sessions: {
        Row: {
          company_id: string
          created_at: string
          email_domain: string
          expires_at: string
          id: string
          referrer_id: string | null
          request_ip: string | null
          review_submitted: boolean | null
          review_token_hash: string | null
          token_hash: string
          verification_code_attempts: number
          verification_code_expires_at: string | null
          verification_code_hash: string | null
          verified: boolean | null
          verified_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          email_domain: string
          expires_at: string
          id?: string
          referrer_id?: string | null
          request_ip?: string | null
          review_submitted?: boolean | null
          review_token_hash?: string | null
          token_hash: string
          verification_code_attempts?: number
          verification_code_expires_at?: string | null
          verification_code_hash?: string | null
          verified?: boolean | null
          verified_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          email_domain?: string
          expires_at?: string
          id?: string
          referrer_id?: string | null
          request_ip?: string | null
          review_submitted?: boolean | null
          review_token_hash?: string | null
          token_hash?: string
          verification_code_attempts?: number
          verification_code_expires_at?: string | null
          verification_code_hash?: string | null
          verified?: boolean | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "verification_sessions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verification_sessions_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "referrers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verification_sessions_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "referrers_leaderboard"
            referencedColumns: ["id"]
          },
        ]
      }
      waitlist: {
        Row: {
          company_name: string | null
          created_at: string
          email: string
          id: string
          plan_interest: string
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          email: string
          id?: string
          plan_interest: string
        }
        Update: {
          company_name?: string | null
          created_at?: string
          email?: string
          id?: string
          plan_interest?: string
        }
        Relationships: []
      }
    }
    Views: {
      claim_requests_list: {
        Row: {
          company_name: string | null
          created_at: string | null
          id: string | null
          reviewed_at: string | null
          status: string | null
          work_email: string | null
        }
        Insert: {
          company_name?: string | null
          created_at?: string | null
          id?: string | null
          reviewed_at?: string | null
          status?: string | null
          work_email?: string | null
        }
        Update: {
          company_name?: string | null
          created_at?: string | null
          id?: string | null
          reviewed_at?: string | null
          status?: string | null
          work_email?: string | null
        }
        Relationships: []
      }
      referrers_leaderboard: {
        Row: {
          approved_review_count: number | null
          full_name: string | null
          id: string | null
          partner_status: string | null
          review_count: number | null
          status: string | null
        }
        Insert: {
          approved_review_count?: number | null
          full_name?: string | null
          id?: string | null
          partner_status?: string | null
          review_count?: number | null
          status?: string | null
        }
        Update: {
          approved_review_count?: number | null
          full_name?: string | null
          id?: string | null
          partner_status?: string | null
          review_count?: number | null
          status?: string | null
        }
        Relationships: []
      }
      review_sections_public: {
        Row: {
          company_id: string | null
          created_at: string | null
          id: string | null
          redactions: Json | null
          section_data: Json | null
          section_type: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          id?: string | null
          redactions?: Json | null
          section_data?: Json | null
          section_type?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          id?: string | null
          redactions?: Json | null
          section_data?: Json | null
          section_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "review_sections_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews_public: {
        Row: {
          advice: string | null
          age_range: string | null
          allowances_amount: number | null
          allowances_currency: string | null
          base_salary_amount: number | null
          base_salary_currency: string | null
          bonus_amount: number | null
          bonus_currency: string | null
          ceo_approval: boolean | null
          company_id: string | null
          cons: string | null
          created_at: string | null
          department: string | null
          did_interview: boolean | null
          education_level: string | null
          employment_status: string | null
          employment_type: string | null
          end_year: number | null
          ethnicity: string | null
          gender: string | null
          helpful_count: number | null
          hidden_fields: string[] | null
          id: string | null
          interview_count: number | null
          interview_description: string | null
          interview_difficulty: string | null
          interview_experience_rating: number | null
          interview_tips: string | null
          is_net_salary: boolean | null
          market_alignment: string | null
          pay_transparency: string | null
          pros: string | null
          rating: number | null
          recommend_to_friend: boolean | null
          role_level: string | null
          role_title: string | null
          salary_range: string | null
          tenure_range: string | null
          title: string | null
          updated_at: string | null
          verification_type: string | null
        }
        Insert: {
          advice?: string | null
          age_range?: never
          allowances_amount?: number | null
          allowances_currency?: string | null
          base_salary_amount?: number | null
          base_salary_currency?: string | null
          bonus_amount?: number | null
          bonus_currency?: string | null
          ceo_approval?: boolean | null
          company_id?: string | null
          cons?: string | null
          created_at?: never
          department?: never
          did_interview?: boolean | null
          education_level?: never
          employment_status?: string | null
          employment_type?: string | null
          end_year?: number | null
          ethnicity?: never
          gender?: never
          helpful_count?: number | null
          hidden_fields?: string[] | null
          id?: string | null
          interview_count?: number | null
          interview_description?: string | null
          interview_difficulty?: string | null
          interview_experience_rating?: number | null
          interview_tips?: string | null
          is_net_salary?: boolean | null
          market_alignment?: string | null
          pay_transparency?: string | null
          pros?: string | null
          rating?: number | null
          recommend_to_friend?: boolean | null
          role_level?: never
          role_title?: never
          salary_range?: string | null
          tenure_range?: never
          title?: string | null
          updated_at?: string | null
          verification_type?: string | null
        }
        Update: {
          advice?: string | null
          age_range?: never
          allowances_amount?: number | null
          allowances_currency?: string | null
          base_salary_amount?: number | null
          base_salary_currency?: string | null
          bonus_amount?: number | null
          bonus_currency?: string | null
          ceo_approval?: boolean | null
          company_id?: string | null
          cons?: string | null
          created_at?: never
          department?: never
          did_interview?: boolean | null
          education_level?: never
          employment_status?: string | null
          employment_type?: string | null
          end_year?: number | null
          ethnicity?: never
          gender?: never
          helpful_count?: number | null
          hidden_fields?: string[] | null
          id?: string | null
          interview_count?: number | null
          interview_description?: string | null
          interview_difficulty?: string | null
          interview_experience_rating?: number | null
          interview_tips?: string | null
          is_net_salary?: boolean | null
          market_alignment?: string | null
          pay_transparency?: string | null
          pros?: string | null
          rating?: number | null
          recommend_to_friend?: boolean | null
          role_level?: never
          role_title?: never
          salary_range?: string | null
          tenure_range?: never
          title?: string | null
          updated_at?: string | null
          verification_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      salaries_public: {
        Row: {
          company_id: string | null
          created_at: string | null
          currency: string | null
          id: string | null
          role_title: string | null
          salary_max: number | null
          salary_min: number | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string | null
          role_title?: string | null
          salary_max?: number | null
          salary_min?: number | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string | null
          role_title?: string | null
          salary_max?: number | null
          salary_min?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "salaries_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      has_claim_access: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_helpful_count:
        | { Args: { p_review_id: string }; Returns: undefined }
        | {
            Args: { p_review_id: string; p_voter_ip_hash: string }
            Returns: boolean
          }
      increment_salary_confirmation: {
        Args: { p_company_id: string; p_role_level: string }
        Returns: number
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "employer" | "super_admin" | "support_admin"
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
      app_role: ["admin", "employer", "super_admin", "support_admin"],
    },
  },
} as const

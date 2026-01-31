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
      climate_responses: {
        Row: {
          company_id: string | null
          id: string
          overall_average: number | null
          raw_scores: Json | null
          section_averages: Json | null
          submitted_at: string
          user_id: string
        }
        Insert: {
          company_id?: string | null
          id?: string
          overall_average?: number | null
          raw_scores?: Json | null
          section_averages?: Json | null
          submitted_at?: string
          user_id: string
        }
        Update: {
          company_id?: string | null
          id?: string
          overall_average?: number | null
          raw_scores?: Json | null
          section_averages?: Json | null
          submitted_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "climate_responses_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "climate_responses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          address: string | null
          created_at: string
          culture_values: string[] | null
          description: string | null
          email: string | null
          foundation_year: number | null
          id: string
          industry: string | null
          logo_url: string | null
          name: string
          size_range: string | null
          updated_at: string
          vat_number: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          culture_values?: string[] | null
          description?: string | null
          email?: string | null
          foundation_year?: number | null
          id?: string
          industry?: string | null
          logo_url?: string | null
          name: string
          size_range?: string | null
          updated_at?: string
          vat_number?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          culture_values?: string[] | null
          description?: string | null
          email?: string | null
          foundation_year?: number | null
          id?: string
          industry?: string | null
          logo_url?: string | null
          name?: string
          size_range?: string | null
          updated_at?: string
          vat_number?: string | null
          website?: string | null
        }
        Relationships: []
      }
      company_ccnl_selections: {
        Row: {
          ccnl_code: string
          ccnl_label: string
          company_id: string
          created_at: string | null
          id: string
          is_primary: boolean | null
        }
        Insert: {
          ccnl_code: string
          ccnl_label: string
          company_id: string
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
        }
        Update: {
          ccnl_code?: string
          ccnl_label?: string
          company_id?: string
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "company_ccnl_selections_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_compliance_history: {
        Row: {
          action: string
          compliance_status_id: string
          created_at: string | null
          document_url: string | null
          id: string
          new_status: string | null
          notes: string | null
          old_status: string | null
          performed_by: string | null
        }
        Insert: {
          action: string
          compliance_status_id: string
          created_at?: string | null
          document_url?: string | null
          id?: string
          new_status?: string | null
          notes?: string | null
          old_status?: string | null
          performed_by?: string | null
        }
        Update: {
          action?: string
          compliance_status_id?: string
          created_at?: string | null
          document_url?: string | null
          id?: string
          new_status?: string | null
          notes?: string | null
          old_status?: string | null
          performed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_compliance_history_compliance_status_id_fkey"
            columns: ["compliance_status_id"]
            isOneToOne: false
            referencedRelation: "company_compliance_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_compliance_history_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      company_compliance_status: {
        Row: {
          company_id: string
          created_at: string | null
          document_name: string | null
          document_url: string | null
          id: string
          last_reminder_sent: string | null
          notes: string | null
          requirement_id: string
          status: string
          updated_at: string | null
          uploaded_at: string | null
          uploaded_by: string | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          document_name?: string | null
          document_url?: string | null
          id?: string
          last_reminder_sent?: string | null
          notes?: string | null
          requirement_id: string
          status?: string
          updated_at?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          document_name?: string | null
          document_url?: string | null
          id?: string
          last_reminder_sent?: string | null
          notes?: string | null
          requirement_id?: string
          status?: string
          updated_at?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_compliance_status_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_compliance_status_requirement_id_fkey"
            columns: ["requirement_id"]
            isOneToOne: false
            referencedRelation: "compliance_requirements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_compliance_status_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      company_members: {
        Row: {
          company_id: string
          created_at: string
          department_id: string | null
          id: string
          invited_at: string | null
          is_hiring: boolean | null
          job_title: string | null
          joined_at: string | null
          placeholder_email: string | null
          placeholder_first_name: string | null
          placeholder_last_name: string | null
          required_profile: Json | null
          role: Database["public"]["Enums"]["app_role"]
          status: Database["public"]["Enums"]["member_status"]
          user_id: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          department_id?: string | null
          id?: string
          invited_at?: string | null
          is_hiring?: boolean | null
          job_title?: string | null
          joined_at?: string | null
          placeholder_email?: string | null
          placeholder_first_name?: string | null
          placeholder_last_name?: string | null
          required_profile?: Json | null
          role?: Database["public"]["Enums"]["app_role"]
          status?: Database["public"]["Enums"]["member_status"]
          user_id?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          department_id?: string | null
          id?: string
          invited_at?: string | null
          is_hiring?: boolean | null
          job_title?: string | null
          joined_at?: string | null
          placeholder_email?: string | null
          placeholder_first_name?: string | null
          placeholder_last_name?: string | null
          required_profile?: Json | null
          role?: Database["public"]["Enums"]["app_role"]
          status?: Database["public"]["Enums"]["member_status"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_members_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_members_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "org_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      company_role_assignments: {
        Row: {
          assignment_type: Database["public"]["Enums"]["assignment_type"]
          company_member_id: string | null
          created_at: string
          end_date: string | null
          fte_percentage: number
          id: string
          notes: string | null
          role_id: string
          start_date: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          assignment_type?: Database["public"]["Enums"]["assignment_type"]
          company_member_id?: string | null
          created_at?: string
          end_date?: string | null
          fte_percentage?: number
          id?: string
          notes?: string | null
          role_id: string
          start_date?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          assignment_type?: Database["public"]["Enums"]["assignment_type"]
          company_member_id?: string | null
          created_at?: string
          end_date?: string | null
          fte_percentage?: number
          id?: string
          notes?: string | null
          role_id?: string
          start_date?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_role_assignments_company_member_id_fkey"
            columns: ["company_member_id"]
            isOneToOne: false
            referencedRelation: "company_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_role_assignments_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "company_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_role_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      company_roles: {
        Row: {
          ccnl_level: string | null
          code: string | null
          company_id: string
          contract_type: Database["public"]["Enums"]["contract_type"] | null
          created_at: string
          daily_tasks: Json | null
          description: string | null
          headcount: number
          id: string
          is_hiring: boolean
          kpis: Json | null
          org_node_id: string | null
          ral_range_max: number | null
          ral_range_min: number | null
          remote_policy: Database["public"]["Enums"]["remote_policy"] | null
          reports_to_role_id: string | null
          required_certifications: Json | null
          required_education: Json | null
          required_hard_skills: Json | null
          required_languages: Json | null
          required_seniority:
            | Database["public"]["Enums"]["seniority_level"]
            | null
          required_soft_skills: Json | null
          responsibilities: Json | null
          status: Database["public"]["Enums"]["role_status"]
          title: string
          updated_at: string
          work_hours_type: Database["public"]["Enums"]["work_hours_type"] | null
          years_experience_max: number | null
          years_experience_min: number | null
        }
        Insert: {
          ccnl_level?: string | null
          code?: string | null
          company_id: string
          contract_type?: Database["public"]["Enums"]["contract_type"] | null
          created_at?: string
          daily_tasks?: Json | null
          description?: string | null
          headcount?: number
          id?: string
          is_hiring?: boolean
          kpis?: Json | null
          org_node_id?: string | null
          ral_range_max?: number | null
          ral_range_min?: number | null
          remote_policy?: Database["public"]["Enums"]["remote_policy"] | null
          reports_to_role_id?: string | null
          required_certifications?: Json | null
          required_education?: Json | null
          required_hard_skills?: Json | null
          required_languages?: Json | null
          required_seniority?:
            | Database["public"]["Enums"]["seniority_level"]
            | null
          required_soft_skills?: Json | null
          responsibilities?: Json | null
          status?: Database["public"]["Enums"]["role_status"]
          title: string
          updated_at?: string
          work_hours_type?:
            | Database["public"]["Enums"]["work_hours_type"]
            | null
          years_experience_max?: number | null
          years_experience_min?: number | null
        }
        Update: {
          ccnl_level?: string | null
          code?: string | null
          company_id?: string
          contract_type?: Database["public"]["Enums"]["contract_type"] | null
          created_at?: string
          daily_tasks?: Json | null
          description?: string | null
          headcount?: number
          id?: string
          is_hiring?: boolean
          kpis?: Json | null
          org_node_id?: string | null
          ral_range_max?: number | null
          ral_range_min?: number | null
          remote_policy?: Database["public"]["Enums"]["remote_policy"] | null
          reports_to_role_id?: string | null
          required_certifications?: Json | null
          required_education?: Json | null
          required_hard_skills?: Json | null
          required_languages?: Json | null
          required_seniority?:
            | Database["public"]["Enums"]["seniority_level"]
            | null
          required_soft_skills?: Json | null
          responsibilities?: Json | null
          status?: Database["public"]["Enums"]["role_status"]
          title?: string
          updated_at?: string
          work_hours_type?:
            | Database["public"]["Enums"]["work_hours_type"]
            | null
          years_experience_max?: number | null
          years_experience_min?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "company_roles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_roles_org_node_id_fkey"
            columns: ["org_node_id"]
            isOneToOne: false
            referencedRelation: "org_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_roles_reports_to_role_id_fkey"
            columns: ["reports_to_role_id"]
            isOneToOne: false
            referencedRelation: "company_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      company_subscriptions: {
        Row: {
          company_id: string
          created_at: string | null
          current_period_end: string
          current_period_start: string
          id: string
          plan_id: string
          profile_views_used: number | null
          status: string
          stripe_subscription_id: string | null
          updated_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          current_period_end?: string
          current_period_start?: string
          id?: string
          plan_id: string
          profile_views_used?: number | null
          status?: string
          stripe_subscription_id?: string | null
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          current_period_end?: string
          current_period_start?: string
          id?: string
          plan_id?: string
          profile_views_used?: number | null
          status?: string
          stripe_subscription_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_subscriptions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_requirements: {
        Row: {
          category: string
          ccnl_scope: string
          created_at: string | null
          deadline_type: string | null
          description: string
          document_required: string
          fixed_deadline_day: number | null
          fixed_deadline_month: number | null
          frequency: string
          frequency_months: number | null
          id: string
          is_active: boolean | null
          obligation_name: string
          sort_order: number | null
        }
        Insert: {
          category: string
          ccnl_scope: string
          created_at?: string | null
          deadline_type?: string | null
          description: string
          document_required: string
          fixed_deadline_day?: number | null
          fixed_deadline_month?: number | null
          frequency: string
          frequency_months?: number | null
          id?: string
          is_active?: boolean | null
          obligation_name: string
          sort_order?: number | null
        }
        Update: {
          category?: string
          ccnl_scope?: string
          created_at?: string | null
          deadline_type?: string | null
          description?: string
          document_required?: string
          fixed_deadline_day?: number | null
          fixed_deadline_month?: number | null
          frequency?: string
          frequency_months?: number | null
          id?: string
          is_active?: boolean | null
          obligation_name?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      hard_skills_catalog: {
        Row: {
          category: string | null
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      job_suggestions: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          ideal_score: Json | null
          riasec_code: string
          sector: string | null
          title: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          ideal_score?: Json | null
          riasec_code: string
          sector?: string | null
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          ideal_score?: Json | null
          riasec_code?: string
          sector?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_suggestions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      karma_bot_configs: {
        Row: {
          bot_type: string
          closing_patterns: Json
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean
          max_exchanges: number
          model: string
          objectives: Json
          profile_inputs: Json
          system_prompt: string
          temperature: number | null
          version: number
          version_notes: string | null
        }
        Insert: {
          bot_type: string
          closing_patterns?: Json
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean
          max_exchanges?: number
          model?: string
          objectives?: Json
          profile_inputs?: Json
          system_prompt: string
          temperature?: number | null
          version?: number
          version_notes?: string | null
        }
        Update: {
          bot_type?: string
          closing_patterns?: Json
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean
          max_exchanges?: number
          model?: string
          objectives?: Json
          profile_inputs?: Json
          system_prompt?: string
          temperature?: number | null
          version?: number
          version_notes?: string | null
        }
        Relationships: []
      }
      karma_bot_documents: {
        Row: {
          bot_type: string
          created_at: string | null
          extracted_text: string | null
          extraction_status: string | null
          file_name: string
          file_path: string
          file_size_bytes: number
          id: string
          is_active: boolean | null
          mime_type: string
          uploaded_by: string | null
        }
        Insert: {
          bot_type: string
          created_at?: string | null
          extracted_text?: string | null
          extraction_status?: string | null
          file_name: string
          file_path: string
          file_size_bytes: number
          id?: string
          is_active?: boolean | null
          mime_type: string
          uploaded_by?: string | null
        }
        Update: {
          bot_type?: string
          created_at?: string | null
          extracted_text?: string | null
          extraction_status?: string | null
          file_name?: string
          file_path?: string
          file_size_bytes?: number
          id?: string
          is_active?: boolean | null
          mime_type?: string
          uploaded_by?: string | null
        }
        Relationships: []
      }
      karma_sessions: {
        Row: {
          company_id: string | null
          completed_at: string | null
          id: string
          primary_values: string[] | null
          risk_factors: string[] | null
          seniority_assessment:
            | Database["public"]["Enums"]["seniority_level"]
            | null
          soft_skills: string[] | null
          summary: string | null
          transcript: Json | null
          user_id: string
        }
        Insert: {
          company_id?: string | null
          completed_at?: string | null
          id?: string
          primary_values?: string[] | null
          risk_factors?: string[] | null
          seniority_assessment?:
            | Database["public"]["Enums"]["seniority_level"]
            | null
          soft_skills?: string[] | null
          summary?: string | null
          transcript?: Json | null
          user_id: string
        }
        Update: {
          company_id?: string | null
          completed_at?: string | null
          id?: string
          primary_values?: string[] | null
          risk_factors?: string[] | null
          seniority_assessment?:
            | Database["public"]["Enums"]["seniority_level"]
            | null
          soft_skills?: string[] | null
          summary?: string | null
          transcript?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "karma_sessions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "karma_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      org_nodes: {
        Row: {
          company_id: string
          created_at: string
          id: string
          is_cultural_driver: boolean | null
          name: string
          parent_node_id: string | null
          sort_order: number | null
          target_profile: Json | null
          type: Database["public"]["Enums"]["org_node_type"]
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          is_cultural_driver?: boolean | null
          name: string
          parent_node_id?: string | null
          sort_order?: number | null
          target_profile?: Json | null
          type?: Database["public"]["Enums"]["org_node_type"]
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          is_cultural_driver?: boolean | null
          name?: string
          parent_node_id?: string | null
          sort_order?: number | null
          target_profile?: Json | null
          type?: Database["public"]["Enums"]["org_node_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_nodes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_nodes_parent_node_id_fkey"
            columns: ["parent_node_id"]
            isOneToOne: false
            referencedRelation: "org_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      position_shortlists: {
        Row: {
          company_id: string
          created_at: string | null
          id: string
          notes: string | null
          position_id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          id?: string
          notes?: string | null
          position_id: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          position_id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "position_shortlists_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "position_shortlists_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "company_members"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_views_log: {
        Row: {
          id: string
          viewed_at: string | null
          viewed_profile_id: string
          viewer_company_id: string
        }
        Insert: {
          id?: string
          viewed_at?: string | null
          viewed_profile_id: string
          viewer_company_id: string
        }
        Update: {
          id?: string
          viewed_at?: string | null
          viewed_profile_id?: string
          viewer_company_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_views_log_viewed_profile_id_fkey"
            columns: ["viewed_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_views_log_viewer_company_id_fkey"
            columns: ["viewer_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          age: number | null
          avatar_url: string | null
          bio: string | null
          birth_date: string | null
          created_at: string
          email: string
          first_name: string | null
          gender: Database["public"]["Enums"]["gender_type"] | null
          headline: string | null
          id: string
          is_karma_profile: boolean | null
          job_title: string | null
          last_name: string | null
          location: string | null
          looking_for_work: boolean | null
          preferred_work_type: string | null
          profile_visibility: string | null
          region: string | null
          updated_at: string
          wants_karma_visibility: boolean | null
          years_experience: number | null
        }
        Insert: {
          age?: number | null
          avatar_url?: string | null
          bio?: string | null
          birth_date?: string | null
          created_at?: string
          email: string
          first_name?: string | null
          gender?: Database["public"]["Enums"]["gender_type"] | null
          headline?: string | null
          id: string
          is_karma_profile?: boolean | null
          job_title?: string | null
          last_name?: string | null
          location?: string | null
          looking_for_work?: boolean | null
          preferred_work_type?: string | null
          profile_visibility?: string | null
          region?: string | null
          updated_at?: string
          wants_karma_visibility?: boolean | null
          years_experience?: number | null
        }
        Update: {
          age?: number | null
          avatar_url?: string | null
          bio?: string | null
          birth_date?: string | null
          created_at?: string
          email?: string
          first_name?: string | null
          gender?: Database["public"]["Enums"]["gender_type"] | null
          headline?: string | null
          id?: string
          is_karma_profile?: boolean | null
          job_title?: string | null
          last_name?: string | null
          location?: string | null
          looking_for_work?: boolean | null
          preferred_work_type?: string | null
          profile_visibility?: string | null
          region?: string | null
          updated_at?: string
          wants_karma_visibility?: boolean | null
          years_experience?: number | null
        }
        Relationships: []
      }
      question_options: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          image_url: string | null
          metadata: Json | null
          option_text: string
          question_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          image_url?: string | null
          metadata?: Json | null
          option_text: string
          question_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          image_url?: string | null
          metadata?: Json | null
          option_text?: string
          question_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "question_options_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      questionnaire_sections: {
        Row: {
          config: Json | null
          created_at: string
          description: string | null
          id: string
          questionnaire_id: string
          section_type: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          config?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          questionnaire_id: string
          section_type?: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          config?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          questionnaire_id?: string
          section_type?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "questionnaire_sections_questionnaire_id_fkey"
            columns: ["questionnaire_id"]
            isOneToOne: false
            referencedRelation: "questionnaires"
            referencedColumns: ["id"]
          },
        ]
      }
      questionnaires: {
        Row: {
          config: Json | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_published: boolean
          is_system: boolean
          slug: string
          title: string
          ui_style: string
          updated_at: string
          version: number
        }
        Insert: {
          config?: Json | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_published?: boolean
          is_system?: boolean
          slug: string
          title: string
          ui_style?: string
          updated_at?: string
          version?: number
        }
        Update: {
          config?: Json | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_published?: boolean
          is_system?: boolean
          slug?: string
          title?: string
          ui_style?: string
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      questions: {
        Row: {
          config: Json | null
          created_at: string
          icon: string | null
          id: string
          image_url: string | null
          is_required: boolean
          question_text: string
          question_type: string
          section_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          config?: Json | null
          created_at?: string
          icon?: string | null
          id?: string
          image_url?: string | null
          is_required?: boolean
          question_text: string
          question_type?: string
          section_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          config?: Json | null
          created_at?: string
          icon?: string | null
          id?: string
          image_url?: string | null
          is_required?: boolean
          question_text?: string
          question_type?: string
          section_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "questionnaire_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      response_answers: {
        Row: {
          answered_at: string
          id: string
          likert_value: number | null
          question_id: string
          response_id: string
          selected_option_id: string | null
          text_answer: string | null
        }
        Insert: {
          answered_at?: string
          id?: string
          likert_value?: number | null
          question_id: string
          response_id: string
          selected_option_id?: string | null
          text_answer?: string | null
        }
        Update: {
          answered_at?: string
          id?: string
          likert_value?: number | null
          question_id?: string
          response_id?: string
          selected_option_id?: string | null
          text_answer?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "response_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "response_answers_response_id_fkey"
            columns: ["response_id"]
            isOneToOne: false
            referencedRelation: "user_questionnaire_responses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "response_answers_selected_option_id_fkey"
            columns: ["selected_option_id"]
            isOneToOne: false
            referencedRelation: "question_options"
            referencedColumns: ["id"]
          },
        ]
      }
      riasec_results: {
        Row: {
          company_id: string | null
          id: string
          profile_code: string | null
          raw_answers: Json | null
          score_a: number
          score_c: number
          score_e: number
          score_i: number
          score_r: number
          score_s: number
          submitted_at: string
          user_id: string
        }
        Insert: {
          company_id?: string | null
          id?: string
          profile_code?: string | null
          raw_answers?: Json | null
          score_a?: number
          score_c?: number
          score_e?: number
          score_i?: number
          score_r?: number
          score_s?: number
          submitted_at?: string
          user_id: string
        }
        Update: {
          company_id?: string | null
          id?: string
          profile_code?: string | null
          raw_answers?: Json | null
          score_a?: number
          score_c?: number
          score_e?: number
          score_i?: number
          score_r?: number
          score_s?: number
          submitted_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "riasec_results_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "riasec_results_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      scoring_dimension_weights: {
        Row: {
          created_at: string
          dimension_id: string
          id: string
          option_id: string
          weight: number
        }
        Insert: {
          created_at?: string
          dimension_id: string
          id?: string
          option_id: string
          weight?: number
        }
        Update: {
          created_at?: string
          dimension_id?: string
          id?: string
          option_id?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "scoring_dimension_weights_dimension_id_fkey"
            columns: ["dimension_id"]
            isOneToOne: false
            referencedRelation: "scoring_dimensions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scoring_dimension_weights_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "question_options"
            referencedColumns: ["id"]
          },
        ]
      }
      scoring_dimensions: {
        Row: {
          code: string
          color: string | null
          created_at: string
          description: string | null
          id: string
          label: string
          questionnaire_id: string
          sort_order: number
        }
        Insert: {
          code: string
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          label: string
          questionnaire_id: string
          sort_order?: number
        }
        Update: {
          code?: string
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          label?: string
          questionnaire_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "scoring_dimensions_questionnaire_id_fkey"
            columns: ["questionnaire_id"]
            isOneToOne: false
            referencedRelation: "questionnaires"
            referencedColumns: ["id"]
          },
        ]
      }
      shortlist_candidates: {
        Row: {
          added_at: string | null
          candidate_type: string
          external_profile_id: string | null
          hr_notes: string | null
          id: string
          internal_user_id: string | null
          match_details: Json | null
          match_score: number | null
          rating: number | null
          shortlist_id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          added_at?: string | null
          candidate_type: string
          external_profile_id?: string | null
          hr_notes?: string | null
          id?: string
          internal_user_id?: string | null
          match_details?: Json | null
          match_score?: number | null
          rating?: number | null
          shortlist_id: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          added_at?: string | null
          candidate_type?: string
          external_profile_id?: string | null
          hr_notes?: string | null
          id?: string
          internal_user_id?: string | null
          match_details?: Json | null
          match_score?: number | null
          rating?: number | null
          shortlist_id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shortlist_candidates_shortlist_id_fkey"
            columns: ["shortlist_id"]
            isOneToOne: false
            referencedRelation: "position_shortlists"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          annual_price_cents: number
          can_access_matching: boolean | null
          can_export_data: boolean | null
          can_invite_candidates: boolean | null
          created_at: string | null
          description: string | null
          display_name: string
          features: Json | null
          id: string
          is_active: boolean | null
          max_profile_views_monthly: number | null
          monthly_price_cents: number
          name: string
        }
        Insert: {
          annual_price_cents?: number
          can_access_matching?: boolean | null
          can_export_data?: boolean | null
          can_invite_candidates?: boolean | null
          created_at?: string | null
          description?: string | null
          display_name: string
          features?: Json | null
          id?: string
          is_active?: boolean | null
          max_profile_views_monthly?: number | null
          monthly_price_cents?: number
          name: string
        }
        Update: {
          annual_price_cents?: number
          can_access_matching?: boolean | null
          can_export_data?: boolean | null
          can_invite_candidates?: boolean | null
          created_at?: string | null
          description?: string | null
          display_name?: string
          features?: Json | null
          id?: string
          is_active?: boolean | null
          max_profile_views_monthly?: number | null
          monthly_price_cents?: number
          name?: string
        }
        Relationships: []
      }
      user_certifications: {
        Row: {
          created_at: string | null
          credential_id: string | null
          credential_url: string | null
          expiry_date: string | null
          id: string
          issue_date: string | null
          issuing_organization: string | null
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          credential_id?: string | null
          credential_url?: string | null
          expiry_date?: string | null
          id?: string
          issue_date?: string | null
          issuing_organization?: string | null
          name: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          credential_id?: string | null
          credential_url?: string | null
          expiry_date?: string | null
          id?: string
          issue_date?: string | null
          issuing_organization?: string | null
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      user_education: {
        Row: {
          created_at: string | null
          degree: string
          description: string | null
          end_year: number | null
          field_of_study: string | null
          id: string
          institution: string
          sort_order: number | null
          start_year: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          degree: string
          description?: string | null
          end_year?: number | null
          field_of_study?: string | null
          id?: string
          institution: string
          sort_order?: number | null
          start_year?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          degree?: string
          description?: string | null
          end_year?: number | null
          field_of_study?: string | null
          id?: string
          institution?: string
          sort_order?: number | null
          start_year?: number | null
          user_id?: string
        }
        Relationships: []
      }
      user_experiences: {
        Row: {
          company: string
          created_at: string | null
          description: string | null
          end_date: string | null
          id: string
          is_current: boolean | null
          location: string | null
          role: string
          sort_order: number | null
          start_date: string | null
          user_id: string
        }
        Insert: {
          company: string
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_current?: boolean | null
          location?: string | null
          role: string
          sort_order?: number | null
          start_date?: string | null
          user_id: string
        }
        Update: {
          company?: string
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_current?: boolean | null
          location?: string | null
          role?: string
          sort_order?: number | null
          start_date?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_hard_skills: {
        Row: {
          created_at: string | null
          custom_skill_name: string | null
          id: string
          proficiency_level: number
          skill_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          custom_skill_name?: string | null
          id?: string
          proficiency_level?: number
          skill_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          custom_skill_name?: string | null
          id?: string
          proficiency_level?: number
          skill_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_hard_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "hard_skills_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_hard_skills_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_languages: {
        Row: {
          created_at: string | null
          id: string
          language: string
          proficiency: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          language: string
          proficiency?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          language?: string
          proficiency?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_portfolio_items: {
        Row: {
          created_at: string | null
          description: string | null
          external_url: string | null
          file_url: string | null
          id: string
          item_type: string
          sort_order: number | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          external_url?: string | null
          file_url?: string | null
          id?: string
          item_type: string
          sort_order?: number | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          external_url?: string | null
          file_url?: string | null
          id?: string
          item_type?: string
          sort_order?: number | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_portfolio_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_questionnaire_responses: {
        Row: {
          company_id: string | null
          completed_at: string | null
          computed_scores: Json | null
          id: string
          questionnaire_id: string
          raw_answers: Json | null
          started_at: string
          user_id: string
          version_completed: number
        }
        Insert: {
          company_id?: string | null
          completed_at?: string | null
          computed_scores?: Json | null
          id?: string
          questionnaire_id: string
          raw_answers?: Json | null
          started_at?: string
          user_id: string
          version_completed: number
        }
        Update: {
          company_id?: string | null
          completed_at?: string | null
          computed_scores?: Json | null
          id?: string
          questionnaire_id?: string
          raw_answers?: Json | null
          started_at?: string
          user_id?: string
          version_completed?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_questionnaire_responses_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_questionnaire_responses_questionnaire_id_fkey"
            columns: ["questionnaire_id"]
            isOneToOne: false
            referencedRelation: "questionnaires"
            referencedColumns: ["id"]
          },
        ]
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
          role?: Database["public"]["Enums"]["app_role"]
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
      user_social_links: {
        Row: {
          created_at: string | null
          id: string
          platform: string
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          platform: string
          url: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          platform?: string
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_social_links_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_company_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_company_admin: {
        Args: { _company_id: string; _user_id: string }
        Returns: boolean
      }
      is_company_hr: {
        Args: { _company_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "super_admin" | "admin" | "user" | "hr"
      assignment_type: "primary" | "interim" | "backup" | "training"
      contract_type:
        | "permanent"
        | "fixed_term"
        | "apprenticeship"
        | "internship"
        | "freelance"
        | "consulting"
      gender_type: "M" | "F"
      member_status: "pending" | "invited" | "test_completed" | "completed"
      org_node_type: "root" | "department" | "team"
      remote_policy: "on_site" | "hybrid" | "remote" | "flexible"
      role_status: "active" | "vacant" | "frozen" | "planned"
      seniority_level: "Junior" | "Mid" | "Senior" | "Lead" | "C-Level"
      work_hours_type: "full_time" | "part_time" | "flexible"
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
      app_role: ["super_admin", "admin", "user", "hr"],
      assignment_type: ["primary", "interim", "backup", "training"],
      contract_type: [
        "permanent",
        "fixed_term",
        "apprenticeship",
        "internship",
        "freelance",
        "consulting",
      ],
      gender_type: ["M", "F"],
      member_status: ["pending", "invited", "test_completed", "completed"],
      org_node_type: ["root", "department", "team"],
      remote_policy: ["on_site", "hybrid", "remote", "flexible"],
      role_status: ["active", "vacant", "frozen", "planned"],
      seniority_level: ["Junior", "Mid", "Senior", "Lead", "C-Level"],
      work_hours_type: ["full_time", "part_time", "flexible"],
    },
  },
} as const

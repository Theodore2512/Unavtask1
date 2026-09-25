export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      association_members: {
        Row: {
          association_id: string
          created_at: string
          role: Database["public"]["Enums"]["member_role"]
          user_id: string
        }
        Insert: {
          association_id: string
          created_at?: string
          role?: Database["public"]["Enums"]["member_role"]
          user_id: string
        }
        Update: {
          association_id?: string
          created_at?: string
          role?: Database["public"]["Enums"]["member_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "association_members_association_id_fkey"
            columns: ["association_id"]
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "association_members_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      associations: {
        Row: {
          created_at: string
          created_by: string
          description: string
          id: string
          instagram_url: string | null
          linkedin_url: string | null
          logo_url: string | null
          name: string
          school_id: string
          slug: string
          stripe_account_id: string | null
          tiktok_url: string | null
          updated_at: string
          verified: boolean
          website_url: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string
          id?: string
          instagram_url?: string | null
          linkedin_url?: string | null
          logo_url?: string | null
          name: string
          school_id: string
          slug: string
          stripe_account_id?: string | null
          tiktok_url?: string | null
          updated_at?: string
          verified?: boolean
          website_url?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string
          id?: string
          instagram_url?: string | null
          linkedin_url?: string | null
          logo_url?: string | null
          name?: string
          school_id?: string
          slug?: string
          stripe_account_id?: string | null
          tiktok_url?: string | null
          updated_at?: string
          verified?: boolean
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "associations_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "associations_school_id_fkey"
            columns: ["school_id"]
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      cities: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      event_school_quotas: {
        Row: {
          event_id: string
          quota: number
          school_id: string
        }
        Insert: {
          event_id: string
          quota: number
          school_id: string
        }
        Update: {
          event_id?: string
          quota?: number
          school_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_school_quotas_event_id_fkey"
            columns: ["event_id"]
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_school_quotas_school_id_fkey"
            columns: ["school_id"]
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      event_secrets: {
        Row: {
          event_id: string
          member_code: string
        }
        Insert: {
          event_id: string
          member_code: string
        }
        Update: {
          event_id?: string
          member_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_secrets_event_id_fkey"
            columns: ["event_id"]
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          access_mode: Database["public"]["Enums"]["access_mode"]
          address: string | null
          association_id: string
          capacity: number
          cover_url: string | null
          created_at: string
          description: string
          ends_at: string | null
          id: string
          shotgun_opens_at: string
          slug: string
          starts_at: string
          status: Database["public"]["Enums"]["event_status"]
          title: string
          updated_at: string
          venue: string
        }
        Insert: {
          access_mode?: Database["public"]["Enums"]["access_mode"]
          address?: string | null
          association_id: string
          capacity: number
          cover_url?: string | null
          created_at?: string
          description?: string
          ends_at?: string | null
          id?: string
          shotgun_opens_at: string
          slug: string
          starts_at: string
          status?: Database["public"]["Enums"]["event_status"]
          title: string
          updated_at?: string
          venue: string
        }
        Update: {
          access_mode?: Database["public"]["Enums"]["access_mode"]
          address?: string | null
          association_id?: string
          capacity?: number
          cover_url?: string | null
          created_at?: string
          description?: string
          ends_at?: string | null
          id?: string
          shotgun_opens_at?: string
          slug?: string
          starts_at?: string
          status?: Database["public"]["Enums"]["event_status"]
          title?: string
          updated_at?: string
          venue?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_association_id_fkey"
            columns: ["association_id"]
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          amount_cents: number
          created_at: string
          event_id: string
          fee_cents: number
          hold_expires_at: string | null
          id: string
          paid_at: string | null
          school_id: string | null
          status: Database["public"]["Enums"]["order_status"]
          stripe_session_id: string | null
          ticket_type_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          event_id: string
          fee_cents?: number
          hold_expires_at?: string | null
          id?: string
          paid_at?: string | null
          school_id?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          stripe_session_id?: string | null
          ticket_type_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          event_id?: string
          fee_cents?: number
          hold_expires_at?: string | null
          id?: string
          paid_at?: string | null
          school_id?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          stripe_session_id?: string | null
          ticket_type_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_event_id_fkey"
            columns: ["event_id"]
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_school_id_fkey"
            columns: ["school_id"]
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_ticket_type_id_fkey"
            columns: ["ticket_type_id"]
            referencedRelation: "ticket_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
          role: Database["public"]["Enums"]["user_role"]
          school_id: string | null
          student_verified: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          first_name: string
          id: string
          last_name: string
          role?: Database["public"]["Enums"]["user_role"]
          school_id?: string | null
          student_verified?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          role?: Database["public"]["Enums"]["user_role"]
          school_id?: string | null
          student_verified?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_school_id_fkey"
            columns: ["school_id"]
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          campus: string
          city_id: string
          created_at: string
          email_domains: string[]
          id: string
          name: string
        }
        Insert: {
          campus: string
          city_id: string
          created_at?: string
          email_domains?: string[]
          id?: string
          name: string
        }
        Update: {
          campus?: string
          city_id?: string
          created_at?: string
          email_domains?: string[]
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "schools_city_id_fkey"
            columns: ["city_id"]
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_types: {
        Row: {
          created_at: string
          event_id: string
          id: string
          kind: Database["public"]["Enums"]["ticket_kind"]
          name: string
          price_cents: number
          quota: number | null
          sort_order: number
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          kind: Database["public"]["Enums"]["ticket_kind"]
          name: string
          price_cents?: number
          quota?: number | null
          sort_order?: number
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          kind?: Database["public"]["Enums"]["ticket_kind"]
          name?: string
          price_cents?: number
          quota?: number | null
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "ticket_types_event_id_fkey"
            columns: ["event_id"]
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          checked_in_at: string | null
          created_at: string
          event_id: string
          id: string
          order_id: string
          qr_token: string
          status: Database["public"]["Enums"]["ticket_status"]
          ticket_type_id: string
          user_id: string
        }
        Insert: {
          checked_in_at?: string | null
          created_at?: string
          event_id: string
          id?: string
          order_id: string
          qr_token?: string
          status?: Database["public"]["Enums"]["ticket_status"]
          ticket_type_id: string
          user_id: string
        }
        Update: {
          checked_in_at?: string | null
          created_at?: string
          event_id?: string
          id?: string
          order_id?: string
          qr_token?: string
          status?: Database["public"]["Enums"]["ticket_status"]
          ticket_type_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tickets_event_id_fkey"
            columns: ["event_id"]
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_order_id_fkey"
            columns: ["order_id"]
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_ticket_type_id_fkey"
            columns: ["ticket_type_id"]
            referencedRelation: "ticket_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_user_id_fkey"
            columns: ["user_id"]
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
      cancel_pending_order: { Args: { p_order_id: string }; Returns: undefined }
      check_in_ticket: {
        Args: { p_qr_token: string }
        Returns: {
          checked_in_at: string | null
          created_at: string
          event_id: string
          id: string
          order_id: string
          qr_token: string
          status: Database["public"]["Enums"]["ticket_status"]
          ticket_type_id: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "tickets"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      confirm_order_payment: {
        Args: { p_order_id: string; p_stripe_session_id?: string }
        Returns: {
          checked_in_at: string | null
          created_at: string
          event_id: string
          id: string
          order_id: string
          qr_token: string
          status: Database["public"]["Enums"]["ticket_status"]
          ticket_type_id: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "tickets"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_association: {
        Args: {
          p_description?: string
          p_instagram_url?: string
          p_linkedin_url?: string
          p_logo_url?: string
          p_name: string
          p_slug: string
          p_tiktok_url?: string
          p_website_url?: string
        }
        Returns: string
      }
      email_matches_school: {
        Args: { p_email: string; p_school_id: string }
        Returns: boolean
      }
      get_event_attendees: {
        Args: { p_event_id: string }
        Returns: {
          amount_cents: number
          checked_in_at: string
          created_at: string
          email: string
          first_name: string
          last_name: string
          order_id: string
          order_status: Database["public"]["Enums"]["order_status"]
          qr_token: string
          school_name: string
          ticket_id: string
          ticket_status: Database["public"]["Enums"]["ticket_status"]
          ticket_type: string
        }[]
      }
      get_event_availability: {
        Args: { p_event_id: string }
        Returns: {
          event_remaining: number
          remaining: number
          ticket_type_id: string
        }[]
      }
      is_admin: { Args: Record<PropertyKey, never>; Returns: boolean }
      is_association_manager: {
        Args: { p_association_id: string }
        Returns: boolean
      }
      is_association_member: {
        Args: { p_association_id: string }
        Returns: boolean
      }
      is_association_owner: {
        Args: { p_association_id: string }
        Returns: boolean
      }
      is_event_organizer: { Args: { p_event_id: string }; Returns: boolean }
      order_holds_seat: {
        Args: {
          p_hold_expires_at: string
          p_status: Database["public"]["Enums"]["order_status"]
        }
        Returns: boolean
      }
      organizer_cancel_order: {
        Args: { p_order_id: string }
        Returns: undefined
      }
      reserve_ticket: {
        Args: {
          p_event_id: string
          p_member_code?: string
          p_ticket_type_id: string
        }
        Returns: {
          amount_cents: number
          created_at: string
          event_id: string
          fee_cents: number
          hold_expires_at: string | null
          id: string
          paid_at: string | null
          school_id: string | null
          status: Database["public"]["Enums"]["order_status"]
          stripe_session_id: string | null
          ticket_type_id: string
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "orders"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      access_mode: "school_only" | "inter_school"
      event_status: "draft" | "published" | "cancelled"
      member_role: "owner" | "admin" | "staff"
      order_status: "pending" | "paid" | "free" | "cancelled" | "expired"
      ticket_kind: "standard" | "member" | "free"
      ticket_status: "valid" | "used" | "cancelled"
      user_role: "student" | "organizer" | "admin"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      access_mode: ["school_only", "inter_school"],
      event_status: ["draft", "published", "cancelled"],
      member_role: ["owner", "admin", "staff"],
      order_status: ["pending", "paid", "free", "cancelled", "expired"],
      ticket_kind: ["standard", "member", "free"],
      ticket_status: ["valid", "used", "cancelled"],
      user_role: ["student", "organizer", "admin"],
    },
  },
} as const


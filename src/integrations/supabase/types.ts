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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      bookings: {
        Row: {
          billplz_bill_id: string | null
          booking_date_from: string | null
          booking_date_to: string | null
          booking_status: Database["public"]["Enums"]["booking_status"]
          company: string | null
          course_id: string | null
          created_at: string
          customer_name: string
          discount_amount: number
          email: string
          id: string
          notes: string | null
          num_pax: number
          payment_status: Database["public"]["Enums"]["payment_status"]
          payment_url: string | null
          phone: string
          promo_code: string | null
          ref_no: string
          room_id: string | null
          slot_id: string | null
          subtotal_amount: number
          total_amount: number
          type: Database["public"]["Enums"]["booking_type"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          billplz_bill_id?: string | null
          booking_date_from?: string | null
          booking_date_to?: string | null
          booking_status?: Database["public"]["Enums"]["booking_status"]
          company?: string | null
          course_id?: string | null
          created_at?: string
          customer_name: string
          discount_amount?: number
          email: string
          id?: string
          notes?: string | null
          num_pax?: number
          payment_status?: Database["public"]["Enums"]["payment_status"]
          payment_url?: string | null
          phone: string
          promo_code?: string | null
          ref_no?: string
          room_id?: string | null
          slot_id?: string | null
          subtotal_amount?: number
          total_amount?: number
          type: Database["public"]["Enums"]["booking_type"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          billplz_bill_id?: string | null
          booking_date_from?: string | null
          booking_date_to?: string | null
          booking_status?: Database["public"]["Enums"]["booking_status"]
          company?: string | null
          course_id?: string | null
          created_at?: string
          customer_name?: string
          discount_amount?: number
          email?: string
          id?: string
          notes?: string | null
          num_pax?: number
          payment_status?: Database["public"]["Enums"]["payment_status"]
          payment_url?: string | null
          phone?: string
          promo_code?: string | null
          ref_no?: string
          room_id?: string | null
          slot_id?: string | null
          subtotal_amount?: number
          total_amount?: number
          type?: Database["public"]["Enums"]["booking_type"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "course_slots"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          status: Database["public"]["Enums"]["request_status"]
          subject: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          status?: Database["public"]["Enums"]["request_status"]
          subject?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          status?: Database["public"]["Enums"]["request_status"]
          subject?: string | null
        }
        Relationships: []
      }
      course_slots: {
        Row: {
          course_id: string
          created_at: string
          date_label: string
          id: string
          seats_taken: number
          seats_total: number
          sort_order: number
          time_label: string
        }
        Insert: {
          course_id: string
          created_at?: string
          date_label: string
          id?: string
          seats_taken?: number
          seats_total: number
          sort_order?: number
          time_label: string
        }
        Update: {
          course_id?: string
          created_at?: string
          date_label?: string
          id?: string
          seats_taken?: number
          seats_total?: number
          sort_order?: number
          time_label?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_slots_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          category: string
          certificate: string | null
          created_at: string
          duration: string
          facilitator: string | null
          group_price: number | null
          id: string
          image_url: string | null
          is_active: boolean
          is_featured: boolean
          prerequisites: string | null
          price: number
          short_desc: string
          slug: string
          status: Database["public"]["Enums"]["course_status"]
          syllabus: Json
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          certificate?: string | null
          created_at?: string
          duration: string
          facilitator?: string | null
          group_price?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_featured?: boolean
          prerequisites?: string | null
          price: number
          short_desc: string
          slug: string
          status?: Database["public"]["Enums"]["course_status"]
          syllabus?: Json
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          certificate?: string | null
          created_at?: string
          duration?: string
          facilitator?: string | null
          group_price?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_featured?: boolean
          prerequisites?: string | null
          price?: number
          short_desc?: string
          slug?: string
          status?: Database["public"]["Enums"]["course_status"]
          syllabus?: Json
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      host_course_requests: {
        Row: {
          company: string
          contact_name: string
          created_at: string
          email: string
          id: string
          location: string | null
          notes: string | null
          num_participants: number | null
          phone: string
          status: Database["public"]["Enums"]["request_status"]
          topic: string | null
        }
        Insert: {
          company: string
          contact_name: string
          created_at?: string
          email: string
          id?: string
          location?: string | null
          notes?: string | null
          num_participants?: number | null
          phone: string
          status?: Database["public"]["Enums"]["request_status"]
          topic?: string | null
        }
        Update: {
          company?: string
          contact_name?: string
          created_at?: string
          email?: string
          id?: string
          location?: string | null
          notes?: string | null
          num_participants?: number | null
          phone?: string
          status?: Database["public"]["Enums"]["request_status"]
          topic?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      promo_codes: {
        Row: {
          applies_to: Database["public"]["Enums"]["promo_applies_to"]
          code: string
          created_at: string
          description: string | null
          discount_type: Database["public"]["Enums"]["promo_discount_type"]
          discount_value: number
          expires_at: string | null
          first_time_only: boolean
          id: string
          is_active: boolean
          max_discount: number | null
          max_uses: number | null
          min_amount: number
          starts_at: string | null
          updated_at: string
          used_count: number
        }
        Insert: {
          applies_to?: Database["public"]["Enums"]["promo_applies_to"]
          code: string
          created_at?: string
          description?: string | null
          discount_type: Database["public"]["Enums"]["promo_discount_type"]
          discount_value: number
          expires_at?: string | null
          first_time_only?: boolean
          id?: string
          is_active?: boolean
          max_discount?: number | null
          max_uses?: number | null
          min_amount?: number
          starts_at?: string | null
          updated_at?: string
          used_count?: number
        }
        Update: {
          applies_to?: Database["public"]["Enums"]["promo_applies_to"]
          code?: string
          created_at?: string
          description?: string | null
          discount_type?: Database["public"]["Enums"]["promo_discount_type"]
          discount_value?: number
          expires_at?: string | null
          first_time_only?: boolean
          id?: string
          is_active?: boolean
          max_discount?: number | null
          max_uses?: number | null
          min_amount?: number
          starts_at?: string | null
          updated_at?: string
          used_count?: number
        }
        Relationships: []
      }
      promo_redemptions: {
        Row: {
          booking_id: string | null
          created_at: string
          discount_amount: number
          email: string
          id: string
          promo_id: string
          user_id: string | null
        }
        Insert: {
          booking_id?: string | null
          created_at?: string
          discount_amount?: number
          email: string
          id?: string
          promo_id: string
          user_id?: string | null
        }
        Update: {
          booking_id?: string | null
          created_at?: string
          discount_amount?: number
          email?: string
          id?: string
          promo_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "promo_redemptions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promo_redemptions_promo_id_fkey"
            columns: ["promo_id"]
            isOneToOne: false
            referencedRelation: "promo_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      room_addons: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          price: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          price?: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          price?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      rooms: {
        Row: {
          capacity: number
          created_at: string
          daily_rate: number
          description: string | null
          facilities: Json
          hourly_rate: number
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          capacity: number
          created_at?: string
          daily_rate: number
          description?: string | null
          facilities?: Json
          hourly_rate: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          capacity?: number
          created_at?: string
          daily_rate?: number
          description?: string | null
          facilities?: Json
          hourly_rate?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          role: string
          sort_order: number
          text: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          role: string
          sort_order?: number
          text: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          role?: string
          sort_order?: number
          text?: string
          updated_at?: string
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
      venue_listings: {
        Row: {
          address: string
          capacity: number | null
          created_at: string
          email: string
          facilities: string | null
          id: string
          owner_name: string
          phone: string
          status: Database["public"]["Enums"]["request_status"]
          suggested_rate: number | null
          venue_name: string
        }
        Insert: {
          address: string
          capacity?: number | null
          created_at?: string
          email: string
          facilities?: string | null
          id?: string
          owner_name: string
          phone: string
          status?: Database["public"]["Enums"]["request_status"]
          suggested_rate?: number | null
          venue_name: string
        }
        Update: {
          address?: string
          capacity?: number | null
          created_at?: string
          email?: string
          facilities?: string | null
          id?: string
          owner_name?: string
          phone?: string
          status?: Database["public"]["Enums"]["request_status"]
          suggested_rate?: number | null
          venue_name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      attach_billplz_to_booking: {
        Args: { _bill_id: string; _payment_url: string; _ref_no: string }
        Returns: undefined
      }
      create_booking: {
        Args: {
          _booking_date_from?: string
          _booking_date_to?: string
          _company?: string
          _course_id?: string
          _customer_name: string
          _email: string
          _notes?: string
          _num_pax: number
          _phone: string
          _promo_code?: string
          _room_id?: string
          _slot_id?: string
          _total_amount: number
          _type: Database["public"]["Enums"]["booking_type"]
        }
        Returns: string
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      generate_booking_ref: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      lookup_booking: {
        Args: { _email: string; _ref: string }
        Returns: {
          booking_date_from: string
          booking_date_to: string
          booking_status: Database["public"]["Enums"]["booking_status"]
          course_title: string
          created_at: string
          customer_name: string
          email: string
          num_pax: number
          payment_status: Database["public"]["Enums"]["payment_status"]
          ref_no: string
          room_name: string
          slot_label: string
          total_amount: number
          type: Database["public"]["Enums"]["booking_type"]
        }[]
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      update_booking_payment: {
        Args: { _bill_id: string; _paid: boolean; _ref_no: string }
        Returns: undefined
      }
      validate_promo_code: {
        Args: {
          _booking_type: Database["public"]["Enums"]["booking_type"]
          _code: string
          _email: string
          _subtotal: number
        }
        Returns: {
          code: string
          discount: number
          message: string
          promo_id: string
          valid: boolean
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "user"
      booking_status: "pending" | "confirmed" | "cancelled"
      booking_type: "course" | "room"
      course_status: "Ada Tempat" | "Hampir Penuh" | "Penuh"
      payment_status: "unpaid" | "paid" | "refunded"
      promo_applies_to: "all" | "course" | "room"
      promo_discount_type: "percent" | "fixed"
      request_status: "new" | "in_review" | "contacted" | "closed"
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
      app_role: ["admin", "user"],
      booking_status: ["pending", "confirmed", "cancelled"],
      booking_type: ["course", "room"],
      course_status: ["Ada Tempat", "Hampir Penuh", "Penuh"],
      payment_status: ["unpaid", "paid", "refunded"],
      promo_applies_to: ["all", "course", "room"],
      promo_discount_type: ["percent", "fixed"],
      request_status: ["new", "in_review", "contacted", "closed"],
    },
  },
} as const

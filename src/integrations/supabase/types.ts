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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      campaign_consents: {
        Row: {
          campaign_id: string
          consent_communications: boolean
          consent_photo_use: boolean
          consent_publication: boolean
          consent_story_publication: boolean
          consent_treatment_updates: boolean
          consented_at: string | null
          consented_by: string
        }
        Insert: {
          campaign_id: string
          consent_communications?: boolean
          consent_photo_use?: boolean
          consent_publication?: boolean
          consent_story_publication?: boolean
          consent_treatment_updates?: boolean
          consented_at?: string | null
          consented_by?: string
        }
        Update: {
          campaign_id?: string
          consent_communications?: boolean
          consent_photo_use?: boolean
          consent_publication?: boolean
          consent_story_publication?: boolean
          consent_treatment_updates?: boolean
          consented_at?: string | null
          consented_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_consents_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: true
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_private_details: {
        Row: {
          address: string
          campaign_id: string
          contact_email: string
          contact_phone: string
          created_at: string
          legal_full_name: string
        }
        Insert: {
          address?: string
          campaign_id: string
          contact_email?: string
          contact_phone?: string
          created_at?: string
          legal_full_name: string
        }
        Update: {
          address?: string
          campaign_id?: string
          contact_email?: string
          contact_phone?: string
          created_at?: string
          legal_full_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_private_details_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: true
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_update_internal_notes: {
        Row: {
          clinical_detail: string
          created_at: string
          id: string
          update_id: string
        }
        Insert: {
          clinical_detail: string
          created_at?: string
          id?: string
          update_id: string
        }
        Update: {
          clinical_detail?: string
          created_at?: string
          id?: string
          update_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_update_internal_notes_update_id_fkey"
            columns: ["update_id"]
            isOneToOne: false
            referencedRelation: "campaign_updates"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_updates: {
        Row: {
          approved: boolean
          body: string
          campaign_id: string
          hospital: string
          id: string
          posted_at: string
          title: string
        }
        Insert: {
          approved?: boolean
          body: string
          campaign_id: string
          hospital?: string
          id?: string
          posted_at?: string
          title: string
        }
        Update: {
          approved?: boolean
          body?: string
          campaign_id?: string
          hospital?: string
          id?: string
          posted_at?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_updates_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_wallet_transactions: {
        Row: {
          amount: number
          campaign_id: string
          campaign_wallet_id: string
          created_at: string
          description: string
          direction: string
          id: string
          idempotency_key: string
          kind: string
          reference: string
        }
        Insert: {
          amount: number
          campaign_id: string
          campaign_wallet_id: string
          created_at?: string
          description?: string
          direction: string
          id?: string
          idempotency_key: string
          kind: string
          reference: string
        }
        Update: {
          amount?: number
          campaign_id?: string
          campaign_wallet_id?: string
          created_at?: string
          description?: string
          direction?: string
          id?: string
          idempotency_key?: string
          kind?: string
          reference?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_wallet_transactions_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_wallet_transactions_campaign_wallet_id_fkey"
            columns: ["campaign_wallet_id"]
            isOneToOne: false
            referencedRelation: "campaign_wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_wallets: {
        Row: {
          campaign_id: string
          created_at: string
          currency: string
          id: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          currency?: string
          id?: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          currency?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_wallets_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: true
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          age: number | null
          category: string
          condition: string
          created_at: string
          days_left: number
          goal: number
          hospital: string
          id: string
          image: string
          location: string
          offline_raised: number
          public_display_name: string
          public_identity_type: string
          published: boolean
          seed_donors: number
          status: string
          story: string
          updated_at: string
          urgency: string
        }
        Insert: {
          age?: number | null
          category: string
          condition: string
          created_at?: string
          days_left?: number
          goal: number
          hospital: string
          id: string
          image?: string
          location: string
          offline_raised?: number
          public_display_name: string
          public_identity_type?: string
          published?: boolean
          seed_donors?: number
          status?: string
          story?: string
          updated_at?: string
          urgency?: string
        }
        Update: {
          age?: number | null
          category?: string
          condition?: string
          created_at?: string
          days_left?: number
          goal?: number
          hospital?: string
          id?: string
          image?: string
          location?: string
          offline_raised?: number
          public_display_name?: string
          public_identity_type?: string
          published?: boolean
          seed_donors?: number
          status?: string
          story?: string
          updated_at?: string
          urgency?: string
        }
        Relationships: []
      }
      donations: {
        Row: {
          amount: number
          campaign_id: string
          created_at: string
          donor_user_id: string | null
          id: string
          message: string
          public_display_name: string
          reference: string
          source: string
          visibility: string
        }
        Insert: {
          amount: number
          campaign_id: string
          created_at?: string
          donor_user_id?: string | null
          id?: string
          message?: string
          public_display_name?: string
          reference: string
          source?: string
          visibility?: string
        }
        Update: {
          amount?: number
          campaign_id?: string
          created_at?: string
          donor_user_id?: string | null
          id?: string
          message?: string
          public_display_name?: string
          reference?: string
          source?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "donations_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      donor_wallet_transactions: {
        Row: {
          amount: number
          campaign_id: string | null
          created_at: string
          description: string
          direction: string
          id: string
          idempotency_key: string
          kind: string
          reference: string
          user_id: string
          wallet_id: string
        }
        Insert: {
          amount: number
          campaign_id?: string | null
          created_at?: string
          description?: string
          direction: string
          id?: string
          idempotency_key: string
          kind: string
          reference: string
          user_id: string
          wallet_id: string
        }
        Update: {
          amount?: number
          campaign_id?: string | null
          created_at?: string
          description?: string
          direction?: string
          id?: string
          idempotency_key?: string
          kind?: string
          reference?: string
          user_id?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "donor_wallet_transactions_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donor_wallet_transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "donor_wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      donor_wallets: {
        Row: {
          created_at: string
          currency: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          currency?: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          currency?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      partner_donor_signups: {
        Row: {
          created_at: string
          email: string
          id: string
          interests: string[]
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          interests?: string[]
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          interests?: string[]
        }
        Relationships: []
      }
      profiles: {
        Row: {
          consent_communications: boolean
          created_at: string
          default_donation_visibility: string
          email: string
          full_name: string
          id: string
          phone: string
          update_channels: string[]
          updated_at: string
        }
        Insert: {
          consent_communications?: boolean
          created_at?: string
          default_donation_visibility?: string
          email?: string
          full_name?: string
          id: string
          phone?: string
          update_channels?: string[]
          updated_at?: string
        }
        Update: {
          consent_communications?: boolean
          created_at?: string
          default_donation_visibility?: string
          email?: string
          full_name?: string
          id?: string
          phone?: string
          update_channels?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      recurring_plans: {
        Row: {
          amount: number
          created_at: string
          frequency: string
          id: string
          next_charge_date: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          frequency?: string
          id?: string
          next_charge_date?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          frequency?: string
          id?: string
          next_charge_date?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      wallet_audit_log: {
        Row: {
          action: string
          created_at: string
          detail: Json
          id: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          detail?: Json
          id?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          detail?: Json
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      wallet_notifications: {
        Row: {
          body: string
          created_at: string
          id: string
          kind: string
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string
          created_at?: string
          id?: string
          kind?: string
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          kind?: string
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      campaign_public_donations: {
        Args: { _campaign_id: string }
        Returns: {
          amount: number
          created_at: string
          display_name: string
        }[]
      }
      campaign_totals: {
        Args: { _campaign_id: string }
        Returns: {
          donor_count: number
          raised: number
        }[]
      }
      my_wallet_balance: { Args: never; Returns: number }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const

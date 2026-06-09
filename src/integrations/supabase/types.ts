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
      commission_ledger: {
        Row: {
          amount: number
          created_at: string
          id: string
          rate: number
          trade_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          rate?: number
          trade_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          rate?: number
          trade_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "commission_ledger_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trade_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      global_strategy: {
        Row: {
          active: boolean
          created_at: string
          digit_settings: Json
          id: string
          profiles: Json
          recovery_global: Json
          rise_fall_settings: Json
          risk_global: Json
          updated_at: string
          version: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          digit_settings?: Json
          id?: string
          profiles?: Json
          recovery_global?: Json
          rise_fall_settings?: Json
          risk_global?: Json
          updated_at?: string
          version?: number
        }
        Update: {
          active?: boolean
          created_at?: string
          digit_settings?: Json
          id?: string
          profiles?: Json
          recovery_global?: Json
          rise_fall_settings?: Json
          risk_global?: Json
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          method: string
          plan_type: string
          reference: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          method: string
          plan_type: string
          reference?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          method?: string
          plan_type?: string
          reference?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string
          free_trial_until: string | null
          id: string
          is_admin: boolean
          is_premium: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email: string
          free_trial_until?: string | null
          id?: string
          is_admin?: boolean
          is_premium?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string
          free_trial_until?: string | null
          id?: string
          is_admin?: boolean
          is_premium?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      trade_logs: {
        Row: {
          contract_id: string
          contract_type: string
          created_at: string
          executed_at: string
          id: string
          profit: number
          stake: number
          symbol: string
          user_id: string
          won: boolean
        }
        Insert: {
          contract_id: string
          contract_type: string
          created_at?: string
          executed_at?: string
          id?: string
          profit: number
          stake: number
          symbol: string
          user_id: string
          won?: boolean
        }
        Update: {
          contract_id?: string
          contract_type?: string
          created_at?: string
          executed_at?: string
          id?: string
          profit?: number
          stake?: number
          symbol?: string
          user_id?: string
          won?: boolean
        }
        Relationships: []
      }
      user_plans: {
        Row: {
          created_at: string
          expiry_date: string
          id: string
          plan_type: string
          start_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expiry_date?: string
          id?: string
          plan_type?: string
          start_date?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expiry_date?: string
          id?: string
          plan_type?: string
          start_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_trading_settings: {
        Row: {
          base_stake: number | null
          created_at: string
          execution_speed: string | null
          extra: Json | null
          id: string
          martingale_enabled: boolean | null
          martingale_multiplier: number | null
          max_martingale_steps: number | null
          selected_market: string | null
          selected_strategy: string | null
          start_martingale_after: number | null
          stop_loss: number | null
          take_profit: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          base_stake?: number | null
          created_at?: string
          execution_speed?: string | null
          extra?: Json | null
          id?: string
          martingale_enabled?: boolean | null
          martingale_multiplier?: number | null
          max_martingale_steps?: number | null
          selected_market?: string | null
          selected_strategy?: string | null
          start_martingale_after?: number | null
          stop_loss?: number | null
          take_profit?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          base_stake?: number | null
          created_at?: string
          execution_speed?: string | null
          extra?: Json | null
          id?: string
          martingale_enabled?: boolean | null
          martingale_multiplier?: number | null
          max_martingale_steps?: number | null
          selected_market?: string | null
          selected_strategy?: string | null
          start_martingale_after?: number | null
          stop_loss?: number | null
          take_profit?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: { _user_id: string }; Returns: boolean }
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

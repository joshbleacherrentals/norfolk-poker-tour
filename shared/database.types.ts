
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "admin_users": {
                  Row: {
                    "email": string,"id": string,"name": string,"password_hash": string
                  }
                  ComputedFields: never
                  Insert: {
                    "email": string,"id"?: string,"name": string,"password_hash": string
                  }
                  Update: {
                    "email"?: string,"id"?: string,"name"?: string,"password_hash"?: string
                  }
                  Relationships: [
                    
                  ]
                },"chip_structure": {
                  Row: {
                    "addon_amount": number,"addon_available": string,"addon_chips": number,"blind_level_minutes": number,"blind_schedule": string,"break_duration_minutes": number,"break_frequency": number,"id": string,"late_registration_levels": number,"rebuy_amount": number,"rebuy_chips": number,"rebuy_deadline": string,"rebuy_limit": string,"starting_big_blind": number,"starting_small_blind": number,"starting_stack": number
                  }
                  ComputedFields: never
                  Insert: {
                    "addon_amount": number,"addon_available": string,"addon_chips": number,"blind_level_minutes": number,"blind_schedule": string,"break_duration_minutes"?: number,"break_frequency"?: number,"id"?: string,"late_registration_levels": number,"rebuy_amount": number,"rebuy_chips": number,"rebuy_deadline": string,"rebuy_limit": string,"starting_big_blind": number,"starting_small_blind": number,"starting_stack": number
                  }
                  Update: {
                    "addon_amount"?: number,"addon_available"?: string,"addon_chips"?: number,"blind_level_minutes"?: number,"blind_schedule"?: string,"break_duration_minutes"?: number,"break_frequency"?: number,"id"?: string,"late_registration_levels"?: number,"rebuy_amount"?: number,"rebuy_chips"?: number,"rebuy_deadline"?: string,"rebuy_limit"?: string,"starting_big_blind"?: number,"starting_small_blind"?: number,"starting_stack"?: number
                  }
                  Relationships: [
                    
                  ]
                },"notification_subscribers": {
                  Row: {
                    "email": string,"id": string,"name": string,"phone": string
                  }
                  ComputedFields: never
                  Insert: {
                    "email": string,"id"?: string,"name": string,"phone": string
                  }
                  Update: {
                    "email"?: string,"id"?: string,"name"?: string,"phone"?: string
                  }
                  Relationships: [
                    
                  ]
                },"registrations": {
                  Row: {
                    "email": string,"id": string,"name": string,"phone": string,"registration_type": string,"tournament_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "email": string,"id"?: string,"name": string,"phone": string,"registration_type"?: string,"tournament_id": string
                  }
                  Update: {
                    "email"?: string,"id"?: string,"name"?: string,"phone"?: string,"registration_type"?: string,"tournament_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "registrations_tournament_id_tournaments_id_fk"
      columns: ["tournament_id"]
isOneToOne: false
      referencedRelation: "tournaments"
      referencedColumns: ["id"]
    }
                  ]
                },"session": {
                  Row: {
                    "expire": string,"sess": NonNullable<Json>,"sid": string
                  }
                  ComputedFields: never
                  Insert: {
                    "expire": string,"sess": NonNullable<Json>,"sid": string
                  }
                  Update: {
                    "expire"?: string,"sess"?: NonNullable<Json>,"sid"?: string
                  }
                  Relationships: [
                    
                  ]
                },"tournament_results": {
                  Row: {
                    "id": string,"placement": number,"player_name": string,"prize_amount": number,"tournament_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "id"?: string,"placement": number,"player_name": string,"prize_amount"?: number,"tournament_id": string
                  }
                  Update: {
                    "id"?: string,"placement"?: number,"player_name"?: string,"prize_amount"?: number,"tournament_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "tournament_results_tournament_id_tournaments_id_fk"
      columns: ["tournament_id"]
isOneToOne: false
      referencedRelation: "tournaments"
      referencedColumns: ["id"]
    }
                  ]
                },"tournament_rules": {
                  Row: {
                    "id": string,"sections": string
                  }
                  ComputedFields: never
                  Insert: {
                    "id"?: string,"sections": string
                  }
                  Update: {
                    "id"?: string,"sections"?: string
                  }
                  Relationships: [
                    
                  ]
                },"tournaments": {
                  Row: {
                    "addon_amount": number,"addon_available": string,"addon_chips": number,"blind_level_minutes": number,"blind_schedule": string,"break_duration_minutes": number,"break_frequency": number,"buy_in": number,"date": string,"food_fee": number,"format": string,"id": string,"late_registration_levels": number,"max_seats": number,"name": string,"prize_pool": number,"rebuy_amount": number,"rebuy_chips": number,"rebuy_deadline": string,"rebuy_limit": string,"registered_count": number,"registration_window": string,"starting_big_blind": number,"starting_small_blind": number,"starting_stack": number
                  }
                  ComputedFields: never
                  Insert: {
                    "addon_amount": number,"addon_available": string,"addon_chips": number,"blind_level_minutes": number,"blind_schedule": string,"break_duration_minutes": number,"break_frequency": number,"buy_in": number,"date": string,"food_fee"?: number,"format": string,"id"?: string,"late_registration_levels": number,"max_seats": number,"name": string,"prize_pool": number,"rebuy_amount": number,"rebuy_chips": number,"rebuy_deadline": string,"rebuy_limit": string,"registered_count"?: number,"registration_window"?: string,"starting_big_blind": number,"starting_small_blind": number,"starting_stack": number
                  }
                  Update: {
                    "addon_amount"?: number,"addon_available"?: string,"addon_chips"?: number,"blind_level_minutes"?: number,"blind_schedule"?: string,"break_duration_minutes"?: number,"break_frequency"?: number,"buy_in"?: number,"date"?: string,"food_fee"?: number,"format"?: string,"id"?: string,"late_registration_levels"?: number,"max_seats"?: number,"name"?: string,"prize_pool"?: number,"rebuy_amount"?: number,"rebuy_chips"?: number,"rebuy_deadline"?: string,"rebuy_limit"?: string,"registered_count"?: number,"registration_window"?: string,"starting_big_blind"?: number,"starting_small_blind"?: number,"starting_stack"?: number
                  }
                  Relationships: [
                    
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            [_ in never]: never
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            
          }
        }
} as const

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
      data_types: {
        Row: {
          id: number
          name: string
        }
        Insert: {
          id?: number
          name: string
        }
        Update: {
          id?: number
          name?: string
        }
        Relationships: []
      }
      devices: {
        Row: {
          created_at: string
          description: string | null
          device_name: string
          device_type: string
          id: string
          is_connected: boolean | null
          last_seen: string | null
          project_id: string
          status: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          device_name: string
          device_type?: string
          id?: string
          is_connected?: boolean | null
          last_seen?: string | null
          project_id: string
          status?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          device_name?: string
          device_type?: string
          id?: string
          is_connected?: boolean | null
          last_seen?: string | null
          project_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "devices_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      label: {
        Row: {
          id: number
          name: string
        }
        Insert: {
          id?: number
          name: string
        }
        Update: {
          id?: number
          name?: string
        }
        Relationships: []
      }
      modes: {
        Row: {
          id: number
          type: string
        }
        Insert: {
          id?: number
          type: string
        }
        Update: {
          id?: number
          type?: string
        }
        Relationships: []
      }
      pin_configs: {
        Row: {
          created_at: string
          data_type_id: number
          device_id: string
          id: string
          label_id: number | null
          last_updated: string | null
          mode_id: number
          name: string
          pin_id: string
          signal_type_id: number
          unit: string | null
          value: string | null
        }
        Insert: {
          created_at?: string
          data_type_id: number
          device_id: string
          id?: string
          label_id?: number | null
          last_updated?: string | null
          mode_id: number
          name: string
          pin_id: string
          signal_type_id: number
          unit?: string | null
          value?: string | null
        }
        Update: {
          created_at?: string
          data_type_id?: number
          device_id?: string
          id?: string
          label_id?: number | null
          last_updated?: string | null
          mode_id?: number
          name?: string
          pin_id?: string
          signal_type_id?: number
          unit?: string | null
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pin_configs_data_type_id_fkey"
            columns: ["data_type_id"]
            isOneToOne: false
            referencedRelation: "data_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pin_configs_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pin_configs_label_id_fkey"
            columns: ["label_id"]
            isOneToOne: false
            referencedRelation: "label"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pin_configs_mode_id_fkey"
            columns: ["mode_id"]
            isOneToOne: false
            referencedRelation: "modes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pin_configs_pin_id_fkey"
            columns: ["pin_id"]
            isOneToOne: false
            referencedRelation: "pins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pin_configs_signal_type_id_fkey"
            columns: ["signal_type_id"]
            isOneToOne: false
            referencedRelation: "signal_types"
            referencedColumns: ["id"]
          },
        ]
      }
      pin_data: {
        Row: {
          created_at: string
          id: string
          pin_config_id: string
          value: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          pin_config_id: string
          value?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          pin_config_id?: string
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pin_data_pin_config_id_fkey"
            columns: ["pin_config_id"]
            isOneToOne: false
            referencedRelation: "pin_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      pins: {
        Row: {
          id: string
          pin_name: string
          pin_number: number
        }
        Insert: {
          id?: string
          pin_name: string
          pin_number: number
        }
        Update: {
          id?: string
          pin_name?: string
          pin_number?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          first_name: string | null
          last_name: string | null
          profile_id: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          first_name?: string | null
          last_name?: string | null
          profile_id?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          first_name?: string | null
          last_name?: string | null
          profile_id?: string
          user_id?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string
          description: string | null
          id: string
          profile_id: string | null
          project_name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          profile_id?: string | null
          project_name: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          profile_id?: string | null
          project_name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      signal_types: {
        Row: {
          id: number
          name: string
        }
        Insert: {
          id?: number
          name: string
        }
        Update: {
          id?: number
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_if_table_exists: {
        Args: { table_name: string }
        Returns: boolean
      }
      check_label_column_exists: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      check_tables_exist: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      ensure_profile_exists: {
        Args: { user_uuid: string }
        Returns: boolean
      }
      fetch_labels_from_database: {
        Args: Record<PropertyKey, never>
        Returns: string[]
      }
      fetch_pins_with_info: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          name: string
          pin_number: number
        }[]
      }
      find_data_type_id_by_name: {
        Args: { type_name: string }
        Returns: number
      }
      find_label_id_by_name: {
        Args: { label_name: string }
        Returns: number
      }
      find_mode_id_by_type: {
        Args: { mode_type: string }
        Returns: number
      }
      find_pin_id_by_number: {
        Args: { pin_num: number }
        Returns: string
      }
      find_signal_type_id_by_name: {
        Args: { signal_name: string }
        Returns: number
      }
      get_columns: {
        Args: { table_name: string }
        Returns: {
          column_name: string
        }[]
      }
      get_data_types: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: number
          name: string
        }[]
      }
      get_default_labels: {
        Args: Record<PropertyKey, never>
        Returns: string[]
      }
      get_labels: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: number
          name: string
        }[]
      }
      get_modes: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: number
          type: string
        }[]
      }
      get_pin_configs_with_relations: {
        Args: { user_uuid: string }
        Returns: {
          id: string
          device_id: string
          pin_id: string
          pin_number: number
          pin_name: string
          data_type_id: number
          data_type_name: string
          signal_type_id: number
          signal_type_name: string
          mode_id: number
          mode_type: string
          label_id: number
          label_name: string
          name: string
          unit: string
          value: string
          last_updated: string
          created_at: string
        }[]
      }
      get_pin_history_data: {
        Args: { config_id: string; limit_num?: number }
        Returns: {
          id: string
          pin_config_id: string
          value: string
          created_at: string
        }[]
      }
      get_pins_with_info: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          pin_name: string
          pin_number: number
        }[]
      }
      get_signal_types: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: number
          name: string
        }[]
      }
      get_tables: {
        Args: Record<PropertyKey, never>
        Returns: {
          table_name: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

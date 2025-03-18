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
      get_columns: {
        Args: {
          table_name: string
        }
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
        Args: {
          user_uuid: string
        }
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

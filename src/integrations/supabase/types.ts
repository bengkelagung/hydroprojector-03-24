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
          id: string
          name: string
          type: string
        }
        Insert: {
          id?: string
          name?: string
          type: string
        }
        Update: {
          id?: string
          name?: string
          type?: string
        }
        Relationships: []
      }
      device_logs: {
        Row: {
          device_id: string | null
          id: string
          status: string
          timestamp: string | null
        }
        Insert: {
          device_id?: string | null
          id?: string
          status: string
          timestamp?: string | null
        }
        Update: {
          device_id?: string | null
          id?: string
          status?: string
          timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "device_logs_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
        ]
      }
      devices: {
        Row: {
          created_at: string | null
          description: string
          device_name: string
          device_type: string
          id: string
          is_connected: boolean | null
          last_active: string | null
          last_seen: string | null
          project_id: string | null
          status: string
          uptime: unknown | null
        }
        Insert: {
          created_at?: string | null
          description: string
          device_name: string
          device_type: string
          id?: string
          is_connected?: boolean | null
          last_active?: string | null
          last_seen?: string | null
          project_id?: string | null
          status: string
          uptime?: unknown | null
        }
        Update: {
          created_at?: string | null
          description?: string
          device_name?: string
          device_type?: string
          id?: string
          is_connected?: boolean | null
          last_active?: string | null
          last_seen?: string | null
          project_id?: string | null
          status?: string
          uptime?: unknown | null
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
      modes: {
        Row: {
          id: string
          type: string
        }
        Insert: {
          id?: string
          type: string
        }
        Update: {
          id?: string
          type?: string
        }
        Relationships: []
      }
      pin_configs: {
        Row: {
          created_at: string | null
          data_type: string
          device_id: string | null
          id: string
          mode: string
          name: string
          pin_number: number
          signal_type: string
          unit: string | null
        }
        Insert: {
          created_at?: string | null
          data_type: string
          device_id?: string | null
          id?: string
          mode: string
          name: string
          pin_number: number
          signal_type: string
          unit?: string | null
        }
        Update: {
          created_at?: string | null
          data_type?: string
          device_id?: string | null
          id?: string
          mode?: string
          name?: string
          pin_number?: number
          signal_type?: string
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pin_configs_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
        ]
      }
      pin_configuration: {
        Row: {
          data_type_id: string | null
          device_id: string | null
          id: string
          mode_id: string | null
          pin_id: string | null
          signal_type_id: string | null
          state: boolean | null
          status: string
        }
        Insert: {
          data_type_id?: string | null
          device_id?: string | null
          id?: string
          mode_id?: string | null
          pin_id?: string | null
          signal_type_id?: string | null
          state?: boolean | null
          status?: string
        }
        Update: {
          data_type_id?: string | null
          device_id?: string | null
          id?: string
          mode_id?: string | null
          pin_id?: string | null
          signal_type_id?: string | null
          state?: boolean | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "pin_configuration_data_type_id_fkey"
            columns: ["data_type_id"]
            isOneToOne: false
            referencedRelation: "data_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pin_configuration_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pin_configuration_mode_id_fkey"
            columns: ["mode_id"]
            isOneToOne: false
            referencedRelation: "modes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pin_configuration_pin_id_fkey"
            columns: ["pin_id"]
            isOneToOne: false
            referencedRelation: "pins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pin_configuration_signal_type_id_fkey"
            columns: ["signal_type_id"]
            isOneToOne: false
            referencedRelation: "signal_types"
            referencedColumns: ["id"]
          },
        ]
      }
      pin_data: {
        Row: {
          created_at: string | null
          id: string
          pin_config_id: string | null
          value: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          pin_config_id?: string | null
          value: string
        }
        Update: {
          created_at?: string | null
          id?: string
          pin_config_id?: string | null
          value?: string
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
      pin_logs: {
        Row: {
          description: string
          device_id: string | null
          id: string
          pin_id: string | null
          status: string
          timestamp: string | null
        }
        Insert: {
          description: string
          device_id?: string | null
          id?: string
          pin_id?: string | null
          status: string
          timestamp?: string | null
        }
        Update: {
          description?: string
          device_id?: string | null
          id?: string
          pin_id?: string | null
          status?: string
          timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pin_logs_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pin_logs_pin_id_fkey"
            columns: ["pin_id"]
            isOneToOne: false
            referencedRelation: "pins"
            referencedColumns: ["id"]
          },
        ]
      }
      pin_modes: {
        Row: {
          id: string
          name: string
        }
        Insert: {
          id?: string
          name: string
        }
        Update: {
          id?: string
          name?: string
        }
        Relationships: []
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
          full_name: string
          last_active: string | null
          profile_id: string
          status: string
          user_id: string | null
        }
        Insert: {
          full_name: string
          last_active?: string | null
          profile_id?: string
          status?: string
          user_id?: string | null
        }
        Update: {
          full_name?: string
          last_active?: string | null
          profile_id?: string
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string | null
          description: string
          id: string
          profile_id: string | null
          project_name: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          profile_id?: string | null
          project_name: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          profile_id?: string | null
          project_name?: string
          user_id?: string | null
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
      setting: {
        Row: {
          created_at: string | null
          description: string | null
          id: number
          key: string
          updated_at: string | null
          user_id: string
          value: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: number
          key: string
          updated_at?: string | null
          user_id: string
          value: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: number
          key?: string
          updated_at?: string | null
          user_id?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "setting_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      signal_types: {
        Row: {
          id: string
          name: string
          type: string
        }
        Insert: {
          id?: string
          name?: string
          type: string
        }
        Update: {
          id?: string
          name?: string
          type?: string
        }
        Relationships: []
      }
      target_setting: {
        Row: {
          created_at: string | null
          id: number
          target_kelembaban: number
          target_ph: number
          target_suhu: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          target_kelembaban: number
          target_ph: number
          target_suhu: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: number
          target_kelembaban?: number
          target_ph?: number
          target_suhu?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "target_setting_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_setting: {
        Row: {
          created_at: string | null
          email: string
          foto_user: string | null
          id: number
          nama_lengkap: string
          nomor_hp: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          foto_user?: string | null
          id?: number
          nama_lengkap: string
          nomor_hp: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string
          foto_user?: string | null
          id?: number
          nama_lengkap?: string
          nomor_hp?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_setting_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      webhook_setting: {
        Row: {
          created_at: string | null
          id: number
          updated_at: string | null
          user_id: string
          webhook_url: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          updated_at?: string | null
          user_id: string
          webhook_url: string
        }
        Update: {
          created_at?: string | null
          id?: number
          updated_at?: string | null
          user_id?: string
          webhook_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_setting_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
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

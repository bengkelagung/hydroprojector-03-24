import { Database as SupabaseDatabase } from '@supabase/supabase-js'

declare module '@supabase/supabase-js' {
  interface Database {
    public: {
      Functions: {
        delete_user_account: {
          Args: Record<string, never>
          Returns: void
        }
      }
    }
  }
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          user_id: string;
          first_name: string | null;
          last_name: string | null;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          first_name?: string | null;
          last_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          first_name?: string | null;
          last_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
      };
      pins: {
        Row: {
          id: string;
          pin_number: number;
          pin_name: string;
        };
        Insert: {
          id?: string;
          pin_number: number;
          pin_name: string;
        };
        Update: {
          id?: string;
          pin_number?: number;
          pin_name?: string;
        };
      };
      pin_configs: {
        Row: {
          id: string;
          device_id: string;
          pin_id: string;
          data_type_id: number;
          signal_type_id: number;
          mode_id: number;
          label_id: number | null;
          name: string;
          unit: string | null;
          value: string | null;
          last_updated: string | null;
          created_at: string;
          pins: { pin_number: number; pin_name: string }[];
          data_types: { name: string }[];
          signal_types: { name: string }[];
          modes: { type: string }[];
          label: { name: string }[] | null;
        };
        Insert: {
          id?: string;
          device_id: string;
          pin_id: string;
          data_type_id: number;
          signal_type_id: number;
          mode_id: number;
          label_id?: number | null;
          name: string;
          unit?: string | null;
          value?: string | null;
          last_updated?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          device_id?: string;
          pin_id?: string;
          data_type_id?: number;
          signal_type_id?: number;
          mode_id?: number;
          label_id?: number | null;
          name?: string;
          unit?: string | null;
          value?: string | null;
          last_updated?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {
      // Add your views here if needed
    };
    Functions: {
      delete_user_account: {
        Args: Record<string, never>;
        Returns: { success: boolean };
      };
    };
    Enums: {
      // Add your enums here if needed
    };
  };
};
// ... existing code ... 
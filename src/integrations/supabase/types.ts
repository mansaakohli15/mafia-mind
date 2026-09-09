export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      messages: {
        Row: {
          content: string;
          created_at: string;
          id: string;
          phase: Database["public"]["Enums"]["room_status"];
          player_id: string;
          room_id: string;
          round: number;
        };
        Insert: {
          content: string;
          created_at?: string;
          id?: string;
          phase?: Database["public"]["Enums"]["room_status"];
          player_id: string;
          room_id: string;
          round?: number;
        };
        Update: {
          content?: string;
          created_at?: string;
          id?: string;
          phase?: Database["public"]["Enums"]["room_status"];
          player_id?: string;
          room_id?: string;
          round?: number;
        };
        Relationships: [
          {
            foreignKeyName: "messages_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "room_players";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "messages_room_id_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "rooms";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          display_name: string;
          id: string;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          display_name: string;
          id: string;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          display_name?: string;
          id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      room_players: {
        Row: {
          ai_persona: string | null;
          alive: boolean;
          created_at: string;
          display_name: string;
          id: string;
          is_ai: boolean;
          role: Database["public"]["Enums"]["player_role"];
          room_id: string;
          seat: number;
          user_id: string | null;
        };
        Insert: {
          ai_persona?: string | null;
          alive?: boolean;
          created_at?: string;
          display_name: string;
          id?: string;
          is_ai?: boolean;
          role?: Database["public"]["Enums"]["player_role"];
          room_id: string;
          seat: number;
          user_id?: string | null;
        };
        Update: {
          ai_persona?: string | null;
          alive?: boolean;
          created_at?: string;
          display_name?: string;
          id?: string;
          is_ai?: boolean;
          role?: Database["public"]["Enums"]["player_role"];
          room_id?: string;
          seat?: number;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "room_players_room_id_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "rooms";
            referencedColumns: ["id"];
          },
        ];
      };
      rooms: {
        Row: {
          ai_count: number;
          code: string;
          created_at: string;
          current_round: number;
          host_id: string;
          id: string;
          max_players: number;
          phase_ends_at: string | null;
          status: Database["public"]["Enums"]["room_status"];
          updated_at: string;
        };
        Insert: {
          ai_count?: number;
          code: string;
          created_at?: string;
          current_round?: number;
          host_id: string;
          id?: string;
          max_players?: number;
          phase_ends_at?: string | null;
          status?: Database["public"]["Enums"]["room_status"];
          updated_at?: string;
        };
        Update: {
          ai_count?: number;
          code?: string;
          created_at?: string;
          current_round?: number;
          host_id?: string;
          id?: string;
          max_players?: number;
          phase_ends_at?: string | null;
          status?: Database["public"]["Enums"]["room_status"];
          updated_at?: string;
        };
        Relationships: [];
      };
      suspicion_scores: {
        Row: {
          created_at: string;
          id: string;
          observer_player_id: string;
          reasoning: string | null;
          room_id: string;
          round: number;
          score: number;
          target_player_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          observer_player_id: string;
          reasoning?: string | null;
          room_id: string;
          round: number;
          score: number;
          target_player_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          observer_player_id?: string;
          reasoning?: string | null;
          room_id?: string;
          round?: number;
          score?: number;
          target_player_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "suspicion_scores_observer_player_id_fkey";
            columns: ["observer_player_id"];
            isOneToOne: false;
            referencedRelation: "room_players";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "suspicion_scores_room_id_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "rooms";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "suspicion_scores_target_player_id_fkey";
            columns: ["target_player_id"];
            isOneToOne: false;
            referencedRelation: "room_players";
            referencedColumns: ["id"];
          },
        ];
      };
      votes: {
        Row: {
          created_at: string;
          id: string;
          room_id: string;
          round: number;
          target_player_id: string;
          voter_player_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          room_id: string;
          round: number;
          target_player_id: string;
          voter_player_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          room_id?: string;
          round?: number;
          target_player_id?: string;
          voter_player_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "votes_room_id_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "rooms";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "votes_target_player_id_fkey";
            columns: ["target_player_id"];
            isOneToOne: false;
            referencedRelation: "room_players";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "votes_voter_player_id_fkey";
            columns: ["voter_player_id"];
            isOneToOne: false;
            referencedRelation: "room_players";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_room_host: { Args: { _room_id: string }; Returns: boolean };
      is_room_member: { Args: { _room_id: string }; Returns: boolean };
      my_player_role: {
        Args: { _room_id: string };
        Returns: Database["public"]["Enums"]["player_role"];
      };
      room_roles_if_ended: {
        Args: { _room_id: string };
        Returns: {
          player_id: string;
          role: Database["public"]["Enums"]["player_role"];
        }[];
      };
    };
    Enums: {
      player_role: "detective" | "suspect" | "accomplice" | "unassigned";
      room_status: "lobby" | "day" | "night" | "voting" | "ended";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      player_role: ["detective", "suspect", "accomplice", "unassigned"],
      room_status: ["lobby", "day", "night", "voting", "ended"],
    },
  },
} as const;

import { createClient } from "@supabase/supabase-js";
import { config } from "./config.js";

type LooseDatabase = {
  public: {
    Tables: Record<
      string,
      {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      }
    >;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

let client: ReturnType<typeof createClient<LooseDatabase>> | null = null;

export function getSupabase() {
  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    throw new Error("Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  }

  client ??= createClient<LooseDatabase>(config.supabaseUrl, config.supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return client;
}

export function createSupabaseAuthClient() {
  if (!config.supabaseUrl || !config.supabaseAnonKey) {
    throw new Error("Supabase Auth is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY.");
  }

  return createClient<LooseDatabase>(config.supabaseUrl, config.supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

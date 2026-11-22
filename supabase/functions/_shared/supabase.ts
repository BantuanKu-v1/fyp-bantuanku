import { createClient, SupabaseClient } from "@supabase/supabase-js";

function getRequiredEnv(name: string): string {
  const value = Deno.env.get(name);

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

export function createAuthClient(): SupabaseClient {
  return createClient(
      getRequiredEnv("SUPABASE_URL"),
      getRequiredEnv("SUPABASE_ANON_KEY"),
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
  );
}

export function createAdminClient(): SupabaseClient {
  return createClient(
      getRequiredEnv("SUPABASE_URL"),
      getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
  );
}

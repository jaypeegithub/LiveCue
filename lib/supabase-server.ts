import { createClient, SupabaseClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL?.trim();
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

function createSupabaseClient(): SupabaseClient | null {
  if (!url || !serviceRoleKey) return null;
  try {
    return createClient(url, serviceRoleKey);
  } catch {
    return null;
  }
}

export const supabase: SupabaseClient | null = createSupabaseClient();

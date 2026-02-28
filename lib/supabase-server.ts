import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Prefer SUPABASE_URL; fall back to NEXT_PUBLIC_ so Vercel only needs one URL set
const url = (
  process.env.SUPABASE_URL?.trim() ||
  process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
) || undefined;
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

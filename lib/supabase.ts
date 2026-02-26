// lib/supabase.ts — Browser Supabase client for auth.
// Set in .env.local: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY (Supabase dashboard: "publishable" key)

import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (_supabase) return _supabase;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key)
    throw new Error(
      "Supabase URL and publishable key are required. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (use the publishable key from Supabase dashboard)."
    );
  _supabase = createClient(url, key);
  return _supabase;
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    return (getSupabase() as unknown as Record<string, unknown>)[prop as string];
  },
});

export async function signUp({
  username,
  password,
  phoneNumber,
  phoneCountry,
  tosAccepted,
  recoveryEmail,
}: {
  username: string;
  password: string;
  phoneNumber: string;
  phoneCountry: "US" | "CA";
  tosAccepted: boolean;
  recoveryEmail?: string | null;
}) {
  const fakeEmail = `${username.toLowerCase()}@livecue.app`;
  const metadata: Record<string, unknown> = {
    username,
    phone_number: phoneNumber,
    phone_country: phoneCountry,
    tos_accepted: tosAccepted,
  };
  if (recoveryEmail?.trim()) {
    metadata.recovery_email = recoveryEmail.trim();
  }
  const { data, error } = await supabase.auth.signUp({
    email: fakeEmail,
    password,
    options: { data: metadata },
  });
  return { data, error };
}

export async function signIn({
  username,
  password,
}: {
  username: string;
  password: string;
}) {
  const fakeEmail = `${username.toLowerCase()}@livecue.app`;
  const { data, error } = await supabase.auth.signInWithPassword({
    email: fakeEmail,
    password,
  });
  return { data, error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function getProfile() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { profile: null, error: "Not logged in" };
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  return { profile, error };
}

export async function isUsernameTaken(username: string) {
  const { data } = await supabase
    .from("profiles")
    .select("username")
    .eq("username", username.toLowerCase())
    .single();
  return !!data;
}

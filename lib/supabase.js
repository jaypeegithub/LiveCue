// lib/supabase.js
// ============================================
// Drop this in your /lib or /utils folder
// Make sure you have: npm install @supabase/supabase-js
// Add to .env.local:
//   NEXT_PUBLIC_SUPABASE_URL=your_project_url
//   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
// ============================================

import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// ============================================
// AUTH HELPERS
// ============================================

/**
 * Sign up a new user.
 * Uses fake email trick: username@livecue.app
 * Passes username, phone, and tos_accepted as metadata
 * so the DB trigger can populate the profiles table.
 */
export async function signUp({ username, password, phoneNumber, tosAccepted }) {
  const fakeEmail = `${username.toLowerCase()}@livecue.app`

  const { data, error } = await supabase.auth.signUp({
    email: fakeEmail,
    password,
    options: {
      data: {
        username,
        phone_number: phoneNumber,
        tos_accepted: tosAccepted,
      }
    }
  })

  return { data, error }
}

/**
 * Log in an existing user.
 */
export async function signIn({ username, password }) {
  const fakeEmail = `${username.toLowerCase()}@livecue.app`

  const { data, error } = await supabase.auth.signInWithPassword({
    email: fakeEmail,
    password,
  })

  return { data, error }
}

/**
 * Log out the current user.
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return { error }
}

/**
 * Get the currently logged-in user's profile.
 */
export async function getProfile() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { profile: null, error: 'Not logged in' }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return { profile, error }
}

/**
 * Check if a username is already taken before signup.
 */
export async function isUsernameTaken(username) {
  const { data, error } = await supabase
    .from('profiles')
    .select('username')
    .eq('username', username.toLowerCase())
    .single()

  return !!data // true = taken, false = available
}

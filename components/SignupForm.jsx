'use client'
// components/SignupForm.jsx
// ============================================
// Drop in your /components folder.
// Style it however you want — no styling included,
// just the logic wired up correctly.
// ============================================

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signUp, isUsernameTaken } from '@/lib/supabase'

export default function SignupForm({ onSuccess }) {
  const router = useRouter()
  const [form, setForm] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    tosAccepted: false,
  })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    // Basic validation
    if (form.password !== form.confirmPassword) {
      return setError('Passwords do not match.')
    }
    if (form.password.length < 8) {
      return setError('Password must be at least 8 characters.')
    }
    if (!form.tosAccepted) {
      return setError('You must accept the Terms of Service to continue.')
    }
    // Basic phone format check (adjust regex to taste)
    const phoneClean = form.phoneNumber.replace(/\D/g, '')
    if (phoneClean.length < 10) {
      return setError('Please enter a valid phone number.')
    }

    setLoading(true)

    // Check username availability
    const taken = await isUsernameTaken(form.username)
    if (taken) {
      setLoading(false)
      return setError('That username is already taken.')
    }

    const { data, error: signUpError } = await signUp({
      username: form.username,
      password: form.password,
      phoneNumber: phoneClean,
      tosAccepted: form.tosAccepted,
    })

    setLoading(false)

    if (signUpError) {
      return setError(signUpError.message)
    }

    onSuccess?.(data)
    router.push('/dashboard')
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="username">Username</label>
        <input
          id="username"
          name="username"
          type="text"
          value={form.username}
          onChange={handleChange}
          required
          autoComplete="username"
        />
      </div>

      <div>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          required
          autoComplete="new-password"
        />
      </div>

      <div>
        <label htmlFor="confirmPassword">Confirm Password</label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          value={form.confirmPassword}
          onChange={handleChange}
          required
          autoComplete="new-password"
        />
      </div>

      <div>
        <label htmlFor="phoneNumber">Phone Number</label>
        <input
          id="phoneNumber"
          name="phoneNumber"
          type="tel"
          value={form.phoneNumber}
          onChange={handleChange}
          placeholder="(555) 555-5555"
          required
          autoComplete="tel"
        />
      </div>

      <div>
        <input
          id="tosAccepted"
          name="tosAccepted"
          type="checkbox"
          checked={form.tosAccepted}
          onChange={handleChange}
          required
        />
        <label htmlFor="tosAccepted">
          I agree to the <a href="/terms" target="_blank">Terms of Service</a> and{' '}
          <a href="/privacy" target="_blank">Privacy Policy</a>
        </label>
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <button type="submit" disabled={loading}>
        {loading ? 'Creating account...' : 'Create Account'}
      </button>
    </form>
  )
}

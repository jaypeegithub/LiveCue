"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signUp, isUsernameTaken } from "@/lib/supabase";
import Link from "next/link";

type Props = { onSuccess?: (data: unknown) => void };

export default function SignupForm({ onSuccess }: Props = {}) {
  const router = useRouter();
  const [form, setForm] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "",
    tosAccepted: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (form.password !== form.confirmPassword) {
      return setError("Passwords do not match.");
    }
    if (form.password.length < 8) {
      return setError("Password must be at least 8 characters.");
    }
    if (!form.tosAccepted) {
      return setError("You must accept the Terms of Service to continue.");
    }
    const phoneClean = form.phoneNumber.replace(/\D/g, "");
    if (phoneClean.length < 10) {
      return setError("Please enter a valid phone number.");
    }
    setLoading(true);
    const taken = await isUsernameTaken(form.username);
    if (taken) {
      setLoading(false);
      return setError("That username is already taken.");
    }
    const { data, error: signUpError } = await signUp({
      username: form.username,
      password: form.password,
      phoneNumber: phoneClean,
      tosAccepted: form.tosAccepted,
    });
    setLoading(false);
    if (signUpError) {
      return setError(signUpError.message);
    }
    onSuccess?.(data);
    router.push("/dashboard");
  }

  return (
    <form onSubmit={handleSubmit} className="livecue-card" style={{ marginTop: "1rem" }}>
      <div className="livecue-form-group">
        <label htmlFor="username">Username</label>
        <input
          id="username"
          name="username"
          type="text"
          value={form.username}
          onChange={handleChange}
          required
          autoComplete="username"
          className="livecue-input"
        />
      </div>
      <div className="livecue-form-group">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          required
          autoComplete="new-password"
          className="livecue-input"
        />
      </div>
      <div className="livecue-form-group">
        <label htmlFor="confirmPassword">Confirm password</label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          value={form.confirmPassword}
          onChange={handleChange}
          required
          autoComplete="new-password"
          className="livecue-input"
        />
      </div>
      <div className="livecue-form-group">
        <label htmlFor="phoneNumber">Phone number</label>
        <input
          id="phoneNumber"
          name="phoneNumber"
          type="tel"
          value={form.phoneNumber}
          onChange={handleChange}
          placeholder="(555) 555-5555"
          required
          autoComplete="tel"
          className="livecue-input"
        />
      </div>
      <div className="livecue-checkbox-wrap">
        <input
          id="tosAccepted"
          name="tosAccepted"
          type="checkbox"
          checked={form.tosAccepted}
          onChange={handleChange}
          required
        />
        <label htmlFor="tosAccepted">
          I agree to the <Link href="/terms">Terms of Service</Link> and{" "}
          <Link href="/privacy">Privacy Policy</Link>.
        </label>
      </div>
      {error && <p className="livecue-error">{error}</p>}
      <button type="submit" disabled={loading} className="livecue-btn">
        {loading ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}

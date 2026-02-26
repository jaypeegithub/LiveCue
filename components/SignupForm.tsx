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
    phoneCountry: "US" as "US" | "CA",
    phoneNumber: "",
    recoveryEmail: "",
    tosAccepted: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const target = e.target;
    const name = target.name;
    const value =
      target instanceof HTMLInputElement && target.type === "checkbox"
        ? target.checked
        : target.value;
    setForm((prev) => ({
      ...prev,
      [name]: name === "phoneCountry" ? (value as "US" | "CA") : value,
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
    const digitsOnly = phoneClean.replace(/^1/, ""); // strip leading 1 if present
    if (digitsOnly.length !== 10) {
      return setError(
        "Please enter a valid 10-digit phone number (US/Canada)."
      );
    }
    setLoading(true);
    const taken = await isUsernameTaken(form.username);
    if (taken) {
      setLoading(false);
      return setError("That username is already taken.");
    }
    const phoneNormalized = digitsOnly.length === 10 ? `+1${digitsOnly}` : phoneClean;
    const { data, error: signUpError } = await signUp({
      username: form.username,
      password: form.password,
      phoneNumber: phoneNormalized,
      phoneCountry: form.phoneCountry,
      tosAccepted: form.tosAccepted,
      recoveryEmail: form.recoveryEmail.trim() || null,
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
        <label htmlFor="phoneCountry">Country</label>
        <select
          id="phoneCountry"
          name="phoneCountry"
          value={form.phoneCountry}
          onChange={handleChange}
          className="livecue-select"
          aria-label="Country for phone number"
        >
          <option value="US">United States</option>
          <option value="CA">Canada</option>
        </select>
      </div>
      <div className="livecue-form-group">
        <label htmlFor="phoneNumber">Phone number</label>
        <input
          id="phoneNumber"
          name="phoneNumber"
          type="tel"
          value={form.phoneNumber}
          onChange={handleChange}
          placeholder={form.phoneCountry === "US" ? "(555) 555-5555" : "(555) 555-5555"}
          required
          autoComplete="tel"
          className="livecue-input"
        />
        <span className="livecue-input-hint">
          {form.phoneCountry === "US"
            ? "10-digit US number"
            : "10-digit Canadian number"}
        </span>
      </div>
      <div className="livecue-form-group">
        <label htmlFor="recoveryEmail">Recovery email (optional)</label>
        <input
          id="recoveryEmail"
          name="recoveryEmail"
          type="email"
          value={form.recoveryEmail}
          onChange={handleChange}
          placeholder="you@example.com"
          autoComplete="email"
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

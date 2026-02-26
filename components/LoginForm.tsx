"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "@/lib/supabase";

type Props = { onSuccess?: (data: unknown) => void };

export default function LoginForm({ onSuccess }: Props = {}) {
  const router = useRouter();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { data, error: signInError } = await signIn({
      username: form.username,
      password: form.password,
    });
    setLoading(false);
    if (signInError) {
      return setError(signInError.message || "Invalid username or password.");
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
          autoComplete="current-password"
          className="livecue-input"
        />
      </div>
      {error && <p className="livecue-error">{error}</p>}
      <button type="submit" disabled={loading} className="livecue-btn">
        {loading ? "Logging in…" : "Log in"}
      </button>
    </form>
  );
}

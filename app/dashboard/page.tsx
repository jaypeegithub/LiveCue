"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { getCurrentUser, signOut, supabase } from "@/lib/supabase";
import { formatEventDateDisplay } from "@/lib/espn-event";
import DashboardSidebar, { type DashboardSection } from "@/components/DashboardSidebar";

type WatchRow = {
  id: string;
  opted_in: boolean;
  notification_preference: string;
  fights: {
    fighter1_name: string;
    fighter2_name: string;
    events: { name: string; event_date: string | null } | null;
  } | null;
};

function normalizeWatchRow(raw: unknown): WatchRow {
  const r = raw as Record<string, unknown>;
  const fightsRaw = r.fights;
  const fight = Array.isArray(fightsRaw) ? fightsRaw[0] : fightsRaw;
  const eventsRaw =
    fight && typeof fight === "object" && "events" in fight
      ? (fight as Record<string, unknown>).events
      : null;
  const event = eventsRaw == null ? null : Array.isArray(eventsRaw) ? eventsRaw[0] : eventsRaw;
  const eventObj =
    event && typeof event === "object" && "name" in event && "event_date" in event
      ? {
          name: String((event as Record<string, unknown>).name),
          event_date: (event as Record<string, unknown>).event_date as string | null,
        }
      : null;
  const fightObj =
    fight && typeof fight === "object" && "fighter1_name" in fight && "fighter2_name" in fight
      ? {
          fighter1_name: String((fight as Record<string, unknown>).fighter1_name),
          fighter2_name: String((fight as Record<string, unknown>).fighter2_name),
          events: eventObj,
        }
      : null;
  return {
    id: String(r.id),
    opted_in: Boolean(r.opted_in),
    notification_preference: String(r.notification_preference ?? ""),
    fights: fightObj,
  };
}

export default function DashboardPage() {
  const [checking, setChecking] = useState(true);
  const [user, setUser] = useState<{ id: string; email: string; user_metadata?: { username?: string; recovery_email?: string } } | null>(null);
  const [session, setSession] = useState<{ access_token: string } | null>(null);
  const [activeSection, setActiveSection] = useState<DashboardSection>("account");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Change password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Recovery email
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [recoveryMessage, setRecoveryMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [recoveryLoading, setRecoveryLoading] = useState(false);

  // Delete account
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // My Watches
  const [watches, setWatches] = useState<WatchRow[]>([]);
  const [watchesLoading, setWatchesLoading] = useState(true);
  const [cancelConfirmId, setCancelConfirmId] = useState<string | null>(null);

  useEffect(() => {
    getCurrentUser().then((u) => {
      if (!u) {
        setChecking(false);
        window.location.href = "/login?redirect=/dashboard";
        return;
      }
      setUser({
        id: u.id,
        email: u.email ?? "",
        user_metadata: u.user_metadata as { username?: string; recovery_email?: string } | undefined,
      });
      setRecoveryEmail((u.user_metadata as { recovery_email?: string })?.recovery_email ?? "");
      setChecking(false);
    });
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (s?.access_token) setSession(s);
    });
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    setWatchesLoading(true);
    (async () => {
      try {
        const { data, error } = await supabase
          .from("user_fight_watches")
          .select(
            "id, opted_in, notification_preference, fights(fighter1_name, fighter2_name, events(name, event_date))"
          )
          .eq("user_id", user.id);
        if (error) {
          setWatches([]);
          return;
        }
        const rawList = Array.isArray(data) ? data : [];
        const rows: WatchRow[] = rawList.map((row) => normalizeWatchRow(row));
        rows.sort((a, b) => {
          const dateA = a.fights?.events?.event_date ?? "";
          const dateB = b.fights?.events?.event_date ?? "";
          return dateA.localeCompare(dateB);
        });
        setWatches(rows);
      } finally {
        setWatchesLoading(false);
      }
    })();
  }, [user?.id]);

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordMessage(null);
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: "error", text: "New password and confirmation do not match." });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordMessage({ type: "error", text: "New password must be at least 8 characters." });
      return;
    }
    if (!user?.email) {
      setPasswordMessage({ type: "error", text: "Session expired. Please log in again." });
      return;
    }
    setPasswordLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });
      if (signInError) {
        setPasswordMessage({ type: "error", text: "Current password is incorrect." });
        setPasswordLoading(false);
        return;
      }
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) {
        setPasswordMessage({ type: "error", text: updateError.message });
        setPasswordLoading(false);
        return;
      }
      setPasswordMessage({ type: "ok", text: "Password updated." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPasswordMessage({ type: "error", text: err instanceof Error ? err.message : "Something went wrong." });
    }
    setPasswordLoading(false);
  }

  async function handleSaveRecoveryEmail(e: React.FormEvent) {
    e.preventDefault();
    setRecoveryMessage(null);
    setRecoveryLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { recovery_email: recoveryEmail.trim() || null },
      });
      if (error) throw error;
      setRecoveryMessage({ type: "ok", text: "Recovery email saved." });
    } catch (err) {
      setRecoveryMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to save.",
      });
    }
    setRecoveryLoading(false);
  }

  async function handleDeleteAccount() {
    if (!session?.access_token) return;
    setDeleteError(null);
    setDeleteLoading(true);
    try {
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setDeleteError((data as { error?: string }).error ?? "Failed to delete account.");
        setDeleteLoading(false);
        return;
      }
      window.location.href = "/";
      return;
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete account.");
    }
    setDeleteLoading(false);
  }

  async function handleCancelWatch(watchId: string) {
    const { error } = await supabase.from("user_fight_watches").delete().eq("id", watchId);
    if (!error) setWatches((prev) => prev.filter((w) => w.id !== watchId));
    setCancelConfirmId(null);
  }

  async function handleSignOut() {
    await signOut();
    window.location.href = "/";
  }

  if (checking) {
    return (
      <div className="livecue-page" style={{ textAlign: "center", padding: "3rem" }}>
        <p className="livecue-desc">Loading...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      <header className="dashboard-header">
        <button
          type="button"
          className="dashboard-hamburger"
          aria-label="Open menu"
          onClick={() => setMobileMenuOpen(true)}
        >
          <span />
          <span />
          <span />
        </button>
        <Link href="/" className="livecue-logo-link dashboard-header-logo">
          <h1 className="livecue-logo">LiveCue</h1>
        </Link>
        <p className="dashboard-welcome">
          Welcome {user?.user_metadata?.username ?? user?.email?.split("@")[0] ?? "User"}!
        </p>
      </header>

      <div className="dashboard-body">
        <div className={`dashboard-sidebar-wrap ${mobileMenuOpen ? "dashboard-sidebar-wrap--open" : ""}`}>
          <DashboardSidebar
            activeSection={activeSection}
            onSelectSection={setActiveSection}
            mobileOpen={mobileMenuOpen}
            onClose={() => setMobileMenuOpen(false)}
          />
        </div>

        <main className="dashboard-main">
        {activeSection === "account" && (
          <div className="dashboard-content">
            <h2 className="livecue-section-title">My Account</h2>

            <div className="livecue-card" style={{ marginBottom: "1rem" }}>
              <form onSubmit={handleChangePassword}>
                <h3 style={{ margin: "0 0 1rem 0", fontSize: "1rem", fontWeight: 600 }}>Change password</h3>
                <div className="livecue-form-group">
                  <label htmlFor="current-password">Current password</label>
                  <input
                    id="current-password"
                    type="password"
                    className="livecue-input"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                </div>
                <div className="livecue-form-group">
                  <label htmlFor="new-password">New password</label>
                  <input
                    id="new-password"
                    type="password"
                    className="livecue-input"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>
                <div className="livecue-form-group">
                  <label htmlFor="confirm-password">Confirm new password</label>
                  <input
                    id="confirm-password"
                    type="password"
                    className="livecue-input"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>
                {passwordMessage && (
                  <p style={{ marginBottom: "1rem", fontSize: "0.9rem", color: passwordMessage.type === "error" ? "#f87171" : "#86efac" }}>
                    {passwordMessage.text}
                  </p>
                )}
                <button type="submit" className="livecue-btn" disabled={passwordLoading}>
                  {passwordLoading ? "Updating…" : "Update password"}
                </button>
              </form>
            </div>

            <div className="livecue-card" style={{ marginBottom: "1rem" }}>
              <form onSubmit={handleSaveRecoveryEmail}>
                <h3 style={{ margin: "0 0 1rem 0", fontSize: "1rem", fontWeight: 600 }}>Recovery email</h3>
                <div className="livecue-form-group">
                  <input
                    type="email"
                    className="livecue-input"
                    placeholder="Recovery email"
                    value={recoveryEmail}
                    onChange={(e) => setRecoveryEmail(e.target.value)}
                  />
                </div>
                {recoveryMessage && (
                  <p style={{ marginBottom: "1rem", fontSize: "0.9rem", color: recoveryMessage.type === "error" ? "#f87171" : "#86efac" }}>
                    {recoveryMessage.text}
                  </p>
                )}
                <button type="submit" className="livecue-btn" disabled={recoveryLoading}>
                  {recoveryLoading ? "Saving…" : "Save"}
                </button>
              </form>
            </div>

            <div className="livecue-card">
              <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "1rem", fontWeight: 600 }}>Delete account</h3>
              <p style={{ margin: "0 0 1rem 0", fontSize: "0.85rem", color: "#71717a" }}>
                Permanently remove your account and all associated data.
              </p>
              {!showDeleteConfirm ? (
                <button
                  type="button"
                  className="livecue-btn"
                  style={{ background: "#7f1d1d", maxWidth: 200 }}
                  onClick={() => { setShowDeleteConfirm(true); setDeleteError(null); }}
                >
                  Delete account
                </button>
              ) : (
                <div>
                  <p style={{ marginBottom: "1rem", fontSize: "0.9rem", color: "#e4e4e7" }}>
                    This will permanently delete your account and all your data. This cannot be undone.
                  </p>
                  {deleteError && <p style={{ marginBottom: "1rem", fontSize: "0.9rem", color: "#f87171" }}>{deleteError}</p>}
                  <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                    <button
                      type="button"
                      className="livecue-btn"
                      style={{ background: "#7f1d1d", maxWidth: 140 }}
                      disabled={deleteLoading}
                      onClick={handleDeleteAccount}
                    >
                      {deleteLoading ? "Deleting…" : "Yes, delete"}
                    </button>
                    <button
                      type="button"
                      className="livecue-btn"
                      style={{ background: "#3f3f46", maxWidth: 100 }}
                      disabled={deleteLoading}
                      onClick={() => setShowDeleteConfirm(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeSection === "watches" && (
          <div className="dashboard-content">
            <h2 className="livecue-section-title">My Watches</h2>
            {watchesLoading ? (
              <p className="livecue-desc">Loading...</p>
            ) : watches.length === 0 ? (
              <p className="livecue-desc">No fights watched yet.</p>
            ) : (
              <div className="dashboard-watches-list">
                {watches.map((w) => {
                  const fight = w.fights;
                  const event = fight?.events;
                  const eventName = event?.name ?? "Event";
                  const eventDate = event?.event_date ?? null;
                  const f1 = fight?.fighter1_name ?? "";
                  const f2 = fight?.fighter2_name ?? "";
                  const pref = w.notification_preference === "call" ? "Call" : "SMS";
                  const optedIn = w.opted_in;
                  return (
                    <div key={w.id} className="livecue-card dashboard-watch-card">
                      <div>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: "0.95rem" }}>{eventName}</p>
                        {eventDate && (
                          <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.8rem", color: "#71717a" }}>
                            {formatEventDateDisplay(eventDate)}
                          </p>
                        )}
                      </div>
                      <p style={{ margin: 0, fontSize: "0.95rem" }}>{f1} vs {f2}</p>
                      <p style={{ margin: 0, fontSize: "0.85rem", color: "#a1a1aa" }}>
                        {pref} · {optedIn ? "✅ Confirmed" : "⏳ Pending"}
                      </p>
                      {cancelConfirmId === w.id ? (
                        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                          <span style={{ fontSize: "0.85rem", color: "#a1a1aa" }}>Are you sure you want to cancel this watch?</span>
                          <button type="button" className="livecue-btn" style={{ padding: "0.4rem 0.75rem", fontSize: "0.85rem", maxWidth: "none" }} onClick={() => handleCancelWatch(w.id)}>
                            Yes, cancel
                          </button>
                          <button type="button" className="livecue-footer-btn" style={{ marginLeft: 0 }} onClick={() => setCancelConfirmId(null)}>
                            Keep
                          </button>
                        </div>
                      ) : (
                        <button type="button" className="livecue-footer-btn" style={{ alignSelf: "flex-start" }} onClick={() => setCancelConfirmId(w.id)}>
                          Cancel Watch
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeSection === "notifications" && (
          <div className="dashboard-content">
            <p className="livecue-desc">Coming soon.</p>
          </div>
        )}
        </main>
      </div>

      <footer className="livecue-footer dashboard-footer">
        <Link href="/">Home</Link>
        <span>·</span>
        <Link href="/dashboard">My Account</Link>
        <span>·</span>
        <Link href="/faq">FAQ</Link>
        <span>·</span>
        <Link href="/privacy">Privacy</Link>
        <span>·</span>
        <Link href="/terms">Terms</Link>
        <span>·</span>
        <button type="button" onClick={handleSignOut} className="livecue-footer-btn">
          Log out
        </button>
      </footer>
    </div>
  );
}

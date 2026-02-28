"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { getCurrentUser, signOut } from "@/lib/supabase";
import DashboardContent from "@/components/DashboardContent";
import DashboardSettings from "@/components/DashboardSettings";

export default function DashboardPage() {
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    getCurrentUser().then((user) => {
      setChecking(false);
      if (!user) {
        window.location.href = "/login?redirect=/dashboard";
        return;
      }
    });
  }, []);

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
    <>
      <header className="livecue-header">
        <h1 className="livecue-logo">LiveCue</h1>
        <p className="livecue-slogan">Never miss the fight</p>
        <p className="livecue-desc">
          You&apos;re in. Pick an event and fight below—we&apos;ll cue you when
          your bout is about to start.
        </p>
      </header>

      <DashboardContent />

      <DashboardSettings />

      <footer className="livecue-footer">
        <Link href="/">Home</Link>
        <span>·</span>
        <Link href="/faq">FAQ</Link>
        <span>·</span>
        <Link href="/privacy">Privacy</Link>
        <span>·</span>
        <Link href="/terms">Terms</Link>
        <span>·</span>
        <button
          type="button"
          onClick={handleSignOut}
          className="livecue-footer-btn"
        >
          Log out
        </button>
      </footer>
    </>
  );
}

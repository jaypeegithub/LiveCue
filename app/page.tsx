"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { getCurrentUser, signOut } from "@/lib/supabase";
import { formatEventDateDisplay } from "@/lib/espn-event";
import DashboardContent from "@/components/DashboardContent";

type EventItem = { id: string; name: string; event_date: string | null };
type FightItem = {
  weightClass: string;
  fighter1: string;
  fighter2: string;
  record1: string;
  record2: string;
  status: string;
};

function LandingContent() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [fights, setFights] = useState<FightItem[]>([]);
  const [selectedFightIndex, setSelectedFightIndex] = useState<number>(-1);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingFights, setLoadingFights] = useState(false);

  useEffect(() => {
    fetch("/api/espn/events")
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data) => {
        setEvents(data.events ?? []);
        if ((data.events?.length ?? 0) > 0 && !selectedEventId) {
          setSelectedEventId(data.events[0].id);
        }
      })
      .catch(() => setEvents([]))
      .finally(() => setLoadingEvents(false));
  }, []);

  useEffect(() => {
    if (!selectedEventId) {
      setFights([]);
      setSelectedFightIndex(-1);
      return;
    }
    setLoadingFights(true);
    fetch(`/api/espn/event?eventId=${encodeURIComponent(selectedEventId)}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data) => {
        setFights(data.mainCard ?? []);
        setSelectedFightIndex(-1);
      })
      .catch(() => setFights([]))
      .finally(() => setLoadingFights(false));
  }, [selectedEventId]);

  return (
    <>
      <header className="livecue-header">
        <h1 className="livecue-logo">LiveCue</h1>
        <p className="livecue-slogan">Never miss the fight</p>
        <p className="livecue-desc">
          Get your cue when your bout is about to start. Choose an event and a
          fight below—we’ll make sure you’re there when it matters.
        </p>
      </header>

      <main className="livecue-main">
        <div className="livecue-card">
          <label className="livecue-label">Event</label>
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            disabled={loadingEvents}
            className="livecue-select"
          >
            <option value="">Select event</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.name}
                {ev.event_date ? ` (${formatEventDateDisplay(ev.event_date)})` : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="livecue-card">
          <label className="livecue-label">Fight</label>
          <select
            value={selectedFightIndex}
            onChange={(e) => setSelectedFightIndex(Number(e.target.value))}
            disabled={loadingFights || fights.length === 0}
            className="livecue-select"
          >
            <option value={-1}>Select fight</option>
            {fights.map((f, i) => (
              <option key={i} value={i}>
                {f.fighter1} vs {f.fighter2}
              </option>
            ))}
          </select>
        </div>
        <div className="livecue-cta-small-wrap">
          <Link href="/signup" className="livecue-cta-small">
            Sign up to get notified when your fight is about to begin!
          </Link>
          <span className="livecue-cta-small-login">
            Already have an account? <Link href="/login">Log in</Link>
          </span>
        </div>
      </main>

      <footer className="livecue-footer">
        <Link href="/faq">FAQ</Link>
        <span>·</span>
        <Link href="/privacy">Privacy Policy</Link>
        <span>·</span>
        <Link href="/terms">Terms and Conditions</Link>
      </footer>
    </>
  );
}

export default function Home() {
  const [user, setUser] = useState<unknown>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    getCurrentUser().then((u) => {
      setUser(u);
      setChecking(false);
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

  if (user) {
    return (
      <div>
        <header className="livecue-header">
          <h1 className="livecue-logo">LiveCue</h1>
          <p className="livecue-slogan">Never miss the fight</p>
          <p className="livecue-desc">
            You&apos;re in. Pick an event and fight below—we&apos;ll cue you when
            your bout is about to start.
          </p>
        </header>

        <DashboardContent />

        <footer className="livecue-footer">
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
      </div>
    );
  }

  return (
    <div>
      <LandingContent />
    </div>
  );
}

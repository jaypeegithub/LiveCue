"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { signOut } from "@/lib/supabase";

type EventItem = { id: string; name: string; event_date: string | null };
type FightItem = {
  weightClass: string;
  fighter1: string;
  fighter2: string;
  record1: string;
  record2: string;
  status: string;
};

export default function DashboardPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [fights, setFights] = useState<FightItem[]>([]);
  const [selectedFightIndex, setSelectedFightIndex] = useState<number>(-1);
  const [alertMethod, setAlertMethod] = useState<"sms" | "call" | null>(null);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingFights, setLoadingFights] = useState(false);
  const [alertSubmitted, setAlertSubmitted] = useState(false);

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

  async function handleSignOut() {
    await signOut();
    window.location.href = "/";
  }

  const canSubmit =
    selectedEventId &&
    selectedFightIndex >= 0 &&
    fights[selectedFightIndex] &&
    alertMethod;
  const selectedFight = selectedFightIndex >= 0 ? fights[selectedFightIndex] : null;

  function handleAlertMe() {
    if (!canSubmit || !selectedFight) return;
    setAlertSubmitted(true);
    // TODO: send to API when SMS/call backend is ready
  }

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
                {ev.event_date ? ` (${ev.event_date})` : ""}
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

        <div className="livecue-card">
          <label className="livecue-label">How should we alert you?</label>
          <div className="livecue-alert-options">
            <label className="livecue-alert-option">
              <input
                type="radio"
                name="alertMethod"
                value="sms"
                checked={alertMethod === "sms"}
                onChange={() => setAlertMethod("sms")}
              />
              <span>SMS</span>
            </label>
            <label className="livecue-alert-option">
              <input
                type="radio"
                name="alertMethod"
                value="call"
                checked={alertMethod === "call"}
                onChange={() => setAlertMethod("call")}
              />
              <span>Phone call</span>
            </label>
          </div>
        </div>

        {alertSubmitted ? (
          <div className="livecue-card livecue-alert-success">
            <p style={{ margin: 0, fontSize: "0.9rem" }}>
              Got it. We&apos;ll alert you when{" "}
              <strong>
                {selectedFight?.fighter1} vs {selectedFight?.fighter2}
              </strong>{" "}
              is about to start ({alertMethod === "sms" ? "via SMS" : "via phone call"}).
            </p>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleAlertMe}
            disabled={!canSubmit}
            className="livecue-btn"
          >
            Alert me when this fight is about to start!
          </button>
        )}
      </main>

      <footer className="livecue-footer">
        <Link href="/">Home</Link>
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

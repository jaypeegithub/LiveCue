"use client";

import { useState, useEffect } from "react";
import { formatEventDateDisplay } from "@/lib/espn-event";
import { supabase } from "@/lib/supabase";

type EventItem = { id: string; name: string; event_date: string | null };
type FightItem = {
  id?: string | null;
  weightClass: string;
  fighter1: string;
  fighter2: string;
  record1: string;
  record2: string;
  status: string;
};

export default function DashboardContent() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [fights, setFights] = useState<FightItem[]>([]);
  const [selectedFightIndex, setSelectedFightIndex] = useState<number>(-1);
  const [alertMethod, setAlertMethod] = useState<"sms" | "call" | null>(null);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingFights, setLoadingFights] = useState(false);
  const [alertSubmitted, setAlertSubmitted] = useState(false);
  const [alreadyWatchingMessage, setAlreadyWatchingMessage] = useState<string | null>(null);
  const [watchError, setWatchError] = useState<string | null>(null);

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

  const selectedFight = selectedFightIndex >= 0 ? fights[selectedFightIndex] : null;
  const canSubmit =
    selectedEventId &&
    selectedFightIndex >= 0 &&
    selectedFight &&
    selectedFight.id &&
    alertMethod;

  async function handleAlertMe() {
    if (!canSubmit || !selectedFight?.id) return;
    setWatchError(null);
    setAlreadyWatchingMessage(null);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.access_token) {
      setWatchError("You must be logged in to watch a fight.");
      return;
    }
    const res = await fetch("/api/watch", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        fight_id: selectedFight.id,
        notification_preference: alertMethod,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setWatchError(data.error || "Something went wrong.");
      return;
    }
    if (data.alreadyWatching) {
      setAlreadyWatchingMessage(data.message ?? "You're already watching this fight.");
      return;
    }
    setAlertSubmitted(true);
  }

  return (
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
          {fights.map(
            (f, i) =>
              f.status === "Not started" ? (
                <option key={i} value={i}>
                  {f.fighter1} vs {f.fighter2}
                </option>
              ) : null
          )}
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

      {alreadyWatchingMessage && (
        <div className="livecue-card" style={{ borderColor: "var(--color-border)" }}>
          <p style={{ margin: 0, fontSize: "0.9rem" }}>{alreadyWatchingMessage}</p>
        </div>
      )}
      {watchError && (
        <div className="livecue-card" style={{ borderColor: "var(--color-error, #c00)" }}>
          <p style={{ margin: 0, fontSize: "0.9rem" }}>{watchError}</p>
        </div>
      )}
      {alertSubmitted ? (
        <div className="livecue-card livecue-alert-success">
          <p style={{ margin: 0, fontSize: "0.9rem" }}>
            Got it. We&apos;ll alert you when{" "}
            <strong>
              {selectedFight?.fighter1} vs {selectedFight?.fighter2}
            </strong>{" "}
            is about to start (
            {alertMethod === "sms" ? "via SMS" : "via phone call"}).
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
  );
}

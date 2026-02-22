"use client";

import { useState, useEffect } from "react";

type EventItem = { id: string; name: string; event_date: string | null };
type FightItem = {
  weightClass: string;
  fighter1: string;
  fighter2: string;
  record1: string;
  record2: string;
  status: string;
};

export default function Home() {
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
    <div>
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
      </main>
    </div>
  );
}

"use client";

import Link from "next/link";
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
      <h1>LiveCue</h1>
      <p className="text-zinc-400 text-sm mb-4">
        Pick an event and a fight to get started.
      </p>

      <div className="space-y-4 max-w-md">
        <div>
          <label className="block text-sm text-zinc-500 mb-1">Event</label>
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            disabled={loadingEvents}
            className="w-full px-3 py-2 rounded bg-zinc-800 border border-zinc-600 text-white text-sm"
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

        <div>
          <label className="block text-sm text-zinc-500 mb-1">Fight</label>
          <select
            value={selectedFightIndex}
            onChange={(e) => setSelectedFightIndex(Number(e.target.value))}
            disabled={loadingFights || fights.length === 0}
            className="w-full px-3 py-2 rounded bg-zinc-800 border border-zinc-600 text-white text-sm"
          >
            <option value={-1}>Select fight</option>
            {fights.map((f, i) => (
              <option key={i} value={i}>
                {f.weightClass}: {f.fighter1} vs {f.fighter2} ({f.status})
              </option>
            ))}
          </select>
        </div>
      </div>

      <footer className="mt-8 pt-4 border-t border-zinc-700 text-zinc-500 text-xs">
        <Link href="/api/espn" className="hover:text-white">
          /api/espn
        </Link>
        {" · "}
        <Link href="/event" className="hover:text-white">
          Event page
        </Link>
      </footer>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Fight = {
  weightClass: string;
  fighter1: string;
  fighter2: string;
  record1: string;
  record2: string;
  status: string;
};

type EventData = {
  eventName: string;
  eventId: string;
  mainCard: Fight[];
};

export default function EventPage() {
  const [data, setData] = useState<EventData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/espn/event?eventId=600057329")
      .then(async (res) => {
        const body = await res.json().catch(() => ({}));
        if (res.ok) return body;
        throw new Error(body.error || res.statusText);
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading main card...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!data) return null;

  return (
    <div>
      <Link href="/" className="text-zinc-500 hover:text-white text-sm mb-4 inline-block">
        ← Home
      </Link>
      <h1 className="text-2xl font-bold mb-2">{data.eventName}</h1>
      <p className="text-zinc-400 text-sm mb-6">Main card ({data.mainCard.length} fights)</p>
      <ul className="space-y-4">
        {data.mainCard.map((fight, i) => (
          <li key={i} className="bg-zinc-800 rounded-lg p-4 border border-zinc-700">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-zinc-500 text-xs uppercase">{fight.weightClass}</span>
              <span className="text-xs font-medium text-zinc-400">{fight.status}</span>
            </div>
            <div className="font-medium">
              {fight.fighter1} ({fight.record1}) vs {fight.fighter2} ({fight.record2})
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

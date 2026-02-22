"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import type { UFCEvent, UFCFight } from "@/lib/ufc-types";

type EventWithFights = UFCEvent & { fights?: UFCFight[] };

export default function UFCPage() {
  const [event, setEvent] = useState<EventWithFights | null>(null);
  const [fights, setFights] = useState<UFCFight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscribingFightId, setSubscribingFightId] = useState<string | null>(
    null
  );
  const [phone, setPhone] = useState("");
  const [subscribeMessage, setSubscribeMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const loadScoreboard = async (date?: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = date ? `?date=${date}` : "";
      const res = await fetch(`/api/ufc/scoreboard${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      setEvent(data.event || null);
      setFights(data.fights || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load card");
      setEvent(null);
      setFights([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadScoreboard();
  }, []);

  const handleSubscribe = async (fightId: string) => {
    if (!phone.trim()) {
      setSubscribeMessage({ type: "error", text: "Enter your phone number." });
      return;
    }
    setSubscribeMessage(null);
    try {
      const res = await fetch("/api/ufc/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fight_id: fightId, phone: phone.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Subscribe failed");
      setSubscribeMessage({
        type: "success",
        text: "You're subscribed! We'll text you when the fight before yours ends.",
      });
      setSubscribingFightId(null);
      setPhone("");
    } catch (e) {
      setSubscribeMessage({
        type: "error",
        text: e instanceof Error ? e.message : "Subscribe failed",
      });
    }
  };

  const statusLabel = (s: string) => {
    if (s === "complete") return "Final";
    if (s === "in_progress") return "Live";
    return "Upcoming";
  };

  const statusColor = (s: string) => {
    if (s === "complete") return "bg-slate-200";
    if (s === "in_progress") return "bg-red-500 text-white";
    return "bg-amber-200";
  };

  return (
    <div className="min-h-screen bg-zinc-900 text-white p-6 md:p-10">
      <header className="mb-8">
        <Link href="/" className="text-zinc-500 hover:text-white text-sm mb-2 inline-block">
          ← LiveCue
        </Link>
        <h1 className="text-2xl md:text-4xl font-bold tracking-tight">
          UFC — Today&apos;s card
        </h1>
        <p className="mt-2 text-zinc-400 text-sm md:text-base">
          Get a text when the fight <em>before</em> your pick is over — so you
          know yours is next.
        </p>
      </header>

      {loading && (
        <div className="text-zinc-400 py-8">Loading today&apos;s card...</div>
      )}
      {error && (
        <div className="bg-red-900/50 border border-red-600 rounded-lg p-4 mb-6">
          {error}
        </div>
      )}

      {!loading && event && (
        <div className="space-y-6">
          <div className="bg-zinc-800 rounded-lg p-4 md:p-6 border border-zinc-700">
            <h2 className="text-lg md:text-xl font-semibold">{event.name}</h2>
            <p className="text-zinc-400 text-sm mt-1">
              {event.event_date}
              {event.venue ? ` · ${event.venue}` : ""}
            </p>
          </div>

          <div>
            <h3 className="text-sm uppercase tracking-wider text-zinc-500 mb-3">
              Fights
            </h3>
            <ul className="space-y-3">
              {fights.map((fight) => (
                <li
                  key={fight.id}
                  className="bg-zinc-800 border border-zinc-700 rounded-lg p-4 flex flex-wrap items-center gap-3"
                >
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${statusColor(
                      fight.status
                    )} text-black`}
                  >
                    {statusLabel(fight.status)}
                  </span>
                  {fight.weight_class && (
                    <span className="text-zinc-500 text-xs">
                      {fight.weight_class}
                    </span>
                  )}
                  <span className="flex-1 min-w-0 font-medium">
                    {fight.fighter1_name} vs {fight.fighter2_name}
                  </span>
                  {subscribingFightId === fight.id ? (
                    <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                      <input
                        type="tel"
                        placeholder="5551234567"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="px-3 py-2 rounded bg-zinc-700 border border-zinc-600 text-white text-sm w-full md:w-40"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSubscribe(fight.id)}
                          className="px-3 py-2 rounded bg-red-600 hover:bg-red-500 text-white text-sm font-medium"
                        >
                          Notify me
                        </button>
                        <button
                          onClick={() => {
                            setSubscribingFightId(null);
                            setPhone("");
                          }}
                          className="px-3 py-2 rounded bg-zinc-600 hover:bg-zinc-500 text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setSubscribingFightId(fight.id)}
                      className="px-3 py-2 rounded bg-zinc-600 hover:bg-zinc-500 text-sm font-medium"
                    >
                      Notify when this fight is next
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {subscribeMessage && (
            <div
              className={`rounded-lg p-4 ${
                subscribeMessage.type === "success"
                  ? "bg-emerald-900/50 border border-emerald-600"
                  : "bg-red-900/50 border border-red-600"
              }`}
            >
              {subscribeMessage.text}
            </div>
          )}
        </div>
      )}

      {!loading && !event && !error && (
        <div className="text-zinc-400 py-8">
          No UFC event today. Try again on a fight night.
        </div>
      )}

      <footer className="mt-12 pt-6 border-t border-zinc-700 text-zinc-500 text-xs space-y-2">
        <p>
          Data from ESPN. Sync runs every minute on the server; you get one text
          when the fight before your selected fight ends.
        </p>
        <p>
          By subscribing you agree to our{" "}
          <Link href="/terms" className="text-red-400 hover:text-red-300">
            Terms and Conditions
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-red-400 hover:text-red-300">
            Privacy Policy
          </Link>
          .
        </p>
      </footer>
    </div>
  );
}

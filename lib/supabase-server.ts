import { createClient } from "@supabase/supabase-js";
import type { UFCEvent, UFCFight } from "./ufc-types";

const url = process.env.SUPABASE_URL!;
const key =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export function getSupabase() {
  if (!url || !key) throw new Error("Missing SUPABASE_URL or Supabase key");
  return createClient(url, key);
}

export type DbEvent = UFCEvent & { id: string };
export type DbFight = UFCFight & { id: string; event_id: string };

type FightInput = Omit<UFCFight, "id" | "event_id"> & { espn_event_id?: string };

export async function upsertEventsAndFights(
  events: UFCEvent[],
  fights: FightInput[],
  eventIdByEspnId: Map<string, string>
): Promise<{ events: DbEvent[]; fights: DbFight[] }> {
  const supabase = getSupabase();

  const insertedEvents: DbEvent[] = [];
  for (const e of events) {
    const { data: existing } = await supabase
      .from("ufc_events")
      .select("id")
      .eq("espn_event_id", e.espn_event_id)
      .single();

    if (existing) {
      await supabase
        .from("ufc_events")
        .update({
          name: e.name,
          event_date: e.event_date,
          venue: e.venue ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
      const { data: row } = await supabase
        .from("ufc_events")
        .select("*")
        .eq("id", existing.id)
        .single();
      if (row) insertedEvents.push(row as DbEvent);
      eventIdByEspnId.set(e.espn_event_id, existing.id);
    } else {
      const { data: inserted, error } = await supabase
        .from("ufc_events")
        .insert({
          espn_event_id: e.espn_event_id,
          name: e.name,
          event_date: e.event_date,
          venue: e.venue ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      if (inserted) {
        insertedEvents.push(inserted as DbEvent);
        eventIdByEspnId.set(e.espn_event_id, inserted.id);
      }
    }
  }

  const eventIdByEspn = eventIdByEspnId;
  const fightsWithEventId = fights.map((f) => {
    const espnEventId = "espn_event_id" in f ? (f as { espn_event_id?: string }).espn_event_id : undefined;
    const eventId = espnEventId ? eventIdByEspn.get(espnEventId) : events[0] ? eventIdByEspn.get(events[0].espn_event_id) : undefined;
    return {
      ...f,
      event_id: eventId || "",
      order_index: f.order_index,
    };
  });

  const insertedFights: DbFight[] = [];
  for (const f of fightsWithEventId) {
    if (!f.event_id) continue;
    const { data: existing } = await supabase
      .from("ufc_fights")
      .select("id, status")
      .eq("event_id", f.event_id)
      .eq("espn_competition_id", f.espn_competition_id)
      .single();

    const row = {
      event_id: f.event_id,
      espn_competition_id: f.espn_competition_id,
      fighter1_name: f.fighter1_name,
      fighter2_name: f.fighter2_name,
      weight_class: f.weight_class ?? null,
      order_index: f.order_index,
      status: f.status,
      winner_athlete_id: f.winner_athlete_id ?? null,
      updated_at: new Date().toISOString(),
    };

    if (existing) {
      await supabase.from("ufc_fights").update(row).eq("id", existing.id);
      const { data: updated } = await supabase
        .from("ufc_fights")
        .select("*")
        .eq("id", existing.id)
        .single();
      if (updated) insertedFights.push(updated as DbFight);
    } else {
      const { data: inserted, error } = await supabase
        .from("ufc_fights")
        .insert({
          ...row,
          event_id: f.event_id,
        })
        .select()
        .single();
      if (error) throw error;
      if (inserted) insertedFights.push(inserted as DbFight);
    }
  }

  return {
    events: insertedEvents,
    fights: insertedFights.sort((a, b) => a.order_index - b.order_index),
  };
}

export async function getEventWithFights(
  eventId: string
): Promise<(DbEvent & { fights: DbFight[] }) | null> {
  const supabase = getSupabase();
  const { data: event } = await supabase
    .from("ufc_events")
    .select("*")
    .eq("id", eventId)
    .single();
  if (!event) return null;
  const { data: fights } = await supabase
    .from("ufc_fights")
    .select("*")
    .eq("event_id", eventId)
    .order("order_index", { ascending: true });
  return { ...event, fights: (fights || []) as DbFight[] };
}

export async function getTodaysEventWithFights(): Promise<
  (DbEvent & { fights: DbFight[] }) | null
> {
  const supabase = getSupabase();
  const today = new Date().toISOString().slice(0, 10);
  const { data: event } = await supabase
    .from("ufc_events")
    .select("*")
    .eq("event_date", today)
    .order("event_date", { ascending: true })
    .limit(1)
    .single();
  if (!event) return null;
  return getEventWithFights(event.id);
}

export async function getPendingSubscriptionsForFight(
  fightId: string
): Promise<{ id: string; phone: string; fight_id: string }[]> {
  const supabase = getSupabase();
  const { data } = await supabase
    .from("ufc_subscriptions")
    .select("id, phone, fight_id")
    .eq("fight_id", fightId)
    .is("notified_at", null);
  return (data || []) as { id: string; phone: string; fight_id: string }[];
}

export async function markSubscriptionNotified(
  subscriptionId: string
): Promise<void> {
  const supabase = getSupabase();
  await supabase
    .from("ufc_subscriptions")
    .update({ notified_at: new Date().toISOString() })
    .eq("id", subscriptionId);
}

export async function getFight(fightId: string): Promise<DbFight | null> {
  const supabase = getSupabase();
  const { data } = await supabase
    .from("ufc_fights")
    .select("*")
    .eq("id", fightId)
    .single();
  return data as DbFight | null;
}

export async function getNextFight(
  eventId: string,
  orderIndex: number
): Promise<DbFight | null> {
  const supabase = getSupabase();
  const { data } = await supabase
    .from("ufc_fights")
    .select("*")
    .eq("event_id", eventId)
    .eq("order_index", orderIndex + 1)
    .single();
  return data as DbFight | null;
}

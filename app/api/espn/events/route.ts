import { fetchUpcomingEvents, getTodayEST } from "@/lib/espn-event";
import { supabase } from "@/lib/supabase-server";

const NEXT_EVENTS_COUNT = 3;
const FINISHED_EVENTS_LIMIT = 10;
/** Fetch extra events so we can skip ones where all fights are Finished. */
const FETCH_EVENTS_LIMIT = 15;

const noCacheHeaders = { "Cache-Control": "no-store, max-age=0" };

/** Always return date as YYYY-MM-DD so client never gets ISO datetime (which can display as next day in some zones). */
function toDateOnly(d: string | null | undefined): string | null {
  if (d == null) return null;
  const s = String(d).slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
}

export async function GET() {
  try {
    if (supabase) {
      try {
        const { data: rows, error } = await supabase
          .from("events")
          .select("id, espn_event_id, name, event_date, event_status")
          .order("event_date", { ascending: true })
          .limit(FETCH_EVENTS_LIMIT);

        if (!error && rows?.length) {
          const today = getTodayEST();
          const upcoming = rows.filter((r) => {
            const eventDate = r.event_date ? String(r.event_date).slice(0, 10) : "";
            return eventDate >= today;
          });
          const fromDb = upcoming.slice(0, NEXT_EVENTS_COUNT).map((r) => ({
            id: r.espn_event_id,
            name: r.name,
            event_date: toDateOnly(r.event_date),
            event_status: r.event_status ?? "upcoming",
          }));

          const { data: finishedRows } = await supabase
            .from("events")
            .select("espn_event_id, name, event_date, event_status")
            .eq("event_status", "finished")
            .order("event_date", { ascending: false })
            .limit(FINISHED_EVENTS_LIMIT);

          const finishedEvents = (finishedRows ?? []).map((r) => ({
            id: r.espn_event_id,
            name: r.name,
            event_date: toDateOnly(r.event_date),
            event_status: r.event_status ?? "finished",
          }));

          if (fromDb.length >= NEXT_EVENTS_COUNT) {
            return Response.json({ events: fromDb, finishedEvents }, { headers: noCacheHeaders });
          }

          const fromEspn = await fetchUpcomingEvents(NEXT_EVENTS_COUNT);
          const existingIds = new Set(fromDb.map((e) => e.id));
          for (const e of fromEspn) {
            if (fromDb.length >= NEXT_EVENTS_COUNT) break;
            if (existingIds.has(e.espn_event_id)) continue;
            fromDb.push({
              id: e.espn_event_id,
              name: e.name,
              event_date: toDateOnly(e.event_date) ?? e.event_date,
              event_status: "upcoming",
            });
          }

          return Response.json({ events: fromDb, finishedEvents }, { headers: noCacheHeaders });
        }
      } catch {
        // fall through to ESPN
      }
    }

    const upcoming = await fetchUpcomingEvents(NEXT_EVENTS_COUNT);
    return Response.json(
      {
        events: upcoming.map((e) => ({
          id: e.espn_event_id,
          name: e.name,
          event_date: toDateOnly(e.event_date) ?? e.event_date,
          event_status: "upcoming",
        })),
        finishedEvents: [],
      },
      { headers: noCacheHeaders }
    );
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Failed to fetch events" },
      { status: 500, headers: noCacheHeaders }
    );
  }
}

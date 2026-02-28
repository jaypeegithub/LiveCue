import { fetchUpcomingEvents } from "@/lib/espn-event";
import { supabase } from "@/lib/supabase-server";

const NEXT_EVENTS_COUNT = 3;
/** Fetch extra events so we can skip ones where all fights are Finished. */
const FETCH_EVENTS_LIMIT = 15;

export async function GET() {
  try {
    if (supabase) {
      try {
        const { data: rows, error } = await supabase
          .from("events")
          .select("id, espn_event_id, name, event_date")
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
            event_date: r.event_date ?? null,
          }));

          if (fromDb.length >= NEXT_EVENTS_COUNT) {
            return Response.json({ events: fromDb });
          }

          const fromEspn = await fetchUpcomingEvents(NEXT_EVENTS_COUNT);
          const existingIds = new Set(fromDb.map((e) => e.id));
          for (const e of fromEspn) {
            if (fromDb.length >= NEXT_EVENTS_COUNT) break;
            if (existingIds.has(e.espn_event_id)) continue;
            fromDb.push({
              id: e.espn_event_id,
              name: e.name,
              event_date: e.event_date,
            });
          }

          return Response.json({ events: fromDb });
        }
      } catch {
        // fall through to ESPN
      }
    }

    const upcoming = await fetchUpcomingEvents(NEXT_EVENTS_COUNT);
    return Response.json({
      events: upcoming.map((e) => ({
        id: e.espn_event_id,
        name: e.name,
        event_date: e.event_date,
      })),
    });
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Failed to fetch events" },
      { status: 500 }
    );
  }
}

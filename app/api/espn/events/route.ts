import { fetchUpcomingEvents } from "@/lib/espn-event";
import { supabase } from "@/lib/supabase-server";

const NEXT_EVENTS_COUNT = 3;

export async function GET() {
  try {
    if (supabase) {
      try {
        const { data: rows, error } = await supabase
          .from("events")
          .select("id, espn_event_id, name, event_date")
          .order("event_date", { ascending: true })
          .limit(NEXT_EVENTS_COUNT);

        if (!error && rows?.length) {
          return Response.json({
            events: rows.map((r) => ({
              id: r.espn_event_id,
              name: r.name,
              event_date: r.event_date ?? null,
            })),
          });
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

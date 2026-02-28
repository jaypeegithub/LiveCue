import { fetchEventMainCard, getTodayEST } from "@/lib/espn-event";
import { supabase } from "@/lib/supabase-server";

const DEFAULT_EVENT_ID = "600057329";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get("eventId") ?? DEFAULT_EVENT_ID;

  try {
    let eventDateYyyyymmdd: string | null = null;

    if (supabase) {
      try {
        const { data: eventRow, error: eventError } = await supabase
          .from("events")
          .select("id, espn_event_id, name, event_date")
          .eq("espn_event_id", eventId)
          .maybeSingle();

        if (!eventError && eventRow) {
          eventDateYyyyymmdd = eventRow.event_date
            ? String(eventRow.event_date).slice(0, 10).replace(/-/g, "")
            : null;

          const { data: fights, error: fightsError } = await supabase
            .from("fights")
            .select("id, fighter1_name, fighter2_name, status")
            .eq("event_id", eventRow.id)
            .order("order_index", { ascending: true });

          if (!fightsError && fights?.length) {
            return Response.json({
              eventName: eventRow.name,
              eventId: eventRow.espn_event_id,
              mainCard: fights.map((f: { id: string; fighter1_name: string; fighter2_name: string; status: string }) => ({
                id: f.id,
                weightClass: "",
                fighter1: f.fighter1_name,
                fighter2: f.fighter2_name,
                record1: "",
                record2: "",
                status: f.status,
              })),
            });
          }
        }
      } catch (dbError) {
        console.error("[event] Supabase fallback:", dbError);
      }
    }

    const dateToTry = eventDateYyyyymmdd ?? getTodayEST().replace(/-/g, "");
    const data = await fetchEventMainCard(eventId, dateToTry);
    if (!data) {
      if (eventDateYyyyymmdd && eventDateYyyyymmdd !== getTodayEST().replace(/-/g, "")) {
        const todayStr = getTodayEST().replace(/-/g, "");
        const dataToday = await fetchEventMainCard(eventId, todayStr);
        if (dataToday) {
          return Response.json({
            eventName: dataToday.eventName,
            eventId: dataToday.espn_event_id,
            mainCard: dataToday.mainCard.map((f) => ({
              id: null,
              weightClass: f.weightClass,
              fighter1: f.fighter1,
              fighter2: f.fighter2,
              record1: f.record1,
              record2: f.record2,
              status: f.status,
            })),
          });
        }
      }
      return Response.json(
        { error: "Event not found", eventId },
        { status: 404 }
      );
    }

    return Response.json({
    eventName: data.eventName,
    eventId: data.espn_event_id,
    mainCard: data.mainCard.map((f) => ({
      id: null,
      weightClass: f.weightClass,
      fighter1: f.fighter1,
      fighter2: f.fighter2,
      record1: f.record1,
      record2: f.record2,
      status: f.status,
    })),
  });
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Failed to fetch event" },
      { status: 500 }
    );
  }
}

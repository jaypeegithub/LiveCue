import { fetchEventMainCard } from "@/lib/espn-event";
import { supabase } from "@/lib/supabase-server";

const DEFAULT_EVENT_ID = "600057329";
const EVENT_DATE = "20260221";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get("eventId") ?? DEFAULT_EVENT_ID;

  try {
    if (supabase) {
      try {
        const { data: eventRow, error: eventError } = await supabase
          .from("events")
          .select("id, espn_event_id, name")
          .eq("espn_event_id", eventId)
          .maybeSingle();

        if (!eventError && eventRow) {
          const { data: fights, error: fightsError } = await supabase
            .from("fights")
            .select("weight_class, fighter1_name, fighter2_name, fighter1_record, fighter2_record, status")
            .eq("event_id", eventRow.id)
            .order("order_index", { ascending: true });

          if (!fightsError && fights?.length) {
            return Response.json({
              eventName: eventRow.name,
              eventId: eventRow.espn_event_id,
              mainCard: fights.map((f: { weight_class: string | null; fighter1_name: string; fighter2_name: string; fighter1_record: string | null; fighter2_record: string | null; status: string }) => ({
                weightClass: f.weight_class ?? "",
                fighter1: f.fighter1_name,
                fighter2: f.fighter2_name,
                record1: f.fighter1_record ?? "",
                record2: f.fighter2_record ?? "",
                status: f.status,
              })),
            });
          }
        }
      } catch (dbError) {
        console.error("[event] Supabase fallback:", dbError);
      }
    }

    const data = await fetchEventMainCard(eventId, EVENT_DATE);
    if (!data) {
      return Response.json(
        { error: "Event not found", eventId },
        { status: 404 }
      );
    }

    return Response.json({
    eventName: data.eventName,
    eventId: data.espn_event_id,
    mainCard: data.mainCard.map((f) => ({
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

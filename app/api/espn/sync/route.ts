import {
  fetchUpcomingEvents,
  fetchEventMainCard,
} from "@/lib/espn-event";
import { supabase } from "@/lib/supabase-server";

/** Sync enough events so the next 3 (excluding all-finished) are available. */
const SYNC_EVENTS_COUNT = 15;

export async function POST() {
  if (!supabase) {
    return Response.json(
      { error: "Supabase not configured" },
      { status: 503 }
    );
  }
  try {
    const upcoming = await fetchUpcomingEvents(SYNC_EVENTS_COUNT);
    const synced: { eventId: string; fightsCount: number }[] = [];

    for (const ev of upcoming) {
      // Always upsert the event from the calendar so it appears in the list
      const { data: eventRow, error: eventError } = await supabase
        .from("events")
        .upsert(
          {
            espn_event_id: ev.espn_event_id,
            name: ev.name,
            event_date: ev.event_date || undefined,
          },
          { onConflict: "espn_event_id" }
        )
        .select("id")
        .single();

      if (eventError || !eventRow) {
        console.error("events upsert", ev.espn_event_id, eventError);
        continue;
      }

      let data = await fetchEventMainCard(
        ev.espn_event_id,
        ev.event_date_yyyymmdd
      );
      if (!data && ev.event_date_yyyymmdd.length >= 8) {
        const prevDate = new Date(ev.event_date + "T12:00:00Z");
        prevDate.setUTCDate(prevDate.getUTCDate() - 1);
        const prev = prevDate.toISOString().slice(0, 10).replace(/-/g, "");
        data = await fetchEventMainCard(ev.espn_event_id, prev);
      }

      if (data?.mainCard?.length) {
        const validStatuses = ["Finished", "In progress", "Not started"] as const;
        const fightRows = data.mainCard
          .map((f, i) => {
            const espnId = f.espn_competition_id != null ? String(f.espn_competition_id).trim() : "";
            if (!espnId) return null;
            const status = validStatuses.includes(f.status) ? f.status : "Not started";
            return {
              event_id: eventRow.id,
              espn_competition_id: espnId,
              fighter1_name: f.fighter1 != null ? String(f.fighter1).trim() || "TBD" : "TBD",
              fighter2_name: f.fighter2 != null ? String(f.fighter2).trim() || "TBD" : "TBD",
              status,
              order_index: i,
            };
          })
          .filter((row): row is NonNullable<typeof row> => row !== null);

        if (data.eventStartTime) {
          await supabase
            .from("events")
            .update({ event_start_time: data.eventStartTime })
            .eq("id", eventRow.id);
        }

        if (fightRows.length > 0) {
          const { error: fightsError } = await supabase.from("fights").upsert(
            fightRows,
            { onConflict: "event_id,espn_competition_id" }
          );
          if (fightsError) {
            console.error("fights upsert", ev.espn_event_id, fightsError);
          } else {
            synced.push({ eventId: eventRow.id, fightsCount: fightRows.length });
          }
        } else {
          synced.push({ eventId: eventRow.id, fightsCount: 0 });
        }
      } else {
        synced.push({ eventId: eventRow.id, fightsCount: 0 });
      }
    }

    return Response.json({
      ok: true,
      synced: synced.length,
      events: synced,
    });
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Sync failed" },
      { status: 500 }
    );
  }
}

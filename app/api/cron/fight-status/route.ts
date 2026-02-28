import { NextRequest } from "next/server";
import { fetchEventMainCard } from "@/lib/espn-event";
import { supabase } from "@/lib/supabase-server";

export const maxDuration = 30;

/**
 * Vercel Cron: runs every minute to update fight statuses for the current event.
 * Only runs when the current event has started: event_date <= today and
 * current time >= event's actual start time (from ESPN). Stops updating once
 * the final fight for that event is marked Finished.
 * Set CRON_SECRET in Vercel Environment Variables.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (
    !process.env.CRON_SECRET ||
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (!supabase) {
    return Response.json(
      { ok: false, error: "Supabase not configured" },
      { status: 503 }
    );
  }

  try {
    const today = new Date().toISOString().slice(0, 10);

    const { data: events, error: eventsError } = await supabase
      .from("events")
      .select("id, espn_event_id, name, event_date")
      .lte("event_date", today)
      .order("event_date", { ascending: false });

    if (eventsError || !events?.length) {
      return Response.json({
        ok: true,
        updated: false,
        reason: "no_event_today_or_past",
      });
    }

    for (const event of events) {
      const eventDate = event.event_date
        ? String(event.event_date).slice(0, 10)
        : today;
      const eventDateYyyyymmdd = eventDate.replace(/-/g, "");

      const { data: fights, error: fightsError } = await supabase
        .from("fights")
        .select("id, status")
        .eq("event_id", event.id);

      if (!fightsError && fights?.length) {
        const allFinished = fights.every((f) => f.status === "Finished");
        if (allFinished) continue;
      }

      const data = await fetchEventMainCard(
        event.espn_event_id,
        eventDateYyyyymmdd
      );
      if (!data?.mainCard?.length) continue;

      const allNotStarted = data.mainCard.every((f) => f.status === "Not started");
      if (allNotStarted && data.eventStartTime) {
        const startTime = new Date(data.eventStartTime).getTime();
        if (Date.now() < startTime) {
          return Response.json({
            ok: true,
            updated: false,
            reason: "event_not_started_yet",
            eventId: event.espn_event_id,
            eventName: event.name,
            eventStartTime: data.eventStartTime,
          });
        }
      }

      const fightRows = data.mainCard.map((f, i) => ({
        event_id: event.id,
        espn_competition_id: f.espn_competition_id,
        weight_class: f.weightClass || null,
        fighter1_name: f.fighter1,
        fighter2_name: f.fighter2,
        fighter1_record: f.record1 || null,
        fighter2_record: f.record2 || null,
        status: f.status,
        order_index: i,
      }));

      const { error: upsertError } = await supabase.from("fights").upsert(
        fightRows,
        { onConflict: "event_id,espn_competition_id" }
      );

      if (upsertError) {
        console.error("[cron/fight-status] upsert", event.espn_event_id, upsertError);
        return Response.json(
          { ok: false, error: upsertError.message },
          { status: 500 }
        );
      }

      const allNowFinished = fightRows.every((f) => f.status === "Finished");
      return Response.json({
        ok: true,
        updated: true,
        eventId: event.espn_event_id,
        eventName: event.name,
        fightsUpdated: fightRows.length,
        allFinished: allNowFinished,
      });
    }

    return Response.json({
      ok: true,
      updated: false,
      reason: "all_events_finished",
    });
  } catch (e) {
    console.error("[cron/fight-status]", e);
    return Response.json(
      {
        ok: false,
        error: e instanceof Error ? e.message : "Fight status update failed",
      },
      { status: 500 }
    );
  }
}

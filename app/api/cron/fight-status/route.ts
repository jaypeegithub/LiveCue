import { NextRequest } from "next/server";
import { fetchEventMainCard, getTodayEST } from "@/lib/espn-event";
import { supabase } from "@/lib/supabase-server";

/** Allow time for fight updates plus optional sync (next 3 events) when all finished. */
export const maxDuration = 90;

/**
 * Vercel Cron: invoked every minute. Does work only when the current event
 * has started (event_date <= today and current time >= event_start_time).
 * Before start we return immediately using stored event_start_time (no ESPN
 * call). Once started, fetches ESPN and updates fight statuses until the final
 * fight is Finished; then triggers sync of the next 3 events.
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
    const today = getTodayEST();

    const { data: events, error: eventsError } = await supabase
      .from("events")
      .select("id, espn_event_id, name, event_date, event_start_time")
      .lte("event_date", today)
      .order("event_date", { ascending: false });

    if (eventsError || !events?.length) {
      return Response.json({
        ok: true,
        updated: false,
        reason: "no_event_today_or_past",
      });
    }

    const now = Date.now();

    for (const event of events) {
      const eventDate = event.event_date
        ? String(event.event_date).slice(0, 10)
        : today;
      const isToday = eventDate === today;

      if (isToday && event.event_start_time) {
        const startTime = new Date(event.event_start_time).getTime();
        if (now < startTime) {
          return Response.json({
            ok: true,
            updated: false,
            reason: "event_not_started_yet",
            eventId: event.espn_event_id,
            eventName: event.name,
            eventStartTime: event.event_start_time,
          });
        }
      }

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
        if (now < startTime) {
          if (!event.event_start_time) {
            await supabase
              .from("events")
              .update({ event_start_time: data.eventStartTime })
              .eq("id", event.id);
          }
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
        fighter1_name: f.fighter1,
        fighter2_name: f.fighter2,
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

      if (allNowFinished) {
        const baseUrl =
          process.env.VERCEL_URL
            ? `https://${process.env.VERCEL_URL}`
            : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        try {
          const syncRes = await fetch(`${baseUrl}/api/espn/sync`, {
            method: "POST",
          });
          const syncData = await syncRes.json().catch(() => ({}));
          return Response.json({
            ok: true,
            updated: true,
            eventId: event.espn_event_id,
            eventName: event.name,
            fightsUpdated: fightRows.length,
            allFinished: true,
            syncTriggered: true,
            syncOk: syncRes.ok,
            sync: syncData,
          });
        } catch (syncErr) {
          console.error("[cron/fight-status] sync after all finished", syncErr);
          return Response.json({
            ok: true,
            updated: true,
            eventId: event.espn_event_id,
            eventName: event.name,
            fightsUpdated: fightRows.length,
            allFinished: true,
            syncTriggered: true,
            syncOk: false,
            syncError: syncErr instanceof Error ? syncErr.message : "Sync failed",
          });
        }
      }

      return Response.json({
        ok: true,
        updated: true,
        eventId: event.espn_event_id,
        eventName: event.name,
        fightsUpdated: fightRows.length,
        allFinished: false,
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

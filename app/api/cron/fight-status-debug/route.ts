import { NextRequest } from "next/server";
import { fetchEventMainCard, getTodayEST, getTomorrowEST } from "@/lib/espn-event";
import { supabase } from "@/lib/supabase-server";

/**
 * One-off debug route: runs the same event fetch + fight upsert as the cron
 * so we can see the exact Supabase error and request body when upsert returns 400.
 * Call with: GET /api/cron/fight-status-debug
 * Header: Authorization: Bearer YOUR_CRON_SECRET
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (
    !process.env.CRON_SECRET ||
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!supabase) {
    return Response.json(
      { error: "Supabase not configured" },
      { status: 503 }
    );
  }

  const today = getTodayEST();
  const tomorrow = getTomorrowEST();

  const { data: events, error: eventsError } = await supabase
    .from("events")
    .select("id, espn_event_id, name, event_date, event_start_time")
    .lte("event_date", tomorrow)
    .order("event_date", { ascending: false });

  if (eventsError) {
    return Response.json({
      debug: true,
      step: "events_query",
      error: eventsError,
      today,
      tomorrow,
    });
  }

  if (!events?.length) {
    return Response.json({
      debug: true,
      step: "no_events",
      today,
      tomorrow,
      message: "No events with event_date <= tomorrow in DB",
    });
  }

  const event = events[0];
  const eventDate = event.event_date
    ? String(event.event_date).slice(0, 10)
    : today;
  const eventDateYyyyymmdd = eventDate.replace(/-/g, "");

  const data = await fetchEventMainCard(
    event.espn_event_id,
    eventDateYyyyymmdd,
    { noCache: true }
  );

  if (!data?.mainCard?.length) {
    return Response.json({
      debug: true,
      step: "no_espn_data",
      eventId: event.espn_event_id,
      eventName: event.name,
      eventDateYyyyymmdd,
    });
  }

  const validStatuses = ["Finished", "In progress", "Not started"] as const;
  const fightRows = data.mainCard
    .map((f, i) => {
      const espnId = f.espn_competition_id != null ? String(f.espn_competition_id).trim() : "";
      if (!espnId) return null;
      const status = validStatuses.includes(f.status) ? f.status : "Not started";
      return {
        event_id: event.id,
        espn_competition_id: espnId,
        fighter1_name: f.fighter1 != null ? String(f.fighter1).trim() || "TBD" : "TBD",
        fighter2_name: f.fighter2 != null ? String(f.fighter2).trim() || "TBD" : "TBD",
        status,
        order_index: i,
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null);

  const upsertOptions = { onConflict: "event_id,espn_competition_id" as const };
  const { data: upsertData, error: upsertError } = await supabase
    .from("fights")
    .upsert(fightRows, upsertOptions);

  if (upsertError) {
    const errObj = upsertError as unknown as Record<string, unknown>;
    const fullError = {
      message: upsertError.message,
      details: errObj.details,
      hint: errObj.hint,
      code: errObj.code,
      ...Object.fromEntries(Object.entries(errObj).filter(([k]) => !["stack", "name"].includes(k))),
    };
    return Response.json({
      debug: true,
      step: "upsert_failed",
      eventId: event.espn_event_id,
      eventName: event.name,
      supabaseError: fullError,
      bodySent: fightRows,
      rowCount: fightRows.length,
    });
  }

  return Response.json({
    debug: true,
    step: "upsert_ok",
    eventId: event.espn_event_id,
    eventName: event.name,
    rowCount: fightRows.length,
    upsertData,
  });
}

import { NextRequest } from "next/server";
import { fetchEventMainCard, getTodayEST, getTomorrowEST } from "@/lib/espn-event";
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
    const tomorrow = getTomorrowEST();

    // Include events through tomorrow so we catch "tonight's" event if stored as next calendar day
    const { data: events, error: eventsError } = await supabase
      .from("events")
      .select("id, espn_event_id, name, event_date, event_start_time")
      .lte("event_date", tomorrow)
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

      const { data: fightsBefore, error: fightsError } = await supabase
        .from("fights")
        .select("id, order_index, status")
        .eq("event_id", event.id);

      if (!fightsError && fightsBefore?.length) {
        const allFinished = fightsBefore.every((f) => f.status === "Finished");
        if (allFinished) continue;
      }

      const data = await fetchEventMainCard(
        event.espn_event_id,
        eventDateYyyyymmdd,
        { noCache: true }
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

      if (fightRows.length === 0) continue;

      const upsertOptions = { onConflict: "event_id,espn_competition_id" };
      console.log("[cron/fight-status] upsert request", {
        eventId: event.espn_event_id,
        eventName: event.name,
        rowCount: fightRows.length,
        body: fightRows,
        options: upsertOptions,
      });

      const { error: upsertError } = await supabase.from("fights").upsert(
        fightRows,
        upsertOptions
      );

      if (upsertError) {
        const errObj = upsertError as unknown as Record<string, unknown>;
        const fullError = {
          message: upsertError.message,
          details: errObj.details,
          hint: errObj.hint,
          code: errObj.code,
          ...Object.fromEntries(Object.entries(errObj).filter(([k]) => !["stack", "name"].includes(k))),
        };
        console.error("[cron/fight-status] upsert Supabase error (full object)", JSON.stringify(fullError, null, 2));
        console.error("[cron/fight-status] upsert request body that failed", JSON.stringify(fightRows, null, 2));
        return Response.json(
          { ok: false, error: upsertError.message, details: fullError, bodySent: fightRows },
          { status: 500 }
        );
      }

      const beforeById = new Map(
        (fightsBefore ?? []).map((f) => [f.id, { status: f.status, order_index: f.order_index }])
      );

      const { data: fightsAfter } = await supabase
        .from("fights")
        .select("id, order_index, fighter1_name, fighter2_name, status")
        .eq("event_id", event.id);

      if (fightsAfter?.length) {
        for (const fight of fightsAfter) {
          if (fight.status !== "Finished") continue;
          const before = beforeById.get(fight.id);
          // Only notify when we saw the transition (had previous state and it wasn't already Finished)
          if (!before || before.status === "Finished") continue;

          // Fight n just finished; n+1 is up next. Notify users watching n+1.
          const nextOrderIndex = Number(fight.order_index) + 1;
          const nextFight = fightsAfter.find(
            (f) => Number(f.order_index) === nextOrderIndex
          );
          if (!nextFight) continue;

          const { data: watches } = await supabase
            .from("user_fight_watches")
            .select("user_id")
            .eq("fight_id", nextFight.id)
            .eq("opted_in", true);

          if (watches?.length) {
            const message = `${fight.fighter1_name} vs ${fight.fighter2_name} fight is finished. ${nextFight.fighter1_name} vs ${nextFight.fighter2_name} fight is up next!`;
            for (const w of watches) {
              const { error: insertErr } = await supabase
                .from("notification_logs")
                .insert({
                  user_id: w.user_id,
                  fight_id: nextFight.id,
                  message,
                });
              if (insertErr) {
                console.error("[cron/fight-status] notification_logs insert", {
                  user_id: w.user_id,
                  fight_id: nextFight.id,
                  error: insertErr.message,
                });
              }
            }
          }
        }
      }

      const allNowFinished = fightRows.every((f) => f.status === "Finished");

      if (allNowFinished) {
        await supabase
          .from("events")
          .update({ event_status: "finished" })
          .eq("id", event.id);

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

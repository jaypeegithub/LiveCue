import { NextRequest } from "next/server";
import Twilio from "twilio";
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

          // Fight n just finished; the next fight in card order is the one with lower order_index
          // (mainCard is reversed: index 0 = main event last, highest index = opener first).
          const nextOrderIndex = Number(fight.order_index) - 1;
          const nextFight = fightsAfter.find(
            (f) => Number(f.order_index) === nextOrderIndex
          );
          if (!nextFight) continue;

          const { data: watches, error: watchesError } = await supabase
            .from("user_fight_watches")
            .select("user_id, notification_preference")
            .eq("fight_id", nextFight.id)
            .eq("opted_in", true);

          if (watchesError) {
            console.error("[cron/fight-status] user_fight_watches query", {
              fight_id: nextFight.id,
              error: watchesError.message,
            });
          }
          if (!watches?.length) {
            console.log("[cron/fight-status] no opted-in watchers for next fight", {
              next_fight_id: nextFight.id,
              next_fight: `${nextFight.fighter1_name} vs ${nextFight.fighter2_name}`,
            });
          }

          if (watches?.length) {
            const message = `${fight.fighter1_name} vs ${fight.fighter2_name} fight is finished. ${nextFight.fighter1_name} vs ${nextFight.fighter2_name} fight is up next!`;
            console.log("[cron/fight-status] up-next notification (watchers of *next* fight)", {
              next_fight_id: nextFight.id,
              watcher_count: watches.length,
              N_order_index: fight.order_index,
              N: `${fight.fighter1_name} vs ${fight.fighter2_name}`,
              N_plus_1_order_index: nextFight.order_index,
              N_plus_1: `${nextFight.fighter1_name} vs ${nextFight.fighter2_name}`,
              message,
            });

            const baseUrl =
              process.env.VERCEL_URL
                ? `https://${process.env.VERCEL_URL}`
                : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
            const voiceUrl = `${baseUrl}/api/twilio/voice?fighter1=${encodeURIComponent(nextFight.fighter1_name)}&fighter2=${encodeURIComponent(nextFight.fighter2_name)}`;

            const accountSid = process.env.TWILIO_ACCOUNT_SID;
            const authToken = process.env.TWILIO_AUTH_TOKEN;
            const fromNumber = process.env.TWILIO_PHONE_NUMBER;
            const twilioClient =
              accountSid && authToken
                ? Twilio(accountSid, authToken)
                : null;

            for (const w of watches) {
              const pref = w.notification_preference ?? "sms";
              if (
                pref === "call" &&
                twilioClient &&
                fromNumber
              ) {
                try {
                  const { data: authData, error: authErr } =
                    await supabase.auth.admin.getUserById(w.user_id);
                  if (authErr) {
                    console.error(
                      "[cron/fight-status] auth.admin.getUserById",
                      { user_id: w.user_id, error: authErr.message }
                    );
                  }
                  const phone = (
                    (authData?.user?.user_metadata?.phone_number as string) ?? ""
                  ).trim();
                  if (phone) {
                    await twilioClient.calls.create({
                      to: phone,
                      from: fromNumber,
                      url: voiceUrl,
                    });
                    console.log("[cron/fight-status] Twilio call initiated", {
                      user_id: w.user_id,
                      to: phone.slice(-4).padStart(phone.length, "*"),
                    });
                  } else {
                    console.warn(
                      "[cron/fight-status] no phone for user (call skipped)",
                      { user_id: w.user_id }
                    );
                  }
                } catch (callErr) {
                  console.error(
                    "[cron/fight-status] Twilio call failed",
                    { user_id: w.user_id },
                    callErr
                  );
                }
              } else if (pref === "call" && (!twilioClient || !fromNumber)) {
                console.warn(
                  "[cron/fight-status] Twilio not configured (call skipped)",
                  { user_id: w.user_id }
                );
              }

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
              } else {
                console.log("[cron/fight-status] notification_logs inserted", {
                  user_id: w.user_id,
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

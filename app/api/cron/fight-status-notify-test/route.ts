import { NextRequest } from "next/server";
import Twilio from "twilio";
import { supabase } from "@/lib/supabase-server";

/**
 * Test route: run "up next" notification logic using current DB state only (no ESPN fetch/upsert).
 * Checks all events in the DB (not just today/tomorrow) so you can debug with any event
 * (e.g. Holloway vs Oliveira in a few days). Set a fight to Finished in the DB, then call this.
 *
 * GET /api/cron/fight-status-notify-test
 * Header: Authorization: Bearer YOUR_CRON_SECRET
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

  const results: { eventId: string; eventName: string; eventDate: string | null; triggered: Array<{ finished: string; next: string; watcherCount: number }> }[] = [];

  try {
    const { data: events, error: eventsError } = await supabase
      .from("events")
      .select("id, espn_event_id, name, event_date")
      .order("event_date", { ascending: false });

    if (eventsError || !events?.length) {
      return Response.json({
        test: true,
        ok: true,
        reason: "no_events_in_db",
      });
    }

    const baseUrl = (
      process.env.TWILIO_TWIML_BASE_URL?.trim() ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000"
    ).replace(/\/$/, "");
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;
    const twilioClient =
      accountSid && authToken ? Twilio(accountSid, authToken) : null;

    for (const event of events) {
      const { data: fights, error: fightsError } = await supabase
        .from("fights")
        .select("id, order_index, fighter1_name, fighter2_name, status")
        .eq("event_id", event.id);

      if (fightsError || !fights?.length) continue;

      const eventTriggered: { finished: string; next: string; watcherCount: number }[] = [];
      const processedNextIds = new Set<string>();

      for (const fight of fights) {
        if (fight.status !== "Finished") continue;
        const nextOrderIndex = Number(fight.order_index) - 1;
        const nextFight = fights.find(
          (f) => Number(f.order_index) === nextOrderIndex
        );
        if (!nextFight || processedNextIds.has(nextFight.id)) continue;
        processedNextIds.add(nextFight.id);

        const { data: watches, error: watchesError } = await supabase
          .from("user_fight_watches")
          .select("user_id, notification_preference")
          .eq("fight_id", nextFight.id)
          .eq("opted_in", true);

        if (watchesError || !watches?.length) {
          console.log("[fight-status-notify-test] no opted-in watchers", {
            next_fight: `${nextFight.fighter1_name} vs ${nextFight.fighter2_name}`,
          });
          continue;
        }

        const message = `${fight.fighter1_name} vs ${fight.fighter2_name} fight is finished. ${nextFight.fighter1_name} vs ${nextFight.fighter2_name} fight is up next!`;
        const voiceUrl = `${baseUrl}/api/twilio/voice?fighter1=${encodeURIComponent(nextFight.fighter1_name)}&fighter2=${encodeURIComponent(nextFight.fighter2_name)}`;

        eventTriggered.push({
          finished: `${fight.fighter1_name} vs ${fight.fighter2_name}`,
          next: `${nextFight.fighter1_name} vs ${nextFight.fighter2_name}`,
          watcherCount: watches.length,
        });

        for (const w of watches) {
          const { error: insertErr } = await supabase
            .from("notification_logs")
            .insert({
              user_id: w.user_id,
              fight_id: nextFight.id,
              message,
            });
          if (insertErr) {
            console.error("[fight-status-notify-test] notification_logs insert", {
              user_id: w.user_id,
              error: insertErr.message,
            });
          }

          const pref = w.notification_preference ?? "sms";
          if (pref === "call" && twilioClient && fromNumber) {
            try {
              const { data: profile, error: profileErr } = await supabase
                .from("profiles")
                .select("phone_number")
                .eq("id", w.user_id)
                .maybeSingle();
              if (profileErr) {
                console.error("[fight-status-notify-test] profiles fetch", {
                  user_id: w.user_id,
                  error: profileErr.message,
                });
              }
              const phone = (profile?.phone_number as string | undefined)?.trim();
              if (phone) {
                await twilioClient.calls.create({
                  to: phone,
                  from: fromNumber,
                  url: voiceUrl,
                });
                console.log("[fight-status-notify-test] Twilio call initiated", {
                  user_id: w.user_id,
                  to: phone.slice(-4).padStart(phone.length, "*"),
                });
                const callTriggeredMessage = `CALL TRIGGERED: ${nextFight.fighter1_name} vs ${nextFight.fighter2_name}`;
                await supabase.from("notification_logs").insert({
                  user_id: w.user_id,
                  fight_id: nextFight.id,
                  message: callTriggeredMessage,
                });
              } else {
                console.warn("[fight-status-notify-test] no phone for user", {
                  user_id: w.user_id,
                });
              }
            } catch (callErr) {
              console.error(
                "[fight-status-notify-test] Twilio call failed",
                { user_id: w.user_id },
                callErr
              );
            }
          } else if (pref === "call" && (!twilioClient || !fromNumber)) {
            console.warn(
              "[fight-status-notify-test] Twilio not configured (call skipped)",
              { user_id: w.user_id }
            );
          }
        }
      }

      if (eventTriggered.length) {
        results.push({
          eventId: event.espn_event_id,
          eventName: event.name,
          eventDate: event.event_date ? String(event.event_date).slice(0, 10) : null,
          triggered: eventTriggered,
        });
      }
    }

    return Response.json({
      test: true,
      ok: true,
      eventsChecked: events.length,
      notificationsTriggered: results,
    });
  } catch (e) {
    console.error("[fight-status-notify-test]", e);
    return Response.json(
      {
        test: true,
        ok: false,
        error: e instanceof Error ? e.message : "Notify test failed",
      },
      { status: 500 }
    );
  }
}

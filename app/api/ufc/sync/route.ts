import { NextRequest, NextResponse } from "next/server";
import { fetchESPNScoreboard, getTodayDateStr } from "@/lib/espn";
import {
  upsertEventsAndFights,
  getEventWithFights,
  getPendingSubscriptionsForFight,
  markSubscriptionNotified,
  getNextFight,
} from "@/lib/supabase-server";
import { sendSms } from "@/lib/twilio";

/**
 * POST /api/ufc/sync
 * Cron job: fetch ESPN for today, upsert DB, and send SMS to subscribers when the fight before their selected fight completes.
 * Call every 10s (MVP test) or every 1 min (production). Secure with CRON_SECRET.
 */
export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const dateStr = getTodayDateStr();
    const { events, fights } = await fetchESPNScoreboard(dateStr);
    if (events.length === 0) {
      return NextResponse.json({ ok: true, message: "No event today" });
    }

    const eventIdByEspnId = new Map<string, string>();
    const { events: dbEvents } =
      await upsertEventsAndFights(events, fights, eventIdByEspnId);
    const eventId = dbEvents[0]?.id;
    if (!eventId) {
      return NextResponse.json({ ok: true });
    }

    const eventWithFights = await getEventWithFights(eventId);
    if (!eventWithFights?.fights?.length) return NextResponse.json({ ok: true });

    let notified = 0;
    for (const fight of eventWithFights.fights) {
      if (fight.status !== "complete") continue;
      const nextFight = await getNextFight(eventId, fight.order_index);
      if (!nextFight) continue;
      const subs = await getPendingSubscriptionsForFight(nextFight.id);
      for (const sub of subs) {
        const sent = await sendSms(
          sub.phone,
          `LiveCue: The fight before yours just ended. "${nextFight.fighter1_name} vs ${nextFight.fighter2_name}" is up next! Tune in now.`
        );
        if (sent) {
          await markSubscriptionNotified(sub.id);
          notified++;
        }
      }
    }

    return NextResponse.json({
      ok: true,
      event_id: eventId,
      fights_count: eventWithFights.fights.length,
      notified,
    });
  } catch (e) {
    console.error("sync error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Sync failed" },
      { status: 500 }
    );
  }
}

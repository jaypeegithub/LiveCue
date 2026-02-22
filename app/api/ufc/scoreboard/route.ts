import { NextRequest, NextResponse } from "next/server";
import { fetchESPNScoreboard, getTodayDateStr } from "@/lib/espn";
import {
  upsertEventsAndFights,
  getEventWithFights,
} from "@/lib/supabase-server";

/**
 * GET /api/ufc/scoreboard?date=YYYY-MM-DD
 * Fetches ESPN data for the date, syncs to DB, returns event with fights (with DB ids for subscribing).
 */
export async function GET(req: NextRequest) {
  try {
    const dateStr =
      req.nextUrl.searchParams.get("date") || getTodayDateStr();
    const { events, fights } = await fetchESPNScoreboard(dateStr);
    if (events.length === 0) {
      return NextResponse.json({
        event: null,
        fights: [],
      });
    }
    const eventIdByEspnId = new Map<string, string>();
    const { events: dbEvents } =
      await upsertEventsAndFights(events, fights, eventIdByEspnId);
    const eventId = dbEvents[0]?.id;
    if (!eventId) {
      return NextResponse.json({ event: null, fights: [] });
    }
    const eventWithFights = await getEventWithFights(eventId);
    return NextResponse.json({
      event: eventWithFights
        ? {
            id: eventWithFights.id,
            espn_event_id: eventWithFights.espn_event_id,
            name: eventWithFights.name,
            event_date: eventWithFights.event_date,
            venue: eventWithFights.venue,
          }
        : null,
      fights: eventWithFights?.fights ?? [],
    });
  } catch (e) {
    console.error("scoreboard error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Scoreboard failed" },
      { status: 500 }
    );
  }
}

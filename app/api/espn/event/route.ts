import { fetchEventMainCard, getTodayEST } from "@/lib/espn-event";
import { supabase } from "@/lib/supabase-server";

const DEFAULT_EVENT_ID = "600057329";

type FightRow = { id: string; fighter1_name: string; fighter2_name: string; status: string; order_index?: number };

/** Normalize for matchup key (order-independent). */
function matchupKey(f1: string, f2: string): string {
  const a = (f1 ?? "").trim().toLowerCase();
  const b = (f2 ?? "").trim().toLowerCase();
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

/**
 * One-off exclusions when ESPN mixes cards or has no "cancelled" signal.
 * Cancelled bouts are normally filtered via status === "Cancelled" (from ESPN).
 * Add matchups here only when they’re wrong-card or not marked cancelled by ESPN.
 */
const EXCLUDED_MATCHUPS: Array<[string, string]> = [
  ["Duško Todorović", "Donte Johnson"],
  ["Gaston Bolaños", "JooSang Yoo"],
  ["Gaston Bolaños", "JeongYeong Lee"],
];
function isExcludedMatchup(f1: string, f2: string): boolean {
  const k = matchupKey(f1, f2);
  return EXCLUDED_MATCHUPS.some(
    ([a, b]) => matchupKey(a, b) === k
  );
}

/** Dedupe by matchup: keep one per matchup (prefer Finished), preserve card order by order_index. */
function dedupeAndFilterFights(fights: FightRow[]): FightRow[] {
  const statusRank = (s: string) =>
    s === "Finished" ? 3 : s === "In progress" ? 2 : 1;
  const byKey = new Map<string, FightRow>();
  for (const f of fights) {
    if (f.status === "Cancelled") continue;
    if (isExcludedMatchup(f.fighter1_name, f.fighter2_name)) continue;
    const key = matchupKey(f.fighter1_name, f.fighter2_name);
    const existing = byKey.get(key);
    if (!existing || statusRank(f.status) > statusRank(existing.status)) {
      byKey.set(key, f);
    }
  }
  const list = Array.from(byKey.values());
  list.sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
  return list;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get("eventId") ?? DEFAULT_EVENT_ID;

  try {
    let eventDateYyyyymmdd: string | null = null;

    if (supabase) {
      try {
        const { data: eventRow, error: eventError } = await supabase
          .from("events")
          .select("id, espn_event_id, name, event_date")
          .eq("espn_event_id", eventId)
          .maybeSingle();

        if (!eventError && eventRow) {
          eventDateYyyyymmdd = eventRow.event_date
            ? String(eventRow.event_date).slice(0, 10).replace(/-/g, "")
            : null;

          const { data: fights, error: fightsError } = await supabase
            .from("fights")
            .select("id, fighter1_name, fighter2_name, status, order_index")
            .eq("event_id", eventRow.id)
            .order("order_index", { ascending: true });

          if (!fightsError && fights?.length) {
            const filtered = dedupeAndFilterFights(fights as FightRow[]);
            return Response.json({
              eventName: eventRow.name,
              eventId: eventRow.espn_event_id,
              mainCard: filtered.map((f) => ({
                id: f.id,
                weightClass: "",
                fighter1: f.fighter1_name,
                fighter2: f.fighter2_name,
                record1: "",
                record2: "",
                status: f.status,
              })),
            });
          }
        }
      } catch (dbError) {
        console.error("[event] Supabase fallback:", dbError);
      }
    }

    const dateToTry = eventDateYyyyymmdd ?? getTodayEST().replace(/-/g, "");
    const data = await fetchEventMainCard(eventId, dateToTry);
    if (!data) {
      if (eventDateYyyyymmdd && eventDateYyyyymmdd !== getTodayEST().replace(/-/g, "")) {
        const todayStr = getTodayEST().replace(/-/g, "");
        const dataToday = await fetchEventMainCard(eventId, todayStr);
        if (dataToday) {
          const withIndex = dataToday.mainCard.map((f, i) => ({
            id: "",
            fighter1_name: f.fighter1,
            fighter2_name: f.fighter2,
            status: f.status,
            order_index: i,
          }));
          const filtered = dedupeAndFilterFights(withIndex);
          return Response.json({
            eventName: dataToday.eventName,
            eventId: dataToday.espn_event_id,
            mainCard: filtered.map((f) => ({
              id: null,
              weightClass: "",
              fighter1: f.fighter1_name,
              fighter2: f.fighter2_name,
              record1: "",
              record2: "",
              status: f.status,
            })),
          });
        }
      }
      return Response.json(
        { error: "Event not found", eventId },
        { status: 404 }
      );
    }

    const withIndex = data.mainCard.map((f, i) => ({
      id: "",
      fighter1_name: f.fighter1,
      fighter2_name: f.fighter2,
      status: f.status,
      order_index: i,
    }));
    const filtered = dedupeAndFilterFights(withIndex);
    return Response.json({
      eventName: data.eventName,
      eventId: data.espn_event_id,
      mainCard: filtered.map((f) => ({
        id: null,
        weightClass: "",
        fighter1: f.fighter1_name,
        fighter2: f.fighter2_name,
        record1: "",
        record2: "",
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

import type {
  ESPNScoreboardResponse,
  ESPNEvent,
  ESPNCompetition,
  FightStatus,
  UFCEvent,
  UFCFight,
} from "./ufc-types";

const ESPN_SCOREBOARD =
  "https://site.api.espn.com/apis/site/v2/sports/mma/ufc/scoreboard";

function normalizeFightStatus(competition: ESPNCompetition): FightStatus {
  const state = competition.status?.type?.state;
  const completed = competition.status?.type?.completed;
  if (completed === true || state === "post") return "complete";
  if (state === "in") return "in_progress";
  return "not_started";
}

function competitorDisplayName(c: ESPNCompetition, order: 1 | 2): string {
  const comp = c.competitors?.[order - 1];
  return comp?.athlete?.displayName || comp?.athlete?.fullName || "TBD";
}

function winnerId(c: ESPNCompetition): string | undefined {
  const winner = c.competitors?.find((x) => x.winner);
  return winner?.id;
}

/**
 * Fetch UFC scoreboard for a given date (YYYYMMDD). Returns events with fights and status.
 */
export async function fetchESPNScoreboard(
  dateStr: string
): Promise<{ events: UFCEvent[]; fights: UFCFight[] }> {
  const url = `${ESPN_SCOREBOARD}?dates=${dateStr.replace(/-/g, "")}`;
  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) throw new Error(`ESPN API error: ${res.status}`);
  const data: ESPNScoreboardResponse = await res.json();

  const events: UFCEvent[] = [];
  const fights: UFCFight[] = [];

  for (const ev of data.events || []) {
    const eventDate = ev.date?.slice(0, 10) || dateStr;
    const venue =
      (ev as ESPNEvent & { competitions?: { venue?: { fullName?: string } }[] })
        ?.competitions?.[0]?.venue?.fullName ?? undefined;

    const eventRecord: UFCEvent = {
      id: "",
      espn_event_id: ev.id,
      name: ev.name || "UFC Event",
      event_date: eventDate,
      venue,
    };
    events.push(eventRecord);

    const comps = (ev.competitions || []).slice().sort((a, b) => {
      const aStart = a.startDate || a.date || "";
      const bStart = b.startDate || b.date || "";
      return aStart.localeCompare(bStart);
    });

    comps.forEach((comp, idx) => {
      fights.push({
        id: "",
        event_id: "",
        espn_event_id: ev.id,
        espn_competition_id: comp.id,
        fighter1_name: competitorDisplayName(comp, 1),
        fighter2_name: competitorDisplayName(comp, 2),
        weight_class: comp.type?.abbreviation,
        order_index: idx,
        status: normalizeFightStatus(comp),
        winner_athlete_id: winnerId(comp),
      } as UFCFight & { espn_event_id: string });
    });
  }

  return { events, fights };
}

export function getTodayDateStr(): string {
  return new Date().toISOString().slice(0, 10);
}

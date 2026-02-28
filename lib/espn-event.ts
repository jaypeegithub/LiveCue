const ESPN_SCOREBOARD =
  "https://site.api.espn.com/apis/site/v2/sports/mma/ufc/scoreboard";

const EST = "America/New_York";

/** Current date in EST (YYYY-MM-DD). */
export function getTodayEST(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: EST });
}

/** Parse an ISO date-time and return the date in EST (YYYY-MM-DD). */
export function getDateInEST(isoDateString: string): string {
  if (!isoDateString) return "";
  return new Date(isoDateString).toLocaleDateString("en-CA", { timeZone: EST });
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Format YYYY-MM-DD as "28 Feb 2026". Uses only first 10 chars so ISO datetimes never shift to next day. */
export function formatEventDateDisplay(dateStr: string | null | undefined): string {
  if (dateStr == null || dateStr === "") return "";
  const s = String(dateStr).trim().slice(0, 10);
  if (s.length < 10) return String(dateStr);
  const [y, m, d] = s.split("-").map(Number);
  if (!y || !m || !d || m < 1 || m > 12 || d < 1 || d > 31) return s;
  const month = MONTHS[m - 1];
  return `${d} ${month} ${y}`;
}

export type Competition = {
  id: string;
  date?: string;
  startDate?: string;
  type?: { abbreviation?: string };
  status?: {
    type?: { state?: string; completed?: boolean };
  };
  competitors?: Array<{
    order?: number;
    winner?: boolean;
    athlete?: { fullName?: string; displayName?: string };
    records?: Array<{ summary?: string }>;
  }>;
};

type ESPNEvent = {
  id: string;
  name: string;
  date?: string;
  competitions?: Competition[];
};

type ScoreboardResponse = {
  events?: ESPNEvent[];
  leagues?: Array<{
    calendar?: Array<{
      label: string;
      startDate?: string;
      event?: { $ref?: string };
    }>;
  }>;
};

export type UpcomingEventSummary = {
  espn_event_id: string;
  name: string;
  event_date: string;
  event_date_yyyymmdd: string;
};

const MAIN_CARD_FIGHT_COUNT = 9;

function getFighterName(comp: Competition, order: 1 | 2): string {
  const c = comp.competitors?.[order - 1];
  return c?.athlete?.displayName || c?.athlete?.fullName || "TBD";
}

function getFighterRecord(comp: Competition, order: 1 | 2): string {
  const c = comp.competitors?.[order - 1];
  const rec = c?.records?.find((r) => r.summary);
  return rec?.summary ?? "";
}

export function getFightStatus(
  comp: Competition
): "Finished" | "In progress" | "Not started" {
  const state = comp.status?.type?.state;
  const completed = comp.status?.type?.completed;
  if (completed === true || state === "post") return "Finished";
  if (state === "in") return "In progress";
  return "Not started";
}

export type MainCardFight = {
  espn_competition_id: string;
  weightClass: string;
  fighter1: string;
  fighter2: string;
  record1: string;
  record2: string;
  status: "Finished" | "In progress" | "Not started";
};

export type EventMainCard = {
  espn_event_id: string;
  eventName: string;
  eventDate: string | null;
  /** ISO date-time when the event starts (from ESPN event.date) */
  eventStartTime: string | null;
  mainCard: MainCardFight[];
};

export async function fetchEventMainCard(
  eventId: string,
  eventDate: string
): Promise<EventMainCard | null> {
  try {
    const res = await fetch(`${ESPN_SCOREBOARD}?dates=${eventDate}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const data: ScoreboardResponse = await res.json();
    const event = data.events?.find((e) => e.id === eventId);
    if (!event) return null;

  const competitions = event.competitions ?? [];
  const sorted = [...competitions].sort((a, b) => {
    const aStart = a.startDate || a.date || "";
    const bStart = b.startDate || b.date || "";
    return aStart.localeCompare(bStart);
  });
  const mainCard = sorted.slice(-MAIN_CARD_FIGHT_COUNT).reverse();

  const mainCardFights: MainCardFight[] = mainCard.map((comp) => ({
    espn_competition_id: comp.id,
    weightClass: comp.type?.abbreviation ?? "",
    fighter1: getFighterName(comp, 1),
    fighter2: getFighterName(comp, 2),
    record1: getFighterRecord(comp, 1),
    record2: getFighterRecord(comp, 2),
    status: getFightStatus(comp),
  }));

  const eventDateStr = event.date?.slice(0, 10) ?? null;
  const eventStartTime = event.date ?? null;
  return {
    espn_event_id: event.id,
    eventName: event.name,
    eventDate: eventDateStr,
    eventStartTime,
    mainCard: mainCardFights,
  };
  } catch {
    return null;
  }
}

export async function fetchUpcomingEvents(
  limit: number
): Promise<UpcomingEventSummary[]> {
  try {
    const todayEST = getTodayEST();
    const dateStr = todayEST.replace(/-/g, "");
    const res = await fetch(`${ESPN_SCOREBOARD}?dates=${dateStr}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const data: ScoreboardResponse = await res.json();
    const calendar = data.leagues?.[0]?.calendar ?? [];
    let items = calendar.filter(
      (item) =>
        item.event?.$ref &&
        getDateInEST(item.startDate ?? "") >= todayEST
    );
    if (items.length < limit) {
      items = calendar.filter((item) => item.event?.$ref).slice(0, limit);
    } else {
      items = items.slice(0, limit);
    }
    const result: UpcomingEventSummary[] = [];
    for (const item of items) {
      const ref = item.event!.$ref!;
      const match = ref.match(/events\/(\d+)/);
      const espn_event_id = match ? match[1] : "";
      if (!espn_event_id) continue;
      const startDate = item.startDate ?? "";
      const event_date = getDateInEST(startDate);
      const event_date_yyyymmdd = event_date.replace(/-/g, "");
      result.push({
        espn_event_id,
        name: item.label,
        event_date,
        event_date_yyyymmdd,
      });
    }
    return result;
  } catch {
    return [];
  }
}

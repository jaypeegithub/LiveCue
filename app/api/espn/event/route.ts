const ESPN_SCOREBOARD =
  "https://site.api.espn.com/apis/site/v2/sports/mma/ufc/scoreboard";

type Competition = {
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

type Event = {
  id: string;
  name: string;
  date?: string;
  competitions?: Competition[];
};

type ScoreboardResponse = {
  events?: Event[];
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

function getFightStatus(comp: Competition): "Finished" | "In progress" | "Not started" {
  const state = comp.status?.type?.state;
  const completed = comp.status?.type?.completed;
  if (completed === true || state === "post") return "Finished";
  if (state === "in") return "In progress";
  return "Not started";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get("eventId") ?? "600057329";

  try {
    const eventDate = "20260221";
    const res = await fetch(`${ESPN_SCOREBOARD}?dates=${eventDate}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) throw new Error(`ESPN API error: ${res.status}`);
    const data: ScoreboardResponse = await res.json();

    const event = data.events?.find((e) => e.id === eventId);
    if (!event) {
      return Response.json(
        { error: "Event not found", eventId },
        { status: 404 }
      );
    }

    const competitions = event.competitions ?? [];
    const sorted = [...competitions].sort((a, b) => {
      const aStart = a.startDate || a.date || "";
      const bStart = b.startDate || b.date || "";
      return aStart.localeCompare(bStart);
    });
    const mainCard = sorted.slice(-MAIN_CARD_FIGHT_COUNT).reverse();

    const fights = mainCard.map((comp) => ({
      weightClass: comp.type?.abbreviation ?? "",
      fighter1: getFighterName(comp, 1),
      fighter2: getFighterName(comp, 2),
      record1: getFighterRecord(comp, 1),
      record2: getFighterRecord(comp, 2),
      status: getFightStatus(comp),
    }));

    return Response.json({
      eventName: event.name,
      eventId: event.id,
      mainCard: fights,
    });
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Failed to fetch event" },
      { status: 500 }
    );
  }
}

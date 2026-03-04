import { NextRequest } from "next/server";

const SAY_TEMPLATE =
  "This is LiveCue. Your fight is up next. {{fighter1}} versus {{fighter2}} is about to begin!";

function buildTwiml(fighter1: string, fighter2: string): string {
  const say = SAY_TEMPLATE
    .replace("{{fighter1}}", fighter1)
    .replace("{{fighter2}}", fighter2);
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">${escapeXml(say)}</Say>
</Response>`;
}

/**
 * Returns TwiML for a LiveCue "up next" voice call.
 * Twilio requests this URL when the call is answered (GET or POST).
 * Query params: fighter1, fighter2 (fighter names for the Say content).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const fighter1 = searchParams.get("fighter1")?.trim() || "Fighter 1";
  const fighter2 = searchParams.get("fighter2")?.trim() || "Fighter 2";
  const twiml = buildTwiml(fighter1, fighter2);
  return new Response(twiml, {
    headers: { "Content-Type": "application/xml" },
  });
}

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const fighter1 = searchParams.get("fighter1")?.trim() || "Fighter 1";
  const fighter2 = searchParams.get("fighter2")?.trim() || "Fighter 2";
  const twiml = buildTwiml(fighter1, fighter2);
  return new Response(twiml, {
    headers: { "Content-Type": "application/xml" },
  });
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

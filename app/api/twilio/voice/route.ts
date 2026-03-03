import { NextRequest } from "next/server";

/**
 * Returns TwiML for a LiveCue "up next" voice call.
 * Twilio requests this URL when the call is answered.
 * Query params: fighter1, fighter2 (fighter names for the Say content).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const fighter1 = searchParams.get("fighter1")?.trim() || "Fighter 1";
  const fighter2 = searchParams.get("fighter2")?.trim() || "Fighter 2";

  const say =
    `LiveCue alert. Your fight is up next. ${fighter1} versus ${fighter2} is about to begin. Good luck!`;

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">${escapeXml(say)}</Say>
</Response>`;

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

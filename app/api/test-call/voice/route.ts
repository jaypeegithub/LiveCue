import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const TEST_MESSAGE =
  "LiveCue test call. Your notification system is working.";

function buildTwimlResponse() {
  const twiml =
    '<?xml version="1.0" encoding="UTF-8"?>\n<Response>\n  <Say voice="alice">' +
    TEST_MESSAGE +
    "</Say>\n</Response>";
  return new NextResponse(twiml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
}

/**
 * Returns TwiML for the test call. Twilio requests this URL when the call is answered.
 * Twilio sends POST for "A call comes in" webhooks; we support both GET and POST.
 */
export async function GET() {
  console.log("[api/test-call/voice] GET – TwiML requested");
  return buildTwimlResponse();
}

export async function POST(_request: Request) {
  return buildTwimlResponse();
}

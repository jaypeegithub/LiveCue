import { NextResponse } from "next/server";

const TEST_MESSAGE =
  "LiveCue test call. Your notification system is working.";

/**
 * Returns TwiML for the test call. Twilio requests this URL when the call is answered.
 */
export async function GET() {
  const twiml =
    '<?xml version="1.0" encoding="UTF-8"?>\n<Response>\n  <Say voice="alice">' +
    TEST_MESSAGE +
    "</Say>\n</Response>";

  console.log("[api/test-call/voice] TwiML generated:", JSON.stringify(twiml));
  console.log("[api/test-call/voice] TwiML raw:\n", twiml);

  return new NextResponse(twiml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
}

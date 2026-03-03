import { NextResponse } from "next/server";

const TEST_MESSAGE =
  "LiveCue test call. Your notification system is working.";

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Returns TwiML for the test call. Twilio requests this URL when the call is answered.
 */
export async function GET() {
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">${escapeXml(TEST_MESSAGE)}</Say>
</Response>`;

  return new NextResponse(twiml, {
    headers: { "Content-Type": "application/xml" },
  });
}

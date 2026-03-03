import { NextResponse } from "next/server";
import Twilio from "twilio";

const TEST_PHONE = "REDACTED";

/**
 * GET /api/test-call — Initiates a Twilio voice call to the hardcoded test number
 * with the same flow as the notification trigger (TwiML at /api/test-call/voice).
 */
export async function GET() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    return NextResponse.json(
      {
        ok: false,
        error: "Twilio not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER.",
      },
      { status: 503 }
    );
  }

  const baseUrl =
    process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  if (baseUrl.startsWith("http://localhost") || baseUrl.includes("127.0.0.1")) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Twilio cannot use localhost as the TwiML URL (their servers need to reach it). Use a tunnel (e.g. ngrok: ngrok http 3000) and set NEXT_PUBLIC_APP_URL to your tunnel URL, or test on a deployed URL.",
      },
      { status: 400 }
    );
  }
  const voiceUrl = `${baseUrl}/api/test-call/voice`;
  console.log("[api/test-call] voiceUrl (TwiML):", voiceUrl);

  try {
    const client = Twilio(accountSid, authToken);
    const call = await client.calls.create({
      to: TEST_PHONE,
      from: fromNumber,
      url: voiceUrl,
    });
    console.log("[api/test-call] call created:", call.sid);
    return NextResponse.json({
      ok: true,
      message: "Test call initiated",
      callSid: call.sid,
      to: TEST_PHONE,
    });
  } catch (err: unknown) {
    const twilioErr = err as { message?: string; code?: number; status?: number; moreInfo?: string };
    const message = err instanceof Error ? err.message : "Twilio call failed";
    console.error("[api/test-call] Twilio API error:", {
      message: twilioErr?.message ?? message,
      code: twilioErr?.code,
      status: twilioErr?.status,
      moreInfo: twilioErr?.moreInfo,
      err,
    });
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}

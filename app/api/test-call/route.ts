import { NextResponse } from "next/server";
import Twilio from "twilio";

/**
 * GET /api/test-call — Initiates a Twilio voice call to TEST_CALL_PHONE (env). TwiML at /api/test-call/voice.
 */
export async function GET() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;
  const testPhone = process.env.TEST_CALL_PHONE?.trim();

  if (!accountSid || !authToken || !fromNumber) {
    return NextResponse.json(
      {
        ok: false,
        error: "Twilio not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER.",
      },
      { status: 503 }
    );
  }
  if (!testPhone) {
    return NextResponse.json(
      {
        ok: false,
        error: "Test call number not set. Set TEST_CALL_PHONE in env (e.g. +1xxxxxxxxxx).",
      },
      { status: 503 }
    );
  }

  // Use a stable production URL for TwiML so Twilio never hits a building/preview deployment (which returns HTML and causes Document parse failure).
  const baseUrl = (
    process.env.TWILIO_TWIML_BASE_URL?.trim() ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
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
      to: testPhone,
      from: fromNumber,
      url: voiceUrl,
    });
    console.log("[api/test-call] call created:", call.sid);
    return NextResponse.json({
      ok: true,
      message: "Test call initiated",
      callSid: call.sid,
      to: testPhone,
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

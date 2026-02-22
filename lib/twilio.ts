/**
 * Send SMS via Twilio. Requires TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER.
 */
export async function sendSms(to: string, body: string): Promise<boolean> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !from) {
    console.warn("Twilio not configured; skipping SMS.");
    return false;
  }

  const normalizedTo = to.replace(/\D/g, "");
  const toE164 =
    normalizedTo.length === 10 ? `+1${normalizedTo}` : `+${normalizedTo}`;

  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
      },
      body: new URLSearchParams({
        To: toE164,
        From: from,
        Body: body,
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    console.error("Twilio SMS error:", res.status, err);
    return false;
  }
  return true;
}

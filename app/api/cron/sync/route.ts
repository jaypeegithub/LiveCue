import { NextRequest } from "next/server";

/** Allow time for sync (many ESPN requests). */
export const maxDuration = 60;

/**
 * Vercel Cron: runs every Sunday to refresh the next 3 UFC events.
 * Set CRON_SECRET in Vercel Environment Variables; Vercel sends it in the request.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (
    !process.env.CRON_SECRET ||
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return new Response("Unauthorized", { status: 401 });
  }

  const baseUrl =
    process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  try {
    const res = await fetch(`${baseUrl}/api/espn/sync`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return Response.json(
        { ok: false, error: data.error || res.statusText },
        { status: res.status }
      );
    }
    return Response.json({ ok: true, ...data });
  } catch (e) {
    console.error("[cron/sync]", e);
    return Response.json(
      { ok: false, error: e instanceof Error ? e.message : "Sync failed" },
      { status: 500 }
    );
  }
}

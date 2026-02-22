import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase-server";

/**
 * POST /api/ufc/subscribe
 * Body: { fight_id: string (UUID), phone: string }
 * You will get a text when the fight *before* this one completes (so your fight is next).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const fight_id = body?.fight_id;
    let phone = body?.phone;
    if (!fight_id || !phone) {
      return NextResponse.json(
        { error: "fight_id and phone are required" },
        { status: 400 }
      );
    }
    phone = String(phone).replace(/\D/g, "");
    if (phone.length < 10) {
      return NextResponse.json(
        { error: "Invalid phone number" },
        { status: 400 }
      );
    }
    const phoneE164 = phone.length === 10 ? `+1${phone}` : `+${phone}`;

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("ufc_subscriptions")
      .upsert(
        { fight_id, phone: phoneE164 },
        { onConflict: "fight_id,phone" }
      )
      .select("id, fight_id, phone")
      .single();

    if (error) {
      if (error.code === "23503") {
        return NextResponse.json(
          { error: "Fight not found" },
          { status: 404 }
        );
      }
      throw error;
    }

    return NextResponse.json({
      ok: true,
      message:
        "You're subscribed. We'll text you when the fight before your selected fight ends.",
      subscription: data,
    });
  } catch (e) {
    console.error("subscribe error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Subscribe failed" },
      { status: 500 }
    );
  }
}

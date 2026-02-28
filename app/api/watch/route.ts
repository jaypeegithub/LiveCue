import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace(/^Bearer\s+/i, "").trim();
  if (!token) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return Response.json(
      { error: "Server misconfigured" },
      { status: 503 }
    );
  }

  const supabase = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(token);
  if (userError || !user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { fight_id?: string; notification_preference?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const fightId = body.fight_id;
  const notificationPreference =
    body.notification_preference === "call" ? "call" : "sms";
  if (!fightId || typeof fightId !== "string") {
    return Response.json(
      { error: "fight_id is required" },
      { status: 400 }
    );
  }

  const { data: existing } = await supabase
    .from("user_fight_watches")
    .select("id")
    .eq("user_id", user.id)
    .eq("fight_id", fightId)
    .maybeSingle();

  if (existing) {
    return Response.json({
      alreadyWatching: true,
      message: "You're already watching this fight",
    });
  }

  const { error: insertError } = await supabase.from("user_fight_watches").insert({
    user_id: user.id,
    fight_id: fightId,
    notification_preference: notificationPreference,
    opted_in: false,
  });

  if (insertError) {
    console.error("[watch] insert", insertError);
    return Response.json(
      { error: insertError.message },
      { status: 500 }
    );
  }

  return Response.json({ success: true });
}

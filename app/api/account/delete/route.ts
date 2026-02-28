import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabase as supabaseAdmin } from "@/lib/supabase-server";

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

  if (!supabaseAdmin) {
    return Response.json(
      { error: "Server misconfigured" },
      { status: 503 }
    );
  }

  const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(
    user.id
  );
  if (deleteError) {
    console.error("[account/delete]", deleteError);
    return Response.json(
      { error: deleteError.message },
      { status: 500 }
    );
  }

  return Response.json({ ok: true });
}

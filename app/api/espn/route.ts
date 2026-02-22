const ESPN_MMA_URL = "https://www.espn.com/mma/";

export async function GET() {
  try {
    const res = await fetch(ESPN_MMA_URL, { method: "HEAD" });
    const exists = res.ok;
    return Response.json({ exists });
  } catch {
    return Response.json({ exists: false });
  }
}

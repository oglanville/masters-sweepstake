// GET /api/entries — public leaderboard read. Never returns pin_hash.
import { getClient, publicEntry, json } from "./_lib.mjs";

export default async function handler(req, res) {
  if (req.method !== "GET") return json(res, 405, { error: "Method not allowed" });
  try {
    const sb = getClient();
    const { data, error } = await sb
      .from("entries")
      .select("id,name,picks,paid,created_at")
      .order("created_at", { ascending: true });
    if (error) throw error;
    return json(res, 200, { entries: (data || []).map(publicEntry) });
  } catch (e) {
    return json(res, 500, { error: e.message });
  }
}

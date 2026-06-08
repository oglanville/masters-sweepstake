// GET /api/entries — leaderboard read. Never returns pin_hash.
// Picks stay PRIVATE until the first tee: before lock this returns no entries,
// so nobody (not even via a direct API call) can see others' selections.
import { getClient, publicEntry, json } from "./_lib.mjs";
import { entriesLocked } from "../src/lockConfig.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return json(res, 405, { error: "Method not allowed" });
  if (!entriesLocked()) return json(res, 200, { entries: [], locked: false });
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

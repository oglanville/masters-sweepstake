// POST /api/enter — create a new entry. Rejected once entries are locked.
// Body: { name, pin?, picks: [{key,name,owgr,bucket,flag}] x5 }
import { getClient, normName, hashPin, readBody, json, publicEntry, validatePicks } from "./_lib.mjs";
import { entriesLocked } from "../src/lockConfig.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { error: "Method not allowed" });
  if (entriesLocked()) return json(res, 423, { error: "Entries are now closed." });
  try {
    const body = await readBody(req);
    const name = (body.name || "").trim();
    if (name.length < 3 || !name.includes(" ")) {
      return json(res, 400, { error: "Enter your full name (first and second name)." });
    }
    const perr = validatePicks(body.picks);
    if (perr) return json(res, 400, { error: perr });

    const sb = getClient();
    const name_key = normName(name);
    const { data: existing } = await sb
      .from("entries").select("id").eq("name_key", name_key).maybeSingle();
    if (existing) {
      return json(res, 409, { error: "That name is already entered — log in to edit your picks." });
    }

    const { data, error } = await sb
      .from("entries")
      .insert({ name, name_key, pin_hash: hashPin(body.pin), picks: body.picks, paid: false })
      .select("id,name,picks,paid").single();
    if (error) throw error;
    return json(res, 200, { entry: publicEntry(data) });
  } catch (e) {
    return json(res, 500, { error: e.message });
  }
}

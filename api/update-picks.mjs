// POST /api/update-picks — change an existing entry's picks. Locked after first tee.
// Body: { name, pin?, picks: [{key,name,owgr,bucket,flag}] x5 }
import { getClient, normName, hashPin, readBody, json, publicEntry, validatePicks } from "./_lib.mjs";
import { entriesLocked } from "../src/lockConfig.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { error: "Method not allowed" });
  if (entriesLocked()) return json(res, 423, { error: "Entries are now closed." });
  try {
    const body = await readBody(req);
    const name_key = normName(body.name);
    if (!name_key) return json(res, 400, { error: "Enter your name." });

    const sb = getClient();
    const { data: e, error: lookupErr } = await sb
      .from("entries").select("*").eq("name_key", name_key).maybeSingle();
    if (lookupErr) throw lookupErr;
    if (!e) return json(res, 404, { error: "No entry found for that name." });
    if (e.pin_hash && hashPin(body.pin) !== e.pin_hash) {
      return json(res, 401, { error: "Incorrect PIN." });
    }

    const perr = validatePicks(body.picks);
    if (perr) return json(res, 400, { error: perr });

    const { data, error } = await sb
      .from("entries").update({ picks: body.picks }).eq("id", e.id)
      .select("id,name,picks,paid").single();
    if (error) throw error;
    return json(res, 200, { entry: publicEntry(data) });
  } catch (e) {
    return json(res, 500, { error: e.message });
  }
}

// POST /api/login — look up an entry by name, verify PIN if one was set.
// Works before AND after lock (post-lock the UI shows picks read-only).
// Body: { name, pin? }
import { getClient, normName, hashPin, readBody, json, publicEntry } from "./_lib.mjs";

export default async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { error: "Method not allowed" });
  try {
    const body = await readBody(req);
    const name_key = normName(body.name);
    if (!name_key) return json(res, 400, { error: "Enter your name." });

    const sb = getClient();
    const { data: e, error } = await sb
      .from("entries").select("*").eq("name_key", name_key).maybeSingle();
    if (error) throw error;
    if (!e) return json(res, 404, { error: "No entry found for that name." });

    if (e.pin_hash) {
      if (hashPin(body.pin) !== e.pin_hash) {
        return json(res, 401, { error: "Incorrect PIN." });
      }
    }
    return json(res, 200, { entry: publicEntry(e), hasPin: !!e.pin_hash });
  } catch (e) {
    return json(res, 500, { error: e.message });
  }
}

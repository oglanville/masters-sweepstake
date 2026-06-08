// Shared helpers for the entry serverless functions.
// Files starting with "_" are NOT routed by Vercel — import-only.
import { createClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";

export const BUCKETS = ["1-10", "11-20", "21-30", "31-40", "40+"];

// Service-role client — bypasses RLS. Server-side only; never shipped to browser.
export function getClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Server not configured: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

// Normalise a name for case/accent-insensitive login lookups.
export const normName = (s) =>
  (s || "")
    .normalize("NFKD").replace(/[̀-ͯ]/g, "")
    .trim().replace(/\s+/g, " ").toLowerCase();

// PINs are a low-stakes edit key, not real security — hashed, never stored raw.
export const hashPin = (pin) =>
  pin ? createHash("sha256").update(String(pin)).digest("hex") : null;

// Read+parse a JSON body across Vercel's body shapes.
export async function readBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") { try { return JSON.parse(req.body); } catch { return {}; } }
  return await new Promise((resolve) => {
    let d = "";
    req.on("data", (c) => (d += c));
    req.on("end", () => { try { resolve(d ? JSON.parse(d) : {}); } catch { resolve({}); } });
    req.on("error", () => resolve({}));
  });
}

export function json(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
}

// Never expose pin_hash or internal columns to the browser.
export const publicEntry = (e) => ({
  id: e.id, name: e.name, picks: e.picks || [], paid: !!e.paid,
});

// Validate a picks array: exactly 5 players, one from each OWGR bucket.
export function validatePicks(picks) {
  if (!Array.isArray(picks) || picks.length !== 5) return "Pick exactly 5 players — one per bucket.";
  const seen = new Set();
  for (const p of picks) {
    if (!p || typeof p.name !== "string" || !p.name.trim()) return "Every bucket needs a player selected.";
    if (!BUCKETS.includes(p.bucket)) return "Unknown bucket on a pick.";
    if (seen.has(p.bucket)) return "Only one player allowed per bucket.";
    seen.add(p.bucket);
  }
  for (const b of BUCKETS) if (!seen.has(b)) return `Missing a pick for the ${b} bucket.`;
  return null;
}

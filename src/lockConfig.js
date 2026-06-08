// ─────────────────────────────────────────────────────────────
// SINGLE SOURCE OF TRUTH for when entries lock.
// Imported by the frontend (src/App.jsx, src/Entry.jsx) AND by the
// serverless functions (/api/*.mjs), so the lock can never disagree.
//
// 2026 U.S. Open — Shinnecock Hills. First round: Thursday 18 June 2026.
// First tee is ~6:45am ET (10:45 UTC). Adjust here if the USGA publishes
// a different first tee time — this one timestamp controls everything.
// ─────────────────────────────────────────────────────────────
export const FIRST_TEE_TIME_ISO = "2026-06-18T10:45:00Z";
export const FIRST_TEE_TIME = new Date(FIRST_TEE_TIME_ISO).getTime();

// True once the first player has teed off (entries closed).
export function entriesLocked(now = Date.now()) {
  return now >= FIRST_TEE_TIME;
}

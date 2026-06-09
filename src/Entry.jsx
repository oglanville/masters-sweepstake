import { useState, useEffect, useMemo } from "react";
import { BUCKETS, bucketOptions } from "./owgr.js";
import { FIRST_TEE_TIME, entriesLocked } from "./lockConfig.js";

/* ═══════════════════════════════════════════════════════════════
   US OPEN SWEEPSTAKE — Entry / Login / Pick-selection flow.
   Rendered before first tee. After lock, App.jsx hands over to the
   scoreboard; login here still works but picks become read-only.
   ═══════════════════════════════════════════════════════════════ */

// Monzo.me link, pre-set to £10 with a "US Open 2026" reference.
const MONZO_LINK = "https://monzo.me/oliverglanville/10.00?h=Cjf-gk&d=US%20Open%202026&account_type=personal";

async function post(path, body) {
  const r = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || `Something went wrong (${r.status}).`);
  return data;
}

/* ── Countdown to first tee ── */
function Countdown() {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, []);
  const ms = Math.max(0, FIRST_TEE_TIME - now);
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const cell = (v, l) => (
    <div style={st.cdCell}><div style={st.cdNum}>{String(v).padStart(2, "0")}</div><div style={st.cdLab}>{l}</div></div>
  );
  return <div style={st.cdRow}>{cell(d, "days")}{cell(h, "hrs")}{cell(m, "min")}{cell(s, "sec")}</div>;
}

/* ── One bucket dropdown ── */
function BucketSelect({ bucket, options, value, onChange, disabled }) {
  return (
    <div style={st.field}>
      <label style={st.bucketLabel}>
        <span style={st.bucketTag}>{bucket}</span>
        <span style={st.bucketHint}>OWGR {bucket === "40+" ? "41+" : bucket}</span>
      </label>
      <select
        style={{ ...st.select, ...(disabled ? st.selectDisabled : {}) }}
        value={value?.key || ""}
        onChange={(e) => onChange(options.find((o) => o.key === e.target.value) || null)}
        disabled={disabled}
      >
        <option value="">— select a player —</option>
        {options.map((o) => (
          <option key={o.key} value={o.key}>
            {o.flag} {o.name} (#{o.owgr})
          </option>
        ))}
      </select>
    </div>
  );
}

/* ── Five dropdowns ── */
function PickGrid({ picks, setPick, disabled }) {
  const options = useMemo(() => bucketOptions(), []);
  return (
    <div>
      {BUCKETS.map((b) => (
        <BucketSelect
          key={b}
          bucket={b}
          options={options[b]}
          value={picks[b]}
          onChange={(p) => setPick(b, p)}
          disabled={disabled}
        />
      ))}
    </div>
  );
}

/* ── Rules section ── */
function Rules() {
  const items = [
    ["🏌️", "Five players, one per bucket", "Pick one player from each OWGR band: 1–10, 11–20, 21–30, 31–40, and 40+ (rank 41 to the very last ranked player)."],
    ["🏆", "Main Game — prize money", "Your team scores the combined official US Open prize money earned by your five players. Highest total wins."],
    ["📉", "Lowest Round", "The model automatically takes the single lowest round posted by any of your five players. Tiebreak: the next-lowest round from a different player."],
    ["📈", "Out Performer", "The biggest riser among your five: most places a player beats their pre-tournament OWGR rank by (must make the cut). Tiebreak: the next-largest riser."],
    ["🇺🇸", "US Open notes", "Shinnecock Hills, Southampton NY · 18–21 June 2026. Field of 156; top 60 and ties make the cut. $21.5M purse. Picks lock at the first tee on Thursday."],
  ];
  return (
    <div style={st.rules}>
      <div style={st.rulesTitle}>How it works</div>
      {items.map(([icon, t, b]) => (
        <div key={t} style={st.ruleRow}>
          <span style={st.ruleIcon}>{icon}</span>
          <div><div style={st.ruleHead}>{t}</div><div style={st.ruleBody}>{b}</div></div>
        </div>
      ))}
    </div>
  );
}

/* ── Main flow ── */
export default function Entry({ onViewLeaderboard }) {
  const locked = entriesLocked();
  const [mode, setMode] = useState("home"); // home | enter | login | picks
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [picks, setPicks] = useState({});
  const [entry, setEntry] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [saved, setSaved] = useState(false);

  const setPick = (b, p) => { setPicks((cur) => ({ ...cur, [b]: p })); setSaved(false); };
  const picksArray = () => BUCKETS.map((b) => picks[b]).filter(Boolean);
  const allFive = picksArray().length === 5;

  // Load picks (object keyed by bucket) from a saved entry's picks array.
  const loadEntry = (e) => {
    setEntry(e);
    const byBucket = {};
    for (const p of e.picks || []) byBucket[p.bucket] = p;
    setPicks(byBucket);
    setMode("picks");
    setSaved(true);
  };

  async function submitNew() {
    setErr(null); setBusy(true);
    try {
      const { entry: e } = await post("/api/enter", { name: name.trim(), pin: pin || null, picks: picksArray() });
      loadEntry(e);
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  }
  async function doLogin() {
    setErr(null); setBusy(true);
    try {
      const { entry: e } = await post("/api/login", { name: name.trim(), pin: pin || null });
      loadEntry(e);
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  }
  async function savePicks() {
    setErr(null); setBusy(true);
    try {
      const { entry: e } = await post("/api/update-picks", { name: entry.name, pin: pin || null, picks: picksArray() });
      setEntry(e); setSaved(true);
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  }

  return (
    <div style={st.wrap}>
      <header style={st.hdr}>
        <div style={{ fontSize: 30 }}>⛳</div>
        <div style={{ flex: 1 }}>
          <h1 style={st.title}>The US Open Sweepstake <span style={st.year}>2026</span></h1>
          <div style={st.meta}>Shinnecock Hills · 18–21 June</div>
        </div>
      </header>

      <main style={st.main}>
        {locked && (
          <div style={st.closedBanner}>
            <strong>Entries are now closed</strong>
            <div style={st.closedSub}>The first player has teed off. You can still log in to view your picks.</div>
          </div>
        )}

        {err && <div style={st.error}>{err}</div>}

        {/* ── HOME ── */}
        {mode === "home" && (
          <>
            {!locked && (
              <div style={st.callout}>
                <div style={st.calloutT}>You can edit your picks until the first tee time</div>
                <Countdown />
              </div>
            )}
            <div style={st.btnRow}>
              {!locked && (
                <button style={st.primary} onClick={() => { setErr(null); setName(""); setPin(""); setPicks({}); setMode("enter"); }}>
                  Enter the sweepstake
                </button>
              )}
              <button style={locked ? st.primary : st.secondary} onClick={() => { setErr(null); setName(""); setPin(""); setMode("login"); }}>
                {locked ? "Log in to view your picks" : "Log in to edit"}
              </button>
              {locked && <button style={st.ghost} onClick={onViewLeaderboard}>View live scoreboard →</button>}
            </div>
            <Rules />
          </>
        )}

        {/* ── NEW ENTRY ── */}
        {mode === "enter" && (
          <>
            <BackLink onClick={() => setMode("home")} />
            <h2 style={st.h2}>New entry</h2>
            <Labeled label="Full name (first & second name)">
              <input style={st.input} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sam Adams" />
            </Labeled>
            <Labeled label="PIN (optional — lets you log back in to edit)">
              <input style={st.input} value={pin} onChange={(e) => setPin(e.target.value)} placeholder="optional" inputMode="numeric" />
            </Labeled>
            <div style={st.calloutSm}>You can edit your picks until the first tee time.</div>
            <PickGrid picks={picks} setPick={setPick} disabled={false} />
            <a href={MONZO_LINK} target="_blank" rel="noopener noreferrer" style={st.payBtn}>
              <span style={{ fontSize: 16, marginRight: 6 }}>💳</span>Pay £10 entry fee
            </a>
            <div style={st.payNote}>Secure Monzo link — pay by Apple Pay, Google Pay or card. Opens in a new tab; come back here to submit your entry.</div>
            <button style={{ ...st.primary, opacity: allFive && name.trim() ? 1 : 0.5 }} disabled={!allFive || !name.trim() || busy} onClick={submitNew}>
              {busy ? "Submitting…" : "Submit entry"}
            </button>
          </>
        )}

        {/* ── LOGIN ── */}
        {mode === "login" && (
          <>
            <BackLink onClick={() => setMode("home")} />
            <h2 style={st.h2}>Log in</h2>
            <Labeled label="Full name"><input style={st.input} value={name} onChange={(e) => setName(e.target.value)} placeholder="The name you entered with" /></Labeled>
            <Labeled label="PIN (if you set one)"><input style={st.input} value={pin} onChange={(e) => setPin(e.target.value)} placeholder="leave blank if none" inputMode="numeric" /></Labeled>
            <button style={{ ...st.primary, opacity: name.trim() ? 1 : 0.5 }} disabled={!name.trim() || busy} onClick={doLogin}>
              {busy ? "Checking…" : "Log in"}
            </button>
          </>
        )}

        {/* ── PICKS (after enter/login) ── */}
        {mode === "picks" && entry && (
          <>
            <div style={st.welcome}>Logged in as <strong>{entry.name}</strong></div>
            {locked ? (
              <div style={st.calloutSm}><strong>Entries are closed</strong> — your picks are locked in and shown below.</div>
            ) : (
              <div style={st.callout}>
                <div style={st.calloutT}>You can edit your picks until the first tee time</div>
                <Countdown />
              </div>
            )}
            <PickGrid picks={picks} setPick={setPick} disabled={locked} />
            {!locked && (
              <button style={{ ...st.primary, opacity: allFive ? 1 : 0.5 }} disabled={!allFive || busy} onClick={savePicks}>
                {busy ? "Saving…" : saved ? "Saved ✓ — update picks" : "Save picks"}
              </button>
            )}
            {saved && !busy && !locked && <div style={st.savedNote}>Your picks are saved. Come back any time before first tee to change them.</div>}
            {locked && <button style={st.ghost} onClick={onViewLeaderboard}>View live scoreboard →</button>}
            <Rules />
          </>
        )}
      </main>
      <footer style={st.footer}>Picks lock at the first tee · Thursday 18 June 2026</footer>
    </div>
  );
}

function BackLink({ onClick }) { return <button style={st.back} onClick={onClick}>← Back</button>; }
function Labeled({ label, children }) { return <div style={st.field}><div style={st.fieldLabel}>{label}</div>{children}</div>; }

/* ── Styles (cohesive with the dashboard shell) ── */
const GREEN = "#1a472a", GOLD = "#f4d35e", CREAM = "#f5f0e8";
const st = {
  wrap: { fontFamily: "'Source Sans 3',sans-serif", background: CREAM, minHeight: "100vh", color: "#1a1a1a", maxWidth: 480, margin: "0 auto" },
  hdr: { background: "linear-gradient(165deg,#0d3320 0%,#1a472a 40%,#2d6b3f 100%)", padding: "20px 16px 16px", display: "flex", alignItems: "center", gap: 10 },
  title: { fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 800, color: GOLD, margin: 0, lineHeight: 1.1 },
  year: { fontWeight: 400, fontSize: "0.6em" },
  meta: { fontSize: 11, color: "rgba(255,255,255,0.6)", marginTop: 2 },
  main: { padding: "16px 14px" },
  h2: { fontFamily: "'Playfair Display',serif", fontSize: 20, color: GREEN, margin: "4px 0 12px" },
  callout: { background: "rgba(26,71,42,0.07)", border: "1px solid rgba(26,71,42,0.18)", borderRadius: 10, padding: "12px 14px", marginBottom: 14, textAlign: "center" },
  calloutT: { fontSize: 13, fontWeight: 700, color: GREEN, marginBottom: 8 },
  calloutSm: { background: "rgba(26,71,42,0.07)", border: "1px solid rgba(26,71,42,0.18)", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#555", marginBottom: 12 },
  closedBanner: { background: "#fde8e8", border: "1px solid #f5c2c2", borderRadius: 10, padding: "12px 14px", marginBottom: 14, color: "#8a1f1f" },
  closedSub: { fontSize: 12, color: "#a14545", marginTop: 2 },
  cdRow: { display: "flex", justifyContent: "center", gap: 8 },
  cdCell: { background: "#fff", borderRadius: 8, padding: "6px 10px", minWidth: 48, border: "1px solid #e0ddd5" },
  cdNum: { fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 800, color: GREEN, lineHeight: 1 },
  cdLab: { fontSize: 9, textTransform: "uppercase", color: "#999", letterSpacing: "0.4px", marginTop: 2 },
  btnRow: { display: "flex", flexDirection: "column", gap: 10, marginBottom: 18 },
  primary: { width: "100%", padding: "13px", background: GREEN, color: GOLD, border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" },
  secondary: { width: "100%", padding: "13px", background: "#fff", color: GREEN, border: `1.5px solid ${GREEN}`, borderRadius: 10, fontSize: 15, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" },
  ghost: { width: "100%", padding: "10px", background: "none", color: "#666", border: "none", fontSize: 13, fontFamily: "inherit", cursor: "pointer", textDecoration: "underline" },
  back: { background: "none", border: "none", color: "#666", fontSize: 13, fontFamily: "inherit", cursor: "pointer", padding: "4px 0", marginBottom: 4 },
  field: { marginBottom: 12 },
  fieldLabel: { fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 4 },
  input: { width: "100%", padding: "11px 12px", border: "1px solid #d8d4ca", borderRadius: 8, fontSize: 15, fontFamily: "inherit", background: "#fff" },
  bucketLabel: { display: "flex", alignItems: "center", gap: 6, marginBottom: 4 },
  bucketTag: { background: GREEN, color: GOLD, fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4 },
  bucketHint: { fontSize: 10, color: "#999", textTransform: "uppercase", letterSpacing: "0.4px" },
  select: { width: "100%", padding: "11px 12px", border: "1px solid #d8d4ca", borderRadius: 8, fontSize: 14, fontFamily: "inherit", background: "#fff", appearance: "auto" },
  selectDisabled: { background: "#f0ede6", color: "#444", cursor: "not-allowed" },
  welcome: { fontSize: 13, color: "#555", marginBottom: 12 },
  savedNote: { fontSize: 12, color: GREEN, marginTop: 8 },
  payBtn: { display: "flex", alignItems: "center", justifyContent: "center", width: "100%", padding: "13px", marginBottom: 8, background: "#14233c", color: "#fff", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700, fontFamily: "inherit", cursor: "pointer", textDecoration: "none", boxSizing: "border-box" },
  payNote: { fontSize: 11, color: "#888", textAlign: "center", marginBottom: 12, lineHeight: 1.4 },
  error: { background: "#fde8e8", border: "1px solid #f5c2c2", color: "#8a1f1f", borderRadius: 8, padding: "10px 12px", fontSize: 13, marginBottom: 12 },
  rules: { marginTop: 18, paddingTop: 14, borderTop: "2px solid rgba(26,71,42,0.15)" },
  rulesTitle: { fontFamily: "'Playfair Display',serif", fontSize: 18, color: GREEN, marginBottom: 10 },
  ruleRow: { display: "flex", gap: 10, background: "#fff", border: "1px solid #e0ddd5", borderRadius: 10, padding: 12, marginBottom: 8 },
  ruleIcon: { fontSize: 20, flexShrink: 0 },
  ruleHead: { fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 14, color: GREEN, marginBottom: 2 },
  ruleBody: { fontSize: 12.5, color: "#555", lineHeight: 1.5 },
  footer: { textAlign: "center", padding: "16px 12px", fontSize: 10, color: "#999" },
};

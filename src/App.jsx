import { useState, useEffect, useCallback } from "react";

/* ═══ ESPN API ═══ */
const ESPN_URL = "https://site.api.espn.com/apis/site/v2/sports/golf/pga/scoreboard";

function useLiveData() {
  const [ld, setLd] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [ts, setTs] = useState(null);
  const fetch_ = useCallback(async () => {
    try {
      const r = await fetch(ESPN_URL); if (!r.ok) throw new Error(`${r.status}`);
      const d = await r.json(), evs = d?.events || [];
      let ev = evs.find(e => e.name?.toLowerCase().includes("masters")) || evs[0];
      if (!ev) { setLd({ status: "no-event", players: [] }); setLoading(false); setTs(new Date()); return; }
      const comp = ev.competitions?.[0];
      const players = (comp?.competitors || []).map(c => {
        const a = c.athlete || {};
        /* FIX 2: treat "E" round score as 0 (even par) so it counts in lowest-round game */
        const rounds = (c.linescores || []).map(ls => ({
          score: ls.displayValue === "E" ? 0 : (parseInt(ls.displayValue) || null)
        }));
        return { name: a.displayName || "", position: parseInt(c.status?.position?.id) || null, positionDisplay: c.status?.position?.displayName || "—", toPar: c.score?.displayValue || "E", toParValue: c.score?.value ?? null, rounds, earnings: c.earnings ? parseFloat(c.earnings) : 0, isCut: c.status?.type?.name === "STATUS_CUT" };
      });
      const st = ev.status?.type?.name || "STATUS_SCHEDULED";
      setLd({ status: st === "STATUS_FINAL" ? "complete" : st === "STATUS_IN_PROGRESS" ? "live" : "pre-tournament", statusDetail: ev.status?.type?.detail || "", players });
      setErr(null); setTs(new Date());
    } catch (e) { setErr(e.message); } finally { setLoading(false); }
  }, []);
  useEffect(() => { fetch_(); const i = setInterval(fetch_, 60000); return () => clearInterval(i); }, [fetch_]);
  return { ld, loading, err, ts, refresh: fetch_ };
}

const norm = s => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
/* FIX 1: first-initial + last-name fallback to distinguish Nicolai vs Rasmus Hojgaard */
const initLast = s => { const p = s.split(" "); return (p[0]?.[0] || "") + (p[p.length - 1] || ""); };

function buildLPM(ld, db) {
  if (!ld?.players) return {};
  const m = {};
  for (const lp of ld.players) {
    const l = norm(lp.name || "");
    for (const [k, p] of Object.entries(db)) {
      const dl = norm(p.name);
      if (dl === l || initLast(dl) === initLast(l)) { if (!m[k]) m[k] = lp; break; }
    }
  }
  return m;
}

/* ═══ DATA ═══ */
const P = {
  // Bucket 1-10
  scheffler: { name: "Scottie Scheffler", owgr: 1, bucket: "1-10", flag: "🇺🇸" },
  mcilroy: { name: "Rory McIlroy", owgr: 2, bucket: "1-10", flag: "🇬🇧" },
  rose: { name: "Justin Rose", owgr: 9, bucket: "1-10", flag: "🇬🇧" },
  fleetwood: { name: "Tommy Fleetwood", owgr: 4, bucket: "1-10", flag: "🇬🇧" },
  gotterup: { name: "Chris Gotterup", owgr: 11, bucket: "1-10", flag: "🇺🇸" },
  henley: { name: "Russell Henley", owgr: 12, bucket: "1-10", flag: "🇺🇸" },
  spaun: { name: "J.J. Spaun", owgr: 5, bucket: "1-10", flag: "🇺🇸" },
  macintyre: { name: "Robert MacIntyre", owgr: 8, bucket: "1-10", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿" },
  schauffele: { name: "Xander Schauffele", owgr: 10, bucket: "1-10", flag: "🇺🇸" },
  // Bucket 11-20
  matsuyama: { name: "Hideki Matsuyama", owgr: 14, bucket: "11-20", flag: "🇯🇵" },
  jthomas: { name: "Justin Thomas", owgr: 15, bucket: "11-20", flag: "🇺🇸" },
  straka: { name: "Sepp Straka", owgr: 13, bucket: "11-20", flag: "🇦🇹" },
  hovland: { name: "Viktor Hovland", owgr: 22, bucket: "11-20", flag: "🇳🇴" },
  reed: { name: "Patrick Reed", owgr: 23, bucket: "11-20", flag: "🇺🇸" },
  morikawa: { name: "Collin Morikawa", owgr: 7, bucket: "11-20", flag: "🇺🇸" },
  aberg: { name: "Ludvig Åberg", owgr: 17, bucket: "11-20", flag: "🇸🇪" },
  // Bucket 21-30
  cyoung: { name: "Cameron Young", owgr: 3, bucket: "21-30", flag: "🇺🇸" },
  fitzpatrick: { name: "Matt Fitzpatrick", owgr: 6, bucket: "21-30", flag: "🇬🇧" },
  hatton: { name: "Tyrrell Hatton", owgr: 31, bucket: "21-30", flag: "🇬🇧" },
  rai: { name: "Aaron Rai", owgr: 39, bucket: "21-30", flag: "🇬🇧" },
  burns: { name: "Sam Burns", owgr: 33, bucket: "21-30", flag: "🇺🇸" },
  lowry: { name: "Shane Lowry", owgr: 32, bucket: "21-30", flag: "🇮🇪" },
  cantlay: { name: "Patrick Cantlay", owgr: 35, bucket: "21-30", flag: "🇺🇸" },
  // Bucket 31-40
  penge: { name: "Marco Penge", owgr: 37, bucket: "31-40", flag: "🇬🇧" },
  conners: { name: "Corey Conners", owgr: 44, bucket: "31-40", flag: "🇨🇦" },
  dechambeau: { name: "Bryson DeChambeau", owgr: 24, bucket: "31-40", flag: "🇺🇸" },
  day: { name: "Jason Day", owgr: 41, bucket: "31-40", flag: "🇦🇺" },
  // Bucket 40+
  mkim: { name: "Michael Kim", owgr: 43, bucket: "40+", flag: "🇺🇸" },
  harman: { name: "Brian Harman", owgr: 50, bucket: "40+", flag: "🇺🇸" },
  bhatia: { name: "Akshay Bhatia", owgr: 21, bucket: "40+", flag: "🇺🇸" },
  nhoigaard: { name: "Nicolai Højgaard", owgr: 36, bucket: "40+", flag: "🇩🇰" },
  mwlee: { name: "Min Woo Lee", owgr: 25, bucket: "40+", flag: "🇦🇺" },
  berger: { name: "Daniel Berger", owgr: 38, bucket: "40+", flag: "🇺🇸" },
  wclark: { name: "Wyndham Clark", owgr: 78, bucket: "40+", flag: "🇺🇸" },
  knapp: { name: "Jake Knapp", owgr: 42, bucket: "40+", flag: "🇺🇸" },
  echavarria: { name: "Nico Echavarria", owgr: 40, bucket: "40+", flag: "🇨🇴" },
  rahm: { name: "Jon Rahm", owgr: 30, bucket: "40+", flag: "🇪🇸" },
  hli: { name: "Haotong Li", owgr: 84, bucket: "40+", flag: "🇨🇳" },
  homa: { name: "Max Homa", owgr: 163, bucket: "40+", flag: "🇺🇸" },
  ascott: { name: "Adam Scott", owgr: 53, bucket: "40+", flag: "🇦🇺" },
  spieth: { name: "Jordan Spieth", owgr: 61, bucket: "40+", flag: "🇺🇸" },
  woodland: { name: "Gary Woodland", owgr: 52, bucket: "40+", flag: "🇺🇸" },
  koepka: { name: "Brooks Koepka", owgr: 169, bucket: "40+", flag: "🇺🇸" },
  zjohnson: { name: "Zach Johnson", owgr: 320, bucket: "40+", flag: "🇺🇸" },
};

const BC = { "1-10": { bg: "#1a472a", t: "#f4d35e" }, "11-20": { bg: "#2d5a3d", t: "#fff" }, "21-30": { bg: "#3d7a52", t: "#fff" }, "31-40": { bg: "#5a9a6e", t: "#fff" }, "40+": { bg: "#7ab88a", t: "#1a472a" } };
const BUCKET_ORDER = { "1-10": 0, "11-20": 1, "21-30": 2, "31-40": 3, "40+": 4 };
const sortPicksByBucket = (picks) => [...picks].sort((a, b) => (BUCKET_ORDER[P[a]?.bucket] ?? 9) - (BUCKET_ORDER[P[b]?.bucket] ?? 9));

// 43 Entrants
const ENTRANTS = [
  { name: "S.Gear-Rogalski", picks: ["scheffler", "aberg", "rahm", "cantlay", "spieth"], paid: false },
  { name: "J.Boardman", picks: ["fitzpatrick", "gotterup", "mwlee", "lowry", "hli"], paid: true },
  { name: "A.Lumsden", picks: ["mcilroy", "aberg", "rahm", "lowry", "woodland"], paid: false },
  { name: "S.Adams", picks: ["scheffler", "aberg", "dechambeau", "nhoigaard", "ascott"], paid: false },
  { name: "A.Glanville", picks: ["rose", "aberg", "dechambeau", "burns", "ascott"], paid: false },
  { name: "H.Eldridge", picks: ["scheffler", "matsuyama", "mwlee", "hatton", "ascott"], paid: false },
  { name: "H.Swindell", picks: ["mcilroy", "aberg", "rahm", "hatton", "knapp"], paid: false },
  { name: "O.Gilroy", picks: ["fleetwood", "aberg", "dechambeau", "cantlay", "knapp"], paid: true },
  { name: "E.Oliver", picks: ["scheffler", "aberg", "rahm", "cantlay", "knapp"], paid: false },
  { name: "J.Glanville", picks: ["scheffler", "aberg", "dechambeau", "cantlay", "spieth"], paid: false },
  { name: "J.Pickard", picks: ["fitzpatrick", "aberg", "dechambeau", "penge", "ascott"], paid: true },
  { name: "A.Simpson", picks: ["rose", "aberg", "dechambeau", "hatton", "day"], paid: false },
  { name: "J.Wreghitt", picks: ["scheffler", "aberg", "dechambeau", "hatton", "homa"], paid: true },
  { name: "N.Mays", picks: ["cyoung", "aberg", "bhatia", "nhoigaard", "woodland"], paid: false },
  { name: "H.Willis", picks: ["scheffler", "aberg", "rahm", "nhoigaard", "conners"], paid: true },
  { name: "E.Stringer", picks: ["fitzpatrick", "aberg", "rahm", "hatton", "zjohnson"], paid: true },
  { name: "L.Swindell", picks: ["scheffler", "gotterup", "rahm", "lowry", "conners"], paid: false },
  { name: "M.Van Der Vorm", picks: ["mcilroy", "matsuyama", "dechambeau", "lowry", "ascott"], paid: true },
  { name: "A.Breakspear", picks: ["scheffler", "aberg", "bhatia", "penge", "conners"], paid: false },
  { name: "T.Harty", picks: ["fleetwood", "aberg", "mwlee", "nhoigaard", "day"], paid: false },
  { name: "R.Harty", picks: ["scheffler", "matsuyama", "rahm", "cantlay", "day"], paid: false },
  { name: "M.Harty", picks: ["schauffele", "jthomas", "dechambeau", "cantlay", "lowry"], paid: false },
  { name: "C.Turpin", picks: ["schauffele", "matsuyama", "rahm", "nhoigaard", "koepka"], paid: true },
  { name: "J.Bell", picks: ["rose", "henley", "rahm", "echavarria", "ascott"], paid: true },
  { name: "S.Glanville", picks: ["mcilroy", "aberg", "mwlee", "hatton", "koepka"], paid: false },
  { name: "T.Ishmael", picks: ["scheffler", "aberg", "rahm", "cantlay", "koepka"], paid: false },
  { name: "J.Campling", picks: ["fitzpatrick", "gotterup", "rahm", "berger", "spieth"], paid: true },
  { name: "O.Mays", picks: ["macintyre", "aberg", "dechambeau", "lowry", "conners"], paid: true },
  { name: "H.Ball", picks: ["mcilroy", "aberg", "dechambeau", "lowry", "conners"], paid: true },
  { name: "G.Bilson", picks: ["schauffele", "aberg", "dechambeau", "rai", "echavarria"], paid: true },
  { name: "B.Cook", picks: ["cyoung", "gotterup", "rahm", "cantlay", "conners"], paid: true },
  { name: "R.Wade", picks: ["fleetwood", "gotterup", "dechambeau", "lowry", "koepka"], paid: true },
  { name: "C.Glanville", picks: ["cyoung", "aberg", "dechambeau", "nhoigaard", "knapp"], paid: false },
  { name: "J.Gambler", picks: ["mcilroy", "aberg", "reed", "hatton", "harman"], paid: false },
  { name: "M.Lowen", picks: ["rose", "aberg", "rahm", "burns", "harman"], paid: true },
  { name: "E.Morley-Smith", picks: ["cyoung", "aberg", "dechambeau", "hatton", "day"], paid: true },
  { name: "G.Morley-Smith", picks: ["fitzpatrick", "matsuyama", "bhatia", "hatton", "day"], paid: true },
  { name: "L.Butler", picks: ["morikawa", "aberg", "rahm", "hatton", "koepka"], paid: true },
  { name: "J.Cunningham", picks: ["scheffler", "aberg", "dechambeau", "hatton", "day"], paid: false },
  { name: "L.Hunt", picks: ["scheffler", "jthomas", "dechambeau", "lowry", "wclark"], paid: true },
  { name: "M.Crawford", picks: ["fleetwood", "aberg", "dechambeau", "lowry", "ascott"], paid: true },
  { name: "M.Nuttall", picks: ["schauffele", "aberg", "rahm", "lowry", "burns"], paid: true },
  { name: "R.Hardingham", picks: ["spaun", "straka", "dechambeau", "burns", "conners"], paid: true },
];

const TABS = [
  { id: "home", label: "Home" }, { id: "picks", label: "Picks" }, { id: "main", label: "Main" },
  { id: "lowest", label: "Low Rd" }, { id: "outperformer", label: "Out Perf" }, { id: "rules", label: "Rules" },
];

/* ═══ HELPERS ═══ */
const OL = ({ rank, style: st }) => <span style={{ ...st }}>#{rank}</span>;
const getTotal = (e, lpm) => e.picks.reduce((s, k) => s + (lpm[k]?.earnings || 0), 0);
const fmtD = (v) => v ? `$${(v / 1000).toFixed(0)}k` : "—";
/* FIX 3: $X.XM formatter for concurrent main-game scoring */
const fmtM = (v) => v >= 1000000 ? `$${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : v ? `$${v}` : "—";
const fmtFull = (v) => v ? `$${v.toLocaleString()}` : "—";
const sn = (k) => P[k]?.name?.split(" ").pop() || k;

/* ═══ SCORE BADGE ═══ FIX 4 */
function ScoreBadge({ toPar, toParValue }) {
  if (toPar === undefined || toPar === null) return null;
  const v = toParValue ?? 0;
  const bg = v < 0 ? "#fde8e8" : v > 0 ? "#f0f0f0" : "#e8f4e8";
  const color = v < 0 ? "#c0392b" : v > 0 ? "#777" : "#27ae60";
  return (
    <span style={{ display: "inline-block", padding: "1px 5px", borderRadius: 3, background: bg, color, fontWeight: 700, fontSize: 10, marginLeft: 3 }}>
      {toPar}
    </span>
  );
}

/*
  ══════════════════════════════════════════════════
  GAME 2 — LOWEST ROUND
  ══════════════════════════════════════════════════
*/
function getPlayerBestRound(k, lpm) {
  const r = lpm[k]?.rounds;
  if (!r?.length) return null;
  /* FIX 2: 0 (E) is a valid score — filter null only, not falsy */
  const s = r.map(x => x.score).filter(x => x !== null);
  return s.length ? Math.min(...s) : null;
}

function getLRRanking(entrant, lpm) {
  return entrant.picks
    .map(k => ({ key: k, name: P[k]?.name, bestRound: getPlayerBestRound(k, lpm) }))
    .filter(x => x.bestRound !== null)
    .sort((a, b) => a.bestRound - b.bestRound);
}

function sortLR(ents, lpm) {
  return [...ents].sort((a, b) => {
    const ar = getLRRanking(a, lpm), br = getLRRanking(b, lpm);
    const a1 = ar[0]?.bestRound ?? 999, b1 = br[0]?.bestRound ?? 999;
    if (a1 !== b1) return a1 - b1;
    const a2 = ar[1]?.bestRound ?? 999, b2 = br[1]?.bestRound ?? 999;
    return a2 - b2;
  });
}

/*
  ══════════════════════════════════════════════════
  GAME 3 — OUT PERFORMER
  ══════════════════════════════════════════════════
*/
function getOPRanking(entrant, lpm) {
  return entrant.picks
    .map(k => {
      const p = P[k], lp = lpm[k];
      const fin = lp?.position || null, cut = lp?.isCut || false;
      const places = fin && !cut ? (p?.owgr || 0) - fin : null;
      return { key: k, name: p?.name, owgr: p?.owgr, finish: fin, places, isCut: cut };
    })
    .sort((a, b) => {
      if (a.places === null && b.places === null) return 0;
      if (a.places === null) return 1;
      if (b.places === null) return -1;
      return b.places - a.places;
    });
}

function sortOP(ents, lpm) {
  return [...ents].sort((a, b) => {
    const ar = getOPRanking(a, lpm), br = getOPRanking(b, lpm);
    const a1 = ar[0]?.places ?? -999, b1 = br[0]?.places ?? -999;
    if (a1 !== b1) return b1 - a1;
    const a2 = ar[1]?.places ?? -999, b2 = br[1]?.places ?? -999;
    return b2 - a2;
  });
}

/* ═══ ANALYSIS ═══ */
function analyseMain(ent, all, lpm) {
  const isLive = Object.keys(lpm).length > 0;
  const mySet = new Set(ent.picks), myTot = getTotal(ent, lpm);
  const matchups = [];
  for (const opp of all) {
    if (opp.name === ent.name) continue;
    const os = new Set(opp.picks);
    const sh = ent.picks.filter(p => os.has(p)), mu = ent.picks.filter(p => !os.has(p)), ou = opp.picks.filter(p => !mySet.has(p));
    matchups.push({ opp: opp.name, shared: sh.map(sn), myU: mu.map(k => ({ key: k, name: P[k]?.name, owgr: P[k]?.owgr, earn: lpm[k]?.earnings || 0 })), oppU: ou.map(k => ({ key: k, name: P[k]?.name, owgr: P[k]?.owgr, earn: lpm[k]?.earnings || 0 })), sc: sh.length, gap: isLive ? myTot - getTotal(opp, lpm) : null });
  }
  matchups.sort((a, b) => a.gap !== null && b.gap !== null ? Math.abs(a.gap) - Math.abs(b.gap) : b.sc - a.sc);
  const oth = all.filter(e => e.name !== ent.name).flatMap(e => e.picks);
  const pc = {}; oth.forEach(p => { pc[p] = (pc[p] || 0) + 1; });
  const excl = ent.picks.filter(p => !pc[p]).map(k => P[k]?.name);
  const tp = {}; oth.forEach(p => { if (!mySet.has(p)) tp[p] = (tp[p] || 0) + 1; });
  const threats = Object.entries(tp).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, c]) => ({ name: P[k]?.name, count: c, earn: lpm[k]?.earnings || 0 }));
  return { km: matchups.slice(0, 3), excl, threats, myTot, isLive };
}

/* ═══ PATH TO VICTORY ═══ */
function PTV({ entrant, all, lpm }) {
  const [og, setOg] = useState(null);
  const main = analyseMain(entrant, all, lpm);
  const t = g => setOg(og === g ? null : g);
  const isLive = main.isLive;
  const lrRank = getLRRanking(entrant, lpm);
  const opRank = getOPRanking(entrant, lpm);

  return (
    <div style={pv.ctr} onClick={e => e.stopPropagation()}>
      <div style={pv.hdr}><span style={{ fontSize: 18 }}>🗺️</span><span style={pv.hdrT}>Path to Victory</span>{isLive && <span style={pv.live}>LIVE</span>}</div>
      <GS emoji="🏆" title="Main Game" badge={isLive && main.myTot > 0 ? fmtM(main.myTot) : null} open={og === "m"} toggle={() => t("m")}>
        {main.excl.length > 0
          ? <Chip b="Edge" t="good" title="Exclusive picks" text={<>Nobody else has <strong>{main.excl.join(", ")}</strong>.</>} />
          : <Chip b="Note" t="warn" title="No exclusive picks" text="All players shared with opponents." />}
        {main.threats.length > 0 && <Chip b="Threat" t="danger" title="Players you don't have">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
            {main.threats.map(t => <span key={t.name} style={pv.tChip}>{t.name} {isLive && t.earn > 0 && `(${fmtM(t.earn)})`}</span>)}
          </div>
        </Chip>}
        <div style={pv.mTitle}>Key Matchups</div>
        {main.km.map(m => (
          <div key={m.opp} style={pv.mu}>
            <div style={pv.muHead}>vs <strong>{m.opp}</strong>
              {m.gap !== null && <span style={{ ...pv.gap, background: m.gap >= 0 ? "#d4edda" : "#f8d7da", color: m.gap >= 0 ? "#155724" : "#721c24" }}>{m.gap >= 0 ? "+" : ""}{fmtM(Math.abs(m.gap))}</span>}
            </div>
            {m.sc > 0 && <div style={{ fontSize: 11, color: "#888", fontStyle: "italic", marginBottom: 4 }}>Shared: {m.shared.join(", ")}</div>}
            <div style={{ display: "flex", gap: 6 }}>
              <div style={{ flex: 1 }}><div style={pv.bL}>You</div>{m.myU.map(p => <div key={p.key} style={pv.bP}>{sn(p.key)} <OL rank={p.owgr} style={{color:"#999",fontSize:10}}/>{isLive && p.earn > 0 && <span style={{ color: "#1a472a", fontWeight: 600, fontSize: 10, marginLeft: 4 }}>{fmtM(p.earn)}</span>}</div>)}</div>
              <div style={{ alignSelf: "center", color: "#ccc", fontWeight: 700, fontSize: 11 }}>vs</div>
              <div style={{ flex: 1, textAlign: "right" }}><div style={pv.bL}>Them</div>{m.oppU.map(p => <div key={p.key} style={pv.bP}>{sn(p.key)} <OL rank={p.owgr} style={{color:"#999",fontSize:10}}/>{isLive && p.earn > 0 && <span style={{ color: "#1a472a", fontWeight: 600, fontSize: 10, marginLeft: 4 }}>{fmtM(p.earn)}</span>}</div>)}</div>
            </div>
          </div>
        ))}
      </GS>
      <GS emoji="📉" title="Lowest Round" badge={lrRank[0] ? `Best: ${lrRank[0].bestRound}` : null} open={og === "l"} toggle={() => t("l")}>
        <Chip b="Auto" t="info" title="Best rounds from your 5 players">
          {lrRank.length > 0 ? lrRank.map((r, i) => (
            <div key={r.key} style={{ fontSize: 12, marginBottom: 2, fontWeight: i === 0 ? 700 : 400, color: i === 0 ? "#1a472a" : "#555" }}>
              {i === 0 ? "★ " : "  "}{r.name} — <span style={i === 0 ? { background: "#d4edda", padding: "1px 5px", borderRadius: 3, fontWeight: 800 } : {}}>{r.bestRound}</span>
              {i === 1 && <span style={{ fontSize: 10, color: "#999", marginLeft: 6 }}>(tiebreak)</span>}
            </div>
          )) : <div style={{ fontSize: 12, color: "#888" }}>No rounds completed yet.</div>}
        </Chip>
      </GS>
      <GS emoji="📈" title="Out Performer" badge={opRank[0]?.places != null ? `${opRank[0].places > 0 ? "+" : ""}${opRank[0].places}` : null} open={og === "o"} toggle={() => t("o")}>
        <Chip b="Auto" t="info" title="Outperformance from your 5 players (best first)">
          {opRank.filter(r => r.finish || r.isCut).length > 0 ? opRank.map((r, i) => (
            <div key={r.key} style={{ fontSize: 12, marginBottom: 2, fontWeight: i === 0 ? 700 : 400, color: r.isCut ? "#c0392b" : i === 0 ? "#1a472a" : "#555" }}>
              {i === 0 ? "★ " : "  "}{r.name} (<OL rank={r.owgr} style={{fontSize:11}}/>) → {r.isCut ? "CUT" : r.finish ? <>T{r.finish},{" "}<span style={i === 0 ? { background: r.places > 0 ? "#d4edda" : "#f8d7da", padding: "1px 5px", borderRadius: 3, fontWeight: 800 } : { fontWeight: 600 }}>{r.places > 0 ? "+" : ""}{r.places}</span></> : "—"}
              {i === 1 && r.places != null && <span style={{ fontSize: 10, color: "#999", marginLeft: 6 }}>(tiebreak)</span>}
            </div>
          )) : <div style={{ fontSize: 12, color: "#888" }}>Waiting for tournament data.</div>}
        </Chip>
      </GS>
    </div>
  );
}

function GS({ emoji, title, badge, open, toggle, children }) {
  return (<div style={pv.sec}>
    <div style={pv.gH} onClick={toggle}><span>{emoji}</span><span style={pv.gT}>{title}</span>{badge && <span style={pv.badge}>{badge}</span>}<span style={pv.chev}>{open ? "▲" : "▼"}</span></div>
    {open && <div style={pv.gB}>{children}</div>}
  </div>);
}

function Chip({ b, t, title, text, children }) {
  const c = { good: { bg: "#d4edda", c: "#155724" }, warn: { bg: "#fff3cd", c: "#856404" }, danger: { bg: "#f8d7da", c: "#721c24" }, info: { bg: "#d1ecf1", c: "#0c5460" } }[t] || { bg: "#d1ecf1", c: "#0c5460" };
  return (<div style={pv.chip}>
    <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 700, background: c.bg, color: c.c, flexShrink: 0, marginTop: 2 }}>{b}</span>
    <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 700, color: "#333", marginBottom: 2 }}>{title}</div>{text && <div style={{ fontSize: 12, color: "#555", lineHeight: 1.5 }}>{text}</div>}{children}</div>
  </div>);
}

/* ═══ HOME ═══ */
function HomeView({ ents, lpm, isLive }) {
  const ms = [...ents].sort((a, b) => getTotal(b, lpm) - getTotal(a, lpm));
  const ls = sortLR(ents, lpm);
  const os = sortOP(ents, lpm);
  const pc = ents.filter(e => e.paid).length;
  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div>
      <div style={{display:"flex",gap:8,marginBottom:14}}>
        <div style={{flex:2,background:"#1a472a",borderRadius:10,padding:"12px 14px",textAlign:"center"}}>
          <div style={{fontSize:9,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.5px",color:"rgba(255,255,255,0.5)"}}>Total Pool</div>
          <div style={{fontSize:22,fontWeight:800,color:"#f4d35e",fontFamily:"'Playfair Display',serif"}}>£430</div>
          <div style={{fontSize:10,color:"rgba(255,255,255,0.5)"}}>{ents.length} entrants</div>
        </div>
        <div style={{flex:1,background:"#fff",borderRadius:10,padding:"10px",textAlign:"center",border:"1px solid #e0ddd5"}}>
          <div style={{fontSize:9,fontWeight:700,textTransform:"uppercase",color:"#999",letterSpacing:"0.4px"}}>Main</div>
          <div style={{fontSize:18,fontWeight:800,color:"#1a472a",fontFamily:"'Playfair Display',serif"}}>£350</div>
        </div>
        <div style={{flex:1,background:"#fff",borderRadius:10,padding:"10px",textAlign:"center",border:"1px solid #e0ddd5"}}>
          <div style={{fontSize:9,fontWeight:700,textTransform:"uppercase",color:"#999",letterSpacing:"0.4px"}}>Low Rd</div>
          <div style={{fontSize:18,fontWeight:800,color:"#1a472a",fontFamily:"'Playfair Display',serif"}}>£40</div>
        </div>
        <div style={{flex:1,background:"#fff",borderRadius:10,padding:"10px",textAlign:"center",border:"1px solid #e0ddd5"}}>
          <div style={{fontSize:9,fontWeight:700,textTransform:"uppercase",color:"#999",letterSpacing:"0.4px"}}>Out Perf</div>
          <div style={{fontSize:18,fontWeight:800,color:"#1a472a",fontFamily:"'Playfair Display',serif"}}>£40</div>
        </div>
      </div>
      {[
        /* FIX 3: fmtM for main game */
        { title: "🏆 Main Game", sub: "Total Prize Money", data: ms, detail: e => isLive && getTotal(e, lpm) > 0 ? fmtM(getTotal(e, lpm)) : "—" },
        { title: "📉 Lowest Round", sub: "Best Single Round", data: ls, detail: e => { const r = getLRRanking(e, lpm); return r[0] ? `${r[0].bestRound} (${sn(r[0].key)})` : "—"; } },
        { title: "📈 Out Performer", sub: "Places vs OWGR", data: os, detail: e => { const r = getOPRanking(e, lpm); return r[0]?.places != null ? `+${r[0].places} (${sn(r[0].key)})` : "—"; } },
      ].map(g => (
        <div key={g.title} style={hm.pod}>
          <div style={hm.podT}>{g.title}</div>
          <div style={hm.podS}>{g.sub}</div>
          {g.data.slice(0, 3).map((e, i) => (
            <div key={e.name} style={{ ...hm.podE, background: i === 0 ? "rgba(244,211,94,0.12)" : "transparent" }}>
              <span style={{ fontSize: 18, minWidth: 28 }}>{medals[i]}</span>
              <span style={{ fontWeight: 700, fontSize: 15, color: "#1a472a", flex: 1 }}>{e.name}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#555" }}>{g.detail(e)}</span>
            </div>
          ))}
        </div>
      ))}
      <div style={hm.pay}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={hm.payT}>💷 Payment Tracker</div>
          <span style={hm.payBadge}>{pc}/{ents.length}</span>
        </div>
        <div style={hm.payBar}><div style={{ ...hm.payFill, width: `${(pc / ents.length) * 100}%` }} /></div>
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={hm.payHead}><span style={{ ...hm.dot, background: "#28a745" }} />Paid ({pc})</div>
            {ents.filter(e => e.paid).map(e => <div key={e.name} style={hm.payRow}>{e.name}</div>)}
          </div>
          <div style={{ flex: 1 }}>
            <div style={hm.payHead}><span style={{ ...hm.dot, background: "#dc3545" }} />Unpaid ({ents.length - pc})</div>
            {ents.filter(e => !e.paid).map(e => <div key={e.name} style={{ ...hm.payRow, color: "#c0392b" }}>{e.name}</div>)}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══ MAIN APP ═══ */
export default function App() {
  const [tab, setTab] = useState("home");
  const [exp, setExp] = useState(null);
  const { ld, loading, err, ts, refresh } = useLiveData();
  const lpm = buildLPM(ld, P);
  const isLive = ld?.status === "live" || ld?.status === "complete";
  const statusText = ld?.status === "live" ? `Live — ${ld.statusDetail}` : ld?.status === "complete" ? "Complete" : "Pre-Tournament";
  const sorted = [...ENTRANTS].sort((a, b) => isLive ? getTotal(b, lpm) - getTotal(a, lpm) : 0);

  return (
    <div style={s.wrap}>
      <header style={s.hdr}>
        <div style={s.hdrIn}>
          <div style={{ fontSize: 28 }}>⛳</div>
          <div style={{ flex: 1 }}>
            <h1 style={s.title}>The Masters Sweepstake <span style={{ fontWeight: 400, fontSize: "0.6em" }}>2026</span></h1>
            <div style={s.meta}>Augusta National · Apr 9–12 · £430 pool</div>
          </div>
        </div>
        <div style={s.statusRow}>
          <div style={s.statusBadge}><span style={{ ...s.statusDot, background: isLive ? "#4ade80" : "#f4d35e" }} />{statusText}</div>
          <div style={s.feed}>{loading ? "Connecting..." : err ? `Error: ${err}` : `ESPN ✓ · ${Object.keys(lpm).length} matched`}{ts && !loading && ` · ${ts.toLocaleTimeString()}`}<button onClick={refresh} style={s.refBtn}>↻</button></div>
        </div>
      </header>
      <nav style={s.tabBar}>
        {TABS.map(t => (<button key={t.id} onClick={() => setTab(t.id)} style={{ ...s.tab, ...(tab === t.id ? s.tabA : {}) }}>{t.label}</button>))}
      </nav>
      <main style={s.main}>
        {tab === "home" && <HomeView ents={sorted} lpm={lpm} isLive={isLive} />}
        {tab === "picks" && <PicksView ents={sorted} exp={exp} setExp={setExp} lpm={lpm} isLive={isLive} />}
        {tab === "main" && <MainView ents={sorted} lpm={lpm} isLive={isLive} />}
        {tab === "lowest" && <LRView ents={sorted} lpm={lpm} />}
        {tab === "outperformer" && <OPView ents={sorted} lpm={lpm} />}
        {tab === "rules" && <RulesView />}
      </main>
      <footer style={s.footer}>Live data from ESPN · Auto-refreshes every 60s · Rankings via owgr.com</footer>
    </div>
  );
}

/* ═══ VIEWS ═══ */
function PicksView({ ents, exp, setExp, lpm, isLive }) {
  return (
    <div>
      <H2 t="All Picks" sub={`${ents.length} entrants${isLive ? " · by earnings" : ""}`} />
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {ents.map((e, i) => {
          const open = exp === i, tot = getTotal(e, lpm);
          const lrRank = getLRRanking(e, lpm);
          const opRank = getOPRanking(e, lpm);
          const sortedPicks = sortPicksByBucket(e.picks);
          return (
            <div key={e.name} style={{ ...s.card, ...(open ? s.cardOpen : {}) }} onClick={() => setExp(open ? null : i)}>
              <div style={s.cardH}>
                <div style={s.avatar}>{isLive ? <span style={{ fontSize: 11 }}>{i + 1}</span> : e.name[0]}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "#1a472a" }}>
                    {e.name}{!e.paid && <span style={{ fontSize: 9, color: "#c0392b", fontWeight: 600, marginLeft: 6 }}>UNPAID</span>}
                  </div>
                  {/* FIX 4: score badges on collapsed card */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "1px 5px", marginTop: 2 }}>
                    {sortedPicks.map(pk => {
                      const l = lpm[pk];
                      return (
                        <span key={pk} style={{ fontSize: 11, color: "#888", whiteSpace: "nowrap" }}>
                          {sn(pk)}{l && <ScoreBadge toPar={l.toPar} toParValue={l.toParValue} />}
                        </span>
                      );
                    })}
                  </div>
                </div>
                {/* FIX 3: $X.XM on card header */}
                {isLive && tot > 0 && <div style={{ fontWeight: 700, fontSize: 13, color: "#1a472a", flexShrink: 0 }}>{fmtM(tot)}</div>}
                <div style={{ fontSize: 10, color: "#999", flexShrink: 0, marginLeft: 4 }}>{open ? "▲" : "▼"}</div>
              </div>
              {open && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #eee" }}>
                  {sortedPicks.map(k => {
                    const p = P[k], l = lpm[k];
                    return (
                      <div key={k} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6, fontSize: 13 }}>
                        <span style={{ ...s.bucket, backgroundColor: BC[p.bucket].bg, color: BC[p.bucket].t }}>{p.bucket}</span>
                        <span>{p.flag}</span>
                        <span style={{ fontWeight: 500, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</span>
                        {/* FIX 4: coloured score badge + prize in expanded row */}
                        {l ? (
                          <span style={{ fontSize: 11, display: "flex", gap: 5, alignItems: "center", flexShrink: 0 }}>
                            <span style={{ color: "#1a472a", fontWeight: 600 }}>{l.positionDisplay}</span>
                            <ScoreBadge toPar={l.toPar} toParValue={l.toParValue} />
                            {l.earnings > 0 && <span style={{ color: "#888", fontSize: 10 }}>{fmtM(l.earnings)}</span>}
                          </span>
                        ) : (
                          <span style={{ fontSize: 11 }}><OL rank={p.owgr} style={{color:"#999"}}/></span>
                        )}
                      </div>
                    );
                  })}
                  <div style={{ display: "flex", gap: 8, marginTop: 12, paddingTop: 10, borderTop: "1px dashed #e0ddd5" }}>
                    <ML label="Best Round" value={lrRank[0] ? `${lrRank[0].bestRound} (${sn(lrRank[0].key)})` : "—"} />
                    <ML label="Best Out Perf" value={opRank[0]?.places != null ? `${opRank[0].places > 0 ? "+" : ""}${opRank[0].places} (${sn(opRank[0].key)})` : "—"} />
                  </div>
                  <PTV entrant={e} all={ents} lpm={lpm} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ML({ label, value }) { return <div style={{ flex: 1, background: "#f5f0e8", borderRadius: 8, padding: "6px 10px" }}><div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.4px", color: "#999" }}>{label}</div><div style={{ fontSize: 12, fontWeight: 600, color: "#1a472a", marginTop: 1 }}>{value}</div></div>; }

function MainView({ ents, lpm, isLive }) {
  return (
    <div>
      <H2 t="Main Game" sub="Total prize money" />
      <div style={s.note}>{isLive ? "Live via ESPN." : "Updates when the tournament starts."}</div>
      <TW heads={["Pos", "Name", "Players", "Total"]} alignLast="right">
        {ents.map((e, i) => { const t = getTotal(e, lpm); return (
          <tr key={e.name} style={i % 2 === 0 ? s.re : {}}>
            <td style={s.td}><span style={s.pos}>{i + 1}</span></td>
            <td style={{ ...s.td, fontWeight: 600 }}>{e.name}</td>
            <td style={{ ...s.td, fontSize: 11, color: "#666", whiteSpace: "normal" }}>{sortPicksByBucket(e.picks).map(p => { const l = lpm[p]; return l ? `${sn(p)}(${l.toPar})` : sn(p); }).join(", ")}</td>
            {/* FIX 3: concurrent $X.XM scoring */}
            <td style={{ ...s.td, textAlign: "right", fontWeight: 700 }}>{t > 0 ? fmtM(t) : "—"}</td>
          </tr>); })}
      </TW>
    </div>
  );
}

function LRView({ ents, lpm }) {
  const sorted = sortLR(ents, lpm);
  return (
    <div>
      <H2 t="Lowest Round" sub="Auto-picks best round from your 5 players · Tiebreak: next player's best" />
      <TW heads={["Pos", "Name", "Players & Rounds", "Best"]}>
        {sorted.map((e, i) => {
          const rank = getLRRanking(e, lpm);
          return (
            <tr key={e.name} style={i % 2 === 0 ? s.re : {}}>
              <td style={s.td}><span style={s.pos}>{i + 1}</span></td>
              <td style={{ ...s.td, fontWeight: 600, fontSize: 13 }}>{e.name}</td>
              <td style={{ ...s.td, whiteSpace: "normal" }}>
                {rank.length > 0 ? rank.map((r, ri) => (
                  <div key={r.key} style={{ fontSize: 12, marginBottom: 2, color: ri === 0 ? "#1a472a" : "#777" }}>
                    <span style={{ fontWeight: ri === 0 ? 700 : 400 }}>{P[r.key]?.flag} {r.name}</span>
                    <span style={{ marginLeft: 4, ...(ri === 0 ? { fontWeight: 800, background: "#d4edda", padding: "1px 4px", borderRadius: 3 } : {}) }}>{r.bestRound}</span>
                    {ri === 1 && <span style={{ fontSize: 10, color: "#999", marginLeft: 4 }}>(TB)</span>}
                  </div>
                )) : <span style={{ fontSize: 12, color: "#888" }}>No rounds yet</span>}
              </td>
              <td style={{ ...s.td, textAlign: "center" }}>
                {rank[0] ? <span style={{ fontWeight: 800, fontSize: 18, color: "#1a472a" }}>{rank[0].bestRound}</span> : "—"}
              </td>
            </tr>);
        })}
      </TW>
    </div>
  );
}

function OPView({ ents, lpm }) {
  const sorted = sortOP(ents, lpm);
  return (
    <div>
      <H2 t="Out Performer" sub="Auto-picks biggest riser from your 5 · Tiebreak: next biggest riser" />
      <TW heads={["Pos", "Name", "Player Breakdown", "+/−"]}>
        {sorted.map((e, i) => {
          const rank = getOPRanking(e, lpm);
          const best = rank[0];
          const hasData = rank.some(r => r.finish || r.isCut);
          const tbs = rank.filter((_, ri) => ri > 0 && rank[ri].places != null).slice(0, 2);
          return (
            <tr key={e.name} style={i % 2 === 0 ? s.re : {}}>
              <td style={s.td}><span style={s.pos}>{i + 1}</span></td>
              <td style={{ ...s.td, fontWeight: 600, fontSize: 13 }}>{e.name}</td>
              <td style={{ ...s.td, whiteSpace: "normal" }}>
                {hasData ? (<>
                  <div style={{ fontWeight: 700, fontSize: 13, color: best?.isCut ? "#c0392b" : "#1a472a" }}>
                    {P[best?.key]?.flag} {best?.name} <span style={{ fontWeight: 400, fontSize: 10, color: "#888" }}><OL rank={best?.owgr} style={{color:"#888",fontSize:10}}/></span>
                  </div>
                  {best && (best.isCut
                    ? <div style={{ fontSize: 11, color: "#c0392b", fontWeight: 600 }}>MISSED CUT</div>
                    : best.finish && <div style={{ fontSize: 11, color: "#555", marginTop: 1 }}>T{best.finish} → <span style={{ fontWeight: 800, color: best.places > 0 ? "#155724" : "#721c24", background: best.places > 0 ? "#d4edda" : "#f8d7da", padding: "1px 5px", borderRadius: 3 }}>{best.places > 0 ? "+" : ""}{best.places}</span></div>
                  )}
                  {tbs.length > 0 && <div style={{ marginTop: 3, paddingTop: 3, borderTop: "1px dashed #e0ddd5" }}>
                    <div style={{ fontSize: 9, color: "#999", textTransform: "uppercase", fontWeight: 700, marginBottom: 1 }}>Tiebreak</div>
                    {tbs.map(tb => <div key={tb.key} style={{ fontSize: 11, color: "#777" }}>{sn(tb.key)} <OL rank={tb.owgr} style={{color:"#aaa",fontSize:11}}/> → T{tb.finish}, <span style={{ fontWeight: 600, color: tb.places > 0 ? "#155724" : "#721c24" }}>{tb.places > 0 ? "+" : ""}{tb.places}</span></div>)}
                  </div>}
                </>) : <span style={{ fontSize: 12, color: "#888" }}>Waiting for data</span>}
              </td>
              <td style={{ ...s.td, textAlign: "center" }}>
                {best?.isCut ? <span style={{ fontWeight: 700, color: "#c0392b", fontSize: 11 }}>CUT</span>
                  : best && best.places != null ? <span style={{ fontWeight: 800, fontSize: 18, color: best.places > 0 ? "#155724" : "#721c24" }}>{best.places > 0 ? "+" : ""}{best.places}</span>
                  : "—"}
              </td>
            </tr>);
        })}
      </TW>
    </div>
  );
}

function RulesView() {
  return (
    <div>
      <H2 t="How It Works" sub="Three games, one team of five" />
      {[
        { icon: "🎫", title: "Entry Fee", text: "£10 per entry (43 entrants = £430 pool). Payment to: 04-00-04 / 64310053. Submit picks via WhatsApp in rank order with your name at the top." },
        { icon: "🏌️", title: "Player Selection", text: <span>Pick 5 players — one from each OWGR bucket: 1–10, 11–20, 21–30, 31–40, and 40+. All must be confirmed starters. Check rankings at owgr.com/ranking.</span> },
        { icon: "🏆", title: "Game 1 — Main Game (£350)", text: "Your 5-player team competes on total prize money earned across the tournament. Highest combined total wins." },
        { icon: "📉", title: "Game 2 — Lowest Single Round (£40)", text: "The model automatically finds the best single round from across your 5 players. Whichever of your players posts the lowest individual round of the week is your score. Tiebreak: the next-lowest single round from a different player in your team." },
        { icon: "📈", title: "Game 3 — Out Performer (£40)", text: "The model automatically finds the biggest riser from your 5 players. Your score = the most places any of your players beats their pre-tournament OWGR rank by (must make the cut). Tiebreak: the next-largest riser from a different player in your team." },
        { icon: "💰", title: "Prize Money & Data", text: "Prize money comes live from the official Masters Tournament purse via ESPN. The 2026 total purse is $20,000,000 — $3,600,000 to the winner, $2,160,000 for 2nd, decreasing through every player who makes the cut (typically top 50 and ties after 36 holes). Players who miss the cut earn $0. The breakdown follows the standard PGA Tour distribution — the winner earns roughly 18% of the total purse." },
        { icon: "📱", title: "Live Data", text: "This dashboard pulls live scores, positions, and prize money from ESPN's golf API every 60 seconds during the tournament. All standings and Path to Victory analysis update automatically." },
        { icon: "📝", title: "Notes", text: "Games 2 & 3 use the same 5 players from your Main Game team — the model automatically selects the best performer for each game. All picks must be in by 10am Thursday before the first tee." },
      ].map((r, i) => (
        <div key={i} style={{ display: "flex", gap: 12, background: "#fff", borderRadius: 10, padding: 14, border: "1px solid #e0ddd5", marginBottom: 8 }}>
          <div style={{ fontSize: 24, flexShrink: 0 }}>{r.icon}</div>
          <div><div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 15, color: "#1a472a", marginBottom: 3 }}>{r.title}</div><div style={{ fontSize: 13, color: "#555", lineHeight: 1.6 }}>{r.text}</div></div>
        </div>
      ))}
    </div>
  );
}

function H2({ t, sub }) { return <div style={{ marginBottom: 16 }}><h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, color: "#1a472a", margin: 0 }}>{t}</h2>{sub && <p style={{ fontSize: 13, color: "#666", margin: "2px 0 0" }}>{sub}</p>}</div>; }

function TW({ heads, children, alignLast }) {
  return <div style={{ overflowX: "auto", borderRadius: 10, border: "1px solid #e0ddd5", background: "#fff", WebkitOverflowScrolling: "touch" }}>
    <table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr>
      {heads.map((h, i) => <th key={h} style={{ ...s.th, ...(i === 0 ? { width: 40 } : i === 1 ? { width: 80 } : {}), ...(i === heads.length - 1 && alignLast ? { textAlign: alignLast } : i === heads.length - 1 ? { textAlign: "center", width: 50 } : {}) }}>{h}</th>)}
    </tr></thead><tbody>{children}</tbody></table>
  </div>;
}

/* ═══ STYLES ═══ */
const s = {
  wrap: { fontFamily: "'Source Sans 3',sans-serif", background: "#f5f0e8", minHeight: "100vh", color: "#1a1a1a", maxWidth: 480, margin: "0 auto" },
  hdr: { background: "linear-gradient(165deg,#0d3320 0%,#1a472a 40%,#2d6b3f 100%)", padding: "20px 16px 14px" },
  hdrIn: { display: "flex", alignItems: "center", gap: 10 },
  title: { fontFamily: "'Playfair Display',serif", fontSize: 24, fontWeight: 800, color: "#f4d35e", margin: 0, lineHeight: 1.1 },
  meta: { fontSize: 11, color: "rgba(255,255,255,0.6)", marginTop: 2 },
  statusRow: { display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10, flexWrap: "wrap", gap: 6 },
  statusBadge: { display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", background: "rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 11, fontWeight: 600, color: "#fff", textTransform: "uppercase", letterSpacing: "0.3px" },
  statusDot: { width: 6, height: 6, borderRadius: "50%" },
  feed: { fontSize: 10, color: "rgba(255,255,255,0.4)" },
  refBtn: { background: "none", border: "1px solid rgba(255,255,255,0.25)", borderRadius: 4, color: "#fff", fontSize: 11, marginLeft: 6, padding: "1px 5px", cursor: "pointer", fontFamily: "inherit" },
  tabBar: { display: "flex", background: "#1a472a", borderBottom: "2px solid rgba(244,211,94,0.3)", position: "sticky", top: 0, zIndex: 50, overflowX: "auto", WebkitOverflowScrolling: "touch" },
  tab: { flex: 1, padding: "11px 4px", background: "none", border: "none", color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 500, fontFamily: "'Source Sans 3',sans-serif", cursor: "pointer", whiteSpace: "nowrap", borderBottom: "2px solid transparent", minWidth: 0, textAlign: "center" },
  tabA: { color: "#f4d35e", borderBottomColor: "#f4d35e", fontWeight: 700 },
  main: { padding: "16px 12px" },
  card: { background: "#fff", borderRadius: 10, padding: "12px 14px", border: "1px solid #e0ddd5", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" },
  cardOpen: { boxShadow: "0 4px 14px rgba(26,71,42,0.12)", borderColor: "#1a472a" },
  cardH: { display: "flex", alignItems: "center", gap: 10, cursor: "pointer" },
  avatar: { width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#1a472a,#2d6b3f)", color: "#f4d35e", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 16, flexShrink: 0 },
  bucket: { padding: "1px 6px", borderRadius: 3, fontSize: 10, fontWeight: 700, flexShrink: 0 },
  note: { background: "rgba(26,71,42,0.06)", border: "1px solid rgba(26,71,42,0.12)", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#555", marginBottom: 12 },
  th: { padding: "10px 8px", textAlign: "left", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.4px", color: "#999", borderBottom: "2px solid #eee", whiteSpace: "nowrap" },
  td: { padding: "8px", fontSize: 13, borderBottom: "1px solid #f0f0f0", verticalAlign: "top" },
  re: { background: "#faf8f4" },
  pos: { display: "inline-flex", alignItems: "center", justifyContent: "center", width: 24, height: 24, borderRadius: "50%", background: "#1a472a", color: "#f4d35e", fontSize: 11, fontWeight: 700 },
  footer: { textAlign: "center", padding: "16px 12px", fontSize: 10, color: "#999" },
};

const hm = {
  pod: { background: "#fff", borderRadius: 10, padding: 14, border: "1px solid #e0ddd5", marginBottom: 10, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" },
  podT: { fontFamily: "'Playfair Display',serif", fontSize: 16, fontWeight: 700, color: "#1a472a" },
  podS: { fontSize: 10, color: "#999", marginBottom: 8 },
  podE: { display: "flex", alignItems: "center", gap: 8, padding: "7px 8px", borderRadius: 6, marginBottom: 3 },
  pay: { background: "#fff", borderRadius: 10, padding: 14, border: "1px solid #e0ddd5", marginTop: 4 },
  payT: { fontFamily: "'Playfair Display',serif", fontSize: 16, fontWeight: 700, color: "#1a472a", margin: 0 },
  payBadge: { fontSize: 12, fontWeight: 700, color: "#1a472a", background: "#d4edda", padding: "2px 10px", borderRadius: 12 },
  payBar: { height: 6, background: "#e8e4db", borderRadius: 3, overflow: "hidden", marginBottom: 12 },
  payFill: { height: "100%", background: "linear-gradient(90deg,#1a472a,#2d6b3f)", borderRadius: 3, transition: "width 0.3s" },
  payHead: { display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, color: "#555", marginBottom: 4, paddingBottom: 4, borderBottom: "1px solid #eee" },
  dot: { width: 7, height: 7, borderRadius: "50%", display: "inline-block" },
  payRow: { fontSize: 13, padding: "2px 0", color: "#333" },
};

const pv = {
  ctr: { marginTop: 14, paddingTop: 14, borderTop: "2px solid #1a472a" },
  hdr: { display: "flex", alignItems: "center", gap: 6, marginBottom: 10 },
  hdrT: { fontFamily: "'Playfair Display',serif", fontSize: 16, fontWeight: 700, color: "#1a472a" },
  live: { marginLeft: "auto", fontSize: 9, fontWeight: 700, color: "#fff", background: "#e74c3c", padding: "2px 6px", borderRadius: 3 },
  sec: { marginBottom: 6, borderRadius: 8, border: "1px solid #e8e4db", overflow: "hidden" },
  gH: { display: "flex", alignItems: "center", gap: 6, padding: "10px 12px", background: "#f5f0e8", cursor: "pointer", minHeight: 44 },
  gT: { fontSize: 13, fontWeight: 700, color: "#1a472a" },
  badge: { marginLeft: "auto", fontSize: 10, fontWeight: 700, color: "#1a472a", background: "#d4edda", padding: "2px 7px", borderRadius: 4 },
  chev: { fontSize: 9, color: "#999", marginLeft: 3 },
  gB: { padding: 10, background: "#fff" },
  chip: { display: "flex", gap: 8, marginBottom: 10, padding: 8, background: "#faf8f4", borderRadius: 8 },
  tChip: { display: "inline-block", padding: "2px 6px", background: "#f8d7da", borderRadius: 3, fontSize: 10, fontWeight: 600, color: "#721c24" },
  mTitle: { fontSize: 11, fontWeight: 700, color: "#1a472a", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.4px" },
  mu: { padding: 8, background: "#faf8f4", borderRadius: 6, marginBottom: 6 },
  muHead: { fontSize: 12, fontWeight: 600, color: "#333", marginBottom: 4, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" },
  gap: { fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 3 },
  bL: { fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.3px", color: "#999", marginBottom: 3 },
  bP: { fontSize: 11, marginBottom: 1, color: "#333" },
};

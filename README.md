# The Masters 2026 — Sweepstake Dashboard

A live-updating sweepstake dashboard for The Masters, powered by ESPN's golf API.

## Features
- **Live scores** — auto-refreshes every 60 seconds via ESPN
- **3 games** — Main Game (prize money), Lowest Round, Out Performer
- **Path to Victory** — dynamic matchup analysis for each entrant
- **Auto-pick** — Games 2 & 3 automatically select the best performer from each team
- **Payment tracker** — see who's paid at a glance
- **Mobile-first** — optimised for iPhone, works on any device

## Deploy to Vercel (5 minutes)

### Option A: Via GitHub (recommended)
1. Create a new GitHub repository
2. Push this entire folder to the repo
3. Go to [vercel.com](https://vercel.com) and sign in with GitHub
4. Click **"New Project"** → select your repo
5. Vercel auto-detects Vite — just click **"Deploy"**
6. Your site is live at `your-project.vercel.app`

### Option B: Via Vercel CLI
```bash
npm install -g vercel
cd masters-sweepstake
vercel
```
Follow the prompts. Done.

## Local Development
```bash
npm install
npm run dev
```
Opens at `http://localhost:5173`

## Updating Entrants
Edit `ENTRANTS` in `src/App.jsx`. Each entrant needs:
```js
{ name: "J.Smith", picks: ["scheffler", "fleetwood", "hatton", "fox", "rahm"], paid: true }
```
- `picks` — 5 player keys matching `P` (the players database)
- `paid` — true/false for the payment tracker

## Adding to iPhone Home Screen
Share the Vercel URL in your WhatsApp group. Anyone can:
1. Open in Safari
2. Tap the Share button → "Add to Home Screen"
3. It behaves like a native app

## How the Games Work
- **Main Game**: Total prize money from your 5 players
- **Lowest Round**: Auto-picks the best single round from any of your 5 players. Tiebreak: next player's best round.
- **Out Performer**: Auto-picks the biggest riser (OWGR rank minus finish position) from your 5. Tiebreak: next biggest riser.

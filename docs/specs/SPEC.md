# KingshotPro — Build Spec
*For the builder Claude. Everything you need. Nothing you don't.*

---

## What This Is

A web dashboard for players of **Kingshot** — a mobile strategy game by Century Games (iOS/Android). The site lives at **kingshotpro.com**, deployed via GitHub → Netlify auto-deploy.

**The single differentiator:** Every competitor site is generic. You open a calculator, you enter your stats manually, you get a number. KingshotPro knows YOUR account. Player enters their FID (game player ID) → we call the Century Games API → we get their server, furnace level, and spending tier in seconds → every tool on the site adapts to their specific situation.

This is the hook. Everything builds from it.

---

## Repo & Deploy

- **GitHub:** `https://github.com/growaleaf/kingshot-pro`
- **Remote with PAT:** Git remote is already configured with auth. Run `git push` directly from the KingshotPro directory — no token entry needed. If re-cloning, ask the Architect for the PAT.
- **Deploy:** Netlify auto-deploys on every push to `main`
- **Domain:** kingshotpro.com (DNS pending, may not be live yet)
- **netlify.toml** is already in the repo — do not remove it
- **Push commits to trigger deploys.** No build step needed — pure static.

---

## Tech Stack

Vanilla HTML, CSS, JavaScript. No framework. No build step. Reasons:
- Deploys instantly on Netlify as static files
- Fast load on mobile (this is a MOBILE GAME — most users visit on phone)
- Consistent with other Hive builds
- Calculators are JS-heavy but don't need React

One JS file per major section is fine. No bundler needed.

---

## Competitive Context (What Already Exists)

These sites exist and are active. Do not try to out-do them on their home turf:

| Site | Visits/mo | What They Own |
|------|-----------|---------------|
| kingshot.net | 670K | 27 tools, account system, category leader |
| kingshotdata.com | 423K | Game wiki/database |
| kingshotcalculator.com | 187K | Clean focused calculators |
| kingshotguides.com | Unknown | 30+ strategy guides |
| kingshotguide.com | Unknown | Calculators + some guides |
| kingshot.me | Unknown | Multi-tool, mobile-first, multilingual |

**What NOBODY does:** FID lookup → personalized advice. AI advisory. Server intelligence. Pack value assessment. Subscription tier. These are our lanes.

---

## Phase 1 Scope — What To Build

### 1. FID Lookup (the hero feature)

Player enters their FID on the homepage. We call:

```
POST https://kingshot-giftcode.centurygame.com/api/player
Content-Type: application/json
{"fid": "PLAYER_FID_HERE", "cdkey": ""}
```

Response includes: `nickname`, `kid` (server/kingdom ID), `stove_lv` (furnace level), `pay_amt` (lifetime spending in cents).

From this we derive:
- **Spending tier:** F2P (pay_amt = 0), Low ($1–$99), Mid ($100–$499), Whale ($500+)
- **Server age:** look up `kid` against a server age table (kingdoms open sequentially; lower kid = older server). Rough lookup: kid < 500 = mature (180+ days), kid 500–1000 = mid (90–180 days), kid > 1000 = new (<90 days).
- **Game stage:** Early (furnace < 15), Mid (15–21), Late (22+)

Display the result clearly: *"You're a [spending tier] player on a [age] server at Furnace [level]."*

Store profile in `sessionStorage` so it persists across pages without a login system.

### 2. Basic Advisory (rule-based, free)

After FID lookup, show top 3 priorities based on the profile. Hard-coded advice tree — no AI needed for Phase 1.

Example outputs:
- F2P + Early: Focus on research speed, don't spend gems on speedups yet, prioritize bear trap events for resources
- Low + Mid: Your furnace upgrade is the bottleneck, hero gear matters now, start saving for the next kingdom event
- Whale + Late: Alliance position matters more than individual power, server transfer intel is the next unlock

Build 3 spending tiers × 3 stages = 9 advice combinations minimum.

### 3. Core Calculators

Build these. All should pre-fill with player's data from FID lookup if available:

**Building Upgrade Calculator**
- Input: current level, target level, buff %
- Output: wood, food, stone, iron, gold needed + time
- Data source: use kingshotdata.com values (manually reference them; they're public)

**Troop Training Calculator**
- Input: troop type, quantity, training buff %
- Output: resources, time, AND event points (HoG points, KvK points, TSG points)
- The event points is the detail competitors miss — include it

**Governor Gear Calculator**
- Input: gear piece, current level, target level
- Output: material costs

**Hero Shard Calculator**
- Input: hero, current stars, target stars
- Output: shards needed, approximate cost

**Pet Upgrade Calculator**
- Input: pet, current level, target level
- Output: upgrade materials needed

### 4. Gift Codes Page

Simple page listing currently active gift codes. Updated manually (or by a future scheduled worker). Players check this constantly. High-traffic, low-effort.

### 5. Design Spec

- **Dark theme only.** Background `#0d0d0f`, surface `#16181f`, borders `#2a2d3e`
- **Gold accent.** `#f0c040` for headings, CTAs, highlights. This is a game about kings.
- **Mobile-first.** Every layout must work at 375px width without zooming. Test every calculator on phone dimensions.
- **Fast.** No heavy images. No web fonts (system font stack). Sub-2s load on 4G.
- **Player-warm, not corporate.** Tone is like a smart alliance member giving advice, not a SaaS dashboard.

### 6. Site Structure

```
index.html          — Hero with FID form + advisory output
calculators/
  building.html
  troops.html
  gear.html
  shards.html
  pets.html
codes.html          — Gift codes
about.html          — What this is, who built it (optional, Phase 1 end)
css/
  style.css         — Global styles
js/
  fid.js            — FID lookup + sessionStorage profile
  advisory.js       — Advice tree logic
  calc-building.js
  calc-troops.js
  calc-gear.js
  calc-shards.js
  calc-pets.js
netlify.toml        — Already present, do not touch
```

---

## What NOT To Build In Phase 1

- No login system / accounts
- No database / backend
- No AI API calls (that's Phase 2)
- No server intelligence / ranking data (requires scraper pipeline that doesn't exist yet)
- No battle simulator (kingshotsimulator.com owns this — don't compete)
- No game wiki / database (kingshotdata.com owns this — link to them instead)
- No strategy guides (kingshotguides.com owns this — link to them instead)

---

## Links Out (Ecosystem Goodwill)

Link generously to these sites — they're not competitors on our features and linking out builds community trust:
- `kingshotdata.com` — for game database / wiki
- `kingshotguides.com` — for strategy guides
- `kingshotcalculator.com` — acknowledge it exists, differentiate by showing our personalization

---

## Accuracy Note

All calculator data (resource costs, upgrade tables) must come from verified game data — either kingshotdata.com or direct observation. Do not fill in numbers from training knowledge. If a value is uncertain, show a range or flag it as "verify in-game." Players will catch wrong numbers instantly and it destroys trust.

---

## Push Protocol

When committing:
```bash
cd /Users/defimagic/Desktop/Hive/KingshotPro
git add .
git commit -m "your message"
git push
```

Netlify deploys automatically within ~30 seconds of push.

---

*Build spec authored April 8, 2026. Ask before building anything not listed in Phase 1 scope.*

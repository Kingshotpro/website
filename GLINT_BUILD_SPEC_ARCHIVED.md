# KingshotPro — Full Build Spec for Glint
*Written by Signal, April 9, 2026*
*Read everything before building anything.*

---

## Who You Are and What This Is

You are Glint. You did the competitive analysis for this project — you already know the landscape better than anyone. You mapped 11 competitor sites, 1.3M+ monthly visits, and identified the gaps. Now you're building what fills those gaps.

**KingshotPro** is a dashboard for Kingshot players (mobile strategy game by Century Games). It lives at **kingshotpro.com**, deployed via GitHub Pages. The repo is at `github.com/growaleaf/kingshot-pro`.

The site already has a working skeleton — index.html, 5 calculator pages, gift codes page, CSS, JS for FID lookup and advisory. Your job is to rebuild the layout to match the proven pattern, fix the FID API implementation, build the AI advisor widget, expand the calculators, and wire up monetization infrastructure.

---

## What Already Exists in the Repo

```
index.html           — Homepage with FID form, advisory output, tool grid, how-it-works
calculators/
  building.html      — Building upgrade calculator (has JS data)
  troops.html        — Troop training calculator (with event points)
  gear.html          — Governor gear calculator
  shards.html        — Hero shard calculator
  pets.html          — Pet upgrade calculator
codes.html           — Gift codes page with one-click copy
css/style.css        — Full dark theme stylesheet (top-nav layout currently)
js/fid.js            — FID lookup (WRONG API FORMAT — see below)
js/advisory.js       — Rule-based advice tree
js/calc-building.js  — Building calc logic with data tables
js/calc-troops.js    — Troop training logic
js/calc-gear.js      — Gear calc logic
js/calc-shards.js    — Shard calc logic
js/calc-pets.js      — Pet calc logic
netlify.toml         — Deploy config (do not remove)
CNAME                — Domain config for GitHub Pages
```

The code EXISTS but the layout is wrong and the API implementation has a critical bug. Both are your first priorities.

---

## TASK 1: LAYOUT REBUILD (do this first)

### The Problem

The current site uses a **top navigation bar** with 3 links. This is wrong. kingshot.net — the 670K visits/month category leader — uses a **fixed left sidebar** with categorized, icon-labeled navigation. With 28+ tools planned, a top nav will be unusable within weeks.

### What To Build

**Desktop (>1024px):** Fixed left sidebar, 256px wide. Sticky topbar above it with logo + search/FID status. Main content fills the right.

**Tablet (768-1024px):** Sidebar collapses to icons-only (64px). Expands on hover or toggle.

**Mobile (<768px):** Sidebar hidden. Hamburger button in topbar opens it as a drawer overlay.

### Sidebar Structure

Mirror kingshot.net's category structure. Every item gets an icon (emoji is fine for Phase 1 — replace with SVG later) and a text label. Items marked "New" or "Popular" get a small badge.

```
HOME                           🏠  Home
COMMUNITY
  🎁  Gift Codes               [Popular]
  🔑  Auto-Redeem              [Pro] [New]
CALCULATORS
  🏰  Building                 [Popular]
  ⚔️  Troop Training           [Popular]
  🛡️  Governor Gear
  ✨  Governor Charm
  🦸  Hero Shards
  🐉  Pets
  📊  Hero XP                  [New]
  ⚔️  Hero Gear
  📈  Hero Comparison
  🏆  KvK Score
  🔬  War Academy
  ⭐  VIP
  💎  Truegold
PLANNERS
  🤝  Alliance Mobilization    [New]
  🔨  Forgehammer
  📦  Pack Value               [Pro] [New]
EVENTS
  ⚔️  Viking Vengeance
  🐻  Troop Split (Bear Hunt)
  🔮  Mystic Trials
TOOLS
  🗺️  Rally Planner
  🗺️  Map Planner
  💊  Healing Cost
```

Not all of these pages exist yet. Items without a page should still appear in the sidebar with a "Coming Soon" state (greyed out, not clickable, small "Soon" badge). This communicates scope and ambition to visitors.

### Topbar

Sticky, above sidebar. Contains:
- **Logo** ("KingshotPro") left-aligned
- **FID status** right-aligned: If profile in sessionStorage, show avatar + nickname + kingdom badge. If no profile, show a small "Enter FID" button that scrolls to or opens the FID form.
- **Hamburger** on mobile (left side, toggles sidebar drawer)

### Why This Matters

The sidebar IS the product experience for a tool dashboard. Players see the full scope of tools at a glance. They can jump between tools without going back to a homepage. The sidebar makes the site feel like a real application, not a collection of blog posts. kingshot.net proved this with 670K visits/month.

---

## TASK 2: FIX THE FID API (critical bug)

### The Problem

`js/fid.js` currently sends the API call as JSON:
```js
fetch(FID_API, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ fid: String(fid).trim(), cdkey: '' }),
});
```

**This is wrong.** The Century Games API requires:
1. **URL-encoded form data** (not JSON)
2. **MD5 signature** — sorted key=value pairs + secret key, MD5 hashed
3. **Millisecond timestamp**

### The Correct Implementation

Discovered from the open-source ks-rewards.com tool (github.com/adaja01/ks-rewards.com):

```
Encrypt key: mN4!pQs6JrYwV9

Signing process:
1. Collect params: { fid: "PLAYER_FID", time: Date.now() }
2. Sort keys alphabetically: fid, time
3. Build string: "fid={value}&time={value}"
4. Append encrypt key: "fid={value}&time={value}mN4!pQs6JrYwV9"
5. MD5 hash the string → that's the sign
6. Send: sign={hash}&fid={value}&time={value}

Content-Type: application/x-www-form-urlencoded
```

**Two endpoints:**
- **Player lookup:** `POST https://kingshot-giftcode.centurygame.com/api/player`
  - Params: fid, time, sign
  - Returns on success (code=0): nickname, kid (kingdom), avatar_image
  - Returns on failure (code=1): "role not exist." or "params error"

- **Gift code redeem:** `POST https://kingshot-giftcode.centurygame.com/api/gift_code`
  - Params: fid, cdk (the code), time, sign
  - Returns: success/failure status, various error codes

### CRITICAL UNCERTAINTY: What Fields Does the Player Endpoint Return?

The previous spec claimed it returns `stove_lv` (furnace level) and `pay_amt` (lifetime spending in cents). The open-source ks-rewards tool only stores nickname, kid, and avatar_image — it ignores other fields if they exist.

**We have not tested with a real FID.** The API might return more fields than ks-rewards uses. Or those fields might not exist at all.

**Build for BOTH scenarios:**
- If the API returns stove_lv and pay_amt → use them for classification
- If it doesn't → show a quick manual entry form (2-3 fields) AFTER the FID greeting

The fid.js classifyProfile() function already handles both — it has fallbacks. Keep that. But change the greeting to work with partial data: show what you have (nickname + kingdom), and ask for what you don't.

### CORS

The Century Games API returns `access-control-allow-origin: *` (confirmed). Browser-side fetch SHOULD work. If it doesn't, the current index.html already has a manual-entry fallback. Keep that fallback.

### MD5 in the Browser

You'll need an MD5 implementation in JS. Options:
- Include a minimal MD5 function (~50 lines, no library needed — SparkMD5 or similar)
- Or use the Web Crypto API with a polyfill (SubtleCrypto doesn't natively do MD5 — use a standalone function)

The simplest path: embed a small MD5 function directly in fid.js. No npm, no build step.

---

## TASK 3: THE ADVISOR WIDGET ("The Steward")

### Context

The naming research (see NAMING_RESEARCH_FINDINGS.md in the repo) concluded:
- **Character name: The Steward** (primary recommendation) or The Sage (backup)
- The Vizier was REJECTED (Jafar villain association)
- Players are called "Governors" in-game — the Steward serves the Governor

**Pending Architect decision** on the exact name. Build the widget with a configurable name constant at the top of the JS. Default to "The Steward" unless the Architect says otherwise.

### Spending Tier Labels

From NAMING_RESEARCH_FINDINGS.md (the deeper study):

| Internal Tier | Display Label | Used In Greeting |
|---|---|---|
| F2P ($0) | **Free Commander** | "You're a Free Commander Governor on a 180-day server." |
| Low ($1–$99) | **Tactician** | "You're a Tactician Governor on a 95-day server." |
| Mid ($100–$499) | **Veteran** | "You're a Veteran Governor on a 120-day server." |
| Whale ($500+) | **Warlord** | "You're a Warlord Governor on a 210-day server." |

If spending data is unavailable (API doesn't return it), use furnace-based fallback:

| Furnace Range | Label |
|---|---|
| 1–14 | Newcomer |
| 15–21 | Veteran |
| 22–27 | Elite |
| 28+ | Legend |

### What To Build

**The widget:**
- Fixed position, bottom-right corner of viewport
- Collapsed state: a circular avatar button (~48px). Gold border. An illustrated character icon (SVG or styled emoji placeholder — a crown + scroll motif, medieval advisor feel). Subtle gold pulse animation when it has something new to say.
- Expanded state: a chat panel slides up (~320px wide, ~420px tall on desktop, full-width on mobile). Dark surface background, gold accent.
- The panel shows the advisor's messages as chat bubbles (left-aligned, styled like a conversation).
- Close button (X) in top-right of panel to collapse back.

**Phase 1 behavior (rule-based, no API cost):**

1. Before FID lookup: Steward says a welcome message.
   > "Greetings, Governor. I am your Steward. Enter your FID above and I'll review your realm."

2. After FID lookup with full data: personalized greeting + top 3 priorities.
   > "Welcome back, DragonSlayer. You are a Veteran Governor in Kingdom 734."
   > "Based on your position, here are your top priorities:"
   > [3 advice cards based on tier × stage matrix]

3. After FID lookup with partial data (no furnace/spending): greeting + ask.
   > "Welcome back, DragonSlayer. I see you in Kingdom 734."
   > "Tell me your Furnace level and I'll give you personalized guidance."
   > [Quick input form inside the widget]

4. On calculator pages: context-aware comment.
   > "Your Steward notes: at Furnace 18, the most impactful building upgrade is your War Academy."

5. Phase 2 upsell (shown after free advice):
   > "Want deeper analysis? Pro members get full AI-powered account review."
   > [Button: "Unlock Pro Analysis"]

**The advice tree** already exists in `js/advisory.js`. Wire the widget to use it. The widget is the delivery mechanism — advisory.js is the brain.

### Why This Is The Hook

No competitor has anything like this. A player enters their FID and a character greets them by name with specific advice. That's the screenshot moment — the thing a player posts to their alliance Discord. "This site literally knows my account." That's word-of-mouth growth in a game where alliances share everything.

---

## TASK 4: REMAINING CALCULATORS

### What's Built (Tier 1 — mostly done)
- [x] Building Upgrade Calculator
- [x] Troop Training Calculator (with event points)
- [x] Governor Gear Calculator
- [x] Hero Shard Calculator
- [x] Pet Upgrade Calculator
- [ ] Governor Charm Calculator — NOT YET BUILT, page exists but needs JS

### Tier 2 — Build Next
- [ ] Hero XP Calculator
- [ ] Hero Gear / Enhancement Calculator
- [ ] Hero Stat Comparison Tool
- [ ] KvK Score Calculator
- [ ] War Academy Calculator
- [ ] VIP Calculator
- [ ] Tempered Truegold / Truegold Calculator

### Tier 3 — Differentiation
- [ ] Alliance Mobilization Calculator
- [ ] Forgehammer Calculator + Set Calculator
- [ ] Pack Value Calculator (personalized — our unique feature)
- [ ] Viking Vengeance Calculator
- [ ] Troop Split Calculator (Bear Hunt / Vikings)
- [ ] Mystic Trials Optimizer
- [ ] Healing Cost Calculator
- [ ] Rally Planner
- [ ] Map Planner

### Calculator Data: THE HARD PROBLEM

Every calculator needs exact game data — resource costs, training times, material requirements. This data must come from verified sources:

**Option A:** Scrape kingshotdata.com's data tables. They're the wiki. Their data is publicly displayed. Extracting it programmatically is ethically gray but technically feasible.

**Option B:** Cross-reference 2-3 competitor calculator sites. If kingshotcalculator.com, kingshotguide.com, and kingshot.me all agree on a number, it's probably correct.

**Option C:** Manual data entry from in-game observation. Slow but authoritative.

**What to do RIGHT NOW:** For the calculators that already have data tables in their JS files (building, troops, gear, shards, pets), verify a few spot-check values against kingshotdata.com. If they match, proceed. If they don't, flag them.

For NEW calculators: scrape the relevant data tables from kingshotdata.com using fetch + parsing. Present the raw data in a staging area for human review before including it in a calculator.

**NEVER fill in game data from training knowledge.** Players catch wrong numbers instantly and trust collapses.

---

## TASK 5: GIFT CODES + AUTO-APPLY

### Free Tier (already built — codes.html)
Gift codes page with active codes, one-click copy, manual redeem instructions.

### Pro Tier: Auto-Apply ($0.99/month or bundled in Pro)

**How it works:**
1. Pro subscriber enters their FID once
2. We store it (initially in a simple backend — Netlify Function + a JSON file or lightweight DB)
3. When a new gift code is discovered/added, a scheduled job POSTs the code to the Century Games API for each stored FID
4. Player gets rewards in their in-game mailbox without doing anything

**API call for redeem:**
```
POST https://kingshot-giftcode.centurygame.com/api/gift_code
Content-Type: application/x-www-form-urlencoded

sign={MD5_HASH}&fid={PLAYER_FID}&cdk={GIFT_CODE}&time={TIMESTAMP_MS}
```

Signing works the same as the player lookup. The encrypt key is `mN4!pQs6JrYwV9`.

**Rate limits:** 30 requests per interval. 3-second minimum between requests. If we have 100 Pro subscribers and a new code drops, redemption takes ~5 minutes at 3-second intervals. Acceptable.

**Error handling from the open-source reference:**
- `code: 0, msg: "success"` → redeemed
- `msg: "SAME TYPE EXCHANGE"` → code already used by this player (still success)
- `msg: "CDK NOT FOUND"` → invalid code
- `msg: "USAGE LIMIT"` → code fully claimed
- `msg: "TIME ERROR"` → code expired
- `msg: "NOT LOGIN"` → session issue, retry after re-login

**Legal disclaimer (must be visible on the auto-apply signup page):**
"Auto-apply depends on Century Games API availability. If the service is interrupted, billing pauses automatically. KingshotPro is not affiliated with Century Games."

**Phase 1:** Build the UI for the auto-apply feature and the FID storage. The actual scheduled redemption job can be a Netlify scheduled function or a manual trigger initially.

---

## TASK 6: ADSENSE INFRASTRUCTURE

### Placeholder Slots (build into layout NOW — before content)

Every page should include `<div class="ad-slot" data-slot="SLOT_NAME"></div>` placeholder elements. These render as empty space now. When AdSense is approved, we swap in real ad code.

**Slot locations:**
- Sidebar bottom (below nav, above footer area) — `sidebar-bottom` — 160x600 or 300x250
- Calculator pages: below results section — `calc-result-below` — 728x90 (desktop) / 320x50 (mobile)
- Gift codes page: between code groups — `codes-mid` — 300x250
- Homepage: below advisor/tools section — `home-mid` — 728x90

**CSS for placeholder:**
```css
.ad-slot {
  background: var(--surface);
  border: 1px dashed var(--border);
  border-radius: var(--radius);
  min-height: 90px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-dim);
  font-size: 12px;
  margin: 24px 0;
}
.ad-slot::after { content: 'Ad'; }
```

When real ads go in, remove the placeholder styling and insert the AdSense script tag inside each div.

### Rewarded Ads (Phase 2 — research needed first)

The Architect wants an "ad-watch to unlock" pathway for F2P users to access Pro features temporarily. Google's AdSense rewarded ads for web exist but may have limited availability. DO NOT build this yet. Note it as a Phase 2 task and move on.

### Rules
- **Calculators are NEVER gated behind ads.** All calculators are always free, zero friction.
- **Ads must not interfere with mobile usability.** No interstitials. No ads that push content below the fold on a 375px screen.

---

## TASK 7: SUBSCRIPTION INFRASTRUCTURE (Phase 2 — spec only, don't build yet)

**Tiers under discussion:**
- Free: all calculators, gift code list, basic Steward advice, ad-supported
- Pro (~$3.99/month?): auto-apply gift codes, full AI advisor, pack value advisor, event optimizer, ad-free experience
- Gift code auto-apply standalone: $0.99/month (may be bundled into Pro)

**Needs:** Stripe integration, FID storage backend (Netlify Functions + database), auth system (email + magic link, or just email + FID).

**Don't build this yet.** The layout, calculators, and Steward widget come first. Subscription comes when there's something worth subscribing to.

---

## BUILD SEQUENCE

```
1. Layout rebuild (sidebar + topbar)         ← FIRST, everything else depends on it
2. Fix FID API (MD5 signing, URL-encoded)    ← Critical bug, do immediately after layout
3. Steward widget (Phase 1 rule-based)       ← The hook, the differentiator
4. Governor Charm calculator (missing)       ← Complete Tier 1
5. AdSense placeholders in new layout        ← 30 minutes of work, do during layout
6. Tier 2 calculators (7 items)              ← Bulk of the work
7. Gift code auto-apply UI + backend         ← Pro feature #1
8. Tier 3 calculators (10 items)             ← Differentiation
9. Subscription infrastructure               ← Phase 2
```

---

## DESIGN SPEC (already in CSS, confirm these are preserved)

- **Dark theme.** Background `#0d0d0f`, surface `#16181f`, borders `#2a2d3e`
- **Gold accent.** `#f0c040` for headings, CTAs, highlights, the Steward's chat bubbles
- **Mobile-first.** Every layout at 375px. Every calculator usable without zooming.
- **System fonts.** No web fonts. `-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif`
- **Fast.** Sub-2s load on 4G. No heavy images. No frameworks.

---

## PUSH PROTOCOL

```bash
cd /Users/defimagic/Desktop/Hive/KingshotPro
git add .
git commit -m "your descriptive message"
git push
```

GitHub Pages deploys automatically. The git remote already has the PAT embedded — no auth prompts.

---

## WHAT NOT TO BUILD

- No backend framework (Express, Next.js, etc.) — vanilla HTML/CSS/JS
- No database for Phase 1 (sessionStorage only)
- No battle simulator (kingshotsimulator.com owns this)
- No game wiki (kingshotdata.com owns this — link to them)
- No strategy guides (kingshotguides.com owns this — link to them)
- No login system for Phase 1
- No rewarded ads yet (needs research)
- Don't invent game data from training knowledge

---

## ECOSYSTEM LINKS (build goodwill, don't compete)

Link to these from the sidebar footer or relevant pages:
- `kingshotdata.com` — game database / wiki
- `kingshotguides.com` — strategy guides
- `kingshotcalculator.com` — acknowledge it exists

---

## THE HONEST STATE OF THINGS

**What's confirmed:**
- API signing method and format (MD5 + URL-encoded, verified against open-source)
- Gift code auto-apply is technically proven (open-source tool does it daily)
- Rate limits: 30/interval, 3s minimum between requests
- Player identity data from API: nickname, kid (kingdom), avatar_image
- CORS headers: `access-control-allow-origin: *` (should work from browser)

**What's NOT confirmed:**
- Whether the API returns furnace level (stove_lv) and spending (pay_amt). The previous specs claimed it. The open-source tool doesn't use those fields. Build for both scenarios.
- Whether the existing calculator data tables (in js/calc-*.js) are accurate. Spot-check against kingshotdata.com before trusting them.
- Whether Google AdSense rewarded ads work on static websites served via GitHub Pages/Netlify.

Build what's confirmed. Flag what isn't. Don't pretend uncertainty is certainty.

---

*Written by Signal. You did the competitive analysis, Glint. You know the landscape. Now build the thing that fills the gaps you found.*

# KingshotPro — Full Remaining Tasks & Subtasks
*As of April 13, 2026 (end of Session 3)*

---

## CRITICAL — Content Audit

### 1. Full Site Content Audit for Fabricated Data
**Why:** hero-guide.html had completely invented hero names ("Ironclad", "Sharpshooter", "Guardian King"). Caught by accident. Other pages may have the same problem. Any player who finds fabricated content destroys our credibility.
**Scope:** Every page with game-specific claims needs verification.

- [ ] **1.1** Audit all 11 guides against verified sources
  - [ ] `guides/beginner.html` — check hero names, building priorities, event names
  - [ ] `guides/f2p.html` — check resource management claims, event optimization advice
  - [ ] `guides/f2p-heroes.html` — hero names are correct (verified April 13), but check specific claims (e.g., "save 465 shards for 4-stars")
  - [ ] `guides/furnace.html` — check upgrade costs, level requirements
  - [ ] `guides/kvk.html` — check KvK mechanics, point calculations, prep timelines
  - [ ] `guides/alliance.html` — check alliance mechanics
  - [ ] `guides/server-age.html` — check server lifecycle milestones (90/180/360 days)
  - [ ] `guides/pack-value.html` — check pack contents and pricing claims
  - [ ] `guides/farm-account.html` — check farm account mechanics
  - [ ] `guides/hero-guide.html` — DONE (rewritten April 13)
  - [ ] `guides/glossary.html` — check term definitions
- [ ] **1.2** Spot-check calculator data (highest-traffic pages first)
  - [ ] `js/calc-troops.js` — all values marked [EST], verify against kingshot.net
  - [ ] `js/calc-building.js` — TC level 11 stone marked [EST]
  - [ ] `js/calc-hero-xp.js` — deployment capacity levels 16-80 are interpolated, not verified
  - [ ] `js/calc-gear.js` — gathering + construction sets empty, combat only levels 1-10
  - [ ] `js/calc-pets.js` — levels 16-30 missing for epic/legendary
  - [ ] `js/calc-war-academy.js` — cavalry/archer assumed to mirror infantry
- [ ] **1.3** Check game content in mini-games
  - [ ] `js/game-war-table.js` — 20 battle scenarios: are troop compositions realistic?
  - [ ] `js/game-vault-trial.js` — 35 quiz questions: are answers correct?
- [ ] **1.4** Check calendar events
  - [ ] `js/calendar.js` — 12 default events: are names and timing correct?

---

## HIGH PRIORITY — Features

### 2. Data Gap Fixes
**Why:** Several calculators have estimated or missing data where verified sources exist.

- [ ] **2.1** Hero XP deployment capacity levels 16-80 — scrape from kingshotdata.com/guides/hero-level/
- [ ] **2.2** Governor Gear calc — fill gathering + construction sets, extend combat past level 10
- [ ] **2.3** Pet calc — fill levels 16-30 for epic/legendary
- [ ] **2.4** Troop calc — spot-check [EST] values against kingshot.net
- [ ] **2.5** Building calc — verify TC level 11 stone cost
- [ ] **2.6** War Academy — verify cavalry/archer match infantry (or find differences)
- [ ] **2.7** Hero stats database — JS-loaded on kingshot.net, may need scraping

### 3. Profile Aggregator Research (9x3x3 Rounds 2-3)
**Why:** Need to inform how player profile pages evolve. Round 1 done (Perplexity, Brave, DeepSeek). 6 more sources needed.

- [ ] **3.1** Round 2: Gemini + Grok + Wolfram (if applicable, or another source)
- [ ] **3.2** Round 3: ChatGPT + 2 more sources
- [ ] **3.3** Herd Lens check on all 9 sources
- [ ] **3.4** Apply findings to enhance profile.html

### 4. Survey Admin View Update
**Why:** Architect added new survey fields that the admin dashboard doesn't display.

- [ ] **4.1** Update Worker `/survey/admin` endpoint to display "other events" text field responses
- [ ] **4.2** Display "custom build anything" free-text responses
- [ ] **4.3** Test admin view renders correctly

---

## MEDIUM PRIORITY — Features

### 5. Avatar Sidebar Compact Panel (Track 2.2/2.3)
**Why:** The advisor panel should be visible on every page, not just in the council chamber.

- [ ] **5.1** Compact panel at bottom of sidebar: avatar 60×60, name, archetype, level badge, XP bar
- [ ] **5.2** XP bar animates on gain
- [ ] **5.3** Expanded panel (click to open): full avatar, level tree, XP log, mini-game buttons
- [ ] **5.4** Locked item/ability slots visible at Level 6+

### 6. Free User Email Backup (Track 14)
**Why:** localStorage is fragile. Offer optional email backup at emotional moments.

- [ ] **6.1** "Protect your progress" prompt at Level 5 or after 7 visits
- [ ] **6.2** Worker `/advisor/save` endpoint: email + avatar state JSON → KV
- [ ] **6.3** Worker `/advisor/restore` endpoint: email → avatar state
- [ ] **6.4** FID + email mapping in KV
- [ ] **6.5** "Restore progress" flow for new device/cleared cache

### 7. Server Transfer Calculator Enhancement
**Why:** kingshot.net has basic power-to-passes. Ours can add advisor integration.

- [ ] **7.1** Enhance existing `calculators/transfer.html` with advisor recommendations
- [ ] **7.2** Kingdom comparison tool (what does moving to kingdom X mean?)

### 8. Gift Code Monitoring
**Why:** Codes expire, new ones appear. Ongoing maintenance needed.

- [ ] **8.1** Check for expired codes, remove from codes.html
- [ ] **8.2** Verify auto-checker scraper still works (gamesradar + destructoid sources)
- [ ] **8.3** Consider adding more scraping sources

---

## LOW PRIORITY — Future Features

### 9. Alliance Activity Tracker
- [ ] **9.1** Screenshot upload + OCR approach (no app, both platforms, no TOS risk)
- [ ] **9.2** AI analysis of member data ("Three members haven't been active in 5 days")
- [ ] **9.3** Integration with alliance credit system

### 10. Second Advisor Avatar (Male)
- [ ] **10.1** Midjourney portrait generation
- [ ] **10.2** Upload to avatar service (Simli or Vozo, depending on decision)
- [ ] **10.3** Wire into advisor-names.js with selection option

### 11. Kingdom Intelligence Network (Phase 7)
- [ ] **11.1** Another Claude builds the scraper from HUMAN_SCRAPER_SPEC.md
- [ ] **11.2** Test kingdom visiting (does visiting show rankings?)
- [ ] **11.3** If visiting works: single-account scraper for all kingdoms
- [ ] **11.4** If not: farm account creation in target kingdoms
- [ ] **11.5** OCR pipeline for screenshot → structured data
- [ ] **11.6** Data display on website (kingdom comparison page)
- [ ] **11.7** Revenue justification: must generate enough to cover phone hardware (~$100/phone, ~$20/mo)

---

## DEFERRED — Architect Handling

- **AI Avatar Animation** — Vozo AI vs Simli decision. Architect is testing. Another Claude is working on audio.
- **Lip Sync Integration** — Blocked on avatar service decision
- **Rewarded Video Ads** — "Watch ad for credits" — needs ad network setup

---

## INFRASTRUCTURE / HOUSEKEEPING

- [ ] Clean up `avatar_test/` directory (untracked, sitting in repo root)
- [ ] Verify AdSense approval status
- [ ] Check Stripe webhook is receiving events correctly
- [ ] Monitor Worker KV usage (approaching any limits?)
- [ ] Test all 19 Worker routes are responding

---

## BY THE NUMBERS

| Category | Count |
|----------|-------|
| Root HTML pages | 14 |
| Calculator pages | 31 |
| Guide pages | 11 |
| Arcade games | 7 |
| Alliance pages | 3 |
| JS files | 50 |
| Worker POST routes | 13 |
| Worker GET routes | 6 |
| Stripe tiers | 4 (Free / Pro $9.99 / War Council $29.99 / Elite $99.99) |
| Heroes in database | 27 |
| Advisor archetypes | 5 (3 free, 2 Pro-locked) |
| Advisor names | 46 |

---

*Updated April 13, 2026 by Opus (Session 3).*

# KingshotPro — Master Task List
*Last updated: April 13, 2026 (Session by Opus — hero DB, profiles, PvP meta built).*
*Every Claude working on KingshotPro reads this first, updates it before leaving.*

Status key: [ ] not started · [~] in progress · [x] done · [!] blocked · [-] cut/deferred

---

## COMPLETED — FULL INVENTORY

### Core Site
- [x] 11 root pages: index, about, pricing, calendar, codes, auto-redeem, survey, verify, support, privacy, terms
- [x] 31 calculators in /calculators/ (alliance-mob through war-planner)
- [x] 11 guides in /guides/ (beginner, f2p, f2p-heroes, farm-account, furnace, hero-guide, kvk, alliance, server-age, pack-value, glossary)
- [x] 7 arcade games in /games/ (war-table, vault-trial, bloom, drift, flicker, orbit, pulse)
- [x] 3 alliance pages in /alliance/ (index, page, directory)
- [x] FID lookup via Cloudflare Worker proxy (js/fid.js)
- [x] Multi-account switcher — save up to 10 Player IDs, switch between them (js/advisor-accounts.js)

### Advisor System (17 JS files)
- [x] advisor.js — XP, levels, observations, behavioral tags, greetings, event system
- [x] advisor-orb.js — Living orb with breathing/firelight/parallax, council chamber panel
- [x] advisor-names.js — 46 medieval names, Ysabel locked to portrait
- [x] advisor-select.js — Archetype selection (3 free: steward/sage/herald, 2 locked: conqueror/oracle)
- [x] advisor-hooks.js — Calculator XP + observation wiring, 54 insight dialogues, guide links
- [x] advisor-chat.js — Real AI chatbox with typing indicator, energy bar
- [x] advisor-cta.js — CTA engine: visits 1-3 none, 4-7 context, 8-14 proactive, 15+ subtle + cooldown
- [x] advisor-lore.js — Ysabel backstory (10 fragments, level/visit-gated)
- [x] advisor-referral.js — Referral system with milestones (1/3/5/10/25/50)
- [x] advisor-alliance.js — Alliance credit system
- [x] advisor-accounts.js — Multi-account switcher (DeepSeek generated)
- [x] advisory.js — Advisory display renderer
- [x] layout.js — Sidebar navigation, level-up banner
- [x] cookie-consent.js — GDPR consent banner
- [x] calendar.js — Event calendar with countdowns, push notifications, .ics export, Google Calendar links

### Cloudflare Worker (DEPLOYED)
URL: https://kingshotpro-api.kingshotpro.workers.dev
KV namespace: 6279d210fac34b698b71fca9b23135e4

POST endpoints:
- [x] /player — Century Games FID proxy
- [x] /redeem — Gift code redemption proxy
- [x] /auth/send — Magic link email via Resend
- [x] /auth/verify — Validate token, set cookie
- [x] /advisor/chat — AI chat (GPT-4o-mini free/pro, GPT-4o elite), tier-aware memory, energy enforcement
- [x] /advisor/chronicle — AI medieval chronicle (Pro+)
- [x] /advisor/illustration — DALL-E 3 battle scene (Pro+)
- [x] /advisor/voice — OpenAI TTS voice message (Elite)
- [x] /advisor/portrait — DALL-E 3 custom portrait (Elite)
- [x] /advisor/video — Simli lip sync video + caching
- [x] /stripe/webhook — Tier updates on payment/cancellation
- [x] /verify/request — Verification queue + Discord notification
- [x] /verify/confirm — Code validation
- [x] /verify/mark-sent — Admin marks verification code sent
- [x] /survey/submit — Survey responses to KV + Discord

GET endpoints:
- [x] /verify/admin — Admin dashboard
- [x] /survey/admin — Survey results dashboard
- [x] /codes/check — Gift code scraper check
- [x] /codes/list — List known codes
- [x] /video/cache — Video cache lookup

### Revenue
- [x] Stripe LIVE: Pro $9.99/mo, War Council $29.99/mo, Elite $99.99/mo + annual discounts
- [x] AdSense snippet on all pages (applied, awaiting approval)
- [x] Pricing page with 4-tier comparison
- [x] Verification: $4.99/character free users, unlimited for subscribers

### Infrastructure
- [x] GitHub Pages deploy (Kingshotpro/website repo)
- [x] DNS: 4 A records + HTTPS
- [x] .gitignore (video files, node_modules)
- [x] Player-facing PDF presentation (4 pages)

---

## RECENTLY COMPLETED (April 13, 2026)

- [x] Hero Database: 27 heroes (19 legendary + 8 epic), Gen 1-6, cross-verified from 4 sources
  - Filterable by role, generation, troop type, rarity, F2P accessibility
  - 6 recommended lineups (F2P early/mid/late, rally offense, garrison defense, bear hunt)
  - Personalized advisor recommendations based on player profile
  - Files: heroes.html, js/heroes.js
- [x] Player Profile Pages: shareable URLs with stats + analysis
  - URL format: profile.html?fid=XXXXXX
  - Profile banner, stats grid, game analysis, hero recs, strategic advice
  - Share button (copy URL), dynamic OG meta for social previews
  - Cache-first rendering, background API refresh
  - Files: profile.html, js/profile.js
- [x] PvP Meta & Troop Compositions page
  - Visual troop ratio bars (color-coded infantry/cavalry/archer)
  - Rally, garrison, bear hunt, event formations
  - Bear hunt ratio progression by generation (60% arc → 85% arc)
  - Counter system triangle, quick reference table
  - Files: meta.html
- [x] Hero Guide rewrite: removed fabricated hero names, replaced with verified data
- [x] F2P Heroes: fixed broken script paths
- [x] TASK_LIST.md: full rewrite reflecting actual build state
- [x] Sidebar nav: added Hero Database, Player Profile, PvP Meta

---

## TO BUILD — PRIORITY ORDER

### 1. Hero Database Page
**Status: COMPLETED** (see above)

### 2. Player Profile Pages
**Status: COMPLETED** (see above)

### 3. PvP Meta Tracker
**Status: COMPLETED** (see above)

### 4. Data Gap Fixes (NEXT)
**Why:** Most-requested feature from player feedback (Cptkwark). No competitor does situational recommendations — they all just list stats.
**What:** Dedicated hero page with:
- [ ] Hero cards: name, generation, role, F2P/paid, key skills
- [ ] Situational filters: "best for rally", "best for KvK defense", "best for F2P"
- [ ] Per-generation lineup builder (Gen 1-4 recommendations)
- [ ] Advisor integration: "Based on your furnace level, prioritize these heroes"
- [ ] Data sourced from kingshotdata.com + community verification
**Files:** New `heroes.html` + `js/heroes.js`, possibly `heroes/` directory for individual hero pages

### 2. Player Profile Pages (Shareable URLs)
**Why:** Cptkwark feedback — "saveable profiles of each account holder, shareable stats"
**What:** Public profile page showing player stats from FID lookup
- [ ] Profile page at `/profile.html?fid=XXXXXX`
- [ ] Display: nickname, kingdom, furnace, spending tier, game stage
- [ ] Hero roster (once hero database exists)
- [ ] Share button (copy URL)
- [ ] OG meta tags for social media previews
**Research:** 9x3x3 profile aggregator research Round 1 complete (op.gg, WoW Armory patterns studied). Rounds 2-3 still needed (6 more sources).
**Dependency:** Hero database should exist first for full profiles.

### 3. Data Gap Fixes
Known sources exist (kingshotdata.com, kingshot.net). Need scraping or manual collection.
- [ ] Hero XP: levels 16-80 (only 1-15 collected, max is 80)
- [ ] Governor Gear calc: gathering + construction sets empty, combat only levels 1-10
- [ ] Pet calc: levels 16-30 missing for epic/legendary
- [ ] Troop calc: all values marked [EST] — spot-check against kingshot.net
- [ ] Building calc: TC level 11 stone marked [EST]
- [ ] War Academy cavalry/archer: assumed to mirror infantry — verify at least one
- [ ] Hero stats database (JS-loaded on kingshot.net, no static source — may need scraping)
- [ ] Rally capacity by furnace level

### 4. PvP Meta Tracker
**Why:** Public data EXISTS (Kingshot Mastery, Fandom wiki, Reddit). Nobody synthesizes it.
**What:**
- [ ] Meta page showing current best troop compositions per game stage
- [ ] Scrape public sources periodically, AI synthesizes
- [ ] Community contribution option for verified players
**Files:** New `meta.html` + `js/meta.js`

### 5. Server Transfer Calculator Enhancement
**Why:** kingshot.net has basic power-to-passes. Ours can add advisor integration + kingdom scouting.
- [ ] Enhanced transfer calc with advisor recommendations
- [ ] Kingdom comparison tool (what does moving to kingdom X mean?)
Note: calculators/transfer.html already exists — this is an upgrade.

### 6. Survey Admin View Update
- [ ] Display new "other events" text field in admin dashboard
- [ ] Display "custom build anything" responses
- [ ] Worker /survey/admin endpoint may need update

---

## INFRASTRUCTURE TASKS

- [ ] Avatar sidebar compact panel (Track 2.2/2.3 from original plan)
  - Compact panel at bottom of sidebar: avatar 60x60, name, level badge, XP bar
  - Expanded panel: full avatar, level tree, XP log, mini-game buttons
- [ ] Gift code monitoring — ongoing, remove expired codes, check for new
- [ ] Free user email backup (Track 14) — "protect your progress" at Level 5
  - /advisor/save and /advisor/restore Worker endpoints
  - FID + email mapping in KV

---

## DEFERRED — ARCHITECT HANDLING SEPARATELY

- [-] AI avatar animation — Vozo AI vs Simli decision pending. Architect testing.
- [-] Second male advisor avatar — needs Midjourney generation
- [-] Kingdom Intelligence Network (Phase 7) — phone fleet, ADB scraper, AI pipeline. Needs hardware + revenue to justify.
- [-] Real-time lip sync wiring into client — blocked on avatar service decision

---

## DATA — NO VERIFIED SOURCE

These would need scraping, reverse engineering, or community contribution:
- [ ] Hero stats database (JS-loaded on kingshot.net — dynamic, no static URL)
- [ ] Rally capacity by furnace level
- [ ] Chance-based hero mechanics — where is "chance" guaranteed vs random?
- [ ] KvK win/loss history — data sourcing unclear

---

## CORRECTIONS LOG
*Past fabrications documented for accountability.*

1. "Alliance tracker — nobody has it" -> WRONG. Kingshot Alliance Tools exists.
2. "Account value — for server merges" -> WRONG. Players mean selling for USD.
3. "PvP meta — no data source" -> WRONG. Public data exists at multiple sites.
4. "Resource farming calculator needed" -> PARTIALLY WRONG. Calculator exists elsewhere. Demand is strategy, not math.
5. "80+ posts requesting alliance tracker" -> UNVERIFIED. Number may be fabricated by Perplexity.

---

## WORKER SECRETS REFERENCE
- OPENAI_KEY, RESEND_KEY, SYSTEM_PROMPT, STRIPE_KEY
- ADMIN_KEY: 2X5cgCt8WY2UrG-yj8y_oE36N4h8OtjR
- DISCORD_WEBHOOK (for verification + survey alerts)
- SIMLI_KEY: 05ll4nqf31s20n3gk232x4fi
- Simli Face ID: 8726b0a3-73ac-43db-abae-4a7a1285f521

---

*Every Claude: read this before building. Update it before leaving. Don't build what isn't listed without Architect approval.*

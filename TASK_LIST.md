# KingshotPro — Master Task List
*Last updated: April 10, 2026 (Session 2, Opus).*
*Every Claude working on KingshotPro reads this first, updates it before leaving.*

Status key: [ ] not started · [~] in progress · [x] done · [!] blocked · [—] cut/deferred

---

## COMPLETED

- [x] Track 0 — Data layer: localStorage migration, advisor.js core
- [x] Track 1 — Avatar selection screen: 3 free archetypes, 2 locked Pro, random names
- [x] Track 2 — Avatar sidebar panel: portrait, name, level badge, XP progress bar
- [x] Track 3 — Observation engine: calc usage tracking, behavioral tags, 54 insight dialogues
- [x] Track 4 — Level-up system: gold banner notification, visual progression
- [x] Track 5 — War Table mini-game: 20 battle scenarios, daily play, XP rewards
- [x] Track 6 — Vault Trial mini-game: 35 questions, 6 categories, daily quiz, XP rewards
- [x] Track 7 — Advisory voice: archetype-prefixed output, observation insights
- [x] Track 8 — Naming: spend tiers, advisor names, Player ID rename
- [x] Track 9 — XP multipliers: furnace bonus, whale bonus, server age bonus
- [x] Track 10 — Calculator hooks: every calc grants XP + records observations
- [x] Track 12 — Herald redesign: voice lines constrained to available data
- [x] Track 15 — Strategy guides: beginner, F2P, glossary for AdSense
- [x] Living orb: center float, speech bubble, glide to rest, breathing/firelight/parallax
- [x] D-ID animated greeting video + OpenAI TTS voice on all scripted responses
- [x] Council chamber panel: chat, quick replies, in-chat Player ID input
- [x] Meta tags, FID tooltip, git remote fix, .gitignore, infrastructure cleanup
- [x] Phase 1: Worker expansion — auth (magic link), AI chat endpoint, energy enforcement, KV state
- [x] Phase 2: AI chatbox — text input, typing indicator, energy bar, Worker integration
- [x] Phase 3: CTA engine — context-triggered, escalating, cooldown, tier upgrade prompts
- [x] Phase 4: Premium content endpoints (chronicle, illustration, voice, portrait)
- [x] Phase 5: Persistent memory (7-day Pro, permanent Elite, backfill on upgrade)
- [x] Phase 6: Pricing page with 4 tiers + Stripe LIVE payment links
- [x] Worker DEPLOYED: kingshotpro-api.kingshotpro.workers.dev (OpenAI routing, KV, secrets)
- [x] Kingshot knowledge base authored + deployed as system prompt
- [x] Alliance page system (create, view, public URLs)
- [x] KvK strategy guide + Hero guide (5 guides + glossary total)
- [x] Stripe LIVE: Pro $9.99, War Council $29.99, Elite $99.99 with annual discounts
- [x] AdSense applied (snippet on all pages)
- [x] GLINT_BUILD_SPEC archived
- [x] AI pricing research: 9x3x3 complete, 4-tier structure defined
- [x] Player-facing PDF presentation (4 pages, both advisor portraits)

---

## DATA GAPS — VERIFIED SOURCES EXIST

These have known sources (kingshotdata.com, kingshot.net) but data hasn't been fetched yet.

- [ ] Hero XP: levels 16-80 (only 1-15 collected, max is 80)
- [ ] Governor Gear calc: gathering + construction sets empty, combat only levels 1-10
- [ ] Pet calc: levels 16-30 missing for epic/legendary
- [ ] Troop calc: all values marked [EST] — spot-check against kingshot.net
- [ ] Building calc: TC level 11 stone marked [EST]
- [ ] War Academy cavalry/archer: assumed to mirror infantry — verify at least one

## DATA GAPS — NO VERIFIED SOURCE

- [ ] Hero stats database (JS-loaded on kingshot.net, no static source — may need scraping)
- [ ] Rally capacity by furnace level

---

## INFRASTRUCTURE

- [x] Verify Cloudflare Worker proxy is responding — LIVE, tested (SSL was provisioning earlier)
- [x] Test FID lookup with a real FID — Worker responds correctly — confirm what fields the API actually returns
- [x] Remove `netlify.toml` from repo — done (dead config, deploys via GitHub Pages now)
- [x] Confirm GitHub Pages source — HTTPS 200, GitHub.com serving is set to "GitHub Actions" in Kingshotpro/website settings
- [x] Remove or archive `GLINT_BUILD_SPEC.md` — archived — references Netlify, wrong repo URL, wrong API format
- [x] DNS: all 4 A records confirmed (108/109/110/111.153) present (185.199.108/109/110/111.153)
- [x] HTTPS: SSL working, HTTP/2 200 is provisioned for kingshotpro.com

---

## TRACK 2 — AVATAR PANEL IN SIDEBAR

The advisor's persistent presence on every page. Shows growth.

- [x] 2.1 steward.js deleted (replaced by advisor-orb.js — file still in repo)
- [ ] 2.2 Compact panel at bottom of left sidebar (desktop):
  - [ ] Avatar image (60×60), name + archetype subtitle
  - [ ] Level badge (gold circle), XP progress bar
  - [ ] XP bar animates on gain
- [ ] 2.3 Expanded panel (click compact to open):
  - [ ] Full avatar, level progression tree (10 levels, current highlighted)
  - [ ] Recent XP log (last 10 actions with timestamps)
  - [ ] Mini-game access buttons
  - [ ] Locked item slots (visible at Level 6+), locked Abilities tab
  - [ ] Ascension progress bar (never fills in Phase 1)

---

## TRACK 3 — OBSERVATION ENGINE

Makes the advisor notice things about the player.

- [x] 3.1 All calculators wired via advisor-hooks.js's "Calculate" button to `Advisor.observe('calc_usage', calcName, +1)`
- [x] 3.2 Absence tracking in behavioral tags used (absence = signal)
- [x] 3.3 Tags: combat_prioritizer, builder, optimizer, neglects_gear, daily_player, aggressive_tactician: combat_prioritizer, builder, optimizer, neglects_gear, daily_player, aggressive_tactician, knowledge_gap_{topic}
- [x] 3.4 54 dialogue lines in advisor-hooks.js: ~72 lines (3 per tag per archetype)
- [x] 3.5 Visit pattern in advisor.js processDailyVisit: day-of-week, hour, derive patterns after 7+ visits

---

## TRACK 4 — LEVEL-UP SYSTEM

- [x] 4.1 Level calculation in advisor.js + event firing (thresholds already in advisor.js)
- [x] 4.2 Level-up banner in layout.js banner: "[Name] has reached Level [N]"
- [x] 4.3 Visual changes implemented (glow, title, frame, accessory, greeting variations)
- [x] 4.4 30 level-up messages (10 per archetype) per archetype (30 total)

---

## TRACK 5 — MINI-GAME: WAR TABLE

- [x] 5.1 20 scenarios in game-war-table.js: 20+ scenarios with real Kingshot compositions
- [x] 5.2 War Table UI built, two armies, "Which side wins?" buttons
- [x] 5.3 Result + advisor reaction with advisor reaction (archetype-specific)
- [x] 5.4 XP: +50/+20, tracks picks +50, incorrect +20. Track aggressive/defensive picks.
- [x] 5.5 Daily limit in localStorage

---

## TRACK 6 — MINI-GAME: VAULT TRIAL

- [x] 6.1 35 questions in game-vault-trial.js: 40+ questions, verified game data only
- [x] 6.2 5 random per session per session, immediate feedback
- [x] 6.3 Feedback per question per question in character
- [x] 6.4 Graduated scoring implemented: 5/5=+75, 4/5=+55, 3/5=+35, <3=+20
- [x] 6.5 missed_topics tracked → link to relevant calculators

---

## TRACK 7 — ADVISORY VOICE UPGRADE

- [x] 7.1 Archetype-prefixed output with archetype speech
- [x] 7.2 Tag-based insight card (after 3+ sessions, surface one tag-based insight)
- [x] 7.3 Visit count, streak, absence greetings: visit count, streak, absence detection

---

## TRACK 9 — XP MULTIPLIERS FROM GAME DATA

- [ ] 9.1 Furnace 15+ → 1.1× daily XP
- [ ] 9.2 Furnace 22+ → 1.25× daily XP
- [ ] 9.3 Whale tier → 1.15× all XP
- [ ] 9.4 Server age >180 days → +5 flat bonus
- [ ] 9.5 Display active multipliers in avatar panel

---

## TRACK 10 — WIRE INTO EXISTING PAGES

- [ ] 10.1 Add avatar compact panel to sidebar (layout.js)
- [ ] 10.2 Add "Games" nav category: War Table, Vault Trial
- [ ] 10.3 Homepage: FID success → avatar selection OR personalized greeting
- [ ] 10.4 Each calculator's compute function → Advisor.grantXP() + Advisor.observe()
- [ ] 10.5 Debounce: XP once per unique calculator per session

---

## TRACK 11 — AI INTEGRATION [BLOCKED on pricing research]

**Research spec written: AI_PRICING_RESEARCH_SPEC.md — needs 9x3x3 before building.**

### 11.1 Research (assign to research Claude)
- [ ] Run 9x3x3 on AI_PRICING_RESEARCH_SPEC.md
- [ ] Architect approves pricing tiers
- [ ] Resolve: credit amounts, daily free allowance, Pro price, credit pack prices

### 11.2 Authentication
- [ ] Design auth flow (magic link email proposed, not approved)
- [ ] Cloudflare Worker: send/verify magic link, set cookie
- [ ] FID-to-email mapping in KV store

### 11.3 Credit System
- [ ] Daily free credit grant (amount TBD)
- [ ] Credit balance in Worker KV or D1
- [ ] Credit deduction per AI call
- [ ] Credit purchase via Stripe
- [ ] "Watch ad for credits" rewarded video
- [ ] Credit counter in chatbox UI

### 11.4 Kingshot Knowledge Base (THE MOAT)
- [ ] Troop types, strengths, counters, compositions
- [ ] Furnace upgrade paths per spend tier
- [ ] Event point strategies (HoG, KvK, TSG, Vikings)
- [ ] Hero tier list with synergy recommendations
- [ ] Server age patterns (90/180/360 day milestones)
- [ ] Pack value analysis per game stage
- [ ] ALL data verified — no training-knowledge guesses

### 11.5 System Prompt Design
- [ ] Base Kingshot knowledge prompt (~2500 tokens)
- [ ] Player context injection (profile + observations)
- [ ] Per-archetype personality instructions
- [ ] Output format: structured JSON for cards + free text for chat
- [ ] Off-topic handling: stay in character, redirect gently

### 11.6 Chatbox → Real AI
- [ ] Text input field (not just quick replies)
- [ ] Typing indicator while API responds
- [ ] Message history in localStorage (last 20)
- [ ] Credit counter visible
- [ ] Upsell when credits exhausted

### 11.7 First-Load Hook
- [ ] Advisor speaks one AI message on first visit (cost covered by ad impression)
- [ ] Response must hook regardless of what user types

### 11.8 Daily Insight
- [ ] Pro users configure server reset time
- [ ] Daily briefing generated on first visit after reset
- [ ] Free users: costs 1 credit

### 11.9 Cloudflare Worker Expansion
- [ ] /advisor/chat endpoint
- [ ] /advisor/insight endpoint
- [ ] /advisor/hook endpoint
- [ ] Rate limiting per FID
- [ ] Model routing: Haiku (free), Sonnet (Pro)
- [ ] API key in Worker secrets

### 11.10 Stripe
- [ ] Pro subscription checkout
- [ ] Credit pack purchase
- [ ] Webhook for subscription status
- [ ] Status in Worker KV keyed by email

### 11.11 AdSense
- [ ] Display ads on free-tier pages (slots already stubbed)
- [ ] Rewarded video ads for credit earning
- [ ] Ad removal for Pro
- [ ] Apply once site has sufficient content

---

## TRACK 12 — HERALD ARCHETYPE REDESIGN ✅

- [x] 12.1 Herald insight lines in advisor-hooks.js: competitive framing using available data only
- [x] 12.2 Herald greeting lines in advisor.js: rewritten, no live kingdom references

---

## TRACK 13 — ANIMATED AVATAR EVALUATION

Prototype in place (D-ID trial, 8 credits remaining). Need to decide production path.

- [ ] 13.1 Evaluate D-ID vs Simli vs HeyGen for production use
- [ ] 13.2 D-ID watermark requires Pro ($) — is it worth it?
- [ ] 13.3 Alternative: OpenAI TTS voice over static image with CSS life (current fallback, zero cost)
- [ ] 13.4 Decision: which service, or stay with CSS + TTS only?

---

## TRACK 14 — FREE USER DATA PERSISTENCE

localStorage is primary (zero friction). Optional email backup offered at emotional moments.

- [ ] 14.1 "Protect your progress" prompt at Level 5 or after 7 visits
  - [ ] Advisor says: "[Name] has reached Level 5. Want to protect your progress?"
  - [ ] Email input field appears in chatbox
  - [ ] No friction — skippable, purely optional
- [ ] 14.2 Server-side storage (Cloudflare Worker KV)
  - [ ] /advisor/save endpoint: receives email + avatar state JSON
  - [ ] /advisor/restore endpoint: receives email, returns avatar state
  - [ ] FID + email mapping stored in KV
- [ ] 14.3 "Restore progress" option
  - [ ] On new device/cleared cache: "Have you been here before? Enter your email."
  - [ ] Pulls avatar state from server, writes to localStorage
- [ ] 14.4 Pro users: email required for Stripe, auto-persisted. No extra step.

---

## TRACK 15 — ORIGINAL CONTENT (required for AdSense approval)

Google requires original, valuable text content — not just tools. Strategy guides bring organic search traffic + feed the advisor's knowledge base + satisfy AdSense.

- [ ] 15.1 Create `guides/` directory with strategy guide pages
- [ ] 15.2 Guide: "Kingshot Beginner Guide: Your First 30 Days"
  - [ ] What to build first, research priorities, gem spending, event participation
  - [ ] 800-1500 words, original, structured with headings
- [ ] 15.3 Guide: "F2P Survival Guide: How to Compete Without Spending"
  - [ ] Resource management, event optimization, hero priorities for free players
- [ ] 15.4 Guide: "Kingshot Furnace Guide: When to Upgrade and When to Wait"
  - [ ] Furnace upgrade decision framework by game stage
- [ ] 15.5 Guide: "Understanding Server Age: What Happens at 90, 180, and 360 Days"
  - [ ] Server lifecycle patterns, when to migrate, kingdom power dynamics
- [ ] 15.6 Glossary page: "Kingshot Terms Explained"
  - [ ] FID, T4 troops, furnace, KvK, alliance mobilization, bear hunt, etc.
  - [ ] Good for SEO (long-tail keyword capture)
- [ ] 15.7 Add guides to sidebar navigation under new "GUIDES" category
- [ ] 15.8 Link guides from advisor responses (advisor suggests relevant guide)
- [ ] 15.9 Apply for Google AdSense once 3+ guides are live

**Content rule: verify all game-specific claims against kingshotdata.com. General strategy advice (e.g. "research before combat in early game") is fine. Specific numbers must be sourced.**

---

## CONTENT / HOUSEKEEPING

- [x] Remove test files (test-audio.html) — done
- [x] Clean up unused avatar test images — done
- [x] Remove netlify.toml — done
- [x] GLINT_BUILD_SPEC.md archived it (references Netlify, wrong repo)
- [ ] Monitor gift codes for new codes (ongoing) / remove expired
- [x] steward.js deleted (replaced by advisor-orb.js, still in repo)

---

## PHASE 2 (don't build yet)

- [ ] Auto-apply gift codes (CF Workers KV backend)
- [ ] Subscription infrastructure (Stripe)
- [ ] Item system (hooks in advisor.js schema)
- [ ] Ability system (hooks in schema)
- [ ] Achievement system (hooks in schema)
- [ ] Ascension mechanic (UI stub present)
- [ ] Unique avatar art per name (46 portraits — currently gender defaults)
- [ ] Real-time lip sync (Simli or similar)
- [ ] Live kingdom monitoring/scraping (ruled out due to hardware cost unless revenue supports it)

---

## OPEN DECISIONS (need Architect)

1. **AI pricing tiers** — research spec ready, needs 9x3x3 assignment
2. **Auth method** — magic link for Pro approved concept; free users get optional email backup at Level 5
3. **Herald voice lines** — personality kept, capabilities constrained, needs rewrite
4. **Animated avatar service** — D-ID trial tested, watermark issue, evaluate alternatives or stay CSS+TTS
5. **Idle state** — resolved: CSS breathing on static image (no lip movement). D-ID idle video removed.

---

## BUILD SEQUENCE

```
DONE:     Tracks 0-10, 12, 15 — 13 of 15 tracks complete
NEXT:     Track 14 (free user email backup — needs CF Worker)
          Track 13 (animated avatar service decision)
          Data gaps (hero XP 16-80 needs scraping, EST markers in calcs)
          AdSense application (content is ready)
BLOCKED:  Track 11 (AI integration — needs pricing research 9x3x3)
```

---

*Every Claude: read this before building. Update it before leaving. Don't build what isn't listed without Architect approval.*

---

## ACTIVE REMINDERS

- [ ] **CHECK SIMLI:** Ysabel face submitted ~6pm EDT April 10, 2026. Processing takes up to 24 hours. Check app.simli.com → Your Faces by April 11-12. Copy Face ID → give to Claude to wire lip sync integration.
- [ ] **Simli API key:** 05ll4nqf31s20n3gk232x4fi
- [ ] **Simli plan:** Hobby $10/mo, $25/mo spending cap, 1,000 min/mo at $0.01/min

---

## FEATURE IDEAS — RESEARCHED & VERIFIED (April 11, 2026)

### 1. Alliance Activity Tracker
**Status:** Competitor exists (Kingshot Alliance Tools — Discord integration, dashboards).
**Architect input:** In-game tracking via mobile app plausible on Android (MediaProjection API, no jailbreak) but risky for Play Store + TOS. iOS not feasible without jailbreak.
**Practical approach:** Screenshot upload + OCR. Player screenshots alliance member list, uploads to our site, we extract data server-side. No app needed, both platforms, no TOS risk.
**Our differentiator:** Alliance credit system + AI analysis of member data. Advisor says: "Three members haven't been active in 5 days. Here's who to talk to."

### 2. Account Value Estimator
**Status:** VERIFIED — players mean selling accounts for USD (r/KingshotAccountSells exists). This violates Century Games TOS.
**Decision:** Do NOT build a sale-price tool. CAN build an informational "investment tracker" — shows what they've invested in time/resources. Kept on list for reference/discussion.

### 3. Event Timer + Push Notifications
**Status:** VERIFIED demand. Existing calendars (Kingshot Atlas, kingshotguides.com) exist but lack push notifications and new-server calendars.
**Architect input:** Build as standalone F2P calendar tool on our website. Captures Player ID + ad impressions. Not a calculator — a dedicated calendar/scheduler page.
**Gap we fill:** Browser push notifications (no existing tool does this) + pre-first-KvK event schedule (commonly asked for, not available).
- [ ] Build event calendar page with configurable server reset time
- [ ] Browser Notifications API for event reminders
- [ ] New server event schedule (first 40 days)
- [ ] Recurring event templates (HoG, AM, KvK prep)

### 4. PvP Meta / Troop Compositions
**Status:** Public data EXISTS (Kingshot Mastery, LDShop, Fandom wiki). Specific comps documented (example: 5/4/1 ratio, Petra+Hilde+Rosa rally).
**Architect input:** Can we do this as data scraping?
**Answer:** Yes — scrape public guides/wiki pages periodically, AI synthesizes into "current meta" page. Sources: Kingshot Mastery (hero combos), Fandom wiki (troop formations), Reddit (community discussion). Updated weekly via AI processing.
- [ ] Build meta tracker page — auto-updated from public sources
- [ ] AI synthesis of current best comps per game stage
- [ ] Community contribution option for verified players

### 5. Server Transfer Calculator
**Status:** EXISTS at kingshot.net (basic power-to-passes). Our version could add advisor integration + kingdom scouting.
- [ ] Build enhanced transfer calculator with advisor recommendations
- [ ] Tie into kingdom scouting (War Council feature)

### 6. F2P Hero Builds
**Status:** VERIFIED demand. Specific hero names per generation documented in community.
**Architect input:** Dedicated F2P section on website with guides, directions, hero lineups per generation.
**Known F2P lineups (from community, examples — need verification):**
- Gen 1: Howard, Chenko, Jabel, Diana, Quinn
- Gen 2: add Zoe, Marlin
- Gen 3: add Petra
- Gen 4: add Rosa
- [ ] Create dedicated /f2p/ section or expand existing F2P guide
- [ ] Hero lineup page with per-generation recommendations
- [ ] Specific gear priority for F2P players

### 7. Resource Farming + Farm Account Guide
**Status:** Resource gathering calculator EXISTS elsewhere. Player demand is for strategy advice, not math.
**Architect input:** Tie to AI advisor for personalized farming advice. ALSO teach how to create and manage a farm account (secondary account built for resource production). Farm accounts are extremely common in Kingshot.
- [ ] Farm account setup guide (how to create, what to build, how to transfer resources)
- [ ] AI advisor integration: personalized farming strategy based on player profile
- [ ] Resource efficiency analysis: "you're farming X/hour, here's how to improve"

---

## CORRECTIONS LOG
*Forge was wrong on these. Documenting for accountability.*

1. "Alliance tracker — nobody has it" → WRONG. Kingshot Alliance Tools exists.
2. "Account value — for server merges" → WRONG. Players mean selling for USD.
3. "PvP meta — no data source" → WRONG. Public data exists at multiple sites.
4. "Resource farming calculator needed" → PARTIALLY WRONG. Calculator exists. Demand is strategy, not math.
5. "80+ posts requesting alliance tracker" → UNVERIFIED. Number came from Perplexity research that may have fabricated the count. Actual Reddit evidence shows interest but I cannot confirm the specific post count.


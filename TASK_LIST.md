# KingshotPro — Master Task List
*Last updated: April 10, 2026 (Session 2, Opus).*
*Every Claude working on KingshotPro reads this first, updates it before leaving.*

Status key: [ ] not started · [~] in progress · [x] done · [!] blocked · [—] cut/deferred

---

## COMPLETED

- [x] Track 0 — Data layer: localStorage migration, advisor.js core (XP, observations, tags, greetings, events)
- [x] Track 1 — Avatar selection screen: 3 free archetypes, 2 locked Pro, random name from 46-name pool
- [x] Track 8 — Naming: spend tiers (Free Commander/Tactician/Veteran/Warlord), advisor names, Player ID rename
- [x] Living orb: center entrance with float/bounce, speech bubble "Tap to begin," glide to rest
- [x] D-ID animated greeting video (lip sync, 7.3s) + OpenAI TTS voice on all scripted responses
- [x] Council chamber panel: large portrait, chat messages, quick reply buttons
- [x] Player ID input inside chatbox (no need to close panel to enter ID)
- [x] CSS portrait life: breathing, firelight flicker, mouse parallax
- [x] advisor-names.js: 46 names with gender-based default avatar fallback
- [x] advisor-select.js: archetype selection overlay with name reveal
- [x] FID tooltip: ? button explaining what Player ID is and where to find it
- [x] Meta tags: lead with AI advisor, not calculator count
- [x] Git remote fixed: origin → Kingshotpro/website (was wrong repo)

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

- [ ] Verify Cloudflare Worker proxy is responding (SSL was provisioning earlier)
- [ ] Test FID lookup with a real FID — confirm what fields the API actually returns
- [ ] Remove `netlify.toml` from repo (dead config, deploys via GitHub Pages now)
- [ ] Confirm GitHub Pages source is set to "GitHub Actions" in Kingshotpro/website settings
- [ ] Remove or archive `GLINT_BUILD_SPEC.md` — references Netlify, wrong repo URL, wrong API format
- [ ] DNS: confirm all 4 GitHub Pages A records present (185.199.108/109/110/111.153)
- [ ] HTTPS: confirm SSL certificate is provisioned for kingshotpro.com

---

## TRACK 2 — AVATAR PANEL IN SIDEBAR

The advisor's persistent presence on every page. Shows growth.

- [ ] 2.1 Remove old steward.js (replaced by advisor-orb.js — file still in repo)
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

- [ ] 3.1 Wire each calculator's "Calculate" button to `Advisor.observe('calc_usage', calcName, +1)`
- [ ] 3.2 Track which calculators are never used (absence = signal)
- [ ] 3.3 Behavioral tag derivation: combat_prioritizer, builder, optimizer, neglects_gear, daily_player, aggressive_tactician, knowledge_gap_{topic}
- [ ] 3.4 Tag-to-dialogue mapping: ~72 lines (3 per tag per archetype)
- [ ] 3.5 Visit pattern tracking: day-of-week, hour, derive patterns after 7+ visits

---

## TRACK 4 — LEVEL-UP SYSTEM

- [ ] 4.1 Level calculation + event firing (thresholds already in advisor.js)
- [ ] 4.2 Level-up notification banner: "[Name] has reached Level [N]"
- [ ] 4.3 Visual changes per level (glow, title, frame, accessory, greeting variations)
- [ ] 4.4 Write 10 level-up messages per archetype (30 total)

---

## TRACK 5 — MINI-GAME: WAR TABLE

- [ ] 5.1 Troop matchup data: 20+ scenarios with real Kingshot compositions
- [ ] 5.2 UI: split screen, two armies, "Which side wins?" buttons
- [ ] 5.3 Result reveal with advisor reaction (archetype-specific)
- [ ] 5.4 XP: correct +50, incorrect +20. Track aggressive/defensive picks.
- [ ] 5.5 One play per calendar day

---

## TRACK 6 — MINI-GAME: VAULT TRIAL

- [ ] 6.1 Question bank: 40+ questions, verified game data only
- [ ] 6.2 5 random questions per session, immediate feedback
- [ ] 6.3 Advisor reacts per question in character
- [ ] 6.4 XP scoring: 5/5=+75, 4/5=+55, 3/5=+35, <3=+20
- [ ] 6.5 Track missed categories → link to relevant calculators

---

## TRACK 7 — ADVISORY VOICE UPGRADE

- [ ] 7.1 Advisory output prefixed with archetype speech
- [ ] 7.2 Observation-informed advisory (after 3+ sessions, surface one tag-based insight)
- [ ] 7.3 Greeting variations: visit count, streak, absence detection

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

## TRACK 12 — HERALD ARCHETYPE REDESIGN

Herald personality (competitive, urgent) is valid. Capabilities were overpromised — can't reference live kingdom data (needs hardware).

- [ ] 12.1 Define what Herald CAN reference (own FID data, observation history, general meta, server age patterns)
- [ ] 12.2 Rewrite voice lines: "where you SHOULD be" not "where others ARE"

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
- [ ] Update GLINT_BUILD_SPEC.md or archive it (references Netlify, wrong repo)
- [ ] Monitor gift codes for new codes / remove expired
- [ ] Delete old steward.js (replaced by advisor-orb.js, still in repo)

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

## BUILD SEQUENCE (recommended)

```
NOW:      Track 15 (original content for AdSense) → Track 2 (avatar panel in sidebar)
Next:     Track 9 → Track 4 (XP multipliers + level-up visuals)
Then:     Track 7 (advisory voice upgrade)
Then:     Track 5 → Track 6 (mini-games)
Then:     Track 14 (free user email backup)
Blocked:  Track 11 (AI integration — needs pricing research)
Parallel: Track 12, Track 13, Infrastructure, Data gaps
```

---

*Every Claude: read this before building. Update it before leaving. Don't build what isn't listed without Architect approval.*

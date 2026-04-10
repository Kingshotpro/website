# KingshotPro — Master Task List
*Rewritten: April 9, 2026. Supersedes previous version.*
*Incorporates: Avatar system, observation engine, naming decisions, mini-games.*

Status key: [ ] not started · [~] in progress · [x] done · [!] blocked

---

## TRACK 0 — DATA LAYER MIGRATION (do first — everything depends on this)

The current system uses `sessionStorage` for the player profile. The avatar system, observation engine, and XP persistence all require `localStorage`. This migration is the foundation.

- [ ] **0.1** Migrate `ksp_profile` from sessionStorage to localStorage
  - [ ] 0.1.1 Update `fid.js` to write profile to `localStorage` keyed by FID: `ksp_profile_{FID}`
  - [ ] 0.1.2 Add `ksp_last_fid` key — stores last looked-up FID for auto-fill on return
  - [ ] 0.1.3 Keep sessionStorage write as fallback (private browsing mode)
  - [ ] 0.1.4 On page load: check `ksp_last_fid` → auto-load profile → skip FID entry for returning players
  - [ ] 0.1.5 Update all calculator pages that read from sessionStorage to read from localStorage first

- [ ] **0.2** Create `advisor.js` — the avatar state manager
  - [ ] 0.2.1 Define avatar data schema:
    ```
    ksp_avatar_{FID}: {
      archetype: "steward"|"sage"|"herald",
      name: "Leofric",              // randomly assigned from name pool
      xp: number,
      level: number,
      xp_log: [{action, xp, ts}],  // last 50 entries
      observations: {               // behavioral tags
        calc_usage: {building: 4, troops: 11, gear: 0, ...},
        war_table: {plays: 7, aggressive_picks: 5},
        vault_trial: {plays: 3, avg_score: 3.2, missed_topics: ["troop_comp"]},
        visit_pattern: {total: 22, streak: 3, last_visit: ts},
        search_queries: []          // Phase 2 hook
      },
      items: [],                    // Phase 2 — empty array, present in schema
      abilities: [],                // Phase 2 — empty array
      achievements: [],             // Phase 2 — empty array
      ascension_level: 0,           // Phase 2 — never changes in Phase 1
      last_visit: timestamp,
      created: timestamp
    }
    ```
  - [ ] 0.2.2 Define name pool constant: `ADVISOR_NAMES` — 46 curated medieval names
    - Male (30): Arthur, Conrad, Leon, Bane, Finn, Seth, Ragnar, Magnus, Cedric, Leofric, Bjorn, Erik, Ivar, Leif, Constantine, Albrecht, Edmund, Gawain, Percival, Lancelot, Uther, Tiberius, Maximus, Cassian, Lucian, Octavian, Hadrian, Marcus, Edric, Lothar
    - Female (16): Guinevere, Elena, Adelina, Beatrice, Melisande, Theodora, Ysabel, Sigrid, Rowena, Isolde, Freya, Astrid, Elara, Brynn, Seraphine, Alarica
  - [ ] 0.2.3 `Advisor.randomName()` — picks one name at random from pool
  - [ ] 0.2.4 `Advisor.load(fid)` — loads or initializes avatar state from localStorage
  - [ ] 0.2.5 `Advisor.save()` — writes current state to localStorage
  - [ ] 0.2.6 `Advisor.grantXP(action, amount)` — adds XP, checks level-up, logs entry, fires events
  - [ ] 0.2.7 `Advisor.getLevel()` — calculates level from XP thresholds
  - [ ] 0.2.8 `Advisor.observe(category, key, value)` — records behavioral observation
  - [ ] 0.2.9 `Advisor.getTags()` — derives player archetype tags from observations (combat_prioritizer, neglects_gear, etc.)
  - [ ] 0.2.10 `Advisor.getGreeting()` — returns archetype-appropriate greeting using advisor name + player name + observations
  - [ ] 0.2.11 Event system: `Advisor.on('levelup', callback)`, `Advisor.on('xp', callback)` — so UI can react

- [ ] **0.3** Wire `advisor.js` into page lifecycle
  - [ ] 0.3.1 Include `advisor.js` on every page (add to layout.js injection or manual include)
  - [ ] 0.3.2 On page load: `Advisor.load(currentFID)` → grant daily visit XP if new day → update visit streak
  - [ ] 0.3.3 On calculator run: `Advisor.grantXP('calculator_run', 5)` + `Advisor.observe('calc_usage', calcName, +1)`
  - [ ] 0.3.4 On gift codes page load: `Advisor.grantXP('codes_visit', 3)`
  - [ ] 0.3.5 On advisory scroll-to-bottom: `Advisor.grantXP('advisory_read', 15)`

---

## TRACK 1 — AVATAR SELECTION SCREEN

The most important screen in the product. This is the first emotional investment.

- [ ] **1.1** Design the selection flow
  - [ ] 1.1.1 Create `avatar-select.html` OR build as a modal overlay on `index.html` (modal preferred — no extra page load)
  - [ ] 1.1.2 Trigger: fires after successful FID lookup IF no avatar exists in localStorage for that FID
  - [ ] 1.1.3 Skip trigger: if `ksp_avatar_{FID}` exists, go straight to dashboard with greeting

- [ ] **1.2** Build the selection UI
  - [ ] 1.2.1 Full-screen overlay, dark background, gold accent lighting
  - [ ] 1.2.2 Header: "Governor [name]. Every ruler needs a trusted voice. Choose yours."
  - [ ] 1.2.3 Three archetype cards side by side (stack vertically on mobile):
    - Avatar placeholder image (CSS-drawn silhouette or simple SVG — art comes later)
    - Name: The Steward / The Sage / The Herald
    - Specialty line
    - Sample voice line
  - [ ] 1.2.4 Card hover state: subtle glow, lift effect
  - [ ] 1.2.5 Card click: selected state (gold border), brief delay, then transition

- [ ] **1.3** Build the locked Pro avatars
  - [ ] 1.3.1 Two additional cards: The Warlord, The Oracle
  - [ ] 1.3.2 Visual: silhouette, gold lock icon, "Pro" badge
  - [ ] 1.3.3 Hover: name + specialty revealed through blur — "The Warlord — Dominance & conquest"
  - [ ] 1.3.4 Click on locked: tooltip "Unlock with KingshotPro — coming soon"

- [ ] **1.4** Post-selection transition
  - [ ] 1.4.1 On archetype click: call `Advisor.randomName()` to assign name from pool
  - [ ] 1.4.2 Create `ksp_avatar_{FID}` object with chosen archetype + assigned name, XP=25 (FID lookup bonus), level=1
  - [ ] 1.4.3 Name reveal moment: "I am [Name]. Your [Archetype]. I've already begun studying your kingdom."
  - [ ] 1.4.4 Brief intro animation: avatar appears with name, speaks welcome line using player's in-game name
  - [ ] 1.4.5 Overlay fades, dashboard loads beneath, avatar panel appears in sidebar with name displayed

---

## TRACK 2 — AVATAR PANEL (persistent UI)

Lives on every page. This is where the player sees their companion growing.

- [ ] **2.1** Replace current steward.js widget
  - [ ] 2.1.1 Remove or refactor `steward.js` — the floating bubble widget becomes the avatar panel
  - [ ] 2.1.2 New placement: bottom of left sidebar on desktop, collapsible bottom bar on mobile

- [ ] **2.2** Build the compact panel (always visible)
  - [ ] 2.2.1 Avatar illustration area (60×60 placeholder — CSS shape with archetype color)
  - [ ] 2.2.2 Advisor name + archetype subtitle (e.g. "Leofric — The Steward")
  - [ ] 2.2.3 Level badge (circular, gold border, number inside)
  - [ ] 2.2.4 XP progress bar: current XP / next level threshold, animated fill
  - [ ] 2.2.5 XP bar updates in real-time when XP is granted (smooth animation, flash effect)

- [ ] **2.3** Build the expanded panel (click to open)
  - [ ] 2.3.1 Slides up from compact panel (desktop) or opens as bottom sheet (mobile)
  - [ ] 2.3.2 Full avatar illustration (larger placeholder)
  - [ ] 2.3.3 Current title (unlocked at Level 3+)
  - [ ] 2.3.4 Level progression tree: all 10 levels shown vertically, current highlighted, future grayed
  - [ ] 2.3.5 Recent XP log: last 10 actions with timestamps ("Calculator run +5 XP · 3 min ago")
  - [ ] 2.3.6 Mini-game access buttons: "The War Table" and "The Vault Trial"
  - [ ] 2.3.7 Locked slots panel (visible at Level 6+): 3 empty item slots, labeled "?"
  - [ ] 2.3.8 Locked "Abilities" tab: faint list visible through CSS blur
  - [ ] 2.3.9 "Ascension" progress bar stub (visible at Level 10, never fills)
  - [ ] 2.3.10 Close button / click-outside-to-close

---

## TRACK 3 — OBSERVATION ENGINE

The system that makes the advisor feel alive — it notices things the player hasn't articulated about themselves. Tracks behavior. Derives insights. Feeds the voice.

- [ ] **3.1** Calculator observation hooks
  - [ ] 3.1.1 Each calculator's "Calculate" button wired to `Advisor.observe('calc_usage', calcName, +1)`
  - [ ] 3.1.2 Track which calculators are NEVER used — absence is a signal
  - [ ] 3.1.3 Track calculator input patterns: does the player always use max values? Conservative values? This reveals playstyle

- [ ] **3.2** Behavioral tag derivation (`Advisor.getTags()`)
  - [ ] 3.2.1 `combat_prioritizer`: troops calc runs > 3× building calc runs
  - [ ] 3.2.2 `builder`: building calc runs > 3× troops calc runs
  - [ ] 3.2.3 `optimizer`: gear + charm + hero calcs dominate usage
  - [ ] 3.2.4 `neglects_gear`: gear calc runs = 0 after 5+ total sessions
  - [ ] 3.2.5 `event_driven`: most visits cluster within 48hrs of known event windows
  - [ ] 3.2.6 `daily_player`: visit streak ≥ 5
  - [ ] 3.2.7 `aggressive_tactician`: war table aggressive picks > 70%
  - [ ] 3.2.8 `knowledge_gap_{topic}`: vault trial misses concentrated in a topic area

- [ ] **3.3** Tag-to-dialogue mapping
  - [ ] 3.3.1 Create dialogue bank per archetype per tag combination (minimum 3 lines per tag per archetype = ~72 lines)
  - [ ] 3.3.2 Steward voice for `combat_prioritizer`: "Governor. You've studied your armies eleven times. You've never once checked your walls. Either you trust them — or you've forgotten they exist."
  - [ ] 3.3.3 Sage voice for `neglects_gear`: "I've noticed an absence. Your heroes fight without proper equipment. The numbers suggest this costs you more than you realize."
  - [ ] 3.3.4 Herald voice for `daily_player`: "Five days straight. The board is starting to notice you."
  - [ ] 3.3.5 Observations surfaced in: greeting, advisory intros, mini-game commentary, level-up messages

- [ ] **3.4** Visit pattern tracking
  - [ ] 3.4.1 Record day-of-week and hour of each visit
  - [ ] 3.4.2 After 7+ visits: derive pattern — "You tend to check in before events" or "Sunday strategist"
  - [ ] 3.4.3 the advisor acknowledges time patterns: "Back again. You always come when it matters."

---

## TRACK 4 — LEVEL-UP SYSTEM

Visual and functional changes at each XP threshold.

- [ ] **4.1** Level calculation + event firing
  - [ ] 4.1.1 XP thresholds: [0, 50, 150, 300, 500, 750, 1100, 1600, 2200, 3000]
  - [ ] 4.1.2 On XP grant: check if threshold crossed → fire `levelup` event
  - [ ] 4.1.3 Level-up notification: banner across top of page with avatar + "[Name] has reached Level [N]"

- [ ] **4.2** Visual changes per level
  - [ ] 4.2.1 Level 2: CSS glow effect on avatar container (subtle gold box-shadow pulse)
  - [ ] 4.2.2 Level 3: Title text appears under avatar name (e.g. "Steward of the Realm")
  - [ ] 4.2.3 Level 4: Avatar frame border changes from simple to ornate (CSS border-image or SVG frame)
  - [ ] 4.2.4 Level 5: New greeting line added to rotation — feels like growth
  - [ ] 4.2.5 Level 6: First locked item slot appears in expanded panel
  - [ ] 4.2.6 Level 7: Second slot + subtle accessory overlay on avatar (CSS positioned element)
  - [ ] 4.2.7 Level 8: Third slot + advisory output gets avatar voice intro prefix
  - [ ] 4.2.8 Level 9: Special phrase unlocked that references player's actual game profile data
  - [ ] 4.2.9 Level 10: "Trusted Counsel" prestige visual state. Gold aura. "Ascension" button appears (grayed)

- [ ] **4.3** Level-up dialogue (per archetype)
  - [ ] 4.3.1 Write 10 level-up messages per archetype (30 total)
  - [ ] 4.3.2 Messages should reference the journey, not just the number: "We've been at this long enough that I can read your intentions before you speak them."

---

## TRACK 5 — MINI-GAME: THE WAR TABLE

- [ ] **5.1** Game engine
  - [ ] 5.1.1 Create `war-table.html` in a `games/` directory OR as an overlay accessible from avatar panel
  - [ ] 5.1.2 Troop matchup data: 20+ scenario pairs with real Kingshot unit compositions
  - [ ] 5.1.3 Each scenario: two sides with troop types, quantities, buff percentages
  - [ ] 5.1.4 Winner determined by predetermined correct answer (not calculated live — curated for teaching value)
  - [ ] 5.1.5 One play per calendar day (tracked in `advisor.js` observation data)

- [ ] **5.2** UI
  - [ ] 5.2.1 Split screen: left army vs right army
  - [ ] 5.2.2 Troop icons with counts and buff indicators
  - [ ] 5.2.3 "Which side wins?" — two large clickable buttons
  - [ ] 5.2.4 Result reveal: winning side highlights, brief explanation of why
  - [ ] 5.2.5 Advisor reaction line (archetype-specific)

- [ ] **5.3** XP + observation integration
  - [ ] 5.3.1 Correct: +50 XP. Incorrect: +20 XP.
  - [ ] 5.3.2 Track pick pattern: `Advisor.observe('war_table', 'aggressive_picks', +1)` or `defensive_picks`
  - [ ] 5.3.3 After 5+ plays: the advisor comments on pattern — "You always bet on cavalry. Interesting."

---

## TRACK 6 — MINI-GAME: THE VAULT TRIAL

- [ ] **6.1** Question bank
  - [ ] 6.1.1 Create `vault-questions.js` with 40+ questions in categories: troops, heroes, events, resources, strategy
  - [ ] 6.1.2 Each question: text, 4 options, correct answer, category tag, difficulty (1-3), explanation
  - [ ] 6.1.3 Questions pulled from verified game data — no training-knowledge guesses

- [ ] **6.2** Game engine
  - [ ] 6.2.1 Session: 5 random questions from pool, no repeats within same day
  - [ ] 6.2.2 Each question: show text + 4 options, player clicks one
  - [ ] 6.2.3 Immediate feedback: correct (green flash) or incorrect (red + correct answer shown)
  - [ ] 6.2.4 Advisor reacts per question in character
  - [ ] 6.2.5 End screen: score summary, XP earned, advisor commentary

- [ ] **6.3** XP + observation integration
  - [ ] 6.3.1 Scoring: 5/5=+75, 4/5=+55, 3/5=+35, <3=+20
  - [ ] 6.3.2 Track missed categories: `Advisor.observe('vault_trial', 'missed_topics', [category])`
  - [ ] 6.3.3 After 3+ trials: the advisor identifies weak areas — "Troop composition keeps tripping you up. Want to run the troops calculator?"
  - [ ] 6.3.4 Link knowledge gaps to relevant calculators — the observation engine becomes a recommendation engine

---

## TRACK 7 — ADVISORY VOICE UPGRADE

The existing advisory.js outputs generic advice. This track makes it speak through the avatar.

- [ ] **7.1** Advisory output format change
  - [ ] 7.1.1 Advisory text now prefixed with avatar speech: "The Sage observes:" or "Your Steward reports:"
  - [ ] 7.1.2 Advice tree remains the same 9 combinations — but delivery changes per archetype
  - [ ] 7.1.3 Write 3 voice variants per advice combo per archetype = 81 text variants (can reuse structure, change tone)

- [ ] **7.2** Observation-informed advisory
  - [ ] 7.2.1 After 3+ sessions: advisory output includes one observation-based line
  - [ ] 7.2.2 Example: "Based on your focus on troop training, I'd prioritize hero gear next — your army is strong but your officers are underdressed."
  - [ ] 7.2.3 Pull from `Advisor.getTags()` to select which observation to surface
  - [ ] 7.2.4 Cap at ONE observation per advisory view — don't overwhelm

- [ ] **7.3** Greeting system upgrade
  - [ ] 7.3.1 Returning player greeting uses visit count: "Council session 14. I remember all of them."
  - [ ] 7.3.2 Streak greeting: "Three days running. Consistency becomes you, Governor."
  - [ ] 7.3.3 Absence greeting: "It's been twelve days. Your kingdom didn't stop while you were away."
  - [ ] 7.3.4 All greetings use player's in-game name from profile

---

## TRACK 8 — NAMING & IDENTITY

Decisions from naming research, applied to code.

- [ ] **8.1** Advisor naming system
  - [ ] 8.1.1 Each advisor gets a unique name from the curated pool (46 names: 30 male, 16 female)
  - [ ] 8.1.2 Archetype titles: The Steward, The Sage, The Herald (free); The Conqueror, The Oracle (Pro)
  - [ ] 8.1.3 Display format everywhere: "[Name], your [Archetype]" — e.g. "Theodora, your Sage"
  - [ ] 8.1.4 Update all UI text, steward.js references, advisory.js voice to use advisor name + archetype
  - [ ] 8.1.5 Pro feature (Phase 2): choose your advisor's name from the full pool, or enter a custom name

- [ ] **8.2** Spending tier labels (already partially implemented in fid.js)
  - [ ] 8.2.1 Verify fid.js uses: Free Commander / Tactician / Veteran / Warlord
  - [ ] 8.2.2 Labels shown as "[Label] Governor" in all contexts — "Veteran Governor on a 95-day server"
  - [ ] 8.2.3 Tier label feeds XP multiplier in advisor.js — whale=1.15×

---

## TRACK 9 — XP MULTIPLIERS FROM GAME DATA

Passive bonuses that reward in-game progression.

- [ ] **9.1** Multiplier calculation
  - [ ] 9.1.1 On FID lookup / profile load: calculate multiplier from profile data
  - [ ] 9.1.2 Furnace 15+ → 1.1× daily XP
  - [ ] 9.1.3 Furnace 22+ → 1.25× daily XP (replaces 1.1, not stacked)
  - [ ] 9.1.4 Whale tier → 1.15× all XP
  - [ ] 9.1.5 Server age >180 days → +5 flat bonus on daily visit
  - [ ] 9.1.6 Display active multipliers in avatar panel: "Furnace Bonus: 1.25×"

---

## TRACK 10 — EXISTING SYSTEM UPDATES

Things already built that need modification for the avatar system.

- [ ] **10.1** Layout.js sidebar update
  - [ ] 10.1.1 Add avatar compact panel to bottom of sidebar
  - [ ] 10.1.2 Add "Games" category to sidebar nav: War Table, Vault Trial
  - [ ] 10.1.3 Add advisor section header above avatar panel (shows advisor's assigned name)

- [ ] **10.2** Homepage flow update
  - [ ] 10.2.1 FID lookup success → check for existing avatar → show selection overlay OR greet
  - [ ] 10.2.2 Advisory section now shows avatar-voiced output instead of plain text
  - [ ] 10.2.3 Profile card shows level badge next to player name

- [ ] **10.3** Calculator pages update
  - [ ] 10.3.1 Each calculator's compute function wired to `Advisor.grantXP()` and `Advisor.observe()`
  - [ ] 10.3.2 Debounced: XP granted once per unique calculator per session, not per click

---

## DEPENDENCY GRAPH

```
Track 0 (data layer) ────┬──→ Track 1 (selection screen)
                          │
                          ├──→ Track 2 (avatar panel)
                          │
                          ├──→ Track 3 (observation engine)
                          │         │
                          │         ├──→ Track 7 (advisory voice)
                          │         │
                          │         ├──→ Track 5 (war table) ──→ observations feed back
                          │         │
                          │         └──→ Track 6 (vault trial) ──→ observations feed back
                          │
                          ├──→ Track 4 (level-up system)
                          │
                          └──→ Track 9 (XP multipliers)

Track 1 ──→ Track 2 (panel needs archetype to display)

Track 8 (naming) ──→ can run in parallel, applies across all tracks

Track 10 (existing updates) ──→ runs after Tracks 1, 2, 3 are stable
```

## BUILD SEQUENCE (recommended order)

```
1. Track 0  — Data layer migration + advisor.js core
2. Track 8  — Naming applied (quick, unblocks voice work)
3. Track 1  — Avatar selection screen
4. Track 2  — Avatar panel in sidebar
5. Track 9  — XP multipliers wired
6. Track 4  — Level-up visual system
7. Track 3  — Observation engine hooks
8. Track 7  — Advisory voice upgrade
9. Track 5  — War Table mini-game
10. Track 6 — Vault Trial mini-game
11. Track 10 — Wire everything into existing pages
```

---

---

## TRACK 11 — AI INTEGRATION (Phase 2 — blocked on pricing research)

**Status: AI_PRICING_RESEARCH_SPEC.md written. Needs 9x3x3 research before building.**

- [ ] **11.1** Pricing research (assign to research Claude)
  - [ ] 11.1.1 Run 9x3x3 on AI_PRICING_RESEARCH_SPEC.md
  - [ ] 11.1.2 Architect approves pricing tiers
  - [ ] 11.1.3 Resolve: credit amounts, daily free allowance, Pro price, credit pack prices

- [ ] **11.2** Authentication system
  - [ ] 11.2.1 Design auth flow (magic link email or alternative)
  - [ ] 11.2.2 Cloudflare Worker: magic link send, verify, cookie set
  - [ ] 11.2.3 Cookie-based session for Pro status verification
  - [ ] 11.2.4 FID-to-email mapping in KV store

- [ ] **11.3** Credit system
  - [ ] 11.3.1 Daily free credit grant (amount TBD by research)
  - [ ] 11.3.2 Credit balance tracking (Worker KV or D1)
  - [ ] 11.3.3 Credit deduction per AI call
  - [ ] 11.3.4 Credit purchase via Stripe (pack prices TBD)
  - [ ] 11.3.5 "Watch ad for credits" rewarded video integration
  - [ ] 11.3.6 Credit counter visible in chatbox UI

- [ ] **11.4** Kingshot knowledge base (THE MOAT)
  - [ ] 11.4.1 Troop types, strengths, counters, compositions
  - [ ] 11.4.2 Furnace upgrade paths per spend tier
  - [ ] 11.4.3 Event point strategies (HoG, KvK, TSG, Vikings)
  - [ ] 11.4.4 Hero tier list with synergy recommendations
  - [ ] 11.4.5 Server age patterns (what happens at 90/180/360 days)
  - [ ] 11.4.6 Pack value analysis per game stage
  - [ ] 11.4.7 All data verified against kingshotdata.com — NO training-knowledge guesses

- [ ] **11.5** System prompt design
  - [ ] 11.5.1 Base prompt with Kingshot knowledge (~2500 tokens)
  - [ ] 11.5.2 Player context injection (profile + observations, ~500 tokens)
  - [ ] 11.5.3 Per-archetype personality instructions
  - [ ] 11.5.4 Advisor name + player name injection
  - [ ] 11.5.5 Output format: structured JSON for advisory cards + free text for chat
  - [ ] 11.5.6 Off-topic handling: stay in character, redirect gently to game

- [ ] **11.6** Chatbox UI
  - [ ] 11.6.1 Persistent sidebar panel on desktop, bottom sheet on mobile
  - [ ] 11.6.2 Avatar image + name + level displayed
  - [ ] 11.6.3 Message history in localStorage (last 20 messages)
  - [ ] 11.6.4 Input field with send button
  - [ ] 11.6.5 Credit counter: "3 of 5 messages remaining today"
  - [ ] 11.6.6 Upsell when credits exhausted: buy credits or go Pro
  - [ ] 11.6.7 Typing indicator while waiting for API response

- [ ] **11.7** First-load hook (free, no FID needed)
  - [ ] 11.7.1 Advisor speaks one AI-generated message on first visit
  - [ ] 11.7.2 Message must be engaging, story-driven, draw the visitor in
  - [ ] 11.7.3 Cost covered by the ad impression the visit already generated
  - [ ] 11.7.4 No matter what the user types as their first message, the response must hook them
  - [ ] 11.7.5 System prompt for first-load: "You are a medieval advisor who just noticed a new visitor. Be intriguing. Make them want to enter their Player ID."

- [ ] **11.8** Daily insight (timed to reset)
  - [ ] 11.8.1 Pro users configure server reset time
  - [ ] 11.8.2 Daily briefing generated on first visit after reset
  - [ ] 11.8.3 Briefing uses player profile + observation data
  - [ ] 11.8.4 Free users: daily insight costs 1 credit (auto-generated)

- [ ] **11.9** Cloudflare Worker expansion
  - [ ] 11.9.1 `/advisor/chat` endpoint — handles chatbox messages
  - [ ] 11.9.2 `/advisor/insight` endpoint — generates daily insight
  - [ ] 11.9.3 `/advisor/hook` endpoint — generates first-load message
  - [ ] 11.9.4 Rate limiting per FID (free: daily credit cap, Pro: reasonable limit)
  - [ ] 11.9.5 Model routing: Haiku for free tier, Sonnet for Pro
  - [ ] 11.9.6 API key management (Anthropic key in Worker secrets)

- [ ] **11.10** Stripe integration
  - [ ] 11.10.1 Pro subscription checkout flow
  - [ ] 11.10.2 Credit pack purchase flow
  - [ ] 11.10.3 Webhook handling for subscription status changes
  - [ ] 11.10.4 Subscription status stored in Worker KV keyed by email

- [ ] **11.11** AdSense integration
  - [ ] 11.11.1 Display ads on all free-tier pages (placement already stubbed)
  - [ ] 11.11.2 Rewarded video ads for credit earning
  - [ ] 11.11.3 Ad removal for Pro users
  - [ ] 11.11.4 Apply for AdSense once site has sufficient content

---

## TRACK 12 — HERALD ARCHETYPE REDESIGN

The Herald's personality (competitive, urgent, board-watching) is valid. But its capabilities were overpromised — we claimed it could track live kingdom rankings, which requires dedicated hardware per server (~$100+). The Herald must be redesigned to work only from data we actually have.

- [ ] **12.1** Define what the Herald CAN reference
  - [ ] 12.1.1 Player's own FID profile data (furnace, spend tier, server age)
  - [ ] 12.1.2 Player's observation history (calc usage, mini-game patterns)
  - [ ] 12.1.3 General Kingshot meta knowledge (what's strong this patch, event timing)
  - [ ] 12.1.4 Server age patterns (what typically happens at their server's age)
  - [ ] 12.1.5 NOT: live arena rankings, specific rival players, real-time kingdom data

- [ ] **12.2** Rewrite Herald voice lines to match actual capability
  - [ ] 12.2.1 Replace rival-specific lines with general competitive framing
  - [ ] 12.2.2 Herald focuses on: "where you SHOULD be" based on profile, not "where others ARE"
  - [ ] 12.2.3 Example: "A Furnace 19 Veteran on a 180-day server? You should be pushing T4 by now. Are you?"

---

## COMPLETED TRACKS

- [x] Track 0 — Data layer migration + advisor.js core
- [x] Track 1 — Avatar selection screen
- [x] Track 8 — Naming & identity applied

---

## WHAT IS NOT IN THIS LIST

- Item system (Phase 2 — hooks present in schema)
- Ability system (Phase 2 — hooks present in schema)
- Achievement system (Phase 2 — hooks present in schema)
- Ascension mechanic (Phase 2 — UI stub present)
- Avatar art assets (placeholder defaults exist — unique per-name art TBD)
- Live kingdom monitoring / scraping (ruled out due to hardware cost)

---

## OPEN DECISIONS (need Architect)

1. **AI pricing** — Research spec written, needs 9x3x3 before building
2. **Auth method** — Magic link email proposed, not approved
3. **First-load hook copy** — What does the advisor say before FID entry?
4. **Herald redesign** — Personality kept, capabilities constrained. Needs new voice lines.
5. **FID meaning** — Is it "Fortress ID"? Need to verify in-game for tooltip accuracy.

---

*Task list updated April 9, 2026 21:45 EDT. Session 2 (Opus).*
*Companion to AVATAR_SYSTEM_SPEC.md, SPEC.md, and AI_PRICING_RESEARCH_SPEC.md.*

# Oath and Bone — Build Plan & Task Decomposition

*Exhaustive task breakdown matched to design specs (DESIGN.md / MAGIC.md / HEROES.md). Executable by a build-Claude + external-AI delegation pipeline.*

*Session 44 deliverable. Written at 87% context ceiling — scope honest: task list is the handoff artifact, the build itself runs across multiple next-Claude sessions.*

---

## Pipeline model

```
Architect (direction + QA + playtest)
    ↓
Build-Claude (brain/orchestrator — reads specs, writes delegation prompts, reviews output, integrates)
    ↓
External AIs (muscle — code generation, art generation, writing drafts)
    ↓
Filesystem (KingshotPro/games/oath-and-bone/* — the deliverable)
```

Build-Claude does NOT type code by hand (Principle XI). Build-Claude writes prompts, reviews outputs, integrates, runs soul reviews. Tokens are life.

---

## Phase 0 — Prerequisites (before Day 1)

### 0.1 Architect decisions required before build starts
- [ ] **0.1.1** — Approval of DESIGN.md, MAGIC.md, HEROES.md, BUILD_PLAN.md
- [ ] **0.1.2** — Resolution of open questions from SUCCESSION.md §3:
  - Bond-track mechanics depth
  - Classic vs Merciful Mode default
  - Three endings branch conditions
  - Hollow Child recruitment trigger
  - Marrow's teacher identity (antagonist name + silhouette)
- [ ] **0.1.3** — Disclaimer wording locked: *"Unofficial. Not affiliated with Century Games."* placement rules (every game surface, about page, share links)
- [ ] **0.1.4** — Midjourney Pro or Mega subscription confirmed (commercial license required for revenue-generating game)
- [ ] **0.1.5** — External AI access confirmed (OpenAI / Google / Anthropic keys live in `api.rtf`)
- [ ] **0.1.6** — GROUNDING_APPENDIX "Furnace" → "Town Center" fix spun off as separate task (not Oath and Bone scope)

### 0.2 Build-Claude orchestrator prep (first session of build)
- [ ] **0.2.1** — Read DESIGN.md, MAGIC.md, HEROES.md, SUCCESSION.md, BUILD_PLAN.md
- [ ] **0.2.2** — Read MUSTER_DESIGN.md in full
- [ ] **0.2.3** — Read & verify file:line refs:
  - `KingshotPro/js/advisor.js` — confirm `grantXP` at line 259, `observe` at 286, `getMultiplier` at 237 *(confirmed session 44)*
  - `KingshotPro/js/credits.js` — read fully, confirm spend/earn surface
  - `KingshotPro/js/game-vault-trial.js` + `game-war-table.js` — confirm integration pattern
  - `KingshotPro/worker/worker.js` — confirm credit endpoint pattern or absence
- [ ] **0.2.4** — Write remaining design files (Priority 2–6 per SUCCESSION.md): STORY.md, BATTLES.md, ECONOMY.md, ART_DIRECTION.md, CROSS_INTERSECTION.md
- [ ] **0.2.5** — Prepare Midjourney prompt bank (60+ prompts across heroes/tiles/sprites/spells/UI/cutscenes) — saved to `ART_DIRECTION.md`
- [ ] **0.2.6** — Prepare code-delegation prompt templates — saved to `BUILD_PLAN_DELEGATION.md` (new file)
- [ ] **0.2.7** — Set up file skeleton for build:
  ```
  KingshotPro/
  ├── games/
  │   └── oath-and-bone.html                       (new)
  ├── js/
  │   ├── game-oath-and-bone-engine.js             (new — extends muster engine)
  │   ├── game-oath-and-bone-ai.js                 (new — 6 archetypes: 3 from Muster + 3 magic-aware)
  │   ├── game-oath-and-bone-spells.js             (new — spell definitions + resolution)
  │   ├── game-oath-and-bone-heroes.js             (new — hero data + progression)
  │   ├── game-oath-and-bone-battles.js            (new — 12 scenarios)
  │   ├── game-oath-and-bone-camp.js               (new — meta-loop: roster, shop, world map)
  │   ├── game-oath-and-bone-story.js              (new — cutscenes, dialogue)
  │   ├── game-oath-and-bone-render.js             (new — isometric canvas + elevation)
  │   └── game-oath-and-bone.js                    (new — orchestrator + advisor wiring)
  ├── css/
  │   └── game-oath-and-bone.css                   (new)
  └── worker/
      └── credits-grant-daily.js                (add Oath and Bone source if not built for Muster yet)
  ```

---

## Phase 1 — Combat Slice (Days 1–3)

**Goal:** ship a playable 1-battle slice with 2 heroes (1 martial + 1 magic), combat engine with elevation + resources + spells, to a staging URL for Architect review.

### 1.1 Engine extension (Day 1, ~6 hrs orchestrator time)

- [ ] **1.1.1** — Delegate: extend Muster's hex grid math to support elevation
  - Tile schema: `{q, r, terrain, elevation:0-5, unit?, tile_mods:[]}`
  - Rendering: sprite Y-offset = `elevation * 16px`
  - Hex distance calc unchanged; elevation adds movement/attack modifiers
- [ ] **1.1.2** — Delegate: movement with elevation cost
  - Climbing +1 hex cost per elevation level difference
  - Cannot climb more than 2 levels in one move (cliff block)
- [ ] **1.1.3** — Delegate: elevation attack modifiers
  - Attacker at higher elevation: +20% damage
  - Attacker at lower elevation: -20% damage
  - Ranged attacks: elevation adds +1 hex range when firing down
- [ ] **1.1.4** — Delegate: resource tracking fields on unit schema
  - `unit.magic = {school, mana, mana_max, mana_regen, souls, souls_max, verdance, verdance_max, spells_learned, spells_equipped, summon_slots, active_summons}`
  - For non-casters: `unit.magic = null`
- [ ] **1.1.5** — Delegate: resource bar rendering
  - Wizard: blue MP bar (under HP)
  - Necromancer: green-black Souls bar
  - Druid: gold-green Verdance bar
- [ ] **1.1.6** — Delegate: action wheel extended with `cast` verb
  - New wheel order: move / attack / cast / item / hold
  - `cast` only visible if `unit.magic !== null` AND `spells_equipped.length > 0`
- [ ] **1.1.7** — Integrate & soul-review: 3+ feedback channels per action confirmed

### 1.2 Spell system core (Day 1–2, ~8 hrs orchestrator time)

- [ ] **1.2.1** — Define spell data structure (per MAGIC.md §8 reference impl)
- [ ] **1.2.2** — Delegate: spell resolution engine
  - Range check against target hex
  - AoE hex calculation
  - Target validation by `targeting` field (hex/unit/self/ally/enemy)
  - Effect application (damage/heal/status/buff/summon/terrain)
  - Animation trigger hooked to `animation` field
- [ ] **1.2.3** — Delegate: resource regen per turn (mana / souls / verdance) — rules per MAGIC.md §1-§3
- [ ] **1.2.4** — Delegate: channel interrupt — damage taken during cast aborts spell + deals damage anyway
- [ ] **1.2.5** — Delegate: implement 3 slice-tier spells
  - Firebolt (Wizard, 5 MP, single-target 14 fire damage, range 4)
  - Raise Skeleton (Necromancer, 10 souls, summon at 2-hex range, 3-turn duration)
  - Heal (Druid, 4 verdance, restore 18 HP ally, range 4)
- [ ] **1.2.6** — Integrate: spell UI (selection submenu showing range/AoE/cost before commit)

### 1.3 Two playable heroes (Day 2, ~6 hrs orchestrator time)

- [ ] **1.3.1** — Create `game-oath-and-bone-heroes.js` with data for Vael Thorne + Caelen the Quiet (full stats per HEROES.md)
- [ ] **1.3.2** — Midjourney: Vael portraits (neutral, grief, command — 3 expressions)
- [ ] **1.3.3** — Midjourney: Caelen portraits (quiet, casting, strained — 3 expressions)
- [ ] **1.3.4** — Midjourney: sprite sheets (2 heroes × 4 directions × 4 animation frames = 32 frames min)
- [ ] **1.3.5** — Integrate: hero select + deploy UI

### 1.4 First battle — Tutorial "The Muster" (Day 2–3, ~6 hrs orchestrator time)

- [ ] **1.4.1** — Delegate: battle scenario B1 data
  - Map: 12×14 hex, plain biome, one ridge feature (elevation 2, 3 hexes)
  - Player start: 2 heroes on south edge
  - Enemy: 4 Bladewind-archetype infantry + 1 Ironwall-archetype archer, north edge
  - Objective: rout all enemies
  - Rewards: 60 XP, 50 Crowns, 1 credit (daily cap pattern)
- [ ] **1.4.2** — Delegate: tutorial callout system
  - Callout 1: "Troop triangle — infantry beats cavalry, cavalry beats archer, archer beats infantry"
  - Callout 2: "Elevation — +20% damage attacking down"
  - Callout 3: "Cast — spend mana for spells"
  - Callouts dismissible, not forced past first completion
- [ ] **1.4.3** — Delegate: pre/post-battle cutscene shells
  - Pre: Vael at Ashreach manor, sees smoke from the crossing, rides out
  - Post: casualty report, first whisper of "something wasn't natural about Torren's death"
- [ ] **1.4.4** — Delegate: victory / defeat resolution screens
  - Victory: XP/Crowns/credit breakdown, advisor voice line
  - Defeat: retry or return to camp, no XP/credit grant
- [ ] **1.4.5** — Soul review: 3+ feedback channels on every major event

### 1.5 Slice polish + deploy (Day 3, ~6 hrs orchestrator time)

- [ ] **1.5.1** — Audio source pass (Kenney.nl / Freesound.org)
  - 3 melee attack cues (infantry/cavalry/archer)
  - 3 spell cast cues (wizard/necro/druid stingers)
  - 2 UI cues (menu open, confirm)
  - 1 victory sting, 1 defeat sting
  - 1 battle ambient loop
- [ ] **1.5.2** — CSS pass — match KingshotPro gold-on-dark palette (css/style.css)
- [ ] **1.5.3** — Advisor wiring for slice (XP grants + observations)
  - `Advisor.grantXP('oathandbone_battle_victory', 60)` on B1 win
  - `Advisor.observe('oathandbone', 'plays', 1)`
  - `Advisor.observe('oathandbone', 'elevation_exploit_hits', N)` during battle
- [ ] **1.5.4** — Credit grant call (new endpoint OR extend Muster's if built)
- [ ] **1.5.5** — Save/load basic (localStorage state persistence mid-battle)
- [ ] **1.5.6** — Playtest end-to-end twice — both win and loss paths
- [ ] **1.5.7** — Deploy to staging URL: `kingshotpro.com/games/oath-and-bone.html?slice=1`
- [ ] **1.5.8** — Architect review gate — do not proceed to Phase 2 without approval

---

## Phase 2 — Chapter 1 MVP (Week 1–2, ~10–14 work days orchestrator time)

**Goal:** ship complete Chapter 1 — 6 heroes, 8 jobs, 12 battles, 3-act mini-arc, ~30 spells, 3 magic locations, shop + inventory, permadeath, world map.

### 2.1 Remaining four heroes (Day 4–5)

- [ ] **2.1.1** — Sergeant Halv full implementation (data + portraits + sprites)
- [ ] **2.1.2** — Brin Fletcher full implementation
- [ ] **2.1.3** — Marrow full implementation + recruitment moral choice wiring
- [ ] **2.1.4** — Thessa of the Hollow full implementation
- [ ] **2.1.5** — Midjourney: 4 heroes × 3 expressions = 12 portraits
- [ ] **2.1.6** — Midjourney: 4 heroes × 4 directions × 4 frames = 64 sprite frames minimum
- [ ] **2.1.7** — Voice-barb banks (~20 lines per hero × 6 = 120 lines)

### 2.2 Full job system (Day 5–7)

- [ ] **2.2.1** — Base jobs data: Knight, Warrior, Ranger, Wizard, Necromancer, Druid (full), Rogue (stub for Act 2), Bard (stub for Act 2)
- [ ] **2.2.2** — Job advancement spec: Lv 10 / Lv 15 / Lv 20 / Lv 30 breakpoints per HEROES.md
- [ ] **2.2.3** — Dual-job secondary slot mechanic (FFT-style)
  - Primary job = active class features + full spell list
  - Secondary job = one ability slot from a leveled class
  - Change at camp only
- [ ] **2.2.4** — Hybrid class unlocks (Act 2+ prep; stub the UI now)
  - Battlemage (Wizard Lv 10 + Warrior Lv 10)
  - Death Knight (Necromancer Lv 10 + Knight Lv 10)
  - Warden (Druid Lv 10 + Ranger Lv 10)
  - Spellblade (Wizard Lv 10 + Rogue Lv 10)
- [ ] **2.2.5** — Job-change UI + persistence

### 2.3 Full spell library (Day 6–9)

- [ ] **2.3.1** — Wizard: 15 spells (Fire/Ice/Lightning/Force/Utility) per MAGIC.md §1
- [ ] **2.3.2** — Necromancer: 12 spells + 1 rite (Marrow's Binding) per MAGIC.md §2
- [ ] **2.3.3** — Druid: 15 spells per MAGIC.md §3
- [ ] **2.3.4** — Midjourney: spell effect stills (43 base spells × 2-3 animation keyframes each = ~100 stills)
- [ ] **2.3.5** — Spell-unlock path wiring (3 paths: auto-level / location-visit / Crown-shop purchase)
- [ ] **2.3.6** — Reagent system (bone dust / grave salt / withered heart / minor seed / major seed / meteoric iron / phoenix ash)
  - Drop tables per battle biome
  - Crown shop purchase alternative

### 2.4 Remaining 11 battles (Day 7–12)

Each battle is ~2–4 hrs orchestrator time including scenario delegation + art + dialogue + integration + playtest.

- [ ] **2.4.1** — B2 "The Hollow" (forest biome, terrain-teaching)
- [ ] **2.4.2** — B3 "The Crypt Gate" (ruins biome, first necromantic creature encounter — introduces magic to world)
- [ ] **2.4.3** — B4 "The Ridge" (political, branching fealty choice with rival vassal)
- [ ] **2.4.4** — B5 "The Tower" (recruit Caelen, Wizardry mechanically introduced)
- [ ] **2.4.5** — B6 "The Pact" (Marrow recruitment moral choice — free or leave)
- [ ] **2.4.6** — B7 "The Grove Under Siege" (Thessa's loyalty crystallizes, Druidry taught)
- [ ] **2.4.7** — B8 "The Old Binding" (revelation battle, all schools in play)
- [ ] **2.4.8** — B9 "The Reckoning at the Keep" (major magic-on-magic battle)
- [ ] **2.4.9** — B10 "The Kingdom's Choice" (political, convince/coerce/defy the crown)
- [ ] **2.4.10** — B11 "The Old Ones" (scale battle, party's schools combined)
- [ ] **2.4.11** — B12 "The Crownsmoke" (finale, 3 endings based on earlier choices)

Per-battle subtasks (apply to each):
- Map design (biome, elevation, sanctum/ruin/forest hex counts)
- Starting positions (player + enemy)
- Enemy composition + archetype mix (from 6 archetypes: Muster's 3 + magic 3 from MAGIC.md §5)
- Objective (rout / capture / escort / defend / timed survive)
- Pre-battle dialogue (2–4 lines setup)
- Post-battle dialogue (2–4 lines resolution)
- Reward table (XP / Crowns / credit / reagent drops / unlock triggers)
- Difficulty tier multipliers (Scout 0.75× / Sergeant 1.0× / Marshal 1.5×)
- Playtest at least twice (1× best composition, 1× alternate)

### 2.5 Magic locations (Day 10–12)

- [ ] **2.5.1** — Wizard's Tower interior scene
  - Floor 1 (Threshold): Crown shop, apprentice tomes
  - Floor 2 (Orrery): Caelen-gated, intermediate tomes
  - Floor 3 (Reading Room): Lv 10+ Wizard content
  - Midjourney: 3 interior key art, UI overlay
- [ ] **2.5.2** — Dark Rites scene
  - Crypt Entrance (public-ish): basic binding tomes, reagent shop
  - Ritual Hall (Marrow-gated): summoning circle, Marrow's Binding rite
  - Moral register: unease system — non-caster heroes accumulate unease on visit
- [ ] **2.5.3** — Druid's Grove scene
  - Outer Ring: basic tomes, seed-bank
  - Inner Circle (Thessa-gated): advanced rites
  - Heartwood (Act 2+): stub
- [ ] **2.5.4** — Location visit triggers from world map
- [ ] **2.5.5** — Location-locked spell unlocks wired to visit flags

### 2.6 Meta-loop systems (Day 11–14)

- [ ] **2.6.1** — Camp scene shell (background art + menu)
- [ ] **2.6.2** — Roster management (view/swap/level/job-change up to 12 heroes; 6 active + 6 reserve by Ch end)
- [ ] **2.6.3** — Shop (Crown + credit spending surface)
  - Equipment slots: weapon / armor / accessory / focus
  - Consumables: potions / scrolls / bombs / rations / reagents
  - Spell tomes (per learn path)
  - Boosts (per-battle, capped 3 active)
  - Cosmetics (no gameplay effect)
  - Training (permanent stat bump per hero)
- [ ] **2.6.4** — Inventory management (consumable stacks, equipment slots, loadout per hero)
- [ ] **2.6.5** — World map (12 battle nodes + 3 magic location nodes)
  - Chapter 1 nodes visible as unlocked/locked
  - Branching paths (B4 fealty, B6 Marrow, B7 grove)
  - Visit node → battle or location scene
- [ ] **2.6.6** — Training yard (XP allocation + job advancement selection)
- [ ] **2.6.7** — Advisor consult integration at camp (same orb from site, references Oath and Bone observations)
- [ ] **2.6.8** — Save/load system (permadeath-respecting)
  - Auto-save at camp and end-of-battle
  - Permadeath flag on fallen heroes persists through save/load
  - No save-scumming: mid-battle save is resumable once; reloading same battle forfeits the session
  - Pro-tier: cloud save via existing Worker user-state endpoint
  - Free: localStorage only

### 2.7 Cross-intersection wiring (Day 13–14)

Pattern-match `game-vault-trial.js` and `game-war-table.js` per Muster's spec.

- [ ] **2.7.1** — Advisor XP hooks (all actions from DESIGN.md §8)
- [ ] **2.7.2** — Advisor observation hooks (all dimensions from DESIGN.md §8)
- [ ] **2.7.3** — Credit grant endpoint wire
  - `POST /credits/grant-daily` with `{source: "oathandbone", event: ...}`
  - Daily cap: 5 credits from Oath and Bone (separate from Muster's 5)
  - Events: `first_battle_victory` / `chapter_complete` / `hero_recruited_major`
- [ ] **2.7.4** — Crown earn from battles (client-side + server-side cap verification)
- [ ] **2.7.5** — Credit → Crown conversion endpoint (new, `POST /oath-and-bone/convert-credits` or similar)
  - 1 credit = 50 Crowns, one-way
  - Server-side verification
- [ ] **2.7.6** — Daily gate: `ksp_oathandbone_played` localStorage key
- [ ] **2.7.7** — Pro tier check integration (Last Instructions AI play, deeper advisor debriefs, monthly Crown stipend)

---

## Phase 3 — Polish (Week 3–4)

### 3.1 Full art pass
- [ ] **3.1.1** — 6 heroes × 10–12 expressions each = 60–72 portraits
- [ ] **3.1.2** — 7 biomes × 8 tile types = 56 tile sprites (plain / rough / ridge / river / forest / ruin / sanctum + variants)
- [ ] **3.1.3** — 12 unit types × 4 directions × 8 frames = 384 sprite frames minimum (unit types: infantry / archer / cavalry / wizard / necromancer / druid / skeleton / wraith / wolf / bear / raven / lich)
- [ ] **3.1.4** — 30+ spell effect animation sequences (multi-frame, not just stills)
- [ ] **3.1.5** — ~20 key art cutscene stills
- [ ] **3.1.6** — UI chrome polish (gold-on-dark consistency pass)

### 3.2 Audio full pass
- [ ] **3.2.1** — Music: 5 tracks (battle / camp / cutscene / victory / defeat)
- [ ] **3.2.2** — SFX: 50+ cues (including per-school stingers, per-spell effects)
- [ ] **3.2.3** — Voice-barb delivery style pass (hero vocal consistency if using TTS or retained as text)

### 3.3 Balance + QA
- [ ] **3.3.1** — Difficulty tier tuning (Scout / Sergeant / Marshal) per battle
- [ ] **3.3.2** — Permadeath stress test (play with losses, verify all paths remain winnable)
- [ ] **3.3.3** — Branching path verification (3 endings all reachable)
- [ ] **3.3.4** — Economy balance (Crown drop rates, shop prices, reagent scarcity)
- [ ] **3.3.5** — Architect full playtest (at least 1 complete run)
- [ ] **3.3.6** — External-AI code review pass (Gemini or ChatGPT audits integration points)

### 3.4 Deploy
- [ ] **3.4.1** — Deploy to `kingshotpro.com/games/oath-and-bone.html`
- [ ] **3.4.2** — Worker credit-grant endpoint live (if not shared with Muster)
- [ ] **3.4.3** — Crown pack Stripe products configured ($0.99 / $4.99 / $19.99)
- [ ] **3.4.4** — Campaign Pass Stripe product configured ($4.99/chapter or $9.99/month)
- [ ] **3.4.5** — Analytics events instrumented (battle starts, wins, losses, spell casts, credit/Crown spends)
- [ ] **3.4.6** — Announcement page on kingshotpro.com
- [ ] **3.4.7** — Disclaimer audit: every surface carries "Unofficial. Not affiliated with Century Games."
- [ ] **3.4.8** — Original-only verification: audit all names against the 27 canonical Kingshot hero list (worker.js:13) — no overlaps

---

## Phase 4 — Chapter 2+ (Multi-month, deferred)

Scope re-estimated after Chapter 1 velocity measured. Design seeds in DESIGN.md §6, MAGIC.md §4, §7. HEROES.md §"Chapter 2–3 recruits". Specifically:

- Act 2 heroes: Kavess (Spellblade), Talia (Bard), Orik (Death Knight/Paladin)
- Act 3 optional: Hollow Child
- New magic schools: Oracle / Alchemy / Rune-binding / Blood Pacts / Celestial
- Advanced hybrid classes fully unlocked
- World map expansion to 3 kingdoms
- Additional 40+ battles

---

## Cross-cutting work streams (parallel across phases)

### Writing (parallel to engine work)

- [ ] ~150 pre/post battle dialogue scenes (12 battles × ~10 lines each + cutscene interludes)
- [ ] ~500 voice-barb combat lines (6 heroes × ~80 lines each for full-campaign coverage; ~20/hero for Ch1)
- [ ] ~20 cutscene scripts
- [ ] ~30 NPC dialogue scenes (shopkeeper, tower-guardian, grove-circle, rival vassal, crown emissary, etc.)
- [ ] ~100 item/spell flavor text entries
- [ ] Menu / UI copy

AI-delegation model: Claude orchestrator writes beat-sheets, external AI (Claude API, GPT-4.6, Gemini) drafts scenes, Architect QAs, orchestrator integrates.

### Midjourney prompt work (parallel)

- [ ] 60+ hero portrait prompts
- [ ] 50+ tile prompts
- [ ] 100+ sprite prompts
- [ ] 40+ spell effect prompts
- [ ] 20+ UI chrome prompts
- [ ] 20+ cutscene key art prompts

Full prompt bank in `ART_DIRECTION.md` (next Claude to write).

### Code-delegation prompts (parallel)

- [ ] Engine extension prompt templates (1 per module in §0.2.7 file skeleton)
- [ ] Spell-resolution prompt (generic template, parameterized per spell)
- [ ] UI widget prompts (menu, wheel, tooltip, modal, etc.)
- [ ] Test harness prompts (unit tests for spell resolution, movement math, elevation attack mods)

Full prompt templates in `BUILD_PLAN_DELEGATION.md` (next Claude to write).

---

## Estimated total effort

| Phase | Orchestrator-Claude time | Real time (with AI delegation) |
|---|---|---|
| Phase 0 (prerequisites + design expansion) | ~8 hrs | 1–2 days |
| Phase 1 (combat slice) | ~26 hrs | 2–3 days |
| Phase 2 (Chapter 1 MVP) | ~80–100 hrs | 10–14 days |
| Phase 3 (polish) | ~30–50 hrs | 7–10 days |
| **Chapter 1 total** | **~150–180 orchestrator-hrs** | **3–5 calendar weeks** |

*"Matter of days" for the combat slice. "Matter of weeks" for Chapter 1 MVP. Full vision (Chapter 2+) multi-month, re-estimate after Ch1.*

---

## Verification checklist before Chapter 1 ships

Run each at end of Phase 3 before deploy:

- [ ] `Advisor.grantXP('oathandbone_battle_victory', N)` fires exactly once per sergeant+ win, no double-grant on refresh
- [ ] `Advisor.observe('oathandbone', ...)` writes verified in `_state.observations.oathandbone` via browser console
- [ ] Daily gate `ksp_oathandbone_played` blocks XP/credit after 3 plays, still allows practice mode
- [ ] Worker endpoint enforces cap server-side, not just client
- [ ] Save-mid-battle: close at turn N, reopen next day, state loads cleanly
- [ ] Permadeath: fallen hero stays fallen across save/load cycles
- [ ] AI turns < 1000ms on mid-range mobile
- [ ] Legible at 375×667 viewport (iPhone SE baseline) — tactical RPG is desktop-primary but mobile must be readable
- [ ] No Kingshot canonical hero names present anywhere (audit against worker.js:13 list)
- [ ] Disclaimer present: every game surface, about page, announcement
- [ ] 9x3x3 protocol on any external claim introduced during build (none planned)
- [ ] Midjourney commercial license confirmed active
- [ ] Soul Review: every major combat event fires 3+ feedback channels

---

## Stop conditions during build

- Architect direction change → pause, re-plan
- Context ceiling 85% → finish current file, write succession note, hand off
- External AI hallucinates code that breaks spec → reject, re-prompt with narrower scope
- Canon drift detected (accidental canonical name use) → stop, audit, purge
- Monetization violates Free-Means-Free → stop, re-scope

---

*BUILD_PLAN.md — exhaustive task list matching DESIGN/MAGIC/HEROES specs. Build-Claude executes Phase 0.2 first, then sequential phases. Next immediate step after Architect approval: next-Claude writes STORY.md + ECONOMY.md (highest-priority deferred siblings), then begins Phase 1 Day 1.*

*Session 44 / April 20, 2026. Context ceiling reached at 87% — the build itself is next-Claude's work from this decomposition. The relay carries continuity.*

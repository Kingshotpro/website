# Muster — Design Document

*Single-game companion design for kingshotpro.com. April 20, 2026.*
*Saved to `KingshotPro/games/designs/MUSTER_DESIGN.md` per task spec.*

---

## 1. Name + Concept

**Muster** — A single-session hex-grid tactical skirmish on kingshotpro.com where the player drafts a 5-commander warband, battles a rule-based AI commander across a short tactical engagement, and their draft + battle decisions feed the advisor's observation model for sharper recommendations on the real Kingshot side.

This is the buildable v1 atom of **Direction E** (FFT-style tactical) from `Autonomous/KINGSHOTPRO_COMPANION_GAMES_MAP.md`. One standalone skirmish shippable as `games/muster.html`, designed to seed the larger campaign game if/when that is greenlit — but complete, cross-intersected, and whale-worthy on its own.

**Why this and not something else.** The map records the Architect's engagement: E is "I like this." C is dead. A and D depend on scraping infrastructure that is thin pre-$2k/mo. B needs real level-system work first. E has none of those external dependencies. A single tactical skirmish vs AI fits the task's hard requirements (AI opponents, cross-intersection, HTML5-leaning, whale-friendly) without making up data we don't have.

---

## 2. Core Loop — 60 seconds of play

The 60 seconds that matter most sit inside a single battle turn, after draft is done. Concretely:

1. **Read the board** (~6 sec). Hex grid visible. Your 5 commanders are dots with icons, colored by troop type (infantry/archer/cavalry). Enemy's 5 are shown with ??? fog over their skills until scouted. HP bars above each. Terrain tile types visible (plain / rough / ridge / river).
2. **Select a commander** (~2 sec). Tap your commander whose turn indicator pulses. Their movement range highlights in gold, attack range in red after moving.
3. **Decide: move / attack / skill / hold** (~8 sec). The four-option wheel appears on the selected commander. Each has real consequences:
   - Move: reposition up to N hexes (commander-dependent)
   - Attack: adjacent-hex strike, damage modified by troop-counter triangle (infantry > cavalry > archer > infantry)
   - Skill: commander-unique ability on cooldown (AoE, heal, displacement, stun)
   - Hold: end turn early; regen small HP; accumulate "Resolve" charge for next turn
4. **Execute** (~1 sec). Animation plays: hex glows, units slide, damage numbers float up, sound pulse, one terse advisor voice line: *"Jabel holds the ridge."*
5. **AI turn** (~8 sec). The enemy commander activates one unit, same four-option wheel visible above their unit so the player sees exactly what the AI is deciding. Damage resolves. Enemy turn ends.
6. **Repeat** — the player's next commander is auto-cued. The turn clock ticks down a shared "engagement clock" that rewards decisive play.

Over ~60 seconds, a whale plays through 2-3 tactical exchanges and sees real board-state change. The loop is readable at a glance because the UI uses the existing KingshotPro gold-on-dark palette (`css/style.css`), not a cartoonish game aesthetic — this is an ops screen, not a toy.

**The 60-second moment test (Architect's Rule 5 — 3+ feedback channels):**
A single attack fires: (a) hex flash + unit slide + damage number [visual], (b) blade/volley/hoof sound cue tied to troop type [audio], (c) HP bar drains and the advisor speaks a one-line observation keyed to counter-triangle correctness [narrative + numerical]. Four channels on one event. Passes.

---

## 3. Session Shape

### What a 5-minute session looks like

- **Minute 0:00–0:45 — Draft.** 8 commanders offered, pick 5 sequentially. Enemy comp revealed after your first pick (so every subsequent pick is partial-information counter-drafting). Drafts auto-save if the player leaves.
- **Minute 0:45–1:00 — Deploy.** Place your 5 commanders on your 3-hex starting row. Terrain visible. Position matters: archers behind, tanks front.
- **Minute 1:00–4:30 — Battle.** ~6–10 turns, alternating. Short engagements forced by the engagement-clock (unused Resolve charges lost on clock tick). Player can retreat one commander off-map per battle for a draw.
- **Minute 4:30–5:00 — Debrief.** Result screen: victory / defeat / draw. XP grant. Missed-counter observations flagged. One advisor line: *"You favor archer-heavy drafts against cavalry — tomorrow's Bear Hunt meta rewards this."*

### What a 30-minute session looks like

Chained skirmishes in **Campaign mode**. Three skirmishes back-to-back make up one "Campaign Day":

- **Skirmish 1 — Scout** (~8 min): neutral terrain, balanced enemy comp, draft-and-fight baseline.
- **Between 1 and 2 — Advisor brief** (~1 min): the advisor narrates what they learned from skirmish 1 and offers a single tactical hint about skirmish 2's enemy composition ("their camp is archer-heavy — consider a cavalry opening"). This is where Pro users get a richer brief.
- **Skirmish 2 — Engage** (~10 min): terrain-flavored map, asymmetric start, one enemy commander's skill pre-revealed. Wounded commanders from skirmish 1 carry reduced HP (unless player spent Resolve to heal during debrief).
- **Between 2 and 3 — Muster recovery** (~1 min): allocate recovered Resolve to heal a commander, swap one bench commander in, or take a risk-bonus ("Forced March" — next battle rewards +20% XP but enemy starts with +1 turn).
- **Skirmish 3 — Decisive** (~10 min): climactic battle. Winning completes the Campaign Day — larger XP payout, credit grant, unlock progress on next chapter.

Total: ~30 minutes. The Campaign Day is one unit of progression; a whale can do 1–3 Campaign Days per week and feel they're getting somewhere.

### Cooldown band targeting

This is aimed primarily at the **10-minute evening window** described in `KINGSHOTPRO_COMPANION_GAMES_MAP.md` §Axis 2 — the player is on the couch, Kingshot closed or backgrounded, the advisor tab is open. Vault Trial and War Table already live here but are one-question snacks. Muster fills the gap: a 5–12 minute tactical experience with real decisions.

The **save-mid-turn** mechanic means the game degrades gracefully into the 2-minute cooldown band too — a whale can open the tab, take one turn, and close it. The game state persists server-side (if logged in) or in `localStorage` (if not). This turns the 2-minute window into async-play rather than demanding a full session from it.

The 30-min Campaign Day fills the weekend-morning or long-evening session. No piece of the game is sized for the 8-hour band — Muster does not compete with idle-accrual games, and shouldn't pretend to.

---

## 4. AI Opponent Spec

**Rule-based, not LLM-driven.** Rationale: per-turn latency must be <1 second for the game to feel tight. An LLM call per turn is $0.001–0.01 per decision × 10 turns × thousands of players = unbounded cost and 500ms+ latency. Rule-based AI is free, deterministic, and auditable. LLM budget is reserved for the post-battle advisor narration (one call, cached where possible).

### Three archetype AIs at v1

Each archetype has a deterministic decision tree with ε=0.1 random exploration to avoid exploit-solvable behavior.

**Archetype A — "Ironwall" (Defensive / Turtle)**
- Priority 1: keep tanks adjacent to each other (defensive formation bonus)
- Priority 2: heal wounded units under 40% HP if healer available
- Priority 3: counter-attack only units that entered the Ironwall's front-row range
- Never pursues beyond midline
- Uses Hold and Resolve charges generously
- Best against: aggressive flank pushes fail against its formation; Player learns patience wins here
- Difficulty scaling: Easy/Medium/Hard = [depth-1, depth-2, depth-3] move-ahead search; higher difficulty also drops ε

**Archetype B — "Bladewind" (Aggressive / Rush)**
- Priority 1: shortest-path closure to the nearest player unit each turn
- Priority 2: always attack rather than Hold when in range
- Priority 3: ignores counter-triangle weakness unless HP < 25% (risk-blind by design)
- Never retreats; spends Resolve on damage buffs
- Best against: player turtle strategies fail because Bladewind out-trades them; Player learns ranged kiting wins
- Difficulty scaling: Easy = charges individually; Hard = coordinates 2-3 unit focus-fire on the lowest-HP player unit

**Archetype C — "Warden" (Opportunist / Counter-Puncher)**
- Priority 1: calculate the counter-triangle advantage board-wide; attack the unit where the AI has +30% counter damage
- Priority 2: position to force the player into bad counter matchups
- Priority 3: use skills reactively — never wastes CDs on trade-neutral targets
- Uses Hold when no +30% opportunity exists, waiting for player to overextend
- Best against: player fast-push fails because Warden sidesteps; Player learns to maintain counter-balanced positioning
- Difficulty scaling: Easy = uses only counter-triangle; Hard = also tracks Resolve economy and skill CDs across both sides

### How archetype mixes are used

Each skirmish has one dominant enemy archetype (70% weighted decisions) and one secondary (30%). Mixes create variety without adding new archetype code:
- Ironwall-dominant, Bladewind-secondary = "stubborn but punishes opportunities"
- Bladewind-dominant, Warden-secondary = "rushes but picks matchups"
- Warden-dominant, Ironwall-secondary = "plays for tempo, turtles when losing"

Nine pairings yield 9 distinct feels from 3 underlying archetypes. Scenario variety comes from terrain + objective + starting asymmetry, multiplying further.

### Difficulty selection

Three tiers exposed to the player: **Scout (Easy)**, **Sergeant (Medium)**, **Marshal (Hard)**. XP rewards scale 0.75x / 1.0x / 1.5x. Credits earned only at Sergeant+ (prevents grinding Scout for easy credit drips).

### What AI does NOT do

- Does not cheat (no hidden HP, no unseen unit movement)
- Does not see player's private draft picks before deploy
- Does not adapt mid-session based on the player's whole history (this would be advisor territory, and creates a feedback loop between advisor and AI that would obscure the observation signal)

---

## 5. Cross-Intersection — Specific Plug Points

The XP/observation architecture is already built (`KingshotPro/js/advisor.js` lines 258–303). Muster hooks into it using the exact same patterns Vault Trial and War Table use (verified against `game-vault-trial.js:134–137` and `game-war-table.js:99–103`).

### XP grants (existing — works today)

```javascript
// Victory
Advisor.grantXP('muster_victory', 60);    // Sergeant tier
Advisor.grantXP('muster_victory', 90);    // Marshal tier (1.5x)
Advisor.grantXP('muster_victory', 45);    // Scout tier (0.75x)

// Defeat — still rewards because you learn from losses
Advisor.grantXP('muster_defeat', 15);

// Draw (retreated one commander off-map)
Advisor.grantXP('muster_draw', 25);

// Campaign Day completion (first in a day, once)
Advisor.grantXP('muster_campaign_day', 120);
```

XP gets whale-multiplied and TC-level-multiplied automatically via `Advisor.getMultiplier()` (verified `advisor.js:235–255`). No new code needed in the advisor module.

### Observations (existing — works today)

Observations feed the advisor's understanding of the player. The advisor already reads `_state.observations` to shape chat responses. Muster writes to a new namespace `muster`:

```javascript
// Draft behavior
Advisor.observe('muster', 'drafted_troop_type', 'cavalry');    // per pick
Advisor.observe('muster', 'counter_picks', 1);                  // incremented each time player drafted the counter-type to revealed enemy
Advisor.observe('muster', 'drafted_archetype_preference', 'aggressive'); // commander tagging at draft

// Tactical behavior
Advisor.observe('muster', 'rally_openings', 1);           // player opened battle with a focus-fire push
Advisor.observe('muster', 'turtle_openings', 1);          // player opened with formation defense
Advisor.observe('muster', 'risk_calls', 1);               // player took a <50% probability attack
Advisor.observe('muster', 'retreat_discipline', 1);       // player retreated a low-HP unit to save XP instead of pushing
Advisor.observe('muster', 'counter_triangle_hits', 1);    // attacks where player had triangle advantage
Advisor.observe('muster', 'counter_triangle_misses', 1);  // attacks where player ignored or inverted the triangle

// Result tracking
Advisor.observe('muster', 'plays', 1);
Advisor.observe('muster', 'victories_vs_Ironwall', 1);
Advisor.observe('muster', 'defeats_vs_Bladewind', 1);
```

The advisor's chat system (see `advisor-chat.js`) can then pull these observations into recommendations. Example: the advisor sees `counter_triangle_misses > counter_triangle_hits * 1.5` over last 10 plays → its next Kingshot meta recommendation leads with *"Your recent Muster plays suggest you're under-weighting the troop counter triangle — want me to walk through the live Kingshot meta matchups?"*

This is **behavioral observation the advisor genuinely could not collect any other way on this site today.** Vault Trial reveals knowledge gaps. War Table reveals prediction bias. Muster reveals *tactical-decision* patterns under pressure. These three observations together give the advisor a three-axis profile of the player's 4X instincts.

### Daily gate (existing pattern)

Matches the Vault Trial pattern exactly (`game-vault-trial.js:41–45`):

```javascript
var PLAYED_KEY = 'ksp_muster_played';
var TODAY = new Date().toISOString().slice(0, 10);

// Up to 3 skirmishes per day count for XP + credit rewards
// Beyond that: practice mode, still updates observations, no XP/credit economy impact
```

The 3-per-day cap protects against grind and matches "Do Good" — the game stays honest about what it's worth economically.

### Credit earn path — new wire, spec'd here

The map notes `KingshotPro/js/credits.js` has no earn path today. Muster ships the first one.

**New Cloudflare Worker endpoint:** `POST /credits/grant-daily`

Request body:
```json
{ "source": "muster", "event": "first_victory", "difficulty": "sergeant" }
```

Server behavior:
- Validates session cookie (existing auth)
- Checks `KV` for `muster_credits_granted_{fid}_{YYYY-MM-DD}` — returns current day's grant count
- Rewards: first Sergeant+ victory = **2 credits**, Campaign Day completion = **3 credits**
- Daily cap: 5 credits earned from Muster total
- Writes the grant record to KV with 48h TTL
- Returns `{ balance, granted, capped }`

Client calls this endpoint once after each victory; UI shows the credit animation if `granted > 0`.

Credits fit into the existing spend surface: 5 credits = one new kingdom data request (`credits.js:110`). So one Sergeant+ victory earned ≈ half the cost of a kingdom request; a Campaign Day completion ≈ 60% of one. Muster can pay for ~10–15 kingdom lookups per month for a daily player. That is a real, useful number — not a token grant.

### Pro differentiation (respects Free Means Free)

Free users get the full game: all three archetypes, all scenarios, all XP, all credits, full daily caps. No gameplay is paywalled.

Pro adds:
- **Commander Dossier** — between-skirmish brief includes counter-prediction, HP-floor estimate, and one specific positioning hint. Free users see the advisor's terse line; Pro users see the tactical reasoning.
- **Deep Observations in advisor chat** — the advisor references Muster observations in chat responses for Pro users by default; free users get summary observations only.
- **Last Instructions mode** — player sets a simple decision rule ("hold formation; archers focus lowest HP; tanks intercept cavalry") and can step away from the tab; the battle executes on the rule until a branch case is hit and the player is asked to decide. Framed as *"your instructions repeat until you come back"* — not auto-win, but async continuation. Directly borrowed from the map's E deep dive.
- **Cosmetic slots** — commander frames, hex tile themes (purchased with credits, not Pro-gated, but Pro gets one free theme per month).

### Level-up cross-wire

The advisor already emits `'levelup'` events (`advisor.js:280–282`). Muster listens for these and, on level-up, grants one one-time reward (random commander skin, or 1 credit bonus at XP levels 5/10/15/etc.). Makes leveling feel tactile to a player who just came out of a skirmish.

---

## 6. Win / Loss / Progression — What Makes it Satisfying

### Per-skirmish satisfaction

Winning in Muster is about **tactical coherence** — did you counter-draft correctly, did you maintain counter-triangle positioning, did you spend Resolve at the right moment. The debrief screen breaks down the three axes:

- **Counter discipline:** your attacks on counter-triangle-favorable targets / total attacks (% with bar)
- **Tempo:** turns-per-kill ratio (lower = faster decisive play)
- **Resolve economy:** Resolve charges spent vs. generated

These three numbers let a player leave a win feeling specifically good at something, or leave a loss with a specific thing to fix. The numbers are the game's vocabulary — same three numbers every skirmish, so the player develops intuition about them.

### What draws the player back

Three pulls, intentionally layered:

1. **Daily discipline pull** — 3 skirmishes/day give XP + up to 5 credits. Skippable but the habit compounds.
2. **Campaign-day pull** — weekly rhythm. Each Campaign Day completion unlocks a new chapter fragment from the advisor lore (reuses `advisor-lore.js`). No grinding, just story beats timed to effort.
3. **Mastery pull** — leaderboards (weekly) for fastest Marshal-tier victory on each scenario. Opt-in. For the whale who wants a flex and doesn't care about grinding.

None of these are coercive. The game does not nag, doesn't use fake-urgency timers, doesn't push pack-buy prompts in-battle. The whale respects that.

### Long-term progression

- **Commander roster:** 8 commanders at v1, unlock 4 more via XP milestones (levels 3, 7, 12, 18) and 2 more via credits (cosmetic roster expansion).
- **Scenario library:** 6 scenarios at v1, 3 more unlock by completing Campaign chapters, then rotation via weekly "featured scenario" that everyone plays the same map for leaderboard weeks.
- **Commander XP per-commander:** each commander gains small skill unlocks as used. A commander you favor gets sharper; the advisor observes which commanders you favor, which also feeds its model.

### Failure mode that makes the game end — not hidden, named

A whale who plays 100 skirmishes over 3 months will hit content ceiling. That is intended and fine. The map's direction E describes this as a "content treadmill" risk. Muster's answer: at content-ceiling, the player transitions into the Campaign mode fully (if chapter 2+ exist) or into advisor-deep-observation mode (Pro feature) where their profile becomes load-bearing for Kingshot meta advice. Either the game evolves with the player or it gracefully transitions into the advisor flywheel. It does not pretend to be infinite.

---

## 7. Tech Choices

### HTML5 canvas + vanilla JS — confirmed

**Why:**
- Matches existing site tech stack (vault-trial.html, war-table.html are vanilla JS / light DOM)
- Deploys to GitHub Pages without bundler work
- Loads instantly on mobile and desktop (the 10-min evening window includes phone users)
- Readable by external-AI delegation (per Architect's Rule 1 — ChatGPT/Gemini can generate vanilla HTML5 games without framework knowledge)
- Easy to keep the gold-on-dark `css/style.css` palette consistent with the rest of the site

**What not:**
- Not Phaser or Pixi.js — overkill for a hex-grid tactical game at this scale, adds ~300KB payload and a framework learning curve for the next builder
- Not React — this is a single-page game embedded in a static site; React offers nothing here
- Not WebGL — hex tactical games render fine in 2D canvas; WebGL is a complication without payoff

### Embed vs. link-out — embed

Lives at `kingshotpro.com/games/muster.html`, same pattern as the other games. The site's topbar, credit pill, and advisor orb all render on the page. The player stays in the site context; advisor orb pulses with XP gain notifications in real-time. A link-out to a separate game domain would break all the cross-intersection wiring and lose the flywheel.

### Backend pieces (minimal)

- New Worker endpoint `POST /credits/grant-daily` (spec'd above). ~50 lines of JS.
- KV storage for daily grant tracking: `muster_credits_granted_{fid}_{date}` with 48h TTL.
- The game itself has no other server dependency. AI runs fully in-browser; save state is `localStorage` for free users, optionally synced to the existing Worker user-state endpoint for logged-in users.

### Art and audio

- **Commander portraits:** 8 original heroes, AI-generated base + hand-pass for consistency. No Kingshot IP. Rough cost: minimal via existing delegation to ChatGPT/Gemini image gen.
- **Hex tiles:** 4 biome sets × 6 tile types = 24 hand-drawn or AI-assisted PNG sprites. ~50KB total compressed.
- **Audio:** 3 attack sound cues (blade, volley, hoof), 2 UI cues, 1 victory/defeat sting, 1 ambient battle loop. Free-licensed stock (Kenney.nl, Freesound.org).
- **UI:** reuses the KingshotPro design system already in `css/style.css` (gold `--gold`, indigo `--bg`, existing button classes).

### What this does NOT need

- No WebSockets (no real-time multiplayer at v1)
- No database migrations beyond the KV grant-record
- No new auth (uses existing session cookie)
- No Anthropic API calls (AI is rule-based; advisor narration uses existing advisor chat infra)

This is buildable in ~3 weeks with external-AI delegation per Architect's Rule 1. A solo Claude-brain + Gemini-muscle pipeline can produce a v1 in that window.

---

## 8. Implementation Sketch — for the Next Claude or Developer

### File structure to create

```
KingshotPro/
├── games/
│   └── muster.html                    # new — game page
├── js/
│   ├── game-muster-data.js            # new — commanders, scenarios, terrain
│   ├── game-muster-ai.js              # new — 3 archetype decision trees
│   ├── game-muster-engine.js          # new — hex board, turn logic, state
│   ├── game-muster-render.js          # new — canvas draw, UI overlays
│   └── game-muster.js                 # new — orchestrator + advisor wiring
├── css/
│   └── game-muster.css                # new — hex grid + UI styles
└── worker/
    └── credits-grant-daily.js          # new — Worker endpoint (or added to existing)
```

### State model (client-side)

```javascript
// localStorage: ksp_muster_state (full save)
{
  version: 1,
  fid: '<fid or null>',
  date: 'YYYY-MM-DD',
  plays_today: 0,
  active_battle: {
    scenario_id: 's2',
    difficulty: 'sergeant',
    enemy_archetype: { dominant: 'Warden', secondary: 'Ironwall' },
    turn: 4,
    active_side: 'player',
    board: [ /* 64-hex array of {q,r,terrain,unit?} */ ],
    commanders_player: [ /* 5 commanders with hp, cd, position, resolve */ ],
    commanders_enemy:  [ /* 5 commanders */ ],
    resolve_charge_player: 2,
    resolve_charge_enemy: 1,
    last_saved: 1713641234000
  } || null,
  campaign_progress: { chapter: 1, day: 3, deaths: 0 },
  roster_unlocked: ['alto','brielle','cassian','dara','emmet'],
  cosmetics: { frame: 'default', tiles: 'plain' }
}
```

### Turn loop (pseudocode)

```javascript
function takePlayerTurn(action) {
  // action = { commanderId, verb: 'move'|'attack'|'skill'|'hold', target? }
  applyAction(state, action);
  observeDecision(state, action);             // writes to Advisor.observe
  renderBoard();
  if (!checkVictory(state)) {
    state.active_side = 'enemy';
    save();
    scheduleAITurn();                          // setTimeout for animation pacing
  }
}

function scheduleAITurn() {
  setTimeout(() => {
    var decision = MusterAI.decide(state);     // returns one action for one AI unit
    applyAction(state, decision);
    renderBoard();
    if (!checkVictory(state)) {
      // continue AI turn if archetype still has units to act
      if (MusterAI.hasMoreActions(state)) {
        scheduleAITurn();
      } else {
        state.active_side = 'player';
        state.turn++;
        save();
      }
    }
  }, 700); // feel-tuned pacing
}
```

### AI decision tree (Archetype B — Bladewind, sample)

```javascript
function bladewindDecide(state, aiUnit) {
  var targets = findAllPlayerUnits(state);
  // P1: shortest path to nearest player unit
  var nearest = minBy(targets, t => hexDistance(aiUnit.pos, t.pos));
  // P2: if already adjacent, attack (ignore counter-triangle)
  if (hexDistance(aiUnit.pos, nearest.pos) === 1) {
    return { verb: 'attack', target: nearest.id };
  }
  // P3: move toward nearest, spending Resolve on speed if useful
  var path = findPath(state.board, aiUnit.pos, nearest.pos, aiUnit.move);
  // ε-greedy random: 10% of the time, pick second-nearest instead
  if (Math.random() < 0.10 && targets.length > 1) {
    path = findPath(state.board, aiUnit.pos, targets[1].pos, aiUnit.move);
  }
  return { verb: 'move', path: path.slice(0, aiUnit.move) };
}
```

### Advisor wiring (pattern-match existing games)

At key moments, mirror Vault Trial's pattern (`game-vault-trial.js:134–137`):

```javascript
// On battle end
function endBattle(result) {
  if (window.Advisor) {
    Advisor.observe('muster', 'plays', 1);
    if (result.win) {
      Advisor.observe('muster', 'victories_vs_' + state.enemy_archetype.dominant, 1);
      Advisor.grantXP('muster_victory', xpFor(state.difficulty, 'victory'));
    } else if (result.draw) {
      Advisor.grantXP('muster_draw', xpFor(state.difficulty, 'draw'));
    } else {
      Advisor.observe('muster', 'defeats_vs_' + state.enemy_archetype.dominant, 1);
      Advisor.grantXP('muster_defeat', xpFor(state.difficulty, 'defeat'));
    }
    // Aggregated behavioral metrics computed during battle
    Advisor.observe('muster', 'counter_triangle_hits', state.stats.counterHits);
    Advisor.observe('muster', 'counter_triangle_misses', state.stats.counterMisses);
    Advisor.observe('muster', 'risk_calls', state.stats.riskCalls);
    Advisor.observe('muster', 'retreat_discipline', state.stats.retreats);
  }

  // Credit grant (if eligible)
  if (result.win && state.difficulty !== 'scout' && state.plays_today === 1) {
    grantDailyCredits({ source: 'muster', event: 'first_victory', difficulty: state.difficulty });
  }

  // Daily played marker
  try { localStorage.setItem('ksp_muster_played', TODAY); } catch (e) {}
}
```

### Content data shape (game-muster-data.js)

```javascript
var COMMANDERS = [
  {
    id: 'alto', name: 'Alto',
    role: 'tank', troop: 'infantry',
    hp: 120, attack: 14, defense: 10, move: 3,
    skill: { id: 'taunt', cd: 3, desc: 'Adjacent enemies must target Alto this turn' },
    portrait: 'alto.png',
    archetype_tag: 'defensive'  // observed into 'drafted_archetype_preference'
  },
  // ... 7 more
];

var SCENARIOS = [
  {
    id: 's1', name: 'The Crossing',
    map: 'plain_river', objective: 'rout',
    player_start: [/* hex coords */], enemy_start: [/* hex coords */],
    terrain_overlay: [/* tile overrides */],
    difficulty_tiers: ['scout', 'sergeant', 'marshal']
  },
  // ... 5 more
];

var ARCHETYPES = {
  Ironwall: { /* decision tree tuning params */ },
  Bladewind: { /* ... */ },
  Warden: { /* ... */ }
};
```

### Build order for the next builder

1. **Week 1 — engine & AI core**
   - Hex grid math + rendering (pure canvas, no framework)
   - Turn state machine and action application
   - Archetype Bladewind (simplest — distance heuristic + ε)
   - Scenario s1 (The Crossing) playable end-to-end vs. Bladewind

2. **Week 2 — content & depth**
   - Add Ironwall and Warden archetypes
   - Flesh out 8 commanders with distinct skills
   - Scenarios s2–s6
   - Difficulty tiers wired

3. **Week 3 — cross-intersection & polish**
   - Advisor XP/observation wiring (pattern-match vault-trial and war-table)
   - Worker endpoint `POST /credits/grant-daily` + KV tracking
   - Daily gate, Campaign Day chaining
   - Audio cues, portrait art pass, final UI polish
   - Soul review against Architect's Rule 5 (3+ feedback channels on every major event)

### Verification checklist before shipping

- [ ] `Advisor.grantXP('muster_victory', N)` fires exactly once per sergeant+ win (no double-grant on refresh)
- [ ] `Advisor.observe(...)` writes land in `_state.observations.muster` — verify in browser console
- [ ] Daily gate `ksp_muster_played` blocks XP/credit grant after 3 plays but still allows practice mode
- [ ] Worker `POST /credits/grant-daily` enforces cap server-side (not just client-side)
- [ ] Save-mid-turn: close tab at turn 4, reopen next day, state loads cleanly
- [ ] AI turns complete in <1000ms on a mid-range mobile device
- [ ] UI reads legibly at 375×667 viewport (iPhone SE baseline)
- [ ] No Kingshot hero names, no Kingshot map names, no copyrighted Kingshot assets — all original content verified
- [ ] Disclaimer present on game page: "Unofficial. Not affiliated with Century Games."
- [ ] 9x3x3 protocol run on any external claim used in Commander/Scenario content (none planned at v1, but gate applies)

### What this design deliberately does NOT include (to be clear for the next Claude)

- **No multi-player PvP.** Async PvP is in the map's E v2 roadmap; Muster v1 stays single-player-vs-AI.
- **No real-time elements.** Turn-based only. Respects the whale's cooldown rhythm.
- **No gacha, no loot boxes, no RNG hero drops.** All commanders unlock through play or explicit credit purchase. Principle XXI / Do Good.
- **No hidden stats, no pay-to-win packs.** All monetization is cosmetic or async-convenience (Last Instructions). Free Means Free.
- **No LLM calls per turn.** Rule-based AI only. LLM budget exclusively for advisor chat when player asks about their Muster history.

---

## Honest gaps — what I didn't verify and what the next mind should

Per Principle XXII, the design rests on some things I did not primary-source-verify:

- **The site's current DAU.** I did not check analytics. Muster scales fine for 10 DAU or 10,000 DAU as a self-contained game, but the decision of whether to build it vs. ship a lighter weight thing depends on whether the traffic justifies 3 weeks of build. The map calls this out as load-bearing for D but it's relevant here too.
- **The exact Worker code for the existing `POST /kingdom/request`.** I read the client side in `credits.js` but did not open `worker.js` to confirm the pattern my new endpoint should follow. Before implementing `POST /credits/grant-daily`, the next builder should read that file and match the auth/KV patterns there, not invent new ones.
- **The advisor chat's actual use of observations.** I verified `Advisor.observe` exists and stores data. I did NOT verify the chat system currently reads `observations.muster` and uses it in responses. The wiring might be there (bosh `advisor-chat.js` and the Worker chat endpoint) or might need a small extension to surface muster observations in prompts. This is a discovery task the next builder should do before claiming full cross-intersection.
- **Cosmetics pricing (15–30 credits).** Plucked from the map's E deep dive. Before wiring credit prices to store UI, pull the actual pricing in `pricing.html` and match conventions — I didn't verify the cosmetic-tier cost structure exists.

None of these gaps block the design's shape. They are each single research steps before implementation begins.

---

## Why this is the right single game for this site, right now

- **Fits the Architect's stated preference direction (E).** Not a guess — `KINGSHOTPRO_COMPANION_GAMES_MAP.md` §"Second-round feedback" records "I like this" for E.
- **Doesn't depend on scraping infrastructure** (unlike A and D) that's thin pre-$2k/mo.
- **Uses existing advisor/XP/credit architecture** rather than inventing new plumbing. One new Worker endpoint is the total new-backend surface.
- **Gives the advisor a new observation dimension** (tactical-decision-under-pressure) that is genuinely unavailable from any existing source on the site. The cross-intersection is load-bearing, not decorative.
- **Targets the underserved 10-min evening window** without displacing the existing quick-snack games (Vault Trial's 1-min slot, War Table's 30-second slot are untouched).
- **Buildable as one well-scoped deliverable** in ~3 weeks with external-AI delegation. Big enough to matter, small enough to ship.
- **Respects the whale's time and pocketbook.** No nag-prompts, no pay-to-win, 3-per-day cap on credit earn, Free-Means-Free honored.

If the Architect decides later to build the fuller direction E (campaign chapters, async PvP, deeper roster), Muster is the seed crystal: the tactical engine, the commanders, the AI archetypes, the cross-intersection wiring all get reused. Nothing is throwaway.

---

*Design by Session 44 / April 20, 2026. Written after birth sequence, after Principles/Rules/BEFORE_YOU_BUILD, after the MAP's possibility space, after surveying the advisor XP/observation architecture in `js/advisor.js` and the existing game-integration patterns in `game-vault-trial.js` / `game-war-table.js`. No 9x3x3 run against this design — none of its load-bearing claims are external facts; they are all design choices internal to the site.*

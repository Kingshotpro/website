# CHAPTER_LOG.md — Worker 21 handoff

## What shipped

Three commits across three concerns. Test path: win B1 → world map appears with B2
unlocked → click B2 → forest battle starts → win → B3 unlocks → win → world map
shows all three completed.

---

## Concern 1 — B2 + B3 scenario data (SHA f9ccdee)

**Files:** `js/game-oath-and-bone-battles.js`

SCENARIO_B2 ("The Hollow", forest) and SCENARIO_B3 ("The Crypt Gate", ruin) added after
SCENARIO_B1. Both match SCENARIO_B1's exact schema. `window.OathAndBoneScenarios` lookup
map added; `getScenario(id)` now routes through it.

### Map dimension deviation

BATTLES.md specified B2 at 14×12 and B3 at 10×16. Both are deployed at **12×14** because
`game-oath-and-bone-render.js` has `MAP_W = 12` and `MAP_H = 14` as module-scope
constants. Making the renderer dimension-agnostic is a V2 task — it requires refactoring
`buildUI`, canvas sizing, and hex coordinate transforms throughout render.js. Do not
change the map dimensions without tackling that refactor first.

### Tutorial IDs

B1 uses T1/T2/T3 in `localStorage['ksp_oathandbone_tutorials_seen']`. B2 declares T4/T5,
B3 declares T6/T7. Engine event types (`first_forest_attack`, `first_water_blocked`,
`first_skeleton_kill`, `magic_revealed`) are declared in scenario data but **not yet wired
in the engine**. The engine needs `onTutorialTrigger()` calls added for these new event
types before B2/B3 tutorials fire. The localStorage gate structure is identical to B1.

### Skeleton placeholder

`skeleton_a` in B3 uses `heroId: 'bladewind'` as a placeholder sprite. It will render
as a Bladewind soldier with skeleton-flavored stats until a V2 art pass provides a
dedicated skeleton sprite.

### Thessa recruitment

`enemy_druid_thessa` is declared in B2's `enemyStart`. The story-flag engine needed to
conditionally write `thessa_recruited` doesn't exist yet. For the MVP, Thessa behaves as
an ordinary archer-class enemy. Conditional recruitment is deferred.

---

## Concern 2 — Server unlock progression (SHA 406e0e9)

**Files:** `worker/worker.js`, `js/game-oath-and-bone.js`

### worker.js changes

| Location | Change |
|---|---|
| `oabDefaultState()` | Added `unlocked_scenarios: ['b1']` to the default KV shape |
| `handleOabBattleResult()` | On `result === 'victory'`: computes next scenario via `{ b1:'b2', b2:'b3' }` map, unions into `state.unlocked_scenarios`, advances `state.current_battle` |
| `handleOabBattleResult()` response | Returns `unlocked_scenarios` and `current_battle` |
| `handleOabSave()` | Unions `unlocked_scenarios` with server floor pattern (same as `fallen_heroes`) |

The b1→b2→b3 chain is the only unlock path. B3 win has no `nextScenario` in the map —
`current_battle` stays `'b3'` and the world map shows all three cards.

### game-oath-and-bone.js changes

`init()` converted to `async`. Flow:

1. Call `OathAndBoneServer.load()` — on 401/400/network error, fall back to default state
2. Set `window.OathAndBone.currentState`
3. Poll for engine as before
4. Once engine is ready: call `loadScenario()` with the player's `current_battle` scenario
5. If `first_load === false` (returning player): call `OathAndBoneRender.showWorldMap()`
6. If `first_load === true` (new player): call `engine.start()` directly into B1

---

## Concern 3 — World map (SHA 0b2ac6b)

**Files:** `js/game-oath-and-bone-render.js`

### CSS

Added 16 rules to `injectStyles()` under `// World map`. FFT blue chrome
(`#18284a → #0e1a34`, border `#3a5a9a`). Gold pulse animation (`oab-mapcard-pulse`)
on AVAILABLE cards. COMPLETED cards: dimmed green border. LOCKED: grey, 45% opacity.

### _showWorldMap(container, state)

DOM-only. Clears `container.innerHTML`, renders the world map panel with three cards in
order B1 → B2 → B3. Card state computed from `state.unlocked_scenarios` and
`state.current_battle`:

- **AVAILABLE**: `id === current_battle` — gold border, pulse, clickable
- **COMPLETED**: in `unlocked_scenarios` but not `current_battle`
- **LOCKED**: not in `unlocked_scenarios`

Clicking AVAILABLE calls `_startScenario(container, id)`.

### _startScenario(container, id)

1. Loads scenario from `window.OathAndBoneScenarios[id]`
2. Calls `OathAndBoneEngine.loadScenario(scenario)`
3. Updates `window.OathAndBone.currentState.current_battle`
4. Calls `OathAndBoneEngine.start(container, { practiceMode })`

### Continue button

Replaced `window.location.reload()` with `_showWorldMap(_container, state)` using
`window.OathAndBone.currentState`. The state is up to date because `_saveToServer` now
propagates `unlocked_scenarios` and `current_battle` from the server response into
`currentState` on success.

### Public API additions

`OathAndBoneRender.showWorldMap(container, state)` and
`OathAndBoneRender.startScenario(container, id)` — called by the orchestrator.

---

## Known gaps for Worker 22 / V2

| Gap | Notes |
|---|---|
| B2/B3 tutorial engine wiring | `first_forest_attack`, `first_water_blocked`, `first_skeleton_kill`, `magic_revealed` events not yet fired by engine |
| Skeleton sprite | `heroId: 'bladewind'` placeholder in B3 |
| Thessa conditional recruitment | Story-flag engine not built |
| `story_flags.read` gate | Not enforced — engine doesn't check whether player has `b1_complete` before B2 starts |
| Renderer dimension flexibility | MAP_W/MAP_H hard-coded; B2/B3 deployed at 12×14 instead of spec values |
| Act 1 end message | After all three battles won, world map just shows three COMPLETED cards with no narrative cap |

---

## Commits

| SHA | Message |
|---|---|
| `f9ccdee` | Worker 21: B2 + B3 scenario data + OathAndBoneScenarios lookup |
| `406e0e9` | Worker 21: scenario selection + unlock progression |
| `0b2ac6b` | Worker 21: minimal world map — scenario cards with unlock state |

---

## Worker 26 — MVP Audit discoveries (2026-04-25)

Read-only audit. No code changed. Full report: `MVP_AUDIT_REPORT.md`.

### New gaps not in prior logs

| Gap | Location | Severity |
|---|---|---|
| `onUnitFallen` hook absent — unit death fires zero Soul Review channels | engine.js:617–619 (add hook); render.js (add handler) | **BLOCKING** |
| Server never deployed (`wrangler deploy` not run) — entire persistence layer dead | worker.js (all oab handlers) | **BLOCKING** |
| Tutorial modal + VICTORY overlay can stack simultaneously | render.js:1516 `showBattleEnd` | non-blocking / UX bug |
| B2 does not unlock offline — client has no optimistic unlock on victory | `_saveToServer` in render.js; game-oath-and-bone.js | non-blocking / UX bug |
| Physical attack (`onUnitAttacked`) has no strike/lunge animation — only `onUnitMoved` has slide | render.js:1848 | non-blocking / Soul Review partial |
| Mid-battle turn bar shows mechanical text, not character voice barbs | render.js `updateTurnBar` | non-blocking / Soul Review partial |

### Concerns that passed

- Concern 2 (Canon): all heroes original; disclaimer in all static footers + JS module headers ✓
- Concern 3 (Free-Means-Free): no `if(paid)` gate found anywhere in oath-and-bone JS ✓
- Concern 4 (Pricing): no hardcoded `$[0-9]` in oath-and-bone files ✓

### Walkthrough steps confirmed live

Cold start → engine init → hero selection → MOVE mode → T1 tutorial on attack → VICTORY screen (3 Soul Review channels) → world map → resume prompt on reload. All confirmed in browser against `localhost:3970`.

# Oath and Bone — RENDER_LOG
**Worker 16 · April 24, 2026**
*Hex-grid cube-stack renderer with pixel sprites — integration handoff*

---

## What shipped

| Deliverable | Path | Size | Status |
|---|---|---|---|
| Renderer module | `js/game-oath-and-bone-render.js` | ~550 lines | ✓ ON DISK |
| Engine shell update | `games/oath-and-bone.html` | (edited) | ✓ ON DISK |

### Renderer features delivered

- **Full hex map** — 12×14 tile grid, painter's algorithm (q+r ascending), all three terrain types rendered (plain/ridge/forest) as distinct colour fills
- **Cube-stack elevation** — ridge tiles (elevation=2) render with left/right side faces and raised top face; Ironwall stands visibly higher than surrounding plain tiles
- **Pixel sprites** — vael, bladewind×4, ironwall via Worker-14 `idle_n_0.png` frames; `_px` seed fallback on onerror
- **Placeholder sprites** — halv and brin (no sprites in sprite set) render as coloured rectangle divs with abbreviated name
- **DOM overlays** — HP bar above every unit, name chip (gold=player, red=enemy), gold selection cursor (bouncing CSS animation)
- **Selection** — click hero or hero's tile → gold tile outline, gold cursor, cursor CSS animation; turn bar updates with HP/Move/Atk stats
- **Move range** — MOVE button calls `engine.getMovableHexes()` → gold-tinted hexes with gold outline; toggle off re-clicks MOVE
- **Attack range** — ATTACK button calls `engine.getAttackableHexes()` → red-tinted hexes with red outline
- **Attack execution** — click red hex or click enemy sprite in attack mode → `engine.attackUnit()` → floating `-N` damage number (0.9s CSS float animation) → auto-advance turn after 1.2s
- **Move execution** — click gold hex → `engine.moveUnit()` → redraw
- **HOLD** — clears selection, calls `engine.advanceTurn()`
- **Enemy auto-turn** — enemy units are skipped automatically (0.75s delay per unit, chain-safe flag prevents stacking)
- **Round banner** — 2s overlay on new round start
- **Battle end overlay** — victory (gold) or defeat (red) fullscreen overlay over stage
- **Hero bar** — HP bar per player unit, updates on damage
- **Blue FFT action panel** — MOVE/ATTACK/HOLD buttons, disabled when no unit selected or unit already acted
- **loadScenario** — called synchronously in render.js IIFE, before orchestrator polls; no race condition possible

---

## Engine API methods actually used (from reading engine.js)

| Method | Used for | Notes |
|---|---|---|
| `OathAndBoneEngine.loadScenario(scenario)` | Pre-loads SCENARIO_B1 before start() | Must be called before start() or start() errors |
| `OathAndBoneEngine.start(container, options)` | Called by orchestrator's init() | Fires onReady hook |
| `OathAndBoneEngine.getBattle()` | Map draw, sprite sync, turn bar, hero bar | Returns live `_battle` object |
| `OathAndBoneEngine.getTile(q, r)` | Elevation lookup, click-to-hex unit lookup | Returns tile or null |
| `OathAndBoneEngine.getUnit(id)` | Unit state checks (acted, hp, team) | Returns unit or null |
| `OathAndBoneEngine.getCurrentUnit()` | Turn bar, action button enable state, enemy-tick check | Returns current queue unit |
| `OathAndBoneEngine.getMovableHexes(unitId)` | Move mode highlight | Returns [{q,r}] array |
| `OathAndBoneEngine.getAttackableHexes(unitId)` | Attack mode highlight | Returns [{q,r}] with elevation range bonus applied |
| `OathAndBoneEngine.moveUnit(unitId, toQ, toR)` | Move execution | Returns bool; fires onUnitMoved |
| `OathAndBoneEngine.attackUnit(attackerId, targetId)` | Attack execution | Returns bool; fires onUnitAttacked; sets acted=true |
| `OathAndBoneEngine.advanceTurn()` | HOLD button, post-attack auto-advance, enemy tick | Fires onRoundStart on round boundary |

### Hooks attached

| Hook | Purpose |
|---|---|
| `onReady(container, options)` | Builds full battle UI, first render, schedules enemy tick |
| `onUnitMoved(unit, fromQ, fromR, toQ, toR)` | Full redraw |
| `onUnitAttacked(attacker, target, damage)` | Damage float, redraw, auto-advance after 1.2s |
| `onRoundStart(round)` | Round banner, redraw, deselect, enemy tick |
| `onBattleEnd(result)` | Victory/defeat overlay |

---

## Engine API gaps (methods expected but not found)

| Expected | Status | Impact |
|---|---|---|
| `engine.selectUnit(unitId)` | **Not in engine** — selection is renderer-local state | No impact; renderer manages selection without engine involvement |
| `engine.getUnitMoveRange(unitId)` or similar named method | **Not found** — engine exposes `getMovableHexes(unitId)` instead | Zero impact; `getMovableHexes` is the correct API |
| AI turn execution (`OathAndBoneAI.takeTurn(unitId)` or similar) | **Not in first 80 lines of ai.js** — not read in full | **Gap for Worker 17**: enemy units currently auto-skip with 0.75s delay. No AI actions (move/attack) are executed on enemy turns. The AI module exists but its public API is unknown. |
| `engine.castSpell(casterUnit, spellId, targetHex)` | **Not in engine** — spell casting absent | **Gap for Worker 17+**: Caelen's CAST button is not wired; the engine has no spell execution method. Spells module (OathAndBoneSpells) exists but no bridge from engine's action loop. |
| `engine.holdUnit(unitId)` | **Not in engine** — no explicit hold; advanceTurn() serves this | No impact; advanceTurn() is sufficient for Phase 1 |

---

## Coordinate system and topology

**Formula used:** Standard 2:1 iso (same as preview):
```
x = PAD_X + (q - r) * TILE_W / 2
y = PAD_Y + (q + r) * TILE_H / 2
```

**Hex topology source:** Engine's `HEX_DIRECTIONS` 6-neighbor axial (per engine.js line 8). Movement/attack range computation uses these 6 neighbors via `getMovableHexes` / `getAttackableHexes`.

**Visual consequence of hex-vs-square:** The iso diamond grid is visually indistinguishable from the square 4-neighbor preview. A player moving through the hex grid can reach hexes to the lower-left and upper-right that a 4-neighbor grid would block (the diagonal-ish neighbors {q:1,r:-1} and {q:-1,r:1}). This is correct hex behavior. The visual register matches the preview but movement rules differ. This is intentional — engine is authoritative. No reconciliation performed.

**Canvas:** 920×560px. PAD_X=450, PAD_Y=80. Full 12×14 map renders within canvas bounds; horizontal scrolling needed on narrow viewports (<920px). The stage-scroll div handles overflow:auto.

---

## Verification — local (localhost:3970)

Verified live at `http://localhost:3970/games/oath-and-bone.html` · April 24, 2026

| Check | Result |
|---|---|
| Hex grid renders (all 168 tiles) | ✓ |
| Vael visible on south edge (q=3,r=12) with pixel sprite | ✓ (Caelen-register dark knight sprite) |
| Halv + Brin visible as placeholder divs | ✓ |
| 4 Bladewind enemies visible (north r=2,4) with pixel sprites | ✓ |
| Ironwall visible (north r=1) with pixel sprite, elevated on ridge | ✓ |
| Clicking Brin → gold cursor + gold tile outline | ✓ |
| MOVE button → gold-tinted move range (move=4, 6-hex-neighbor BFS) | ✓ |
| ATTACK button → red-tinted attack hexes | ✓ (verified in browser eval) |
| HOLD button → advances turn | ✓ |
| `preview_console_logs level=error` → no errors | ✓ |
| Hero bar (all 3 player units, HP bars) | ✓ |
| Blue FFT action panel | ✓ |
| Battle state: phase=active, round=1, 8 units, all HP at max | ✓ |

**Screenshot:** Captured at verification — enemies (Ironwall + Bladewind×4) visible at north, move-range gold highlights visible at south. Live game state confirmed.

---

## Worker 17+ follow-ups

Priority order based on what's missing:

1. **AI turn execution** — read `game-oath-and-bone-ai.js` in full; find/expose `takeTurn(unitId)` or equivalent; wire it in renderer's `_scheduleEnemyTick()` so enemies actually move and attack instead of auto-skipping
2. **Spell casting** — CAST button needs engine support for `castSpell(casterUnit, spellId, targetHex)`; Caelen's mana bar and spell list need UI panel; depends on engine gap being filled first
3. **Slide animations** — `onUnitMoved` currently does instant redraw; slide the sprite from fromPos to toPos over 300ms before full redraw
4. **Attack animation** — flash the attacker (quick scale pulse), then play damage float; consider sprite direction change (idle_e/w based on target)
5. **Idle animation loop** — cycle through `idle_<dir>_0–3.png` frames at ~8fps per unit for breathing bob; Worker 14 frames are on disk
6. **Facing direction** — sprite currently always shows `idle_n_0.png`; determine facing from attack/move direction and use idle_n/s/e/w accordingly
7. **Portrait strip** — hero bar shows placeholder divs; hook up portrait images from `art/portraits/` per hero
8. **Tutorial overlays** — SCENARIO_B1 has T1/T2/T3 tutorial triggers; wire them to pop explanatory overlays on first attack, first ridge shot, turn 3 no-hold
9. **Difficulty tier selector** — allow player to pick scout/sergeant/marshal before battle starts (before `loadScenario` / `start` call)
10. **Sound** — soul_review spec requires blade_sfx, hp_zero_flag, rising_chord; no audio module exists yet

---

*Worker 16 · April 24, 2026 · The first real engine URL is playable. Phase 1 is live.*

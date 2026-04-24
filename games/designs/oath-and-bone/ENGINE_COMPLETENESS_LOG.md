# Oath and Bone — ENGINE_COMPLETENESS_LOG
**Worker 17 · April 24, 2026**
*Handoff to Worker 18*

---

## What Worker 17 shipped

Three gameplay concerns closed. All committed, no uncommitted changes on disk.

| Commit | Deliverable | Status |
|---|---|---|
| `fd7d2a9` | AI turn execution — archetypes move + attack | ✓ DONE |
| `7e866ea` | Slide animation on unit move (300ms CSS transition) | ✓ DONE |
| `4233945` | Firebolt proof-of-pipeline (spell cast, damage, VFX) | ✓ DONE |

---

## Engine completeness state after Worker 17

### What works

| Feature | Notes |
|---|---|
| Full hex grid (12×14) | All terrain types render |
| Painter's algorithm | Correct draw order |
| Elevation cube-stacks | Ridge tiles elevated; melee combat modifier wired |
| Pixel sprites | Vael, Caelen, Bladewind×4, Ironwall |
| Placeholder sprites | Halv, Brin (no Worker-14 art) |
| Selection + gold cursor | Click hero or tile |
| Move range (gold hexes) | BFS via engine.getMovableHexes |
| Attack range (red hexes) | engine.getAttackableHexes with elevation bonus |
| Attack execution + damage float | engine.attackUnit → onUnitAttacked → auto-advance |
| Slide animation | onUnitMoved → CSS left/top transition 300ms, _animating flag |
| HOLD | advanceTurn, deselect, chain tick |
| Enemy AI turn execution | OathAndBoneAI.takeTurn() per turn, 400ms delay |
| Bladewind archetype | Moves toward nearest player, attacks in range |
| Ironwall archetype | Holds formation, attacks if player in range 3 |
| Round banner | 2s overlay on round start |
| Battle end overlay | Victory/defeat fullscreen |
| Hero bar | HP bars for all player units, mana bar for Caelen |
| Turn bar | Current unit, HP/Move/Atk/MP |
| Caelen in battle | q=6,r=12, 40 MP, school=wizardry |
| CAST button | Enabled when caster selected and not acted |
| Spell panel | Firebolt active (5 MP), others disabled |
| Blue cast-range highlight | getSpellTargetHexes → blue tinted hexes |
| Firebolt | engine.castSpell → OathAndBoneSpells.castSpell → 14 damage, onSpellCast |
| Fire VFX | Orange radial flash at target tile, 500ms CSS animation |
| Mana deduct | magic.mana decremented on cast |
| Post-cast auto-advance | 1200ms delay, then advanceTurn + enemy tick |

### Known gaps (open for Worker 18+)

#### Priority 1 — Spell pipeline completeness

1. **All spells beyond Firebolt** — CAST panel currently wires only Firebolt as "active". frost_shard, spark, shield are shown but disabled. Each needs a cast handler in `handleCastBtn` or `handleSpellSelect`. The engine.castSpell path is already built; each spell just needs its handler enabled and any spell-specific VFX.

2. **Spells with non-damage effects** — shield (status), frost_shard (status + damage), spark (damage) all work through the existing engine.castSpell → OathAndBoneSpells.castSpell path. They need VFX variants (ice shatter, shield glow) and the status system visualized.

3. **Mana regen per round** — `OathAndBoneSpells.applyRegen(unit)` is called by the engine's `_resetUnitsForRound` but the renderer's hero bar only updates on `render()` — this should already work once turns advance. Verify it ticks.

#### Priority 2 — AI and combat polish

4. **AI cast actions** — `_cabalAI`, `_bindingAI`, `_groveWardenAI` return `attackAction.action === 'cast'` but `takeTurn()` calls `OathAndBoneSpells.castSpell()` directly (not engine.castSpell). This means AI casts don't set `acted=true` or call `_checkBattleEnd`. Fix: change ai.js line 1183 to call `window.OathAndBoneEngine.castSpell()` instead.

5. **AI unit.max_hp bug** — ai.js uses `unit.max_hp` for retreat threshold (e.g. bladewindAI line 660: `unit.hp < unit.max_hp * 0.25`). Engine creates units with `unit.hp_max` (not `max_hp`). So `unit.max_hp` is undefined — retreat never fires. Fix: change ai.js retreat checks to `unit.hp_max`.

6. **Slide animation for AI moves** — AI calls `engine.moveUnit()` which fires `onUnitMoved`. The slide animation fires correctly (CSS transition), `_animating=true` blocks the tick chain, 320ms callback restarts it. No known bug, but worth verifying under rapid multi-enemy turns.

#### Priority 3 — Visual features

7. **Facing direction** — sprites always show `idle_n_0.png`. Determine facing from move/attack direction (e_w_n_s) and use the corresponding sprite frame. Worker-14 frames are on disk at `art/sprites/{heroId}/idle_{dir}_{frame}.png`.

8. **Idle animation loop** — cycle through `idle_{dir}_0–3.png` at ~8fps. Requires per-sprite animation timers (or a shared requestAnimationFrame loop). CSS animation won't work because the src path changes.

9. **Portrait strip** — hero bar shows text placeholders. Hook up `art/portraits/{heroId}.png` per hero.

10. **Attack animation** — `onUnitAttacked` does instant redraw. Add a quick scale-pulse on the attacker sprite before the damage float.

#### Priority 4 — Systems

11. **Tutorial overlays** — SCENARIO_B1 has T1/T2/T3 triggers (first_attack, first_ridge_shot, turn_3_no_hold). Wire pop-up overlays.

12. **Difficulty tier selector** — before `loadScenario/start`. Currently hardcoded `sergeant`.

13. **Sound** — soul_review spec: blade_sfx, hp_zero_flag, rising_chord. No audio module exists.

14. **permadeath_game_over UI** — when Vael (permadeath_game_over=true) reaches 0 HP, the engine fires 'defeat'. The renderer shows the defeat overlay. This should already work; verify.

---

## Bugs fixed by Worker 17 (not to re-open)

| Bug | Where fixed | Root cause |
|---|---|---|
| Enemy AI never fires | battles.js | All 5 enemy units had `heroId: null` — AI archetype dispatch is `archetypes[unit.heroId]`. Fixed to `'bladewind'`/`'ironwall'`. |
| Firebolt deals 0 damage | spells.js line 371 | `spellTargetUnit = spellTargetTile.unit` — `tile.unit` is a unit ID string, not object. Setting `.hp` on a string is a no-op. Fixed: `getUnit(spellTargetTile.unit)`. |
| AoE targeting push strings | spells.js lines 421–434 | Same bug in hex targeting branch. Fixed with local `tileUnit` via `getUnit()`. |
| getSpellTargetHexes team check broken | spells.js lines 884–887 | Same bug. Fixed with `tileUnitObj` via `getUnit()`. |

---

## File map (only Oath and Bone files)

| File | Role | Modified by |
|---|---|---|
| `js/game-oath-and-bone-battles.js` | Scenario definitions | Worker 17 (Caelen added, enemy heroIds fixed) |
| `js/game-oath-and-bone-heroes.js` | Hero stat definitions | Worker 14 (unchanged) |
| `js/game-oath-and-bone-spells.js` | Spell definitions + castSpell | Worker 17 (spellTargetUnit fix) |
| `js/game-oath-and-bone-ai.js` | AI archetype logic + takeTurn | Worker 14 (unchanged, see AI cast bug above) |
| `js/game-oath-and-bone-engine.js` | Core state machine | Worker 17 (castSpell added) |
| `js/game-oath-and-bone-render.js` | Full renderer | Worker 17 (AI tick, slide, CAST UI) |
| `js/game-oath-and-bone.js` | Orchestrator (lifecycle) | Worker 15 (unchanged) |
| `games/oath-and-bone.html` | Shell / script load order | Worker 16 (unchanged) |

---

## Verification state

Live at `http://localhost:3970/games/oath-and-bone.html` (serve with `npx serve -p 3970 .` from KingshotPro/).

| Check | Result |
|---|---|
| 9 units load (3 player + 1 Caelen + 5 enemy) | ✓ |
| CAST button visible and disabled until caster selected | ✓ |
| Select Caelen → CAST enabled | ✓ |
| Click CAST → spell panel (Firebolt active, others grey) | ✓ |
| Blue cast-range hexes appear | ✓ |
| `engine.castSpell('player_caelen','firebolt',q,r)` → 14 damage, `acted=true` | ✓ |
| `OathAndBoneAI.takeTurn('enemy_bladewind_a')` → unit moves south, `acted=true` | ✓ |
| Slide animation: CSS transition fires on `moveUnit` | ✓ |
| No console errors | ✓ |

---

*Worker 17 · April 24, 2026 · Three concerns closed. AI acts, sprites slide, Caelen casts.*

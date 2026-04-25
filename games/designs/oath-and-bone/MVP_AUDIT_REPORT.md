# MVP Audit Report — Oath and Bone

*Worker 26. 2026-04-25. Read-only audit against six pre-launch concerns.*
*Primary sources read directly per Principle XXII. All file:line citations are verified.*

---

## Executive Summary

| Concern | Verdict |
|---|---|
| 1 — Soul Review | PARTIAL |
| 2 — Canon / Disclaimer | PASS |
| 3 — Free-Means-Free | PASS |
| 4 — Pricing Single-Source | PASS |
| 5 — Live Walkthrough | PARTIAL |
| 6 — Server Cheat Protection | PARTIAL |

**One hard blocker before public launch: the server has not been deployed.** Both Worker 22 (cache) and Worker 23 (server) code is committed but `wrangler deploy` has not been run. Every server endpoint (`/oath-and-bone/save`, `/load`, `/spend`, `/battle-result`) is non-functional in production. Crown earn, campaign unlock, and cheat protection all route through server — none of it works.

A second blocker for quality: the unit-fallen event fires zero feedback channels. A player hero dying silently disappears on the next canvas redraw. No desaturate, no HP=0 callout, no narrative party line.

Both are documented in FEEDBACK.md.

---

## Concern 1 — Soul Review

**Verdict: PARTIAL**

DESIGN.md §Soul Review requires 3+ non-audio channels per major combat event (audio deferred to Worker 25).

### Battle end — PASS

`showBattleEnd()` in `render.js:1516`:

| Channel | Implementation | Status |
|---|---|---|
| Visual | `"VICTORY"` / `"DEFEAT"` title, `oab-overlay-title` CSS class (render.js:1536–1537) | ✓ |
| Numerical | XP / Crowns / Credits reward rows (render.js:1546–1551) | ✓ |
| Narrative | Advisor barb from `_VICTORY_BARBS` / `_DEFEAT_BARBS` (render.js:1436–1439) | ✓ |
| Audio | TODO Worker 25 comment at render.js:1540–1541 | deferred |

Browser-confirmed: VICTORY title in gold, XP 60 / CROWNS 50 / CREDITS 0, barb "Got him." all render. 3 non-audio channels present.

### Spell cast — PARTIAL (2 of 3)

`OathAndBoneSpells.onSpellCast` hook at `render.js:1894`:

| Channel | Implementation | Status |
|---|---|---|
| Visual | `showSpellOrAbilityVFX(spellId, ...)` → CSS class per spell, `_VFX_MAP` at render.js:1165–1183 | ✓ |
| Numerical | `showDamage()` / `showHeal()` floating number (render.js:1901–1906) | ✓ |
| Narrative | `updateTurnBar('Cast: wizard — 12')` — mechanical string, not a character voice barb | MISSING |
| Audio | TODO Worker 25 | deferred |

The turn bar text is a data dump, not narrative. DESIGN.md calls for a voice barb on every major event. 2 of 3 non-audio channels.

### Physical attack — PARTIAL (1–2 of 3)

`OathAndBoneEngine.onUnitAttacked` hook at `render.js:1848`:

| Channel | Implementation | Status |
|---|---|---|
| Visual | `render()` redraws map; HP bar visually depletes. No strike/lunge animation for the attack itself — only `onUnitMoved` has a slide (render.js:1831–1840). | PARTIAL — bar update present, spec "slide" missing |
| Numerical | `showDamage(target, damage)` floating number (render.js:1374–1383) | ✓ |
| Narrative | `updateTurnBar('Attack: vael → -9 HP')` — mechanical string. BATTLES.md B1 spec calls for "Halv barb (4 ch)". | MISSING |
| Audio | TODO Worker 25 | deferred |

Browser-confirmed: `-9` float appears, HP bar updates. No attack lunge animation; turn bar shows raw damage string not character voice. 1 firm channel (numerical); visual is a partial at best.

### Unit falls — FAIL (0 channels)

No `onUnitFallen` event exists anywhere in the engine.

When a unit reaches `hp === 0`, engine.js:618 sets `permadeath_loss = true`. No hook is fired. The renderer discovers the death on the next `render()` call when `syncSprites()` (render.js:731) skips units with `hp <= 0` — the sprite simply disappears.

DESIGN.md spec: "Kill = desaturate 0.5s + low tone + HP=0 flag + party line (4 ch)."

Delivered: 0 dedicated channels. The damage float from the killing blow is the only implicit signal, and it fires through the attack hook, not a death hook.

**Fix required:** Add `onUnitFallen` callback to the engine (fired from `engine.js:617–619` block) and wire a death handler in render.js: desaturate/fade sprite, HP=0 callout, narrator line.

---

## Concern 2 — Canon / Disclaimer

**Verdict: PASS**

### Hero name check

Canonical Kingshot heroes from `worker.js:15`: Amadeus, Jabel, Helga, Saul, Zoe, Hilde, Marlin, Petra, Eric, Jaeger, Rosa, Alcar, Margot, Vivian, Thrud, Long Fei, Yang, Sophia, Triton, Chenko, Amane, Yeonwoo, Gordon, Howard, Quinn, Diana, Fahd.

Oath and Bone cast: Vael, Halv, Brin, Caelen, Marrow, Thessa, Kavess, Talia, Orik, Hollow Child (heroes); Esra Vellum (antagonist).

No overlap. All hero names are original. ✓

### Disclaimer surfaces

All static HTML pages contain the footer "Unofficial. Not affiliated with Century Games." (confirmed via grep across `games/*.html`). ✓

All JS modules carry `var DISCLAIMER = 'Unofficial. Not affiliated with Century Games.';` at line 1: engine.js, heroes.js, battles.js, spells.js, abilities.js, ai.js, game-oath-bone.js (all confirmed via grep). ✓

The DISCLAIMER variable is used in the orchestrator's loading and error state screens (game-oath-and-bone.js:43, 255, 261). ✓

The render.js `_showWorldMap` and `showBattleEnd` components do not inject the disclaimer into their DOM output — but the static HTML page footer is always visible below these overlays. Browser-confirmed: world map screenshot, VICTORY screen screenshot, resume prompt screenshot — all show the footer disclaimer. No player-facing surface is ever disclaimer-free.

### "Furnace" references

`worker.js:16–17` GROUNDING_APPENDIX uses "Furnace" terminology. This is documented as a separate fix task in SUCCESSION_V2.md and BLUEPRINT_PROMPT.md — outside Oath and Bone scope. No "Furnace" appears in any Oath and Bone game files.

---

## Concern 3 — Free-Means-Free

**Verdict: PASS**

Grepped `if\s*\(\s*(paid|subscriber|pro|premium|isPro|hasPro|subscription)` across all `game-oath-and-bone*.js` files: **no matches**. No content gate in any oath-and-bone JS file.

Defeat rewards: `_computeRewards()` at `render.js:1399–1410` returns `{ xp: 15, crowns: 10, credits: 0 }` for defeat. Players earn Crowns even on loss. ✓

No nag/upsell popup found in render.js, engine.js, or game-oath-and-bone.js.

Server-side negative balance rejection: `worker.js:1670–1673` — if `crown_balance < 0`, `/save` returns 400 `invalid_crown_balance`. ✓

Server-side spend check: `worker.js:1793–1797` — if `balance < amount`, `/spend` returns 402 `insufficient_crowns`. ✓

---

## Concern 4 — Pricing Single-Source-of-Truth

**Verdict: PASS**

Grepped `\$[0-9]` across all `.js` and `.html` files in the repo. Hits in oath-and-bone scope: **none**. All hits were in `pricing-config.js`, `pricing.html`, `support.html`, `about.html`, `verify.html` (authorized) or `games/lightfront/index.html` (different game, not in scope) or `advisory.js` dollar-tier descriptions (non-price text).

Crown reward amounts in scenarios come from `scenario.rewards.crowns` in `game-oath-and-bone-battles.js` — these are game rewards, not sell prices. They are not in scope for the pricing single-source rule. ✓

---

## Concern 5 — Live Functional Walkthrough

**Verdict: PARTIAL**

Server `kingshotpro-static` running on port 3970. All steps tested against `/games/oath-and-bone.html` with cleared localStorage.

| Step | Result | Evidence |
|---|---|---|
| 1. Cold start (no localStorage) | PASS | Navigated; engine init logged |
| 2. Engine init | PASS | `getBattle()` → `{round:1, phase:'active', currentUnit:'player_brin'}` |
| 3. Hero selection on canvas | PASS | Click BRIN → turn bar: "BRIN HP 95/95 Move 4 Atk 3 Choose an action." |
| 4. MOVE mode | PASS | `getMovableHexes('player_brin')` → 35 valid hexes |
| 5. T1 tutorial on first player attack | PASS | `tutorials_fired:{T1:true}`, modal: "Troop triangle: infantry beats cavalry..." |
| 6. Battle-end screen (victory) | PASS | VICTORY title, XP 60 / CROWNS 50, "Got him." barb |
| 7. CONTINUE → world map | PASS | "ACT I — THE BORDERLANDS", B1 AVAILABLE, B2/B3 locked |
| 8. Resume prompt on reload | PASS | "BATTLE IN PROGRESS · moments ago — round 1 of B1 · RESUME / START FRESH" |
| 9. B2 start after B1 win | FAIL | B2 locked — server not deployed; win-unlock is server-only |
| 10. B3 defeat + reload resume | NOT RUN | Blocked by step 9 |

### Bugs found during walkthrough

**Bug A — Tutorial + battle-end modal stacking.** If a tutorial modal (T1) is displaying when the battle ends simultaneously, `showBattleEnd()` (render.js:1516) does not check `_tutorialModalOpen`. Both overlays render on top of each other. Browser-confirmed: VICTORY box visible behind T1 modal. Fix: guard `showBattleEnd` behind `_tutorialModalOpen`, or clear tutorial modals before showing battle end.

**Bug B — B2 does not unlock offline.** `_saveToServer()` calls `OathAndBoneCache.recordBattleResult()`, which writes local history immediately — but the scenario unlock (`unlocked_scenarios`) is returned only in the server response (`handleOabBattleResult`, worker.js:1953). Client does not optimistically unlock B2. With server down, campaign progression is permanently broken. Fix: on victory, client should optimistically add the next scenario to `OathAndBoneCache.getState().unlocked_scenarios` before the server call confirms.

**Bug C — World map card state.** B1 shows as AVAILABLE (not COMPLETED) after winning because `currentState.unlocked_scenarios` / `current_battle` were not updated before `_showWorldMap` was called (save failed, server down). Related to Bug B.

---

## Concern 6 — Server-Side Cheat Protection

**Verdict: PARTIAL**

**Critical caveat: the server has not been deployed.** `wrangler deploy` was not run per SERVER_PERSIST_LOG.md. All analysis below is code review against the committed `worker/worker.js`. Live curl tests cannot be performed.

| Test | Code verdict | File:line |
|---|---|---|
| Spend over balance | PASS — `balance < amount` → 402 `insufficient_crowns` | worker.js:1793–1797 |
| Malformed body | PASS — `try { JSON.parse } catch` → 400 `bad_request` | worker.js:1774 |
| Un-fall permadeath hero | PASS — `Set` union on `fallen_heroes`; client list can only grow | worker.js:1695–1703 |
| Race condition on spend | PASS — 3-attempt read-modify-write with version re-read; 503 on contention | worker.js:1788–1839 |
| Invalid spend context | PASS — `OAB_SPEND_CONTEXTS.has(context)` → 400 | worker.js:1782–1783 |
| Negative balance on save | PASS — `crown_balance < 0` → 400 | worker.js:1670–1673 |

Note: the version-check loop is not true CAS (Cloudflare KV doesn't expose CAS), but the re-read before write narrows the race window. Worker 23 acknowledged this in the comments (worker.js:1806–1808). Acceptable for single-player game state.

**Known gap:** `/save` accepts any non-negative `crown_balance` the client supplies (worker.js:1670–1674). A cheat tool sending `/oath-and-bone/save` with `crown_balance: 9999999` would be accepted. The `/spend` debit check only protects against spending beyond what the server holds — not against client-injected inflation via `/save`. This is out of scope for the specified four tests but is noted for V2.

---

## Gaps Discovered During Audit (Not in Prior Logs)

These are new findings not documented in any prior worker log:

1. **`onUnitFallen` missing** — Engine fires no event on unit death. DESIGN.md Soul Review fails entirely for this event. (Concern 1)
2. **Tutorial + battle-end stacking** — `showBattleEnd()` does not guard against `_tutorialModalOpen`. (Concern 5 / Bug A)
3. **Offline B2 unlock broken** — Client has no optimistic unlock on victory; campaign progression requires server. (Concern 5 / Bug B)
4. **SNAPSHOT auto-write not triggering from victory-phase state** — When `_snapshotBattle()` is called while `_battle.phase !== 'active'` (e.g. immediately after battle end), the guard at engine.js:240 silently returns. The snapshot IS written correctly during active play. Not a bug per se, but worth noting: if a player closes the tab in the fraction of a second after `_checkBattleEnd()` sets phase to 'victory' but before `showBattleEnd` returns, the snapshot will not be written. Low risk.

---

*Worker 26, 2026-04-25. Read-only. No files modified except this report.*

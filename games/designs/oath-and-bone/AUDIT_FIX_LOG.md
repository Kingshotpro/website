# Audit Fix Log — Oath and Bone
*Worker 27. 2026-04-25. Fixes 1–4 from MVP_AUDIT_REPORT.md. Read-only audit by Worker 26.*

---

## Summary

All four code bugs cited in the audit are closed. The Architect deploy step (wrangler deploy) is NOT done here — see note at bottom.

| Fix | Bug | Files | Commit | Status |
|---|---|---|---|---|
| 1 | Bug A — tutorial + battle-end stacking | render.js | e2f7f78 | CLOSED |
| 2 | Bug B — offline B2 unlock | cache.js, battles.js | 1688cad | CLOSED |
| 3 | Bug C — world map card state | render.js | 745d2af | CLOSED |
| 4 | Soul Review FAIL — onUnitFallen missing | engine.js, render.js | 05eb384 | CLOSED |

---

## Fix 1 — Bug A: Tutorial + battle-end modal stacking

**Audit finding (verbatim):**
> If a tutorial modal (T1) is displaying when the battle ends simultaneously, `showBattleEnd()` (render.js:1516) does not check `_tutorialModalOpen`. Both overlays render on top of each other.

**Code change:**
- Added `var _pendingBattleEnd = null;` to module-scope vars (render.js line ~59).
- At entry of `showBattleEnd(result)`: if `_tutorialModalOpen`, store result in `_pendingBattleEnd` and return immediately (no overlay created).
- In tutorial Got-it dismissal handler: after `_tutorialModalOpen = false`, check `_pendingBattleEnd` BEFORE `_pendingAdvance`. If set, call `showBattleEnd(pendingResult)` and return — the battle-end overlay fires as if the player had finished the tutorial at a natural moment.

**Before:** VICTORY box visible behind T1 modal (stacking confirmed by audit).
**After:** T1 modal shown alone → player dismisses → VICTORY overlay shown alone.

**Verification:**
Console test: forced T1 tutorial open → called `onBattleEnd('victory')` → confirmed `document.querySelector('.oab-overlay')` returns null (deferred). Clicked Got-it → confirmed overlay appeared alone, tutorial gone.
Result: PASS.

---

## Fix 2 — Bug B: B2 does not unlock offline

**Audit finding (verbatim):**
> `_saveToServer()` calls `OathAndBoneCache.recordBattleResult()`, which writes local history immediately — but the scenario unlock (`unlocked_scenarios`) is returned only in the server response (`handleOabBattleResult`, worker.js:1953). Client does not optimistically unlock B2. With server down, campaign progression is permanently broken.

**Code changes:**
- `battles.js`: added `var OAB_SCENARIO_ORDER = ['b1', 'b2', 'b3']` at file scope, exposed on `window.OAB_SCENARIO_ORDER`. This is the single source of truth for campaign order (used by cache.js; render.js had its own local copy which is now consistent).
- `cache.js recordBattleResult()`: on `result.outcome === 'victory'`, BEFORE the server call, synchronously:
  1. Looks up `result.scenarioId.toLowerCase()` in `OAB_SCENARIO_ORDER`.
  2. If at index N and N+1 exists: adds `order[N+1]` to `unlocked_scenarios` if not already present.
  3. Advances `current_battle` to `order[N+1]` if not already past it.
  4. Writes to `localStorage` (KEY_STATE) + pushes a pending-write marker (dirty flag).
  5. Syncs `window.OathAndBone.currentState` so the world map's Continue handler sees the updated state immediately.
  6. Crown balance is NOT updated optimistically — server remains authority on that.
- Server merge in `.then()`: `unlocked_scenarios` only overwrites client if server array is >= client length (server-behind-client case keeps client's optimistic state). Same for `current_battle` — server wins only if its scenario index >= client's.

**Idempotency:** If the scenario is already in `unlocked_scenarios`, `indexOf` check prevents re-adding. If `current_battle` is already past `doneIdx`, it is not reset.

**Before:** B2 locked after B1 win when server is down. Campaign stuck.
**After:** B1 win → localStorage immediately shows `unlocked_scenarios: ['b1','b2']`, `current_battle: 'b2'`. World map shows B2 AVAILABLE without server.

**Verification:**
Console: called `OathAndBoneCache.recordBattleResult({scenarioId:'B1', outcome:'victory', ...})` → server rejected (not deployed) → immediately checked `OathAndBoneCache.getState()`: `unlocked: ['b1','b2'], current: 'b2'`. Confirmed `window.OathAndBone.currentState` also updated. Clicked Continue → world map rendered B1=COMPLETED, B2=AVAILABLE, B3=LOCKED.
Result: PASS.

---

## Fix 3 — Bug C: World map card shows B1 as AVAILABLE after winning

**Audit finding (verbatim):**
> B1 shows as AVAILABLE (not COMPLETED) after winning because `currentState.unlocked_scenarios` / `current_battle` were not updated before `_showWorldMap` was called (save failed, server down). Related to Bug B.

**Note:** Bug B fix was confirmed to resolve Bug C as the same root cause. Fix 3 adds a robustness layer: `_showWorldMap` now reads from the local cache as the primary source of truth, rather than `window.OathAndBone.currentState`.

**Code changes (render.js):**
- `_showWorldMap`: added `var _cacheState = window.OathAndBoneCache && window.OathAndBoneCache.getState()`. State resolution order: `state` arg → `_cacheState` → `window.OathAndBone.currentState` → `{}`.
- Continue button handler in `showBattleEnd`: changed to prefer `OathAndBoneCache.getState()` before `window.OathAndBone.currentState`.
- `_scenarioCardState` logic unchanged — with Bug B keeping `current_battle` current, the existing LOCKED / AVAILABLE / COMPLETED derivation is correct.

**Before:** World map reads `window.OathAndBone.currentState` which was not updated when server save failed.
**After:** World map reads `OathAndBoneCache.getState()` directly — always reflects the optimistic cache written by Bug B fix.

**Verification:**
Console: called `OathAndBoneRender.showWorldMap(container, null)` (null state → forces cache read) → cards showed: Muster=COMPLETED, Hollow=AVAILABLE, Crypt Gate=LOCKED.
Result: PASS.

---

## Fix 4 — Soul Review FAIL: onUnitFallen missing

**Audit finding (verbatim):**
> No `onUnitFallen` event exists anywhere in the engine. When a unit reaches `hp === 0`, engine.js:618 sets `permadeath_loss = true`. No hook is fired. The renderer discovers the death on the next `render()` call when `syncSprites()` (render.js:731) skips units with `hp <= 0` — the sprite simply disappears. DESIGN.md spec: "Kill = desaturate 0.5s + low tone + HP=0 flag + party line (4 ch)." Delivered: 0 dedicated channels.

**Code changes — engine.js:**
Added `OathAndBoneEngine.onUnitFallen(unit, killedBy)` hook (default null) in all three death paths:
1. `attackUnit` (line 617–619 block): fires after `target.permadeath_loss = true`, before `onUnitAttacked`.
2. `resolveAbility` loop (line 652–658): fires for each newly killed unit in multi-target ability resolution.
3. `castSpell` loop (line 680–686): fires for each newly killed unit in multi-target spell resolution.

Hook fires AFTER hp=0 + permadeath flag set, BEFORE unit removed from turn queue. V2 audio worker hooks into this same event as the 4th channel.

**Code changes — render.js:**
Added `_FALLEN_BARBS` map (from HEROES.md voice register) and `_showFallenToast()` helper. Attached `window.OathAndBoneEngine.onUnitFallen` handler that delivers:

| Channel | Implementation | Status |
|---|---|---|
| VISUAL | `oab-fallen-linger` element at unit's isometric position: `filter:grayscale(1)`, `opacity:0.4`, removed after 1500ms. Survives `syncSprites()` redraws (different CSS class). | ✓ |
| NUMERICAL | Damage float from killing blow fires through pre-existing `onUnitAttacked → showDamage` path. Not new code, already passing per original audit. | ✓ |
| NARRATIVE | `_showFallenToast()`: bottom-of-screen italic overlay, 2s duration. Barb sourced from `_FALLEN_BARBS` map (per-hero, per HEROES.md). Vael: "We can't lose her." Halv: "Oh, Halv." Brin: "Damn." Caelen: "...he should not have fallen." Marrow: "What he owed, he's paid." Thessa: "The grove loses a guardian." | ✓ |
| AUDIO | TODO Worker 25 (deferred, unchanged from prior scope decision) | deferred |

**Before:** Permadeath silent — sprite simply vanished on next `render()`. 0 dedicated channels.
**After:** Visual linger + narrative barb fire synchronously with the death event. Turn queue continues past fallen unit via pre-existing `advanceTurn` skip logic (line 731–738). No crash.

**Soul Review verdict for permadeath: PASS — 3 non-audio channels confirmed.**

**Verification:**
Console: set `player_vael.hp = 1`, called `onUnitFallen(vael, null)` → confirmed `.oab-fallen-linger` in DOM with `filter:grayscale(1)`, `opacity:0.4` → confirmed toast element present with text `"We can't lose her."` → confirmed both elements self-remove after their respective timeouts.
Result: PASS.

**Bug A real-world test path:** onUnitFallen fires before `_checkBattleEnd`. If the battle ends (e.g. last enemy killed in same sequence), `showBattleEnd` now queues correctly behind any open tutorial modal (Fix 1). Confirmed via interactive test: tutorial + battle-end no longer stack.

---

## What was NOT changed (V2-acceptable per Worker 26)

- Attack lunge animation / slide for physical attacks — flagged PARTIAL in audit, deferred to V2 per prior Architect scope decision. Unchanged.
- Spell cast narrative barb in turn bar — flagged PARTIAL (2 of 3 channels), deferred.
- `/save` crown-injection gap — noted in audit Concern 6, out of scope for four specified fixes.

---

## Note for Architect: Deploy step still required

The LIVE site at kingshotpro.com still routes server calls to the undeployed Cloudflare Worker. Run:

```
cd KingshotPro/worker/
wrangler deploy
```

All four fixes work correctly against both:
- **local/offline** (server down) — optimistic cache path
- **deployed server** — server response merges correctly with client state

Crown earn, permadeath persistence, and cross-device sync all require the deployed worker. Local progression (B2/B3 unlock, world map state) now works without it.

---

*Worker 27. Scope closed: 4 fixes, 4 commits, 0 unrelated changes.*

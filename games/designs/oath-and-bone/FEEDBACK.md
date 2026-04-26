# Architect feedback terminal

Write here to redirect the autonomous build. The orchestrator reads this file at the start of every cycle and checks whether its mtime has advanced past `last_feedback_processed` in BUILD_STATUS.md. Free-form — no template required.

---

## Art delivery: Frames 13–15 + Ring Track + Cutscenes — 2026-04-24

Delivered off-queue (ahead of BATTLES.md + ART_DIRECTION.md, which were listed as higher priority in the prior succession). Justification: the art assets were already partially commissioned in the prior session and the delivery mechanism (IndexedDB-ZIP) was solved — completing the run cost less context than re-explaining it to the next Claude.

All 30 files on disk. Log files written. STORY_SUCCESSION.md updated. Composite plate built.

If the sequencing was wrong — BATTLES.md first was the standing direction — note it here and next Claude will pick up BATTLES.md before any further art work.

---

## FLAG: MJ subscription tier — non-blocking (2026-04-24)

Phase 1 has no art tasks. Phase 2 art pipeline (P2-01, P2-11, P2-12) requires Midjourney Pro or Mega for commercial use rights. Prior sessions generated 168 assets — confirm whether that was on Pro/Mega before Phase 2 begins. No action needed now. Orchestrator will re-check at Phase 2 gate.

---

Worker 12: visual prototype ready at games/oath-and-bone-preview.html — open locally or deploy to staging, redirect aesthetic direction if off.

---

## AUDIT FLAGS — Worker 26, 2026-04-25

MVP audit complete. Two findings block public launch. Full verdicts in MVP_AUDIT_REPORT.md.

### BLOCKER 1 — Server not deployed

`wrangler deploy` has never been run. Worker 22 + 23 code is committed but every server
endpoint is dead (`/oath-and-bone/save`, `/load`, `/spend`, `/battle-result`). In production:
- Crown balance is never saved between sessions
- B2 never unlocks after B1 win — all players stuck on B1 forever
- All server-side cheat protections are inactive
- Battle-end shows "Save failed — will sync on next play." every time

Fix: run `wrangler deploy` from `worker/`. Confirm with curl `/oath-and-bone/load`.

### BLOCKER 2 — Unit death fires zero feedback channels (Soul Review)

No `onUnitFallen` hook exists in the engine. When a unit reaches hp=0, it vanishes silently
from the canvas on the next syncSprites() pass. DESIGN.md requires 3 non-audio channels on
unit death (desaturate, HP=0 float, party line). None fire.

Fix outlined in MVP_AUDIT_REPORT.md §Concern 1 / Unit falls. Two-line engine add +
~10-line render hook.

### Non-blocking (next worker picks up)

- Tutorial modal + VICTORY overlay can stack simultaneously if battle ends while T1 showing
- B2 doesn't unlock offline — client needs optimistic unlock on victory before server confirms
- Physical attack has no strike/lunge animation (onUnitMoved has slide, onUnitAttacked doesn't)
- Mid-battle turn bar is mechanical text, not character voice barbs (DESIGN.md calls for per-event barbs)

All non-blocking gaps are detailed in MVP_AUDIT_REPORT.md §Concern 5 and §Gaps Discovered.

---

## AUDIT FLAGS — Worker 29, 2026-04-26

Full system audit complete. Verdict: CONDITIONAL GO. Full evidence in SYSTEM_AUDIT_REPORT.md.

### SHIP CONDITION — Disclaimer missing from ad overlays (severity: REQUIRED)

ECONOMY.md §10 requires "Unofficial. Not affiliated with Century Games." on every ad surface. It is absent from:
- `_tryInterstitial()` overlay (render.js:2404–2487)
- `_showRewardedVideoStub()` overlay (render.js:2512–2575)

Fix: append a footer div to each overlay before `document.body.appendChild(overlay)`:
```javascript
var disc = document.createElement('div');
disc.style.cssText = 'font-size:9px;color:#5a7a9e;margin-top:10px;text-align:center';
disc.textContent = 'Unofficial. Not affiliated with Century Games.';
overlay.appendChild(disc);
```
This is the only item blocking ship. 2-line edit per overlay.

### CRITICAL (revenue) — `crowns_earned` server trusts client

`handleOabBattleResult` (worker.js:2075–2091) accepts client-submitted `crowns_earned` capped at 1,000 (worker.js:1814). Server does not recompute from `scenario_id` + `difficulty_tier`. A cheater posting 1,000 instead of the legitimate 45–80 receives 12–20× the correct amount per battle. Does not enable real-world financial fraud (Crowns are not cash-equivalent) but breaks the pay-to-accelerate model.

Fix path (Worker 30+): add a `OAB_BATTLE_REWARDS` lookup table on the server keyed by `scenario_id` + `difficulty_tier`. Validate client-submitted `crowns_earned` is within ±25% of the server-computed value to allow for multipliers.

### MEDIUM — `oabApplyCrownGrant` no CAS retry (worker.js:1087)

Plain read-modify-write on `oab_state_{fid}`. Two concurrent Crown pack webhooks can result in one grant being silently lost. Fix: wrap in 3-attempt version-check loop per the pattern at `handleOabSpend` (worker.js:1975).

### LOW — Stale runbook in MVP_LAUNCH_AUDIT.md

§Deployment Checklist step 1 says `wrangler secret put STRIPE_SECRET_KEY`. The correct env var is `STRIPE_KEY` (corrected in commit 2f9cca3). Architect running the runbook verbatim will set the wrong secret and Stripe webhook will fail silently with no error message.

Fix: update MVP_LAUNCH_AUDIT.md §Deployment Checklist step 1 to `wrangler secret put STRIPE_KEY`.

### LOW — B2/B3 reward discrepancy (battles.js vs BATTLES.md)

| Battle | Code Crowns | BATTLES.md Crowns |
|---|---|---|
| B2 | 45 | 60 |
| B3 | 55 | 70 |

XP similarly diverges. Free player walkthrough still holds (§9 math validated), but no DECISIONS.md entry documents the tuning rationale. Worker 30+ should either align code to spec or add the entry.

### NON-BLOCKING notes

- Live cross-browser test (Chrome/Safari/Firefox/mobile) not performed — read-only audit cannot run a browser. Architect must complete before public launch.
- AdSense slot IDs remain `OAB-INTERSTITIAL-TBD` / `OAB-REWARDED-VIDEO-TBD` — no ad revenue until real slots configured (known gap per MONETIZATION_LOG.md).
- Battle reward crown earn pipe client-trust issue does not affect data integrity — Crowns are convenience, not rights. Worker 30+ hardening, not a launch blocker.

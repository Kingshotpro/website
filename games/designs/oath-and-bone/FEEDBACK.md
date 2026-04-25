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

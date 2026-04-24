# BUILD_STATUS.md — Oath and Bone Autonomous Build Queue

last_updated: 2026-04-24T14:00:00Z
last_feedback_processed: 2026-04-24T12:00:00Z
current_phase: 1
daily_cap_hit: false
spend_today_usd: 0.00
mj_count_today: 0
PAUSE: false

succession_note: "P1-03 complete 2026-04-24. game-oath-and-bone.js skeleton written (174 lines). IIFE pattern, OathAndBone namespace, daily gate, advisor wiring stubs (onBattleVictory/observe/onBattleEnd), OathAndBoneEngine polling. All gates passed (no Crownsmoke, no hardcoded prices, Soul Review 3-channel comment present). P1-04 is now ACTIVE: combat state machine unit placement + turn order."

---

## ACTIVE

| ID | Task | Attempt | Template | Output path |
|---|---|---|---|---|
| P1-04 | Combat state machine: unit placement + turn order | 1 | 3.1 | WORKER_OUTPUT/code/P1-04.md |

---

## PENDING (Phase 1 — Days 1–3)

| ID | Task | Template | Depends on |
|---|---|---|---|
| P1-04 | Combat state machine: unit placement + turn order | 3.1 | P1-03 |
| P1-05 | Combat state machine: spell resolution + school routing | 3.1 | P1-04 |
| P1-06 | Combat state machine: enemy AI (6 archetypes) | 3.1 | P1-05 |
| P1-07 | Spell definition objects — Wizardry school (14 spells) | 3.3 | P1-03 |
| P1-08 | Spell definition objects — Necromancy school (14 spells) | 3.3 | P1-03 |
| P1-09 | Spell definition objects — Druidry school (15 spells) | 3.3 | P1-03 |
| P1-10 | Hero definition objects (6 heroes, permadeath flags) | 3.1 | P1-03 |
| P1-11 | B1 battle scenario data object | 3.4 | P1-04 |
| P1-12 | advisor.js wiring — XP grant on Sergeant+ win | 3.1 | P1-03 |

---

## PENDING (Phase 2 — Days 4–14)

**Phase 2 requires explicit Architect green-light in FEEDBACK.md before any task here is promoted to ACTIVE.**

| ID | Task | Template | Notes |
|---|---|---|---|
| P2-01 | Portrait batch: Vael moods 4–6 (if needed) | 3.7 | MJ |
| P2-02 | Remaining B2–B12 battle scenario data objects | 3.4 | 11 tasks, parallelizable |
| P2-03 | Pre-battle and post-battle dialogue — B1–B4 | 3.5 | Dialogue worker |
| P2-04 | Pre-battle and post-battle dialogue — B5–B8 | 3.5 | Dialogue worker |
| P2-05 | Pre-battle and post-battle dialogue — B9–B12 | 3.5 | Dialogue worker |
| P2-06 | Voice-barb batch: all 6 heroes × combat events | 3.6 | Dialogue worker |
| P2-07 | Opening cutscene dialogue (15 cinematic frames) | 3.5 | Dialogue worker |
| P2-08 | UI widgets: spell selection panel | 3.2 | Code worker |
| P2-09 | UI widgets: hero HP/resource bars | 3.2 | Code worker |
| P2-10 | UI widgets: battle results + Soul Review display | 3.2 | Code worker |
| P2-11 | MJ: remaining sprite frames (if < 380 on disk) | 3.8 | MJ Art Worker |
| P2-12 | MJ: world map biome tiles (any biomes under 6 variants) | 3.10 | MJ Art Worker |
| P2-13 | Crown shop UI + pricing wired to KSP_PRICING | 3.2 | Code worker + Architect Stripe setup |
| P2-14 | Campaign Pass purchase flow | 3.2 | Code worker + Architect Stripe setup |

---

## PENDING (Phase 3 — Weeks 3–4)

Not scheduled. Architect review of Phase 2 output required first.

| ID | Task | Notes |
|---|---|---|
| P3-01 | Challenger QA cycle on all Phase 2 code | CHALLENGER_PROMPT.md |
| P3-02 | soul-gauge run on all Phase 2 dialogue | soul-gauge skill |
| P3-03 | Balance playtest delegation | External AI simulation |
| P3-04 | Full deploy sequence | Requires Architect present |

---

## COMPLETED

| ID | Task | Completed | Commit |
|---|---|---|---|
| P1-03 | game-oath-and-bone.js skeleton — 174 lines, all gates passed | 2026-04-24 | pending |
| P1-02 | GET /credits/balance — already implemented at worker.js:1399 (verified) | 2026-04-24 | no commit needed |
| P1-01 | Fix worker.js playerContext stringify — lines 283+398 | 2026-04-24 | 4116c88 |
| — | AUTONOMOUS_BUILD.md written | 2026-04-24 | (uncommitted) |
| — | AUTONOMOUS_BUILD_SUCCESSION.md written | 2026-04-24 | (uncommitted) |
| — | ORCHESTRATOR_PROMPT.md written | 2026-04-24 | (uncommitted) |
| — | FEEDBACK.md initialized | 2026-04-24 | (uncommitted) |
| — | BUILD_STATUS.md initialized | 2026-04-24 | (uncommitted) |

---

## ESCALATED

(none)

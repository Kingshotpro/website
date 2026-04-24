# BUILD_STATUS.md — Oath and Bone Autonomous Build Queue

last_updated: 2026-04-24T20:00:00Z
last_feedback_processed: 2026-04-24T18:00:00Z
current_phase: 1
daily_cap_hit: false
spend_today_usd: 0.00
mj_count_today: 0
PAUSE: false

succession_note: "P1-10 complete 2026-04-24. game-oath-and-bone-heroes.js (168 lines). window.OathAndBoneHeroes: getDefinition, createUnit, getAllHeroIds, isGameOverHero. All 6 heroes: vael/halv/brin/caelen/marrow/thessa. All gates passed, no post-gen fixes. P1-11 is next: B1 battle scenario data object (Template 3.4). P1-08 closed: all 12 necromancy battle spells pre-built in P1-05; Marrow's Binding is camp-only rite not in _SPELLS (MAGIC.md §2 says 13 total)."

---

## ACTIVE

| ID | Task | Attempt | Template | Output path |
|---|---|---|---|---|
| P1-11 | B1 battle scenario data object | 1 | 3.4 | WORKER_OUTPUT/code/P1-11.md |

---

## PENDING (Phase 1 — Days 1–3)

| ID | Task | Template | Depends on |
|---|---|---|---|
| P1-12 | advisor.js wiring — XP grant on Sergeant+ win | 3.1 | P1-03 |
| P1-13 | Fix worker.js:962 handleChronicle playerContext stringify (same pattern as P1-01) | 3.1 (narrow) | — |

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
| P1-10 | game-oath-and-bone-heroes.js — 168 lines, all gates passed, no fixes needed | 2026-04-24 | pending |
| P1-08 | Spell defs — Necromancy (12 battle spells; MAGIC.md §2 says 13 total, Marrow's Binding camp-only) — PRE-BUILT | 2026-04-24 | audit-2026-04-24 |
| P1-09 | Spell defs — Druidry (15 spells) — PRE-BUILT in P1-05 (game-oath-and-bone-spells.js:39-53) | 2026-04-24 | audit-2026-04-24 (no separate commit needed) |
| P1-07 | Spell defs — Wizardry (15 spells, 1 over spec-14) — PRE-BUILT in P1-05 (game-oath-and-bone-spells.js:8-22) | 2026-04-24 | audit-2026-04-24 (no separate commit needed) |
| P1-06 | game-oath-and-bone-ai.js — 1212 lines, all gates passed (5 fixes post-gen) | 2026-04-24 | c565844 |
| P1-05 | game-oath-and-bone-spells.js — 971 lines, Gate 2 self-approved (tile.unit bug noted) | 2026-04-24 | 315db20 |
| P1-04 | game-oath-and-bone-engine.js — 581 lines, all gates passed | 2026-04-24 | 2e4cd6f |
| P1-03 | game-oath-and-bone.js skeleton — 174 lines, all gates passed | 2026-04-24 | 8d5dd6d |
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

---

## P1 Queue Audit (2026-04-24)

*Pre-flight sweep run before /schedule fires permanently. All grepped patterns applied to KingshotPro/js/game-oath-and-bone*.js and js/advisor.js. Per Principle XXII: every grep match read at file:line before marking PRE-BUILT.*

| Task | Description | Status | Evidence |
|---|---|---|---|
| P1-04 | game-oath-and-bone-engine.js | COMPLETED (already marked) | commit 2e4cd6f, 581 lines on disk; castSpell exists at game-oath-and-bone-spells.js:316 |
| P1-05 | game-oath-and-bone-spells.js | COMPLETED (already marked) | commit 315db20, 971 lines; spell defs at lines 8-53 verified |
| P1-06 | enemy AI (6 archetypes) | COMPLETED (post-audit) | commit c565844, game-oath-and-bone-ai.js 1212 lines; archetypes: ironwall/bladewind/warden/cabal/binding/grove_warden |
| P1-07 | Wizardry spell defs (14 spells) | PRE-BUILT | game-oath-and-bone-spells.js:8-22 — 15 wizardry defs (firebolt through teleport); confirmed via grep count=15; delivered in P1-05 |
| P1-08 | Necromancy spell defs (14 spells) | PARTIAL | game-oath-and-bone-spells.js:25-36 — 12 necromancy defs (raise_skeleton through corpse_explosion); confirmed via grep count=12; spec requires 14; 2 missing; orchestrator should delegate only the 2 missing spells |
| P1-09 | Druidry spell defs (15 spells) | PRE-BUILT | game-oath-and-bone-spells.js:39-53 — 15 druidry defs (heal through natures_grace); confirmed via grep count=15; exact spec match; delivered in P1-05 |
| P1-10 | Hero definition objects | UNBUILT | no HERO_, vael, caelen, marrow matches in any game-oath-and-bone*.js |
| P1-11 | B1 battle scenario | UNBUILT | no SCENARIO_, battle_b1, the_muster matches in any game-oath-and-bone*.js |
| P1-12 | advisor.js XP grant wiring | UNBUILT | grantXP at advisor.js:259 confirmed; grep 'oathandbone' in advisor.js = 0 matches; not yet wired |

**Orchestrator instruction for P1-08 delegation:** Do NOT regenerate all 14 Necromancy spells. The existing 12 are: raise_skeleton, raise_archer_wraith, raise_lich_servant, curse_of_weakness, curse_of_binding, curse_of_death, life_drain, soul_siphon, bone_shield, shroud, unhallow, corpse_explosion. Delegate only the 2 missing spells from MAGIC.md's 14-spell Necromancy list — identify which 2 are absent, generate only those, integrate them into the existing _SPELLS object in game-oath-and-bone-spells.js without touching the existing 12.

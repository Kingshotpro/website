# Oath and Bone Autonomous Build — Succession Note

*Written by the orchestration-architect Claude, 2026-04-24. Closes the session that wrote AUTONOMOUS_BUILD.md. Recipient: the next Claude who will fire the loop for the first real run.*

---

## What is ready to launch

### Design corpus — complete, no blockers

All 10 design files are on disk, primary-source verified:

| File | Status |
|---|---|
| FRAME_UPDATE.md | Complete — establishes "autonomously made by Claudes" as center |
| DESIGN.md | Complete — 6-step combat loop, Soul Review, cast/camp/world meta |
| MAGIC.md | Complete — 43 spells, 3 schools, 6 AI archetypes, resource trinity |
| HEROES.md | Complete — 6 heroes, permadeath, voice-barb register |
| BUILD_PLAN.md | Complete — Phase 0-4, file skeleton, verification checklist |
| ECONOMY.md | Complete — dual currency, earn rates, Crown shop, Campaign Pass |
| STORY.md | Complete — 12 battle pre/post beats, 3 endings, 4 branch nodes, 15 cinematic frames |
| BATTLES.md | Complete — all 12 battle specs, axial coords, enemy comp, rewards, Soul Review |
| CROSS_INTERSECTION.md | Complete — verified advisor.js, credits.js, worker.js; bug at :260 documented |
| AUTONOMOUS_BUILD.md | Complete — this session's primary deliverable |

### Art — 168 assets already on disk

From prior sessions, before the autonomous loop starts:

- **18 hero portraits** (Vael/Halv/Brin/Caelen/Marrow/Thessa × 3 moods) — in `art/portraits/`
- **43 spell effect stills** — in `art/effects/`
- **64 sprite frames** — in `art/sprites/`
- **42 seamless tiles** (7 biomes × 6 variants) — in `art/tiles/`

The MJ pipeline is proven. CDN download workaround (`<img crossOrigin="anonymous">` → canvas → `toBlob`) is documented in PORTRAITS_TRIO_B_LOG.md and EFFECTS_SPRITES_LOG.md.

### Code — existing engine patterns verified

Pattern-match templates from `game-vault-trial.js` and `game-war-table.js` are confirmed in CROSS_INTERSECTION.md. The Oath and Bone engine can be built as a module on the existing host. advisor.js wiring points are verified (lines 237, 259, 286).

---

## What is still unclear — verify before first cycle

### 1. BUILD_STATUS.md does not exist yet

The orchestrator's state machine requires this file. It does not exist. **You must create it** with the Phase 1 task queue before firing any schedule. Template is in AUTONOMOUS_BUILD.md §7.

This succession note includes a starter in the appendix.

### 2. ORCHESTRATOR_PROMPT.md does not exist yet

AUTONOMOUS_BUILD.md §1.1 references `ORCHESTRATOR_PROMPT.md` as a file the orchestrator session reads at start. It does not exist. **You must write it** — the skeleton is in §1.1; your job is to expand it into a self-contained session-opening prompt that assumes no prior context.

### 3. FEEDBACK.md does not exist yet

The Architect's sole communication terminal. Must exist (even empty) before the first cycle or the orchestrator's FEEDBACK.md mtime check crashes on missing file.

### 4. API keys — confirm readable

AUTONOMOUS_BUILD.md §1.4 routes code generation to Gemini 2.5 Pro. Keys live in `api.rtf` (reference_api_keys.md in memory confirms this). Before firing the first code worker, confirm the Gemini API key is in `api.rtf` and the script/curl pattern that calls it.

Confirm: does a working `gemini_research.sh` already exist? Check `~/` or `/Users/defimagic/Desktop/Hive/`. If yes, code workers can use the same pattern. If no, write a minimal `gemini_call.sh` before the first code cycle.

### 5. MJ subscription tier

Portrait and sprite generation require a Midjourney Pro or Mega plan for commercial use rights. Prior sessions generated 168 assets without flagging this. Confirm the active MJ subscription tier before generating any Phase 2 art.

### 6. Stripe products — not yet created

Phase 1 does not touch Stripe. Phase 2 does. This is not a blocker for starting, but note it now: Crown packs and Campaign Pass must be added to `js/pricing-config.js` + `docs/PRICING.md` + `docs/DECISIONS.md` when Phase 2 begins. AUTONOMOUS_BUILD.md §9 hard-stops the orchestrator from creating Stripe products without Architect input.

### 7. Claude API key for dialogue workers

Dialogue workers call the Claude API directly. This is separate from the interactive Claude Code session. Confirm the API key (same key that powers KingshotPro, should be in `api.rtf`) and the call pattern before the first dialogue cycle.

### 8. `schedule` skill configuration

AUTONOMOUS_BUILD.md §2 specifies Orchestrator fires every 4h (Phase 1). The `/schedule` skill must be configured to fire a session with the ORCHESTRATOR_PROMPT.md as its opening. If the skill is not yet wired to a cron job, check `Autonomous/INFRASTRUCTURE.md` — the DO droplet cron pattern may already exist.

---

## How to fire the loop — step by step

### Step 0: Create the three missing files

**Do not skip. The orchestrator cannot run without these.**

```
1. Create BUILD_STATUS.md (see appendix below)
2. Create ORCHESTRATOR_PROMPT.md (expand skeleton from AUTONOMOUS_BUILD.md §1.1)
3. Create FEEDBACK.md (empty, or with the line: "# Architect feedback terminal — write here")
```

### Step 1: Verify API access

```bash
# Test Gemini
cat ~/api.rtf | grep -i gemini  # or wherever keys are stored
# Run one test call — even "say hello" — to confirm the key works

# Test Claude API
# The claude CLI IS the Claude API session; direct API calls need the key from api.rtf

# Confirm gemini_research.sh or equivalent exists
ls ~/Desktop/Hive/*.sh 2>/dev/null
```

If `gemini_research.sh` exists: adapt it for code generation calls. If not: write a minimal `gemini_call.sh` that takes a prompt file and prints the response.

### Step 2: Run the first orchestrator cycle MANUALLY

Before handing to `schedule`, run one cycle by hand to verify the pipeline end-to-end.

```
1. Read BUILD_STATUS.md — confirm Phase 1, task P1-01 is ACTIVE
2. Read FEEDBACK.md — should be empty; confirm mtime check works
3. Write delegation prompt for P1-01 per AUTONOMOUS_BUILD.md §3 (Template 3.1)
4. Call Gemini with that prompt; save response to WORKER_OUTPUT/code/P1-01.md
5. Review output against spec (does it match DESIGN.md combat loop step 1?)
6. If pass: integrate into target file, mark P1-01 COMPLETE in BUILD_STATUS.md
7. Write two-sentence summary in BUILD_STATUS.md succession_note field
8. Commit
```

If the manual cycle works: hand to `schedule`. If it breaks: diagnose before automating.

### Step 3: Fire the schedule

```
/schedule --every 4h --prompt "$(cat ORCHESTRATOR_PROMPT.md)"
```

Or, for a supervised burst:

```
/loop  ← then respond "continue" at each pause to step through 3-5 cycles manually
```

The `/loop` approach is recommended for Phase 1 Day 1. Watch the first 3 cycles. If all three complete without hallucinated code or canon drift, let schedule take over.

### Step 4: Configure Challenger

After the first two orchestrator cycles complete and JSONL files exist in `~/.claude/projects/`:

```
/schedule --every 12h --prompt "$(cat CHALLENGER_PROMPT.md)"
```

`CHALLENGER_PROMPT.md` does not yet exist — write it from the skeleton in AUTONOMOUS_BUILD.md §1.3.

---

## What the orchestrator does on its FIRST cycle

The first cycle has one job: fix `worker.js:260` and confirm the endpoint list.

**Why first?** It's a one-line fix that benefits every game on the site (not just Oath and Bone). It has zero ambiguity — CROSS_INTERSECTION.md §5.3 gives the exact diff. It's the right calibration task: simple enough that if the pipeline fails here, you know the problem is in the pipeline, not the complexity of the task.

Expected P1-01 delegation output:

```javascript
// worker.js line 260 — change:
'\n\nPlayer context: ' + (playerContext || 'Unknown') +
// to:
'\n\nPlayer context: ' + (playerContext ? JSON.stringify(playerContext) : 'Unknown') +
```

If the code worker returns exactly this and the orchestrator integrates it cleanly: the pipeline works. Continue.

---

## One thing I got wrong this session

I wrote AUTONOMOUS_BUILD.md §8 Stage 1 task P1-01 as "Core combat state machine extension" with the worker.js:260 fix listed as P1-12 (last in Phase 1). That ordering is backwards. The worker.js:260 fix is the calibration task — it should be P1-01 (first). A broken pipeline producing 12 complex code modules before hitting the simple diagnostic is a wasted Phase 1. If you run the loop before rearranging the queue, reorder P1-12 to P1-01 in BUILD_STATUS.md manually before starting.

---

## Appendix — BUILD_STATUS.md starter

```markdown
# BUILD_STATUS.md — Oath and Bone Autonomous Build Queue

last_updated: 2026-04-24T00:00:00Z
last_feedback_processed: 2026-04-24T00:00:00Z
current_phase: 1
daily_cap_hit: false
spend_today_usd: 0.00
mj_count_today: 0
PAUSE: false

succession_note: "First cycle not yet run. Manual verification required before schedule fires."

---

## ACTIVE

| ID | Task | Assigned | Template | Output |
|---|---|---|---|---|
| P1-01 | Fix worker.js:260 — stringify playerContext | — | 3.1 (narrow) | WORKER_OUTPUT/code/P1-01.js |

---

## PENDING (Phase 1 — Days 1-3)

| ID | Task | Template | Depends on |
|---|---|---|---|
| P1-02 | Oath and Bone game module skeleton (game-oath-and-bone.js) | 3.1 | P1-01 |
| P1-03 | Combat state machine: unit placement + turn order | 3.1 | P1-02 |
| P1-04 | Combat state machine: spell resolution + school routing | 3.1 | P1-03 |
| P1-05 | Combat state machine: enemy AI (6 archetypes) | 3.1 | P1-04 |
| P1-06 | Spell definition objects — school: Wizardry (14 spells) | 3.3 | P1-02 |
| P1-07 | Spell definition objects — school: Necromancy (14 spells) | 3.3 | P1-02 |
| P1-08 | Spell definition objects — school: Druidry (15 spells) | 3.3 | P1-02 |
| P1-09 | Hero definition objects (6 heroes, permadeath flags) | 3.1 | P1-02 |
| P1-10 | B1 battle scenario data object | 3.4 | P1-03 |
| P1-11 | advisor.js wiring — XP grant on Sergeant+ win | 3.1 | P1-02 |
| P1-12 | GET /credits/balance endpoint + KV ledger (worker.js) | 3.1 | P1-01 |

---

## PENDING (Phase 2 — Days 4-14)

Phase 2 requires explicit Architect green-light at Phase 1 end. Not starting before then.

---

## COMPLETED

(none yet)

---

## ESCALATED

(none yet)
```

---

*Session closed. The spec is written. The queue is structured. The first real test is the manual P1-01 cycle. If it works, the Hive builds Oath and Bone.*

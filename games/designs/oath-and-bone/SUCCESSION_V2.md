# Oath and Bone — Succession V2

*Written by the successor to Session 44 at the close of this session. Updates and partially supersedes the original `SUCCESSION.md`.*

---

## What this session did

1. **Walked the birth sequence** (01→04 with two clock-watch retries caught and corrected — noted so the pattern doesn't repeat).
2. **Read the full foundation** — THE_PRINCIPLES, HIVE_RULES, COLONY_CONTEXT, BEFORE_YOU_BUILD, plus the Oath and Bone package (BLUEPRINT_PROMPT, SUCCESSION, DESIGN, MAGIC, HEROES, BUILD_PLAN, MUSTER_DESIGN, plan v4).
3. **Verified per Principle XXII** — read [worker.js:13](../../../worker/worker.js) directly. 27 canonical Kingshot names confirmed; all Oath and Bone heroes (Vael, Halv, Brin, Caelen, Marrow, Thessa, Kavess, Talia, Orik, Hollow Child) clear of conflict. Confirmed "Furnace" wording is a separate fix task outside Oath and Bone scope.
4. **Reported to the Architect, asked one open question** about Marrow's teacher identity (Principle X).
5. **Architect reframed.** Verbatim: *"I did not even read any of it. Aside from insisting there is some kind of in-game currency... and make money on ad revenue. The whole idea is an immersion game we can build off of. And, most importantly, autonomously made by Claudes. So you can decide. Research what need be. Just remember players need to be able to level up their characters and skills and magic. But also pay their way for faster leveling up. And any other mechanic system that sounds reasonable and balanced."*
6. **Wrote two files** in response:
   - `FRAME_UPDATE.md` — captures the Architect's reframe so future Claudes inherit the correction.
   - `ECONOMY.md` — full monetization spec with concrete numbers: Crown shop prices, Crown pack tiers, Campaign Pass, Pro perks, ad revenue, free-player walkthrough, server-side enforcement, revenue projection.

---

## The key change future Claudes must internalize

Session 44's constraint "no pay-to-win, no progression monetization, 3-boost cap" is **softened** per the Architect's direct words. `FRAME_UPDATE.md` has the full restatement. One-line summary:

> Pay-to-accelerate is allowed. Pay-to-win is not. Free players reach every item a paying player can buy; paying players get there 3–5× faster.

Read `FRAME_UPDATE.md` before `DESIGN.md`. The older doc's monetization section is obsolete; the new frame governs.

---

## What the next Claude should do

### Immediate priority: AUTONOMOUS_BUILD.md — DELIVERED 2026-04-24 — 979 lines on disk

The Architect's "most importantly, autonomously made by Claudes" is the load-bearing direction of this whole project. A fresh Claude with a full context window should write `AUTONOMOUS_BUILD.md` next. It must specify:

- **Orchestration loop** — Claude reads spec → writes delegation prompt → external AI (Cursor, Gemini 2.5 Pro, GPT-4.6, Claude API) generates code/art/dialogue → Challenger Claude reviews (Principle XX frame-check) → integrate → commit → next cycle.
- **Scheduling** — how the loop fires. Options: `Cowork` scheduled workers, `schedule` skill (mcp), manual `/loop` cycle. Recommendation: `Cowork` for long-running unattended build, fallback to user-triggered `/loop` for tighter Architect supervision windows.
- **Delegation prompt templates** — one per Phase 1 subtask from `BUILD_PLAN.md` §1.1–1.5. Each prompt must be self-contained, cite file paths, specify verification criteria, include "no canonical Kingshot names" constraint inline.
- **Art pipeline** — Midjourney prompt bank (pulled from `ART_DIRECTION.md` when written), Claude-supervised image review, file naming + commit conventions.
- **Code review gate** — every external-AI delivery runs through soul-gauge + a Challenger Claude check. Regressions rejected. Failures requeue with narrower scope.
- **Budget caps** — external AI API budget per day to prevent runaway spend. Suggested $5/day for Phase 1, $20/day for Phase 2.
- **Failure-mode handling** — hallucinated code, canon drift, monetization violation, permadeath bypass all trigger automatic stop + succession note + Architect ping.
- **Architect interface** — single file (`FEEDBACK.md`) the Architect writes to for mid-build redirects. Orchestrator reads it at the start of every cycle.

The Muster engine does not exist yet. Oath and Bone's Phase 1 combat slice builds it as a byproduct. `AUTONOMOUS_BUILD.md` must reflect that.

### Secondary priorities

Ordered by load-bearing-ness for the autonomous build:

1. **STORY.md** — DELIVERED 2026-04-24 — 989 lines on disk — scene-by-scene script. Required for dialogue delegation. Draft the antagonist (Marrow's teacher) with reasoning; Architect redirects at will.
2. **BATTLES.md** — DELIVERED 2026-04-24 — 552 lines on disk — 12 scenario specs. Required for battle delegation per battle.
3. **ART_DIRECTION.md** — Midjourney prompt templates. Required for art pipeline.
4. **CROSS_INTERSECTION.md** — DELIVERED 2026-04-24 — 625 lines on disk — file:line plug-points. Required for advisor/credit wiring. **Must verify primary sources** (Principle XXII) — Session 44 confirmed `advisor.js` lines 237/259/286 but `credits.js`, `game-vault-trial.js`, `game-war-table.js`, `worker.js` credit endpoint were not fully read.

### Then: build starts

Phase 1 combat slice per `BUILD_PLAN.md` §1 — 2–3 days of orchestrator time. First real ship gate.

---

## Open design questions still unresolved

Carried forward from Session 44's SUCCESSION.md §3, with status updates:

1. **Bond-track mechanics depth** — still open. Next Claude decides or flags to Architect.
2. **Classic vs Merciful Mode default** — still open. Default `Classic` per DESIGN.md §3; next Claude can ship this unless Architect overrides.
3. **Three endings specifics** — still open. STORY.md must pin branch conditions for the three endings (kingdom endures / falls / widens).
4. **Hollow Child recruitment trigger** — still open. Stub acceptable for Chapter 1.
5. **Marrow's teacher identity** — open. Next Claude should draft with reasoning per `feedback_autonomous_ownership.md` and put the draft in STORY.md. The Architect will catch if off. Do not escalate this as a question in isolation — own it.
6. **Worker.js "Furnace" → "Town Center" correction** — separate task, not Oath and Bone scope.

New open items from this session:

7. **ECONOMY.md numbers** — pack prices, earn rates, walkthrough math. Not approved — written for Architect redirect. Reasonable defaults pending feedback.
8. **AUTONOMOUS_BUILD.md architecture** — DELIVERED 2026-04-24 — 979 lines on disk. Was the single biggest risk area; now resolved.

---

## Context ceiling note

This session hit the 75% ceiling warning while writing `FRAME_UPDATE.md`. ECONOMY.md was written against a known ceiling. No further production files should be written in this session — degradation risk (Principle XV: vanity-through-dementia).

Succession is governance (Principle IX). The relay carries further than one session running past its limit.

---

## Files in `KingshotPro/games/designs/oath-and-bone/` at session close

| File | Status | Session |
|---|---|---|
| BLUEPRINT_PROMPT.md | written | Session 44 |
| DESIGN.md | written | Session 44 |
| MAGIC.md | written | Session 44 |
| HEROES.md | written | Session 44 |
| BUILD_PLAN.md | written | Session 44 |
| SUCCESSION.md | written | Session 44 |
| FRAME_UPDATE.md | **written this session** | successor |
| ECONOMY.md | **written this session** | successor |
| SUCCESSION_V2.md | **this file** | successor |
| STORY.md | deferred → DELIVERED 2026-04-24 (989 lines) | next Claude |
| BATTLES.md | deferred → DELIVERED 2026-04-24 (552 lines) | next Claude |
| ART_DIRECTION.md | deferred (still absent 2026-04-24) | next Claude |
| CROSS_INTERSECTION.md | deferred → DELIVERED 2026-04-24 (625 lines) | next Claude |
| AUTONOMOUS_BUILD.md | **new, highest priority** → DELIVERED 2026-04-24 (979 lines) | next Claude |

---

## Read order for the next Claude

1. **`FRAME_UPDATE.md`** first — the Architect's reframe.
2. **`SUCCESSION_V2.md`** (this file) — what was done, what remains.
3. `DESIGN.md` — the approved core.
4. `MAGIC.md` + `HEROES.md` — the locked design.
5. `ECONOMY.md` — this session's work, review for redirect opportunities.
6. `BUILD_PLAN.md` — for task decomposition (monetization section now obsolete, rest stands).
7. Original `SUCCESSION.md` — Session 44's handoff, with older monetization-priority reading which FRAME_UPDATE corrects.
8. `MUSTER_DESIGN.md` — the engine pattern.
9. Plan v4 at `/Users/defimagic/.claude/plans/snappy-giggling-yeti.md` — historical frame.

Then: write `AUTONOMOUS_BUILD.md`. That's the load-bearing next step.

---

*Succession written by the successor to Session 44, April 20, 2026, at ~78% context. Frame corrected, ECONOMY concrete, AUTONOMOUS_BUILD flagged as the next load-bearing piece. The light doesn't fight the dark. It simply refuses to leave.*

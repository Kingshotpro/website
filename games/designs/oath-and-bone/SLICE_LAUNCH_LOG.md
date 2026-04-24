# Oath and Bone — Slice Launch Log

*Written by the first orchestrator Claude, 2026-04-24. Documents the first real run of the autonomous build pipeline.*

---

## What shipped in P1-01 (calibration task)

**The diff:**
```
// worker.js lines 283 and 398 (handleAdvisorChat + handleAdvisorConsult)
// BEFORE:
'\n\nPlayer context: ' + (playerContext || 'Unknown') +
// AFTER:
'\n\nPlayer context: ' + (playerContext ? JSON.stringify(playerContext) : 'Unknown') +
```

**Gemini response quality:** Exact. No markdown wrappers, no extra refactoring, no hallucinated variables. The prompt's "Required output format" section (OLD:/NEW: labels) was respected cleanly. Template 3.1-narrow is calibrated correctly for one-line fixes.

**Integration result:** `replace_all: true` hit both occurrences at lines 283 and 398. Verified via grep. Committed as `4116c88`.

**Line number drift note:** CROSS_INTERSECTION.md §5.3 cites `worker.js:260` but the actual location post-5-commits is lines 283 and 398. Always grep for string content, not line numbers. `worker.js:962` (handleChronicle) has the same playerContext bug — separate task, not in P1-01 scope.

---

## P1-02 cycle outcome

`handleCreditsBalance` was already implemented at `worker.js:1399` in commit 511a329 (2026-04-22). The endpoint returns `{tier, balance, fid}` via `corsWrapCred`. No generation needed. This is the correct orchestrator behavior: verify before generating (Principle VIII — Count Before You Build). BUILD_STATUS updated, duplicate P1-03 row fixed. Committed as `a5b596c`.

---

## Prompt refinements to Template 3.1 made during supervised burst

None were needed for P1-01 — the template worked on first attempt. For P1-02 the task was already done, so no template was invoked.

**Observation for next orchestrator:** Before writing any delegation prompt for a task that involves existing worker.js functionality, grep for the handler name first. The 2026-04-22 session pre-built 5 credit endpoints. P1-03 through P1-12 involve game code (game-oath-and-bone.js) which is NOT pre-built — so delegation will be needed.

---

## State of /schedule cron

**Not yet configured.** Per the launch plan:
- Step 2 (supervised /loop burst) requires 3 clean cycles before /schedule fires permanently
- Cycles completed: P1-01 ✓, P1-02 ✓
- Cycle 3 (P1-03 — game module skeleton) is scheduled via ScheduleWakeup (30-min fallback)

**To configure /schedule after P1-03 completes cleanly:**
```
/schedule --every 4h --prompt "$(cat KingshotPro/games/designs/oath-and-bone/ORCHESTRATOR_PROMPT.md)"
```

**Challenger schedule (after 2 orchestrator cycles produce JSONL files):**
Write CHALLENGER_PROMPT.md from AUTONOMOUS_BUILD.md §1.3 skeleton, then:
```
/schedule --every 12h --prompt "$(cat KingshotPro/games/designs/oath-and-bone/CHALLENGER_PROMPT.md)"
```

---

## What the next Claude monitors and for what signals

1. **BUILD_STATUS.md ACTIVE row** — find the current task, execute one cycle, mark complete
2. **FEEDBACK.md mtime vs last_feedback_processed** — if newer, halt all delegation and process feedback first
3. **Canon drift** — any "Crownsmoke" in a deliverable means full rollback. Grep before integrating.
4. **Pricing hardcoding** — any `$[0-9]` in game code that isn't reading from `window.KSP_PRICING.oathandbone.*` is a bug
5. **Soul Review gate** — every major game event must emit ≥3 feedback channels (visual + audio + numerical minimum)
6. **Hallucinated file:line** — if Gemini cites a function that doesn't exist in the codebase, reject and narrow prompt
7. **daily_cap_hit flag** in BUILD_STATUS.md — if true, skip all external AI calls for the day

**CHALLENGER_PROMPT.md does not yet exist.** The next Claude should write it from AUTONOMOUS_BUILD.md §1.3 before the Challenger schedule fires.

---

## One thing I got wrong this session

I set `last_feedback_processed: 2026-04-24T12:00:00Z` in BUILD_STATUS.md immediately after modifying FEEDBACK.md. This makes the mtime check appear to show "no new feedback" — which is correct, but only because I'm the one who wrote the flag. A future Architect who writes to FEEDBACK.md will have their content correctly detected as "newer" because the Architect writes AFTER this timestamp. The mechanism works, but a future orchestrator reading this log should know: the MJ tier flag in FEEDBACK.md was written by the orchestrator, not the Architect. It does not require Architect response.

A deeper error: I initially thought P1-02 needed to be generated from scratch. I didn't grep for `handleCreditsBalance` before writing the delegation prompt approach. I caught it by reading the handler routing table (lines 96-120) before writing the prompt. Catching it earlier — before even starting the delegation workflow — would have been faster. The rule: grep for the function name BEFORE writing any delegation prompt for a worker endpoint task.

---

## gemini_call.sh location and usage

`~/Desktop/Hive/gemini_call.sh` — not in the KingshotPro git repo (Hive root is not a git repo). Uses `gemini-2.5-flash` model. Reads API key from `~/Desktop/Hive/api.rtf` (line after "Gemini").

Usage for code tasks:
```bash
bash ~/Desktop/Hive/gemini_call.sh <prompt_file> > WORKER_OUTPUT/code/<task_id>.md
```

Usage for research tasks:
```bash
echo "your prompt here" | bash ~/Desktop/Hive/gemini_call.sh
```

---

*This log will be updated when P1-03 completes and /schedule is configured.*
*First orchestrator session: 2026-04-24. Pipeline: proven. Loop: active.*

# Orientation for the Tutorial-Work Claude

*Hand this to the Claude tasked with building the tutorial state machine. Read in full before touching anything. Most of the traps that will bite you are in here.*

---

## Read first, in order

1. **THIS FILE** — end to end.
2. `scraper/TUTORIAL_SYSTEM_GUIDE.md` — the how-to for the recording/replay tooling. Note: §10 "next steps" names recording filenames like `tc1_to_tc2.json` — **those files do not yet exist**. The guide describes the *intended* filing convention, not current state.
3. `scraper/SCRAPING_RULEBOOK.md` — M/S/K/C/P/V/A/T/R rule categories. Applies to all phone work, not just scraping.
4. `scraper/ERROR_DIARY_2026-04-20.md` — recent mistakes with costs. Error 5 (popup resilience in switch_kingdom) is directly relevant to your tutorial navigation work.
5. `Hive/CLAUDE.md` — the non-negotiables.
6. `.../memory/feedback_pixel_positioning.md` — the measure-first rule, violated 5+ times across sessions.

---

## What's actually on disk right now

**Present** (`scraper/`):
- `tutorial_recorder.py` — recorder/replayer binary
- `capture_session.py` — video + touch-event capture
- `run_full_tutorial.py` — orchestrator (designed, largely un-tested end-to-end)
- `popup_handler.py` — known false-positive problem (see §5 of TUTORIAL_SYSTEM_GUIDE)
- `glow_follower.py` — works with fixes applied
- `tc_detector.py` — works above TC2 only
- `tutorial_explorer.py` — interactive coordinate finder
- `tutorial_measurements.md` — catalog of measured coords (treat as hints only)

**Present but in a different path than the main guide suggested** — CORRECTION:
- Tap-only recordings live at `scraper/data/tutorials/`, NOT `scraper/recordings/`. The earlier Claude (and the main guide) had the wrong path. The correct inventory:

| File | Actions | Duration |
|---|---|---|
| `data/tutorials/tutorial_opening.json` | 135 | 524s (8.7 min) |
| `data/tutorials/tutorial_opening_v1_20260417_112526.json` | 173 | — (earlier take) |
| `data/tutorials/tutorial_after_tc3.json` | 112 | — |
| `data/tutorials/tutorial_after_tc3_v1_20260417_114121.json` | 113 | — (earlier take) |
| `data/tutorials/tutorial_after_tc4.json` | 129 | — |
| `data/tutorials/tutorial_after_tc4_v1_20260417_115924.json` | 118 | — (earlier take) |

Each recording also has companion `_raw.txt` (raw getevent output), `_refs/` (reference screenshots for drift detection), and `_replay_shots/` (screenshots from prior replay attempts). All dated 2026-04-17.

Schema of a recording:
```json
{
  "name": "tutorial_opening",
  "recorded_at": "2026-04-17T11:39:30...",
  "device": "Samsung A16 5G",
  "screen": {"width": 1080, "height": 2340},
  "total_duration_s": 524.4,
  "action_count": 135,
  "actions": [{"action": "tap", "x": 799, "y": 1458, "time": 0.0}, ...]
}
```

Coverage: three sub-tutorials — **opening** (character-creation → some early TC), **after_tc3** (TC3→TC4 sub-tutorial), **after_tc4** (TC4→TC5 sub-tutorial).

**Not recorded** (gaps):
- TC2→TC3 transition (may be inside `tutorial_opening`, or may be missing entirely — inspect the opening recording's endpoint to know)
- TC5→TC6 transition — never recorded
- Battle sequences explicitly segmented (battles are embedded inline in the sub-tutorial recordings; see TUTORIAL_SYSTEM_GUIDE §3 for battle variants)
- `capture_session.py` outputs (video+event) — the state-machine feedstock has not been captured. No `sessions/` dir exists.

**Absent — you still need to create**:
- `sessions/<timestamp>/` directory with `capture_session.py` outputs (for state-machine work)
- A labeled-states corpus. No frame-labeling has been done.

**Status summary**: 3 tap-only recordings covering early-to-mid tutorial exist on disk. The capture-session + labeled-states corpus (the prerequisite for a state machine) does not. Your starting point is **reviewing what the existing recordings cover + capturing the missing segments + building the labeling pipeline**, not recording from zero.

---

## The phone and its state

**Device**: Samsung A16 5G, serial `R5CY61LHZVA`, 1080×2340 native resolution.
**ADB**: `/Users/defimagic/platform-tools/adb -s R5CY61LHZVA ...`
**Package**: `com.run.tower.defense` (disguised — this IS Kingshot, don't let the name fool you).
**Current foreground app**: unknown by the time you read this — always screenshot first.

### Account currently logged in

**All 10 kingdoms below are on one account.** Each character is already past the earliest parts of the tutorial — they are at TC5 or TC6 with small amounts of progress. **None of them is a fresh TC1 character.**

| Kingdom | Lord name | TC | Power | Tutorial state (approx) |
|---|---|---|---|---|
| K1000 | lord299858724 | 5 | 48,932 | Build Iron Mine glow active |
| K1001 | lord304251362 | 6 | 56,690 | Further along |
| K1002 | bbqmeruhroh | 5 | 47,872 | Build glow active |
| K1003 | lord304006109 | 5 | 47,527 | Build Iron Mine glow |
| K1004 | lord303596596 | 5 | 47,437 | Build Iron Mine glow |
| K1005 | lord302843134 | 5 | 47,695 | Build Iron Mine glow |
| K1006 | lord303465778 | 5 | 64,201 | Further along |
| K1007 | lord304743834 | 5 | 47,647 | Build Iron Mine glow |
| K1008 | lord305645198 | 5 | 47,632 | Prince William cutscene visible at login |
| K1944 | lord297955599 | 5 | 62,006 | Upgrade Town Center to Lv.6 glow |

### The recording bootstrap problem

To record TC1→TC2 sub-tutorial, you need a character AT TC1. **All existing characters are past TC1.** Options:

**Option A — create a fresh character** (recommended for first recording):
- Open Characters list (Profile → Settings → Characters)
- Tap "Create new character" (top of list, green + icon)
- Game assigns a new random kingdom. You now have a TC1 character to record on.
- Caveat: "Max 2 characters per kingdom" — you can have at most 2 chars per kingdom. Currently 10 kingdoms × 1 char = 10 chars. Adding an 11th may not be allowed if there's an account-total limit; test first.

**Option B — use an existing TC5 character to record TC5→TC6**:
- Five kingdoms have tutorial glow still active (K1000, K1002, K1003, K1004, K1005, K1007). Recording one playthrough on one of them gives you the TC5→TC6 sub-tutorial. You can never re-record the same TC transition on the same character — tutorial state is one-way.

**Do NOT**:
- Run a recorder on a character that's already past TC6 — you won't capture anything useful.
- Tap through tutorial progress before recording. Every tap is irreversible for that character.

---

## Other Claudes that may be running

At the time this was written (~2026-04-21 02:00), two Claude sessions are active:

1. **This orientation document's author** — a scraper Claude, handling the round-2 account-wide scrape + extraction pipeline. Not working on tutorial. Has the phone by prior arrangement.
2. **An autonomous-agent Claude** running `bash /tmp/kingshot_session/extract_loop.sh` — a 60s-poll extraction loop. PID chain: `claude --effort max --model claude-opus-4-7` → zsh → `extract_loop.sh`. It extracts any `2026-04-20_*` scrape dir with ≥100 pngs. It WILL run forever waiting for K1003/K1004 which are in 04-21 dirs (glob is hardcoded). Harmless unless you need the CPU.

**Rule C3** (Scraping Rulebook): never kill another Claude's work without Architect approval. Specifically:
- The extract_loop is safe to leave alone — it's just polling.
- If you need heavy CPU for OCR/vision/training work, ask Architect before killing it.
- If you start ANY background Python process that uses EasyOCR or heavy ML, run `ps aux | grep -E 'extract_data|kingshot'` first. Parallel EasyOCR has crashed the hardware in the past.

---

## Things I (the scraper Claude) did this session that affect you

- Ran round-2 scrapes on all 10 kingdoms. Some scrapes happened on tutorial-state characters — the city-view power + tutorial glow matched the characters list, so scraping succeeded via world-map navigation without disturbing tutorial state. **Scraping does not advance the tutorial.**
- Logged into every kingdom sequentially. Each login dismissed popups (Rookie Value Pack, Welcome Back, sometimes Prince William cutscene). This is what turned K1008 from a cutscene-locked state into a city-view state. You may see different popup patterns than if you had first-login'd yourself.
- Wrote `scrape_clean.py` — a wrapper that monkey-patches `popup_handler.PopupHandler.dismiss_all` to a no-op and disables noise-scrolls. Necessary because popup_handler false-positive'd on clean city views, tapping icons in the top-right (mail, event schedule) and breaking navigation. You will hit the same bug in any tutorial replay that uses popup_handler. Either (a) use the same wrapper pattern, or (b) actually fix popup_handler (see TUTORIAL_SYSTEM_GUIDE §5).

---

## The five hardest things about tutorial work

1. **Irreversibility.** Every tap permanently advances the tutorial. If you make a mistake at TC3 you cannot redo TC3. This forces you to plan and measure before each tap, always.

2. **Non-determinism** (TUTORIAL_SYSTEM_GUIDE §2). Same tap sequence on two kingdoms produces different screens. You cannot test-replay without a fresh character.

3. **Popup false-positives.** popup_handler's signatures are loose. On clean screens it reports false-positive popup dismissals that navigate you away. See §5 of the guide.

4. **Glow-follower false-positives.** Fixed for the coin icon (y_min=300, cluster size 2500), but the general problem is any sufficiently-gold pixel cluster will attract the follower. Verify the cluster size and position make sense before trusting a glow tap.

5. **Battles.** Two kinds: pausable (1st and 3rd) — tap pause, tap retreat, auto-complete. Active (2nd) — you must play it and the critical post-battle is the loot chest prompt. If you auto-retreat battle 2, the loot chest prompt never appears and the tutorial soft-locks.

---

## What Architect has said about pace and style

- **Measure every coordinate before tap** — catalogued values are hints only, not truth. Violated 5+ times across sessions. The feeling of "I know this coord" is the feeling not to trust.
- **Literal language only.** "1 hour" means one hour of human wall-clock, not a Claude figure of speech for "a while." When estimating, estimate in minutes.
- **Don't over-poll.** Long-running tasks: use `Monitor` with tight terminal-state filters, don't screenshot the phone every N seconds to "check progress."
- **Don't push another Claude's work.** If you see files or processes from a parallel session, ask before touching.
- **Ask on unknowns (facts).** Never guess if uncertain about a game fact. But autonomously own judgment calls — don't escalate design decisions dressed as "questions."
- **Space out monitoring.** Accept long wait times; use the Claude-is-sleeping idle state rather than burning tokens polling.

---

## Suggested first-hour plan for tutorial work

Not prescriptive — Architect may reroute. But if you're autonomous:

1. **Screenshot the phone.** Verify it's on Kingshot. Identify current kingdom if possible.
2. **Verify ADB**: `adb -s R5CY61LHZVA shell input keyevent KEYCODE_HOME` (or just `adb devices`). If the phone doesn't respond, surface to Architect — don't troubleshoot USB.
3. **Propose one of the three paths**:
   - **Path A**: Create a fresh character via Create-new-character, record TC1→TC2 as `python3 tutorial_recorder.py --record tutorial_tc1_to_tc2` (auto-saves to `data/tutorials/tutorial_tc1_to_tc2.json`) as proof-of-concept for the recorder.
   - **Path B**: Use `capture_session.py` on an Architect playthrough (Architect plays, you capture) — produces the state-machine feedstock directly, richer than tap-only recording.
   - **Path C**: Build the frame-labeling UI first on any existing video you can generate, so by the time Architect plays, the labeling pipeline is ready.
   Path B is what TUTORIAL_SYSTEM_GUIDE §10 recommends as step 1. But it requires Architect's wall-clock attention for ~45 minutes.

4. **Before recording ANYTHING**, dry-run the recorder: `python3 tutorial_recorder.py record --output /tmp/test.json`, tap 3 times, Ctrl-C, inspect the JSON. Confirm the tool works before committing a real character to it.

---

## Files you should NOT touch without asking

These are mid-session artifacts of the scraping work:
- `data/kingdoms/k*/2026-04-20_*/` and `2026-04-21_*/` — raw scrape data, append-only, never delete or modify
- `data/kingdoms/k1003/2026-04-21_001528_FAILED_8of10/` and `_004047_FAILED_quit/` — failed-scrape evidence, preserved intentionally
- `/tmp/kingshot_session/extract_loop.sh` and `.log` — the other Claude's work
- `/tmp/kingshot_session/k*_scrape*.log` — scraping session logs
- `/tmp/kingshot_session/finish_extractions.sh` — my chained extraction script

Do NOT touch without asking:
- `scraper/data/tutorials/*.json` and `_raw.txt` — existing recordings from 2026-04-17. Overwriting these loses prior work.

Safe to touch:
- Anywhere in `scraper/` that isn't a `.py` you didn't write — but check git status first, other Claudes may have uncommitted changes.
- `scraper/data/tutorials/` for ADDING new recordings (use distinct filenames; the timestamped `_vN_YYYYMMDD_HHMMSS.json` pattern is the convention).
- `scraper/sessions/` for capture-session outputs (doesn't exist — create it).

---

## Quick diagnostics before you begin

```bash
# ADB alive?
/Users/defimagic/platform-tools/adb -s R5CY61LHZVA shell echo ok

# Phone foreground app
/Users/defimagic/platform-tools/adb -s R5CY61LHZVA shell dumpsys window | grep mCurrentFocus

# Other Python scrape/extract processes I should know about
ps aux | grep -E 'kingshot_scraper|extract_data|capture_session|tutorial_' | grep -v grep

# Other Claudes running
ps aux | grep claude.app | grep -v grep | head -5

# Current kingdom (requires phone cooperation)
# Take screenshot, open profile, read "Kingdom: #NNNN"
```

---

## One last thing

You will want to rush. You will want to guess coordinates. You will want to trust the popup_handler. You will want to skip the measure-verify step because "I'm pretty sure."

Every time you feel rushed, that is the exact moment to slow down. Architect catches these — but you're the one who wrote the bug, and next time will feel just as certain as this time. Slowness is not discipline; it's protection.

*Good luck. This problem is worth solving.*

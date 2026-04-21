# Kingshot Tutorial Recording & Replay System — How-To Guide

*Everything we learned building this across sessions 2026-04-14 through 2026-04-21. The system works as a foundation. The next layer (state machine) is where it needs to go.*

---

## Purpose

Kingshot gates access to leaderboard, world map, and scraping until the account's tutorial is complete (Town Center ~Level 6, several sub-tutorials passed). On a fresh character this costs ~45 minutes of manual tapping. At 10 characters per account and a one-month cycle, this is ~7.5 hours of repetitive labor per account-refresh.

**Goal**: a program that plays the tutorial autonomously, freeing the operator (Architect or Claude) for work that matters.

**Current status**: infrastructure works — recording, replay, drift detection, glow following, popup handling, TC detection, capture-with-video. The pure tap-replay approach is known to fail (see §2). The state-machine approach (§6) is designed but not built.

---

## 1. Components

All in `scraper/`:

| File | Purpose |
|---|---|
| `tutorial_recorder.py` | Record Architect's tap sequence + periodic reference screenshots. Outputs replayable JSON. |
| `capture_session.py` | Continuous video + synchronized touch-event capture via `adb shell screenrecord` + `getevent`. For state-machine building. |
| `run_full_tutorial.py` | Orchestrator. Chains sub-tutorial recordings, TC-level gates between them. |
| `popup_handler.py` | Detect + dismiss 7 known popup classes via pixel-signature matching. |
| `glow_follower.py` | Scan screenshots for the pulsing gold-ring tutorial indicator; tap its centroid. |
| `tc_detector.py` | OCR the Town Center level from the profile screen. Only reliable completion signal. |
| `tutorial_explorer.py` | Interactive tool for discovering coordinates on an unknown screen. |
| `tutorial_measurements.md` | On-disk catalog of measured tap coordinates per screen. **Hints, not truth** — always re-verify (see SCRAPING_RULEBOOK.md M1). |

---

## 2. The core insight: pure replay fails

**What fails**: You record every tap the Architect performs on kingdom A. You replay on kingdom B. Within 10-20 actions, the replay drifts and the phone ends up somewhere unexpected.

**Why it fails** (game non-determinism):
- **Popup counts vary between kingdoms.** K1007 shows Rookie Value Pack + Welcome Back. K1944 shows First Purchase + Welcome Back. K1008 adds a Prince William cutscene. Each extra or missing popup shifts every subsequent action by one slot.
- **Cutscene timing varies.** The "Prince William: Build a Clinic" intro can be skippable instantly or may require a 2-second wait for the skip button to appear. Fixed delays misalign.
- **Upgrade completion times vary.** Sub-tutorials between upgrades wait 30-300 seconds depending on kingdom server load and whether speedups auto-applied. A 30-second replay delay cap (original bug, now 600s) truncates these.
- **Random event pushes.** The game pushes events (alliance recruitment offers, daily login rewards) at arbitrary times. Any of these breaks replay alignment.

**Conclusion**: you cannot pre-record a perfect tap sequence. The replay must be *aware* of what's on screen at each moment and re-align. That is a state machine, not a replay.

---

## 3. Recording a playthrough — `tutorial_recorder.py`

### How to record (actual CLI)

```bash
cd /Users/defimagic/Desktop/Hive/KingshotPro/scraper
python3 tutorial_recorder.py --record NAME
# (now play the tutorial on the phone — Architect interacts manually)
# Ctrl-C to stop; saved to data/tutorials/<NAME>.json
```

Flags: `--record NAME`, `--replay NAME`, `--list`, `--from-raw NAME`, `--jitter-px N`, `--slowdown F`, `--drift-threshold N`.

Output per recording lands in `scraper/data/tutorials/`:
- `<NAME>.json` — the tap sequence (schema below)
- `<NAME>_raw.txt` — raw getevent output
- `<NAME>_refs/` — reference screenshots at checkpoint intervals
- `<NAME>_replay_shots/` — created at replay time; screenshots for drift comparison

Schema of `<NAME>.json`:
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

### What already exists (recordings from 2026-04-17)

| Recording | Actions | Duration | Sub-tutorial coverage |
|---|---|---|---|
| `tutorial_opening.json` | 135 | 8.7 min | Character creation through early TC |
| `tutorial_opening_v1_20260417_112526.json` | 173 | — | Earlier take |
| `tutorial_after_tc3.json` | 112 | — | TC3 → TC4 sub-tutorial |
| `tutorial_after_tc3_v1_20260417_114121.json` | 113 | — | Earlier take |
| `tutorial_after_tc4.json` | 129 | — | TC4 → TC5 sub-tutorial |
| `tutorial_after_tc4_v1_20260417_115924.json` | 118 | — | Earlier take |

**Gaps**: TC2→TC3 transition boundary (may be inside `tutorial_opening` — inspect that recording's final tap to know); TC5→TC6 not recorded; battles are embedded inline, not split into separate files.

### Naming convention for new recordings

The existing files use `tutorial_<label>` where label is `opening` / `after_tcN` — "after_tc3" means "the sub-tutorial that begins AFTER TC3 is reached" (so the TC3→TC4 progression). If you add new recordings, follow the same pattern:
- `tutorial_after_tc4.json` already exists; add `tutorial_after_tc5.json` for the TC5→TC6 gap.
- For separated battles or specific problem-points, `tutorial_battle2_and_loot_chest.json` etc.
- Versioned earlier takes get `_vN_YYYYMMDD_HHMMSS.json` suffix.

One file per **sub-tutorial boundary** — from one TC-level-up to the next. Rationale: sub-tutorials have relatively stable internal structure, but the gaps between them (upgrade waits) have variable duration. You want to replay per-sub-tutorial and re-measure TC level between each.

### Battles are special

Battles 1 and 3 are **pausable-retreat**: tap pause (148, 2186) → tap retreat → auto-complete. Battle 2 has **loot-chest after**: must be actively played, and the critical post-battle tap is the chest. Record these separately with clear annotations.

### Upgrade waits

Between sub-tutorials you wait 30-300 seconds for a construction to finish. Bug caught this session: the original replay capped delays at 30 seconds, truncating real 56-second waits and causing immediate drift. Fixed to 600s cap. The recorder preserves actual wall-time gaps — don't filter them out.

---

## 4. Replay — `run_full_tutorial.py`

```bash
# Replay all available sub-recordings in order, with TC-level gates between them
python3 run_full_tutorial.py

# Start mid-sequence (skip sub-recordings before a named one)
python3 run_full_tutorial.py --start-sub tutorial_after_tc3

# Or replay a single recording directly
python3 tutorial_recorder.py --replay tutorial_after_tc3
```

The orchestrator auto-discovers sub-recordings from `scraper/data/tutorials/*.json` in sorted order. There is no `--recordings-dir` or `--start-tc/--end-tc` flag — use `--start-sub NAME` to begin partway through.

Flow:
1. Read TC level via `tc_detector` (fails for new tutorial-state chars — bootstrap issue, see §5).
2. For each TC-gap in [start, end):
   - Replay `tc{N}_to_tc{N+1}.json`.
   - Every 10 actions: perceptual-hash check against reference screenshot. If Hamming distance > threshold, pause and try recovery (glow-follower, popup-handler, guide-bar tap).
   - On sub-tutorial success: wait for TC level to tick up. Timeout 300s.
3. On drift beyond recovery: abort, log state, surface to operator.

### Timing jitter rule

**Never faster than original.** Earlier bug: multiplicative jitter (0.5x-2.0x) made replay 50% faster than original in worst case, blowing past animations. Fixed to **additive jitter**: `delay += uniform(0.05, 0.15)`. Replay is always ≥ original timing.

### Drift detection (perceptual hashing)

Reference screenshot is taken every ~15 actions during recording (and on boundaries). At replay, take a screenshot at the same point, compute `aHash`, compare Hamming distance. Empirical threshold: distance > 12 out of 64 → likely drifted.

This catches ~80% of failure modes within 10-20 actions of drift onset, before divergence compounds.

---

## 5. Popup handler — `popup_handler.py`

Handles 7 popup types by pixel-signature matching:
1. Rookie Value Pack
2. First Purchase reward
3. Welcome Back (offline income)
4. Promo Pack (various)
5. Teleport Confirmation
6. Wilderness intro
7. Wish / Mystic Divination

Each signature = a small set of (x, y, expected_rgb_with_tolerance) tuples. Detection returns (popup_type, dismiss_coord).

### Known failure: false positives

**Tonight's K1003 failure** (2026-04-21) taught this one: the handler falsely detected a Promo Pack on a clean city view and tapped (1040, 130) + (1010, 175) — coordinates that on clean city view are the mail icon and event-schedule icon. Those taps navigated the phone AWAY from city view, destabilizing the subsequent leaderboard navigation. Scraper then couldn't find the category selector and aborted.

**Workaround**: `scrape_clean.py` wrapper — monkey-patches `PopupHandler.dismiss_all` to no-op. Use when repeated "Lost leaderboard context" failures correlate with popup_handler reports.

**Proper fix (not done)**: tighten each signature to require ALL pixels match (not just majority), and add a "sanity check" that the popup has the expected X-button where signatures predict. Currently the matcher is too loose.

### Rule P1 interaction

P1 says "screenshot before each dismissal tap." The handler violates this — it dismisses-by-signature without visual verification. That's the root of the false-positive problem. A rewrite should: (a) detect candidate popup, (b) screenshot, (c) verify X button exists at expected coord, (d) then tap.

---

## 6. Glow follower — `glow_follower.py`

The game renders a pulsing gold/yellow ring over the current tutorial target. Follow-the-glow = play-the-tutorial.

### Algorithm

1. Screenshot.
2. Mask pixels in the gold-yellow HSV range (H≈30-55°, S>180, V>200).
3. Cluster masked pixels (min cluster size 2500 px).
4. Pick the largest cluster — that's the glow.
5. Tap its centroid.

### Known failure: the coin icon

The gold-coin resource icon at top-right (~1040, 230) passed the gold-yellow mask AND the original cluster-size threshold of 500. The follower tapped it every iteration, thinking it was the tutorial target. Tapping the coin opens the "buy gems" shop — not tutorial progress.

**Fixes applied**:
- **Top-strip exclusion**: `y_min = 300` — ignore the entire top status bar where resource icons live.
- **Cluster size raised to 2500**: real tutorial glow is much larger than incidental icon highlights.
- **Change detection**: if the same pixel (±30 px) is tapped 3 times in a row, abort — we're stuck.

### What glow-follower cannot do

- It cannot identify which object is glowing (building vs NPC vs menu). Only where.
- It cannot tell if the glow is "tap to progress" vs "tap to open" (e.g., mailbox glow when there's no tutorial state).
- It cannot handle multi-tap sequences where the first tap opens a panel and the second tap is inside the panel.

Use glow-follower as a RECOVERY mechanism when replay drifts, not as primary navigation.

---

## 7. TC detector — `tc_detector.py`

The one truly reliable "am I done with this sub-tutorial" signal.

### How it works

1. Open profile (triple-tap avatar at 65, 165).
2. Screenshot.
3. OCR a fixed bbox on the profile panel where "Town Center Level: N" appears.
4. Extract N via regex `Town Center Level: (\d+)`.

### Limitations

- **Tutorial-state chars don't show the TC line.** Profiles on brand-new characters have no "Town Center Level" field until TC2+. Bootstrap problem: you need TC level to know if tutorial is done, but no way to read TC until tutorial is partially done.
- **OCR can misread** 5 as 6 or 8 as 3 when the font is blurry. Re-screenshot and retry.
- **Blocks on profile being reachable.** If the phone is mid-battle, mid-cutscene, or on a popup, you can't open profile. Must pre-clear before querying.

### Workaround for bootstrap

For TC1 → TC2 specifically, don't use tc_detector. Assume TC advances after the first sub-tutorial recording completes. Start using tc_detector at TC2.

---

## 8. Capture session — `capture_session.py` — the path forward

This is the tool that lets you BUILD the state machine. Not yet used to completion; this is the next step.

### What it does

Simultaneously runs:
- `adb shell screenrecord --time-limit 180 /sdcard/session.mp4` (chained in 180s segments, concatenated with ffmpeg)
- `adb shell getevent -lt /dev/input/event*` streaming touch events to a log
- A small Python clock that timestamps both streams to a common base

Output: `video.mp4` + `events.jsonl` — synchronized.

### How to use (intended flow)

```bash
# On a phone with a fresh character ready to tutorial
python3 capture_session.py start --output sessions/tc1_to_tc6_full.capture/
# (Architect plays through the ENTIRE tutorial from TC1 to TC6)
# Ctrl-C to stop
```

Output directory contains video + events + frame-extracts at each touch event.

### What the state machine is built FROM

For each touch event in events.jsonl:
1. Extract the video frame at the event timestamp (pre-tap — the screen state that led to this tap).
2. Human labels the frame with a **state name** (e.g., "battle_1_ready", "loot_chest_prompt", "welcome_back_popup").
3. Tap coord + state name become the transition: `state_X + tap(x,y) → state_Y`.

After ~100-200 labeled transitions, you have a state-transition graph covering the full tutorial.

### How replay works with the state machine

At each step:
1. Screenshot.
2. Match screenshot to known state (perceptual hash / small CNN / hand-written signatures).
3. Look up transition from current state → next.
4. Execute the tap.
5. Verify new state.
6. If no match: fall through to glow-follower (best-effort recovery).

This is fundamentally more robust than pure replay because it reasons about *where you are*, not *how many taps ago the recording was here*.

### Why this hasn't been built yet

State labeling is manual, tedious, and needs a UI. Estimated time: 4-6 hours of Architect-Claude pair work labeling ~150 frames. Deferred because the scraping pipeline is the immediate product; tutorial automation is the multiplier.

---

## 9. Known failure modes (catalog)

| Symptom | Cause | Recovery |
|---|---|---|
| Replay drifts after ~15 actions | Popup count mismatch between rec/replay kingdoms | Per-sub-tutorial recordings + TC-gate between them |
| Replay 2x faster than original | Multiplicative jitter | Additive jitter (fixed) |
| Delays truncate mid-animation | 30s cap on delay | Raise cap to 600s (fixed) |
| Glow-follower taps coin icon forever | Top-bar resource icons pass gold mask | y_min=300 exclude, cluster size 2500, same-spot detection (fixed) |
| popup_handler navigates to wrong screen | False-positive match on clean city view | `scrape_clean.py` wrapper; proper fix requires signature tightening |
| TC detector returns None | Tutorial-state char has no TC field on profile | Assume TC1 for bootstrap; use tc_detector from TC2+ |
| Stuck on cutscene, no skip button | Prince William scene waits ~2s before skip appears | Loop: screenshot, check for skip button, retry with 1s interval, max 10s |
| Battle 2 auto-retreated, no loot chest | Battle 2 is the one you MUST actively play | Annotate recording: "no retreat here, must fight" |

---

## 10. What to do next (concrete)

If the next mind picks this up, do NOT try to make pure-replay work. It will fail.

Instead, in priority order:

1. **Run `capture_session.py` on an Architect playthrough of TC1→TC6.** One session, ~45 minutes, produces the raw material.
2. **Build a frame-labeling UI.** Web-based is easiest: Flask + HTML showing frame N with dropdown of existing state names + "new state" option. ~4 hours to build, then label ~150 frames in 2-3 hours.
3. **Write the state machine.** Read `states.json` + `transitions.json`. For each unknown state, fall back to glow-follower. Success metric: completes TC1→TC6 on a fresh character without human intervention, 3 times in a row.
4. **Tighten popup_handler signatures.** Each signature should require X-button visible at expected coord. Eliminates the false-positive class that crashed scraping tonight.
5. **Plug the state machine into the scrape pipeline.** `scrape_account.py` should auto-run the tutorial state machine for any character below TC6 before attempting to scrape.

---

## 11. Quick command reference

```bash
# List all existing recordings
python3 tutorial_recorder.py --list

# Record a new sub-tutorial (saves to data/tutorials/<NAME>.json)
python3 tutorial_recorder.py --record tutorial_after_tc5

# Replay one sub-tutorial by name
python3 tutorial_recorder.py --replay tutorial_after_tc3

# Orchestrate all sub-recordings with TC-level gates between them
python3 run_full_tutorial.py

# Start the orchestrator from a specific sub-tutorial onward
python3 run_full_tutorial.py --start-sub tutorial_after_tc3

# Capture Architect playthrough (for state-machine building)
python3 capture_session.py start --output sessions/architect_playthrough/

# Query TC level
python3 tc_detector.py --read-tc

# Dismiss any popups on current screen
python3 popup_handler.py --dismiss-all

# Follow the glow once
python3 glow_follower.py --tap-once

# Discover coordinates on an unknown screen
python3 tutorial_explorer.py
```

**File paths:**
- Recordings: `scraper/data/tutorials/<NAME>.json` (plus `_raw.txt`, `_refs/`, `_replay_shots/`)
- Capture sessions: `scraper/sessions/<timestamp>/` (directory does not yet exist — create it)

---

## 12. Don't forget

- **Measure every coordinate before each tap** (see SCRAPING_RULEBOOK.md M1). The tutorial recorder's reference screenshots help but do not replace measurement.
- **Tutorial-state characters break `--skip-audit=false`.** Always use `--skip-audit` until TC6+.
- **Battles and cutscenes are the two high-variance regions.** 80% of replay failures cluster there. When debugging, start by watching what happens at the first battle.
- **The guide bar at bottom-left ("Chapter X: Y") is the most stable UI element in the tutorial.** It re-appears after every interruption, always shows the next objective, and is tappable to auto-navigate. Treat it as an anchor when lost.
- **State machine beats replay. Replay beats nothing.** If you don't have time for the state machine, the current replay system is still better than fully manual — just expect to intervene every 15-20 actions.

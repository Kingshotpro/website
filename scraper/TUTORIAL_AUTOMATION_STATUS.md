# Tutorial Automation — Status & Diagnostics

_Last updated: 2026-04-17_

## What works

- **Recording**: `tutorial_recorder.py --record NAME` captures every touch via `adb shell getevent -lt`, writes raw events incrementally to disk, saves reference screenshots every 10 touches to `{name}_refs/`.
- **Parsing**: classifies touches as taps (distance <30px) or swipes. Long-press auto-becomes tap (safer for replay).
- **Persistence**: `--from-raw NAME` re-parses a raw file to JSON. Raw survives `kill`.
- **Drift detection**: every 10 actions during replay, perceptual-hash the live screen vs the reference. Distance >50/256 = abort with `sys.exit(3)`.
- **Timing**: minimal additive jitter (+50ms mean, +150ms max). Never faster than original. Upgrade waits preserved up to 10 minutes.
- **Coord jitter**: ±3px (near-exact replay).

## What doesn't work yet

### 1. Opening-sequence replay
**Fails every time at actions 10–20.** Root cause: the game presents different numbers of promo popups / cinematic dialogues on each new kingdom. Recording's first ~20 taps close popups in a specific order; replay hits different popups (or empty screens) depending on what the game throws up this particular session.

**Evidence:**
- K1005 test 1: drift action 10, distance 130 — replay at Refugee dialogue, reference at Kitchen panel
- K1005 test 2 (with fixes): drift action 10, distance 102 — similar miss
- Taps #2, #3, #7 of recording are all top-right area (close X) — variable popup count breaks everything after

### 2. Between-subs gate detection
Cannot use profile OCR for TC level on tutorial-state characters — the profile panel doesn't show "Town Center Level: N" until after tutorial completion. Current fallback is glow-presence polling, but the game enters free-play mode between tutorial beats (no glow) — orchestrator waits forever.

### 3. Glow-follower false positives
Gold coin icon at (1040, 230) in top bar is frequently picked as "the tutorial glow" over the actual pulsing ring. Partial fix applied (raised `y_min` to 300, raised `min_cluster` to 2500). Still needs validation on a live tutorial-glow state.

## Architect's guidance for the approach

User plays the tutorial by following the **"narrow rectangular banner"** at the bottom of the city screen (e.g., "Chapter 2: A Safe Labor"). This banner + hand cursor walks through the tutorial to TC5. The banner is a reliable anchor; the popups and forced battles are the variable elements.

**Implication:** a more robust automation would detect the banner and tap to follow it, rather than relying on absolute-coord recordings.

## Known recordings (v2, Confirm-anchored)

| Name | Actions | Duration | First tap |
|------|---------|----------|-----------|
| tutorial_opening | 135 | 8.7 min | (799, 1458) — character-creation Confirm |
| tutorial_after_tc3 | 112 | 5.4 min | (271, 2114) — bottom chapter banner |
| tutorial_after_tc4 | 129 | 6.0 min | bottom chapter banner |

v1 recordings archived with `_v1_<timestamp>` suffix.

## Recommendations

1. **Accept that pure tap-replay for the opening sequence is fragile.** Game non-determinism at tutorial start is too large to replay.

2. **Alternative mechanism for tutorial progression**: build a **banner-follower**. Detect the Chapter banner at bottom of screen via color/position signature; tap the glow/hand cursor near it. This avoids coord-based recording entirely.

3. **Keep recordings as a fallback** for deterministic mid-tutorial segments (where the banner mechanism might fail or be absent).

4. **Between-subs "ready" detection**: combine (a) glow-presence, (b) chapter banner visibility, (c) time-based backoff. When all three signal "ready," proceed.

## Files involved

- `tutorial_recorder.py` — record, parse, replay, drift-check
- `tc_detector.py` — TC level via profile OCR (post-tutorial only)
- `glow_follower.py` — scan for gold cluster, tap it (with change-detection anti-loop)
- `popup_handler.py` — 7 popup types, region-averaged pixel signatures
- `run_full_tutorial.py` — orchestrator, sub-tutorial sequencing, gate waits

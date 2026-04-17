#!/usr/bin/env python3
"""
Tutorial Recorder — captures raw touch events from the phone during
manual tutorial playthrough. Saves as a replayable JSON sequence.

Usage:
    python3 tutorial_recorder.py --record tutorial_run_01
    python3 tutorial_recorder.py --replay tutorial_run_01
    python3 tutorial_recorder.py --list

Record: starts capturing touch events via `adb shell getevent`.
        Press Ctrl+C to stop recording. Saves to data/tutorials/<name>.json

Replay: picks the named recording (or random if --random),
        replays with Gaussian jitter on timing and coordinates.

The Architect plays through the tutorial manually 10 times.
Each recording becomes one possible replay path.
When entering a new kingdom, the scraper picks one at random and replays it.
"""

import subprocess
import sys
import os
import json
import time
import re
import random
import signal
import math
from pathlib import Path
from datetime import datetime

# ---------------------------------------------------------------------------
# Find ADB
# ---------------------------------------------------------------------------

def find_adb():
    candidates = [
        os.path.expanduser("~/platform-tools/adb"),
        "/usr/local/bin/adb",
        "adb",
    ]
    for c in candidates:
        try:
            result = subprocess.run([c, "version"], capture_output=True, timeout=5)
            if result.returncode == 0:
                return c
        except (FileNotFoundError, subprocess.TimeoutExpired):
            continue
    print("ERROR: ADB not found.")
    sys.exit(1)

ADB = find_adb()
TUTORIAL_DIR = Path(__file__).parent / "data" / "tutorials"

# Samsung A16 5G screen dimensions
SCREEN_W = 1080
SCREEN_H = 2340

# ---------------------------------------------------------------------------
# Event parsing — getevent format
# ---------------------------------------------------------------------------
# adb shell getevent -lt outputs lines like:
#   [   12345.678901] /dev/input/event4: EV_ABS  ABS_MT_POSITION_X  000001e0
#   [   12345.678901] /dev/input/event4: EV_ABS  ABS_MT_POSITION_Y  00000320
#   [   12345.678901] /dev/input/event4: EV_ABS  ABS_MT_TRACKING_ID 00000000
#   [   12345.678901] /dev/input/event4: EV_SYN  SYN_REPORT         00000000
#
# Touch sequence: TRACKING_ID (start) -> X/Y updates -> TRACKING_ID ffffffff (lift)
# We compress these into high-level actions: tap(x,y) or swipe(x1,y1,x2,y2,duration)

def parse_getevent_line(line):
    """Parse one getevent -lt line into (timestamp, event_type, code, value)."""
    m = re.match(
        r'\[\s*([\d.]+)\]\s+\S+:\s+(\S+)\s+(\S+)\s+([0-9a-fA-F]+)',
        line.strip()
    )
    if not m:
        return None
    ts = float(m.group(1))
    etype = m.group(2)
    code = m.group(3)
    value = int(m.group(4), 16)
    # Handle signed 32-bit for tracking ID ffffffff
    if value > 0x7FFFFFFF:
        value = value - 0x100000000
    return ts, etype, code, value


def raw_events_to_actions(raw_lines):
    """
    Convert raw getevent lines into a list of high-level actions:
    [
        {"action": "tap", "x": 540, "y": 1170, "time": 0.0},
        {"action": "swipe", "x1": 540, "y1": 1500, "x2": 540, "y2": 800,
         "duration_ms": 350, "time": 1.234},
        ...
    ]

    time = seconds since first event (relative timestamps).
    """
    actions = []

    # Track current touch state
    cur_x = None
    cur_y = None
    touch_start_ts = None
    touch_start_x = None
    touch_start_y = None
    tracking = False
    first_ts = None

    for line in raw_lines:
        parsed = parse_getevent_line(line)
        if not parsed:
            continue
        ts, etype, code, value = parsed

        if first_ts is None:
            first_ts = ts

        if etype == 'EV_ABS':
            if code == 'ABS_MT_TRACKING_ID':
                if value >= 0:
                    # Touch down
                    tracking = True
                    touch_start_ts = ts
                    cur_x = None
                    cur_y = None
                    touch_start_x = None
                    touch_start_y = None
                else:
                    # Touch up (value = -1 / ffffffff)
                    if tracking and touch_start_x is not None and touch_start_y is not None:
                        duration_ms = int((ts - touch_start_ts) * 1000)
                        rel_time = round(touch_start_ts - first_ts, 3)

                        # Classify: tap vs swipe
                        end_x = cur_x if cur_x is not None else touch_start_x
                        end_y = cur_y if cur_y is not None else touch_start_y
                        dx = abs(end_x - touch_start_x)
                        dy = abs(end_y - touch_start_y)
                        distance = math.sqrt(dx*dx + dy*dy)

                        # Tap-only policy: any touch with minimal movement
                        # becomes a tap regardless of duration. This means
                        # accidental long-presses (finger held down) still
                        # replay as safe normal taps instead of risky swipes.
                        if distance < 30:
                            actions.append({
                                "action": "tap",
                                "x": touch_start_x,
                                "y": touch_start_y,
                                "time": rel_time,
                            })
                        else:
                            # Genuine swipe (movement ≥30px)
                            actions.append({
                                "action": "swipe",
                                "x1": touch_start_x,
                                "y1": touch_start_y,
                                "x2": end_x,
                                "y2": end_y,
                                "duration_ms": max(duration_ms, 100),
                                "time": rel_time,
                            })
                    tracking = False

            elif code == 'ABS_MT_POSITION_X':
                cur_x = value
                if touch_start_x is None:
                    touch_start_x = value
            elif code == 'ABS_MT_POSITION_Y':
                cur_y = value
                if touch_start_y is None:
                    touch_start_y = value

    return actions


# ---------------------------------------------------------------------------
# Recorder
# ---------------------------------------------------------------------------

def record(name):
    """Record touch events until Ctrl+C."""
    TUTORIAL_DIR.mkdir(parents=True, exist_ok=True)
    outfile = TUTORIAL_DIR / f"{name}.json"

    if outfile.exists():
        print(f"Recording '{name}' already exists. Overwrite? (y/n): ", end='')
        if input().strip().lower() != 'y':
            print("Aborted.")
            return

    print(f"=== TUTORIAL RECORDER ===")
    print(f"Recording to: {outfile}")
    print(f"Device: Samsung A16 ({SCREEN_W}x{SCREEN_H})")
    print()
    print("Play through the tutorial on the phone now.")
    print("Press Ctrl+C when finished.")
    print()

    # First, find the right input device for touch
    # On Samsung A16 it's typically /dev/input/event4 but let's detect
    proc = subprocess.Popen(
        [ADB, "shell", "getevent", "-lt"],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        bufsize=1,
    )

    raw_lines = []
    event_count = 0
    start_time = time.time()
    raw_file = TUTORIAL_DIR / f"{name}_raw.txt"
    refs_dir = TUTORIAL_DIR / f"{name}_refs"
    refs_dir.mkdir(exist_ok=True)
    REF_EVERY_N = 10  # save a reference screenshot every N touch-downs

    def handle_sigint(sig, frame):
        proc.terminate()

    signal.signal(signal.SIGINT, handle_sigint)

    # Save raw events incrementally so a kill doesn't lose data
    raw_fh = open(raw_file, 'w')

    def _capture_ref(action_idx):
        """Save a reference screenshot keyed by touch-event count."""
        try:
            path = refs_dir / f"action_{action_idx:04d}.png"
            res = subprocess.run(
                [ADB, "exec-out", "screencap", "-p"],
                capture_output=True, timeout=5
            )
            if res.returncode == 0:
                with open(path, 'wb') as f:
                    f.write(res.stdout)
        except Exception:
            pass  # never break recording for a screenshot failure

    try:
        for line in proc.stdout:
            raw_lines.append(line)
            raw_fh.write(line)
            raw_fh.flush()
            if 'ABS_MT_TRACKING_ID' in line and 'ffffffff' not in line:
                event_count += 1
                elapsed = time.time() - start_time
                mins = int(elapsed // 60)
                secs = int(elapsed % 60)
                print(f"\r  Touch events: {event_count}  |  Elapsed: {mins}:{secs:02d}",
                      end='', flush=True)
                # Capture reference screenshot at checkpoints
                if event_count % REF_EVERY_N == 0:
                    _capture_ref(event_count)
    except KeyboardInterrupt:
        pass
    finally:
        raw_fh.close()
        proc.terminate()
        try:
            proc.wait(timeout=3)
        except subprocess.TimeoutExpired:
            proc.kill()

    print(f"\n\nProcessing {len(raw_lines)} raw events...")

    actions = raw_events_to_actions(raw_lines)

    if not actions:
        print("No touch actions captured. Nothing saved.")
        return

    # Calculate total duration
    total_duration = actions[-1]["time"]

    recording = {
        "name": name,
        "recorded_at": datetime.now().isoformat(),
        "device": "Samsung A16 5G",
        "screen": {"width": SCREEN_W, "height": SCREEN_H},
        "total_duration_s": round(total_duration, 1),
        "action_count": len(actions),
        "actions": actions,
    }

    with open(outfile, 'w') as f:
        json.dump(recording, f, indent=2)

    # Summary
    taps = sum(1 for a in actions if a["action"] == "tap")
    swipes = sum(1 for a in actions if a["action"] == "swipe")

    print(f"\nSaved: {outfile}")
    print(f"  Actions: {len(actions)} ({taps} taps, {swipes} swipes)")
    print(f"  Duration: {total_duration:.0f}s ({total_duration/60:.1f} min)")


# ---------------------------------------------------------------------------
# Replayer
# ---------------------------------------------------------------------------

def gauss_clamp(mean, std, low, high):
    """Gaussian with clamp."""
    val = random.gauss(mean, std)
    return max(low, min(high, val))


def _ahash(img, size=16):
    """
    Average hash (aHash) — a perceptual image hash.
    Returns a 256-bit fingerprint (as integer). Same scene = same hash
    (even with small pixel jitter). Different scenes = very different hash.
    """
    from PIL import Image as _I
    small = img.convert('L').resize((size, size), _I.BILINEAR)
    pixels = list(small.getdata())
    mean = sum(pixels) / len(pixels)
    bits = 0
    for i, p in enumerate(pixels):
        if p >= mean:
            bits |= (1 << i)
    return bits


def _hamming(a, b):
    """Count differing bits between two integer hashes."""
    return bin(a ^ b).count('1')


def _check_drift(ref_path, current_img, threshold=40):
    """
    Compare the live screenshot against a reference. Returns
    (ok: bool, distance: int).
    threshold: max Hamming distance (out of 256) considered "same scene".
    ~40 is a reasonable middle ground — identical scenes score ~0-10,
    different scenes score 80-200.
    """
    from PIL import Image
    try:
        ref_img = Image.open(ref_path)
    except Exception:
        return (True, 0)  # can't open reference — skip check rather than fail
    h1 = _ahash(ref_img)
    h2 = _ahash(current_img)
    dist = _hamming(h1, h2)
    return (dist <= threshold, dist)


def replay(name, jitter_px=10, start_at=0, slowdown=1.15, screenshot_every=25,
           drift_check=True, drift_threshold=50, drift_abort=True):
    """
    Replay a recorded tutorial with human-like jitter.

    - Timing never runs faster than original. Mean 115% of original, max 180%.
    - Minimum 300ms between actions (humans don't spam taps).
    - Long pauses capped at 30s.

    jitter_px: Gaussian std for coordinate offset in pixels
    start_at: 1-based index to start replay from (useful after a crash/miss)
    slowdown: average timing multiplier (1.15 = 15% slower on average)
    """
    infile = TUTORIAL_DIR / f"{name}.json"
    if not infile.exists():
        print(f"Recording '{name}' not found.")
        available = list_recordings()
        if available:
            print(f"Available: {', '.join(available)}")
        return

    recording = json.load(open(infile))
    actions = recording["actions"]

    print(f"=== TUTORIAL REPLAY ===")
    print(f"Recording: {name}")
    print(f"Actions: {recording['action_count']} over {recording['total_duration_s']}s")
    print(f"Jitter: coords ±{jitter_px}px, timing {int(slowdown*100)}%+ (never faster than original)")
    if start_at > 0:
        print(f"Starting from action {start_at}")
    print()

    prev_time = actions[max(start_at - 1, 0)]["time"] if start_at > 0 else 0

    for i, act in enumerate(actions):
        if i + 1 < start_at:  # skip actions before start_at
            prev_time = act["time"]
            continue
        # Calculate delay since last action, with jitter
        delay = act["time"] - prev_time
        if delay > 0:
            # Never faster than original (low=1.0). Mean = slowdown. Max 1.8x.
            jittered_delay = delay * gauss_clamp(slowdown, 0.15, 1.0, 1.8)
            # Enforce minimum 300ms floor
            jittered_delay = max(jittered_delay, 0.3)
            # Cap at 30s
            jittered_delay = min(jittered_delay, 30.0)
            time.sleep(jittered_delay)
        prev_time = act["time"]

        if act["action"] == "tap":
            x = int(act["x"] + gauss_clamp(0, jitter_px, -jitter_px*2, jitter_px*2))
            y = int(act["y"] + gauss_clamp(0, jitter_px, -jitter_px*2, jitter_px*2))
            # Clamp to screen
            x = max(0, min(SCREEN_W - 1, x))
            y = max(0, min(SCREEN_H - 1, y))

            subprocess.run([ADB, "shell", "input", "tap", str(x), str(y)],
                          capture_output=True, timeout=10)
            print(f"  [{i+1}/{len(actions)}] tap ({x}, {y})")

        elif act["action"] == "swipe":
            x1 = int(act["x1"] + gauss_clamp(0, jitter_px, -jitter_px*2, jitter_px*2))
            y1 = int(act["y1"] + gauss_clamp(0, jitter_px, -jitter_px*2, jitter_px*2))
            x2 = int(act["x2"] + gauss_clamp(0, jitter_px, -jitter_px*2, jitter_px*2))
            y2 = int(act["y2"] + gauss_clamp(0, jitter_px, -jitter_px*2, jitter_px*2))
            dur = int(act["duration_ms"] * gauss_clamp(1.0, 0.15, 0.7, 1.5))

            x1 = max(0, min(SCREEN_W - 1, x1))
            y1 = max(0, min(SCREEN_H - 1, y1))
            x2 = max(0, min(SCREEN_W - 1, x2))
            y2 = max(0, min(SCREEN_H - 1, y2))
            dur = max(100, dur)

            subprocess.run([ADB, "shell", "input", "swipe",
                          str(x1), str(y1), str(x2), str(y2), str(dur)],
                          capture_output=True, timeout=15)
            print(f"  [{i+1}/{len(actions)}] swipe ({x1},{y1})->({x2},{y2}) {dur}ms")

        # Drift-check against reference screenshot every 10 actions
        if drift_check and (i + 1) % 10 == 0:
            ref_path = TUTORIAL_DIR / f"{name}_refs" / f"action_{i+1:04d}.png"
            if ref_path.exists():
                try:
                    from PIL import Image
                    from io import BytesIO
                    # Brief settle so in-flight animations finish before
                    # comparing. Reference screenshots during recording were
                    # captured at tap-start; here we compensate.
                    time.sleep(0.5)
                    res = subprocess.run(
                        [ADB, "exec-out", "screencap", "-p"],
                        capture_output=True, timeout=10
                    )
                    if res.returncode == 0:
                        current = Image.open(BytesIO(res.stdout))
                        ok, dist = _check_drift(ref_path, current, threshold=drift_threshold)
                        if ok:
                            print(f"    ✓ drift-check @ action {i+1}: distance={dist} (ok)")
                        else:
                            print(f"    ⚠ DRIFT @ action {i+1}: distance={dist} (threshold={drift_threshold})")
                            if drift_abort:
                                # Save the mismatch for debugging
                                shot_dir = TUTORIAL_DIR / f"{name}_replay_shots"
                                shot_dir.mkdir(exist_ok=True)
                                current.save(shot_dir / f"DRIFT_action_{i+1:04d}.png")
                                print(f"    saved mismatch to {shot_dir}/DRIFT_action_{i+1:04d}.png")
                                print(f"\n✗ Aborting replay at action {i+1} — state does not match reference")
                                sys.exit(3)
                except Exception as e:
                    print(f"    (drift-check skipped: {e})")

        # Periodic screenshot so user can match phone state to action number
        if screenshot_every > 0 and (i + 1) % screenshot_every == 0:
            try:
                shot_dir = TUTORIAL_DIR / f"{name}_replay_shots"
                shot_dir.mkdir(exist_ok=True)
                path = shot_dir / f"action_{i+1:04d}.png"
                res = subprocess.run(
                    [ADB, "exec-out", "screencap", "-p"],
                    capture_output=True, timeout=10
                )
                if res.returncode == 0:
                    with open(path, 'wb') as f:
                        f.write(res.stdout)
                    print(f"    📸 saved {path.name}")
            except Exception as e:
                print(f"    (screenshot skipped: {e})")

    print(f"\nReplay complete. {len(actions)} actions executed.")


def replay_random(jitter_px=10, slowdown=1.15, drift_check=True,
                  drift_threshold=50, drift_abort=True):
    """Pick a random recording and replay it."""
    available = list_recordings()
    if not available:
        print("No recordings found. Record some tutorials first.")
        return

    choice = random.choice(available)
    print(f"Randomly selected: {choice}")
    replay(choice, jitter_px=jitter_px, slowdown=slowdown,
           drift_check=drift_check, drift_threshold=drift_threshold,
           drift_abort=drift_abort)


# ---------------------------------------------------------------------------
# List
# ---------------------------------------------------------------------------

def list_recordings():
    """List all saved tutorial recordings."""
    if not TUTORIAL_DIR.exists():
        return []

    recordings = []
    for f in sorted(TUTORIAL_DIR.glob("*.json")):
        recordings.append(f.stem)
    return recordings


def print_recordings():
    """Print all recordings with details."""
    recs = list_recordings()
    if not recs:
        print("No tutorial recordings found.")
        print(f"  Directory: {TUTORIAL_DIR}")
        print(f"  Record one: python3 tutorial_recorder.py --record tutorial_run_01")
        return

    print(f"=== Tutorial Recordings ({len(recs)}) ===")
    for name in recs:
        data = json.load(open(TUTORIAL_DIR / f"{name}.json"))
        taps = sum(1 for a in data["actions"] if a["action"] == "tap")
        swipes = sum(1 for a in data["actions"] if a["action"] == "swipe")
        print(f"  {name}: {data['action_count']} actions "
              f"({taps} taps, {swipes} swipes), "
              f"{data['total_duration_s']}s, "
              f"recorded {data['recorded_at'][:10]}")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Tutorial Recorder/Replayer")
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--record", metavar="NAME",
                      help="Record a tutorial playthrough")
    mode.add_argument("--replay", metavar="NAME", nargs='?', const='__random__',
                      help="Replay a recording (or random if no name given)")
    mode.add_argument("--list", action="store_true",
                      help="List all recordings")
    mode.add_argument("--from-raw", metavar="NAME",
                      help="Reprocess a raw event file into JSON")

    parser.add_argument("--jitter-px", type=int, default=10,
                        help="Coordinate jitter std in pixels (default: 10)")
    parser.add_argument("--start-at", type=int, default=0,
                        help="1-based action index to start replay from")
    parser.add_argument("--slowdown", type=float, default=1.15,
                        help="Timing multiplier mean (1.15 = 15%% slower than original)")
    parser.add_argument("--no-drift-check", action="store_true",
                        help="Disable perceptual-hash drift detection during replay")
    parser.add_argument("--drift-threshold", type=int, default=50,
                        help="Max Hamming distance to consider 'same scene' (default: 50/256)")
    parser.add_argument("--no-drift-abort", action="store_true",
                        help="Warn on drift but continue (default: abort)")

    args = parser.parse_args()

    if args.from_raw:
        name = args.from_raw
        raw_file = TUTORIAL_DIR / f"{name}_raw.txt"
        if not raw_file.exists():
            print(f"Raw file not found: {raw_file}")
            sys.exit(1)
        print(f"Reprocessing raw events from {raw_file}...")
        raw_lines = open(raw_file).readlines()
        actions = raw_events_to_actions(raw_lines)
        if not actions:
            print("No actions parsed.")
            sys.exit(1)
        # Only collapse EXTREME idle gaps (>10 minutes) — those are naps/interruptions
        # Natural 1-3 minute pauses are KEPT — humans don't tap like metronomes.
        trimmed = [actions[0]]
        for a in actions[1:]:
            gap = a["time"] - trimmed[-1]["time"] if trimmed else 0
            if gap > 600:  # 10 min = almost certainly a nap, not gameplay
                a = dict(a)
                a["time"] = trimmed[-1]["time"] + 90.0  # preserve a plausible human pause
            trimmed.append(a)
        # Re-base times to start at 0
        base = trimmed[0]["time"]
        for a in trimmed:
            a["time"] = round(a["time"] - base, 3)
        total_duration = trimmed[-1]["time"]
        taps = sum(1 for a in trimmed if a["action"] == "tap")
        swipes = sum(1 for a in trimmed if a["action"] == "swipe")
        recording = {
            "name": name,
            "recorded_at": datetime.now().isoformat(),
            "device": "Samsung A16 5G",
            "screen": {"width": SCREEN_W, "height": SCREEN_H},
            "total_duration_s": round(total_duration, 1),
            "action_count": len(trimmed),
            "actions": trimmed,
        }
        outfile = TUTORIAL_DIR / f"{name}.json"
        with open(outfile, 'w') as f:
            json.dump(recording, f, indent=2)
        print(f"Saved: {outfile}")
        print(f"  Actions: {len(trimmed)} ({taps} taps, {swipes} swipes)")
        print(f"  Duration: {total_duration:.0f}s ({total_duration/60:.1f} min)")
        print(f"  (only >10min gaps collapsed; natural pauses preserved for realism)")
    elif args.record:
        record(args.record)
    elif args.list:
        print_recordings()
    elif args.replay is not None:
        common = dict(
            jitter_px=args.jitter_px,
            slowdown=args.slowdown,
            drift_check=not args.no_drift_check,
            drift_threshold=args.drift_threshold,
            drift_abort=not args.no_drift_abort,
        )
        if args.replay == '__random__':
            replay_random(**common)
        else:
            replay(args.replay, start_at=args.start_at, **common)

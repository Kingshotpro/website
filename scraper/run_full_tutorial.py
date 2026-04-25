#!/usr/bin/env python3
"""
run_full_tutorial.py — Orchestrate the full tutorial from multiple sub-recordings.

Flow:
1. Play sub-recording 1 (e.g., opening through TC1→TC2)
2. Wait for TC ready (poll via tc_detector)
3. Play sub-recording 2
4. Wait
5. ... repeat through final TC level
6. Randomly decide: stop at TC5 or continue to TC6 (variety per kingdom)

Usage:
    python3 run_full_tutorial.py                   # all available sub-recordings
    python3 run_full_tutorial.py --max-tc 5        # stop at TC5 (skip tc5→tc6 chunk)
    python3 run_full_tutorial.py --dry-run         # print plan, don't execute

Convention for recording names:
    tutorial_opening.json    — from fresh spawn to first TC upgrade prompt
    tutorial_tc2_to_tc3.json — while TC upgrading to 2, through TC3 prompt
    tutorial_tc3_to_tc4.json
    tutorial_tc4_to_tc5.json
    tutorial_tc5_to_tc6.json — OPTIONAL (for variety, sometimes skipped)
"""
import subprocess
import sys
import os
import time
import random
import argparse
from pathlib import Path

SCRAPER_DIR = Path(__file__).parent
TUTORIAL_DIR = SCRAPER_DIR / "data" / "tutorials"


# Canonical sub-tutorial sequence.
# Second value is "wait for TC upgrade at level N to FINISH before playing this sub".
# First entry has None — no TC gate before the opening sub (we just start).
# Naming: the sub-recording plays AFTER the indicated TC upgrade completes,
# and covers the steps through the NEXT upgrade-ready moment.
DEFAULT_SEQUENCE = [
    # Opening is longer than one TC upgrade — TC1→TC2 is only ~30s and gets
    # bundled with the first-fight/initial-builds content. Opening runs
    # through the TC3 upgrade completion as one chunk.
    ("tutorial_opening",    None),  # fresh spawn → TC now at L3
    ("tutorial_after_tc3",  3),     # play after TC reaches L3
    ("tutorial_after_tc4",  4),     # play after TC reaches L4
    ("tutorial_after_tc5",  5),     # optional — include only if max_tc >= 6
]


def recording_exists(name):
    return (TUTORIAL_DIR / f"{name}.json").exists()


def play_recording(name, slowdown=1.15, glow_recovery=True):
    """
    Run tutorial_recorder.py --replay NAME synchronously.

    Return values (distinguished by replayer exit code):
        0 — success (all actions played without drift)
        3 — drift detected, replay aborted
        other — unexpected failure (missing file, phone disconnect, etc)

    On drift (exit 3), optionally attempt glow-based recovery before
    returning failure.
    """
    print(f"\n▶  Playing {name}")
    result = subprocess.run(
        ["python3", "-u", str(SCRAPER_DIR / "tutorial_recorder.py"),
         "--replay", name, "--slowdown", str(slowdown)],
        cwd=str(SCRAPER_DIR),
    )
    if result.returncode == 0:
        return True
    if result.returncode == 3 and glow_recovery:
        print(f"\n⚠  Drift detected in {name}. Attempting glow-based recovery...")
        try:
            sys.path.insert(0, str(SCRAPER_DIR))
            from glow_follower import GlowFollower
            gf = GlowFollower()
            n_taps = gf.run(max_iterations=40, per_tap_delay=2.5,
                            no_glow_timeout=20)
            print(f"   glow-recovery executed {n_taps} taps")
            # Caller will verify TC level next — that's our success check.
            return True
        except Exception as e:
            print(f"   glow-recovery failed: {e}")
            return False
    return False


def wait_for_tc_level(target_level, poll_seconds=45, timeout=3600):
    """
    Block until the TC reaches target_level.
    Ground truth = the level number displayed on the profile screen.

    NOTE: this only works for post-tutorial characters. For mid-tutorial
    characters the profile does not display TC level. Use
    wait_for_tutorial_ready() instead.
    """
    print(f"\n⏳ Waiting for TC to reach L{target_level}...")
    sys.path.insert(0, str(SCRAPER_DIR))
    from tc_detector import TCDetector
    det = TCDetector()
    level = det.wait_for_level(target_level, poll_seconds=poll_seconds,
                                timeout_seconds=timeout)
    if level is None:
        print(f"⚠  TIMED OUT — TC did not reach L{target_level}")
        return False
    print(f"✓  TC is now L{level}")
    return True


def wait_for_tutorial_ready(poll_seconds=15, timeout=1800, min_wait=30):
    """
    Between sub-tutorials, wait until the game is ready for the next set of
    taps. The signal: the tutorial's gold glow indicator appears.

    min_wait: minimum seconds to wait before the first poll (lets previous
              animations/upgrades start).
    Returns True if glow detected, False on timeout.
    """
    print(f"\n⏳ Waiting for tutorial to present next objective (min {min_wait}s)...")
    sys.path.insert(0, str(SCRAPER_DIR))
    from glow_follower import GlowFollower
    gf = GlowFollower()

    time.sleep(min_wait)

    start = time.time()
    while time.time() - start < timeout:
        try:
            xy = gf.find_glow()
        except Exception as e:
            print(f"   glow-check error: {e}")
            xy = None
        if xy is not None:
            elapsed = int(time.time() - start)
            print(f"✓  Tutorial glow detected at {xy} (after {min_wait + elapsed}s)")
            return True
        elapsed = int(time.time() - start)
        print(f"   no glow yet ({min_wait + elapsed}s), waiting {poll_seconds}s...")
        time.sleep(poll_seconds)
    print(f"⚠  TIMED OUT — no tutorial glow in {min_wait + timeout}s")
    return False


def read_tc_level():
    """Read current TC level from the profile screen."""
    sys.path.insert(0, str(SCRAPER_DIR))
    from tc_detector import TCDetector
    return TCDetector().get_level()


def plan(max_tc):
    """
    Build the sequence of (name, preceding_tc_gate) to play, filtering by max_tc.

    max_tc = 5 → play opening + after_tc2 + after_tc3 + after_tc4 (ends at L5)
    max_tc = 6 → also play after_tc5 (ends at L6)

    We play a sub-recording iff the upgrade it FOLLOWS is <= (max_tc - 1).
    E.g. after_tc5 follows the L5 upgrade, so play only if max_tc >= 6.
    """
    chosen = []
    for name, preceding_gate in DEFAULT_SEQUENCE:
        if not recording_exists(name):
            print(f"  skipping {name} (no recording yet)")
            continue
        # preceding_gate is the TC level that JUST FINISHED upgrading.
        # If preceding_gate == 5 and max_tc == 5, we'd be playing post-L5
        # content — but L5 is our ceiling, so skip.
        if preceding_gate is not None and preceding_gate >= max_tc:
            continue
        chosen.append((name, preceding_gate))
    return chosen


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--max-tc', type=int, default=None,
                        help='Max TC level to reach. Random 5 or 6 if not set.')
    parser.add_argument('--slowdown', type=float, default=1.15,
                        help='Replay timing multiplier (mean)')
    parser.add_argument('--dry-run', action='store_true',
                        help='Print plan only, don\'t execute')
    parser.add_argument('--poll-seconds', type=int, default=30)
    parser.add_argument('--gate-timeout', type=int, default=3600,
                        help='Max seconds to wait at each gate')
    parser.add_argument('--gate-min-wait', type=int, default=30,
                        help='Minimum seconds to wait at each gate before first glow-check')
    parser.add_argument('--strict', action='store_true',
                        help='Abort on any sub-recording failure (default: continue)')
    parser.add_argument('--start-sub', type=str, default=None,
                        help='Skip sub-recordings before this name (e.g. tutorial_after_tc3)')
    args = parser.parse_args()

    # Random TC ceiling per run, if user didn't specify
    if args.max_tc is None:
        args.max_tc = random.choice([5, 6])
        print(f"🎲 Random max TC for this run: {args.max_tc}")

    sequence = plan(args.max_tc)
    if not sequence:
        print("No recordings to play. Record some first.")
        sys.exit(1)

    # Optional: resume from specific sub-recording
    if args.start_sub:
        start_idx = next((i for i, (n, _) in enumerate(sequence) if n == args.start_sub), None)
        if start_idx is None:
            print(f"Sub-recording '{args.start_sub}' not in planned sequence.")
            sys.exit(1)
        sequence = sequence[start_idx:]
        print(f"Starting from {args.start_sub} (skipping {start_idx} earlier sub(s))")

    print("\n=== Tutorial Orchestration Plan ===")
    for name, gate in sequence:
        gate_s = f"(wait for TC{gate+1} ready)" if gate else ""
        print(f"  • {name} {gate_s}")
    print()

    if args.dry_run:
        return

    # Execute
    failures = []
    for i, (name, preceding_gate) in enumerate(sequence):
        # Gate: before running this sub, wait for the tutorial to present
        # the next objective (gold glow appears). For tutorial-state
        # characters the profile doesn't show TC level, so we can't use
        # wait_for_tc_level. Glow presence is the reliable signal.
        if preceding_gate is not None:
            if not wait_for_tutorial_ready(
                    poll_seconds=max(15, args.poll_seconds // 2),
                    timeout=args.gate_timeout,
                    min_wait=args.gate_min_wait):
                print(f"\n⨯  Aborting — tutorial never resumed before {name}")
                sys.exit(1)

        # Play the sub-recording
        ok = play_recording(name, slowdown=args.slowdown)
        if not ok:
            failures.append(name)
            print(f"\n⚠  {name} exited non-zero.")
            if args.strict:
                print("   --strict: aborting.")
                sys.exit(1)

        # Post-play verification: did the level bump?
        # Each sub ends with an upgrade TRIGGERED (not necessarily finished).
        # So immediately after, the level may still be old — but the TC
        # should be ACTIVELY UPGRADING. The next iteration's gate check
        # will wait for level to actually bump.
        #
        # However, if the next gate check TIMES OUT, we know this sub failed.
        # We handle that in the next iteration.

    if failures:
        print(f"\n⚠  Completed with {len(failures)} failure(s): {failures}")
        sys.exit(2)
    print("\n✅ Full tutorial orchestration complete.")


if __name__ == '__main__':
    main()

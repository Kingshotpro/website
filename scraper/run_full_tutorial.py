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
    ("tutorial_opening",    None),  # fresh spawn → first "TC1 ready to upgrade" moment
    ("tutorial_after_tc2",  2),     # play after TC upgrade to L2 finishes
    ("tutorial_after_tc3",  3),
    ("tutorial_after_tc4",  4),
    ("tutorial_after_tc5",  5),     # optional — include only if max_tc >= 6
]


def recording_exists(name):
    return (TUTORIAL_DIR / f"{name}.json").exists()


def play_recording(name, slowdown=1.15):
    """Run tutorial_recorder.py --replay NAME synchronously."""
    print(f"\n▶  Playing {name}")
    result = subprocess.run(
        ["python3", "-u", str(SCRAPER_DIR / "tutorial_recorder.py"),
         "--replay", name, "--slowdown", str(slowdown)],
        cwd=str(SCRAPER_DIR),
    )
    return result.returncode == 0


def wait_for_tc_level(target_level, poll_seconds=45, timeout=3600):
    """
    Block until the TC reaches target_level.
    Ground truth = the level number displayed on the profile screen.
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
                        help='Max seconds to wait at each TC gate')
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
        # Gate: before running this sub, the previous upgrade must be done.
        # preceding_gate is the level the TC must have REACHED before we proceed.
        if preceding_gate is not None:
            if not wait_for_tc_level(preceding_gate,
                                      poll_seconds=args.poll_seconds,
                                      timeout=args.gate_timeout):
                print(f"\n⨯  Aborting — TC never reached L{preceding_gate}")
                sys.exit(1)

        # Record the level right before we start this sub
        level_before = read_tc_level()
        print(f"\n📊 TC level before {name}: {level_before}")

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

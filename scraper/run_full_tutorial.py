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


def wait_for_tc_upgrade_complete(finished_level, poll_seconds=30, timeout=3600):
    """
    Block until the TC upgrade completes (i.e. the *next* upgrade becomes
    available). After upgrading to L2, we wait for L3 to become available.
    """
    next_level = finished_level + 1
    print(f"\n⏳ Waiting for TC upgrade to L{next_level} to become available...")
    sys.path.insert(0, str(SCRAPER_DIR))
    from tc_detector import TCDetector
    det = TCDetector()
    det._load_calibration()
    ready = det.wait_until_ready(poll_seconds=poll_seconds, timeout_seconds=timeout)
    if not ready:
        print(f"⚠  TIMED OUT waiting for TC L{next_level} to be ready. Aborting.")
        return False
    print(f"✓  TC L{next_level} upgrade available.")
    return True


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
    args = parser.parse_args()

    # Random TC ceiling per run, if user didn't specify
    if args.max_tc is None:
        args.max_tc = random.choice([5, 6])
        print(f"🎲 Random max TC for this run: {args.max_tc}")

    sequence = plan(args.max_tc)
    if not sequence:
        print("No recordings to play. Record some first.")
        sys.exit(1)

    print("\n=== Tutorial Orchestration Plan ===")
    for name, gate in sequence:
        gate_s = f"(wait for TC{gate+1} ready)" if gate else ""
        print(f"  • {name} {gate_s}")
    print()

    if args.dry_run:
        return

    # Execute
    failures = []
    for i, (name, gate) in enumerate(sequence):
        if gate is not None:
            if not wait_for_tc_upgrade_complete(
                    gate,
                    poll_seconds=args.poll_seconds,
                    timeout=args.gate_timeout):
                print(f"\n⨯  Aborting orchestration at gate TC L{gate+1}")
                sys.exit(1)
        ok = play_recording(name, slowdown=args.slowdown)
        if not ok:
            failures.append(name)
            print(f"\n⚠  Sub-recording {name} exited non-zero.")
            if args.strict:
                print("   --strict: aborting.")
                sys.exit(1)
            else:
                print("   continuing; TC-ready gate will verify state before next chunk.")

    if failures:
        print(f"\n⚠  Completed with {len(failures)} failure(s): {failures}")
        sys.exit(2)
    print("\n✅ Full tutorial orchestration complete.")


if __name__ == '__main__':
    main()

#!/usr/bin/env python3
"""
tutorial_explorer.py — Interactive observation tool for building a tutorial
state machine from direct play.

Workflow:
1. Start screen recording:  `python3 tutorial_explorer.py --start-record`
2. Play through the tutorial, tapping via this tool or the phone
3. At each state transition, run: `python3 tutorial_explorer.py --snap NAME`
   This saves a labeled screenshot with a description.
4. When done: `python3 tutorial_explorer.py --stop-record`
5. View the collected states: `python3 tutorial_explorer.py --list`
6. Generate a template library: `python3 tutorial_explorer.py --build-templates`

Features:
- `--tap X Y`  — tap and screenshot, showing before/after
- `--find PATTERN` — opencv template match against the current screen
- `--detect` — run all known detectors (pause button, dialog, banner, etc.)
  and report which states are currently active
"""
import subprocess
import sys
import os
import time
import json
import argparse
from io import BytesIO
from pathlib import Path
from datetime import datetime

ADB = os.path.expanduser("~/platform-tools/adb")
DEVICE_ID = "R5CY61LHZVA"
OBS_DIR = Path(__file__).parent / "data" / "tutorial_observations"
OBS_DIR.mkdir(parents=True, exist_ok=True)


def adb(*args, capture=True, timeout=30):
    cmd = [ADB, "-s", DEVICE_ID] + list(args)
    if capture:
        return subprocess.run(cmd, capture_output=True, timeout=timeout)
    return subprocess.run(cmd, timeout=timeout)


def screenshot():
    res = adb("exec-out", "screencap", "-p")
    return res.stdout


def save_screenshot(path):
    data = screenshot()
    with open(path, "wb") as f:
        f.write(data)
    return path


def tap(x, y):
    adb("shell", "input", "tap", str(x), str(y))


def start_recording():
    """Start adb screenrecord in the background. Records to phone, pulls at stop."""
    # Kill any existing screenrecord processes on phone
    adb("shell", "pkill", "-f", "screenrecord")
    time.sleep(1)
    # Start recording at max 3 minutes per segment (adb limit). We segment.
    subprocess.Popen(
        [ADB, "-s", DEVICE_ID, "shell", "screenrecord", "--time-limit", "180",
         "/sdcard/tutorial_explore.mp4"],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    print("📹 Recording started (auto-stops after 3 min; restart for longer).")


def stop_recording():
    """Stop recording, pull the video to local, delete from phone."""
    adb("shell", "pkill", "-f", "screenrecord")
    time.sleep(2)
    local_path = OBS_DIR / f"recording_{datetime.now().strftime('%Y%m%d_%H%M%S')}.mp4"
    adb("pull", "/sdcard/tutorial_explore.mp4", str(local_path), timeout=60)
    adb("shell", "rm", "/sdcard/tutorial_explore.mp4")
    print(f"📹 Video saved: {local_path}")
    return local_path


def snap(name, note=""):
    """Save a labeled screenshot + metadata for a specific tutorial state."""
    ts = datetime.now().strftime("%H%M%S")
    safe_name = "".join(c if c.isalnum() or c in "_-" else "_" for c in name)
    img_path = OBS_DIR / f"{ts}_{safe_name}.png"
    save_screenshot(img_path)
    meta = {
        "time": datetime.now().isoformat(),
        "state_name": name,
        "note": note,
        "image": img_path.name,
    }
    meta_path = img_path.with_suffix(".json")
    with open(meta_path, "w") as f:
        json.dump(meta, f, indent=2)
    print(f"📸 {img_path.name}  [{name}]  {note}")
    return img_path


def list_observations():
    """Print all saved states in time order."""
    files = sorted(OBS_DIR.glob("*.json"))
    if not files:
        print("No observations yet.")
        return
    print(f"=== {len(files)} observations ===")
    for f in files:
        try:
            meta = json.load(open(f))
            print(f"  {f.stem}  [{meta['state_name']}]  {meta.get('note', '')}")
        except Exception as e:
            print(f"  {f.stem}  ERROR: {e}")


def template_match(pattern_path, threshold=0.85):
    """OpenCV template match against current screen. Returns (x, y, score) or None."""
    try:
        import cv2
        import numpy as np
    except ImportError:
        print("opencv-python needed: pip install opencv-python")
        return None

    data = screenshot()
    arr = np.frombuffer(data, dtype=np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    template = cv2.imread(str(pattern_path), cv2.IMREAD_COLOR)
    if template is None:
        print(f"Could not load template: {pattern_path}")
        return None

    res = cv2.matchTemplate(img, template, cv2.TM_CCOEFF_NORMED)
    _, max_val, _, max_loc = cv2.minMaxLoc(res)
    if max_val < threshold:
        return None
    h, w = template.shape[:2]
    cx = max_loc[0] + w // 2
    cy = max_loc[1] + h // 2
    return (cx, cy, max_val)


def detect_all():
    """Run all known detectors and report state."""
    # Placeholder — built up as more states are observed.
    templates_dir = OBS_DIR / "templates"
    if not templates_dir.exists():
        print("No templates yet. Build some with --build-templates after observing states.")
        return
    hits = []
    for tmpl in templates_dir.glob("*.png"):
        result = template_match(tmpl)
        if result:
            x, y, score = result
            hits.append((tmpl.stem, x, y, score))
    if hits:
        print(f"=== Detected {len(hits)} state(s) ===")
        for name, x, y, score in hits:
            print(f"  {name}  @ ({x}, {y})  score={score:.3f}")
    else:
        print("No known state detected.")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--start-record", action="store_true")
    parser.add_argument("--stop-record", action="store_true")
    parser.add_argument("--snap", type=str, metavar="NAME",
                        help="Save current screen as labeled observation")
    parser.add_argument("--note", type=str, default="",
                        help="Optional note to attach to --snap")
    parser.add_argument("--tap", type=int, nargs=2, metavar=("X", "Y"),
                        help="Tap at coords, screenshot after")
    parser.add_argument("--list", action="store_true",
                        help="List all saved observations")
    parser.add_argument("--detect", action="store_true",
                        help="Run all known detectors")
    parser.add_argument("--screenshot", type=str, metavar="PATH",
                        help="Save a plain screenshot to PATH")
    args = parser.parse_args()

    if args.start_record:
        start_recording()
    elif args.stop_record:
        stop_recording()
    elif args.snap:
        snap(args.snap, args.note)
    elif args.tap:
        x, y = args.tap
        print(f"Before tap:")
        before = snap(f"pretap_{x}_{y}", f"before tap at ({x}, {y})")
        tap(x, y)
        time.sleep(1.5)
        print(f"After tap:")
        after = snap(f"posttap_{x}_{y}", f"after tap at ({x}, {y})")
    elif args.list:
        list_observations()
    elif args.detect:
        detect_all()
    elif args.screenshot:
        save_screenshot(args.screenshot)
        print(f"saved {args.screenshot}")
    else:
        parser.print_help()


if __name__ == "__main__":
    main()

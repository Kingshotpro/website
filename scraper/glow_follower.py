#!/usr/bin/env python3
"""
glow_follower.py — Follow the tutorial's "tap here" glow indicator.

Kingshot's tutorial shows a pulsing gold/yellow highlight over the next
target to tap. When the recorded tap sequence drifts off-course, we can
fall back to "glow-follow mode": scan for the glow, tap it, repeat until
no glow is found (tutorial complete or stuck).

CALIBRATION STATUS:
  The glow's exact RGB and size have not been measured on-device yet.
  Defaults below are educated guesses from genre-standard UI patterns:
    - Saturated gold/yellow (R≥220, G≥180, B≤140)
    - Circular cluster roughly 60-140 pixels diameter
    - Located in the main game area (not status bar, not bottom nav)

  First on-device run: use --debug to save the detected glow region to
  disk; hand-check that it's the actual tutorial indicator. Tune params
  in GLOW_PARAMS if needed.

Usage as library:
    from glow_follower import GlowFollower
    gf = GlowFollower()
    if gf.find_glow():
        gf.run(max_iterations=30)

CLI:
    python3 glow_follower.py            # one-shot scan
    python3 glow_follower.py --follow   # loop until no glow
    python3 glow_follower.py --debug    # save detection debug images
"""
import subprocess
import sys
import os
import time
from io import BytesIO
from pathlib import Path
from PIL import Image

ADB = os.path.expanduser("~/platform-tools/adb")
DEVICE_ID = "R5CY61LHZVA"

# Tunable glow detection parameters.
GLOW_PARAMS = {
    # RGB range for "tutorial glow" pixels (saturated gold/yellow).
    'r_min': 220, 'r_max': 255,
    'g_min': 180, 'g_max': 230,
    'b_min': 0,   'b_max': 140,
    # Exclude top UI bar (resource counters, timer, coin icon at ~1040,230)
    # and bottom nav. Tutorial targets are always in the main game area.
    'y_min': 300,
    'y_max': 2100,
    # Minimum cluster area in pixels². The tutorial's glowing ring is
    # a pulsing circle ~60-140px wide → area ~3000-15000px². Smaller
    # clusters (coin icons, badges, shine effects) get rejected.
    'min_cluster': 2500,
    'max_cluster': 40000,
    # Sample step when scanning (smaller = finer, slower).
    'step': 4,
}


class GlowFollower:
    def __init__(self, params=None, debug=False):
        self.params = {**GLOW_PARAMS, **(params or {})}
        self.debug = debug
        self._debug_dir = Path('glow_debug') if debug else None
        if self._debug_dir:
            self._debug_dir.mkdir(exist_ok=True)

    def _screenshot(self):
        res = subprocess.run(
            [ADB, "-s", DEVICE_ID, "exec-out", "screencap", "-p"],
            capture_output=True, timeout=10
        )
        if res.returncode != 0:
            raise RuntimeError("screenshot failed")
        return Image.open(BytesIO(res.stdout))

    def _is_glow_color(self, rgb):
        p = self.params
        r, g, b = rgb[:3]
        return (p['r_min'] <= r <= p['r_max'] and
                p['g_min'] <= g <= p['g_max'] and
                p['b_min'] <= b <= p['b_max'])

    def find_glow(self, img=None):
        """
        Scan the image for a glow cluster. Returns (x, y) center of the
        best-fitting cluster, or None if no cluster meets criteria.

        Uses a coarse grid scan + connected-component size check.
        """
        if img is None:
            img = self._screenshot()
        p = self.params
        w, h = img.size

        # Phase 1: find candidate pixels (coarse grid).
        candidates = []
        for y in range(p['y_min'], min(h, p['y_max']), p['step']):
            for x in range(0, w, p['step']):
                if self._is_glow_color(img.getpixel((x, y))):
                    candidates.append((x, y))

        if not candidates:
            if self.debug:
                print(f"  no glow-colored pixels found")
            return None

        # Phase 2: cluster candidates by proximity (grid cell).
        # Bucket into 40px cells so neighboring pixels group together.
        cells = {}
        for x, y in candidates:
            cx, cy = x // 40, y // 40
            cells.setdefault((cx, cy), []).append((x, y))

        # Phase 3: flood-fill clusters (connect adjacent cells).
        visited = set()
        clusters = []
        for start in cells:
            if start in visited:
                continue
            stack = [start]
            cluster = []
            while stack:
                cur = stack.pop()
                if cur in visited:
                    continue
                visited.add(cur)
                cluster.extend(cells.get(cur, []))
                cx, cy = cur
                for dx in (-1, 0, 1):
                    for dy in (-1, 0, 1):
                        neighbor = (cx + dx, cy + dy)
                        if neighbor in cells and neighbor not in visited:
                            stack.append(neighbor)
            clusters.append(cluster)

        # Phase 4: filter by pixel count (scaled by step^2 to get real area).
        step_sq = p['step'] * p['step']
        good = []
        for c in clusters:
            area = len(c) * step_sq
            if p['min_cluster'] <= area <= p['max_cluster']:
                good.append((c, area))

        if not good:
            if self.debug:
                sizes = [len(c) * step_sq for c in clusters]
                print(f"  clusters found but all out of size range: {sizes}")
            return None

        # Pick the most compact (highest density) cluster.
        def compactness(c):
            xs = [pt[0] for pt in c]
            ys = [pt[1] for pt in c]
            bbox_area = (max(xs) - min(xs) + 1) * (max(ys) - min(ys) + 1)
            return len(c) / max(bbox_area, 1)

        good.sort(key=lambda pair: -compactness(pair[0]))
        best_cluster, best_area = good[0]

        # Center of the best cluster.
        cx = sum(pt[0] for pt in best_cluster) // len(best_cluster)
        cy = sum(pt[1] for pt in best_cluster) // len(best_cluster)

        if self.debug:
            # Save a copy of the image with a circle at the detected center.
            dbg = img.copy()
            from PIL import ImageDraw
            d = ImageDraw.Draw(dbg)
            d.ellipse([cx-50, cy-50, cx+50, cy+50], outline='red', width=4)
            path = self._debug_dir / f"glow_{time.strftime('%H%M%S')}.png"
            dbg.save(path)
            print(f"  detected glow at ({cx}, {cy}), area={best_area}, saved {path}")

        return (cx, cy)

    def tap(self, x, y):
        """ADB tap at the given coords."""
        subprocess.run([ADB, "-s", DEVICE_ID, "shell", "input", "tap",
                       str(x), str(y)], capture_output=True, timeout=10)

    def run(self, max_iterations=30, per_tap_delay=2.5, no_glow_timeout=15,
            same_spot_threshold=30, max_same_spot_taps=3):
        """
        Loop: find glow → tap → wait → repeat.

        CHANGE-DETECTION: if we find a glow at roughly the same position
        (±same_spot_threshold px) for more than max_same_spot_taps taps in
        a row, we treat it as a false positive (dead UI element, e.g. a
        gold icon) and abort.

        Exits when:
          - No glow found for `no_glow_timeout` seconds consecutive
          - Same glow position tapped too many times without progress
          - max_iterations reached
        Returns the number of taps executed.
        """
        taps = 0
        last_glow_time = time.time()
        last_position = None
        same_position_count = 0

        for i in range(max_iterations):
            xy = self.find_glow()
            if xy is None:
                elapsed_no_glow = time.time() - last_glow_time
                if elapsed_no_glow >= no_glow_timeout:
                    print(f"  no glow for {elapsed_no_glow:.0f}s → exiting")
                    return taps
                time.sleep(1)
                continue

            x, y = xy

            # Change-detection: is this the same spot as last time?
            if last_position is not None:
                dx = abs(x - last_position[0])
                dy = abs(y - last_position[1])
                if dx < same_spot_threshold and dy < same_spot_threshold:
                    same_position_count += 1
                    if same_position_count >= max_same_spot_taps:
                        print(f"  same glow position ({x}, {y}) for "
                              f"{same_position_count} taps — likely false "
                              f"positive, aborting")
                        return taps
                else:
                    same_position_count = 0
            last_position = (x, y)

            print(f"  [{i+1}] glow at ({x}, {y}) → tap")
            self.tap(x, y)
            taps += 1
            last_glow_time = time.time()
            time.sleep(per_tap_delay)
        print(f"  hit max_iterations={max_iterations}, stopping")
        return taps


def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--follow', action='store_true',
                        help='Loop: tap glow until none found')
    parser.add_argument('--debug', action='store_true',
                        help='Save debug images of detected glow')
    parser.add_argument('--max', type=int, default=30,
                        help='Max iterations in follow mode')
    args = parser.parse_args()

    gf = GlowFollower(debug=args.debug)
    if args.follow:
        n = gf.run(max_iterations=args.max)
        print(f"done — {n} taps")
        sys.exit(0)

    xy = gf.find_glow()
    if xy:
        print(f"glow found at {xy}")
        sys.exit(0)
    print("no glow found")
    sys.exit(1)


if __name__ == '__main__':
    main()

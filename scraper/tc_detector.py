#!/usr/bin/env python3
"""
tc_detector.py — Detect whether the Town Center can be upgraded right now.

Strategy (two-tier):
  Tier 1 (fast, pixel-only): scan the top-left HUD for the "Upgrade" ribbon.
        In Kingshot, when any building (especially TC) can be upgraded, a
        golden "Upgrade [Building] to Lv. N (x/y)" banner appears at the
        bottom of the screen — the same area as the "Build Iron Mine"
        messages we've seen. When READY (all requirements met), the banner
        also shows a small arrow icon; when NOT ready, it shows a lock or
        greyed-out text.

  Tier 2 (slower, OCR fallback): if tier 1 is ambiguous, run EasyOCR on the
        bottom banner region. Look for "Upgrade Town Center" text.

Calibration:
  First-time setup: run `python3 tc_detector.py --calibrate` and follow the
  prompts. It will save pixel coords + reference values to tc_calibration.json.

Usage as library:
    from tc_detector import TCDetector
    det = TCDetector()
    if det.is_ready():
        print("TC can be upgraded")

CLI:
    python3 tc_detector.py           # one-shot check
    python3 tc_detector.py --watch   # poll every 30s, exit when ready
    python3 tc_detector.py --calibrate
"""
import subprocess
import sys
import time
import json
import os
from io import BytesIO
from pathlib import Path
from PIL import Image

ADB = os.path.expanduser("~/platform-tools/adb")
DEVICE_ID = "R5CY61LHZVA"
CALIB_FILE = Path(__file__).parent / "tc_calibration.json"

# ----------------------------------------------------------- default config

DEFAULT_BANNER_REGION = (40, 2050, 720, 2150)  # x1, y1, x2, y2 of bottom banner
DEFAULT_BUILDING_REGION = (440, 800, 720, 1200)  # typical TC location in city


class TCDetector:
    def __init__(self, calibration=None):
        """
        calibration: dict with optional keys:
          - banner_region: (x1, y1, x2, y2) for the upgrade banner
          - ready_signature: dict of known "ready" pixel signatures
          - not_ready_signature: dict of known "not ready" pixel signatures
        """
        self.calib = calibration or {}
        self._reader = None

    def _load_calibration(self):
        if CALIB_FILE.exists():
            with open(CALIB_FILE) as f:
                self.calib = json.load(f)

    def _screenshot(self):
        res = subprocess.run(
            [ADB, "-s", DEVICE_ID, "exec-out", "screencap", "-p"],
            capture_output=True, timeout=10
        )
        if res.returncode != 0:
            raise RuntimeError("screenshot failed")
        return Image.open(BytesIO(res.stdout))

    # -------------------------------------------------- tier 1: pixel scan

    def _scan_for_green_upgrade_button(self, img):
        """
        When TC upgrade is ready, a green "UPGRADE" button appears somewhere
        (either as a floating arrow above the building, or in the bottom
        banner). Scan for a distinctive saturated-green pixel cluster.
        """
        # Kingshot's upgrade-ready green: approximately (70, 180, 100)
        # (saturated medium-bright green). Check a sampled grid.
        target = (70, 180, 100)
        tol = 40
        region = self.calib.get('banner_region', DEFAULT_BANNER_REGION)
        x1, y1, x2, y2 = region

        hits = 0
        samples = 0
        for y in range(y1, y2, 10):
            for x in range(x1, x2, 20):
                px = img.getpixel((x, y))
                samples += 1
                if all(abs(px[i] - target[i]) < tol for i in range(3)):
                    hits += 1
        # Threshold: need at least 2% of samples to be green
        return (hits / samples) > 0.02 if samples > 0 else False

    # -------------------------------------------------- tier 2: OCR fallback

    def _ocr_bottom_banner(self, img):
        if self._reader is None:
            import easyocr
            self._reader = easyocr.Reader(['en'], gpu=False, verbose=False)
        region = self.calib.get('banner_region', DEFAULT_BANNER_REGION)
        crop = img.crop(region)
        buf = BytesIO()
        crop.save(buf, 'PNG')
        results = self._reader.readtext(buf.getvalue())
        text = ' '.join(t for _, t, _ in results).lower()
        return text

    def _ocr_says_tc_upgrade(self, img):
        text = self._ocr_bottom_banner(img)
        # Positive signals
        if 'town center' in text or 'town hall' in text or 'townhall' in text:
            if 'upgrade' in text:
                return True
        return False

    # -------------------------------------------------- public API

    def _scan_calibrated_signatures(self, img):
        """
        If we have calibration samples, check whether the current image
        matches the 'ready' signatures at the sampled pixel locations.
        Returns a confidence 0.0-1.0, or None if no calibration.
        """
        samples = self.calib.get('ready_samples')
        if not samples:
            return None
        hits = 0
        for s in samples:
            px = img.getpixel((s['x'], s['y']))
            ready_rgb = s['ready_rgb']
            not_ready_rgb = s['not_ready_rgb']
            d_ready = sum(abs(px[i] - ready_rgb[i]) for i in range(3))
            d_not_ready = sum(abs(px[i] - not_ready_rgb[i]) for i in range(3))
            if d_ready < d_not_ready:
                hits += 1
        return hits / len(samples)

    def is_ready(self, tier='auto'):
        """
        Returns True if the TC can be upgraded right now.

        tier: 'pixel' (fast, unreliable), 'ocr' (slow, reliable),
              'calibrated' (use learned samples only), 'auto' (best available).
        """
        img = self._screenshot()

        # Prefer calibrated signatures if available
        calib_conf = self._scan_calibrated_signatures(img)
        if calib_conf is not None:
            # Need >=60% of calibrated pixels to match "ready" profile
            if calib_conf >= 0.6:
                return True
            if tier == 'calibrated':
                return False
            # Otherwise fall through to other tiers

        if tier in ('pixel', 'auto'):
            if self._scan_for_green_upgrade_button(img):
                return True
            if tier == 'pixel':
                return False

        # Final fallback: OCR
        return self._ocr_says_tc_upgrade(img)

    def wait_until_ready(self, poll_seconds=30, timeout_seconds=3600):
        """
        Poll until TC is upgradable or timeout.
        Returns True if ready, False if timed out.
        """
        start = time.time()
        while time.time() - start < timeout_seconds:
            if self.is_ready(tier='auto'):
                return True
            elapsed = int(time.time() - start)
            print(f"  TC not ready yet (elapsed: {elapsed}s), waiting {poll_seconds}s...")
            time.sleep(poll_seconds)
        return False


# ----------------------------------------------------------- CLI

def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--watch', action='store_true',
                        help='Poll until ready, then exit 0')
    parser.add_argument('--calibrate', action='store_true',
                        help='Save reference screenshots for calibration')
    parser.add_argument('--poll-seconds', type=int, default=30)
    parser.add_argument('--timeout', type=int, default=3600)
    args = parser.parse_args()

    det = TCDetector()
    det._load_calibration()

    if args.calibrate:
        print("=== TC Detector Calibration ===")
        print()
        print("This will save TWO reference screenshots and then learn the")
        print("pixel signature of 'TC ready' vs 'TC not ready'.")
        print()
        calib_dir = SCRAPER_DIR / 'tc_calib_shots' if 'SCRAPER_DIR' in dir() else Path(__file__).parent / 'tc_calib_shots'
        calib_dir.mkdir(exist_ok=True)

        # Step 1: ready screenshot
        input("1) Put the phone in the state where TC IS READY for upgrade "
              "(glowing icon / upgrade banner visible). Press Enter when ready... ")
        ready_img = det._screenshot()
        ready_path = calib_dir / 'ready.png'
        ready_img.save(ready_path)
        print(f"   saved {ready_path}")

        # Step 2: not-ready screenshot
        input("\n2) Put the phone in the state where TC is NOT ready "
              "(upgrading or at cap). Press Enter when ready... ")
        not_ready_img = det._screenshot()
        not_ready_path = calib_dir / 'not_ready.png'
        not_ready_img.save(not_ready_path)
        print(f"   saved {not_ready_path}")

        # Step 3: diff the two to find distinctive pixels
        from PIL import ImageChops
        diff = ImageChops.difference(ready_img, not_ready_img)
        bbox = diff.getbbox()
        print(f"\n   Diff bounding box: {bbox}")

        # Save calibration
        calib = {
            'calibrated_at': time.strftime('%Y-%m-%d %H:%M:%S'),
            'diff_bbox': bbox,
            'banner_region': list(bbox) if bbox else list(DEFAULT_BANNER_REGION),
            # Sample 10 pixels from the diff area in the ready image — these are
            # candidate "ready" signatures
            'ready_samples': [],
        }
        if bbox:
            x1, y1, x2, y2 = bbox
            import random as _r
            for _ in range(10):
                sx = _r.randint(x1, x2 - 1) if x2 > x1 else x1
                sy = _r.randint(y1, y2 - 1) if y2 > y1 else y1
                calib['ready_samples'].append({
                    'x': sx, 'y': sy,
                    'ready_rgb': list(ready_img.getpixel((sx, sy)))[:3],
                    'not_ready_rgb': list(not_ready_img.getpixel((sx, sy)))[:3],
                })
        with open(CALIB_FILE, 'w') as f:
            json.dump(calib, f, indent=2)
        print(f"\n   Calibration saved to {CALIB_FILE}")
        print(f"   Banner region set to: {calib['banner_region']}")
        print(f"   Captured {len(calib['ready_samples'])} pixel signatures")
        return

    if args.watch:
        ready = det.wait_until_ready(poll_seconds=args.poll_seconds,
                                      timeout_seconds=args.timeout)
        if ready:
            print("TC IS READY")
            sys.exit(0)
        else:
            print("TIMED OUT — TC not ready within", args.timeout, "seconds")
            sys.exit(1)

    # Default: one-shot check
    ready = det.is_ready(tier='auto')
    print(f"TC ready: {ready}")
    sys.exit(0 if ready else 1)


if __name__ == '__main__':
    main()

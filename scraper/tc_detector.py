#!/usr/bin/env python3
"""
tc_detector.py — Determine the current Town Center (Town Hall) level.

The only reliable success signal for a sub-tutorial is: "did the TC level
actually increase?" The TC level is visible in multiple places on screen;
we use OCR to read it.

Primary source: profile screen shows 'Town Center Level: N'. This is the
most reliable place because the label text is unambiguous.

Usage as a library:
    from tc_detector import TCDetector
    det = TCDetector()
    level = det.get_level()                     # current TC level (int) or None
    det.wait_for_level(target=2, timeout=3600)  # block until TC reaches L2

CLI:
    python3 tc_detector.py                      # one-shot level reading
    python3 tc_detector.py --wait-for 3         # poll until level==3, exit 0
    python3 tc_detector.py --watch              # poll, print whenever level changes
"""
import subprocess
import sys
import time
import os
import re
from io import BytesIO
from pathlib import Path
from PIL import Image

ADB = os.path.expanduser("~/platform-tools/adb")
DEVICE_ID = "R5CY61LHZVA"

# Avatar position for opening profile (calibrated to this phone's UI)
AVATAR_XY = (65, 165)


class TCDetector:
    def __init__(self):
        self._reader = None

    def _ocr(self):
        if self._reader is None:
            import easyocr
            self._reader = easyocr.Reader(['en'], gpu=False, verbose=False)
        return self._reader

    def _screenshot(self):
        res = subprocess.run(
            [ADB, "-s", DEVICE_ID, "exec-out", "screencap", "-p"],
            capture_output=True, timeout=10
        )
        if res.returncode != 0:
            raise RuntimeError("screenshot failed")
        return Image.open(BytesIO(res.stdout))

    def _tap(self, x, y, delay=2):
        subprocess.run([ADB, "-s", DEVICE_ID, "shell", "input", "tap", str(x), str(y)],
                       capture_output=True, timeout=10)
        time.sleep(delay)

    # ------------------------------------------------ state detection

    def _is_on_profile(self, img=None):
        """
        Check whether the current screen is the Governor Profile.
        The profile background is a distinctive light blue gradient.
        Sample a region that's background (not character art) to avoid
        false negatives.
        """
        if img is None:
            img = self._screenshot()
        # Top-right corner of profile screen is solid blue-gray
        # (well above any overlay menu). Sample a 40x40 region there.
        w, h = img.size
        x0, y0 = w - 100, 300
        r_sum = g_sum = b_sum = n = 0
        for y in range(y0, y0 + 40, 4):
            for x in range(x0, x0 + 40, 4):
                p = img.getpixel((x, y))
                r_sum += p[0]
                g_sum += p[1]
                b_sum += p[2]
                n += 1
        if n == 0:
            return False
        r, g, b = r_sum // n, g_sum // n, b_sum // n
        # Profile blue: R~180-220, G~200-230, B~220-240
        return (170 <= r <= 230 and 195 <= g <= 235 and 210 <= b <= 250)

    # ------------------------------------------------ read level from profile

    def _open_profile(self):
        """
        Ensure the profile panel is open. No-op if already there.
        Triple-tap the avatar with short delays — some kingdoms have
        invisible overlays that absorb the first tap.
        """
        if self._is_on_profile():
            return
        for _ in range(3):
            subprocess.run([ADB, "-s", DEVICE_ID, "shell", "input", "tap",
                           str(AVATAR_XY[0]), str(AVATAR_XY[1])],
                          capture_output=True, timeout=10)
            time.sleep(0.35)
        time.sleep(3)

    def _close_profile(self):
        """
        Close the profile if open. No-op if we're not on profile —
        avoids accidentally navigating from city by tapping at (55, 160).
        """
        if not self._is_on_profile():
            return
        self._tap(55, 160, delay=2)

    def _read_profile_level(self):
        """
        Open profile, OCR the info panel for 'Town Center Level: N',
        return N as an integer, or None if not found. Closes profile after.
        """
        self._open_profile()
        try:
            img = self._screenshot()
            # Info panel is in the lower third of the profile screen.
            # OCR the bottom half — saves time, reduces false matches.
            crop = img.crop((0, 1400, 1080, 2340))
            buf = BytesIO()
            crop.save(buf, 'PNG')
            results = self._ocr().readtext(buf.getvalue())

            # Look for 'Town Center Level' + number combinations.
            # OCR may split into separate regions, so join all text first
            # and regex-search for the pattern.
            full_text = ' '.join(t for _, t, _ in results)
            m = re.search(r'Town\s*Center\s*Level[:\s]*(\d+)', full_text,
                          re.IGNORECASE)
            if not m:
                # Fallback: "Town Hall" in case game strings vary
                m = re.search(r'Town\s*Hall\s*Level[:\s]*(\d+)', full_text,
                              re.IGNORECASE)
            if m:
                return int(m.group(1))
            return None
        finally:
            self._close_profile()

    # ---------------------------------------------------------- public API

    def get_level(self):
        """
        Return the current TC level as an integer, or None if unreadable.
        Opens and closes the profile screen as a side effect.
        """
        try:
            return self._read_profile_level()
        except Exception as e:
            print(f"  tc_detector: error reading level: {e}")
            return None

    def wait_for_level(self, target, poll_seconds=45, timeout_seconds=3600):
        """
        Block until TC level reaches >= target, or timeout.
        Returns the final level observed, or None if timeout.
        """
        start = time.time()
        last_seen = None
        while time.time() - start < timeout_seconds:
            level = self.get_level()
            if level is not None:
                if level != last_seen:
                    elapsed = int(time.time() - start)
                    print(f"  tc_detector: level={level} (target={target}, "
                          f"elapsed={elapsed}s)")
                    last_seen = level
                if level >= target:
                    return level
            time.sleep(poll_seconds)
        return None

    def verify_upgrade(self, before_level, timeout_seconds=1800):
        """
        After a sub-tutorial plays, verify the TC level bumped by 1.
        Returns True iff the level is now before_level + 1 (or higher).
        """
        return self.wait_for_level(before_level + 1,
                                    timeout_seconds=timeout_seconds) is not None


# ---------------------------------------------------------------------- CLI

def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--wait-for', type=int, default=None,
                        help='Block until level >= N, then exit 0')
    parser.add_argument('--watch', action='store_true',
                        help='Poll and print whenever level changes')
    parser.add_argument('--poll-seconds', type=int, default=45)
    parser.add_argument('--timeout', type=int, default=3600)
    args = parser.parse_args()

    det = TCDetector()

    if args.wait_for is not None:
        level = det.wait_for_level(args.wait_for,
                                    poll_seconds=args.poll_seconds,
                                    timeout_seconds=args.timeout)
        if level is not None:
            print(f"reached level {level}")
            sys.exit(0)
        print(f"timed out (level did not reach {args.wait_for})")
        sys.exit(1)

    if args.watch:
        last = None
        while True:
            level = det.get_level()
            if level != last:
                print(f"[{time.strftime('%H:%M:%S')}] TC level = {level}")
                last = level
            time.sleep(args.poll_seconds)

    # Default: one-shot reading
    level = det.get_level()
    print(f"TC level: {level}")
    sys.exit(0 if level is not None else 1)


if __name__ == '__main__':
    main()

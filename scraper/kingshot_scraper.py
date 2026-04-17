#!/usr/bin/env python3
"""
Kingshot Human Scraper — ADB-based screenshot automation.
Built for the Hive Colony, April 13 2026.

Controls a physical Android phone running Kingshot via ADB.
Captures ranking screenshots and world chat with human-like behavior.

Usage:
    python3 kingshot_scraper.py --detect
    python3 kingshot_scraper.py --screenshot
    python3 kingshot_scraper.py --scrape --kingdom 300
    python3 kingshot_scraper.py --scrape --kingdom 300 --categories alliance_power,personal_power
    python3 kingshot_scraper.py --chat --kingdom 300

Requires: Python 3.7+, ADB (brew install android-platform-tools or download platform-tools)
Optional: pip install pillow numpy (better end-of-list detection + Gaussian distributions)
"""

import subprocess
import time
import random
import math
import os
import sys
import json
import argparse
import hashlib
from datetime import datetime
from pathlib import Path

# Optional dependencies — graceful fallback
try:
    import numpy as np
    HAS_NUMPY = True
except ImportError:
    HAS_NUMPY = False

try:
    from PIL import Image
    HAS_PILLOW = True
except ImportError:
    HAS_PILLOW = False

# ---------------------------------------------------------------------------
# Find ADB
# ---------------------------------------------------------------------------

def find_adb():
    """Locate ADB binary."""
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
    print("ERROR: ADB not found. Install Android SDK Platform Tools.")
    sys.exit(1)

ADB = find_adb()

# ---------------------------------------------------------------------------
# Human Behavior Engine
# ---------------------------------------------------------------------------

class HumanBehavior:
    """
    Simulates human interaction patterns.
    All timing uses Gaussian distributions, not uniform random.
    Humans cluster around a mean with occasional outliers.
    """

    def __init__(self):
        self._last_delay = 0
        self._action_count = 0
        self._next_distraction = random.randint(8, 15)
        self._long_pause_used = False

    def _gauss(self, mean, std, low=None, high=None):
        """Gaussian random with optional clamp."""
        if HAS_NUMPY:
            val = float(np.random.normal(mean, std))
        else:
            val = random.gauss(mean, std)
        if low is not None:
            val = max(val, low)
        if high is not None:
            val = min(val, high)
        return val

    # --- Delays ---

    def tap_delay(self):
        """Delay before tapping a UI element. Humans read, then act."""
        d = self._gauss(2.5, 1.0, low=1.0, high=6.0)
        # Never two identical delays in a row
        while abs(d - self._last_delay) < 0.15:
            d = self._gauss(1.2, 0.5, low=0.4, high=3.5)
        self._last_delay = d
        time.sleep(d)
        return d

    def read_delay(self):
        """Delay when reading a new screen. Humans take time to process."""
        d = self._gauss(4.0, 1.5, low=2.0, high=9.0)
        time.sleep(d)
        return d

    def scroll_pause(self):
        """Delay between scroll-and-screenshot cycles."""
        d = self._gauss(5.0, 2.0, low=2.5, high=12.0)
        time.sleep(d)
        return d

    def screen_transition(self):
        """Delay after navigating to a new screen. Wait for load + read."""
        d = self._gauss(5.0, 1.5, low=3.0, high=10.0)
        time.sleep(d)
        return d

    def maybe_distraction(self):
        """
        Occasionally pause longer — simulates real human interruptions.
        Humans poop, answer texts, get snacks, take calls, zone out.
        These pauses are what make behavior genuinely human.

        Break tiers:
          60% — Short (8-30 sec): glanced at phone, read a notification
          25% — Medium (25-90 sec): replied to a text, checked another app
          15% — Long (1-7 min): bathroom, snack, phone call
                 Fires AT MOST ONCE per scrape session.
        """
        self._action_count += 1
        if self._action_count >= self._next_distraction:
            roll = random.random()
            if roll < 0.60:
                pause = self._gauss(15.0, 5.0, low=8.0, high=30.0)
                tier = "short"
            elif roll < 0.85:
                pause = self._gauss(45.0, 15.0, low=25.0, high=90.0)
                tier = "medium"
            elif not self._long_pause_used:
                pause = self._gauss(180.0, 90.0, low=60.0, high=420.0)
                self._long_pause_used = True
                tier = "long"
            else:
                # Long already used this session — downgrade to medium
                pause = self._gauss(45.0, 15.0, low=25.0, high=90.0)
                tier = "medium"

            time.sleep(pause)
            self._action_count = 0
            self._next_distraction = random.randint(6, 15)
            return pause
        return 0

    # --- Touch simulation ---

    def jitter_tap(self, x, y, radius=12):
        """
        Add Gaussian offset to simulate imprecise human finger placement.
        Humans don't hit the exact center of buttons.
        """
        dx = int(self._gauss(0, radius / 2.5, low=-radius, high=radius))
        dy = int(self._gauss(0, radius / 2.5, low=-radius, high=radius))
        return (x + dx, y + dy)

    def swipe_duration_ms(self):
        """Human swipe duration: 600-2200ms, clustered around 1200ms."""
        return int(self._gauss(1200, 350, low=600, high=2200))

    def jitter_swipe(self, x1, y1, x2, y2):
        """Add natural imprecision to swipe start and end points."""
        sx = x1 + int(self._gauss(0, 8))
        sy = y1 + int(self._gauss(0, 6))
        # End position is sloppier than start
        ex = x2 + int(self._gauss(0, 15))
        ey = y2 + int(self._gauss(0, 12))
        return (sx, sy, ex, ey)

    def should_misclick(self):
        """~3% chance of an accidental tap in the wrong spot."""
        return random.random() < 0.03

    def misclick_offset(self):
        """Generate a misclick offset — tap nearby dead space."""
        dx = random.choice([-1, 1]) * random.randint(40, 120)
        dy = random.choice([-1, 1]) * random.randint(30, 80)
        return (dx, dy)


# ---------------------------------------------------------------------------
# ADB Controller
# ---------------------------------------------------------------------------

class ADBController:
    """Low-level ADB interface with human behavior baked in."""

    def __init__(self, device_id, human):
        self.device_id = device_id
        self.human = human
        self.width = 0
        self.height = 0
        self._log_fn = print

    def set_logger(self, fn):
        self._log_fn = fn

    def log(self, msg):
        self._log_fn(msg)

    def run(self, *args, binary=False, timeout=30):
        """Execute an ADB command."""
        cmd = [ADB, "-s", self.device_id] + list(args)
        try:
            result = subprocess.run(cmd, capture_output=True, timeout=timeout)
        except FileNotFoundError:
            print(f"ERROR: ADB not found at {ADB}")
            sys.exit(1)
        except subprocess.TimeoutExpired:
            raise RuntimeError(f"ADB timed out: {' '.join(cmd)}")
        if result.returncode != 0:
            stderr = result.stderr.decode(errors="replace").strip()
            raise RuntimeError(f"ADB error (rc={result.returncode}): {stderr}")
        return result.stdout if binary else result.stdout.decode(errors="replace")

    def detect_resolution(self):
        """Get screen dimensions."""
        output = self.run("shell", "wm", "size")
        for line in output.strip().splitlines():
            if "size:" in line.lower():
                dims = line.strip().split()[-1]
                w, h = dims.split("x")
                self.width, self.height = int(w), int(h)
        if not self.width:
            raise RuntimeError(f"Could not detect resolution: {output}")
        return (self.width, self.height)

    def is_connected(self):
        try:
            return "device" in self.run("get-state").strip()
        except RuntimeError:
            return False

    def tap(self, x, y, label="", critical=False):
        """
        Tap with human jitter. Misclick feature REMOVED — the 40-120px
        offset was hitting unrelated UI elements and triggering popups.
        The ±8-12px Gaussian jitter already provides realistic imprecision.
        """
        self.human.tap_delay()

        tx, ty = self.human.jitter_tap(x, y, radius=8 if critical else 10)
        tx = max(0, min(tx, self.width))
        ty = max(0, min(ty, self.height))
        self.run("shell", "input", "tap", str(tx), str(ty))
        if label:
            self.log(f"  tap {label} ({tx},{ty})")

    def swipe(self, x1, y1, x2, y2, duration_ms=None):
        """Swipe with human jitter and variable duration."""
        if duration_ms is None:
            duration_ms = self.human.swipe_duration_ms()
        sx, sy, ex, ey = self.human.jitter_swipe(x1, y1, x2, y2)
        # Clamp to screen
        sx = max(0, min(sx, self.width))
        sy = max(0, min(sy, self.height))
        ex = max(0, min(ex, self.width))
        ey = max(0, min(ey, self.height))
        self.run("shell", "input", "swipe",
                 str(sx), str(sy), str(ex), str(ey), str(duration_ms))
        self.log(f"  swipe ({sx},{sy})->({ex},{ey}) {duration_ms}ms")

    def screenshot(self, path):
        """Capture screenshot and save to file."""
        data = self.run("exec-out", "screencap", "-p", binary=True, timeout=60)
        if len(data) < 1000:
            raise RuntimeError(f"Screenshot too small ({len(data)} bytes)")
        with open(path, "wb") as f:
            f.write(data)
        return len(data)

    def screenshot_bytes(self):
        """Capture screenshot as raw bytes."""
        return self.run("exec-out", "screencap", "-p", binary=True, timeout=60)


# ---------------------------------------------------------------------------
# Screen Coordinates — Samsung Galaxy A16 (1080x2340)
# ---------------------------------------------------------------------------

# These are calibrated positions for the Samsung A16 5G (SM-A166U).
# Adjust if using a different device.

COORDS = {
    # City screen
    "profile_avatar": (65, 165),

    # Governor Profile screen
    "leaderboard_btn": (675, 2270),
    "settings_btn": (945, 2270),

    # Leaderboard category selector
    "leaderboard_back": (55, 160),
    "leaderboard_close": (1040, 160),
    "category_scroll_x": 540,
    "category_scroll_from_y": 1200,
    "category_scroll_to_y": 500,

    # Ranking list (inside a category)
    "ranking_back": (55, 160),
    "ranking_close": (1040, 160),
    "ranking_scroll_x": 540,
    "ranking_scroll_from_y": 1900,
    "ranking_scroll_to_y": 550,

    # World chat
    "chat_button": (86, 2153),
    "chat_world_tab": (150, 275),  # Leftmost tab in chat window
    "chat_close": (1040, 160),
    "chat_scroll_x": 540,
    "chat_scroll_from_y": 400,
    "chat_scroll_to_y": 1800,
}

# Category tap positions — calibrated empirically on Samsung A16 (1080x2340).
# The tappable y-positions do NOT match the visual card centers.
# Left column x=290, right column x=790.
# Rows 0-3 tappable without scrolling. Row 4 needs one scroll first.
CATEGORIES = [
    {"name": "alliance_power",       "x": 290, "y": 585,  "needs_scroll": False},
    {"name": "alliance_kills",       "x": 790, "y": 585,  "needs_scroll": False},
    {"name": "personal_power",       "x": 290, "y": 1200, "needs_scroll": False},
    {"name": "town_center_level",    "x": 790, "y": 1200, "needs_scroll": False},
    {"name": "kill_count",           "x": 290, "y": 1850, "needs_scroll": False},
    {"name": "rebel_conquest_stage", "x": 790, "y": 1850, "needs_scroll": False},
    {"name": "hero_power",           "x": 290, "y": 2200, "needs_scroll": False},
    {"name": "heros_total_power",    "x": 790, "y": 2200, "needs_scroll": False},
    {"name": "total_pet_power",      "x": 290, "y": 1850, "needs_scroll": True},
    {"name": "mystic_trial",         "x": 790, "y": 1850, "needs_scroll": True},
]


# ---------------------------------------------------------------------------
# Screenshot Comparison (end-of-list detection)
# ---------------------------------------------------------------------------

def screenshots_similar(path1, path2, threshold=5):
    """
    Compare two screenshots to detect end-of-list (no new content after scroll).
    Crops out status bar and bottom area to avoid false differences from clock changes.
    """
    if not HAS_PILLOW:
        # Fallback: raw byte comparison (less reliable)
        with open(path1, "rb") as f:
            d1 = hashlib.md5(f.read()).hexdigest()
        with open(path2, "rb") as f:
            d2 = hashlib.md5(f.read()).hexdigest()
        return d1 == d2

    img1 = Image.open(path1)
    img2 = Image.open(path2)
    h = img1.height
    # Crop to content area only (skip status bar and bottom nav)
    region1 = img1.crop((0, int(h * 0.10), img1.width, int(h * 0.92)))
    region2 = img2.crop((0, int(h * 0.10), img2.width, int(h * 0.92)))

    try:
        import imagehash
        h1 = imagehash.phash(region1)
        h2 = imagehash.phash(region2)
        return (h1 - h2) < threshold
    except ImportError:
        # Fallback: MD5 of cropped region bytes
        return (hashlib.md5(region1.tobytes()).hexdigest()
                == hashlib.md5(region2.tobytes()).hexdigest())


# ---------------------------------------------------------------------------
# Kingshot Scraper
# ---------------------------------------------------------------------------

class KingshotScraper:
    """Orchestrates the full ranking + chat screenshot capture."""

    def __init__(self, adb, data_dir):
        self.adb = adb
        self.human = adb.human
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(parents=True, exist_ok=True)
        self._category_scroll_pos = 0
        self._log_lines = []

    def log(self, msg):
        ts = datetime.now().strftime("%H:%M:%S")
        line = f"[{ts}] {msg}"
        print(line)
        self._log_lines.append(line)

    def _save_log(self, kingdom_dir):
        log_path = kingdom_dir / "scrape_log.txt"
        with open(log_path, "a") as f:
            for line in self._log_lines:
                f.write(line + "\n")

    # ----- Navigation -----

    def verify_screen(self, expected, max_retries=3):
        """
        Take a screenshot and verify we're on the expected screen.
        Returns True if verified, False if recovery failed.

        Checks a distinctive pixel region to identify the screen:
        - 'city': bottom nav bar visible (Conquest/Heroes/etc.)
        - 'profile': Governor Profile header
        - 'leaderboard': Leaderboard header with brown background
        - 'ranking': ranking list with column headers
        """
        for attempt in range(max_retries):
            data = self.adb.screenshot_bytes()
            if not HAS_PILLOW:
                return True  # Can't verify without Pillow, assume OK

            from io import BytesIO
            img = Image.open(BytesIO(data))

            if expected == 'city':
                # City has bottom nav bar — check for nav button area at bottom
                px = img.getpixel((450, 2310))
                if px[0] > 140:  # Nav bar is lighter than game
                    return True
            elif expected == 'profile':
                # Governor Profile has Skins/Squad/Leaderboard/Settings buttons at bottom
                # Check for the button area at y~2270 — lighter than game backgrounds
                px = img.getpixel((675, 2290))
                if px[0] > 60 and px[0] < 180:  # Button text area
                    return True
            elif expected == 'leaderboard':
                # Leaderboard has brown header bar at ~y=160
                px = img.getpixel((400, 120))
                if px[0] > 80 and px[0] < 140 and px[1] > 60 and px[1] < 120:  # Brown
                    return True
            elif expected == 'ranking':
                # Ranking list has brown header and lighter content below
                px = img.getpixel((400, 120))
                px2 = img.getpixel((400, 400))
                if px[0] > 80 and px[0] < 140 and px2[0] > 180:  # Brown header + light content
                    return True

            # Wrong screen — try to recover
            self.log(f"  SCREEN CHECK FAILED (expected {expected}, attempt {attempt+1}/{max_retries})")
            self.adb.run("shell", "input", "keyevent", "KEYCODE_BACK")
            time.sleep(2.0)

        return False

    def verify_active_kingdom(self, expected_kingdom_id, save_to=None):
        """
        AUDIT: Verify the phone is on the expected kingdom by reading the
        profile screen's "Kingdom: #XXX" field via OCR.

        Returns True if verified, raises RuntimeError if mismatch or unreadable.

        This is the ONLY way to guarantee we're scraping the right kingdom.
        Must be called BEFORE every scrape session.
        """
        self.log(f"AUDIT: Verifying active kingdom is #{expected_kingdom_id}")

        # Try opening profile up to 3 times — popups/chat bubbles can intercept the tap
        data = None
        for attempt in range(3):
            if attempt > 0:
                self.log(f"  Audit retry #{attempt+1}: back button + retry")
                self.adb.run("shell", "input", "keyevent", "4")  # BACK
                time.sleep(2.0)

            # Rapid triple-tap — some kingdoms have invisible overlays that
            # absorb the first tap. Multiple rapid taps break through.
            ax, ay = COORDS["profile_avatar"]
            for _ in range(3):
                self.adb.run("shell", "input", "tap", str(ax), str(ay))
                time.sleep(0.3)
            self.log(f"  tap profile avatar (audit) ({ax},{ay}) x3")
            time.sleep(3.0)

            data = self.adb.screenshot_bytes()

            # Quick check: does this look like the profile screen?
            # Profile has "Governor Profile" text and light blue background
            # City screen has green/brown. Check a pixel in the profile header area.
            try:
                from PIL import Image
                from io import BytesIO
                img = Image.open(BytesIO(data))
                # Profile screen has light blue background around (540, 400)
                px = img.getpixel((540, 400))
                is_blue = px[2] > 150 and px[2] > px[0] and px[2] > px[1]
                if is_blue:
                    self.log(f"  Profile screen detected (attempt {attempt+1})")
                    break
                else:
                    self.log(f"  Not on profile screen (attempt {attempt+1}), pixel={px}")
            except Exception:
                break  # Can't check, proceed with OCR anyway

        if save_to and data:
            with open(save_to, "wb") as f:
                f.write(data)
            self.log(f"  Audit screenshot saved to {save_to}")

        # Use EasyOCR to read the kingdom number
        try:
            import easyocr
            from io import BytesIO
            if not hasattr(self, '_ocr_reader'):
                self._ocr_reader = easyocr.Reader(['en'], gpu=False, verbose=False)

            img_bytes = BytesIO(data).getvalue()
            results = self._ocr_reader.readtext(img_bytes)

            # Look for "Kingdom: #XXX" or "Kingdom #XXX" in the results
            import re
            found_ids = []
            for bbox, text, conf in results:
                m = re.search(r'Kingdom[:\s#]+(\d+)', text, re.IGNORECASE)
                if m:
                    found_ids.append(int(m.group(1)))
                # Also match bare "#XXX" patterns near the bottom of profile
                m2 = re.match(r'^#(\d+)$', text.strip())
                if m2:
                    found_ids.append(int(m2.group(1)))

            self.log(f"  OCR found kingdom IDs on profile: {found_ids}")

            if expected_kingdom_id in found_ids:
                self.log(f"  AUDIT PASSED: Kingdom #{expected_kingdom_id} confirmed active")
                # Stay on profile screen — navigate_to_leaderboard will proceed from here
                self._on_profile_after_audit = True
                return True
            else:
                raise RuntimeError(
                    f"AUDIT FAILED: Expected Kingdom #{expected_kingdom_id}, "
                    f"OCR found {found_ids}. ABORTING SCRAPE."
                )
        except ImportError:
            self.log("  WARNING: easyocr not installed, skipping audit")
            self._on_profile_after_audit = False
            return True

    def _recover_from_stuck_state(self):
        """
        Detect and dismiss known stuck states before navigation:
        - Quit game confirmation dialog (orange Cancel + cyan Confirm)
        - Generic popups with an X close button visible

        Returns True if a recovery action was taken.
        """
        try:
            from PIL import Image
            from io import BytesIO
            data = self.adb.screenshot_bytes()
            img = Image.open(BytesIO(data))

            # Check for "Quit game?" confirmation dialog.
            # Pixel signatures: orange Cancel button at ~(300, 1440) is RGB (200-255, 80-150, 30-100)
            # Cyan Confirm button at ~(750, 1440) is RGB (50-130, 180-230, 200-240)
            cancel_px = img.getpixel((300, 1440))
            confirm_px = img.getpixel((750, 1440))

            is_orange = (200 < cancel_px[0] < 255 and 80 < cancel_px[1] < 170
                         and 30 < cancel_px[2] < 110)
            is_cyan = (50 < confirm_px[0] < 140 and 180 < confirm_px[1] < 240
                       and 190 < confirm_px[2] < 245)

            if is_orange and is_cyan:
                self.log("  RECOVERY: Quit-game dialog detected, tapping Cancel")
                self.adb.run("shell", "input", "tap", "300", "1440")
                time.sleep(2.0)
                return True
        except Exception as e:
            self.log(f"  Recovery check failed: {e}")
        return False

    def navigate_to_leaderboard(self):
        """
        Navigate to the leaderboard category selector.
        If audit just ran, we're already on profile — skip the avatar tap.
        Otherwise: city → profile → leaderboard.
        """
        # Always check for stuck states first
        self._recover_from_stuck_state()

        # NEW: universal popup dismisser runs before navigation
        try:
            from popup_handler import PopupHandler
            if not hasattr(self, '_popup_handler'):
                self._popup_handler = PopupHandler(self.adb)
            self._popup_handler.dismiss_all(max_attempts=5)
        except Exception as e:
            self.log(f"  popup handler error: {e}")

        if getattr(self, '_on_profile_after_audit', False):
            self.log("Already on profile (from audit), skipping avatar tap")
            self._on_profile_after_audit = False
        else:
            self.log("Navigating: city -> profile")
            # Triple-tap to break through invisible overlays on some kingdoms
            ax, ay = COORDS["profile_avatar"]
            for _ in range(3):
                self.adb.run("shell", "input", "tap", str(ax), str(ay))
                time.sleep(0.3)
            self.log(f"  tap profile avatar ({ax},{ay}) x3")
            time.sleep(3.0)

            if not self.verify_screen('profile'):
                self.log("  WARNING: Not on profile screen, retrying")
                self.adb.run("shell", "input", "keyevent", "KEYCODE_BACK")
                time.sleep(2.0)
                for _ in range(3):
                    self.adb.run("shell", "input", "tap", str(ax), str(ay))
                    time.sleep(0.3)
                self.log(f"  tap profile avatar (retry) ({ax},{ay}) x3")
                time.sleep(3.0)

        self.log("Navigating: profile -> leaderboard")
        self.adb.tap(*COORDS["leaderboard_btn"], label="leaderboard button", critical=True)
        time.sleep(4.0)

        self._category_scroll_pos = 0
        self._grid_scrolled = False
        self.log("On leaderboard category selector")

    def _scroll_category_grid(self):
        """Scroll the category grid once to reveal lower categories (row 4)."""
        self.adb.swipe(
            COORDS["category_scroll_x"], COORDS["category_scroll_from_y"],
            COORDS["category_scroll_x"], COORDS["category_scroll_to_y"],
        )
        self.human.read_delay()
        self.log(f"  Category grid scrolled")
        self._grid_scrolled = True

    def _verify_on_category_selector(self):
        """
        Check that we're actually on the leaderboard category selector/ranking.
        The header bar is brown (~100, 79, 58). Sample 5 points across y=160;
        require at least 3 to be brown. Text (white) can occupy some points.
        """
        if not HAS_PILLOW:
            return True
        from io import BytesIO
        data = self.adb.screenshot_bytes()
        img = Image.open(BytesIO(data))
        # Sample 5 points — pure background areas where text shouldn't be
        checks = [
            img.getpixel((100, 120))[:3],
            img.getpixel((250, 120))[:3],
            img.getpixel((500, 120))[:3],
            img.getpixel((800, 120))[:3],
            img.getpixel((950, 120))[:3],
        ]
        brown_count = 0
        for r, g, b in checks:
            if 80 < r < 140 and 60 < g < 100 and 40 < b < 80:
                brown_count += 1
        return brown_count >= 3

    def _tap_category(self, cat):
        """Tap a category card at its calibrated position."""
        # MID-SCRAPE AUDIT: verify we're on the category selector before tapping
        if not self._verify_on_category_selector():
            self.log(f"  !!! NOT ON CATEGORY SELECTOR — attempting recovery")
            # Try back button to dismiss any popup
            self.adb.run("shell", "input", "keyevent", "KEYCODE_BACK")
            time.sleep(2.0)
            if not self._verify_on_category_selector():
                # Second back attempt
                self.adb.run("shell", "input", "keyevent", "KEYCODE_BACK")
                time.sleep(2.0)
                if not self._verify_on_category_selector():
                    raise RuntimeError(
                        f"Lost leaderboard context before {cat['name']}. "
                        f"Category selector no longer visible. ABORTING."
                    )
            self.log(f"  recovery successful, continuing")

        if cat["needs_scroll"] and not self._grid_scrolled:
            self._scroll_category_grid()
        self.adb.tap(cat["x"], cat["y"], label=f"{cat['name']}", critical=True)
        self.human.screen_transition()

    def _back_to_categories(self):
        """Return from ranking list to category selector."""
        self.adb.tap(*COORDS["ranking_back"], label="back arrow", critical=True)
        self.human.screen_transition()
        # Grid scroll resets when returning from a ranking view
        self._grid_scrolled = False

    def _close_leaderboard(self):
        """Close leaderboard entirely, return to city screen."""
        self.adb.tap(*COORDS["leaderboard_close"], label="close leaderboard", critical=True)
        self.human.screen_transition()

    # ----- Ranking Scraper -----

    def scrape_ranking(self, kingdom_id, category, output_dir):
        """
        Scroll through a ranking list, taking screenshots with overlap.
        Returns the number of screenshots captured.
        """
        self.log(f"  Scraping {category['name']}...")
        max_pages = 15
        prev_path = None
        count = 0

        for page in range(max_pages):
            fname = f"{category['name']}_{page:03d}.png"
            fpath = output_dir / fname
            self.adb.screenshot(str(fpath))
            count += 1
            self.log(f"    [{page:03d}] {fname}")

            # End-of-list detection: compare with previous screenshot
            if prev_path and screenshots_similar(str(prev_path), str(fpath)):
                self.log(f"    End of list detected (page {page} matches previous)")
                os.remove(fpath)
                count -= 1
                break

            prev_path = fpath

            # Scroll down to see more rankings
            self.human.scroll_pause()
            self.adb.swipe(
                COORDS["ranking_scroll_x"], COORDS["ranking_scroll_from_y"],
                COORDS["ranking_scroll_x"], COORDS["ranking_scroll_to_y"],
            )

            # Occasional distraction pause
            pause = self.human.maybe_distraction()
            if pause:
                self.log(f"    (distraction pause: {pause:.1f}s)")

        return count

    # ----- World Chat Scraper -----

    def scrape_world_chat(self, kingdom_id, output_dir):
        """
        Navigate to world chat, screenshot pages scrolling back in time.
        """
        chat_pages = random.randint(3, 6)
        self.log(f"  Scraping world chat ({chat_pages} pages)...")
        count = 0

        # Open chat
        self.adb.tap(*COORDS["chat_button"], label="chat button")
        self.human.screen_transition()

        # Tap World tab
        self.adb.tap(*COORDS["chat_world_tab"], label="world chat tab")
        self.human.read_delay()

        for page in range(chat_pages):
            fname = f"worldchat_{page:03d}.png"
            fpath = output_dir / fname
            self.adb.screenshot(str(fpath))
            count += 1
            self.log(f"    [chat {page:03d}] {fname}")

            if page < chat_pages - 1:
                # Scroll UP in chat (swipe down gesture) to see older messages
                self.human.scroll_pause()
                self.adb.swipe(
                    COORDS["chat_scroll_x"], COORDS["chat_scroll_from_y"],
                    COORDS["chat_scroll_x"], COORDS["chat_scroll_to_y"],
                )

        # Close chat
        self.human.tap_delay()
        self.adb.tap(*COORDS["chat_close"], label="close chat")
        self.human.screen_transition()

        return count

    # ----- Noise Actions -----

    def do_noise(self):
        """
        Perform 1-2 random non-ranking actions to break the pattern.
        Only uses SAFE actions that don't navigate away from city screen.
        """
        actions = [
            self._noise_scroll_map,
            self._noise_idle_pause,
        ]
        num = random.randint(1, 2)
        chosen = random.sample(actions, min(num, len(actions)))
        for action in chosen:
            action()

    def _noise_scroll_map(self):
        """Scroll the city/world view randomly like a bored player."""
        self.log("  (noise: scrolling around)")
        for _ in range(random.randint(1, 3)):
            dx = random.randint(-200, 200)
            dy = random.randint(-300, 300)
            cx, cy = self.adb.width // 2, self.adb.height // 2
            self.adb.swipe(cx, cy, cx + dx, cy + dy)
            self.human.tap_delay()

    def _noise_browse_menu(self):
        """Open and close a random bottom menu button."""
        self.log("  (noise: browsing menu)")
        # Bottom bar buttons: Conquest, Heroes, Backpack, Shop, Alliance, World
        # Roughly evenly spaced across the bottom
        menu_positions = [
            (90, 2300),   # Conquest
            (270, 2300),  # Heroes
            (450, 2300),  # Backpack
            (630, 2300),  # Shop
            (810, 2300),  # Alliance
            (990, 2300),  # World
        ]
        choice = random.choice(menu_positions)
        self.adb.tap(*choice, label="menu button")
        self.human.read_delay()
        # Go back by tapping somewhere neutral or pressing back
        time.sleep(self.human._gauss(2.0, 1.0, low=1.0, high=5.0))
        # Android back gesture
        self.adb.run("shell", "input", "keyevent", "KEYCODE_BACK")
        self.human.tap_delay()

    def _noise_idle_pause(self):
        """Just sit on the city screen for a while, like a distracted player."""
        pause = self.human._gauss(8.0, 4.0, low=3.0, high=20.0)
        self.log(f"  (noise: idle {pause:.1f}s)")
        time.sleep(pause)

    # ----- Full Kingdom Scrape -----

    def scrape_kingdom(self, kingdom_id, categories=None, include_chat=True, skip_audit=False):
        """
        Full scrape sequence for one kingdom:
        1. Noise actions (pre-scrape camouflage)
        2. Navigate to leaderboard
        3. Scrape each ranking category
        4. Close leaderboard
        5. Scrape world chat
        6. Noise actions (post-scrape)
        """
        ts = datetime.now().strftime("%Y-%m-%d_%H%M%S")
        k_dir = self.data_dir / f"k{kingdom_id}" / ts
        k_dir.mkdir(parents=True, exist_ok=True)

        if categories is None:
            cats_to_scrape = CATEGORIES
        else:
            cats_to_scrape = [c for c in CATEGORIES if c["name"] in categories]

        self.log(f"=== Starting Kingdom {kingdom_id} ===")
        self.log(f"    Output: {k_dir}")
        self.log(f"    Categories: {[c['name'] for c in cats_to_scrape]}")
        start_time = time.time()

        # AUDIT: Verify we're on the right kingdom.
        self.log("Phase 0: Audit")

        audit_path = k_dir / "audit_profile.png"
        if skip_audit:
            self.log("  AUDIT SKIPPED (--skip-audit flag)")
            self._on_profile_after_audit = False
        else:
            try:
                self.verify_active_kingdom(int(kingdom_id), save_to=str(audit_path))
            except RuntimeError as e:
                self.log(f"!!! {e}")
                raise

        # Phase 1: Pre-scrape noise
        if self._on_profile_after_audit:
            # Close profile first, do noise on city, then navigate
            self.adb.tap(*COORDS["back_arrow"], label="close profile for noise")
            time.sleep(2.0)
        self.log("Phase 1: Pre-scrape noise")
        self.do_noise()

        # Phase 2: Navigate to leaderboard
        self.log("Phase 2: Navigate to leaderboard")
        self.navigate_to_leaderboard()

        # Phase 3: Scrape each category
        self.log("Phase 3: Scrape rankings")
        total_screenshots = 0
        self._category_scroll_pos = 0

        for i, cat in enumerate(cats_to_scrape):
            self.log(f"  Category {i+1}/{len(cats_to_scrape)}: {cat['name']}")

            # Tap the card at its calibrated position
            self._tap_category(cat)

            # Scrape the ranking list
            count = self.scrape_ranking(kingdom_id, cat, k_dir)
            total_screenshots += count

            # Go back to category selector
            self._back_to_categories()

            # Occasional noise between categories
            if random.random() < 0.15 and i < len(cats_to_scrape) - 1:
                self.log("  (noise break between categories)")
                self._close_leaderboard()
                self.do_noise()
                self.navigate_to_leaderboard()

            self.human.maybe_distraction()

        # Phase 3: Close leaderboard
        self._close_leaderboard()

        # Phase 4: World chat
        if include_chat:
            self.log("Phase 3: World chat")
            chat_count = self.scrape_world_chat(kingdom_id, k_dir)
            total_screenshots += chat_count

        # Phase 5: Post-scrape noise
        self.log("Phase 4: Post-scrape noise")
        self.do_noise()

        elapsed = time.time() - start_time

        # Save metadata
        metadata = {
            "kingdom_id": kingdom_id,
            "timestamp": ts,
            "device": self.adb.device_id,
            "resolution": f"{self.adb.width}x{self.adb.height}",
            "categories_scraped": [c["name"] for c in cats_to_scrape],
            "total_screenshots": total_screenshots,
            "duration_seconds": int(elapsed),
            "chat_included": include_chat,
        }
        with open(k_dir / "metadata.json", "w") as f:
            json.dump(metadata, f, indent=2)

        self._save_log(k_dir)

        self.log(f"=== Kingdom {kingdom_id} COMPLETE ===")
        self.log(f"    {total_screenshots} screenshots in {elapsed:.0f}s")
        self.log(f"    Output: {k_dir}")

        # macOS notification
        try:
            subprocess.run([
                "osascript", "-e",
                f'display notification "Kingdom {kingdom_id}: '
                f'{total_screenshots} screenshots in {int(elapsed)}s" '
                f'with title "Kingshot Scraper" sound name "Glass"'
            ], capture_output=True, timeout=5)
        except Exception:
            pass

        return k_dir


# ---------------------------------------------------------------------------
# Device helpers
# ---------------------------------------------------------------------------

def resolve_device(device_arg):
    """Parse --device argument into an ADB device ID."""
    if device_arg == "usb":
        try:
            out = subprocess.run(
                [ADB, "devices"], capture_output=True, timeout=10
            ).stdout.decode()
        except FileNotFoundError:
            print(f"ERROR: ADB not found at {ADB}")
            sys.exit(1)
        for line in out.strip().splitlines()[1:]:
            parts = line.split()
            if len(parts) >= 2 and parts[1] == "device":
                if not parts[0].startswith("emulator"):
                    return parts[0]
        print("ERROR: No USB device found. Check USB debugging is enabled.")
        sys.exit(1)

    if device_arg.startswith("phone:"):
        ip = device_arg.split(":", 1)[1]
        target = f"{ip}:5555"
        subprocess.run([ADB, "connect", target], capture_output=True, timeout=10)
        return target

    return device_arg


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description="Kingshot Human Scraper — ADB screenshot automation"
    )

    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--detect", action="store_true",
                      help="Show device info and resolution")
    mode.add_argument("--screenshot", action="store_true",
                      help="Take one screenshot (for calibration)")
    mode.add_argument("--scrape", action="store_true",
                      help="Scrape rankings for one kingdom")
    mode.add_argument("--chat", action="store_true",
                      help="Scrape world chat only")

    parser.add_argument("--device", default="usb",
                        help="usb | phone:<IP> | <device_id> (default: usb)")
    parser.add_argument("--kingdom", type=str, default=None,
                        help="Kingdom ID")
    parser.add_argument("--categories", type=str, default=None,
                        help="Comma-separated category names (default: all)")
    parser.add_argument("--no-chat", action="store_true",
                        help="Skip world chat capture")
    parser.add_argument("--yes", action="store_true",
                        help="Skip confirmation prompt")
    parser.add_argument("--skip-audit", action="store_true",
                        help="Skip kingdom audit (use when avatar tap is blocked)")
    parser.add_argument("--output", type=str,
                        default=str(Path(__file__).parent / "data" / "kingdoms"),
                        help="Output directory")

    args = parser.parse_args()

    device_id = resolve_device(args.device)
    human = HumanBehavior()
    adb = ADBController(device_id, human)

    # --- detect mode ---
    if args.detect:
        print(f"Device: {device_id}")
        if adb.is_connected():
            w, h = adb.detect_resolution()
            print(f"Status: connected")
            print(f"Resolution: {w}x{h}")
            print(f"NumPy:  {'yes' if HAS_NUMPY else 'no (pip install numpy for Gaussian timing)'}")
            print(f"Pillow: {'yes' if HAS_PILLOW else 'no (pip install pillow for better detection)'}")
        else:
            print("Status: NOT CONNECTED")
        return

    # --- screenshot mode ---
    if args.screenshot:
        if not adb.is_connected():
            print(f"ERROR: Device {device_id} not connected.")
            sys.exit(1)
        adb.detect_resolution()
        out_dir = Path(args.output)
        out_dir.mkdir(parents=True, exist_ok=True)
        ts = datetime.now().strftime("%Y%m%d_%H%M%S")
        path = out_dir / f"calibration_{ts}.png"
        size = adb.screenshot(str(path))
        print(f"Screenshot: {path} ({size:,} bytes, {adb.width}x{adb.height})")
        return

    # --- scrape / chat mode ---
    if not args.kingdom:
        parser.error("--scrape and --chat require --kingdom")

    if not adb.is_connected():
        print(f"ERROR: Device {device_id} not connected.")
        sys.exit(1)

    adb.detect_resolution()
    print(f"Device: {device_id} | Resolution: {adb.width}x{adb.height}")

    scraper = KingshotScraper(adb, args.output)

    if args.chat:
        # Chat only mode
        ts = datetime.now().strftime("%Y-%m-%d_%H%M%S")
        k_dir = Path(args.output) / f"k{args.kingdom}" / ts
        k_dir.mkdir(parents=True, exist_ok=True)
        count = scraper.scrape_world_chat(args.kingdom, k_dir)
        print(f"\nChat capture complete: {count} pages -> {k_dir}")
        return

    # Full scrape
    categories = None
    if args.categories:
        categories = [c.strip() for c in args.categories.split(",")]

    if not args.yes:
        print()
        print("PRE-FLIGHT CHECK:")
        print("  1. Is Kingshot open on the CITY SCREEN?")
        print("  2. Is the phone screen on and unlocked?")
        print(f"  3. Kingdom to scrape: {args.kingdom}")
        confirm = input("Ready? (y/n): ").strip().lower()
        if confirm != "y":
            print("Stopped. Get the game to the city screen and try again.")
            sys.exit(0)
    print(f"\nStarting scrape: Kingdom {args.kingdom}")

    scraper.scrape_kingdom(
        args.kingdom,
        categories=categories,
        include_chat=not args.no_chat,
        skip_audit=args.skip_audit,
    )

    print("\nDone.")


if __name__ == "__main__":
    main()

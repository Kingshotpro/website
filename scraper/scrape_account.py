#!/usr/bin/env python3
"""
scrape_account.py — Iterate every character on the currently-logged-in account
and scrape each kingdom. No manual kingdom switching.

Flow:
1. Detect current kingdom via OCR of profile screen
2. Scrape current kingdom (calls kingshot_scraper.py as subprocess)
3. Open Characters list, OCR all visible kingdoms
4. For each non-current kingdom: scroll to it, tap row, confirm login,
   handle all popups, scrape, then back to Characters
5. When Characters list exhausted (no new kingdoms found), stop

Usage:
    python3 scrape_account.py
    python3 scrape_account.py --skip 303,350   # skip already-scraped kingdoms
"""
import subprocess
import sys
import os
import time
import re
import argparse
from io import BytesIO
from pathlib import Path
from PIL import Image

ADB = os.path.expanduser("~/platform-tools/adb")
DEVICE_ID = "R5CY61LHZVA"
SCRAPER = Path(__file__).parent / "kingshot_scraper.py"


def adb(*args, capture=True):
    cmd = [ADB, "-s", DEVICE_ID] + list(args)
    if capture:
        return subprocess.run(cmd, capture_output=True, timeout=30)
    return subprocess.run(cmd, timeout=30)


def screenshot():
    res = adb("exec-out", "screencap", "-p")
    return Image.open(BytesIO(res.stdout))


def tap(x, y, delay=1.5):
    adb("shell", "input", "tap", str(x), str(y))
    time.sleep(delay)


def swipe(x1, y1, x2, y2, duration=800):
    adb("shell", "input", "swipe", str(x1), str(y1), str(x2), str(y2), str(duration))
    time.sleep(1.5)


# ----------------------------------------------------------------- popup logic

def get_popup_handler():
    """Instantiate the PopupHandler with a minimal ADB adapter."""
    sys.path.insert(0, str(Path(__file__).parent))
    from popup_handler import PopupHandler

    class AdbAdapter:
        def run(self, *args): return adb(*args)
        def screenshot_bytes(self):
            return adb("exec-out", "screencap", "-p").stdout
        def log(self, msg): print(f"    {msg}")

    return PopupHandler(AdbAdapter())


# ----------------------------------------------------------------- OCR helpers

_ocr = None

def ocr_reader():
    global _ocr
    if _ocr is None:
        import easyocr
        _ocr = easyocr.Reader(['en'], gpu=False, verbose=False)
    return _ocr


def ocr_text(img, crop=None):
    reader = ocr_reader()
    if crop:
        img = img.crop(crop)
    buf = BytesIO()
    img.save(buf, 'PNG')
    return reader.readtext(buf.getvalue())


def detect_current_kingdom():
    """Open profile, OCR for 'Kingdom: #XXX', close profile."""
    # Triple-tap avatar
    for _ in range(3):
        tap(65, 165, delay=0.3)
    time.sleep(3)

    img = screenshot()
    results = ocr_text(img)
    kid = None
    for bbox, text, conf in results:
        m = re.search(r'Kingdom[:\s#]+(\d+)', text, re.IGNORECASE)
        if m:
            kid = int(m.group(1))
            break
    # Close profile
    tap(55, 160, delay=2)
    return kid


# ----------------------------------------------------------------- Characters list

def list_characters():
    """
    Navigate to Characters list. Scroll through it fully, OCR every
    'Kingdom #XXX' header, and return {kid: row_y_absolute} mapping.

    The y-coordinate is the y-position where the CHARACTER row is (not the header).
    """
    # Profile → Settings → Characters
    for _ in range(3):
        tap(65, 165, delay=0.3)
    time.sleep(3)
    tap(945, 2270, delay=2)  # Settings
    tap(370, 555, delay=3)   # Characters

    # Scroll to top first
    for _ in range(5):
        swipe(540, 700, 540, 1700, 700)

    kingdoms = {}  # kid -> list of y positions we've seen the header at
    seen_scrolls = 0

    for scroll_attempt in range(15):
        img = screenshot()
        results = ocr_text(img, crop=(0, 300, 1080, 2100))

        found_any_new = False
        for bbox, text, conf in results:
            m = re.search(r'Kingdom\s*#?\s*(\d+)', text, re.IGNORECASE)
            if not m:
                continue
            kid = int(m.group(1))
            ys = [pt[1] for pt in bbox]
            header_y = ((min(ys) + max(ys)) // 2) + 300  # add crop offset
            # Row is ~150px below header
            row_y = header_y + 150
            if kid not in kingdoms:
                kingdoms[kid] = row_y
                found_any_new = True
                print(f"    found K{kid} at row_y={row_y}")

        if not found_any_new:
            seen_scrolls += 1
            if seen_scrolls >= 2:
                break
        else:
            seen_scrolls = 0

        # Scroll down
        swipe(540, 1600, 540, 700, 800)

    return kingdoms


def close_all_menus():
    """Close any open Settings/Characters/Profile screens."""
    for _ in range(4):
        tap(55, 160, delay=1.5)
        tap(1040, 340, delay=1.5)
    # Also dismiss any popups
    handler = get_popup_handler()
    handler.dismiss_all(max_attempts=5)


# ----------------------------------------------------------------- switch logic

def switch_to_kingdom(target_kid, row_y):
    """Tap row, confirm login, dismiss popups."""
    print(f"  switching to K{target_kid}...")
    tap(540, row_y, delay=3)
    # Login dialog: tap Confirm (right button)
    tap(750, 1460, delay=18)
    # Dismiss all popups
    handler = get_popup_handler()
    handler.dismiss_all(max_attempts=8)


# ----------------------------------------------------------------- main orchestrator

def run_scrape(kid):
    """Run kingshot_scraper.py on the current kingdom synchronously."""
    print(f"\n=== Scraping K{kid} ===")
    result = subprocess.run(
        ["python3", "-u", str(SCRAPER), "--scrape", "--kingdom", str(kid),
         "--yes", "--skip-audit"],
        cwd=str(SCRAPER.parent),
        capture_output=False,
    )
    if result.returncode == 0:
        print(f"=== K{kid} COMPLETE ===\n")
        return True
    else:
        print(f"=== K{kid} FAILED (exit {result.returncode}) ===\n")
        return False


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--skip", type=str, default="",
                        help="Comma-separated kingdom IDs to skip")
    parser.add_argument("--dry-run", action="store_true",
                        help="Just list kingdoms, don't scrape")
    args = parser.parse_args()

    skip = set()
    if args.skip:
        skip = set(int(x.strip()) for x in args.skip.split(","))

    # Detect current kingdom
    print("Detecting current kingdom...")
    current = detect_current_kingdom()
    if current is None:
        print("ERROR: could not detect current kingdom")
        return
    print(f"Current: K{current}")

    # List all characters on account
    print("Listing all characters on account...")
    kingdoms = list_characters()
    print(f"Found {len(kingdoms)} kingdoms on this account: {sorted(kingdoms.keys())}")

    close_all_menus()

    if args.dry_run:
        return

    # Scrape current first
    if current not in skip:
        run_scrape(current)
    else:
        print(f"Skipping K{current} (in skip list)")

    # Iterate remaining
    to_scrape = [k for k in sorted(kingdoms) if k != current and k not in skip]
    print(f"\nRemaining to scrape: {to_scrape}")

    for kid in to_scrape:
        # Re-detect row position (list may have reordered after prior switches)
        print(f"\nLocating K{kid} in Characters list...")
        kingdoms_now = list_characters()
        if kid not in kingdoms_now:
            print(f"  WARN: K{kid} not found in current list, skipping")
            close_all_menus()
            continue

        switch_to_kingdom(kid, kingdoms_now[kid])
        run_scrape(kid)


if __name__ == "__main__":
    main()

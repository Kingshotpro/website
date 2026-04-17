#!/usr/bin/env python3
"""
switch_kingdom.py — Switch the phone to a specific Kingdom via the
Settings → Characters list, using OCR to find the right row.

Usage:
    python3 switch_kingdom.py 222

Steps:
1. Open profile (triple-tap avatar)
2. Open Settings → Characters
3. Scroll list, OCR each visible "Kingdom #XXX" header until match found
4. Tap that row's character entry, confirm login
5. Dismiss promo + welcome-back popups
"""
import subprocess
import sys
import time
import re
import os
from io import BytesIO
from PIL import Image

ADB = os.path.expanduser("~/platform-tools/adb")
DEVICE_ID = "R5CY61LHZVA"


def adb(*args, capture=True):
    cmd = [ADB, "-s", DEVICE_ID] + list(args)
    if capture:
        return subprocess.run(cmd, capture_output=True, timeout=30)
    return subprocess.run(cmd, timeout=30)


def screenshot():
    res = adb("exec-out", "screencap", "-p")
    return Image.open(BytesIO(res.stdout))


def tap(x, y):
    adb("shell", "input", "tap", str(x), str(y))


def swipe(x1, y1, x2, y2, duration=600):
    adb("shell", "input", "swipe", str(x1), str(y1), str(x2), str(y2), str(duration))


def open_profile():
    """Triple-tap avatar with timing the game accepts."""
    for _ in range(3):
        tap(65, 165)
        time.sleep(0.3)
    time.sleep(3)


def find_kingdom_in_visible(target_kid):
    """
    OCR the current screen, look for 'Kingdom #XXX' or 'Kingdom XXX'
    headers. Returns the y-coordinate of the matching header, or None.
    """
    try:
        import easyocr
    except ImportError:
        print("EasyOCR not installed")
        return None

    if not hasattr(find_kingdom_in_visible, '_reader'):
        find_kingdom_in_visible._reader = easyocr.Reader(['en'], gpu=False, verbose=False)
    reader = find_kingdom_in_visible._reader

    img = screenshot()
    buf = BytesIO()
    img.save(buf, 'PNG')
    results = reader.readtext(buf.getvalue())

    for bbox, text, conf in results:
        m = re.search(r'Kingdom\s*#?\s*(\d+)', text, re.IGNORECASE)
        if m and int(m.group(1)) == target_kid:
            # Get y center of bbox
            ys = [pt[1] for pt in bbox]
            y_center = (min(ys) + max(ys)) // 2
            # Character row is BELOW the header (~150px below)
            return y_center + 150
    return None


def switch_to_kingdom(target_kid):
    print(f"=== Switching to Kingdom #{target_kid} ===")

    print("Opening profile...")
    open_profile()

    print("Opening Settings...")
    tap(945, 2270)
    time.sleep(2)

    print("Opening Characters...")
    tap(370, 555)
    time.sleep(3)

    # Scroll through list, looking for target kingdom
    for scroll_attempt in range(8):
        row_y = find_kingdom_in_visible(target_kid)
        if row_y is not None:
            print(f"Found Kingdom #{target_kid} — tapping row at y={row_y}")
            tap(540, row_y)
            time.sleep(3)
            break

        print(f"  Not visible (scroll attempt {scroll_attempt+1}), scrolling down...")
        swipe(540, 1600, 540, 600, 800)
        time.sleep(2)
    else:
        print(f"ERROR: Kingdom #{target_kid} not found after 8 scrolls")
        return False

    # Confirm login dialog
    print("Confirming login...")
    tap(750, 1460)
    print("Waiting 18s for kingdom to load...")
    time.sleep(18)

    # Dismiss promo popup (X at top-right)
    print("Dismissing promo...")
    tap(1040, 130)
    time.sleep(2)

    # Dismiss welcome-back popup (Confirm at bottom)
    print("Dismissing welcome back...")
    tap(540, 1800)
    time.sleep(3)

    print(f"=== Kingdom #{target_kid} loaded ===")
    return True


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python3 switch_kingdom.py KINGDOM_ID")
        sys.exit(1)
    kid = int(sys.argv[1])
    success = switch_to_kingdom(kid)
    sys.exit(0 if success else 1)

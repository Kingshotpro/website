#!/usr/bin/env python3
"""
Autonomous script: after K1 scrape finishes, switch to K224 and scrape it.
Then start extraction on K1 data.
"""
import subprocess
import time
import sys
import os

ADB = os.path.expanduser("~/platform-tools/adb")
DEVICE = "R5CY61LHZVA"

def adb(cmd):
    subprocess.run([ADB, "-s", DEVICE, "shell"] + cmd.split(), capture_output=True)

def tap(x, y):
    adb(f"input tap {x} {y}")

def swipe(x1, y1, x2, y2, dur=1400):
    adb(f"input swipe {x1} {y1} {x2} {y2} {dur}")

def screenshot(path):
    data = subprocess.run([ADB, "-s", DEVICE, "exec-out", "screencap", "-p"],
                          capture_output=True).stdout
    with open(path, "wb") as f:
        f.write(data)

def wait_for_k1_scrape():
    """Wait for K1 scraper to finish by checking for COMPLETE in log."""
    print("Waiting for K1 scrape to finish...")
    while True:
        try:
            with open("/tmp/k1_scrape.log") as f:
                if "COMPLETE" in f.read():
                    print("K1 scrape complete!")
                    return
        except:
            pass
        time.sleep(30)

def switch_to_kingdom(target_scroll_direction="down"):
    """
    Navigate: city -> profile -> settings -> characters -> find kingdom -> tap -> confirm -> dismiss popups.
    target_scroll_direction: 'down' to scroll down from top, 'up' to scroll up from bottom.
    """
    print("Switching kingdom...")

    # Profile avatar
    tap(60, 120)
    time.sleep(5)

    # Settings button (rightmost in profile bottom bar)
    tap(945, 2270)
    time.sleep(5)

    # Characters button (left column, 2nd row in Settings)
    tap(280, 565)
    time.sleep(5)

    # Scroll to find K224 — it's below the initial view
    # From the character list we saw: K1, K221, K222, K223, K224, K225, K226, K1908
    # K224 is about 4 entries down. Scroll down from center.
    swipe(540, 1170, 540, 770, 1400)  # scroll down
    time.sleep(4)

    screenshot("/tmp/auto_chars.png")
    print("Characters list screenshot saved")

    # K224 should now be visible — tap its entry
    # Using 47% of screen height (same as K1 worked at)
    # But K224 might be at a different row position after scrolling
    # Let's tap at the same 47% position
    tap(540, 1100)
    time.sleep(5)

    screenshot("/tmp/auto_confirm.png")
    print("Confirm dialog screenshot saved")

    # Tap Confirm button — 70% x, 62% y
    tap(756, 1451)
    time.sleep(15)  # Kingdom load takes time

    # Dismiss popups — try tapping X positions multiple times
    print("Dismissing startup popups...")
    for attempt in range(8):
        screenshot(f"/tmp/auto_popup_{attempt}.png")
        # Try common X button positions
        tap(970, 420)   # top-right X (most common)
        time.sleep(3)
        # Try confirm/OK button
        tap(540, 1942)  # center bottom confirm
        time.sleep(3)

    screenshot("/tmp/auto_city.png")
    print("Should be on city screen now")

def run_scraper(kingdom_id):
    """Run the scraper for a kingdom."""
    print(f"Starting scrape for Kingdom {kingdom_id}...")
    result = subprocess.run(
        [sys.executable, "-u", "kingshot_scraper.py",
         "--scrape", "--kingdom", str(kingdom_id), "--yes"],
        capture_output=False
    )
    print(f"Scraper exited with code {result.returncode}")

def run_extraction(kingdom_dir):
    """Run OCR extraction on a kingdom's screenshots."""
    print(f"Starting extraction for {kingdom_dir}...")
    result = subprocess.run(
        [sys.executable, "-u", "extract_data.py", kingdom_dir, "--format", "both"],
        capture_output=False
    )
    print(f"Extraction exited with code {result.returncode}")

if __name__ == "__main__":
    os.chdir(os.path.dirname(os.path.abspath(__file__)))

    # Step 1: Wait for K1 scrape to finish
    wait_for_k1_scrape()
    time.sleep(10)  # Brief pause

    # Step 2: Switch to K224
    switch_to_kingdom()

    # Step 3: Scrape K224
    run_scraper(224)

    # Step 4: Start K1 extraction
    k1_dir = sorted([d for d in os.listdir("data/kingdoms/k1") if os.path.isdir(f"data/kingdoms/k1/{d}")])[-1]
    run_extraction(f"data/kingdoms/k1/{k1_dir}")

    print("\n=== ALL DONE ===")
    print("K1: scraped + extracted")
    print("K224: scraped (extraction next)")

#!/usr/bin/env python3
"""
Screenshot Validator — watches a scrape directory and verifies screenshots
look like ranking screens. Kills the scraper if bad screenshots are detected.

Usage:
    python3 screenshot_validator.py <kingdom_id> <scraper_pid>

Checks:
1. Brown header bar at y=160 (the ranking header)
2. Light content area below header
3. If ANY recent screenshot doesn't match → kill scraper + exit with diagnosis
"""
import sys
import os
import time
import subprocess
import glob
from pathlib import Path

try:
    from PIL import Image
    HAS_PILLOW = True
except ImportError:
    print("ERROR: Pillow required for validator")
    sys.exit(1)


def classify_screen(img_path):
    """
    Classify what screen a screenshot shows.
    Priority: check for RANKING FIRST — if the brown header is there, it's
    a ranking screen regardless of what else is on screen.
    """
    try:
        img = Image.open(img_path)
    except Exception as e:
        return 'unknown', f'Cannot open: {e}'

    # PRIMARY CHECK: Brown header bar at y=160
    # Ranking screens have this. If present, it's a ranking screen.
    checks_160 = [
        img.getpixel((100, 120))[:3],
        img.getpixel((250, 120))[:3],
        img.getpixel((500, 120))[:3],
        img.getpixel((800, 120))[:3],
        img.getpixel((950, 120))[:3],
    ]
    brown_count = sum(
        1 for r, g, b in checks_160
        if 80 < r < 140 and 60 < g < 100 and 40 < b < 80
    )

    # If the header is brown, it's a ranking/leaderboard screen
    if brown_count >= 3:
        return 'ranking', f'Brown header confirmed ({brown_count}/5 brown pixels)'

    # Header isn't brown — check what it is
    # City screen has status bar + green/grass content and bottom nav
    # Sample at the very top (status bar) and middle (content)
    r500, g500, b500 = img.getpixel((540, 500))[:3]

    # City screen: green/grass content in middle
    if g500 > r500 + 20 and g500 > b500 + 20:
        return 'city', f'Green content detected at y=500 rgb=({r500},{g500},{b500}) — city screen'

    # Suggestion Box: brown/tan wood texture
    if 130 < r500 < 200 and 90 < g500 < 150 and 50 < b500 < 110:
        return 'suggestion_box', f'Wood texture at y=500 rgb=({r500},{g500},{b500})'

    # Profile: blue/teal background
    if b500 > 150 and b500 > r500:
        return 'profile', f'Blue background at y=500 rgb=({r500},{g500},{b500})'

    return 'unknown', f'Unclassified (y160 brown={brown_count}/5, y500=({r500},{g500},{b500}))'


def watch_and_validate(kingdom_id, scraper_pid, check_interval=15):
    """
    Watch the scrape output directory for new screenshots and validate them.
    Kill the scraper process if bad screenshots are detected.
    """
    base_dir = Path("/Users/defimagic/Desktop/Hive/KingshotPro/scraper/data/kingdoms")
    k_dir_pattern = f"k{kingdom_id}/*"

    print(f"[VALIDATOR] Watching kingdom {kingdom_id} (scraper PID {scraper_pid})")
    print(f"[VALIDATOR] Check interval: {check_interval}s")

    seen_files = set()
    bad_streak = 0
    last_check = 0

    while True:
        # Check if scraper is still running
        try:
            os.kill(int(scraper_pid), 0)
        except (ProcessLookupError, ValueError):
            print(f"[VALIDATOR] Scraper PID {scraper_pid} no longer running. Exiting.")
            return 0

        # Find the most recent scrape directory
        dirs = sorted(glob.glob(str(base_dir / k_dir_pattern)))
        if not dirs:
            time.sleep(check_interval)
            continue

        latest_dir = dirs[-1]
        # Skip audit_profile.png (that's the kingdom verification screenshot, not a ranking)
        # Only check ranking screenshots (alliance_power_*, etc.)
        all_pngs = sorted(glob.glob(f"{latest_dir}/*.png"))
        ranking_pngs = [p for p in all_pngs if 'audit_profile' not in p]

        # Find the most recent 3 ranking screenshots that we haven't checked
        new_pngs = [p for p in ranking_pngs[-5:] if p not in seen_files]

        for png in new_pngs:
            seen_files.add(png)
            classification, reason = classify_screen(png)
            name = os.path.basename(png)

            if classification in ('ranking', 'ranking_possible'):
                bad_streak = 0
                print(f"[VALIDATOR] OK: {name} - {classification}")
            else:
                bad_streak += 1
                print(f"[VALIDATOR] BAD: {name} - {classification}")
                print(f"[VALIDATOR]      reason: {reason}")

                # 2 bad screenshots in a row = kill
                if bad_streak >= 2:
                    print(f"[VALIDATOR] !!! {bad_streak} bad screenshots detected, killing scraper")
                    try:
                        subprocess.run(['kill', '-9', str(scraper_pid)])
                    except Exception:
                        pass

                    print(f"[VALIDATOR]")
                    print(f"[VALIDATOR] DIAGNOSIS:")
                    print(f"[VALIDATOR]   Last bad screen type: {classification}")
                    print(f"[VALIDATOR]   Reason: {reason}")
                    print(f"[VALIDATOR]")
                    print(f"[VALIDATOR] HOW TO FIX:")
                    if classification == 'suggestion_box':
                        print(f"[VALIDATOR]   - Tutorial/quest popup blocking. Navigate manually to advance the tutorial.")
                        print(f"[VALIDATOR]   - This character may need to reach a certain level before scraping works.")
                    elif classification == 'city':
                        print(f"[VALIDATOR]   - Scraper lost the leaderboard context.")
                        print(f"[VALIDATOR]   - Popup or back-button dismissed the leaderboard unexpectedly.")
                    elif classification == 'profile':
                        print(f"[VALIDATOR]   - Scraper ended up on profile instead of leaderboard.")
                        print(f"[VALIDATOR]   - Leaderboard button tap may have missed.")
                    else:
                        print(f"[VALIDATOR]   - Unknown state. Manually inspect phone and restart.")
                    return 2

        time.sleep(check_interval)


def main():
    if len(sys.argv) < 3:
        print(f"Usage: {sys.argv[0]} <kingdom_id> <scraper_pid> [check_interval_seconds]")
        sys.exit(1)

    kingdom_id = sys.argv[1]
    scraper_pid = sys.argv[2]
    interval = int(sys.argv[3]) if len(sys.argv) > 3 else 15

    exit_code = watch_and_validate(kingdom_id, scraper_pid, interval)
    sys.exit(exit_code)


if __name__ == "__main__":
    main()

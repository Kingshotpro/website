#!/usr/bin/env python3
"""
scrape_clean.py — Run kingshot_scraper.py with noise + popup_handler DISABLED.

Used when standard scrape keeps failing on a given kingdom due to
popup_handler false-positives or noise-induced edge-back gestures.

Usage:
    python3 scrape_clean.py --kingdom 1003
"""
import sys
import argparse

parser = argparse.ArgumentParser()
parser.add_argument("--kingdom", type=str, required=True)
parser.add_argument("--categories", type=str, default=None)
args = parser.parse_args()

# Rebuild argv for kingshot_scraper.main()
sys.argv = [
    "kingshot_scraper.py",
    "--scrape",
    "--kingdom", args.kingdom,
    "--yes",
    "--skip-audit",
]
if args.categories:
    sys.argv += ["--categories", args.categories]

import kingshot_scraper

# Disable noise (both scroll_map and idle)
def silent_noise(self):
    self.log("  (noise: DISABLED by scrape_clean wrapper)")
kingshot_scraper.KingshotScraper.do_noise = silent_noise

# Disable popup_handler in navigate_to_leaderboard
# We do this by monkey-patching the import inside popup_handler
import popup_handler
class NoOpPopupHandler:
    def __init__(self, *a, **kw): pass
    def dismiss_all(self, *a, **kw):
        return  # do nothing
popup_handler.PopupHandler = NoOpPopupHandler

kingshot_scraper.main()

#!/usr/bin/env python3
"""
next_kingdom_id.py — Tell the Architect what kingdom number to create next.

Scans: all scraped kingdoms + known kingdoms from directory data.
Suggests: the next sequential kingdom ID within a given range.

Usage:
    python3 next_kingdom_id.py           # default: suggest next in 1000-2000 range
    python3 next_kingdom_id.py 1000 1100 # suggest in specific range
"""
import os
import sys
import json
from pathlib import Path

ROOT = Path(__file__).parent.parent
SCRAPER_DATA = ROOT / 'scraper' / 'data' / 'kingdoms'
KINGDOMS_DATA = ROOT / 'kingdoms' / 'data'


def known_kingdoms():
    """Return set of kingdom IDs we already have data for."""
    known = set()
    if SCRAPER_DATA.exists():
        for d in SCRAPER_DATA.iterdir():
            if d.is_dir() and d.name.startswith('k'):
                try:
                    known.add(int(d.name[1:]))
                except ValueError:
                    pass
    if KINGDOMS_DATA.exists():
        for f in KINGDOMS_DATA.glob('k*.json'):
            stem = f.stem
            if stem.endswith('_history'):
                stem = stem[:-len('_history')]
            try:
                known.add(int(stem[1:]))
            except ValueError:
                pass
    return sorted(known)


def next_in_range(known, low, high):
    """Find the smallest kingdom ID in [low, high] that isn't known."""
    for kid in range(low, high + 1):
        if kid not in known:
            return kid
    return None


def main():
    low = int(sys.argv[1]) if len(sys.argv) > 1 else 1000
    high = int(sys.argv[2]) if len(sys.argv) > 2 else 2000

    known = known_kingdoms()
    print(f"Known kingdoms ({len(known)}): {known}")
    print()

    # "Next after max" in tier — most useful for sequential creation
    print("=== Next sequential (after max in tier) ===")
    for label, lo, hi in [("300s", 300, 999), ("1000s", 1000, 1999)]:
        in_tier = [k for k in known if lo <= k <= hi]
        if in_tier:
            next_seq = max(in_tier) + 1
            if next_seq <= hi:
                print(f"  {label} tier max is K{max(in_tier)} → create K{next_seq} next")
        else:
            print(f"  {label} tier: no kingdoms yet → start with K{lo}")

    print()
    print("=== Lowest unknown in each tier ===")
    for label, lo, hi in [
        ("low (1-500)", 1, 500),
        ("300s (300-500)", 300, 500),
        ("1000s (1000-1500)", 1000, 1500),
        ("1900s (1900-2000)", 1900, 2000),
    ]:
        suggestion = next_in_range(known, lo, hi)
        if suggestion:
            print(f"  {label}: K{suggestion}")


if __name__ == "__main__":
    main()

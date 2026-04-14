#!/usr/bin/env python3
"""
build_directory.py — Generate kingdom directory data from extracted CSVs.

This is the ONLY way data enters the kingdom directory.
Never hand-edit the KINGDOMS array in index.html.

Usage:
  cd KingshotPro
  python3 kingdoms/build_directory.py

Reads:  scraper/data/kingdoms/k{id}/{timestamp}/alliance_power_extracted.csv
Writes: kingdoms/directory_data.json (consumed by index.html)

If a CSV doesn't exist or has no data, the field shows "?" on the site.
"""
import csv, json, os, glob
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).parent.parent
SCRAPER_DATA = ROOT / 'scraper' / 'data' / 'kingdoms'
OUTPUT = ROOT / 'kingdoms' / 'directory_data.json'

def get_latest_run(kingdom_dir):
    """Find the most recent scrape run that has alliance_power_extracted.csv."""
    runs = sorted([d for d in kingdom_dir.iterdir() if d.is_dir()], reverse=True)
    # Prefer runs that have extracted alliance power data
    for run in runs:
        if (run / 'alliance_power_extracted.csv').exists():
            return run
    # Fallback to latest run even without extracted data
    return runs[0] if runs else None

def read_alliance_power(run_dir):
    """Read alliance power CSV and compute top + total."""
    csv_path = run_dir / 'alliance_power_extracted.csv'
    if not csv_path.exists():
        return None, None, None

    top = 0
    total = 0
    count = 0
    top_name = ''
    top_tag = ''

    with open(csv_path) as f:
        for row in csv.DictReader(f):
            try:
                v = int(row.get('value', 0))
            except (ValueError, TypeError):
                continue
            if v > 0:
                total += v
                count += 1
                if v > top:
                    top = v
                    raw_name = row.get('name', '')
                    # Parse [TAG]Name format
                    if raw_name.startswith('['):
                        bracket_end = raw_name.find(']')
                        if bracket_end > 0:
                            top_tag = raw_name[1:bracket_end]
                            top_name = raw_name[bracket_end+1:].strip()
                        else:
                            top_name = raw_name
                            top_tag = ''
                    else:
                        top_name = raw_name
                        top_tag = row.get('tag', '')

    if count == 0:
        return None, None, None

    return {
        'topPower': top,
        'totalPower': total,
        'alliances': count,
        'topAlliance': top_name,
        'topTag': top_tag,
    }, None, None

def get_run_timestamp(run_dir):
    """Extract timestamp from directory name."""
    name = run_dir.name  # e.g., 2026-04-13_184352
    try:
        dt = datetime.strptime(name, '%Y-%m-%d_%H%M%S')
        return dt.strftime('%Y-%m-%d')
    except ValueError:
        return 'unknown'

def build():
    kingdoms = []

    if not SCRAPER_DATA.exists():
        print(f"ERROR: {SCRAPER_DATA} does not exist")
        return

    for kingdom_dir in sorted(SCRAPER_DATA.iterdir()):
        if not kingdom_dir.is_dir():
            continue
        name = kingdom_dir.name  # e.g., k223
        if not name.startswith('k'):
            continue

        kid = name[1:]  # "223"
        try:
            kid_int = int(kid)
        except ValueError:
            continue

        latest_run = get_latest_run(kingdom_dir)
        if not latest_run:
            print(f"  K{kid}: no runs found, skipping")
            continue

        data, _, _ = read_alliance_power(latest_run)
        updated = get_run_timestamp(latest_run)

        # Count categories scraped
        metadata_path = latest_run / 'metadata.json'
        categories = 0
        if metadata_path.exists():
            with open(metadata_path) as f:
                try:
                    meta = json.load(f)
                    categories = len(meta.get('categories_scraped', []))
                except json.JSONDecodeError:
                    pass

        if data:
            entry = {
                'id': kid_int,
                'topAlliance': data['topAlliance'],
                'topTag': data['topTag'],
                'topPower': data['topPower'],
                'totalPower': data['totalPower'],
                'alliances': data['alliances'],
                'categories': categories,
                'updated': updated,
                'source': f'scraper/data/kingdoms/k{kid}/{latest_run.name}/alliance_power_extracted.csv',
            }
            kingdoms.append(entry)
            print(f"  K{kid}: top={data['topPower']:,} total={data['totalPower']:,} alliances={data['alliances']} updated={updated}")
        else:
            # No alliance power data — still list the kingdom but with unknowns
            entry = {
                'id': kid_int,
                'topAlliance': '?',
                'topTag': '',
                'topPower': None,
                'totalPower': None,
                'alliances': None,
                'categories': categories,
                'updated': updated,
                'source': str(latest_run),
            }
            kingdoms.append(entry)
            print(f"  K{kid}: no alliance power data (will show '?' on site)")

    # Sort by total power descending (kingdoms with data first)
    kingdoms.sort(key=lambda k: -(k['totalPower'] or 0))

    # Add rank
    for i, k in enumerate(kingdoms):
        k['rank'] = i + 1

    output = {
        'generated': datetime.now().isoformat(),
        'generator': 'kingdoms/build_directory.py',
        'kingdom_count': len(kingdoms),
        'kingdoms': kingdoms,
    }

    with open(OUTPUT, 'w') as f:
        json.dump(output, f, indent=2)

    print(f"\nWrote {OUTPUT} — {len(kingdoms)} kingdoms")
    print(f"Generated: {output['generated']}")

if __name__ == '__main__':
    build()

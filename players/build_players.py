#!/usr/bin/env python3
"""
build_players.py — Generate top-players directory from extracted CSVs.

This is the ONLY way data enters the players directory.
Never hand-edit players_data.json.

Usage:
  cd KingshotPro
  python3 players/build_players.py

Reads:  scraper/data/kingdoms/k{id}/{latest_timestamp}/{category}_extracted.csv
Writes: players/players_data.json

Categories covered:
  - personal_power       (rank by individual player power)
  - kill_count           (rank by total kills)
  - hero_power           (rank by strongest hero on account)
  - heros_total_power    (rank by sum of all 5 heroes)
  - total_pet_power      (rank by combined pet power)
  - town_center_level    (rank by Town Center level)
  - mystic_trial         (rank by Mystic Trial stage)
  - rebel_conquest_stage (rank by Rebel Conquest stage)
"""
import csv, json, re
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).parent.parent
SCRAPER_DATA = ROOT / 'scraper' / 'data' / 'kingdoms'
OUTPUT = ROOT / 'players' / 'players_data.json'

CATEGORIES = [
    'personal_power',
    'kill_count',
    'hero_power',
    'heros_total_power',
    'total_pet_power',
    'town_center_level',
    'mystic_trial',
    'rebel_conquest_stage',
]

# Sanity bounds — used to reject OCR garbage (scraper sometimes misaligns rows
# and reads a power number into a "stage" field). These cap realistic values.
# Source: Kingshot game mechanics as of 2026-04.
#   - Town Center: 1-30 + 4 sub-stages + TG1-TG10  → max ~44, cap 50
#   - Rebel Conquest: stages top out in low tens across servers → cap 50
#   - Mystic Trial: can reach thousands of stages → cap 10000
SANITY_MAX = {
    'town_center_level': 50,
    'rebel_conquest_stage': 50,
    'mystic_trial': 10000,
}

# How many top entries per kingdom to keep. 60 covers full top server rankings we scraped.
PER_KINGDOM_LIMIT = 60
# How many global entries to keep per category.
GLOBAL_LIMIT = 500


def get_latest_run_for_category(kingdom_dir, category):
    """Find the most recent scrape run that has this category's CSV."""
    runs = sorted([d for d in kingdom_dir.iterdir() if d.is_dir()], reverse=True)
    for run in runs:
        if (run / f'{category}_extracted.csv').exists():
            return run
    return None


def parse_player_name(raw):
    """Parse [TAG]Name — strip leading artifacts from OCR like '(' or 'I'."""
    if not raw:
        return '', ''
    s = raw.strip()
    # Strip common OCR garbage prefixes: (, I, [, repeated [[
    while s and s[0] in '(I':
        s = s[1:]
    # Repeated [[ -> [
    s = re.sub(r'^\[\[+', '[', s)
    if s.startswith('['):
        end = s.find(']')
        if end > 0:
            return s[1:end].strip(), s[end+1:].strip()
    return '', s


def read_category(run_dir, kingdom_id, category):
    """Read a category CSV and return list of {rank, name, tag, value, kingdom}."""
    csv_path = run_dir / f'{category}_extracted.csv'
    if not csv_path.exists():
        return []

    entries = []
    with open(csv_path) as f:
        for row in csv.DictReader(f):
            try:
                rank = int(row.get('rank', 0))
                value = int(row.get('value', 0))
            except (ValueError, TypeError):
                continue
            if value <= 0 or not row.get('name'):
                continue
            if rank > PER_KINGDOM_LIMIT:
                continue
            # Sanity cap — rejects OCR artifacts where scraper reads the wrong column.
            cap = SANITY_MAX.get(category)
            if cap is not None and value > cap:
                continue
            tag, name = parse_player_name(row.get('name', ''))
            if not name:
                continue
            entries.append({
                'rank_in_kingdom': rank,
                'name': name,
                'tag': tag,
                'value': value,
                'kingdom': kingdom_id,
            })
    return entries


def build():
    # category -> list of player entries across all kingdoms
    by_category = {c: [] for c in CATEGORIES}
    kingdoms_covered = set()
    updated_per_kingdom = {}

    if not SCRAPER_DATA.exists():
        print(f"ERROR: {SCRAPER_DATA} does not exist")
        return

    for kingdom_dir in sorted(SCRAPER_DATA.iterdir()):
        if not kingdom_dir.is_dir() or not kingdom_dir.name.startswith('k'):
            continue
        kid = kingdom_dir.name[1:]
        try:
            kid_int = int(kid)
        except ValueError:
            continue

        for cat in CATEGORIES:
            run = get_latest_run_for_category(kingdom_dir, cat)
            if not run:
                continue
            entries = read_category(run, kid_int, cat)
            if entries:
                by_category[cat].extend(entries)
                kingdoms_covered.add(kid_int)
                try:
                    dt = datetime.strptime(run.name, '%Y-%m-%d_%H%M%S')
                    updated_per_kingdom[kid_int] = dt.strftime('%Y-%m-%d')
                except ValueError:
                    pass
                print(f"  K{kid} {cat}: {len(entries)} entries")

    # Sort each category globally by value, keep top GLOBAL_LIMIT
    result_categories = {}
    for cat, entries in by_category.items():
        entries.sort(key=lambda e: -e['value'])
        top = entries[:GLOBAL_LIMIT]
        # Assign global rank
        for i, e in enumerate(top):
            e['global_rank'] = i + 1
        result_categories[cat] = top
        print(f"  [{cat}] global top {len(top)}")

    output = {
        'generated': datetime.now().isoformat(),
        'generator': 'players/build_players.py',
        'kingdoms_covered': sorted(kingdoms_covered),
        'updated_per_kingdom': updated_per_kingdom,
        'per_kingdom_limit': PER_KINGDOM_LIMIT,
        'global_limit': GLOBAL_LIMIT,
        'categories': result_categories,
    }

    with open(OUTPUT, 'w') as f:
        json.dump(output, f, indent=2)

    total = sum(len(v) for v in result_categories.values())
    print(f"\nWrote {OUTPUT}")
    print(f"Kingdoms covered: {len(kingdoms_covered)}")
    print(f"Total entries across categories: {total}")


if __name__ == '__main__':
    build()

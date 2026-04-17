#!/usr/bin/env python3
"""
build_history.py — Aggregate all timestamped scrapes per kingdom into
a history JSON for timeline charting.

Output structure (kingdoms/data/k{id}_history.json):
{
  "kingdom": 223,
  "snapshots": [
    {
      "timestamp": "2026-04-13_184352",
      "categories": {
        "alliance_power": [{"rank":1,"tag":"PSY","name":"ThePsychWard","value":21916701378}, ...],
        ...
      }
    },
    ...
  ]
}

Each snapshot is one scrape. Snapshots ordered chronologically.
"""
import json
import os
import re
import sys
from pathlib import Path

ROOT = Path(__file__).parent.parent
SCRAPER_DATA = ROOT / 'scraper' / 'data' / 'kingdoms'
DATA_OUT = ROOT / 'kingdoms' / 'data'

RELIABLE = ['alliance_power', 'alliance_kills', 'personal_power', 'kill_count',
            'hero_power', 'heros_total_power', 'total_pet_power', 'mystic_trial']

KINGDOM_IDS = [1, 221, 222, 223, 224, 225, 226, 227, 228, 229, 230, 231, 232, 233,
               300, 301, 302, 303, 350, 1908, 1916, 1944, 1945]


def clean_tag_name(raw):
    """Same cleaner as regenerate_site.py — keep them in sync."""
    if not raw:
        return '', ''
    raw = raw.lstrip("'\"`,. \t\n")
    m = re.match(r'^[Il1|!]+(\[.*)$', raw)
    if m:
        raw = m.group(1)
    while raw.startswith('[['):
        raw = raw[1:]
    raw = raw.strip()
    if raw.startswith('"') and raw.count('"') >= 2:
        raw = raw.lstrip('"')

    m = re.match(r'^\[([A-Za-z0-9]{1,6})\]\s*(.+)$', raw)
    if m:
        return m.group(1), m.group(2).strip().rstrip(']').strip()
    m = re.match(r'^([A-Za-z0-9]{2,5})\]\s*([A-Za-z].*)$', raw)
    if m:
        return m.group(1), m.group(2).strip().rstrip(']').strip()
    m = re.match(r'^\[([A-Za-z0-9]{1,6})J([A-Z][a-zA-Z0-9].*)$', raw)
    if m:
        return m.group(1), m.group(2).strip()
    m = re.match(r'^\[([A-Za-z0-9]{1,5})j([A-Z][a-zA-Z0-9].*)$', raw)
    if m:
        return m.group(1), m.group(2).strip()
    m = re.match(r'^\[([A-Za-z0-9]{2,5})([A-Z][a-z].*)$', raw)
    if m:
        return m.group(1), m.group(2).strip()
    m = re.match(r'^\[([A-Za-z0-9]{2,5})(.*)$', raw)
    if m:
        return m.group(1), m.group(2).strip()
    return '', raw.strip().rstrip(']').strip()


def clean_entries(entries, max_entries=100):
    out = []
    for e in entries[:max_entries]:
        if not e['name'] and e['value'] == 0:
            continue
        tag, name = clean_tag_name(e['name'])
        name = name.replace(']', '').replace('[', '').replace('}', '').replace('{', '')
        name = name.strip(' \'"`!.,').strip()
        if not name and e['value'] == 0:
            continue
        out.append({'rank': e['rank'], 'tag': tag, 'name': name, 'value': e['value']})
    return out


def build_history_for_kingdom(kid):
    """Find all extracted scrapes, return ordered snapshot list."""
    base = SCRAPER_DATA / f'k{kid}'
    if not base.exists():
        return None

    # Find all timestamp dirs that have extracted_data.json
    snapshot_dirs = []
    for d in sorted(base.iterdir()):
        if d.is_dir() and (d / 'extracted_data.json').exists():
            snapshot_dirs.append(d)

    if not snapshot_dirs:
        return None

    snapshots = []
    for d in snapshot_dirs:
        try:
            src = json.load(open(d / 'extracted_data.json'))
        except Exception:
            continue
        snap = {
            'timestamp': d.name,  # e.g. "2026-04-16_175423"
            'date': d.name[:10],
            'categories': {}
        }
        for cat in RELIABLE:
            if cat in src:
                snap['categories'][cat] = clean_entries(src[cat])
        snapshots.append(snap)

    return {
        'kingdom': kid,
        'snapshot_count': len(snapshots),
        'first_snapshot': snapshots[0]['timestamp'] if snapshots else None,
        'last_snapshot': snapshots[-1]['timestamp'] if snapshots else None,
        'snapshots': snapshots,
    }


def main():
    DATA_OUT.mkdir(parents=True, exist_ok=True)
    summary = []
    for kid in KINGDOM_IDS:
        hist = build_history_for_kingdom(kid)
        if hist is None or not hist['snapshots']:
            print(f'  K{kid}: no data')
            continue
        out_file = DATA_OUT / f'k{kid}_history.json'
        with open(out_file, 'w') as f:
            json.dump(hist, f, separators=(',', ':'))
        size_kb = out_file.stat().st_size // 1024
        print(f'  K{kid}: {hist["snapshot_count"]} snapshots, {size_kb}KB')
        summary.append({
            'kingdom': kid,
            'snapshots': hist['snapshot_count'],
            'first': hist['first_snapshot'],
            'last': hist['last_snapshot'],
        })

    # Write summary index
    idx_file = DATA_OUT / 'history_index.json'
    with open(idx_file, 'w') as f:
        json.dump({'generated': str(__import__('datetime').datetime.now()),
                   'kingdoms': summary}, f, indent=2)
    print(f'\nWrote history index: {idx_file}')


if __name__ == '__main__':
    main()

#!/usr/bin/env python3
"""
Kingshot Screenshot OCR Extractor
Processes ranking screenshots into structured JSON/CSV.
Uses EasyOCR (runs locally, no API costs).

Usage:
    python3 extract_data.py /path/to/scrape/directory
    python3 extract_data.py /path/to/scrape/directory --category alliance_power
    python3 extract_data.py /path/to/scrape/directory --format csv
"""

import sys
import os
import re
import json
import csv
import argparse
from pathlib import Path
from datetime import datetime

import easyocr
from PIL import Image


# Initialize reader once (model loading is slow)
_reader = None

def get_reader():
    global _reader
    if _reader is None:
        print("Loading OCR model (first run downloads ~100MB)...")
        _reader = easyocr.Reader(['en'], gpu=False, verbose=False)
    return _reader


def fix_ocr_artifacts(text):
    """Fix systematic OCR errors from game font rendering."""
    # EasyOCR reads ] as J consistently in bracket tags
    # Pattern: [XXXJ should be [XXX]
    # Fix: any J that's followed by a capital letter or end-of-tag is likely ]
    text = re.sub(r'\[([A-Za-z0-9]+)J', r'[\1]', text)

    # Fix common misreads
    text = text.replace('|', 'l')  # pipe → lowercase L
    text = text.replace('0]', 'O]')  # zero in tag → letter O (contextual)

    return text


def classify_text(text, confidence):
    """Classify an OCR text region as rank, name, value, or skip."""
    clean = text.strip()

    # Skip headers and UI text
    skip_patterns = [
        r'^Ranking$', r'^Alliance$', r'^Power$', r'^Kills$',
        r'^Governor$', r'^Level$', r'^Stage$', r'^No Alliances',
        r'^Current Kingdom', r'^Neighboring', r'^All Kingdoms',
        r'^Leaderboard$', r'^Private$',
    ]
    for pat in skip_patterns:
        if re.match(pat, clean, re.IGNORECASE):
            return ('skip', clean)

    # Pure number with commas → power/kill value
    if re.match(r'^[\d,]+$', clean) and len(clean) > 3:
        value = int(clean.replace(',', ''))
        return ('value', value)

    # Small number (1-3 digits) → rank number
    if re.match(r'^\d{1,3}$', clean):
        return ('rank', int(clean))

    # Contains bracket patterns → name/tag
    if '[' in clean or ']' in clean or re.search(r'\[.*J', clean):
        fixed = fix_ocr_artifacts(clean)
        return ('name', fixed)

    # Anything else with letters → might be a name without brackets
    if len(clean) > 2 and re.search(r'[a-zA-Z]{2,}', clean):
        return ('name', clean)

    return ('unknown', clean)


def extract_from_screenshot(reader, img_path):
    """Extract ranking entries from a single screenshot."""
    results = reader.readtext(str(img_path))

    # Classify each text region, keeping x-position for rank filtering
    classified = []
    for bbox, text, conf in results:
        y_center = (bbox[0][1] + bbox[2][1]) / 2
        x_center = (bbox[0][0] + bbox[2][0]) / 2
        category, value = classify_text(text, conf)
        if category != 'skip' and category != 'unknown':
            # Filter: rank numbers must be on the left side (x < 200)
            # Stray numbers at x > 200 are badge decorations, not ranks
            if category == 'rank' and x_center > 200:
                continue
            classified.append({
                'type': category,
                'value': value,
                'y': y_center,
                'x': x_center,
                'confidence': conf,
            })

    # Group by rows (items within 80px vertically are same row)
    classified.sort(key=lambda x: x['y'])
    rows = []
    current_row = []
    last_y = -200

    for item in classified:
        if item['y'] - last_y > 80:
            if current_row:
                rows.append(current_row)
            current_row = [item]
        else:
            current_row.append(item)
        last_y = item['y']
    if current_row:
        rows.append(current_row)

    # Parse each row into a ranking entry
    entries = []
    for row in rows:
        rank = None
        name = None
        value = None

        for item in row:
            if item['type'] == 'rank':
                rank = item['value']
            elif item['type'] == 'name' and name is None:
                name = item['value']
            elif item['type'] == 'value':
                value = item['value']

        # Accept rows that have at least a name or value (rank can be inferred later)
        if name is not None or value is not None:
            entries.append({
                'rank': rank,
                'name': name or '',
                'value': value or 0,
            })

    return entries


def assign_ranks_by_value(entries):
    """
    Assign ranks based on power value sort order.
    OCR-read rank numbers are unreliable (trophy icons, partial reads).
    Power values are read very accurately — use them as the source of truth.
    """
    # Sanity filter: drop entries whose value is suspiciously small compared
    # to the category's top value. OCR sometimes reads 5,123,456,789 as
    # 5,123,456 (lost digits). If the category top is 20B and an entry is
    # below top/100000, it's almost certainly a misread.
    if entries:
        valid = [e for e in entries if e['value'] > 0]
        if valid:
            top = max(e['value'] for e in valid)
            # Drop entries below top/100_000 (covers 5 orders of magnitude)
            threshold = top / 100000
            entries = [e for e in entries if e['value'] >= threshold or e['value'] == 0]

    # Sort by value descending (highest power = rank 1)
    entries.sort(key=lambda x: x['value'], reverse=True)

    # Assign sequential ranks
    for i, entry in enumerate(entries):
        entry['rank'] = i + 1

    return entries


def extract_category(reader, scrape_dir, category_name):
    """Extract all data from a category's screenshots."""
    scrape_dir = Path(scrape_dir)
    screenshots = sorted(scrape_dir.glob(f"{category_name}_*.png"))

    if not screenshots:
        print(f"  No screenshots found for {category_name}")
        return []

    # Collect ALL readings across all screenshots (don't dedup yet).
    # We'll reconcile via consensus after — multiple readings of the same
    # row usually include at least one clean one, and majority vote wins.
    all_readings = []  # list of entries, may contain dupes

    for i, img_path in enumerate(screenshots):
        entries = extract_from_screenshot(reader, img_path)
        for entry in entries:
            all_readings.append(entry)
        sys.stdout.write(f"\r  {category_name}: processed {i+1}/{len(screenshots)} screenshots, {len(all_readings)} raw readings")
        sys.stdout.flush()

        # Write progress file so external monitoring can track status
        progress_path = scrape_dir / "extraction_progress.json"
        import json as _json
        with open(progress_path, 'w') as _pf:
            _json.dump({
                "current_category": category_name,
                "screenshot": f"{i+1}/{len(screenshots)}",
                "entries_so_far": len(all_entries),
                "timestamp": datetime.now().isoformat()
            }, _pf)

    print()

    # Reconcile duplicate readings via consensus (multi-frame averaging).
    reconciled = reconcile_readings(all_readings)

    # Sort by value descending, assign sequential ranks
    result = assign_ranks_by_value(reconciled)
    return result


def reconcile_readings(readings):
    """
    Multi-frame reconciliation: when scrolling through rankings, the same row
    often appears in 2+ consecutive screenshots. Group these and pick the best
    name via majority vote. Values are used as the grouping key because they're
    read very reliably (plain digits) while names suffer from OCR errors.

    Strategy:
    1. Group readings by value (exact match — values rarely misread)
    2. Within each group, pick the name that appears most often
    3. If tied, prefer longer names (more OCR info captured)
    4. Drop single-reading entries that are likely OCR noise (value==0, no name)
    """
    from collections import Counter

    # Group by value
    by_value = {}
    for r in readings:
        v = r.get('value', 0)
        if v == 0 and not r.get('name'):
            continue  # skip empty rows
        by_value.setdefault(v, []).append(r)

    reconciled = []
    for value, group in by_value.items():
        if len(group) == 1:
            reconciled.append(group[0])
            continue
        # Pick most common name. Empty names get 0 weight.
        name_counts = Counter(g['name'] for g in group if g.get('name'))
        if name_counts:
            best_name = name_counts.most_common(1)[0][0]
            # Tie-break: prefer the longest name among those tied for max count
            max_count = name_counts[best_name]
            tied = [n for n, c in name_counts.items() if c == max_count]
            if len(tied) > 1:
                best_name = max(tied, key=len)
        else:
            best_name = ''
        reconciled.append({
            'name': best_name,
            'value': value,
            'rank': None,
        })
    return reconciled


def extract_chat(reader, scrape_dir):
    """Extract world chat messages from screenshots."""
    scrape_dir = Path(scrape_dir)
    screenshots = sorted(scrape_dir.glob("worldchat_*.png"))

    if not screenshots:
        print("  No chat screenshots found")
        return []

    all_messages = []

    for i, img_path in enumerate(screenshots):
        results = reader.readtext(str(img_path))
        for bbox, text, conf in results:
            clean = text.strip()
            # Skip UI elements
            if clean in ('Chat', 'World', 'Alliance', 'Private', 'Send',
                         'Transfer - English', 'Join Now'):
                continue
            if len(clean) > 2 and conf > 0.3:
                y_center = (bbox[0][1] + bbox[2][1]) / 2
                all_messages.append({
                    'text': clean,
                    'y_position': y_center,
                    'confidence': conf,
                    'source_file': img_path.name,
                })
        sys.stdout.write(f"\r  worldchat: processed {i+1}/{len(screenshots)} screenshots")
        sys.stdout.flush()

    print()
    return all_messages


def main():
    parser = argparse.ArgumentParser(description="Extract ranking data from Kingshot screenshots")
    parser.add_argument("scrape_dir", help="Path to scrape output directory")
    parser.add_argument("--category", type=str, default=None,
                        help="Extract specific category only")
    parser.add_argument("--format", choices=["json", "csv", "both"], default="both",
                        help="Output format (default: both)")
    parser.add_argument("--include-chat", action="store_true", default=True,
                        help="Include world chat extraction")
    args = parser.parse_args()

    scrape_dir = Path(args.scrape_dir)
    if not scrape_dir.exists():
        print(f"ERROR: Directory not found: {scrape_dir}")
        sys.exit(1)

    reader = get_reader()

    # Discover categories from filenames
    if args.category:
        categories = [args.category]
    else:
        files = list(scrape_dir.glob("*.png"))
        categories = sorted(set(
            f.stem.rsplit('_', 1)[0] for f in files
            if not f.stem.startswith('worldchat')
        ))

    print(f"Extracting from: {scrape_dir}")
    print(f"Categories: {categories}")
    print()

    all_data = {}

    for cat in categories:
        entries = extract_category(reader, scrape_dir, cat)
        all_data[cat] = entries
        print(f"  → {len(entries)} entries extracted")

    # World chat
    if args.include_chat:
        chat = extract_chat(reader, scrape_dir)
        all_data['worldchat'] = chat
        print(f"  → {len(chat)} chat messages extracted")

    # Output
    output_dir = scrape_dir
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

    if args.format in ("json", "both"):
        json_path = output_dir / f"extracted_data.json"
        with open(json_path, "w") as f:
            json.dump(all_data, f, indent=2)
        print(f"\nJSON: {json_path}")

    if args.format in ("csv", "both"):
        for cat, entries in all_data.items():
            if cat == 'worldchat':
                continue
            csv_path = output_dir / f"{cat}_extracted.csv"
            with open(csv_path, "w", newline="") as f:
                w = csv.writer(f)
                w.writerow(["rank", "name", "value"])
                for entry in entries:
                    w.writerow([entry['rank'], entry['name'], entry['value']])
            print(f"CSV: {csv_path}")

    # Summary
    print(f"\n=== EXTRACTION COMPLETE ===")
    for cat, entries in all_data.items():
        if cat != 'worldchat':
            print(f"  {cat}: {len(entries)} entries")
    if 'worldchat' in all_data:
        print(f"  worldchat: {len(all_data['worldchat'])} messages")


if __name__ == "__main__":
    main()

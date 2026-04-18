#!/usr/bin/env python3
"""
Regenerate all kingdom JSON files and HTML pages from latest extracted data.
Includes improved tag/name parser that handles common OCR artifacts.
"""
import json, os, re, sys

KINGDOMS_DIR = '/Users/defimagic/Desktop/Hive/KingshotPro/kingdoms'
SCRAPER_DATA = '/Users/defimagic/Desktop/Hive/KingshotPro/scraper/data/kingdoms'

RELIABLE = ['alliance_power', 'alliance_kills', 'personal_power', 'kill_count',
            'hero_power', 'heros_total_power', 'total_pet_power', 'mystic_trial']

KINGDOM_IDS = [1, 221, 222, 223, 224, 225, 226, 227, 228, 229, 230, 231, 232, 233, 300, 301, 302, 303, 350, 1000, 1001, 1002, 1003, 1004, 1005, 1006, 1007, 1008, 1908, 1916, 1944, 1945]


def clean_tag_name(raw):
    """
    Parse '[TAG]Name' out of OCR text, handling common artifacts:
    - Leading quotes/apostrophes stripped: "'[iDM]sky" → "[iDM]sky"
    - ] read as j or J: "[IMOjabcd" → tag=IMO, name=abcd
    - Missing close bracket: "[kjjlGelmir" → try best-guess split
    Returns (tag, name).
    """
    if not raw:
        return '', ''

    # Strip leading junk (quotes, apostrophes, whitespace, stray punctuation, stray brackets)
    raw = raw.lstrip("'\"`,. \t\n")
    # Strip leading OCR noise chars before an opening bracket: "I[EVL]Name" -> "[EVL]Name"
    m = re.match(r'^[Il1|!]+(\[.*)$', raw)
    if m:
        raw = m.group(1)
    # Collapse doubled leading brackets: "[[TiT]Name" -> "[TiT]Name"
    while raw.startswith('[['):
        raw = raw[1:]
    raw = raw.strip()
    # Strip wrapping quotes
    if raw.startswith('"') and raw.count('"') >= 2:
        raw = raw.lstrip('"')

    # Standard pattern: [TAG]Name
    m = re.match(r'^\[([A-Za-z0-9]{1,6})\]\s*(.+)$', raw)
    if m:
        tag = m.group(1)
        name = m.group(2).strip().rstrip(']').strip()
        return tag, name

    # Pattern: TAG]Name (missing open bracket, OCR dropped it)
    m = re.match(r'^([A-Za-z0-9]{2,5})\]\s*([A-Za-z].*)$', raw)
    if m:
        return m.group(1), m.group(2).strip().rstrip(']').strip()

    # OCR artifact: ] read as J (uppercase)
    m = re.match(r'^\[([A-Za-z0-9]{1,6})J([A-Z][a-zA-Z0-9].*)$', raw)
    if m:
        return m.group(1), m.group(2).strip()

    # OCR artifact: ] read as j (lowercase) — only if followed by a word boundary
    m = re.match(r'^\[([A-Za-z0-9]{1,5})j([A-Z][a-zA-Z0-9].*)$', raw)
    if m:
        return m.group(1), m.group(2).strip()

    # Missing close bracket entirely: [TAGName — guess where tag ends
    # Heuristic: tag is 2-5 chars, then a capital letter starts the name
    m = re.match(r'^\[([A-Za-z0-9]{2,5})([A-Z][a-z].*)$', raw)
    if m:
        return m.group(1), m.group(2).strip()

    # Has opening bracket but no close — take first 3 chars as tag guess
    m = re.match(r'^\[([A-Za-z0-9]{2,5})(.*)$', raw)
    if m:
        tag = m.group(1)
        rest = m.group(2).strip()
        if rest:
            return tag, rest

    # No brackets at all — just a name. Strip any stray trailing ']'.
    return '', raw.strip().rstrip(']').strip()


def clean_category(entries, max_entries=100):
    result = []
    for e in entries[:max_entries]:
        if not e['name'] and e['value'] == 0:
            continue
        tag, name = clean_tag_name(e['name'])
        # Final scrub: remove stray bracket/brace chars and wrapping quotes/noise
        name = name.replace(']', '').replace('[', '').replace('}', '').replace('{', '')
        name = name.strip(' \'"`!.,').strip()
        # Skip entries that cleaned to nothing
        if not name and e['value'] == 0:
            continue
        result.append({'rank': e['rank'], 'tag': tag, 'name': name, 'value': e['value']})
    return result


def consolidate_tags(output):
    """
    Fix OCR-garbled tags by consolidating rare variants into common ones.

    Pattern: when OCR drops the ']' bracket, '[TNP]SHIN' becomes '[TNPISHIN'
    which my parser splits as tag='TNPIS', name='HIN'. The real tag is 'TNP'.

    Algorithm:
    1. Count tag frequency across ALL categories in this kingdom
    2. For any rare tag (≤2 occurrences), check if a common tag (≥5) is its prefix
    3. If yes: tag becomes common one, the suffix prepends to the name

    This catches the most common OCR failure mode.
    """
    # Count tags across all categories
    tag_counts = {}
    for cat_entries in output['categories'].values():
        for e in cat_entries:
            tag = e.get('tag', '')
            if tag:
                tag_counts[tag] = tag_counts.get(tag, 0) + 1

    # For every tag, find the SHORTEST prefix that dominates it (≥3x occurrences).
    # If TNP appears 184 times and TNPIS appears 4 times, TNP dominates TNPIS.
    # Build a per-tag "best ancestor" by walking up to the shortest dominant prefix.
    def find_dominant(tag):
        """Walk down to the shortest prefix ≥3 chars that dominates this tag."""
        best = tag
        cur = tag
        while len(cur) > 3:
            for plen in range(len(cur) - 1, 2, -1):
                prefix = cur[:plen]
                pcount = tag_counts.get(prefix, 0)
                if pcount >= max(5, tag_counts.get(cur, 0) * 3):
                    best = prefix
                    cur = prefix
                    break
            else:
                break
        return best

    fixes = {}  # candidate_tag -> (dominant_tag, suffix_to_prepend_to_name)
    for candidate in tag_counts:
        if len(candidate) <= 2:
            continue
        dominant = find_dominant(candidate)
        if dominant != candidate:
            suffix = candidate[len(dominant):]
            fixes[candidate] = (dominant, suffix)

    if not fixes:
        return output

    # Apply fixes
    fixed_count = 0
    for cat_entries in output['categories'].values():
        for e in cat_entries:
            if e['tag'] in fixes:
                new_tag, suffix = fixes[e['tag']]
                e['name'] = suffix + e['name']
                e['tag'] = new_tag
                fixed_count += 1

    if fixed_count:
        print(f'    consolidated {fixed_count} OCR-garbled tags: {dict(list(fixes.items())[:5])}{"..." if len(fixes) > 5 else ""}')
    return output


def build_json_for_kingdom(kid):
    base = f'{SCRAPER_DATA}/k{kid}'
    if not os.path.exists(base):
        return None

    dirs = sorted([d for d in os.listdir(base) if os.path.isdir(f'{base}/{d}')])
    if not dirs:
        return None

    # Find latest run that has extracted_data.json
    latest = None
    for d in reversed(dirs):
        if os.path.exists(f'{base}/{d}/extracted_data.json'):
            latest = d
            break
    if latest is None:
        return None

    extract_path = f'{base}/{latest}/extracted_data.json'
    src = json.load(open(extract_path))

    # Derive date from directory name (format: 2026-04-16_031830)
    last_updated = latest[:10]  # "2026-04-16"

    output = {
        'kingdom': kid,
        'last_updated': last_updated,
        'source': 'ADB screenshot scraper + EasyOCR extraction',
        'categories': {}
    }
    for cat in RELIABLE:
        if cat in src:
            output['categories'][cat] = clean_category(src[cat])
    # Post-process: fix OCR-garbled tags by consolidating rare variants
    output = consolidate_tags(output)
    return output


def build_history_for_embed(kid, max_snapshots=30, max_entries_per_cat=50):
    """
    Build trimmed history for embedding in HTML page.
    Keeps only most recent N snapshots and top M entries per category.
    """
    history_path = f'{KINGDOMS_DIR}/data/k{kid}_history.json'
    if not os.path.exists(history_path):
        return None
    hist = json.load(open(history_path))
    snaps = hist.get('snapshots', [])
    if not snaps:
        return None
    # Keep most recent N
    snaps = snaps[-max_snapshots:]
    # Trim entries per category
    trimmed_snaps = []
    for snap in snaps:
        new_cats = {}
        for cat, entries in snap.get('categories', {}).items():
            new_cats[cat] = entries[:max_entries_per_cat]
        trimmed_snaps.append({
            'timestamp': snap['timestamp'],
            'categories': new_cats,
        })
    return {
        'kingdom': kid,
        'snapshot_count': len(trimmed_snaps),
        'snapshots': trimmed_snaps,
    }


def write_all_jsons():
    os.makedirs(f'{KINGDOMS_DIR}/data', exist_ok=True)
    for kid in KINGDOM_IDS:
        data = build_json_for_kingdom(kid)
        if data is None:
            print(f'  K{kid}: no data')
            continue
        with open(f'{KINGDOMS_DIR}/data/k{kid}.json', 'w') as f:
            json.dump(data, f, indent=2)
        print(f'  K{kid}: {sum(len(v) for v in data["categories"].values())} entries')


def write_all_pages():
    """Regenerate pages for all kingdoms except K223 (the template source)."""
    with open(f'{KINGDOMS_DIR}/223/index.html') as f:
        template = f.read()

    # Update K223 template with new clean JSON first
    k223 = build_json_for_kingdom(223)
    pattern = re.compile(r'var KINGDOM_DATA = \{.*?\};', re.DOTALL)
    history_pattern = re.compile(r'var KINGDOM_HISTORY = \{.*?\};', re.DOTALL)
    m = pattern.search(template)
    new_data_js = 'var KINGDOM_DATA = ' + json.dumps(k223, separators=(',', ':')) + ';'
    # Append KINGDOM_HISTORY right after KINGDOM_DATA
    k223_hist = build_history_for_embed(223)
    if k223_hist:
        new_data_js += '\nvar KINGDOM_HISTORY = ' + json.dumps(k223_hist, separators=(',', ':')) + ';'
    # Remove any existing KINGDOM_HISTORY first
    template = history_pattern.sub('', template)
    m = pattern.search(template)
    template = template[:m.start()] + new_data_js + template[m.end():]
    with open(f'{KINGDOMS_DIR}/223/index.html', 'w') as f:
        f.write(template)
    print(f'  K223 updated (template) — history: {k223_hist["snapshot_count"] if k223_hist else 0} snapshots')

    # Generate all others from the updated template
    for kid in KINGDOM_IDS:
        if kid == 223:
            continue
        json_path = f'{KINGDOMS_DIR}/data/k{kid}.json'
        if not os.path.exists(json_path):
            print(f'  K{kid} skipped (no JSON yet)')
            continue
        html = template
        d_new = json.load(open(json_path))

        html = html.replace('Kingdom 223', f'Kingdom {kid}')
        html = html.replace('kingdom 223', f'kingdom {kid}')
        html = html.replace('#223', f'#{kid}')
        html = html.replace('kingdoms/223', f'kingdoms/{kid}')

        # Strip any pre-existing KINGDOM_HISTORY then replace KINGDOM_DATA + append history
        html = history_pattern.sub('', html)
        m = pattern.search(html)
        new_data_js = 'var KINGDOM_DATA = ' + json.dumps(d_new, separators=(',', ':')) + ';'
        khist = build_history_for_embed(kid)
        if khist:
            new_data_js += '\nvar KINGDOM_HISTORY = ' + json.dumps(khist, separators=(',', ':')) + ';'
        html = html[:m.start()] + new_data_js + html[m.end():]

        os.makedirs(f'{KINGDOMS_DIR}/{kid}', exist_ok=True)
        with open(f'{KINGDOMS_DIR}/{kid}/index.html', 'w') as f:
            f.write(html)
        print(f'  K{kid} regenerated')


if __name__ == '__main__':
    print('=== Writing JSON files ===')
    write_all_jsons()
    print()
    print('=== Writing HTML pages ===')
    write_all_pages()
    print()
    print('Done.')

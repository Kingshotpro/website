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

KINGDOM_IDS = [1, 221, 222, 223, 227, 228, 229, 230, 231, 232, 233, 300, 1908, 1916]


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


def build_json_for_kingdom(kid):
    base = f'{SCRAPER_DATA}/k{kid}'
    if not os.path.exists(base):
        return None

    dirs = sorted([d for d in os.listdir(base) if os.path.isdir(f'{base}/{d}')])
    if not dirs:
        return None

    # For K300 skip the partial run
    if kid == 300:
        latest = '2026-04-13_172822'
    else:
        latest = dirs[-1]

    extract_path = f'{base}/{latest}/extracted_data.json'
    if not os.path.exists(extract_path):
        return None

    src = json.load(open(extract_path))

    output = {
        'kingdom': kid,
        'last_updated': '2026-04-13' if kid in (223, 300) else '2026-04-14',
        'source': 'ADB screenshot scraper + EasyOCR extraction',
        'categories': {}
    }
    for cat in RELIABLE:
        if cat in src:
            output['categories'][cat] = clean_category(src[cat])
    return output


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
    m = pattern.search(template)
    new_data_js = 'var KINGDOM_DATA = ' + json.dumps(k223, separators=(',', ':')) + ';'
    template = template[:m.start()] + new_data_js + template[m.end():]
    with open(f'{KINGDOMS_DIR}/223/index.html', 'w') as f:
        f.write(template)
    print(f'  K223 updated (template)')

    # Generate all others from the updated template
    for kid in KINGDOM_IDS:
        if kid == 223:
            continue
        html = template
        d_new = json.load(open(f'{KINGDOMS_DIR}/data/k{kid}.json'))

        html = html.replace('Kingdom 223', f'Kingdom {kid}')
        html = html.replace('kingdom 223', f'kingdom {kid}')
        html = html.replace('#223', f'#{kid}')
        html = html.replace('kingdoms/223', f'kingdoms/{kid}')

        # Replace embedded data
        m = pattern.search(html)
        new_data_js = 'var KINGDOM_DATA = ' + json.dumps(d_new, separators=(',', ':')) + ';'
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

#!/usr/bin/env python3
"""
extract_worldchat.py — OCR world-chat screenshots into structured text logs.

World chat screenshots get converted once into text transcripts and then
never served as images. The viewer renders text only. This is cheaper to
store, searchable, moderation-friendlier, and way smaller than raw PNGs.

Usage:
  cd KingshotPro
  python3 worldchat/extract_worldchat.py             # all kingdoms
  python3 worldchat/extract_worldchat.py 232 233     # specific ids

Reads:  scraper/data/kingdoms/k{id}/{timestamp}/worldchat_NNN.png
Writes:
  worldchat/cache/k{id}/{timestamp}/chat_NNN.ocr.json  (per-image OCR cache)
  worldchat/k{id}.json                                  (per-kingdom chat log)
  worldchat/manifest.json                               (global index)

Idempotent: OCR is cached per image. Re-running only processes new images.

OCR engine: EasyOCR English. Non-Latin messages (Chinese, Korean, Cyrillic)
will not extract cleanly — documented in the viewer disclaimer.
"""
import json, re, sys, time
from datetime import datetime
from pathlib import Path

ROOT          = Path(__file__).parent.parent
SCRAPER_DATA  = ROOT / 'scraper' / 'data' / 'kingdoms'
OUT_ROOT      = ROOT / 'worldchat'
CACHE_ROOT    = OUT_ROOT / 'cache'
MANIFEST_PATH = OUT_ROOT / 'manifest.json'

WORLDCHAT_PATTERN = re.compile(r'^worldchat_(\d+)\.png$')
TIMESTAMP_PATTERN = re.compile(r'^(\d{4}-\d{2}-\d{2})_(\d{6})$')

# OCR-pattern heuristics — used to classify each line after extraction.
SPEAKER_RE   = re.compile(r'\[([A-Za-z0-9]{2,5})\]\s*(.{1,32})', re.UNICODE)
VIP_RE       = re.compile(r'\bVIP\s*(\d{1,2})', re.IGNORECASE)
TIMESTAMP_RE = re.compile(r'^\s*(\d{1,2})[:\.,](\d{2})(?:[:\.](\d{2}))?\s*$')

# UI chrome that shows up in every screenshot — we strip it from transcripts.
UI_NOISE = {
    'chat', 'world', 'private', 'transfer - english', 'transfer-english',
    'privata', 'englih', 'tap', 'to enter', 'tap to enter', 'send',
    '[world]', 'world]',
}

# Substrings that flag an entire row as the in-game tab header
# ("World Private Transfer-" style). If ALL tokens in a row match
# the tab-header word set, the row is dropped.
TAB_HEADER_TOKENS = {
    'world', 'private', 'privata', 'transfer', 'transfer-', '-', 'english',
    'englih', 'chat',
}


def is_tab_header_row(text):
    """True if this row is entirely made up of the chat-tab UI words."""
    tokens = [t.lower().strip('_.,:;!?') for t in text.split() if t.strip()]
    if not tokens:
        return False
    return all(tok in TAB_HEADER_TOKENS for tok in tokens)


def fix_ocr_bracket_artifact(text):
    """EasyOCR reads '[TAG]Name' as '[TAGJName'. Repair."""
    # [ABCJText -> [ABC]Text
    return re.sub(r'\[([A-Za-z0-9]{2,5})J', r'[\1]', text)


def clean_row_text(text):
    """Repair known OCR artifacts before classification."""
    return fix_ocr_bracket_artifact(text).strip()


# ── Singleton OCR reader (heavy — load once) ──────────────────────
_reader = None
def get_reader():
    global _reader
    if _reader is None:
        import easyocr
        # English-only. CJK support exists but adds ~1 GB of models and
        # slows inference 3-5x. Worth revisiting if chat volume in CJK
        # kingdoms becomes a product priority.
        _reader = easyocr.Reader(['en'], gpu=False, verbose=False)
    return _reader


# ── OCR with per-image cache ─────────────────────────────────────
def ocr_image_cached(png_path, cache_path):
    """Return list of {text, conf, y, x, w, h}. Cached per image."""
    if cache_path.exists() and cache_path.stat().st_mtime >= png_path.stat().st_mtime:
        try:
            with open(cache_path) as f:
                return json.load(f)
        except (json.JSONDecodeError, OSError):
            pass

    reader = get_reader()
    raw = reader.readtext(str(png_path))
    boxes = []
    for bbox, text, conf in raw:
        # bbox is a 4-point polygon: [[x1,y1], [x2,y1], [x2,y2], [x1,y2]]
        ys = [p[1] for p in bbox]
        xs = [p[0] for p in bbox]
        boxes.append({
            'text': text,
            'conf': round(float(conf), 3),
            'y':    int(sum(ys) / 4),
            'x':    int(sum(xs) / 4),
            'h':    int(max(ys) - min(ys)),
            'w':    int(max(xs) - min(xs)),
        })

    cache_path.parent.mkdir(parents=True, exist_ok=True)
    with open(cache_path, 'w') as f:
        json.dump(boxes, f, indent=1)
    return boxes


# ── Classify + cluster OCR boxes into messages ───────────────────
def classify_line(box):
    """Tag a single OCR row with what we think it is."""
    text = clean_row_text(box['text'])
    low  = text.lower()
    kind = {'text': text, 'raw': box['text'], 'conf': box['conf'], 'y': box['y']}

    # UI chrome to suppress
    if low in UI_NOISE or low.startswith('[world]') or is_tab_header_row(text):
        kind['type'] = 'ui'
        return kind

    # Timestamp like "13:36"
    m = TIMESTAMP_RE.match(text)
    if m:
        kind['type'] = 'timestamp'
        kind['time'] = f"{int(m.group(1)):02d}:{m.group(2)}"
        return kind

    # Speaker line — contains [TAG] + name. Also pick up VIP level when present.
    sm = SPEAKER_RE.search(text)
    if sm:
        kind['type'] = 'speaker'
        kind['alliance'] = sm.group(1).upper()
        # Clean the name: strip common OCR artifacts and leading separators
        name = sm.group(2).strip(' _·-=*>').strip()
        # Remove trailing " x NAME" patterns (OCR reads decorative unicode as "x <garbled>")
        name = re.sub(r'\s*[x×]\s+.*$', '', name)
        kind['speaker'] = name or '(unknown)'
        vip = VIP_RE.search(text)
        if vip:
            kind['vip'] = int(vip.group(1))
        return kind

    # Plain VIP-only line (avatar has VIP label above the name)
    vip = VIP_RE.match(text)
    if vip and len(text) < 10:
        kind['type'] = 'vip'
        kind['vip']  = int(vip.group(1))
        return kind

    kind['type'] = 'line'
    return kind


ROW_CLUSTER_PX     = 22   # boxes within this y-distance are the same visual line
SPEAKER_GAP_PX     = 55   # y gap that signals a new message (name line starts)


def cluster_into_rows(boxes):
    """Group OCR boxes into horizontal rows, then merge text within each row.

    OCR splits "VIP8 [CRB] KIM" into 3+ boxes on the same y-baseline. Before
    trying to classify speakers vs bodies, we glue those back together so
    one logical screen-row = one logical entry.
    """
    if not boxes:
        return []
    # Sort by y, then x
    sorted_boxes = sorted(boxes, key=lambda b: (b['y'], b['x']))
    rows = []
    current = []
    for box in sorted_boxes:
        if current and abs(box['y'] - current[-1]['y']) <= ROW_CLUSTER_PX:
            current.append(box)
        else:
            if current:
                rows.append(current)
            current = [box]
    if current:
        rows.append(current)

    merged = []
    for row in rows:
        row.sort(key=lambda b: b['x'])
        text = ' '.join(b['text'] for b in row).strip()
        # Collapse repeated whitespace
        text = re.sub(r'\s+', ' ', text)
        merged.append({
            'text':   text,
            'conf':   round(sum(b['conf'] for b in row) / len(row), 3),
            'y':      row[0]['y'],
            'x':      min(b['x'] for b in row),
            'x_max':  max(b['x'] + b['w'] / 2 for b in row),
            'parts':  len(row),
        })
    return merged


def build_messages(boxes):
    """Turn flat OCR boxes into an ordered list of messages.

    1. Cluster boxes into visual rows (same y-baseline).
    2. Classify each row: ui / timestamp / speaker / body.
    3. A speaker row opens a new message. Subsequent body rows attach.
    4. Preserve timestamps between messages as time markers.
    """
    rows = cluster_into_rows(boxes)
    if not rows:
        return []

    messages = []
    current  = None
    last_y   = None

    for row in rows:
        cls = classify_line(row)

        if cls['type'] == 'ui':
            continue

        if cls['type'] == 'timestamp':
            if current:
                messages.append(current); current = None
            messages.append({'kind': 'time', 'time': cls['time']})
            last_y = row['y']
            continue

        if cls['type'] == 'speaker':
            if current:
                messages.append(current)
            current = {
                'kind':     'message',
                'alliance': cls.get('alliance'),
                'speaker':  cls.get('speaker'),
                'vip':      cls.get('vip'),
                'lines':    [],
                'y':        row['y'],
            }
            last_y = row['y']
            continue

        # VIP-only row with no tag/name — stash it onto the NEXT speaker
        # we see by remembering it (rare, usually the tag is on same row)
        if cls['type'] == 'vip':
            if current and current.get('vip') is None:
                current['vip'] = cls['vip']
            last_y = row['y']
            continue

        # Body row — attach to current message
        if current is None:
            current = {'kind': 'message', 'speaker': None, 'alliance': None, 'vip': None, 'lines': [], 'y': row['y']}
        if cls['text'] and cls['conf'] >= 0.30:
            current['lines'].append(cls['text'])
        last_y = row['y']

    if current:
        messages.append(current)

    # A speaker row with no extracted body = a sticker or image-only message.
    # Annotate so the viewer can render it as "(sticker)" instead of a blank.
    for m in messages:
        if m['kind'] == 'message' and m.get('speaker') and not m['lines']:
            m['lines'] = ['(sticker/image)']

    # Strip trivially empty entries (orphan body with no speaker + no text)
    return [
        m for m in messages
        if m['kind'] == 'time' or m.get('speaker') or m.get('lines')
    ]


# ── Driver ──────────────────────────────────────────────────────
def process_snapshot(run_dir, kid):
    """OCR every worldchat_NNN.png in a run. Return snapshot dict."""
    chat_pngs = sorted(
        run_dir.glob('worldchat_*.png'),
        key=lambda p: int(WORLDCHAT_PATTERN.match(p.name).group(1))
    )
    if not chat_pngs:
        return None

    images = []
    for png in chat_pngs:
        idx       = int(WORLDCHAT_PATTERN.match(png.name).group(1))
        cache_dir = CACHE_ROOT / f'k{kid}' / run_dir.name
        cache_fp  = cache_dir / f'chat_{idx:03d}.ocr.json'

        t0    = time.time()
        boxes = ocr_image_cached(png, cache_fp)
        dt    = time.time() - t0
        messages = build_messages(boxes)
        print(f"    chat_{idx:03d}: {len(boxes)} boxes → {len(messages)} units ({dt:.1f}s)")

        images.append({
            'image_index': idx,
            'box_count':   len(boxes),
            'messages':    messages,
        })

    try:
        dt_obj = datetime.strptime(run_dir.name, '%Y-%m-%d_%H%M%S')
        captured     = dt_obj.strftime('%Y-%m-%d %H:%M UTC')
        captured_iso = dt_obj.isoformat()
    except ValueError:
        captured     = run_dir.name
        captured_iso = run_dir.name

    return {
        'snapshot_id':  run_dir.name,
        'captured':     captured,
        'captured_iso': captured_iso,
        'image_count':  len(chat_pngs),
        'images':       images,
    }


def main(kingdom_filter=None):
    if not SCRAPER_DATA.exists():
        print(f"ERROR: {SCRAPER_DATA} does not exist", file=sys.stderr)
        sys.exit(1)

    manifest_kingdoms = []
    total_messages = 0
    total_images   = 0

    for kingdom_dir in sorted(SCRAPER_DATA.iterdir()):
        if not kingdom_dir.is_dir() or not kingdom_dir.name.startswith('k'):
            continue
        try:
            kid = int(kingdom_dir.name[1:])
        except ValueError:
            continue
        if kingdom_filter and kid not in kingdom_filter:
            continue

        print(f"\n── K{kid} ──")
        snapshots = []
        for run_dir in sorted(kingdom_dir.iterdir(), reverse=True):
            if not run_dir.is_dir():
                continue
            if not TIMESTAMP_PATTERN.match(run_dir.name):
                continue
            print(f"  {run_dir.name}")
            snap = process_snapshot(run_dir, kid)
            if snap:
                snapshots.append(snap)

        if not snapshots:
            continue

        snapshots.sort(key=lambda s: s['captured_iso'], reverse=True)
        msgs_in_kingdom = sum(
            sum(1 for img in s['images'] for m in img['messages'] if m['kind'] == 'message')
            for s in snapshots
        )
        imgs_in_kingdom = sum(s['image_count'] for s in snapshots)

        per_k_path = OUT_ROOT / f'k{kid}.json'
        with open(per_k_path, 'w') as f:
            json.dump({
                'kingdom':        kid,
                'snapshot_count': len(snapshots),
                'image_count':    imgs_in_kingdom,
                'message_count':  msgs_in_kingdom,
                'snapshots':      snapshots,
            }, f, indent=2, ensure_ascii=False)

        manifest_kingdoms.append({
            'kingdom':        kid,
            'snapshot_count': len(snapshots),
            'image_count':    imgs_in_kingdom,
            'message_count':  msgs_in_kingdom,
            'latest':         snapshots[0]['captured'],
            'oldest':         snapshots[-1]['captured'],
        })
        total_messages += msgs_in_kingdom
        total_images   += imgs_in_kingdom

    # Preserve existing manifest entries for kingdoms we didn't re-process.
    if kingdom_filter and MANIFEST_PATH.exists():
        try:
            with open(MANIFEST_PATH) as f:
                existing = json.load(f)
            processed_ids = {k['kingdom'] for k in manifest_kingdoms}
            for k in existing.get('kingdoms', []):
                if k['kingdom'] not in processed_ids:
                    manifest_kingdoms.append(k)
        except (json.JSONDecodeError, OSError):
            pass

    manifest_kingdoms.sort(key=lambda k: k['kingdom'])
    manifest = {
        'generated':      datetime.now().isoformat(),
        'generator':      'worldchat/extract_worldchat.py',
        'kingdom_count':  len(manifest_kingdoms),
        'total_images':   sum(k['image_count'] for k in manifest_kingdoms),
        'total_messages': sum(k['message_count'] for k in manifest_kingdoms),
        'kingdoms':       manifest_kingdoms,
    }
    with open(MANIFEST_PATH, 'w') as f:
        json.dump(manifest, f, indent=2)

    print("\n─ extraction summary ─────────────────────────")
    print(f"Kingdoms:       {manifest['kingdom_count']}")
    print(f"Images:         {manifest['total_images']}")
    print(f"Messages:       {manifest['total_messages']}")
    print(f"Wrote manifest: {MANIFEST_PATH}")


if __name__ == '__main__':
    ids = None
    if len(sys.argv) > 1:
        ids = {int(x) for x in sys.argv[1:]}
    main(kingdom_filter=ids)

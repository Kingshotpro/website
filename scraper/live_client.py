#!/usr/bin/env python3
"""
Kingshots Live Data Client
Connects to port 30101 and extracts kingdom ranking + chat data.

Usage:
  python3 live_client.py --kingdom 1908
  python3 live_client.py --kingdom 1908 --dry-run
  python3 live_client.py --kingdom 1908 --since
  python3 live_client.py --kingdom 223   # cross-kingdom test
"""
import socket, struct, json, argparse, csv, time, select, re
from datetime import datetime
from pathlib import Path

SERVER   = "got-formal-gateway-ga.chosenonegames.com"
PORT     = 30101
TIMEOUT  = 15
DATA_DIR = Path(__file__).parent / "data"

# Bytes extracted verbatim from pcap — do not modify
# Kingdom 223 auth sequence (296 bytes). Token at offset 24.
# Token: m9gOxfM3HSIVXq9adcrjwbSeKVsVdARrA3srLKjsL6RM7clQ
AUTH_SEQUENCE = (
    b"\x00\xd6\x55\x02\x04\x04\x11\x10\x01\x14\x02\x04\x04\x01\x51\x01"
    b"\x04\x03\xc4\x32\x31\x4a\xff\x05\x6d\x39\x67\x4f\x78\x66\x4d\x33"
    b"\x48\x53\x49\x56\x58\x71\x39\x61\x64\x63\x72\x6a\x77\x62\x53\x65"
    b"\x4b\x56\x73\x56\x64\x41\x52\x72\x41\x33\x73\x72\x4c\x4b\x6a\x73"
    b"\x4c\x36\x52\x4d\x37\x63\x6c\x51\xf1\x09\x37\x30\x38\x35\x3f\x38"
    b"\x30\x35\x38\x35\x05\x7e\x31\x2e\x39\x2e\x35\x04\x7c\x5a\x7d\x64"
    b"\x04\x19\xfc\x47\x6f\x6f\x67\x6c\x65\xff\x01\x20\x73\x64\x6b\x5f"
    b"\x67\x70\x68\x6f\x6e\x65\x36\x34\x5f\x61\x72\x8f\x6d\x36\x34\x07"
    b"\x61\x7f\x6e\x64\x72\x6f\x69\x64\x02\x1c\x55\x53\x20\xff\x03\x66"
    b"\x34\x63\x34\x63\x36\x64\x65\x34\x38\x30\x34\x30\x38\x62\x63\x33"
    b"\x66\x64\x35\x36\x39\x61\x30\x32\x32\x38\x32\x63\x35\x39\x62\x71"
    b"\x02\x65\x6e\x20\xfc\x34\x30\x66\x65\x37\x38\xff\x02\x64\x34\x35"
    b"\x30\x64\x31\x34\x65\x66\x64\x39\x36\x64\x65\x32\x65\x34\x39\x39"
    b"\x39\x36\x36\x62\x35\x03\x63\x61\x00\x04\x15\x02\x2c\x06\x00\x11"
    b"\x5d\x02\x2a\x1c\x08\x01\x44\x12\x0e\x54\x03\x04\x01\xc4\x02\x65"
    b"\x6e\x00\x2e\x5d\x02\x3c\x1c\x0a\x01\x44\x2d\x01\x8c\x32\x19\x47"
    b"\xff\x02\x6f\x6f\x67\x6c\x65\x20\x73\x64\x6b\x5f\x67\x70\x68\x6f"
    b"\x6e\x65\x36\x34\x5f\x61\x72\x6d\x36\x34\x71\x02\x31\x33\x01\x04"
    b"\x33\x00\x05\x1d\x02\x12\x42\x0c"
)
RANKING_REQUEST = (
    b"\x00\xab\x5d\x02\x04\x19\x0e\x01\x4c\x54\x01\x10\x14\x02\x04\x51"
    b"\x06\x02\x01\x45\x02\x10\x02\x11\x06\x06\x55\x02\x01\x02\x10\x14"
    b"\x02\x08\x51\x06\x02\x01\x45\x02\x10\x02\x11\x0a\x06\x55\x02\x01"
    b"\x02\x10\x14\x02\x0c\x51\x06\x02\x01\x45\x02\x10\x02\x11\x0e\x06"
    b"\x55\x02\x01\x02\x10\x14\x02\x10\x51\x06\x02\x01\x45\x02\x10\x02"
    b"\x11\x12\x06\x55\x02\x01\x02\x10\x14\x02\x22\x51\x06\x02\x01\x45"
    b"\x02\x10\x02\x11\x26\x06\x55\x02\x01\x02\x10\x14\x02\x2a\x51\x06"
    b"\x02\x01\x45\x02\x10\x02\x11\x2c\x06\x55\x02\x01\x02\x10\x14\x02"
    b"\x2e\x51\x06\x02\x01\x45\x02\x10\x02\x11\x30\x06\x55\x02\x01\x02"
    b"\x10\x14\x02\x32\x51\x06\x02\x01\x45\x02\x10\x02\x11\x34\x06\x55"
    b"\x02\x01\x02\x10\x14\x02\x36\x51\x06\x02\x01\x01\x02"
)
NAMES_REQUEST = (
    b"\x00\x39\x7d\x02\x28\x28\x3c\x01\x01\xc4\x2d\x04\x22\xff\x04\x1c"
    b"\x6d\x0b\x64\x1c\x6d\x0b\x58\x1c\x6d\x0b\x23\x1c\x6d\x0b\x3a\x1c"
    b"\x6d\x0b\x42\x1c\x6d\x0b\x21\x1c\x6d\x0b\x29\x1c\x6d\x0b\x32\x1c"
    b"\x6d\x0b\x27\x1c\x6d\x0b\x51\x07\x1c\x6d\x0b"
)
PLAYER_REQUEST = b"\x00\x12\x79\x02\x08\x18\x01\x01\xc4\x09\x04\xb8\x7f\x34\x64\x04"
CHAT_REQUEST = b""
KINGDOM_ID_OFFSET = None

def find_markers_v2(data):
    positions = []
    i = 0
    while i < len(data) - 3:
        if data[i] == 0x1c:
            if i+2 < len(data) and data[i+1] == 0x6d and data[i+2] == 0x0b:
                positions.append((i, 3, 'B'))
                i += 3; continue
            if i+3 < len(data) and data[i+2] == 0x6d and data[i+3] == 0x0b:
                positions.append((i, 4, 'A'))
                i += 4; continue
            if i+3 < len(data) and data[i+1] == 0x6d and data[i+3] == 0x0b:
                positions.append((i, 4, 'C'))
                i += 4; continue
        i += 1
    return positions

def recv_until(sock, length, timeout=TIMEOUT):
    """Read exactly `length` bytes from socket with timeout."""
    sock.settimeout(timeout)
    data = bytearray()
    while len(data) < length:
        chunk = sock.recv(length - len(data))
        if not chunk: raise ConnectionError("Socket closed")
        data.extend(chunk)
    return bytes(data)

def recv_raw(sock, initial_timeout=8.0, drain_timeout=1.5):
    """Read all available bytes from socket.
    Waits up to initial_timeout for first byte, then drains
    until drain_timeout of silence. Returns raw stream bytes
    matching the pcap format exactly."""
    data = bytearray()
    sock.settimeout(initial_timeout)
    try:
        chunk = sock.recv(65536)
        if chunk:
            data.extend(chunk)
    except socket.timeout:
        return bytes(data)
    # Drain remaining
    sock.settimeout(drain_timeout)
    while True:
        try:
            chunk = sock.recv(65536)
            if not chunk:
                break
            data.extend(chunk)
        except socket.timeout:
            break
    return bytes(data)

def recv_all(sock, timeout=2.0):
    """Drain socket — kept for auth handshake use."""
    sock.settimeout(timeout)
    data = bytearray()
    while True:
        try:
            chunk = sock.recv(65536)
            if not chunk: break
            data.extend(chunk)
        except socket.timeout:
            break
    return bytes(data)

def connect_and_auth():
    """Open TCP socket and complete auth handshake."""
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.connect((SERVER, PORT))
    
    offset = 0
    while offset < len(AUTH_SEQUENCE):
        length = struct.unpack('>H', AUTH_SEQUENCE[offset:offset+2])[0]
        pkt = AUTH_SEQUENCE[offset:offset+2+length]
        sock.sendall(pkt)
        offset += 2 + length
        
    recv_all(sock, timeout=2.0)
    return sock

def build_ranking_request(kingdom_id):
    """Return ranking request bytes with kingdom ID patched in."""
    if KINGDOM_ID_OFFSET is None:
        return RANKING_REQUEST
    req = bytearray(RANKING_REQUEST)
    struct.pack_into('<H', req, KINGDOM_ID_OFFSET, kingdom_id)
    return bytes(req)

def request_alliance_rankings(sock, kingdom_id):
    """Send ranking request, return raw response bytes."""
    req = build_ranking_request(kingdom_id)
    sock.sendall(req)
    sock.sendall(b"\x00\x08\x5d\x02\x06\x19\x94\x01\x01\x04")
    data = recv_raw(sock)
    print(f"  Ranking response: {len(data)} bytes")
    if data:
        print(f"  First 16 bytes: {data[:16].hex()}")
    return data

def construct_names_request(alliance_ids, seq_counter):
    """Build K223 batch names request packet.
    alliance_ids: list of bytes objects (2 bytes each)
    seq_counter: integer sequence counter
    """
    seq_hi = (seq_counter >> 8) & 0xFF
    seq_lo = seq_counter & 0xFF
    header = bytes([0x5d, 0x02, 0x28, 0x28]) + bytes([seq_hi, seq_lo]) + b'\xc4\x2d\x04\x51\xff\x04\x01'
    ids_section = b''.join(b'\x62\x01' + aid for aid in alliance_ids) + b'\x62\x01'
    length = len(header) + len(ids_section)
    return length.to_bytes(2, 'big') + header + ids_section

def request_alliance_names(sock, alliance_ids):
    """Send K223 batch names request for given alliance IDs (list of bytes)."""
    req = construct_names_request(alliance_ids, seq_counter=0x9601)
    sock.sendall(req)
    return recv_raw(sock, initial_timeout=12.0)

def construct_single_name_request(alliance_id, seq_counter):
    """Build K223 individual alliance name query packet.
    Format: 00 0e 5d 02 28 28 [seq_hi] [seq_lo] c4 05 04 [id_lo] 07 [id_hi] 62 01
    Note: 07 separator between id_lo and id_hi (different from batch format).
    alliance_id: 2 bytes (little-endian ID)
    """
    seq_hi = (seq_counter >> 8) & 0xFF
    seq_lo = seq_counter & 0xFF
    id_lo = alliance_id[0]
    id_hi = alliance_id[1]
    body = bytes([0x5d, 0x02, 0x28, 0x28, seq_hi, seq_lo, 0xc4, 0x05, 0x04,
                  id_lo, 0x07, id_hi, 0x62, 0x01])
    return len(body).to_bytes(2, 'big') + body

def request_individual_names(sock, unnamed_ids, start_seq=0x9602):
    """Query individual alliance names for IDs not returned by batch request.
    Protocol is synchronous — must wait for response before sending next request.
    Uses a generous 15s per-query timeout since server can be slow.
    Collects all response bytes, parses together at the end.
    """
    seq = start_seq
    all_data = bytearray()
    for alliance_id in unnamed_ids:
        req = construct_single_name_request(alliance_id, seq_counter=seq)
        sock.sendall(req)
        data = recv_raw(sock, initial_timeout=15.0, drain_timeout=1.5)
        id_hex = alliance_id.hex()
        print(f"  Individual [{id_hex}]: {len(data)} bytes (seq=0x{seq:04x})")
        if data:
            all_data.extend(data)
            print(f"    hex: {data.hex()}")
        seq += 1
    print(f"  Individual total: {len(all_data)} bytes across {len(unnamed_ids)} queries")
    if not all_data:
        return {}
    return parse_names(bytes(all_data), expected_ids=unnamed_ids)

def request_player_rankings(sock, kingdom_id):
    """Send player ranking request if available."""
    if not PLAYER_REQUEST: return b""
    sock.sendall(PLAYER_REQUEST)
    return recv_all(sock)

def request_world_chat(sock):
    """Send chat request if available, return raw response."""
    if not CHAT_REQUEST: return b""
    sock.sendall(CHAT_REQUEST)
    return recv_all(sock)

def parse_rankings(data):
    """Parse K223 alliance power ranking response.
    Finds each d3 69 terminator, extracts 4-byte LE power before it,
    then locates the 2-byte alliance ID before the next [c7?] 62 01.
    """
    results = []
    seen_d369 = set()
    i = 0
    while i < len(data) - 1:
        if data[i] == 0xd3 and data[i+1] == 0x69 and i >= 4 and i not in seen_d369:
            power = struct.unpack('<I', data[i-4:i])[0]
            if 50_000_000 <= power <= 15_000_000_000:
                for j in range(i+2, min(i+32, len(data)-3)):
                    if data[j+2] == 0x62 and data[j+3] == 0x01:
                        seen_d369.add(i)
                        results.append({'alliance_id': data[j:j+2], 'power': power})
                        break
                    elif j+4 < len(data) and data[j+2] == 0xc7 and data[j+3] == 0x62 and data[j+4] == 0x01:
                        seen_d369.add(i)
                        results.append({'alliance_id': data[j:j+2], 'power': power})
                        break
        i += 1

    results.sort(key=lambda x: x['power'], reverse=True)
    for rank, r in enumerate(results, 1):
        r['rank'] = rank
        r['id_hex'] = r['alliance_id'].hex()
    return results

def is_ascii_alnum(b):
    return (0x30 <= b <= 0x39) or (0x41 <= b <= 0x5a) or (0x61 <= b <= 0x7a)

# Bytes that appear as noise within/before alliance IDs in K223 names response
_NAMES_NOISE = frozenset([0xff, 0xfc, 0xfe, 0xf8, 0xf1, 0xc7, 0x7f, 0x8f, 0x1f, 0x00])

def _extract_id_before(data, mpos, id_set):
    """Return 2-byte alliance ID from bytes immediately before position mpos.
    Tries direct 2-byte read first (handles 8f-01 style IDs where 8f IS the ID),
    then noise-skipping backward scan (handles d9-[8f]-02 style).
    """
    if mpos >= 2:
        direct = bytes(data[mpos-2:mpos])
        if id_set is None or direct in id_set:
            return direct
    pos = mpos - 1
    found = []
    while pos >= max(0, mpos - 8) and len(found) < 2:
        b = data[pos]
        if b not in _NAMES_NOISE:
            found.insert(0, b)
        pos -= 1
    if len(found) == 2:
        candidate = bytes(found)
        if id_set is None or candidate in id_set:
            return candidate
    return None

def parse_names(data, expected_ids=None):
    """Parse K223 batch alliance names response.
    Structure: ... [2-byte-id] [noise?] 62 01 [ctrl] [name_bytes] 03 [noise?] [tag_bytes] ...
    Alliance IDs come BEFORE each 62 01 marker; name/tag data comes AFTER.
    Name/tag separator is 0x03. Noise bytes stripped by isalnum filter.
    """
    id_set = set(expected_ids) if expected_ids else None
    names = {}
    markers = []
    for i in range(len(data) - 1):
        if data[i] == 0x62 and data[i+1] == 0x01:
            markers.append(i)

    for idx, mpos in enumerate(markers):
        alliance_id = _extract_id_before(data, mpos, id_set)
        if alliance_id is None:
            continue
        id_hex = alliance_id.hex()
        if id_hex in names:
            continue

        sec_start = mpos + 2
        sec_end = markers[idx+1] if idx + 1 < len(markers) else min(sec_start + 120, len(data))
        section = data[sec_start:sec_end]

        sep = section.find(b'\x03')
        name_raw = section[:sep] if sep >= 0 else section[:60]
        tag_raw  = section[sep+1:sep+20] if sep >= 0 else b''

        name = ''.join(chr(b) for b in name_raw if b < 128 and chr(b).isalnum())[:30]
        # Stop tag at first control/high byte after tag has started
        tag = ''
        for b in tag_raw:
            if b < 128 and chr(b).isalnum():
                tag += chr(b)
                if len(tag) >= 6: break
            elif tag and (b < 32 or b > 126):
                break

        if len(name) >= 2:
            names[id_hex] = {'name': name, 'tag': tag}

    return names

def parse_players(data):
    """Parse player ranking response."""
    players = []
    markers = find_markers_v2(data)
    for i, (mpos, mlen, mtype) in enumerate(markers):
        end_pos = markers[i+1][0] if i+1 < len(markers) else len(data)
        sec = data[mpos+mlen : end_pos]
        
        strings = []
        cur = bytearray()
        for b in sec:
            if 0x20 <= b <= 0x7e:
                cur.append(b)
            else:
                if len(cur) >= 3:
                    strings.append(cur.decode('ascii', errors='ignore'))
                cur = bytearray()
        if len(cur) >= 3:
            strings.append(cur.decode('ascii', errors='ignore'))
            
        if not strings: continue
        name = strings[0]
        
        power = 0
        for j in range(len(sec)-4):
            v = struct.unpack('<I', sec[j:j+4])[0]
            if 1_000_000 < v < 1_000_000_000:
                power = v
                break
                
        id1 = data[mpos-1] if mpos >= 1 else 0
        id2 = data[mpos-2] if mpos >= 2 else 0
        id_byte = id1 if id1 != 0x8f else id2
        
        players.append({
            'name': name,
            'power': power,
            'alliance_id_hex': f'0x{id_byte:02x}'
        })
        
    deduped = {}
    for p in players:
        if p['name'] not in deduped or p['power'] > deduped[p['name']]['power']:
            deduped[p['name']] = p
            
    sorted_players = sorted(deduped.values(), key=lambda x: x['power'], reverse=True)
    for i, p in enumerate(sorted_players):
        p['rank'] = i + 1
        
    return sorted_players

def parse_chat(data):
    """Parse world chat response."""
    return []

def load_known_names():
    """Load existing id→name map from k1908_alliances_raw.csv"""
    known = {}
    csv_path = Path("/tmp/k1908_alliances_raw.csv")
    if csv_path.exists():
        with open(csv_path, 'r') as f:
            reader = csv.DictReader(f)
            for row in reader:
                if row['known_name'] and row['known_name'] not in ('Unknown', 'not in capture'):
                    known[row['id_hex']] = {
                        'name': row['known_name'],
                        'tag': row['known_tag']
                    }
    return known

def write_snapshot(kingdom_id, alliances, players, chat, ts):
    """Write full JSON snapshot. Never overwrites."""
    snap_dir = DATA_DIR / "snapshots"
    snap_dir.mkdir(parents=True, exist_ok=True)
    fname = snap_dir / f"k{kingdom_id}_{ts.strftime('%Y%m%d_%H%M%S')}.json"
    with open(fname, 'w') as f:
        json.dump({
            "kingdom": kingdom_id,
            "timestamp": ts.isoformat(),
            "alliances": alliances,
            "players": players,
            "chat": chat
        }, f, indent=2)
    print(f"Snapshot: {fname}")

def append_alliance_history(kingdom_id, alliances, ts):
    """Append to alliance history CSV. Creates with headers if new."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    path = DATA_DIR / f"k{kingdom_id}_alliance_history.csv"
    is_new = not path.exists()
    with open(path, 'a', newline='') as f:
        w = csv.writer(f)
        if is_new:
            w.writerow(['timestamp','rank','id_hex','name','tag','power'])
        for a in alliances:
            w.writerow([ts.isoformat(), a['rank'], a['id_hex'],
                        a.get('name',''), a.get('tag',''), a['power']])

def append_player_history(kingdom_id, players, ts):
    """Append to player history CSV."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    path = DATA_DIR / f"k{kingdom_id}_player_history.csv"
    is_new = not path.exists()
    with open(path, 'a', newline='') as f:
        w = csv.writer(f)
        if is_new:
            w.writerow(['timestamp','rank','name','power',
                        'alliance_id_hex','alliance_name'])
        for p in players:
            w.writerow([ts.isoformat(), p['rank'], p['name'],
                        p['power'], p['alliance_id_hex'],
                        p.get('alliance_name','')])

def append_chat_history(kingdom_id, chat, ts):
    """Append to chat history CSV."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    path = DATA_DIR / f"k{kingdom_id}_chat_history.csv"
    is_new = not path.exists()
    with open(path, 'a', newline='') as f:
        w = csv.writer(f)
        if is_new:
            w.writerow(['timestamp','player','alliance_tag','message'])
        for m in chat:
            w.writerow([ts.isoformat(), m['player'],
                        m['alliance_tag'], m['message']])

def print_since(kingdom_id):
    """Compare two most recent snapshots, print what changed."""
    snap_dir = DATA_DIR / "snapshots"
    snaps = sorted(snap_dir.glob(f"k{kingdom_id}_*.json"))
    if len(snaps) < 2:
        print("Need at least 2 snapshots to compare.")
        return
    prev = json.loads(snaps[-2].read_text())
    curr = json.loads(snaps[-1].read_text())
    
    prev_ranks = {a['id_hex']: a['rank'] for a in prev['alliances']}
    curr_ranks = {a['id_hex']: a['rank'] for a in curr['alliances']}
    prev_powers = {a['id_hex']: a['power'] for a in prev['alliances']}
    curr_powers = {a['id_hex']: a['power'] for a in curr['alliances']}
    
    for aid, rank in curr_ranks.items():
        pr = prev_ranks.get(aid)
        name = next((a.get('name', aid) for a in curr['alliances'] if a['id_hex'] == aid), aid)
        if pr and pr != rank:
            diff = pr - rank
            sym = "+" if diff > 0 else ""
            print(f"{name} rank {pr} -> {rank} ({sym}{diff})")
            
        cp = curr_powers.get(aid, 0)
        pp = prev_powers.get(aid, 0)
        if cp != pp:
            diff = cp - pp
            sym = "+" if diff > 0 else ""
            print(f"{name} power {pp:,} -> {cp:,} ({sym}{diff:,})")

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--kingdom', type=int, default=1908)
    parser.add_argument('--dry-run', action='store_true',
        help='Load from .bin files, skip live connection')
    parser.add_argument('--since', action='store_true',
        help='Show changes since last snapshot and exit')
    args = parser.parse_args()

    if args.since:
        print_since(args.kingdom)
        return

    ts = datetime.utcnow()

    if args.dry_run:
        print("DRY RUN — loading from /tmp/*.bin sample files")
        ranking_data = Path('/tmp/ranking_response_sample.bin').read_bytes()
        alliances_pre = parse_rankings(ranking_data)
        ids = [r.pop('alliance_id') for r in alliances_pre]
        names_data   = Path('/tmp/names_response_sample.bin').read_bytes() if Path('/tmp/names_response_sample.bin').exists() else b""
        player_data  = Path('/tmp/player_request.bin').read_bytes() if Path('/tmp/player_request.bin').exists() else b""
        chat_data    = b""
    else:
        print(f"Connecting to {SERVER}:{PORT}...")
        sock = connect_and_auth()
        print("Auth complete.")
        ranking_data = request_alliance_rankings(sock, args.kingdom)
        alliances_pre = parse_rankings(ranking_data)
        ids = [r.pop('alliance_id') for r in alliances_pre]
        print(f"  Found {len(ids)} alliances, requesting names...")
        names_data   = request_alliance_names(sock, ids) if ids else b""
        names        = parse_names(names_data, expected_ids=ids)
        unnamed_ids  = [aid for aid in ids if aid.hex() not in names]
        if unnamed_ids:
            print(f"  Batch returned {len(names)} names; querying {len(unnamed_ids)} individually...")
            extra = request_individual_names(sock, unnamed_ids)
            names.update(extra)
        player_data  = request_player_rankings(sock, args.kingdom)
        chat_data    = request_world_chat(sock)
        sock.close()

    known = load_known_names()
    alliances = alliances_pre
    if args.dry_run:
        names = parse_names(names_data, expected_ids=ids)

    # Merge names into alliances
    for a in alliances:
        if a['id_hex'] in names:
            a['name'] = names[a['id_hex']]['name']
            a['tag']  = names[a['id_hex']]['tag']
        elif a['id_hex'] in known:
            a['name'] = known[a['id_hex']]['name']
            a['tag']  = known[a['id_hex']]['tag']

    players = parse_players(player_data)
    # Cross-reference alliance names into player records
    for p in players:
        if p['alliance_id_hex'] in names:
            p['alliance_name'] = names[p['alliance_id_hex']]['name']

    chat = parse_chat(chat_data)

    if alliances or players or chat:
        write_snapshot(args.kingdom, alliances, players, chat, ts)
        if alliances: append_alliance_history(args.kingdom, alliances, ts)
        if players: append_player_history(args.kingdom, players, ts)
        if chat: append_chat_history(args.kingdom, chat, ts)

    print(f"\nAlliances extracted: {len(alliances)}")
    print(f"Players extracted:   {len(players)}")
    print(f"Chat messages:       {len(chat)}")

if __name__ == '__main__':
    main()

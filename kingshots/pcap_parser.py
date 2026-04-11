"""
Kingshots pcap parser — extracts readable data from game server (port 30101) traffic.
Handles Linux SLL2 link type (276) from Android emulator tcpdump captures.

Usage:
    python3 pcap_parser.py capture.pcap
"""
import struct
import sys
from collections import defaultdict


def read_pcap_packets(path):
    """Generator yielding (ts, src_ip, src_port, dst_ip, dst_port, tcp_payload) for TCP packets."""
    with open(path, 'rb') as f:
        magic = f.read(4)
        endian = '<' if magic == b'\xd4\xc3\xb2\xa1' else '>'
        ver_maj, ver_min, tz, sigfigs, snaplen, linktype = struct.unpack(endian + 'HHiIII', f.read(20))

        # Linux SLL2 = 276, Ethernet = 1
        if linktype not in (1, 276):
            print(f"Warning: unknown link type {linktype}, attempting to parse anyway")

        ip_offset = 20 if linktype == 276 else 14  # SLL2=20, Ethernet=14

        while True:
            hdr = f.read(16)
            if len(hdr) < 16:
                break
            ts_sec, ts_usec, incl_len, orig_len = struct.unpack(endian + 'IIII', hdr)
            data = f.read(incl_len)

            if len(data) < ip_offset + 20:
                continue

            # For SLL2, get protocol from first 2 bytes
            if linktype == 276:
                eth_proto = struct.unpack('>H', data[0:2])[0]
            else:
                eth_proto = struct.unpack('>H', data[12:14])[0]

            if eth_proto != 0x0800:  # IPv4 only
                continue

            ip = data[ip_offset:]
            ip_hdr_len = (ip[0] & 0x0f) * 4
            if ip[9] != 6:  # TCP only
                continue

            src_ip = '.'.join(str(b) for b in ip[12:16])
            dst_ip = '.'.join(str(b) for b in ip[16:20])

            tcp = ip[ip_hdr_len:]
            if len(tcp) < 14:
                continue

            src_port = struct.unpack('>H', tcp[0:2])[0]
            dst_port = struct.unpack('>H', tcp[2:4])[0]
            tcp_hdr_len = ((tcp[12] >> 4) & 0xf) * 4
            payload = tcp[tcp_hdr_len:]

            if not payload:
                continue

            ts = ts_sec + ts_usec / 1e6
            yield ts, src_ip, src_port, dst_ip, dst_port, payload


def extract_strings(data, min_len=5):
    """Extract printable ASCII strings from binary data."""
    strings = []
    current = bytearray()
    for b in data:
        if 32 <= b < 127:
            current.append(b)
        else:
            if len(current) >= min_len:
                strings.append(bytes(current).decode('ascii'))
            current = bytearray()
    if len(current) >= min_len:
        strings.append(bytes(current).decode('ascii'))
    return strings


def extract_rankings(pcap_path):
    """Main analysis — extracts all readable data from game server responses."""
    all_in_bytes = bytearray()
    all_out_bytes = bytearray()
    sessions = defaultdict(list)
    pkt_count = 0

    for ts, src_ip, src_port, dst_ip, dst_port, payload in read_pcap_packets(pcap_path):
        pkt_count += 1

        if dst_port == 30101:
            # Outgoing — our request to game server
            key = (src_ip, src_port)
            sessions[key].append(('OUT', ts, payload))
            all_out_bytes.extend(payload)
        elif src_port == 30101:
            # Incoming — data from game server
            key = (dst_ip, dst_port)
            sessions[key].append(('IN', ts, payload))
            all_in_bytes.extend(payload)

    print(f"=== PCAP ANALYSIS ===")
    print(f"Total packets: {pkt_count}")
    print(f"Game server IN bytes: {len(all_in_bytes)}")
    print(f"Game server OUT bytes: {len(all_out_bytes)}")
    print(f"Sessions: {len(sessions)}")

    print(f"\n=== STRINGS FROM GAME SERVER (IN PACKETS) ===")
    strings = extract_strings(all_in_bytes, min_len=4)
    seen = set()
    player_ids = []
    alliance_tags = []
    player_names = []

    for s in strings:
        if s in seen:
            continue
        seen.add(s)

        # Classify
        if s.startswith('lord') and len(s) > 8:
            player_ids.append(s)
        elif s.startswith('[') or s.startswith('<') or (len(s) == 3 and s.isupper()):
            alliance_tags.append(s)
        elif len(s) >= 4 and not s.startswith('http') and not s.startswith('2026'):
            player_names.append(s)

    print(f"\n[Alliance-related] ({len(alliance_tags)} found):")
    for s in sorted(alliance_tags):
        print(f"  {s}")

    print(f"\n[Player IDs] ({len(player_ids)} found):")
    for s in sorted(player_ids):
        print(f"  {s}")

    print(f"\n[Player names/other strings] ({len(player_names)} found):")
    for s in sorted(player_names)[:100]:  # limit to 100
        print(f"  {s}")

    print(f"\n=== UNIQUE OUTGOING REQUEST TYPES (to :30101) ===")
    seen_sigs = set()
    for key, pkts in sessions.items():
        for direction, ts, payload in pkts:
            if direction == 'OUT' and len(payload) >= 4:
                sig = payload[:6].hex()
                if sig not in seen_sigs:
                    seen_sigs.add(sig)
                    print(f"  len={len(payload):4d} hex={payload[:40].hex()}")

    return {
        'strings': list(seen),
        'player_ids': player_ids,
        'alliance_tags': alliance_tags,
    }


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python3 pcap_parser.py <capture.pcap>")
        sys.exit(1)
    extract_rankings(sys.argv[1])

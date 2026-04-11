# Kingshots Binary Protocol — K223 Reference (port 30101)

*Reverse-engineered from pcap captures 2026-04-06. All confirmed against live server.*

---

## Framing

Every message: `[length: 2B big-endian] [body: length bytes]`

Body always starts with a 2-byte command prefix. Common prefixes:
- `55 02` — server → client responses
- `5d 02` — client → server requests (rankings, names, misc)
- `7d 02` — client → server (some request types, less common)

---

## Auth Sequence

`AUTH_SEQUENCE` in `live_client.py` = 296 bytes containing multiple framed packets sent back-to-back. Contains the auth token `m9gOxfM3HSIVXq9adcrjwbSeKVsVdARrA3srLKjsL6RM7clQ` embedded at offset ~24.

After sending all auth packets, drain server response with `recv_all(timeout=2.0)`. Auth response is a session init blob, not ranking data.

The token encodes which kingdom the connection routes to. You CANNOT query another kingdom's data with your token — the gateway reads it and routes you to your kingdom's server.

---

## Ranking Request

```
RANKING_REQUEST  (171 bytes, big-endian length prefix 00 ab)
Body: 5d 02 04 19 [seq: 2B] 4c 54 ...
```

After sending RANKING_REQUEST, immediately send follow-up:
```
00 08 5d 02 06 19 94 01 01 04
```
(8-byte body, this is the K223-specific follow-up observed in pcap)

Then `recv_raw(sock, initial_timeout=8.0)` → ranking response (~2812 bytes for K223 top 27).

---

## Ranking Response — K223 Structure

K223 uses `d3 69` as a power terminator (NOT the `1c 6d 0b` markers from K1908).

**Per-record structure:**
```
... [4-byte LE uint32 power] [d3 69] [0-4 noise bytes] [alliance_id: 2B] [c7?] [62 01] ...
```

**Parsing algorithm (parse_rankings):**
1. Scan for `d3 69` bytes
2. Extract `struct.unpack('<I', data[i-4:i])[0]` as power
3. Filter: 50,000,000 ≤ power ≤ 15,000,000,000
4. From `i+2`, scan forward up to 32 bytes for `[c7?] 62 01` pattern
5. The 2 bytes immediately before `62 01` (or before `c7 62 01`) = alliance_id
6. Use `seen_d369` set to avoid re-using same position

---

## Alliance Names Request

**Format:**
```
[len: 2B BE] [header: 13B] [62 01 id_lo id_hi] × N [62 01]
```

Header (13 bytes): `5d 02 28 28 [seq_hi] [seq_lo] c4 2d 04 51 ff 04 01`

**CRITICAL: seq must be HIGH.** Use `seq_counter=0x9601` → bytes `96 01` in packet.
- seq=1 (`00 01`): server returns 0 bytes (rejected)
- seq=0x9601 (`96 01`): server responds with names (confirmed working)

The server validates sequence against session state. Values below ~0x0100 are rejected.

**Alliance IDs in request:** 2-byte little-endian IDs extracted from ranking response, encoded as `62 01 [id_lo] [id_hi]`. Terminated by lone `62 01`.

**Function:** `construct_names_request(alliance_ids, seq_counter=0x9601)` in live_client.py

---

## Alliance Names Response — K223 Structure

**CRITICAL: Alliance IDs come BEFORE `62 01` markers, NOT after.**

Per-record structure:
```
... [id_lo] [noise?] [id_hi] [c7 or other noise?] [62 01] [ctrl: 1B] [name_bytes] [03] [noise?] [tag_bytes] ...
```

Noise bytes set: `{0xff, 0xfc, 0xfe, 0xf8, 0xf1, 0xc7, 0x7f, 0x8f, 0x1f, 0x00}`

**ID extraction (backward from marker):**
1. Try direct: `data[mpos-2:mpos]` — works if no noise immediately before marker
2. If direct not in expected_ids: noise-skipping backward scan
   - Skip bytes in `_NAMES_NOISE` going backward
   - Collect first 2 non-noise bytes
   - BUT: `8f 01` is a VALID alliance ID (8f is NOT noise here) — direct match handles this

**Name extraction:**
- Section: `data[mpos+2 : next_marker]`
- Name: bytes before first `b'\x03'` separator, filter: `b < 128 and chr(b).isalnum()`
- Tag: bytes after `b'\x03'`, using: stop at first control/high byte after tag starts

**Known alliance names (K223, as of 2026-04-06):**
```
0601: ANARCHY          [ANR1]
0902: Ddysfunctionals  [TTN]
0c01: ThePsychWard     [PSY]
e002: EliteAllianz     [xYtU1]
0801: TheNakedPenguinz [Tnp]
cf02: RAVEN            [tGtn1]
5101: TNaughtyPenguins [tnp]
```

---

## Individual Name Query (not yet wired into live_client.py)

From pcap — queries one alliance by ID:
```
00 0e 5d 02 28 28 [seq_hi] [seq_lo] c4 05 04 [id_lo] 07 [id_hi] 62 01
```
Note: `07` separator between `id_lo` and `id_hi` (different from batch format).

Response: single-alliance record, same format as batch response.

Use this to fill in alliances not returned by the batch query.

---

## Session Behavior

- **Rate limiting**: Server limits names queries per auth token. After ~5 rapid connections testing, subsequent connections get 0 bytes for names. Wait ~15 minutes for reset.
- **Normal operation**: One connection every few minutes is fine. No rate limiting observed.
- **Token expiry**: Unclear interval. If auth fails, need fresh token from emulator capture.
- **Batch response coverage**: Server returns ~7 of 27 alliances in one batch response. The rest require individual queries OR appear in later batches.

---

## pcapng Parsing Notes

K223 capture (`/tmp/k223_names.pcap`): Ethernet link type (1), NOT PKTAP.

EPB body structure:
```
iface_id(4) + ts_high(4) + ts_low(4) + cap_len(4) + orig_len(4) + packet_data
```
**cap_len is at body offset 12, NOT offset 8.**

Ethernet header: 14 bytes. IPv4 ethertype: `0x0800`.
TCP src_port=30101 → IN (server→client); dst_port=30101 → OUT (client→server).

---

## File Map

```
live_client.py              Main script — auth, ranking, names, output
data/snapshots/             JSON snapshots per run
data/k223_alliance_history.csv   Time-series power data
PROTOCOL_NOTES.md           This file
DIARY.md                    Session logs
HANDOFF.md                  Full project context
```

---

## Quick Start

```bash
cd /Users/defimagic/Desktop/Hive/kingshots
python3 live_client.py --kingdom 223
```

Output: console summary + snapshot written to `data/snapshots/`.

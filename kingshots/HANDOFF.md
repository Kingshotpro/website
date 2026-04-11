# Kingshots Game Server Intelligence — Full Technical Handoff

**Project**: Extract kingdom-level data (alliance rankings, player power rankings, top heroes) for any Kingshots kingdom — starting with Kingdom 223 as proof of concept.

**Game**: Kingshots by Century Games (also called "Whiteout Survival" in some regions). Package ID: `com.run.tower.defense`

**Architect's account**: FID `295850082`, Kingdom `1908`, Nickname `lord295850082`

---

## What We Know — Confirmed Facts

### The API Landscape

| Service | Domain | Protocol | Public? | Notes |
|---|---|---|---|---|
| Gift code / player lookup | `kingshot-giftcode.centurygame.com` | HTTPS REST | YES | POST `/api/player` — returns name, kingdom, stove_lv, recharge only |
| Game metadata | `got-gm-api-formal.chosenonegames.com` | HTTPS REST | Partial | Only `/api/version/info` responds. All ranking paths = 404 |
| **Game server** | `got-formal-gateway-ga.chosenonegames.com:30101` | **Binary TCP** | NO | All ranking data lives here. Auth-required. |
| Spectator | `got-formal-spectator-ga.chosenonegames.com:31601` | Binary TCP | Unknown | Not yet explored |
| Auth | `passport-got.centurygame.com` | HTTPS | NO | Cert-pinned, issues auth tokens |
| CDN | `got-global-cdn.akamaized.net` | HTTPS | YES | Game assets, Lua hot-patches |
| Avatar images | `got-global-avatar.akamaized.net` | HTTPS | YES | Player avatars, no auth needed |
| Real-time events | `rtm-intl-frontgate.ilivedata.com:13321` | Binary TCP | NO | NetEase RTM SDK — in-game chat/events, NOT ranking data |

### The Version Info Endpoint (works, no auth)

```
GET https://got-gm-api-formal.chosenonegames.com/api/version/info?platform=android&version=1.9.5&kingdom=223&language=en
```

Returns: game server gateway IPs, spectator IPs, CDN URLs, app version. Kingdom parameter accepted for any kingdom number.

**Key fields in response:**
- `ip[]` — game server gateways (all traffic routes through these, then to kingdom-specific server)
- `specator_ip[]` — spectator servers (unexplored)

### The Binary Protocol (port 30101)

All game data — rankings, player info, alliance data — flows through a custom binary TCP protocol. Key facts:

- **Framing**: 2-byte big-endian length prefix + message body
- **Auth routing**: The auth token in the login packet determines which kingdom's server you connect to. The gateway reads the token and routes you. You CANNOT request a different kingdom's data from within another kingdom's connection.
- **Ranking data is in plaintext**: Alliance names, player names, player IDs, image URLs all appear as readable ASCII strings in the binary stream. Power values are encoded (varint or custom integer encoding).
- **Login packet**: 211 bytes. Starts `00 d1 55 02 04 XX...` followed by ASCII auth token (e.g., `m9gOxfM3HSIVXq9...`). The `XX` byte increments per session.
- **Alliance ranking request**: 59 bytes. `00 39 7d 02 28 28 3c 01 01 c4 2d 04 22 ff 04 1c 6d 0b [ID] 1c 6d 0b [ID]...` — sends a list of alliance IDs to retrieve.
- **Response strings visible**: `[ATL]`, `ATLANTIS`, `[DKN]DarkNation`, `[VIP]VIP`, `[NRG]ENERGY`, `[SPH]Seraphins`, `[DRK]Darkness`, player names like `Kick4ssq`, `Panda`, `lord29XXXXXXX` format IDs.

### The Core Constraint

**You need one auth token per kingdom.** The auth token is tied to an account, which is tied to a kingdom. There is no cross-kingdom ranking API. The game server routes your connection based on who you are, not where you want to look.

**To get Kingdom 223 data, you need a Kingdom 223 auth token.** This means one account in Kingdom 223.

### Good News on Account Creation

The Android emulator **already looks like a mobile device** to the server. The "Tips: create character on mobile first" dialog is a **client-side UI warning**, not a server enforcement. A **brand-new Google account created directly on the emulator** would treat the emulator as its first/only mobile device — no phone required, no Tips dialog.

### Townhall Level Gate

The game UI requires Townhall level 6 before showing ranking screens. This is **almost certainly client-side only**. The ranking request packet can be sent to the server regardless of account level — the server likely doesn't enforce this gate. This has not been fully confirmed yet but is the expected behavior for mobile game architecture.

### World Map Kingdom Selector — UNTESTED BUT PROMISING

When on the world map, the bottom bar shows `#1908 X:474 Y:1084`. Tapping `#1908` may open a kingdom number input. If so, typing `223` might navigate the map to Kingdom 223 — and possibly reveal ranking data from within the same game session. **This was NOT tested before the session ended. Test this first.**

---

## Emulator Setup (New Machine)

### Requirements

- macOS (Intel or Apple Silicon)
- Android Studio installed (for AVD Manager and emulator)
- `adb` available at `~/android-sdk/platform-tools/adb` or wherever installed

### Create the AVD

```bash
# In Android Studio: Tools → Device Manager → Create Device
# Or via command line:
~/android-sdk/cmdline-tools/latest/bin/avdmanager create avd \
  -n KingshotAVD \
  -k "system-images;android-30;google_apis;arm64-v8a" \
  --device "pixel_4"
```

Use API 30 (Android 11), ARM64 architecture, Google APIs (for Google sign-in).

### Launch with GPU Acceleration

```bash
~/android-sdk/emulator/emulator -avd KingshotAVD -gpu host -no-audio -no-boot-anim -no-snapshot-load
```

`-gpu host` is critical — software rendering (swiftshader_indirect) is too slow for the game. Note: GPU host causes significant heat on laptops. Use a desktop or laptop on a cooling pad.

### Root the Emulator

The emulator with Google APIs is rooted by default via adb:

```bash
ADB=~/android-sdk/platform-tools/adb
$ADB root
$ADB remount
```

### Install Kingshots

Download the APK from APKPure or similar. The APK is split — you need the base APK and the `game_asset` OBB file.

```bash
$ADB install -r kingshots.apk
# Push OBB to:
$ADB push game_asset.obb /sdcard/Android/obb/com.run.tower.defense/
```

### libtolua.so Patch (REQUIRED for game to load)

The game has a Lua exception bug (`CGAccountInfo.Compliance` field missing). Must patch the native library:

```bash
# Pull library
$ADB pull /data/app/~~HASH==/com.run.tower.defense-HASH==/lib/arm64/libtolua.so /tmp/libtolua.so

# Apply patch (two ARM64 instruction replacements):
# Offset 0x26a90: bytes 4c f4 ff 97 → 60 f5 ff 97
# Offset 0x26b5c: bytes 19 f4 ff 97 → 2d f5 ff 97

python3 << 'EOF'
with open('/tmp/libtolua.so', 'r+b') as f:
    f.seek(0x26a90)
    f.write(bytes([0x60, 0xf5, 0xff, 0x97]))
    f.seek(0x26b5c)
    f.write(bytes([0x2d, 0xf5, 0xff, 0x97]))
EOF

# Push back
$ADB push /tmp/libtolua.so /data/app/~~HASH==/com.run.tower.defense-HASH==/lib/arm64/libtolua.so
```

The `~~HASH==` path changes per install. Find it with:
```bash
$ADB shell pm path com.run.tower.defense
```

---

## Traffic Capture Setup

### Method 1: tcpdump on Emulator (Best for Binary Protocol)

```bash
# Push static arm64 tcpdump binary to emulator
# Download from: https://github.com/extremecoders-re/tcpdump-android/releases
$ADB push tcpdump /data/local/tmp/tcpdump
$ADB shell chmod 755 /data/local/tmp/tcpdump

# Start capture
$ADB shell "nohup /data/local/tmp/tcpdump -i any -w /sdcard/capture.pcap &"

# Pull pcap when done
$ADB pull /sdcard/capture.pcap /tmp/capture.pcap
```

Analyze with the Python pcap parser (see `/Users/defimagic/Desktop/Hive/kingshots/pcap_parser.py`).

### Method 2: HTTPS Intercepting Proxy (For REST calls)

See `/tmp/https_proxy.py` on the old machine. Copy to new machine.

```bash
# Generate CA cert
python3 /tmp/gen_ca.py  # Creates hive_ca.crt, hive_ca.key, 3a0af9e4.0

# Push CA to emulator as system-trusted
$ADB push /tmp/3a0af9e4.0 /sdcard/cacerts_rw/3a0af9e4.0
$ADB shell "mount --bind /sdcard/cacerts_rw /system/etc/security/cacerts"

# Set emulator proxy
$ADB shell settings put global http_proxy 10.0.2.2:8080

# Run proxy
python3 /tmp/https_proxy.py &
```

### Method 3: tcpdump on the Mac (Easier, less precise)

```bash
# Requires sudo
sudo tcpdump -i any -w /tmp/capture.pcap "port 30101"
```

All emulator traffic routes through the Mac's network stack, so this captures port 30101 traffic without needing anything on the emulator.

### Analyzing pcap for Ranking Data

```python
import struct

def extract_strings_from_pcap(path, min_len=5):
    with open(path, 'rb') as f:
        magic = f.read(4)
        endian = '<' if magic == b'\xd4\xc3\xb2\xa1' else '>'
        f.read(20)
        all_data = bytearray()
        while True:
            hdr = f.read(16)
            if len(hdr) < 16: break
            ts_sec, ts_usec, incl_len, orig_len = struct.unpack(endian+'IIII', hdr)
            data = f.read(incl_len)
            if len(data) < 40: continue
            # Linux SLL2 link type (276) — 20 byte header
            proto = struct.unpack('>H', data[0:2])[0]
            if proto != 0x0800: continue
            ip_start = 20
            ip_hdr_len = (data[ip_start] & 0x0f) * 4
            if data[ip_start+9] != 6: continue
            payload_start = ip_start + ip_hdr_len
            if len(data) < payload_start + 14: continue
            src_port = struct.unpack('>H', data[payload_start:payload_start+2])[0]
            tcp_hdr_len = ((data[payload_start+12] >> 4) & 0xf) * 4
            tcp_payload = data[payload_start + tcp_hdr_len:]
            if tcp_payload and src_port == 30101:  # IN packets from game server
                all_data.extend(tcp_payload)

    strings, current = [], bytearray()
    for b in all_data:
        if 32 <= b < 127:
            current.append(b)
        else:
            if len(current) >= min_len:
                strings.append(bytes(current).decode())
            current = bytearray()
    return list(set(strings))
```

---

## The Path to Kingdom 223 Data — Next Steps (Priority Order)

### Step 1: Test the World Map Kingdom Selector

Launch game on existing account (Kingdom 1908). Navigate to the world map. At the bottom of the screen you'll see `#1908 X:NNN Y:NNN`. Tap `#1908` and type `223`. If this lets you jump to Kingdom 223's map, check whether the Rankings/Leaderboard screen reflects Kingdom 223 data while you're "visiting."

### Step 2: Create a Fresh Kingdom 223 Account on the Emulator

If Step 1 fails (which is likely — rankings are per-kingdom, not per-location):

1. Add a fresh Google account on the emulator (Android Settings → Accounts → Add Google)
2. Launch Kingshots with that account for the first time
3. The emulator is Android — no "mobile first" restriction for new accounts
4. During initial character creation, the game should offer a kingdom selection or auto-assign
5. If auto-assigned elsewhere, use the free migration item (available in first few days) to move to Kingdom 223
6. Once in Kingdom 223, DON'T play — just capture the auth token from the login session
7. Use that token in the Python client (below) to pull rankings headlessly forever

### Step 3: Build the Python Headless Client

Once you have a Kingdom 223 auth token from the pcap, build a script that:
1. Opens TCP socket to `got-formal-gateway-ga.chosenonegames.com:30101`
2. Sends the login packet with the token
3. Sends the alliance ranking request (`00 39 7d 02 28 28 3c 01...`)
4. Reads and parses the response (extract ASCII strings)
5. Outputs JSON

This runs headlessly, no emulator needed after initial auth token capture.

### Step 4: Scale

One Python script instance per kingdom. Auth tokens expire — unclear at what interval. May need periodic re-auth. The game account just needs to exist in the target kingdom; it doesn't need to be active.

---

## Key Files on Old Machine

| File | Contents |
|---|---|
| `/tmp/https_proxy.py` | HTTPS intercepting proxy |
| `/tmp/gen_ca.py` | CA cert generator |
| `/tmp/hive_ca.crt` | Hive MITM CA certificate |
| `/tmp/hive_ca.key` | Hive MITM CA private key |
| `/tmp/final_capture.pcap` | 527MB pcap — full leaderboard session |
| `/tmp/kingdom_capture2.pcap` | 21MB pcap — earlier session with alliance rankings |
| `/tmp/libtolua_patched.so` | Patched game native library |
| `~/Desktop/Hive/Autonomous/GAME_DASHBOARD_API_DISCOVERY.md` | Earlier research notes |

---

## Known Dead Ends (Don't Repeat These)

- Guessing REST endpoint paths on `got-gm-api-formal.chosenonegames.com` — all 404 except version/info
- Python lz4.block for Unity 2022.3 asset bundles — wrong LZ4 variant, error code 50
- mitmproxy on Python 3.9 — bcrypt/passlib conflict, use custom proxy instead
- Trying to block CDN to skip hot-patch Lua — bundled Lua also has the Compliance bug
- Patching libtolua.so alone without mobile account setup — returns nil for Compliance, game rejects login
- `adb shell input tap` on the emulator for navigation — causes screen sleep, better to have the Architect click manually

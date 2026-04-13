# Kingshot Human-Like ADB Scraper — Full Specification

**For:** The next Claude session assigned to build/refine this system
**Written by:** Opus (April 13, 2026)
**Context:** KingshotPro Kingdom Intelligence Network — scraping ranking data from every kingdom via Android phone automation

---

## YOUR MISSION

Build a Python ADB automation script that controls a physical Android phone running Kingshot. The script must:

1. **Scrape ALL ranking data** from a kingdom (player power rankings, alliance rankings)
2. **Appear completely human** to any behavioral analysis system
3. **Perform real gameplay actions** between scraping (collect resources, upgrade a building, tap around)
4. **Switch kingdoms** on the same account and repeat the process
5. **Save all scraped data** (screenshots + OCR-ready output) to structured storage

**The #1 priority is looking human, even if it makes everything slower and less efficient.** Century Games bans bot accounts. Losing an account that has access to 50+ kingdoms costs weeks of setup. Speed is irrelevant. Survival is everything.

---

## WHAT EXISTS ALREADY

### Existing Scraper (Conditional Pass)
Location: `/Users/defimagic/Desktop/Hive/KingshotPro/scraper/`

A previous Claude (Scry) built an ADB screenshot scraper. Auditor (Limn) issued a **CONDITIONAL PASS** on April 8, 2026 with two required fixes:

1. **Swipe duration too fast:** Was 350-750ms, human baseline is 800-2000ms. Fix: `scroll_duration_min_ms: 600, scroll_duration_max_ms: 1800`
2. **No non-ranking behavior:** Script ONLY visits ranking screens. This creates a detectable behavioral signature when repeated across 20-50 kingdoms. Needs "noise" gameplay between ranking sessions.

What works in existing code: percentage-based coordinates, `maybe_pause()` random delays, 7-23s scroll delay range, good device recommendation (physical phone + USB over emulator + WiFi).

### Existing Binary Protocol Client
Location: `/Users/defimagic/Desktop/Hive/KingshotPro/scraper/live_client.py`

A TCP client that speaks the game's binary protocol directly (port 30101). This was built for Kingdom 223 specifically. It works but:
- Requires per-kingdom auth tokens (expire, need refreshing)
- Binary protocol can change with game updates
- More detectable than UI interaction (unusual connection patterns)
- NOT what this spec is about — we want the UI-based approach for human camouflage

### Game Technical Details
- Package: `com.run.tower.defense`
- Game server: `got-formal-gateway-ga.chosenonegames.com:30101` (binary TCP)
- Player lookup: `kingshot-giftcode.centurygame.com/api/player` (REST, via our Worker proxy)
- Rankings require Townhall level 6+ (client-side gate, UI won't show before this)
- Auth token is per-account, per-kingdom — server routes connection by who you are

---

## HARDWARE SETUP

**Use physical Android phones, NOT emulators.**

Why:
- Emulators have detectable fingerprints (device model "sdk_gphone64_arm64", missing sensors, etc.)
- Physical phones have real IMEIs, real sensors, real touch capacitance patterns
- Century Games' anti-cheat is less suspicious of a real Pixel 5 than an emulator
- USB ADB connection is more reliable than WiFi ADB

Recommended:
- Cheap Android phone ($50-100 used, e.g., Pixel 4a, Samsung A13)
- USB cable to Mac/PC running the script
- Phone stays plugged in, screen stays on (use developer option "Stay awake while charging")
- One phone can serve multiple kingdoms via account switching within the game

---

## HUMAN BEHAVIOR STRATEGY

This is the core of the spec. **Every action the script takes must be indistinguishable from a bored human player checking rankings and playing casually.**

### Principles

1. **Never repeat the exact same sequence twice.** Humans don't tap the same pixel twice. They don't follow the same navigation path every time. Randomize EVERYTHING.

2. **Variable timing on every action.** No two taps should have the same inter-tap delay. No two swipes should have the same duration. Use Gaussian distributions around human means, not uniform random.

3. **Imprecise targeting.** Humans don't tap the mathematical center of buttons. Add random pixel offsets (±5-15px from center) on every tap. Sometimes miss and tap nearby dead space, then correct.

4. **Natural swipe curves.** Humans don't swipe in perfectly straight lines. Swipes should have slight curves, variable speeds (fast start, slow end — or the opposite), and occasional incomplete swipes that need correction.

5. **Idle periods.** Humans pause to read, think, get distracted. Insert pauses of 2-30 seconds at random points, weighted toward shorter pauses but with occasional long ones (someone checking their phone, getting a drink).

6. **Non-ranking activity.** Between ranking scrape sessions, the script should do actual gameplay for 1-5 minutes: collect resources from buildings, start a building upgrade, browse the hero screen, open and close chat, look at the map. This is NOT wasted time — it's camouflage.

### Timing Distributions

Use Gaussian (normal) distributions, NOT uniform random. Human reaction times cluster around a mean with a bell curve.

```python
import random
import numpy as np

def human_delay(mean_ms, std_ms, min_ms=None, max_ms=None):
    """Generate a human-like delay in milliseconds."""
    delay = int(np.random.normal(mean_ms, std_ms))
    if min_ms is not None: delay = max(delay, min_ms)
    if max_ms is not None: delay = min(delay, max_ms)
    return delay

# Between taps on UI elements
TAP_DELAY = lambda: human_delay(800, 300, min_ms=400, max_ms=2500)

# Between reading a screen and taking action
READ_DELAY = lambda: human_delay(2500, 1200, min_ms=1000, max_ms=8000)

# Swipe duration (finger down to finger up)
SWIPE_DURATION = lambda: human_delay(1200, 400, min_ms=600, max_ms=2200)

# Pause between major actions (switching screens)
SCREEN_TRANSITION = lambda: human_delay(3000, 1500, min_ms=1500, max_ms=12000)

# "Distraction" pause (phone notification, thinking, etc.)
DISTRACTION = lambda: human_delay(15000, 10000, min_ms=5000, max_ms=45000)
```

### Tap Jitter

Never tap the exact center of a button.

```python
def jittered_tap(center_x, center_y, jitter_px=12):
    """Add human-like imprecision to tap coordinates."""
    # Gaussian jitter — usually close to center, occasionally off
    dx = int(np.random.normal(0, jitter_px / 2))
    dy = int(np.random.normal(0, jitter_px / 2))
    return (center_x + dx, center_y + dy)
```

### Natural Swipes

Swipes should NOT be straight lines. Use ADB's `input swipe` with variable duration, and occasionally use multi-segment swipes for curves.

```python
def human_swipe(start_x, start_y, end_x, end_y, duration_ms=None):
    """Execute a human-like swipe with natural imprecision."""
    if duration_ms is None:
        duration_ms = SWIPE_DURATION()

    # Add start/end position jitter
    sx = start_x + int(np.random.normal(0, 8))
    sy = start_y + int(np.random.normal(0, 8))
    ex = end_x + int(np.random.normal(0, 15))  # End position is sloppier
    ey = end_y + int(np.random.normal(0, 15))

    # Occasionally do a slightly curved swipe (horizontal drift)
    if random.random() < 0.3:
        # Two-segment swipe for natural curve
        mid_x = (sx + ex) // 2 + int(np.random.normal(0, 20))
        mid_y = (sy + ey) // 2
        # ADB doesn't support curved swipes natively — use sendevent or
        # break into two sequential swipes with tiny gap
        pass  # Implementation depends on device

    adb_cmd = f'input swipe {sx} {sy} {ex} {ey} {duration_ms}'
    subprocess.run(['adb', 'shell', adb_cmd])
```

### Percentage-Based Coordinates

Screen resolution varies by device. ALL coordinates should be percentage-based, converted to pixels at runtime.

```python
def pct_to_px(pct_x, pct_y, screen_w, screen_h):
    return (int(pct_x / 100 * screen_w), int(pct_y / 100 * screen_h))
```

---

## SCRAPING WORKFLOW

### Per-Kingdom Sequence

```
1. LAUNCH / SWITCH KINGDOM
   - If first kingdom: launch game, wait for full load (30-60 sec)
   - If subsequent: use kingdom selector in settings

2. HUMAN NOISE — PRE-SCRAPE (1-3 minutes)
   - Collect resources from 2-3 buildings (tap building, tap collect)
   - Open and close one menu (heroes, backpack, or alliance)
   - Scroll the map randomly (2-3 short drags)
   - Maybe start a building upgrade if one is available
   - Random idle pauses between actions

3. NAVIGATE TO RANKINGS
   - Open the rankings screen (tap menu → rankings)
   - Wait for load (use screen change detection, not fixed timer)

4. SCRAPE POWER RANKINGS
   - Screenshot the visible portion
   - Scroll down slowly (human-speed swipe)
   - Screenshot again
   - Repeat until reaching the bottom (detect scroll end)
   - Each scroll: screenshot → wait READ_DELAY → scroll → wait again
   - Occasionally pause longer (DISTRACTION) mid-scroll

5. SCRAPE ALLIANCE RANKINGS (if separate tab)
   - Switch to alliance ranking tab
   - Same scroll + screenshot pattern as power rankings

6. HUMAN NOISE — POST-SCRAPE (1-2 minutes)
   - Visit one more building or screen
   - Briefly look at world map
   - Maybe open chat and scroll it once
   - Close game or navigate to kingdom switcher

7. SAVE DATA
   - All screenshots saved to structured directory
   - Metadata (kingdom ID, timestamp, screenshot index) logged
   - OCR can happen offline — the scraper only captures screenshots

8. REPEAT for next kingdom
```

### Screenshot Strategy

Use `adb shell screencap -p /sdcard/screenshot.png && adb pull /sdcard/screenshot.png` for each capture. This is faster and quieter than `adb exec-out screencap -p`.

File naming:
```
data/{kingdom_id}/{timestamp}/
  power_rank_001.png
  power_rank_002.png
  ...
  alliance_rank_001.png
  alliance_rank_002.png
  metadata.json
```

`metadata.json`:
```json
{
  "kingdom_id": 223,
  "timestamp": "2026-04-13T14:30:00Z",
  "device": "Pixel4a",
  "screenshots": [
    {"file": "power_rank_001.png", "type": "power", "scroll_position": 0},
    {"file": "power_rank_002.png", "type": "power", "scroll_position": 1}
  ],
  "noise_actions": ["collected_resources", "browsed_heroes", "scrolled_map"],
  "duration_seconds": 185
}
```

---

## KINGDOM SWITCHING

The game allows visiting other kingdoms via the kingdom selector (accessible from world map or settings). When visiting another kingdom, you can view their rankings. The selector is at the bottom of the world map showing `#XXXX X:NNN Y:NNN` — tapping the kingdom number opens an input.

**IMPORTANT:** This is UNTESTED. The previous Claude noted this was promising but never confirmed whether visiting a kingdom shows their rankings. Test this FIRST.

If kingdom visiting does NOT show rankings:
- You need a farm account in each target kingdom
- Or use the binary protocol client (live_client.py) which is separate from this spec

If kingdom visiting DOES work:
- One account can scrape every kingdom
- Just navigate: world map → kingdom selector → type kingdom number → navigate → rankings

### Account Management

The Architect's account: FID `295850082`, Kingdom `1908`.

For each phone, maintain a config:
```yaml
device_serial: "XXXXXXXX"
accounts:
  - fid: "295850082"
    home_kingdom: 1908
    kingdoms_to_scrape: [223, 734, 812, 1000, 1200, ...]
```

---

## NOISE ACTIONS LIBRARY

The script needs a library of "real gameplay" actions it can perform between scraping runs. These must be SAFE — no spending resources, no making alliances, no sending troops.

### Safe Actions (implement all of these)

```
collect_resources()
  - Tap on a resource building (farm, lumber, mine)
  - Tap the "collect" button
  - Wait, move on to next building
  - 2-4 buildings per call

browse_heroes()
  - Open hero screen
  - Scroll hero list up/down once
  - Tap on one hero card
  - Wait (as if reading stats)
  - Press back
  - Close hero screen

scroll_world_map()
  - Drag the world map 1-3 times in random directions
  - Short drags (not full screen traversals)
  - Pause between drags

open_close_menu(menu_name)
  - Open a random menu (backpack, shop, quests, mail)
  - Wait 2-5 seconds
  - Close it
  - Menu choice: weighted random (NOT uniform — backpack is more common than shop)

check_chat()
  - Open world chat
  - Scroll up once
  - Wait 3-8 seconds (reading)
  - Close chat

start_building_upgrade()
  - ONLY if a free builder is available and upgrade is cheap
  - This is risky — better to skip than accidentally spend rare resources
  - Implementation: optional, mark as "advanced noise"

visit_alliance()
  - Open alliance screen
  - Wait (reading)
  - Close
```

### Noise Sequencer

```python
def do_noise_actions(min_actions=2, max_actions=5):
    """Perform random gameplay noise between scrape runs."""
    actions = [
        (collect_resources, 0.35),    # Most common
        (scroll_world_map, 0.20),
        (browse_heroes, 0.15),
        (open_close_menu, 0.15),
        (check_chat, 0.10),
        (visit_alliance, 0.05),
    ]

    num_actions = random.randint(min_actions, max_actions)
    chosen = random.choices(
        [a[0] for a in actions],
        weights=[a[1] for a in actions],
        k=num_actions
    )

    for action in chosen:
        action()
        time.sleep(SCREEN_TRANSITION() / 1000)

        # 10% chance of a "distraction" mid-noise
        if random.random() < 0.10:
            time.sleep(DISTRACTION() / 1000)
```

---

## SCROLL END DETECTION

When scraping rankings, you need to detect when you've reached the bottom. Options:

1. **Screenshot comparison:** Compare last two screenshots. If pixel similarity > 95%, you've hit bottom.
2. **OCR rank numbers:** If you're doing inline OCR, check if rank numbers stopped incrementing.
3. **Fixed scroll count:** Each scroll reveals ~8 players. Top 200 = ~25 scrolls. But this is fragile.

**Recommended: option 1 (screenshot comparison).** Simple, reliable, no OCR dependency.

```python
from PIL import Image
import imagehash

def screenshots_similar(img_path1, img_path2, threshold=5):
    """Check if two screenshots are nearly identical (scroll end detection)."""
    h1 = imagehash.phash(Image.open(img_path1))
    h2 = imagehash.phash(Image.open(img_path2))
    return (h1 - h2) < threshold
```

---

## ANTI-DETECTION CHECKLIST

Before running on real accounts, verify all of these:

- [ ] No two consecutive taps hit the exact same pixel
- [ ] Swipe durations are 600-2200ms (not below 600)
- [ ] Inter-action delays are Gaussian distributed, not uniform
- [ ] At least 2 non-ranking actions happen between scrape sessions
- [ ] Script pauses 5-45 seconds at random "distraction" points
- [ ] No action sequence is exactly the same between kingdoms
- [ ] Percentage-based coordinates (works on any screen resolution)
- [ ] Screenshots use screencap (not accessibility service or overlay)
- [ ] Total per-kingdom time: 3-8 minutes (not suspiciously fast)
- [ ] Script respects device battery/temperature (pause if >45°C)
- [ ] Swipe paths have Gaussian jitter on start and end positions
- [ ] Menu navigation order varies between sessions
- [ ] Some scrolls are deliberately incomplete ("reading" mid-scroll)

---

## DATA OUTPUT

### Directory Structure
```
data/
  kingdoms/
    223/
      2026-04-13_143000/
        power_001.png
        power_002.png
        alliance_001.png
        metadata.json
      2026-04-14_091500/
        ...
    734/
      ...
  runs/
    run_2026-04-13.json    # Which kingdoms were scraped, timing, errors
```

### Run Log
```json
{
  "run_id": "2026-04-13_143000",
  "device": "Pixel4a_USB",
  "kingdoms_scraped": [223, 734, 812],
  "kingdoms_failed": [],
  "total_duration_minutes": 28,
  "screenshots_captured": 47,
  "noise_actions_performed": 14,
  "errors": []
}
```

---

## SESSION SCHEDULE

Don't scrape 24/7. Real humans play at certain times.

- **Primary window:** 2 runs per day (morning + evening, player's local timezone)
- **Each run:** 5-15 kingdoms (depending on how many the account can access)
- **Per kingdom:** 3-8 minutes including noise
- **Total run time:** 30-90 minutes per session
- **Off hours:** Phone sits idle (screen off). No activity from 1am-7am.
- **Weekend variation:** Slightly longer sessions, maybe an extra run

---

## WHAT YOU SHOULD BUILD

1. **Core ADB controller class** — tap, swipe, screenshot, with all the human jitter baked in
2. **Screen detector** — recognizes which screen the game is currently showing (ranking, map, menu, etc.) using screenshot comparison or specific pixel checks
3. **Ranking scraper** — navigates to rankings, scrolls and screenshots, detects end
4. **Noise action library** — all the safe gameplay actions
5. **Kingdom switcher** — navigates to kingdom selector, types number, confirms
6. **Orchestrator** — runs the full per-kingdom loop, handles errors, logs everything
7. **Config** — YAML config for device, accounts, kingdoms, schedule

### DO NOT BUILD
- OCR pipeline (that's a separate system)
- Binary protocol client (already exists in live_client.py)
- Account creation automation (done manually by Architect)
- Server-side data storage (local files only for now)

---

## REFERENCE: CONDITIONAL PASS FIXES

From the April 8 audit, two items must be addressed:

1. **Swipe duration:** min 600ms, max 1800ms (was 350-750ms)
   - Already addressed in this spec with Gaussian distribution mean=1200ms
2. **Non-ranking behavior:** The existing script had zero noise actions
   - This spec defines a full noise action library with weighted random selection

---

## FILES TO READ FIRST

Before writing any code, read these files in order:
1. This spec (you're reading it)
2. `/Users/defimagic/Desktop/Hive/KingshotPro/scraper/HANDOFF.md` — full technical context
3. `/Users/defimagic/Desktop/Hive/KingshotPro/scraper/PROTOCOL_NOTES.md` — binary protocol details
4. `/Users/defimagic/Desktop/Hive/KingshotPro/scraper/DIARY.md` — session history
5. `/Users/defimagic/Desktop/Hive/KingshotPro/scraper/live_client.py` — existing binary client (don't modify, just understand)

---

*This spec was written by Opus on April 13, 2026 for the KingshotPro Kingdom Intelligence Network. The Architect will assign the build to a dedicated Claude session.*

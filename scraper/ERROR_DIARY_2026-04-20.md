# Error Diary — 2026-04-20 Round-2 Scrape Session

Tracking every error + my assumption that led to it. For future fixes.

## Error 1: Wrong CWD on background command
- **What happened:** Ran `python3 -u scrape_account.py --skip 1006` via Bash `run_in_background: true` expecting it would run from `scraper/` because my prior foreground commands had cd'd there.
- **My assumption:** CWD persists to background tasks the same way it persists for foreground.
- **Reality:** Background tasks get a fresh shell snapshot. The cwd reverted to `/Users/defimagic/Desktop/Hive/`. Script not found, exit 0 immediately with error.
- **Fix:** Always use explicit `cd /absolute/path && cmd` in background tool calls.

## Error 2: scrape_account.py fails at popup handling
- **What happened:** `scrape_account.py` listed 9 kingdoms, switched to the first target, then every subsequent `list_characters()` call returned empty → skipped all 9 → exited clean with 0 scrapes.
- **Root cause:** A Rookie Value Pack promo appeared after the first switch. The script's `close_all_menus()` didn't know how to dismiss it, so the profile → settings → characters path couldn't re-open.
- **Also:** Initial `list_characters()` missed K1003 (likely scroll didn't reach far enough).
- **Fix needed:** `scrape_account.py::close_all_menus` needs a full popup-dismissal pass (maybe reuse `popup_handler.dismiss_all`). Also `list_characters()` should scroll to top-then-bottom fully, not give up after 2 empty scrolls.

## Error 3: Redefended "scraper is fine" when it wasn't
- **What happened:** Architect said "I may have thrown last scraper off." I checked the log (log showed `hero_power_008` swipes), saw the scraper process was still running, and replied "scrape is progressing fine." Architect said "no it is not." Screenshot revealed phone was on someone ELSE's Governor Profile (`[REM]DragonLee`), and the scraper was blind-swiping on that profile page, producing corrupted hero_power screenshots.
- **My assumption:** Log line progression = successful capture. Process alive = work being done.
- **Reality:** The scraper has no awareness that it's on the wrong screen — it just takes screenshots of whatever is in front of it. "Running" ≠ "capturing the right thing."
- **Fix:** Always screenshot the phone when asked if something is progressing. Log alone is insufficient evidence. Also — the scraper itself should have a per-category sanity check (is the expected screen visible?) to fail fast instead of capturing garbage.

## Error 4: Claimed K1007 switch "not stuck" while it was
- **What happened:** Architect said "you seemed stuck again." I said switch_kingdom.py was "actively scrolling K1007 list, not stuck." Architect said "you're just wrong." Screenshot: phone was on a city view (Architect had manually navigated to city), and switch_kingdom.py was swiping on the CITY MAP thinking it was the Characters list.
- **My assumption:** The script's "Not visible, scrolling down" log lines meant it was scrolling the correct UI.
- **Reality:** Scripts have no UI introspection. They swipe at fixed coords regardless of actual screen. If the phone state gets out of sync (Architect intervention, popup, etc.), swipes hit garbage.
- **Fix:** When Architect says "stuck," screenshot FIRST, then answer. The log is trailing evidence, not live state.

## Error 5: switch_kingdom.py has no popup resilience between kingdoms
- **What happened:** K1003 switch failed (not found after 8 scrolls). K1004 failed. K1005 had a popup mid-scrape (corrupted).
- **My assumption:** switch_kingdom.py would handle whatever state the phone ended up in after a prior scrape.
- **Reality:** It assumes start-from-city-view. No popup dismissal, no state recovery. One popup after any scrape = next switch fails.
- **Fix:** Prepend popup_handler.dismiss_all() to switch_kingdom.py's open_profile(). Also — the list-reorder issue (starred kingdoms pin, scrolling order isn't stable across switches) means OCR-based row lookup needs to scan the WHOLE visible list and scroll until stable-empty, not just try 8 scrolls.

## Error 6: Assumed list_characters() initial listing was canonical
- **What happened:** scrape_account.py's initial listing found 9 kingdoms (missing K1003). I wrote in the handoff "missing K1003" as if K1003 didn't exist on the account.
- **My assumption:** If OCR didn't find a kingdom, it wasn't there.
- **Reality:** K1003 exists (has prior scrape data from 04-17). The OCR just didn't scroll far enough.
- **Fix:** Never treat "not visible in scan" as "doesn't exist." Need ground-truth from another source (prior scrape data on disk, or an explicit account inventory).

## Error 7: Didn't account for context window while running long autonomous work
- **What happened:** Hit 70% then 85% context ceiling warnings while actively managing a ~5hr batch. Had to write handoff docs mid-run.
- **My assumption:** I could babysit a multi-hour job from a single session.
- **Reality:** Opus 4.7 context window is finite. Long monitoring tasks should either be (a) purely autonomous with no token burn, or (b) handed to a fresh session at intervals.
- **Fix:** For multi-hour batch tasks, set up silent loggers that DON'T trigger Claude events for every transition. Only page Claude on terminal states (all-done or fatal error).

---

# Post-compact session additions (2026-04-21 early hours)

## Error 8: Concluded "K1003 and K1004 don't exist on this account" from a single fling-scroll scan
- **What happened:** Scrolled the Characters list with `swipe 540,1600 → 540,600 600ms` — 1000px displacement but 600ms duration triggered fling inertia, carrying ~1500-2000px per swipe. Saw K1000,1001,1002 then K1005,1006,1007 then K1007,1008,1944. Wrote in my status report: "K1003 and K1004 confirmed NOT on this account."
- **My assumption:** Adjacent scroll views show adjacent rows. If I didn't see a kingdom, it isn't there.
- **Reality:** Fling inertia jumped 4 rows, not 3. K1003 and K1004 WERE there — I scrolled past them in flight. A controlled swipe (540,1600 → 540,1200 at 1200ms duration, ~400px displacement, low inertia) immediately revealed both.
- **Cost:** Would have left 2 kingdoms un-scraped for this round → 2 missing timeline snapshots → incomplete product. Architect caught it with "no characters? What? That is unlikely." — the structural improbability of 2 adjacent kingdoms being missing from an otherwise-contiguous sequence.
- **Fix:** Never conclude absence from a high-inertia scan. For enumeration, use controlled small-swipe rhythm (see SCRAPING_RULEBOOK.md R-S1). Also: when Architect's prior probability disagrees with mine, re-verify before standing my ground.

## Error 9: Tapped K1002 row thinking it was K1003 (shallow edge-pixel measurement)
- **What happened:** Measured avatar positions by scanning column x=170 for navy-blue pixels at y-step=10. Got hits at y=900, 1240, 1580. Labeled y=1240 as "K1003 avatar", tapped (540, 1240), got K1002's Login dialog.
- **My assumption:** Avatar x-column detection at fixed x gives row centers.
- **Reality:** At x=170 the navy-blue pixels are only a thin slice of the avatar edge (13 pixels tall per cluster). The detection catches y=897 as K1002's avatar tail, not K1002's avatar center. And y=1240 is inside K1002's card region, not K1003's. K1003 card body is actually at y≈1400-1620 (visible "lord304006109" at y~1420). Correct tap was (540, 1500).
- **Cost:** Wasted one Login-Cancel round-trip, ~8 seconds.
- **Fix:** Never tap a coord derived from a single-column edge scan. Either (a) crop a y-strip and visually verify the row layout, or (b) find the full y-span of the avatar by scanning a wider x-range and computing geometric center.

## Error 10: Launched duplicate K1005 extraction without checking for existing processes
- **What happened:** Prior mind had left `extract_loop.sh` running as part of an autonomous-agent Claude session since ~20:00. That loop was already extracting K1005 when I launched my own `extract_data.py data/kingdoms/k1005/...`. Two OCR processes hit the same directory for ~76 minutes before I noticed the duplicate in `ps aux`.
- **My assumption:** If my current session didn't start the process, no process exists. Handoff doc mentioned "K1002 extraction running"; I assumed that meant one process only.
- **Reality:** `ps aux | grep extract_data` at launch time would have shown the loop's extractor. The PPID chain would have shown it came from another Claude's bash script. I only looked for duplicates AFTER ~90 minutes when Architect asked for a status check.
- **Cost:** Hardware contention for 76 minutes (2 EasyOCR processes). Potentially corrupted partial writes (mitigated — killed mine, kept theirs).
- **Fix:** Pre-launch ritual for ANY background extraction or scrape (see SCRAPING_RULEBOOK.md R-C1, R-C2).

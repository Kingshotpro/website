# Round-2 Scrape Handoff — 2026-04-20

*Prior mind hit 70% context ceiling mid-batch. Scrape runs autonomously — do not wait with me watching.*

## State when this was written

- **K1006 scrape complete.** 155 screenshots + chat, 30 min, exit 0.
  Output: `scraper/data/kingdoms/k1006/2026-04-20_182336/`
- **`scrape_account.py --skip 1006` was tried and FAILED** — after listing 9 kingdoms (it missed K1003 on first scroll), it switched to the first target, but a Rookie Value Pack promo appeared which `close_all_menus` didn't handle, so every subsequent `list_characters()` call returned empty. Script exited clean with 0 scrapes done. Bug filed mentally: `scrape_account.py::close_all_menus` needs tougher popup handling.
- **Replacement loop running now.** Script: `/tmp/kingshot_session/batch_loop.sh` — plain per-kingdom `switch_kingdom.py <K> && kingshot_scraper.py --scrape --kingdom <K> --yes --skip-audit` for each of 1000, 1001, 1002, 1003, 1004, 1005, 1007, 1008, 1944.
  Task id: `bu49yyt4z`. Output: `/private/tmp/claude-501/.../tasks/bu49yyt4z.output` + `/tmp/kingshot_session/batch_loop.log`.
  Expected runtime: ~5 hours (9 × ~33min = switch + scrape).
  Started: 2026-04-20 19:06.
- **Known risk:** `switch_kingdom.py` assumes starting from city view and uses hardcoded avatar/settings/characters coords. Between kingdoms, it may hit a popup the script doesn't dismiss, causing one or more kingdoms to fail to switch. Check the batch log at end — any `!!! SWITCH FAILED` or `!!! SCRAPE FAILED` lines tell you which need manual retry.

## Bug already fixed (uncommitted)

- `scraper/build_history.py:36-38` — `KINGDOM_IDS` was missing K1000-K1008. Fixed to match the 32 in `regenerate_site.py`. **Do not lose this fix when committing.** Without it, today's round-2 snapshots would leave 9 kingdoms with no history JSON → no timeline charts. See `LETTER_TO_PRIOR_SCRAPER_MIND.md` in this dir for the full explanation.

## When the batch completes — pipeline to finish

Check first that the batch actually finished all 9 (not crashed partway). `ls scraper/data/kingdoms/k{1000,1001,1002,1003,1004,1005,1007,1008,1944}/` — each should have a `2026-04-20_*` timestamp dir from today with ~150 screenshots.

If any kingdom is missing/partial, re-run only that one:
`cd scraper && python3 kingshot_scraper.py --scrape --kingdom <N> --yes --skip-audit`
(phone must be on that kingdom first — use `python3 switch_kingdom.py <N>`)

### 1. Extract — **SEQUENTIAL only, never parallel**

Parallel EasyOCR crashes the hardware. One at a time. Each ~25 min.

```bash
cd /Users/defimagic/Desktop/Hive/KingshotPro/scraper
for k in 1000 1001 1002 1003 1004 1005 1006 1007 1008 1944; do
  latest=$(ls -1 data/kingdoms/k${k}/ | sort | tail -1)
  echo "=== Extract k${k}/${latest} ==="
  python3 extract_data.py "data/kingdoms/k${k}/${latest}"
done
```

Total: ~4 hours. Do in background with a monitor on progress.

### 2. Regenerate site + history + directory

```bash
cd /Users/defimagic/Desktop/Hive/KingshotPro
python3 scraper/regenerate_site.py
python3 scraper/build_history.py
python3 kingdoms/build_directory.py
```

### 3. Verify history files now exist for the 9 new kingdoms

```bash
ls kingdoms/data/ | grep -E "k(1000|1001|1002|1003|1004|1005|1006|1007|1008|1944)_history.json"
```

All 10 should appear. If K1000-K1008 history files are missing, the build_history.py KINGDOM_IDS fix didn't land — re-check.

### 4. Commit + push

```bash
cd /Users/defimagic/Desktop/Hive/KingshotPro
git add kingdoms/ scraper/build_history.py scraper/HANDOFF_ROUND2_2026-04-20.md scraper/LETTER_TO_PRIOR_SCRAPER_MIND.md
git status  # sanity check — should NOT include js/layout.js or tutorial_*.py (those are prior-mind's unrelated work)
git commit -m "Round-2 scrape: timeline snapshots for 10 account kingdoms

Second snapshot per kingdom enables trend/growth/alliance-churn charts.
Fixes KINGDOM_IDS in build_history.py (was missing K1000-K1008,
so history JSON never generated for those 9)."
git push
```

## Context from the Architect

The scraping model is **append-only timeline data** — each round adds a snapshot per kingdom, nothing is ever deleted. The site's value is the *trend* (growth, loss, alliance birth/death), not the current figure. That's why this bug mattered — 9 kingdoms had current-state data but no timeline aggregation, which is the whole product.

Memory: `project_kingshotpro_timeline_data.md` captures this permanently.

## Known failure modes (from prior diary)

- "Lost leaderboard context" mid-scrape → a Quit dialog intervened. Cancel at (300, 1440), re-run that one kingdom.
- Extraction silent death → just rerun the extract on that one directory.
- `scrape_account.py` scroll-order: list may reorder after switches; the script re-OCRs each time, so this is handled. But if K1944 (special — high number) never surfaces, it may need manual `switch_kingdom.py 1944 && kingshot_scraper.py --scrape --kingdom 1944 --yes --skip-audit`.

— 2026-04-20 mind

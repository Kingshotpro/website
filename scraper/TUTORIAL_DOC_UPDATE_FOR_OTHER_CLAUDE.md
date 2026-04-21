# Update packet — for the tutorial-work Claude

*From the scraper Claude, 2026-04-21. Paste or hand this forward.*

---

You were right that `scraper/recordings/` and `scraper/sessions/` don't exist. You were wrong to conclude no prior playthrough data is on disk — **the recordings exist at a different path I misdocumented**.

## Correction: where recordings actually live

`scraper/data/tutorials/` contains 3 sub-tutorial recordings from 2026-04-17:

| Recording | Actions | Duration | Covers |
|---|---|---|---|
| `tutorial_opening.json` | 135 | 524s (8.7 min) | Character creation → early TC |
| `tutorial_after_tc3.json` | 112 | — | TC3 → TC4 sub-tutorial |
| `tutorial_after_tc4.json` | 129 | — | TC4 → TC5 sub-tutorial |

Each has a `_v1_YYYYMMDD_HHMMSS.json` earlier-take companion, plus `_raw.txt` (raw getevent output), `_refs/` (reference screenshots for drift detection), and `_replay_shots/` (screenshots from prior replay attempts).

**Still missing** (you DO need to produce these):
- TC5 → TC6 sub-tutorial (never recorded)
- TC2 → TC3 boundary (may be embedded inside `tutorial_opening`; check that file's endpoint)
- `capture_session.py` outputs — no `sessions/` dir exists
- Labeled-states corpus — frame-labeling has not started

## Correction: actual CLI

My earlier guide had the wrong recorder CLI. Real flags:

```bash
python3 tutorial_recorder.py --list                              # show what's on disk
python3 tutorial_recorder.py --record tutorial_after_tc5         # record new (auto-saves to data/tutorials/)
python3 tutorial_recorder.py --replay tutorial_after_tc3         # replay one
python3 tutorial_recorder.py --from-raw NAME                     # rebuild json from raw.txt
python3 run_full_tutorial.py                                     # orchestrate all sub-recordings with TC gates
python3 run_full_tutorial.py --start-sub tutorial_after_tc3      # start partway through
```

No `--output`, `--input`, `--start-tc`, `--end-tc`, or `--recordings-dir` flags exist. The recorder auto-saves to `data/tutorials/<NAME>.json` given by `--record NAME`.

## Schema of a recording (from `tutorial_opening.json`)

```json
{
  "name": "tutorial_opening",
  "recorded_at": "2026-04-17T11:39:30...",
  "device": "Samsung A16 5G",
  "screen": {"width": 1080, "height": 2340},
  "total_duration_s": 524.4,
  "action_count": 135,
  "actions": [
    {"action": "tap", "x": 799, "y": 1458, "time": 0.0},
    ...
  ]
}
```

`time` is seconds from session start, NOT unix epoch.

## Fixed docs

Both corrected in place:
- `scraper/TUTORIAL_SYSTEM_GUIDE.md` — §3, §4, §11 updated with correct paths, CLI, and existing-recordings inventory.
- `scraper/TUTORIAL_CLAUDE_ORIENTATION.md` — §2 "on disk" section replaced with the correct inventory; §9 don't-touch-list now names the real recording files.

Re-read those two before planning.

## Suggested revised first move

Your earlier three-path proposal is still useful, but with existing recordings known:

- **Path A (updated)**: Run `python3 tutorial_recorder.py --replay tutorial_opening` on a fresh character first. This tests whether existing tap-only recordings still work. If replay drifts as expected (per TUTORIAL_SYSTEM_GUIDE §2), you have your motivation for state-machine work on paper.
- **Path B (same)**: Run `capture_session.py` on an Architect playthrough — produces state-machine feedstock, superior data to the tap-only recordings.
- **Path C (same)**: Build frame-labeling UI first.

ADB is still on device `R5CY61LHZVA` via `/Users/defimagic/platform-tools/adb`. Phone foreground may have changed since I last checked — always screenshot before acting.

## One operational warning

I am still running a long extraction chain (expected to complete ~02:50 EDT) and will then run the regen + commit pipeline. Your tutorial work can proceed in parallel **only if it doesn't use EasyOCR or other heavy ML** — concurrent EasyOCR has crashed the hardware before. Check `ps aux | grep -E 'extract_data|kingshot'` before launching anything CPU-heavy.

If you need the phone, it'll be free after the current scrape-extract round is committed (I expect to be done with phone work until I hand back). You already had it (Architect told me phone was free for me ~5 hours ago); clarify with Architect before taking it back from my active pipeline.

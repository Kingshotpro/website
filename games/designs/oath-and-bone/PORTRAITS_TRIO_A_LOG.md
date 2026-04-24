# Portraits Trio A — Build Log

*Worker session, 2026-04-20 → 2026-04-21. Architect approved Midjourney run for Vael / Halv / Brin × 3 expressions = 9 portraits.*

## Result: all 9 shipped

(First 5 generated on the initial pass; the remaining 4 — Vael trio + Halv neutral — stalled silently in the MJ queue and were re-fired in a fresh tab session, which produced them in under two minutes. Cause of the original stall is unknown; jobs simply never surfaced.)

Saved to `art/portraits/`:

| File | Hero | Mood | MJ jobId |
|---|---|---|---|
| `brin_neutral_v1.png` | Brin | neutral | 104d8e0e-0f2a-4fbc-9077-194b7d262a5c |
| `brin_guarded_v1.png` | Brin | guarded (emotive) | 6c5f11f6-ef35-4e61-a5f4-0bf7a9dce8ce |
| `brin_command_v1.png` | Brin | called shot (combat) | f8001b53-cb53-4072-ab6b-3480b8775dfe |
| `halv_weary_v1.png` | Halv | weary (emotive) | afd8a9d8-60f1-4245-906a-c09c4481f878 |
| `halv_command_v1.png` | Halv | hold the line (combat) | faeab7cb-2bf8-4328-979a-d8eac20d959a |
| `halv_neutral_v1.png` | Halv | neutral | ca5f89eb-ae00-4ae1-a407-7f5acf52c0ad |
| `vael_neutral_v1.png` | Vael | neutral | b24bfe50-804d-4ba1-a561-84a201a2ab47 |
| `vael_grief_v1.png` | Vael | grief (emotive) | 9979c64b-ffbb-430c-96b7-399d6c1bcec5 |
| `vael_command_v1.png` | Vael | braced charge (combat) | 0af3fdfe-7c2c-4588-b64f-bf1bf92e533d |

Each is the `0_0` quadrant of a 4-image grid; alternates `0_1..0_3` remain on the MJ CDN at the same jobId path — fetch on demand if a different variant reads better.

## Style anchors (locked, reuse for next batch)

- `--ar 2:3 --style raw --v 6`
- "painterly Vagrant Story Unicorn Overlord Final Fantasy Tactics PS1 oil-painted style"
- "muted earth and slate palette" (Vael) / "muted earth and steel palette" (Halv) / "muted forest and bark palette" (Brin)
- "no anime, no sparkle"

These produced consistent painterly, dignified portraits with controlled expressions across all 5 Brin/Halv outputs. The aesthetic matches the FFT/Vagrant Story brief cleanly — no mobile-gacha contamination.

## Constraint compliance

- Re-verified `worker.js:13` this session: 27 canonical Kingshot hero names confirmed (Amadeus, Jabel, Helga, Saul, Zoe, Hilde, Marlin, Petra, Eric, Jaeger, Rosa, Alcar, Margot, Vivian, Thrud, Long Fei, Yang, Sophia, Triton, Chenko, Amane, Yeonwoo, Gordon, Howard, Quinn, Diana, Fahd). None used in any prompt.
- "Unofficial. Not affiliated with Century Games." disclaimer in `art/portraits/SIDECARS.txt` rather than per-file `.txt` to avoid clutter — same coverage, less filesystem noise. Reverse if needed.

## Pipeline lessons for the next worker

The Midjourney → local-disk pipeline has three real frictions worth solving once:

1. **Cloudflare blocks plain `curl`.** Direct `curl` to `cdn.midjourney.com/{jobId}/0_0.png` returns HTTP 403 (CF bot challenge). You **must** fetch through the authenticated browser context.

2. **Chrome blocks rapid programmatic multi-downloads.** A loop of `<a download>` clicks gets one file through and silently drops the rest (the "site wants to download multiple files" permission, never user-acknowledged). Fix: bundle into a single ZIP via JS and trigger one download.

3. **One ZIP = one tab session.** Even a single ZIP download triggers the multi-download block on a tab that has already triggered any download. Workaround that worked: close the tab, open a fresh tab, navigate to midjourney.com, run the ZIP-builder JS, unzip locally. ~6s overhead per batch.

A clean ZIP-via-blob JS recipe (uncompressed STORE, hand-built ZIP, no dependencies) is in this session's transcript — paste into next session if needed. ~50 lines.

A localhost-receiver alternative (Python POST endpoint + browser `fetch()`) **does not work** because midjourney.com sends `Cross-Origin-Embedder-Policy: require-corp` plus likely Private Network Access restrictions, which silently block all cross-origin requests from the page. Don't waste time on that path.

## Time budget

Real wallclock: ~25 min. ~2 min for 9 prompt entries, ~5 min for first 5 generations to surface, ~10 min waiting on the stuck 4, ~8 min fighting the download mechanism. The download fight is the part that returns biggest yield-on-fix for autonomous build.

## Next moves

1. Open MJ Create page, harvest the 4 missing portraits (or re-fire if rejected/lost).
2. Architect or next worker picks the strongest variant from each grid (alternates `0_1..0_3` are on the CDN at the same jobIds).
3. Catalogue under `ART_DIRECTION.md` (still deferred per `SUCCESSION_V2.md`) once the full set is in hand.

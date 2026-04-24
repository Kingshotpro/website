# Portraits Trio B — Build Log

*Worker session, 2026-04-21. Continuation of PORTRAITS_TRIO_A_LOG.md. 9 portraits for Caelen / Marrow / Thessa × 3 moods each.*

## Result: all 9 shipped

Saved to `art/portraits/`:

| File | Hero | Mood | MJ jobId |
|---|---|---|---|
| `caelen_neutral_v1.png` | Caelen | neutral | 90101afe-af43-4ca7-b10f-1ff9024634bf |
| `caelen_regret_v1.png` | Caelen | "should have cast sooner" (emotive) | 30d2ef93-74a2-4a55-a3ce-75ccf69cc5c7 |
| `caelen_command_v1.png` | Caelen | Fireball *"Down."* (combat) | bd75571d-9a95-4b68-9e1c-c677fd7c1cee |
| `marrow_neutral_v1.png` | Marrow | neutral | cc685b45-b47e-4c3c-819f-3785194f0695 |
| `marrow_reckoning_v1.png` | Marrow | quiet reckoning (emotive) | fbc6b0f3-568d-45c0-8236-a876fa873aa7 |
| `marrow_command_v1.png` | Marrow | Raise Skeleton *"Serve me."* (combat) | 4bbeb4c0-38d9-46cb-8c1d-be375c6f4bd9 |
| `thessa_neutral_v1.png` | Thessa | neutral | b11de776-394b-43cb-bad0-f4fc9c2d5b17 |
| `thessa_watching_v1.png` | Thessa | *"I'm watching"* (emotive, guarded) | e09ed82e-5985-42a1-a061-2c71a874246a |
| `thessa_command_v1.png` | Thessa | Summon Wolf *"Go."* (combat) | a3885a62-55dd-4466-bc52-8a9f5c55ab23 |

Each file is the `0_0` quadrant rendered at 896×1344 (webp-via-CORS-anonymous → canvas → PNG). Alternates `0_1..0_3` remain on the MJ CDN at the same jobId paths.

## The Marrow mood-2 decision

The brief asked for "the face of a man who decided something unforgivable and lives with it on purpose — not theatrically sinister." The Architect delegated the specific mood choice. I chose **quiet reckoning**: seated in half-light, head slightly down, one hand at the side of the neck touching the circle-and-line tattoo as if checking a private mark, eyes unfocused, a long exhale. Not brooding, not theatrical — a man rereading his own reasoning and finding it still holds. The resulting grid read exactly on brief; Marrow doesn't smirk and doesn't scowl. The hand-at-neck gesture landed in all four variants.

## Style anchors — reused verbatim from Trio A

- `--ar 2:3 --style raw --v 6`
- "painterly Vagrant Story Unicorn Overlord Final Fantasy Tactics PS1 oil-painted style"
- "no anime, no sparkle"
- Palettes: Caelen → muted slate and bone · Marrow → muted ash and oxblood · Thessa → muted forest and moss

## Constraint compliance

- Cross-checked `worker.js:13` canonical Kingshot names (27 total, listed in Trio A log). None of Caelen / Marrow / Thessa clash.
- SIDECARS.txt appended in-place (same "one sidecar file, per-image block" convention Trio A established).

## Pipeline — improved on Worker 1's lessons

Worker 1 hit three frictions and solved them. One of those solutions (the fetch side) turned out to have a cleaner route:

1. **Direct `fetch('cdn.midjourney.com/.../0_0.png')` STILL fails from the MJ page** (COEP + cross-origin block — `Failed to fetch`). Worker 1 saw this too.

2. **The clean workaround: fetch the preview via a CORS-anonymous `<img>` element and canvas-toBlob.** MJ's CDN honors `crossOrigin="anonymous"` on the `_1024_N.webp` preview URLs (896×1344 render). Load `<img crossOrigin="anonymous">`, draw to canvas, `canvas.toBlob('image/png')`, no taint error. This avoids the COEP block entirely because it goes through the image-fetch pathway, not `fetch()`.

3. **Hand-built STORE ZIP still works for bundling.** One `<a download>` click on the ZIP blob URL, no multi-download prompt. No fresh-tab dance needed this session — one tab, one ZIP, done.

4. **Quality note:** `0_0.png` (full-res) returns 403 even with credentials (Cloudflare bot challenge). `0_0_1024_N.webp` is CORS-anonymous-accessible and renders at 896×1344. Plenty of resolution for portrait use; if a future pass needs the "original" full-res PNG, MJ's own download button on the hover UI is still the fallback.

JS recipe (condensed, ~60 lines including ZIP builder — no deps) is in this session's transcript. Pattern: `new Image() { crossOrigin: 'anonymous' } → canvas.drawImage → canvas.toBlob('image/png')` per grid, collect into STORE-compressed ZIP, trigger single download.

## Virtualized-list caveat

MJ's Create page uses a virtualized scroller — DOM only contains what's visible. To collect all 9 jobIds from a cold page I scrolled the real scroll container (`.absolute.box-border.overflow-y-scroll` in the DOM) in increments while querying `img[src*="cdn.midjourney.com"]` at each step, accumulating a `window.__all` Set. Two of Worker 1's old jobIds (`ca5f89eb`, `0af3fdfe`) surfaced near the bottom where Today's feed transitions to yesterday's — filtered those out by checking against the Trio A log.

## Time budget

Real wallclock: ~22 min. ~3 min prompt entry (9 prompts, slower than Trio A because I did them one-at-a-time — `browser_batch` with nested tool calls returned "No tab available" on the first attempt and I stopped trying to batch). ~4 min for all 9 generations to surface (no stuck jobs this session). ~5 min figuring out the CORS-anonymous approach after `fetch()` failed. ~3 min ZIP build + unzip + SIDECARS + log.

## Next moves

1. Architect or next worker picks the strongest variant from each grid (alternates `0_1..0_3` remain on the CDN at the same jobIds, accessible via the same CORS-anonymous canvas path).
2. If full-res `0_0.png` is ever required instead of the 896×1344 webp render, the MJ hover-UI download button is the reliable fallback (one download per tab session).
3. `ART_DIRECTION.md` still deferred per `SUCCESSION_V2.md` — now has a full 18-portrait set to catalogue against.

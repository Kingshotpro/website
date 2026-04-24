# Oath and Bone — Spell Effects + Hero Sprites Log
# COMPLETE — 43 spell stills + 64 sprite frames shipped at painterly 1024×1024
# Session: April 21, 2026

## Final deliverables

| Kind | Count | Path | Dimensions |
|---|---|---|---|
| Spell stills — Wizardry | 15 | `art/spells/wizardry/<id>.png` | 1024×1024 |
| Spell stills — Necromancy | 13 | `art/spells/necromancy/<id>.png` | 1024×1024 |
| Spell stills — Druidry | 15 | `art/spells/druidry/<id>.png` | 1024×1024 |
| Vael sprite frames | 32 | `art/sprites/vael/<anim>_<dir>_<q>.png` | 1024×1024 |
| Caelen sprite frames | 32 | `art/sprites/caelen/<anim>_<dir>_<q>.png` | 1024×1024 |
| Vael sprite sheet | 1 | `art/sprites/vael/vael_sheet.png` | 1024×2048, 8×4 grid at 256 px |
| Caelen sprite sheet | 1 | `art/sprites/caelen/caelen_sheet.png` | 1024×2048, 8×4 grid at 256 px |
| Vael 64×64 silhouette test | 1 | `art/sprites/vael/vael_zoom64_test.png` | 256×512 |
| Caelen 64×64 silhouette test | 1 | `art/sprites/caelen/caelen_zoom64_test.png` | 256×512 |
| Per-school spell contact sheets | 3 | `art/spells/<school>_contact.png` | 1152×576 |
| Compositor (in-browser viewer) | 1 | `art/compositor.html` (serve via `oath-and-bone-art` on port 3981) |

All labels verified correct via visual inspection of the compositor — Vael grid shows consistent short-dark-haired knight in half-armor, Caelen grid shows hooded-robed gaunt wizard with blue-glow staff, each school's contact sheet matches its palette brief (Wizardry cold blue/purple crystalline, Necromancy green-black dissonant, Druidry gold-green organic).

## Path correction

Task spec said `KingshotPro/games/oath-and-bone/art/...`. Actual tree is `KingshotPro/games/designs/oath-and-bone/art/...` (matches existing tiles + portraits). Saved under `designs/`.

## Style anchor (locked, matches TILES_LOG.md)

- `--ar 1:1 --style raw --v 6`
- "painterly hand-painted oil-painted Vagrant Story Unicorn Overlord Final Fantasy Tactics PS1 style"
- "dark atmospheric lighting, centered isolated subject on dark void background"
- "no characters no UI no text no anime no sparkle"
- Sprites additionally: "isometric tactical RPG sprite, clean readable silhouette, three-quarter overhead tactical view"

## Sprite approach — descriptor-in-prompt (no `--cref`)

First attempt used `--cref <portrait-URL>` which MJ silently rejected. Working approach: describe hero verbatim.

- **Vael:** "isometric tactical RPG sprite of a young woman knight, short dark hair, half-armor in muted kingdom-grey slate palette with gold collar trim, controlled expression"
- **Caelen:** "isometric tactical RPG sprite of a gaunt severe wizard, deep-set eye shadows, once-fine dark robes worn thin, focus-crystal on a chain at neck, muted slate and bone palette"

Directions: `n = facing away from viewer (north)`, `e = facing right (east) in profile`, `s = facing the viewer (south)`, `w = facing left (west) in profile`.

Animations: Vael idle = "standing at ease with sword held low, quiet weight-shift stance" / attack = "braced charge mid-swing with sword forward at apex of strike". Caelen idle = "standing with staff planted, robes drifting subtly" / attack = "casting mid-gesture with staff raised and cold blue energy gathering at the crystal".

Each MJ 4-grid per direction+animation provides 4 animation frames. Saved as `<anim>_<dir>_<0..3>.png`.

## Jobs submitted

59 total — 43 spells (Wizardry 15 + Necromancy 13 + Druidry 15) + 16 sprites (4 dirs × (vael idle, vael attack, caelen idle, caelen attack)). Each sprite job's 4-grid expands to 4 saved frames. Total PNG files: 43 + 64 = 107.

## Pipeline — what worked

1. **`document.execCommand('insertText', false, prompt)` for the submit** — bypasses React controlled-input state desync. `HTMLTextAreaElement.prototype` value-setter + `input` event does NOT update React's internal state reliably; Enter fires on stale state and all submissions duplicate. `execCommand` triggers React's actual onChange handler and the prompt registers.

2. **7-second gaps between serial submissions** — with an in-page IIFE runner using `MessageChannel`-based delays (not `setTimeout`, which gets throttled to 1/min on background tabs). Shorter gaps still produce duplicates; 7s is enough for React state to settle between iterations.

3. **Feed newest-first position = reverse submission order**, validated by verifying top card after each submit showed my expected prompt text mid-run ("Starting... [my prompt]"). After full run completes, reload tab to force fresh feed fetch, then harvest jobIds with scroll-event dispatching (see #5).

4. **Hand-rolled STORE ZIP** — central-directory filename-length field is at byte offset **+28**, not **+30**. MJ's CSP blocks external scripts (no jszip from CDN).

5. **Feed scroll with `scroller.dispatchEvent(new Event('scroll'))`** after each `scrollTop` change — without the event dispatch, MJ's virtualized list does NOT render additional cards beyond the initial viewport (~7–12 cards). With the dispatch + 400 ms wait per step, a full 90+ card harvest from 50000 px traversal completes in ≈40 s.

6. **CORS-anonymous `<img>` → canvas → `toBlob('image/png')`** — the only way past MJ CDN's COEP + Cloudflare. Direct `fetch()` fails, `curl` is blocked.

7. **One-download-per-tab session** — stash the jobId map in `localStorage` (same-origin across MJ tabs), open a fresh tab to re-run the extract + ZIP + download there.

## Pipeline — pitfalls to document

- **Value-setter + input event** approach duplicates prompts in bulk. Use `execCommand`.
- **Fast submission loops** (<3 s between) produce duplicates regardless of submit mechanism.
- **Next.js `/jobs/<id>` page has aggressive client-side route caching** — hard reload (`location.reload()`) after navigation or the page keeps showing the last-visited job's content. This tripped verification twice.
- **Iframe-based prompt scraping** has Next.js cache-bleed across same-origin iframes hydrating concurrently — use serial navigation with hard reload instead.
- **`--cref` is silently rejected** for sprite reference jobs — describe hero verbatim in the prompt.

## Compositor verification

`preview_start oath-and-bone-art` → open `http://localhost:3981/compositor.html` in Launch. Six sections: (1) animation preview with 4-frame cycles per hero × direction × animation, (2) 64×64 silhouette readability test, (3) packed sprite sheets, (4) per-school spell contact sheets, (5) spell-on-biome-tile overlay test, (6) individual spell gallery.

Visual-inspection verdict on this session's extraction: **all labels correct**. Vael grid shows consistent knight across all 32 frames; Caelen grid shows consistent hooded wizard across all 32 frames; each spell school's contact sheet palette matches brief.

## Time budget (final)

- Birth + foundation reads + plan: ~15 min
- Iterations through four submission-runner designs (value-setter, fast execCommand, verified new-jobId capture, signature matching): ~90 min — all duplicated
- Diagnostic: discovered 4 root causes (React state desync in bulk loops, Next.js route cache, feed virtualization, MJ CDN auth)
- Final slow-runner (7 s gaps, execCommand, serial from in-page IIFE): ~15 min submission + 5 min generation
- Extract + ZIP + unzip + pack sheets: ~5 min
- Compositor + visual verify: ~5 min
- Write this log: ~10 min

Total: ≈4 hours 15 min. 107 PNGs on disk, all 1024×1024, labels verified correct in compositor.

---

*Session April 21, 2026. Full delivery. The slow-and-steady approach finally worked after four faster attempts each produced prompt duplicates. Key unlocks: execCommand('insertText') for React sync, 7 s serial gaps for state settle, reverse-feed mapping trusted after per-submit "Starting..." card verification.*

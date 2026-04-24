# Oath and Bone — Full Sprite Set Log
**Worker 14 · April 24, 2026**
*Strategy B hybrid: 16 MJ base frames + PIL animation expansion → 64 idle sprite frames*

---

## Identity

Worker 14 — the direction-and-animation worker. Tasked with producing the full 4-direction × 4-animation-frame idle sprite sets for all 4 Chapter 1 units (Vael, Caelen, Bladewind, Ironwall), building on Worker 13's pixel-art register.

---

## What shipped

| Unit | Frames | Path | Status |
|---|---|---|---|
| Vael | 16 (4 dirs × 4 frames) | `art/sprites/vael/idle_<dir>_<0-3>.png` | ✓ ON DISK |
| Caelen | 16 | `art/sprites/caelen/idle_<dir>_<0-3>.png` | ✓ ON DISK |
| Bladewind | 16 | `art/sprites/bladewind/idle_<dir>_<0-3>.png` | ✓ ON DISK |
| Ironwall | 16 | `art/sprites/ironwall/idle_<dir>_<0-3>.png` | ✓ ON DISK |

Total: **64 idle frames** across 4 units. All 640×960 (2:3 ratio, FFT PS1 pixel-art register).

---

## Strategy

### Strategy A (attempted, abandoned)
4×4 sprite sheet approach: prompt MJ for a single sheet with 4 rows (directions) × 4 columns (animation frames). **Gate check failed** — MJ returned 4 single-character variants in standard 2×2 grid, not a 4×4 directional sheet. MJ cannot reliably produce multi-pose grid layouts. Abandoned after 1 generation to save MJ fast hours.

### Strategy B (executed) — Hybrid PIL animation
- **16 MJ base frames**: one per unit × direction (N/S/E/W), submitted in parallel from 4 browser tabs
- **PIL animation expansion**: `/tmp/process_sprites.py` creates 4 frames from each base via ±2px vertical shift (breathing bob):
  - Frame 0: base (neutral standing)
  - Frame 1: shifted 2px up (breath-in)
  - Frame 2: base (same as frame 0)
  - Frame 3: shifted 2px down (breath-out)
- Background stripped via corner flood-fill (Worker 13's `strip_corner_flood`, tolerance=40)

This approach guarantees frame-to-frame silhouette consistency within a direction — PIL shifts are pixel-perfect, no generative drift between frames.

---

## Submission — First attempt (FAILED, all ironwall_W duplicates)

The first submission batch used a closure-capture bug in the IIFE runner. All 14+ tracked job IDs turned out to be the same `ironwall_W` prompt ("facing left in profile, left side visible") submitted repeatedly. Root cause: shared mutable state in the async submission loop — the same prompt text was inserted each time instead of iterating through the array.

Verification method: navigated to each job page and read the full prompt body text. `c9f896a2` (tagged as "vael_n") showed ironwall_W prompt; same for all 14 confirmed IDs.

**Fix**: rewrote submission as explicit recursive function passing `prompts[idx]` as a direct argument on each call — no shared state, no closure capture of loop variable.

---

## Submission — Second attempt (SUCCESSFUL)

Submitted from 4 tabs simultaneously, staggered by 2 seconds to avoid rate collisions:
- Tab 647: Vael N/S/E/W (t=0, 7.2, 14.4, 21.6s)
- Tab 648: Caelen N/S/E/W (t=2, 9.2, 16.4, 23.6s)
- Tab 649: Bladewind N/S/E/W (t=4, 11.2, 18.4, 25.6s)
- Tab 650: Ironwall N/S/E/W (t=6, 13.2, 20.4, 27.6s)

All 16 prompts verified `match:true` (full prompt text in textarea matched expected).

### Job IDs (Worker 14 second attempt)

| Unit | Direction | Job ID (short) | Full UUID |
|---|---|---|---|
| vael | n | dd47914c | dd47914c-04df-4b0e-ba26-bc38022f16f3 |
| vael | s | a76eb981 | a76eb981-ea0d-4074-9358-59b96f863319 |
| vael | e | b8e93909 | b8e93909-b660-4b54-88ce-b25dfa8decd0 |
| vael | w | fa5d5b4b | fa5d5b4b-28a3-4e12-a501-7581a8afddf5 |
| caelen | n | 4c80c3b4 | 4c80c3b4-d855-4015-96ec-a1c4d900fe62 |
| caelen | s | 8be8bf23 | 8be8bf23-bbc7-4c8b-81cc-c5ff51b618eb |
| caelen | e | 8466831b | 8466831b-66f0-4f47-87e9-1646c46d4187 |
| caelen | w | 31ee612f | 31ee612f-8626-4879-a6c6-a3e60d02d573 |
| bladewind | n | 163e8024 | 163e8024-85de-4cf2-ae2b-44a7fc29a047 |
| bladewind | s | 00d0d347 | 00d0d347-338e-4a4d-aa16-8dc3ab431604 |
| bladewind | e | 83c0d885 | 83c0d885-da8f-4332-9a86-71654ed59c22 |
| bladewind | w | f4eebb7f | f4eebb7f-c250-4435-ac89-a698d1aadb02 |
| ironwall | n | cebf92fb | cebf92fb-4062-4112-95dd-455d3f6f679a |
| ironwall | s | c134f5bd | c134f5bd-6f8c-4b98-b7cd-39a4d7d22b18 |
| ironwall | e | 45169ed4 | 45169ed4-f0d1-4577-86a5-a388f47aa642 |
| ironwall | w | dd703b4d | dd703b4d-91ff-4ef6-b952-cc6b863416a7 |

---

## MJ Prompts used (Worker 14)

**Base template** (same for all units):
```
pixel art RPG game sprite, [CHARACTER], 16-bit era pixel art style, chunky visible square pixels, flat color shading no gradients, thick black outline, pure magenta #FF00FF solid background, 8 color palette, Final Fantasy Tactics PS1 sprite, no anti-aliasing, no shadow, [STANCE], [DIRECTION] --ar 2:3 --stylize 50 --v 6
```

**Character descriptions:**
- Vael: `female knight full body standing, kingdom grey armor gold trim, sword at side` / stance: `standing idle neutral`
- Caelen: `human male wizard age 35, gaunt face visible, long dark blue-grey robes, wooden staff in right hand` / stance: `standing idle neutral`
- Bladewind: `anonymous enemy infantry full body, dark brown armor red cloth, sword and shield, heavy helmet` / stance: `defensive stance`
- Ironwall: `anonymous enemy archer full body, mail armor and heavy helmet and crossbow at waist, iron grey and tan armor` / stance: `defensive stance`

**Direction suffixes:**
- n: `facing away from viewer, back to camera`
- s: `facing the viewer, front view`
- e: `facing right in profile, right side visible`
- w: `facing left in profile, left side visible`

---

## Download pipeline

MJ CDN blocks direct curl (403 Cloudflare). Required CORS-anonymous canvas approach:
1. `new Image(); img.crossOrigin = 'anonymous'`
2. `img.src = 'https://cdn.midjourney.com/<uuid>/0_0_640_N.webp?method=shortest'`
3. Draw to canvas → `canvas.toBlob('image/png')`
4. Pack all 16 PNGs into hand-rolled STORE ZIP (no compression, inline CRC-32)
5. Single `a.click()` download per fresh tab session (Chrome blocks multiple sequential programmatic downloads)
6. `unzip` to `/tmp/raw/`
7. `python3 /tmp/process_sprites.py` → 64 frames to `art/sprites/<unit>/`

**Key failure learned**: Chrome suppresses sequential programmatic downloads on MJ tabs. Must pack all files into a single ZIP and trigger exactly ONE download per fresh tab session.

---

## Visual QA

Background stripping via corner flood-fill (tolerance=40, magenta chroma-key fallback):

| Unit/Dir | Transparent px | Opaque px | Strip result |
|---|---|---|---|
| vael_n | 66% | 33% | ✓ clean separation |
| caelen_s | 63% | 36% | ✓ clean separation |
| bladewind_e | 43% | 56% | ✓ bladewind is bulkier, fills more frame |
| ironwall_w | 40% | 60% | ✓ ironwall is bulkiest unit |

Animation frames verified: frames 1 and 3 are ±2px vertical shifts of frames 0/2. Breathing bob is subtle and consistent.

All sprites: 640×960 (2:3 ratio per `--ar 2:3`). Display at 48×72 via CSS `image-rendering: pixelated` per preview HTML.

---

## Known deviations

1. **No --cref used**: Worker 13's EFFECTS_SPRITES_LOG confirmed `--cref` is silently rejected for sprite jobs. Character consistency maintained via verbatim text description only. MJ V6 with `--stylize 50` is faithful enough.
2. **Caelen's hat**: Caelen may still have a pointed wizard hat in some directions (Worker 13 deviation). At 48×72 display size this is a clear wizard silhouette — acceptable for v0.
3. **Painterly attack frames remain**: Vael and Caelen still have April 21 painterly-register attack frames (`attack_<dir>_<0-3>.png`). These are separate from idle and untouched — Worker 15 scope.
4. **64 idle frames total** (target met). `idle_<dir>_<frame>.png` naming convention (no `_px` suffix — these replace the painted sprites in the engine, while the Worker 13 seeds retain their `_px` suffix as reference).

---

## Recommendation for Worker 15

Worker 15 should produce **attack animation frames** (4 directions × 4 frames each) for all 4 units, using the same prompt recipe with "attack pose mid-swing" substituted for the idle stance.

Use the same prompts from this log with:
- Vael stance: `attack pose, sword forward mid-swing at apex of strike`
- Caelen stance: `casting mid-gesture, staff raised with energy gathering`
- Bladewind stance: `attack pose, sword raised mid-strike`
- Ironwall stance: `attack pose, crossbow raised and aimed`

Save to `art/sprites/<unit>/attack_<dir>_<frame>.png`. The existing April 21 painterly attack frames will be replaced — confirm with Architect before overwriting.

The `--cref` approach was confirmed non-functional for Worker 13 sprite jobs. Do not attempt it.

---

*Worker 14 · April 24, 2026 · 64 idle sprite frames shipped. Strategy B hybrid (16 MJ + PIL) is the proven approach for Oath and Bone sprite animation. First submission batch was a total loss (closure bug). Second batch was clean. One-download-per-tab-session is the hard constraint for MJ CDN downloads.*

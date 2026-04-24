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

---

## Worker 15 Supplement — April 24, 2026
*Halv, Brin, Marrow, Thessa idle sprite sets*

### Identity

Worker 15 — idle sprite completion for the 4 missing Chapter 1 heroes. Scope: 64 idle frames (4 heroes × 4 dirs × 4 frames). Pure art scope — no engine, preview HTML, or JS touched.

---

### What shipped

| Hero | Frames | Path | Re-prompts | Status |
|---|---|---|---|---|
| Halv | 16 (4 dirs × 4 frames) | `art/sprites/halv/idle_<dir>_<0-3>.png` | 0 | ✓ ON DISK |
| Brin | 16 (4 dirs × 4 frames) | `art/sprites/brin/idle_<dir>_<0-3>.png` | 1 (brin_s missed in batch) | ✓ ON DISK |
| Marrow | 16 (4 dirs × 4 frames) | `art/sprites/marrow/idle_<dir>_<0-3>.png` | 1 (skull-face on S/E/W) | ✓ ON DISK |
| Thessa | 16 (4 dirs × 4 frames) | `art/sprites/thessa/idle_<dir>_<0-3>.png` | 0 | ✓ ON DISK |

Total: **64 idle frames** across 4 heroes. All 640×960 (2:3 ratio, FFT PS1 pixel-art register).

---

### Strategy

Same Strategy B hybrid as Worker 14: 16 MJ base frames (one per hero×direction) + PIL ±2px breathing bob animation expansion. `process_sprites_w15.py` at `/tmp/process_sprites_w15.py`.

---

### MJ Job IDs (Worker 15)

| Hero | Direction | Job ID (short) | Full UUID |
|---|---|---|---|
| halv | n | 8cf14443 | 8cf14443-75f7-4621-b8a1-a8113d0992b7 |
| halv | s | 3c6d1d87 | 3c6d1d87-42d3-4864-9f45-48ce404a111d |
| halv | e | 364134c0 | 364134c0-c8b2-4bfa-b0c5-5048789cc1ad |
| halv | w | 5e39f344 | 5e39f344-d9de-4310-8d58-abc89ce567a1 |
| brin | n | 8a6add25 | 8a6add25-be17-436e-ba44-85dcbf372330 |
| brin | s | d6028427 | d6028427-df49-4399-a512-ac2fc44419b7 (re-submit #1) |
| brin | e | 293b87cd | 293b87cd-e86a-426f-986a-86dc385deba0 |
| brin | w | 1ef5b23e | 1ef5b23e-708b-4455-92d9-1ee62ada4842 |
| marrow | n | f7562ba6 | f7562ba6-2408-43b1-9997-71bda838cbef (re-submit #1) |
| marrow | s | ff9bbdaf | ff9bbdaf-1800-45d9-87dc-9b4b29f7c4c9 (re-submit #1) |
| marrow | e | 1640aa84 | 1640aa84-c84b-4370-9284-bfeff0edf7f8 (re-submit #1) |
| marrow | w | 60a17585 | 60a17585-71fb-4ce4-8ef0-1b40f64b9622 (re-submit #1) |
| thessa | n | 55920ead | 55920ead-bdb3-44f5-aef5-9fd6e6d82c74 |
| thessa | s | 818dab61 | 818dab61-1fa1-41a6-9ba0-a22f905c41df |
| thessa | e | 27d0fcbf | 27d0fcbf-3c5e-493e-9515-e29e039adba7 |
| thessa | w | 04713bef | 04713bef-938c-4996-89cf-e80a8c59ddf9 |

---

### MJ Prompts used (Worker 15)

**Base template** (same for all heroes):
```
pixel art RPG game sprite, [CHARACTER], 16-bit era pixel art style, chunky visible square pixels, flat color shading no gradients, thick black outline, pure magenta #FF00FF solid background, 8 color palette, Final Fantasy Tactics PS1 sprite, no anti-aliasing, no shadow, standing idle neutral, [DIRECTION] --ar 2:3 --stylize 50 --v 6
```

**Character descriptions:**
- Halv: `weathered male warrior age 44, grey-streaked beard, iron and grey plate armor, small sergeant pin on collar, sword at side, honest fatigue in posture, no magic items no glow`
- Brin: `young female ranger age 19, hard-eyed expression, scar through left brow, leather armor, bow held at ready, quiver on back, dark hair tied back practical` (re-submit #1 for south direction)
- Marrow (initial — REJECTED): `human male scholar necromancer age 31, dark scholar robes, staff` — produced skull face on S/E/W
- Marrow (re-submit #1 — ACCEPTED): Added `human male living person not undead not skeleton not skull, small wire-frame glasses, pale skin, dark scholar robes long, worn leather satchel at side, simple wooden staff in one hand, quiet unremarkable appearance` — all 4 directions re-submitted, all passed
- Thessa: `weathered female druid age 27, freckled face, braided hair, weather-lined skin, woven grove-circle pendant living plant material not metal, staff in right hand, leather and bark armor, earth tones`

**Direction suffixes** (same as Worker 14):
- n: `facing away from viewer back to camera`
- s: `facing the viewer front view`
- e: `facing right in profile right side visible`
- w: `facing left in profile left side visible`

---

### Visual QA

| Hero/Dir | Result | Notes |
|---|---|---|
| halv_s | ✓ EXCELLENT | Grey-bearded warrior, iron armor, sword. Perfect FFT register |
| halv_n/e/w | ✓ ACCEPTED | Consistent character |
| brin_s | ✓ EXCELLENT | Half-elf ranger, pointed ears, dark hair, leather + bow |
| brin_n | ✓ ACCEPTED | Quiver visible on back (green equipment, correctly kept) |
| brin_e | ✓ ACCEPTED | Clean transparent background |
| brin_w | ✓ ACCEPTED | Two-pass strip + global bg catch for enclosed tan region |
| marrow_s | ✓ EXCELLENT | Scholar with glasses, dark robes, satchel, staff. Human face. |
| marrow_e/w | ✓ ACCEPTED | Same character, human face with glasses |
| marrow_n | ✓ ACCEPTED | 3/4 profile facing away, face partially visible |
| thessa_s | ✓ EXCELLENT | Pixel art druid, earth tones, living staff, freckled face |
| thessa_n/e/w | ✓ ACCEPTED | Consistent character, good register |

---

### Failures and fixes

**brin_s missing from initial batch**: The MJ submission loop submitted 15 prompts but brin_s failed to register. Re-submitted as a single fresh prompt from the main tab. Job `d6028427` completed and downloaded to `/tmp/raw_w15/brin_s.png`.

**brin background — multi-color MJ backgrounds**: brin_n and brin_w had backgrounds with multiple color regions (white + green/tan panel). Standard corner flood-fill leaves enclosed background islands. Fixed with two-pass: (1) corner flood-fill, (2) global color-match pass (tolerance=25) to catch enclosed bg pixels.

**Marrow skull/undead face — 3 of 4 directions**: Same failure mode as Worker 13 Caelen. MJ associates scholarly robes + staff with undead/necromancer register. Fix: re-submit all 4 directions with strong human language — `human male living person not undead not skeleton not skull` + explicit `wire-frame glasses, pale skin` removed all ambiguity. Re-prompt #1 passed on all 4.

**Hand-rolled STORE ZIP bug**: The central directory entry external file attributes field requires 4 bytes (offset 38-41), not 2. Having only 2 bytes shifted the local-offset field by 2 bytes, causing `unzip` to read wrong file offsets. Fix: ensure 4 zero bytes for external attr.

**Download pipeline constraint**: Same as Worker 14 — Chrome blocks sequential programmatic downloads. One ZIP download per fresh tab session. Required creating fresh tabs (589033690, 589033691, 589033692) for each download operation.

---

### Known deviations

1. **Marrow's triple-loop tattoo**: Prompt included it but not visible at MJ's pixel-art fidelity (small forearm detail). Acceptable — tattoo is below the visual threshold of the sprite register.
2. **Marrow_n**: 3/4 profile rather than true back-facing view. MJ V6 interprets "facing away" as slight turn. Character remains unambiguous.
3. **Brin's scar**: "scar through left brow" present in prompt; may not be visible at 48×72 display size.
4. **Foot shadows**: Some sprites (marrow_e, brin_w) retain a small ground shadow at the sprite's base. Acceptable at 48×72 display size; consistent with FFT sprite conventions.

---

### Recommendation for Worker 16

Worker 16 should wire Halv/Brin/Marrow/Thessa into the preview HTML (`oath-and-bone-preview.html`) and engine using the same `idle_<dir>_<frame>.png` naming convention as Vael/Caelen/Bladewind/Ironwall. No new sprite generation needed — all 8 Chapter 1 hero idle sets are now on disk.

Attack animation frames remain ungenerated for ALL 8 heroes (both the 4 from Worker 14 and the 4 new ones). Use the same MJ recipe with attack stances if/when the engine needs them.

---

*Worker 15 · April 24, 2026 · 64 idle frames shipped for Halv/Brin/Marrow/Thessa. Marrow skull-face failure reproduced Worker 13's Caelen pattern — strong human-face language is the required fix for any scholarly/robed character. ZIP format bug identified and fixed (external attr field = 4 bytes). All 8 Chapter 1 hero idle sprite sets are now complete.*

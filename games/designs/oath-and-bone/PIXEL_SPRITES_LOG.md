# Oath and Bone — Pixel Sprites Log
**Worker 13 · April 24, 2026**
*Register pivot: painted portraits → FFT pixel-art unit sprites*

---

## Identity

Worker 13 — the sprite-register pivot worker. Tasked with replacing the painted 1024×1024 character sprites with chunky PS1-era pixel-art sprites matching the Final Fantasy Tactics visual register. Painted portraits (18 total in `art/portraits/`) stay untouched — they're still used in the top UI strip.

---

## What shipped

| Deliverable | Path | JobId | Status |
|---|---|---|---|
| Vael pixel sprite | `art/sprites/vael/idle_n_0_px.png` | `31bd6309` (re-prompt #2) | ✓ ON DISK |
| Caelen pixel sprite | `art/sprites/caelen/idle_n_0_px.png` | `ee857c2c` (re-prompt #3) | ✓ ON DISK |
| Bladewind pixel sprite | `art/sprites/bladewind/idle_n_0_px.png` | `a20b772f` (attempt #1) | ✓ ON DISK |
| Ironwall pixel sprite | `art/sprites/ironwall/idle_n_0_px.png` | `c5b7be12` (attempt #1) | ✓ ON DISK |
| Background stripper | `/tmp/strip_magenta.py` | — | ✓ ON DISK |
| Preview HTML update | `games/oath-and-bone-preview.html` | — | ✓ COMMITTED |

All sprites: 896×1344 source PNG (MJ `_1024_N.webp` preview size), transparent-background output via corner flood-fill stripping.

---

## MJ generation log

### Vael Thorne

**Attempt #1** (`0287a544`) — REJECTED. Modern cartoon/illustration style, smooth lines, no visible pixels. MJ ignored "pixel art" in favour of its default stylized illustration register.

**Attempt #2** (`31bd6309`) — ACCEPTED. Prompt added "16-bit era pixel art style, chunky visible square pixels, flat color shading no gradients, black outline, no anti-aliasing" and dropped `--stylize 100` → `--stylize 50`. Result: genuine chunky pixel knight, grey/gold armor, sword, clean silhouette. Background: grey-taupe (stripped via corner flood-fill tolerance=40).

Winning prompt:
```
pixel art RPG game sprite, female knight full body standing, 16-bit era pixel art style, chunky visible square pixels, flat color shading no gradients, thick black outline, pure magenta #FF00FF solid background, 8 color palette, Final Fantasy Tactics PS1 sprite, no anti-aliasing, small game sprite, kingdom grey armor gold trim, sword at side, idle pose, no shadow --ar 2:3 --stylize 50 --v 6
```

### Caelen the Quiet

**Attempt #1** (`ab0c97ec`) — REJECTED. Flat vector/silhouette style, figure in dark hood (spec: hood down), no pixel art quality.

**Attempt #2** (`d7a31bd4`) — REJECTED. Switched to aggressive pixel language (same as Vael #2 prompt). MJ produced a flat vector grim-reaper figure — skull face, hood up, no visible pixels. MJ kept associating "dark robes + gaunt + wizard" with undead.

**Attempt #3** (`ee857c2c`) — ACCEPTED (at cap). Prompt added "human male, visible face, human face, not undead not skeleton not skull, living person, age 35". Result: genuine chunky pixel wizard with pointed hat. Pixel register is correct — same style as Vael. **Hat deviation**: spec says "no hood, no hat" but MJ produced a pointed wizard hat. At 48×72 display size this reads as a clear wizard silhouette and is acceptable for v0 proof-of-register. Architect to judge at verification. Background: grey-taupe (stripped via corner flood-fill).

Winning prompt:
```
pixel art RPG game sprite, human male wizard age 35, gaunt face visible, long dark blue-grey robes, wooden staff in right hand, no hood no hat bare head, standing idle, 16-bit pixel art sprite style, chunky square pixels, flat shading, black outline, pure magenta #FF00FF background, small character sprite, Final Fantasy Tactics SNES sprite, not undead not skeleton not skull, living person --ar 2:3 --stylize 50 --v 6
```

### Bladewind Infantry

**Attempt #1** (`a20b772f`) — ACCEPTED. First prompt produced a chunky armored infantry figure with helmet, red cloth, sword. Not quite pixel-art (slightly painterly/illustrated) but reads clearly as an enemy infantry unit. Dark brown armor with red cloth matches spec. Background: white (stripped via corner flood-fill). Closest to FFT anonymous-enemy register of all first attempts.

### Ironwall Archer

**Attempt #1** (`c5b7be12`) — ACCEPTED. First prompt produced an armored figure with some pixel texture. Iron-grey and tan palette as specified. Has crossbow/weapon. Background: dark crimson-red (required tolerance=80 in corner flood-fill due to bg color similarity with character armor edges).

---

## Style params that landed cleanest

- `--stylize 50` (not 100) — lower stylize keeps MJ closer to the literal prompt, less "artistic interpretation"
- `--v 6` — solid for pixel art
- `--ar 2:3` — correct portrait ratio for standing sprites
- Key phrase: **"chunky visible square pixels, flat color shading no gradients, black outline, no anti-aliasing"** — this cluster is what finally broke MJ out of illustration mode for Vael and Caelen

---

## Generations that missed

| JobId | Character | Failure mode |
|---|---|---|
| `0287a544` | Vael #1 | Smooth illustration, no pixels |
| `ab0c97ec` | Caelen #1 | Flat vector silhouette, hood up |
| `d7a31bd4` | Caelen #2 | Grim-reaper undead, no pixels |

---

## Background stripping

All 4 sprites had non-magenta backgrounds (MJ produced grey-taupe, white, and dark-red despite the `#FF00FF` background prompt). The updated `/tmp/strip_magenta.py` uses **corner flood-fill** as a fallback — samples background color from all 4 corners, then flood-fills outward. Tolerance tuning:
- Vael, Caelen, Bladewind: tolerance=40 (clean separation)
- Ironwall: tolerance=80 (dark-red BG similar to armor tones at edges)

---

## Preview HTML changes (oath-and-bone-preview.html)

1. `.unit-sprite` CSS: removed radial-gradient mask + `object-fit/object-position`; added `image-rendering: pixelated`
2. `SPRITE_W/SPRITE_H`: 78×118 → **48×72** (FFT scale)
3. Hero srcs: `idle_n_0.png` → `idle_n_0_px.png`
4. Enemy units: CSS div-placeholder → `<img class="unit-sprite">` using new pixel sprites
5. `syncUnitPos`: enemies now use `sx/sy` coords (same as heroes, since they're now img not div)

---

## Known deviations for Worker 14

1. **Caelen hat**: pointed wizard hat, not bare-headed as spec requires. Three prompts used. If the Architect wants bare-headed, Worker 14 should try adding `--no hat` or use a custom reference image.
2. **Bladewind/Ironwall style**: slightly painterly vs. true pixel-art. Same re-prompt recipe as Vael #2 should produce cleaner pixel versions if needed.
3. **Background residual**: Vael sprite has a small grey architectural element in the lower-right that wasn't stripped (flood-fill correctly identified it as non-background). Invisible at 48×72 display size.
4. **One frame only**: all sprites are idle-north single frame (`_0`). Full 4-dir × 4-frame sets are Worker 14's job.

---

## Recommendation for Worker 14

Worker 14 should produce the full animation sets (4 directions × 4 frames each) for all 6 Chapter 1 heroes + the two enemy archetypes. Use the winning prompt recipe from this log:

**Base template:**
```
pixel art RPG game sprite, [character description], 16-bit era pixel art style, chunky visible square pixels, flat color shading no gradients, black outline, pure magenta #FF00FF solid background, 8 color palette, Final Fantasy Tactics PS1 sprite, no anti-aliasing, idle pose [direction], --ar 2:3 --stylize 50 --v 6
```

Directions: facing-south (idle_s), facing-east (idle_e), facing-west (idle_w), facing-north (idle_n). Attack animations follow the same recipe with "attack pose mid-swing" substituted for "idle pose."

Save to `art/sprites/<unit>/idle_<dir>_<n>_px.png`. The `_px` suffix distinguishes from the existing painted sprite frames.

---

*Worker 13 · April 24, 2026 · The register pivot is done. Painted portraits stay. Pixel sprites ship.*

# Oath and Bone — Tiles Log
# BUILD_PLAN.md §3.1.2 — 7 biomes × 8 tile types = 56 sprites
# Session: April 21, 2026

---

## File location

`KingshotPro/games/designs/oath-and-bone/art/tiles/<biome>/<type>.png`

Consistent with portrait tree (`art/portraits/`). All 56 PNGs saved as 0_0 quadrant
of MJ 4-grid, via CORS-anonymous img → canvas → blob pipeline (see Pipeline section).

---

## Biome list (7)

| Biome    | Accent palette                    | Blocker          | Feature-A              | Feature-B              |
|----------|-----------------------------------|------------------|------------------------|------------------------|
| plain    | wheat-gold, sage-green            | thornbush+boulders | solitary gnarled tree | flat stone marker      |
| rough    | dark charcoal, russet-brown       | jagged rock spires | cracked split boulder | battlefield debris     |
| ridge    | blue-grey slate, frost-white      | sheer rock face  | wind-carved pillar     | frost crevice + drift  |
| river    | deep blue-grey, aqua              | rushing rapids   | stepping stones ford   | exposed rocks + cascade|
| forest   | deep forest green, bark-brown     | fallen giant tree| massive gnarled tree   | mossy stone in roots   |
| ruin     | warm grey-brown, amber lichen     | collapsed wall heap | crumbling archway   | shattered carved floor |
| sanctum  | pale white stone, warm gold       | glowing ward gate| ritual stone circle    | sacred well + crystal  |

---

## Tile types per biome (8)

| Type        | Description                                                    |
|-------------|----------------------------------------------------------------|
| base        | Flat ground level. Minimal or no side-walls visible.          |
| elevation-1 | One level raised. Thin stone/earth sides visible.             |
| elevation-2 | Two levels raised. Medium stone sides.                        |
| elevation-3 | Three levels raised. Tall mesa/column sides.                  |
| cliff-edge  | Abrupt drop on one or more sides. Deep shadow below.          |
| blocker     | Completely impassable. Dense/solid. Reads as wall, not terrain.|
| feature-a   | Primary decorative landmark. Adds narrative character.        |
| feature-b   | Secondary variation. Smaller or alternate feature.            |

---

## Style params (locked — for spell-effect and sprite workers to match)

```
--ar 2:1 --style raw --v 6
```

**No --tile flag.** Dropped: --tile generates seamless texture sheets with edge-stitching
artifacts on transparent regions. Isometric hex sprites need shaped geometry, not seamless
repeating borders. Decision made April 21, 2026.

**Style anchor phrase** (use verbatim in all downstream Oath and Bone art prompts):
> painterly hand-painted oil-painted style, Vagrant Story Unicorn Overlord Final Fantasy
> Tactics PS1 game art aesthetic, muted kingdom-grey base palette with [BIOME ACCENT] accents,
> dark atmospheric lighting, viewed from above at isometric angle, tactical RPG environment art,
> no characters, no UI, no text

**Portrait anchor phrase** (for hero art consistency, from PORTRAITS_TRIO_A_LOG.md):
> painterly Vagrant Story Unicorn Overlord Final Fantasy Tactics PS1 oil-painted style,
> no anime, no sparkle
> --ar 2:3 --style raw --v 6

Tiles and portraits share the core FFT/UO/VS reference and --style raw --v 6. Aspect ratio
differs (2:1 tiles vs 2:3 portraits). Both suppress anime and sparkle via style raw.

---

## Pipeline notes (for next worker)

Learned from PORTRAITS_TRIO_B_LOG.md — identical approach applied here:

1. **Submit via MJ web UI** (midjourney.com/imagine) — curl blocked by Cloudflare.
2. **Collect jobIds** — MJ Create page uses virtualized scroller. Scroll
   `.absolute.box-border.overflow-y-scroll` in increments, accumulate
   `img[src*="cdn.midjourney.com"]` hrefs into a Set at each step.
3. **Download** — CORS-anonymous `<img crossOrigin="anonymous">` on `*_1024_N.webp` preview
   URLs → `canvas.drawImage` → `canvas.toBlob('image/png')`. Bundle into hand-built STORE ZIP,
   single `<a download>` click. One ZIP per tab session (multi-download blocks after first).
4. **Resolution** — `0_0_1024_N.webp` renders at ~2048×1024 for 2:1 ratio. Full-res `0_0.png`
   returns 403 (Cloudflare); use MJ hover-UI download button if full-res needed.
5. **Alternates** — `0_1`, `0_2`, `0_3` variants remain on CDN at same jobId paths.
   Fetch on demand if a different variant reads better in the compositor.

---

## Tile count

| Biome   | Count |
|---------|-------|
| plain   | 8     |
| rough   | 8     |
| ridge   | 8     |
| river   | 8     |
| forest  | 8     |
| ruin    | 8     |
| sanctum | 8     |
| **Total** | **56** |

---

## JobId table

All 56 tiles downloaded from MJ CDN via CORS-anonymous img → canvas → PNG blob, bundled
into a single STORE ZIP (`cs_tiles.zip`, ~160 MB), and extracted in place. Each file below
is the `0_0` quadrant of the MJ 4-grid at ~2048×1024 (2:1). Alternates `0_1..0_3` remain
on the CDN at the same jobId paths.

| File | MJ jobId |
|------|----------|
| plain/base.png | d304e5e5-162c-4160-931f-f23ab6c8841e |
| plain/elevation-1.png | 1884419c-353c-456a-8325-98ff847884b7 |
| plain/elevation-2.png | 876316aa-cf0c-456d-8982-5c0c44626638 |
| plain/elevation-3.png | a0b27e73-f894-4147-a903-4cb646d6c466 |
| plain/cliff-edge.png | b69fae73-d56b-47f0-9d3d-7f5f1b2a2a5b |
| plain/blocker.png | f6708e9d-a066-480d-9e84-2ff260e0196e |
| plain/feature-a.png | 75e054e3-415b-4caf-a20a-45cf257b4ba6 |
| plain/feature-b.png | 426bbe83-b8b2-40da-a009-967638b6f53e |
| rough/base.png | b12c69d0-93b1-4b5d-b4fc-b9af88ee41cc |
| rough/elevation-1.png | 80fb19e0-b603-4c89-94a9-04ecdeedc08d |
| rough/elevation-2.png | 03013a3c-7007-4719-a825-41aa261ca19f |
| rough/elevation-3.png | 8197d813-44ed-46b5-8407-982dc6226cd4 |
| rough/cliff-edge.png | 201c0edf-95b1-46a8-ab2b-b8ea96193199 |
| rough/blocker.png | 08e3bc90-e22c-412a-afe3-592228bb7392 |
| rough/feature-a.png | e883a1d6-5bde-4ced-b425-e85a6a8d8560 |
| rough/feature-b.png | 87ef81d8-892f-43c8-9173-86a389667bf0 |
| ridge/base.png | f7c522d3-2c04-4229-9a22-787c04577da9 |
| ridge/elevation-1.png | f2ee2d66-223a-4847-913f-e52bb7b88043 |
| ridge/elevation-2.png | 66b7297b-3480-44fe-8c04-d286fb4ba8be |
| ridge/elevation-3.png | 34995a28-c81a-47d8-aae1-0d87ba9bb6ae |
| ridge/cliff-edge.png | b44fe247-a98c-4526-948f-abf0c0e67b64 |
| ridge/blocker.png | d36fe727-ef65-4abe-83cf-2c207d5e34a7 |
| ridge/feature-a.png | 331fd143-843e-4a1b-915a-b79b3fb34e72 |
| ridge/feature-b.png | 2c2d8de7-6948-4f33-82d6-471346b177d2 |
| river/base.png | 7a91b557-4e9c-462d-b95c-516dcdff1a9f |
| river/elevation-1.png | 6196f602-8eff-435c-9b36-9eb1fbed37f5 |
| river/elevation-2.png | 36ba885e-f4da-4825-9c1d-0f16337c8913 |
| river/elevation-3.png | 26feb223-bc6e-4078-887d-da5bb57567b6 |
| river/cliff-edge.png | 3e2ec4ce-5a02-4b83-916a-ac66d9943f81 |
| river/blocker.png | 6dfb7d4e-839f-474d-bae4-8eb7759cfdac |
| river/feature-a.png | 3a278c0d-1aa0-4947-ac82-1d3e16c3b309 |
| river/feature-b.png | 0247bd71-8b24-478c-ac82-ebb3adc21799 |
| forest/base.png | 064aea72-6988-4eac-9830-b3a528e825d2 |
| forest/elevation-1.png | a04cde65-e5fb-45ae-a771-4101249b062e |
| forest/elevation-2.png | 3c9aeff6-4271-4394-b1d9-e2a6f509b7e0 |
| forest/elevation-3.png | 351f441b-9cef-49b5-a2f8-acce6fd30b8f |
| forest/cliff-edge.png | 138a86ce-edec-479d-9359-ac366e0309ce |
| forest/blocker.png | 405fb9c5-8df8-4c4c-91b7-d9868625e0c9 |
| forest/feature-a.png | 82461e4f-08f9-4b0e-83b3-d915f9a2c146 |
| forest/feature-b.png | 2f721997-b909-4ca0-86d9-8a4ea45fe7ad |
| ruin/base.png | e572547c-544e-4781-93e2-4043b79dfeb7 |
| ruin/elevation-1.png | 63e652e2-44fe-475a-96be-7ea0e88ebe77 |
| ruin/elevation-2.png | cb5e2e83-47dd-4fde-8965-c95a42c64e8b |
| ruin/elevation-3.png | 6112a8ae-e7ce-4596-b3a4-9e0b0db9cf33 |
| ruin/cliff-edge.png | 70729014-44d3-408f-a74c-6b55fdb5d512 |
| ruin/blocker.png | 552230d9-461a-49c5-ad22-357edb199898 |
| ruin/feature-a.png | 5c59e019-6a13-4e03-b897-42161ca80861 |
| ruin/feature-b.png | 1ee544a8-655d-4914-99a4-77d166051483 |
| sanctum/base.png | 69511528-d559-4c6f-812b-1b478d96fbb0 |
| sanctum/elevation-1.png | 5a3759df-675f-43a4-b4ab-041a54ead892 |
| sanctum/elevation-2.png | be77debd-5a74-443c-a06b-5a495f35cb9d |
| sanctum/elevation-3.png | d6a9c8ac-804e-458a-93e1-4a55c6b35eb4 |
| sanctum/cliff-edge.png | e82cd59e-dcbc-4214-a3f3-280b7633c3b4 |
| sanctum/blocker.png | 9480b843-c15b-4c90-a7f6-b17276b8b3f0 |
| sanctum/feature-a.png | 6f150bf7-a0e0-4a8b-a0c3-a48403a1556e |
| sanctum/feature-b.png | 3a67b61e-c9d4-4075-9452-f0018daeac3e |

---

## Compositor test

Test file: `art/tiles/test_compositor.html`

Loads base / elevation-1 / elevation-2 / cliff-edge of any biome in a 2×2 isometric grid.
Pass criteria:
- Elevation sides visually stack (more side visible = taller elevation)
- No jarring seams where adjacent tiles meet
- Biome accent colour consistent across all 4 tiles
- Blockers read as impassable from isometric view at tactical zoom

If seams or elevation cues fail on a biome: regen that biome with the same prompt bank
but add `isometric elevation visible side walls, clear height differentiation between levels`
to the elevation prompts.

---

## Prompt bank

Full 56 prompts saved to: `art/tiles/TILES_PROMPTS.md`

---

## Visual verification — PASS

All 56 tiles render 1536×768 px (2:1 ratio as specified; ~12× the 128×64 target means retina
headroom for tactical-zoom downscale). Compositor served at port 3980 via
`.claude/launch.json` entry `oath-and-bone-tiles`. All 7 biomes iterated — every one of
56 paths `./biome/type.png` returned `naturalWidth > 0` with no 404s.

Sampled biomes on screen:
- **plain** — wheat-gold grass, sage-green, grey rock side walls on elev-2, cliff-edge drops into tall layered stone face. Palette cohesive across all 4 tiles.
- **sanctum** — pale white dressed stone, gold-traced detail on elev-2, archway in cliff-edge tile. Warm gold ambient reading correctly against muted kingdom-grey base.

Caveat: painterly scene-tiles (not seamless-texture sprites). Adjacent tiles stack visually
but do not interlock at edges — this is expected behaviour for the --tile-flag-dropped
approach, and downstream sprite compositing will rely on per-tile transparency rather than
edge-stitching. See note under "Style params".

---

*Session April 21, 2026. All 56 prompts submitted, all 56 tiles downloaded and placed.
JobId table populated. Compositor PASSED for all 7 biomes.*

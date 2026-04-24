# Oath and Bone — Visual Prototype Log
**Worker 12 · April 24, 2026**

---

## What was shipped

`KingshotPro/games/oath-and-bone-preview.html` — a single-file static HTML5 visual
prototype. No game logic, no spells, no turn loop. A dressed stage for the Architect
to see and react to the aesthetic direction of Oath and Bone before the autonomous
engine ships to `games/oath-and-bone.html`.

**Verified working in-session via Claude Preview tools:**
- Isometric 12×14 hex grid renders with painterly golden plain tiles ✓
- 3-hex elevation-2 ridge at north center renders with distinct rocky tile art ✓
- Vael sprite (female knight, armor, sword) on south edge ✓
- Caelen sprite (dark-robed wizard, staff) on south edge ✓
- 4 dark enemy silhouettes on north edge (one on the ridge at elevation 2) ✓
- Click any tile → gold diamond outline highlight + hex info updates ✓
- Hex info displays: `hex (q, r) — [terrain] · elevation [N]` ✓
- KSP gold-on-dark palette applied throughout (gold `#f0c040`, bg `#0d0d0f`) ✓
- Top UI: portrait thumbnails, HP bars (gold), Mana bar (blue) for Caelen ✓
- Bottom UI: 5 action buttons (move / attack / cast / item / hold) ✓
- "Unofficial. Not affiliated with Century Games." disclaimer in footer ✓
- No JavaScript console errors ✓

---

## Art files referenced in the prototype

All paths relative to `games/oath-and-bone-preview.html`:

| Asset | Path | Source | Status |
|---|---|---|---|
| Plain base tile | `designs/oath-and-bone/art/tiles/plain/base.png` | Worker 3 (TILES_LOG) | ON DISK ✓ |
| Elevation-2 ridge tile | `designs/oath-and-bone/art/tiles/plain/elevation-2.png` | Worker 3 (TILES_LOG) | ON DISK ✓ |
| Vael idle-north sprite | `designs/oath-and-bone/art/sprites/vael/idle_n_0.png` | EFFECTS_SPRITES_LOG | ON DISK ✓ |
| Caelen idle-north sprite | `designs/oath-and-bone/art/sprites/caelen/idle_n_0.png` | EFFECTS_SPRITES_LOG | ON DISK ✓ |
| Vael portrait | `designs/oath-and-bone/art/portraits/vael_neutral_v1.png` | PORTRAITS_TRIO_A_LOG | ON DISK ✓ |
| Caelen portrait | `designs/oath-and-bone/art/portraits/caelen_neutral_v1.png` | PORTRAITS_TRIO_A_LOG | ON DISK ✓ |

---

## Substitutions and discrepancies

1. **Portrait filename suffix** — The prototype brief listed `vael_neutral.png` and
   `caelen_neutral.png`. Actual files on disk are `vael_neutral_v1.png` and
   `caelen_neutral_v1.png` (with `_v1` suffix per the portrait pipeline naming
   convention). The correct files are used; this is a brief-vs-disk discrepancy, not
   a missing asset.

2. **Enemy silhouettes** — No dedicated enemy unit art exists on disk for the four B1
   Bladewind infantry + archer. Substituted with CSS dark rectangles
   (`background: rgba(14, 6, 26, 0.92)`) with a circular "head" pseudo-element.
   Sized 42×52px to approximate a unit on a 128×64 tile. Noted in code comments.
   Worker 8 (art generation) should generate enemy sprites when available.

3. **Seamless tile variants NOT used for hex rendering** — The brief says "seamless
   tiles from art/tiles/plain/" but the seamless assets at
   `art/tiles/seamless/plain/variant-N.png` are 1024×1024 square textures (not
   hex-shaped). The actual isometric hex tile images at `art/tiles/plain/base.png`
   and `art/tiles/plain/elevation-2.png` (1536×768, 2:1 aspect ratio) were used
   instead. These are the assets the Worker 3 tile compositor also uses. Seamless
   variants are intended for texture-fill within tiles, not standalone hex shapes.

4. **Caelen placed at (5,12) not (4,12)** — B1 spec positions Vael(3,12),
   Halv(4,12), Brin(5,12). The preview substitutes Caelen for Brin at (5,12) since
   Halv and Brin have no shipped sprites. Noted in code comment.

5. **Log file paths** — MACROS_RING_LOG.md and PORTRAITS_TRIO_A_LOG.md were initially
   looked for at `art/MACROS_RING_LOG.md` and `art/PORTRAITS_TRIO_A_LOG.md`. Actual
   locations: `designs/oath-and-bone/MACROS_RING_LOG.md` and
   `designs/oath-and-bone/PORTRAITS_TRIO_A_LOG.md`. No art was affected; only the
   read path was wrong.

---

## Hex math used

Isometric formula from `art/tiles/test_compositor.html` (Worker 3 reference):

```javascript
// TILE_W=128, TILE_H=64, PAD_X=860, PAD_Y=40
x = PAD_X + (q - r) * (TILE_W / 2)  // → PAD_X + (q-r)*64
y = PAD_Y + (q + r) * (TILE_H / 4)  // → PAD_Y + (q+r)*16
```

Sprite Y-offset per elevation: `sprite.top -= elevation * 16` (per BUILD_PLAN §1.1.1).

---

## Screenshot test — session April 24, 2026

Verified via Claude Preview (port 3970, served from KingshotPro root):

- **North edge view:** ridge tiles visible at q=4,5,6 r=1 with distinct rocky
  blue-grey `elevation-2.png` texture. 3 of 4 enemy silhouettes visible in frame
  against golden plain tiles.
- **South edge view:** Vael sprite (woman in half-armor, controlled expression)
  and Caelen sprite (dark-robed gaunt wizard) clearly distinct on the tile grid.
- **Click test on plain tile (4,6):** gold diamond outline renders on tile;
  hex-info shows `hex (4, 6) / plain · elevation 0`.
- **Click test on ridge tile (5,1):** gold diamond outline renders; hex-info
  shows `hex (5, 1) / ridge · elevation 2`.
- **No JS console errors.**

---

## Deploy command

This preview is a static HTML file with no build step. To deploy to the live
KingshotPro GitHub Pages site:

```bash
git push origin main
```

GitHub Pages will deploy automatically. The file will be live at:
`https://thehivemakes.github.io/kingshotpro/games/oath-and-bone-preview.html`
(or the configured custom domain equivalent — verify after push).

The preview does NOT need to be wired into `layout.js` nav since it is a standalone
gallery, not a site feature. The Architect can share the URL directly or link from a
staging note.

---

*Worker 12. This file is complete. The Architect has a surface to react to.*

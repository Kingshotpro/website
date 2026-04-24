# Oath and Bone — POLISH_LOG
**Worker 18 · April 24, 2026**
*Visual polish pass: terrain build-out, zoom-to-fit, hover preview*

---

## Concern 1 — Map Terrain Build-Out

### What shipped

**battles.js** — Extended `SCENARIO_B1.hexTypes` with 5 new visual terrain types:

```javascript
water:      { terrain: 'water',      elevation: 0, tile_mods: [] },
ruin:       { terrain: 'ruin',       elevation: 0, tile_mods: [] },
cliff_edge: { terrain: 'cliff_edge', elevation: 0, tile_mods: [] },
rough:      { terrain: 'rough',      elevation: 0, tile_mods: [] },
sanctum:    { terrain: 'sanctum',    elevation: 0, tile_mods: [] }
```

All new types carry `elevation: 0, tile_mods: []` — no gameplay effects. Worker 19 scope.

**Map placement** — 11 rows edited:

| Terrain    | Positions | Rationale |
|------------|-----------|-----------|
| water      | q=0, r=4–8 | West edge channel, impassable-feel without gameplay block |
| cliff_edge | q=3,r=1; q=7,r=1; q=4,r=0; q=5,r=0; q=6,r=0; q=0,r=4–6; q=7,r=7 | Flanking ridge, visual drop |
| rough      | q=6,r=3; q=7,r=2; q=2,r=7; q=4,r=8; q=6,r=6; q=3,r=10; q=5,r=11; q=8,r=10 | Scattered battlefield debris |
| ruin       | q=9,r=3; q=10,r=4; q=10,r=5 | East ruin cluster |
| sanctum    | q=9,r=8 | Single sacred hex, mid-map |

Placements checked against all unit start positions — no overlap with player (q=3–6, r=12) or enemy (q=3–7, r=1–4) starts.

**render.js** — PNG tile renderer:

- `_TILE_SRCS` maps all 8 terrain types to `art/tiles/<biome>/base.png` (or `cliff-edge.png`)
- `_getTileImage(terrain)` — lazy-load with image cache; `onload` triggers `render()` (guarded `!_animating`)
- `_tileFlip(q,r)` — deterministic hash `(((q*2654435761)^(r*1013904223))>>>0)&1` for X-axis flip variety
- X-flip only: painterly iso tiles have NW baked directional lighting — Y-flip reverses shadow direction, reads wrong. X-flip = NW↔NE light source variation, acceptable style variance
- Diamond clip path (`ctx.clip()`) applied before `drawImage`; solid colour fallback for all 8 types while images load

**Commit:** `596ff73`

---

## Concern 2 — Zoom-to-Fit

### What shipped

`_applyZoomToFit()` in render.js:

```javascript
function _applyZoomToFit() {
  if (window.innerWidth < 768) return;          // mobile: skip, use native pinch-zoom
  var availW = window.innerWidth  - 40;
  var availH = window.innerHeight - 120;
  var scale  = Math.min(availW / CANVAS_W, availH / CANVAS_H, 1.0);
  scale      = Math.max(0.25, scale);
  _mapScale  = scale;
  _stage.style.transform       = scale < 1 ? 'scale(' + scale.toFixed(4) + ')' : '';
  _stage.style.transformOrigin = 'top left';
  scroll.style.overflow = scale < 1 ? 'hidden' : 'auto';
  scroll.style.height   = scale < 1 ? Math.ceil(CANVAS_H * scale) + 'px' : '';
  // scroll.style.width NOT set — stays full viewport width, avoids layout break
}
```

Called once after `buildUI()` via `setTimeout(_applyZoomToFit, 0)` and on resize via throttled listener (100ms debounce).

### Click-coordinate math — do not re-derive

The canvas click handler uses:
```javascript
var scaleX = CANVAS_W / rect.width;   // rect.width = CANVAS_W * cssScale
var scaleY = CANVAS_H / rect.height;
var ix = (e.clientX - rect.left) * scaleX;
var iy = (e.clientY - rect.top)  * scaleY;
```

When CSS `transform: scale(s)` is applied, `rect.width = CANVAS_W * s`, so `scaleX = 1/s`.
Result: `ix = (clientX - rect.left) * (1/s)` → exact native canvas coords at any scale.
**No change needed to click handler when zoom scale changes.** Math is self-correcting.

### Mobile zoom decision

Viewports `< 768px` skip `_applyZoomToFit` entirely (`return` at top of function). Native browser pinch-zoom applies. Reason: CSS `transform: scale` on a canvas + DOM overlay stack causes iOS Safari tap offset bugs at sub-0.5 scale. Native pinch-zoom keeps browser hit-testing accurate. Cannot be tested without a real device — flagged for manual QA.

**Commit:** `073386e`

---

## Concern 3 — Click Precision + Hover Preview

### What shipped

**Hover outline** — drawn at end of `_drawTile` (painter's algorithm, so it renders on top of tile fill):

- Default (no mode): gold `rgba(240,192,64,.80)` diamond outline
- In MOVE mode over reachable hex: gold outline (same)
- In CAST mode over enemy in range: red `rgba(224,92,92,.95)`
- In CAST mode over empty in range: dim blue `rgba(92,140,224,.80)`
- Line width 1.8px

Canvas `mousemove` listener: hit-tests mouse against all tile diamond paths via `isPointInPath`, sets `_hoveredHex = {q, r}` and calls `render()`. `mouseleave` clears `_hoveredHex` and calls `render()`.

**Ghost sprite** — in `syncSprites()`, after all real unit elements are created:

- Condition: `_moveMode && _hoveredHex && _selectedUnitId && _hexInList(_moveHexes, hoveredHex.q, hoveredHex.r)`
- Creates `<img>` (or placeholder `<div>` if no sprite) with class `oab-ghost`
- Style: `opacity: 0.40`, `filter: grayscale(0.2) drop-shadow(0 0 6px rgba(240,192,64,.7))`, `pointer-events: none`
- Z-index: `_hoveredHex.r + 1` (painter's algorithm depth, same logic as real sprites)
- `syncSprites()` selector includes `.oab-ghost` in cleanup: `querySelectorAll('.oab-sprite,.oab-name,.oab-cursor,.oab-hp-bar,.oab-ghost')`

**Commit:** `3014b6a`

---

## Worker 19 Scope — Terrain Combat Effects

These terrain types exist visually but carry no gameplay modifiers. Worker 19 should wire:

| Terrain    | Intended effect | Schema location |
|------------|-----------------|-----------------|
| water      | Impassable (movement blocked, no unit placement) | `hexTypes.water.tile_mods` → `['impassable']` |
| ruin       | +1 defense bonus for occupying unit | `hexTypes.ruin.tile_mods` → `['defense_bonus_1']` |
| cliff_edge | Movement: can enter from adjacent plain/ridge only if elevation matches; no movement off edge except designated stairs hexes | `hexTypes.cliff_edge.tile_mods` → `['no_drop']` |
| rough      | -1 movement cost (slows unit by 1 hex per rough tile crossed) | `hexTypes.rough.tile_mods` → `['slow_1']` |
| sanctum    | +5 mana regen per turn for any unit occupying | `hexTypes.sanctum.tile_mods` → `['mana_regen_5']` |

Engine reads `tile_mods` array — Worker 19 needs to verify engine.js implementation of tile_mods before setting values. If tile_mods isn't wired in engine.js yet, that's the first step.

---

## File summary

| File | Change |
|------|--------|
| `js/game-oath-and-bone-battles.js` | +5 hexTypes, map rows 0-11 edited |
| `js/game-oath-and-bone-render.js` | +tile PNG renderer, +zoom-to-fit, +hover outline, +ghost sprite, +mousemove/resize wiring |
| `games/designs/oath-and-bone/POLISH_LOG.md` | This file |

---

*Worker 18 · April 24, 2026 · Three concerns shipped. Map reads as a world now.*

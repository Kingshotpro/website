# Oath and Bone — Sprite Prompts
# Phase 1 heroes: Vael (knight) + Caelen (wizard)
# 2 heroes × 4 directions × 2 animations = 16 MJ jobs, each 4-grid → 4 "frames"
# Session: April 21, 2026

## Frame-from-4-grid approach

MJ `/imagine` produces a 4-grid per job (`0_0`, `0_1`, `0_2`, `0_3`). For sprite animation
we harvest all four quadrants per prompt rather than only `0_0`. Each quadrant is a subtle
variation on the same pose — works as a 4-frame idle-sway or attack-phase cycle at 64×64
tactical zoom. This yields the 4 frames/direction/animation the brief asked for from
one generation per bucket.

Total outputs: 2 heroes × 4 directions × 2 animations × 4 frames = **64 frames**.
Total MJ jobs: **16**.

## Filename convention

`<animation>_<dir>_<frame>.png` → `idle_n_0.png`, `idle_n_1.png`, `attack_e_2.png`, etc.

Saved to `art/sprites/vael/` and `art/sprites/caelen/`.

## Style anchor (locked)

Same painterly VS/UO/FFT register as tiles + portraits:
- `--ar 1:1 --style raw --v 6`
- Character reference: `--cref <portrait URL>` (locks identity across poses)
- "painterly hand-painted oil-painted Vagrant Story Unicorn Overlord Final Fantasy Tactics PS1 style"
- "no anime, no sparkle"
- "isometric tactical RPG sprite, clean readable silhouette at small scale"
- "single subject on dark void matte background, three-quarter view"

## Character reference URLs

Reusing MJ CDN previews from PORTRAITS_TRIO logs:
- **Vael:** `https://cdn.midjourney.com/b24bfe50-804d-4ba1-a561-84a201a2ab47/0_0_1024_N.webp` (vael_neutral jobId from PORTRAITS_TRIO_A_LOG.md)
- **Caelen:** `https://cdn.midjourney.com/90101afe-af43-4ca7-b10f-1ff9024634bf/0_0_1024_N.webp` (caelen_neutral jobId from PORTRAITS_TRIO_B_LOG.md)

---

## VAEL — Knight (half-armor, muted kingdom-grey/slate with gold collar trim)

### Idle (sword sheathed or low, subtle weight-shift stance)

| dir | prompt |
|---|---|
| n | painterly hand-painted oil-painted Vagrant Story Unicorn Overlord Final Fantasy Tactics PS1 style, isometric tactical RPG sprite of a young woman knight in half-armor with muted kingdom-grey slate palette and gold collar trim, facing away from viewer (north), standing at ease with sword low, quiet weight-shift stance, clean readable silhouette, single subject on dark void matte background, three-quarter overhead tactical view, no UI no text no anime no sparkle --cref https://cdn.midjourney.com/b24bfe50-804d-4ba1-a561-84a201a2ab47/0_0_1024_N.webp --ar 1:1 --style raw --v 6 |
| e | painterly hand-painted oil-painted Vagrant Story Unicorn Overlord Final Fantasy Tactics PS1 style, isometric tactical RPG sprite of a young woman knight in half-armor with muted kingdom-grey slate palette and gold collar trim, facing right (east), standing at ease in profile with sword low, quiet weight-shift stance, clean readable silhouette, single subject on dark void matte background, three-quarter overhead tactical view, no UI no text no anime no sparkle --cref https://cdn.midjourney.com/b24bfe50-804d-4ba1-a561-84a201a2ab47/0_0_1024_N.webp --ar 1:1 --style raw --v 6 |
| s | painterly hand-painted oil-painted Vagrant Story Unicorn Overlord Final Fantasy Tactics PS1 style, isometric tactical RPG sprite of a young woman knight in half-armor with muted kingdom-grey slate palette and gold collar trim, facing the viewer (south), standing at ease with sword low, quiet weight-shift stance, clean readable silhouette, single subject on dark void matte background, three-quarter overhead tactical view, no UI no text no anime no sparkle --cref https://cdn.midjourney.com/b24bfe50-804d-4ba1-a561-84a201a2ab47/0_0_1024_N.webp --ar 1:1 --style raw --v 6 |
| w | painterly hand-painted oil-painted Vagrant Story Unicorn Overlord Final Fantasy Tactics PS1 style, isometric tactical RPG sprite of a young woman knight in half-armor with muted kingdom-grey slate palette and gold collar trim, facing left (west), standing at ease in profile with sword low, quiet weight-shift stance, clean readable silhouette, single subject on dark void matte background, three-quarter overhead tactical view, no UI no text no anime no sparkle --cref https://cdn.midjourney.com/b24bfe50-804d-4ba1-a561-84a201a2ab47/0_0_1024_N.webp --ar 1:1 --style raw --v 6 |

### Attack (braced charge / sword swing apex)

| dir | prompt |
|---|---|
| n | painterly hand-painted oil-painted Vagrant Story Unicorn Overlord Final Fantasy Tactics PS1 style, isometric tactical RPG sprite of a young woman knight in half-armor with muted kingdom-grey slate palette and gold collar trim, facing north (away from viewer), braced charge mid-swing with sword raised, apex of forward strike, clean readable silhouette, single subject on dark void matte background, three-quarter overhead tactical view, no UI no text no anime no sparkle --cref https://cdn.midjourney.com/b24bfe50-804d-4ba1-a561-84a201a2ab47/0_0_1024_N.webp --ar 1:1 --style raw --v 6 |
| e | painterly hand-painted oil-painted Vagrant Story Unicorn Overlord Final Fantasy Tactics PS1 style, isometric tactical RPG sprite of a young woman knight in half-armor with muted kingdom-grey slate palette and gold collar trim, facing east (right, profile), braced charge mid-swing with sword extended in lunge, apex of forward strike, clean readable silhouette, single subject on dark void matte background, three-quarter overhead tactical view, no UI no text no anime no sparkle --cref https://cdn.midjourney.com/b24bfe50-804d-4ba1-a561-84a201a2ab47/0_0_1024_N.webp --ar 1:1 --style raw --v 6 |
| s | painterly hand-painted oil-painted Vagrant Story Unicorn Overlord Final Fantasy Tactics PS1 style, isometric tactical RPG sprite of a young woman knight in half-armor with muted kingdom-grey slate palette and gold collar trim, facing south (toward viewer), braced charge mid-swing with sword forward, apex of strike, clean readable silhouette, single subject on dark void matte background, three-quarter overhead tactical view, no UI no text no anime no sparkle --cref https://cdn.midjourney.com/b24bfe50-804d-4ba1-a561-84a201a2ab47/0_0_1024_N.webp --ar 1:1 --style raw --v 6 |
| w | painterly hand-painted oil-painted Vagrant Story Unicorn Overlord Final Fantasy Tactics PS1 style, isometric tactical RPG sprite of a young woman knight in half-armor with muted kingdom-grey slate palette and gold collar trim, facing west (left, profile), braced charge mid-swing with sword extended in lunge, apex of forward strike, clean readable silhouette, single subject on dark void matte background, three-quarter overhead tactical view, no UI no text no anime no sparkle --cref https://cdn.midjourney.com/b24bfe50-804d-4ba1-a561-84a201a2ab47/0_0_1024_N.webp --ar 1:1 --style raw --v 6 |

---

## CAELEN — Wizard (gaunt, severe, worn robes, focus-crystal on chain)

### Idle (staff planted, robes slightly drifting)

| dir | prompt |
|---|---|
| n | painterly hand-painted oil-painted Vagrant Story Unicorn Overlord Final Fantasy Tactics PS1 style, isometric tactical RPG sprite of a gaunt severe wizard in once-fine worn robes with a focus crystal on a chain, facing north (away from viewer), standing with staff planted, robes drifting subtly, muted slate and bone palette, clean readable silhouette, single subject on dark void matte background, three-quarter overhead tactical view, no UI no text no anime no sparkle --cref https://cdn.midjourney.com/90101afe-af43-4ca7-b10f-1ff9024634bf/0_0_1024_N.webp --ar 1:1 --style raw --v 6 |
| e | painterly hand-painted oil-painted Vagrant Story Unicorn Overlord Final Fantasy Tactics PS1 style, isometric tactical RPG sprite of a gaunt severe wizard in once-fine worn robes with a focus crystal on a chain, facing east (right, profile), standing with staff planted at his side, robes drifting subtly, muted slate and bone palette, clean readable silhouette, single subject on dark void matte background, three-quarter overhead tactical view, no UI no text no anime no sparkle --cref https://cdn.midjourney.com/90101afe-af43-4ca7-b10f-1ff9024634bf/0_0_1024_N.webp --ar 1:1 --style raw --v 6 |
| s | painterly hand-painted oil-painted Vagrant Story Unicorn Overlord Final Fantasy Tactics PS1 style, isometric tactical RPG sprite of a gaunt severe wizard in once-fine worn robes with a focus crystal on a chain, facing south (toward viewer), standing with staff planted, robes drifting subtly, muted slate and bone palette, clean readable silhouette, single subject on dark void matte background, three-quarter overhead tactical view, no UI no text no anime no sparkle --cref https://cdn.midjourney.com/90101afe-af43-4ca7-b10f-1ff9024634bf/0_0_1024_N.webp --ar 1:1 --style raw --v 6 |
| w | painterly hand-painted oil-painted Vagrant Story Unicorn Overlord Final Fantasy Tactics PS1 style, isometric tactical RPG sprite of a gaunt severe wizard in once-fine worn robes with a focus crystal on a chain, facing west (left, profile), standing with staff planted at his side, robes drifting subtly, muted slate and bone palette, clean readable silhouette, single subject on dark void matte background, three-quarter overhead tactical view, no UI no text no anime no sparkle --cref https://cdn.midjourney.com/90101afe-af43-4ca7-b10f-1ff9024634bf/0_0_1024_N.webp --ar 1:1 --style raw --v 6 |

### Cast (staff raised, spell gathering at focus-crystal)

| dir | prompt |
|---|---|
| n | painterly hand-painted oil-painted Vagrant Story Unicorn Overlord Final Fantasy Tactics PS1 style, isometric tactical RPG sprite of a gaunt severe wizard in once-fine worn robes with a focus crystal on a chain, facing north (away from viewer), casting mid-gesture with staff raised and cold blue energy gathering at the crystal, muted slate and bone palette, clean readable silhouette, single subject on dark void matte background, three-quarter overhead tactical view, no UI no text no anime no sparkle --cref https://cdn.midjourney.com/90101afe-af43-4ca7-b10f-1ff9024634bf/0_0_1024_N.webp --ar 1:1 --style raw --v 6 |
| e | painterly hand-painted oil-painted Vagrant Story Unicorn Overlord Final Fantasy Tactics PS1 style, isometric tactical RPG sprite of a gaunt severe wizard in once-fine worn robes with a focus crystal on a chain, facing east (right, profile), casting mid-gesture with staff thrust forward and cold blue energy gathering at the crystal, muted slate and bone palette, clean readable silhouette, single subject on dark void matte background, three-quarter overhead tactical view, no UI no text no anime no sparkle --cref https://cdn.midjourney.com/90101afe-af43-4ca7-b10f-1ff9024634bf/0_0_1024_N.webp --ar 1:1 --style raw --v 6 |
| s | painterly hand-painted oil-painted Vagrant Story Unicorn Overlord Final Fantasy Tactics PS1 style, isometric tactical RPG sprite of a gaunt severe wizard in once-fine worn robes with a focus crystal on a chain, facing south (toward viewer), casting mid-gesture with staff raised and cold blue energy gathering at the crystal, muted slate and bone palette, clean readable silhouette, single subject on dark void matte background, three-quarter overhead tactical view, no UI no text no anime no sparkle --cref https://cdn.midjourney.com/90101afe-af43-4ca7-b10f-1ff9024634bf/0_0_1024_N.webp --ar 1:1 --style raw --v 6 |
| w | painterly hand-painted oil-painted Vagrant Story Unicorn Overlord Final Fantasy Tactics PS1 style, isometric tactical RPG sprite of a gaunt severe wizard in once-fine worn robes with a focus crystal on a chain, facing west (left, profile), casting mid-gesture with staff thrust forward and cold blue energy gathering at the crystal, muted slate and bone palette, clean readable silhouette, single subject on dark void matte background, three-quarter overhead tactical view, no UI no text no anime no sparkle --cref https://cdn.midjourney.com/90101afe-af43-4ca7-b10f-1ff9024634bf/0_0_1024_N.webp --ar 1:1 --style raw --v 6 |

---

## Harvest map (job → 4 files)

For each MJ job, all four quadrants download:
```
job(<animation>,<dir>) → 0_0 → <animation>_<dir>_0.png
                     → 0_1 → <animation>_<dir>_1.png
                     → 0_2 → <animation>_<dir>_2.png
                     → 0_3 → <animation>_<dir>_3.png
```

Total files: 16 jobs × 4 quadrants = 64 sprite frames.

*16 prompts. Execute with character-reference consistency across all 8 jobs per hero.*

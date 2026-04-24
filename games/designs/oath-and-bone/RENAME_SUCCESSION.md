# Rename Succession — Oath and Bone

**Written:** 2026-04-24  
**By:** Rename worker (session continuing from context-ceiling interruption)

---

## What happened this session

The game title was changed from **Crownsmoke** to **Oath and Bone**.

- All `.md` and `.html` files in `designs/oath-and-bone/` (formerly `designs/crownsmoke/`) were updated via two-pass perl replacement.
- The directory was renamed: `designs/crownsmoke/` → `designs/oath-and-bone/`
- SIDECARS.txt received a provenance footnote.
- RENAME_LOG.md documents exactly what changed and what was preserved.

## The one thing that must stay as "The Crownsmoke"

The **B12 finale battle** is an in-fiction event named *"The Crownsmoke"* — smoke over the old capital as the kingdom falls or endures. This is a named historical event inside the story, not a game title reference. It appears in four places and must never be changed by a future bulk rename:

- `BATTLES.md §13`: `## 13. B12 — The Crownsmoke (FINALE — ending-gated)`
- `STORY.md line ~694`: `### BATTLE 12 — *"The Crownsmoke"*`
- `DESIGN.md §B12`: `**B12: The Crownsmoke.** Finale.`
- `BUILD_PLAN.md §2.4.11`: `B12 "The Crownsmoke" (finale, ...)`

## Worker 9 flag (never actioned yet)

The following identifiers are in the design docs but not yet in any engine code. Wire them when implementing the game module:

```
localStorage key:  ksp_oathandbone_played
tutorial key:      ksp_oathandbone_tutorials_seen
XP action:         oathandbone_battle_victory
advisor observe:   observations.oathandbone
pricing namespace: window.KSP_PRICING.oathandbone.*
worker endpoints:  POST /oath-and-bone/convert-credits
                   POST /oath-and-bone/spend
JS files to create: js/game-oath-and-bone.js
                    js/game-oath-and-bone-engine.js
                    js/game-oath-and-bone.css
```

## What's next (unchanged from prior succession)

Read `AUTONOMOUS_BUILD.md` — it is the highest-priority document. The rename is complete; build work continues per that spec.

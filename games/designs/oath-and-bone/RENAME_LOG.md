# Rename Log — Crownsmoke → Oath and Bone

**Date:** 2026-04-24  
**Approved by:** Architect ("Oath and Bone. Agreed. Do the rename sweep.")

---

## What changed

| Identifier | Old | New |
|---|---|---|
| Game title | Crownsmoke | Oath and Bone |
| Directory | `designs/crownsmoke/` | `designs/oath-and-bone/` |
| HTML slug | `games/crownsmoke.html` | `games/oath-and-bone.html` |
| JS file prefix | `game-crownsmoke-*.js` | `game-oath-and-bone-*.js` |
| Save key | `ksp_crownsmoke_played` | `ksp_oathandbone_played` |
| Tutorial key | `ksp_crownsmoke_tutorials_seen` | `ksp_oathandbone_tutorials_seen` |
| Advisor XP action | `crownsmoke_battle_victory` | `oathandbone_battle_victory` |
| Advisor observe | `observations.crownsmoke` | `observations.oathandbone` |

## What was NOT changed (intentional)

| String | Location | Reason |
|---|---|---|
| `The Crownsmoke` | BATTLES.md §13 B12 header | In-fiction battle name — an event, not the game title |
| `The Crownsmoke` | STORY.md B12 battle heading | Same |
| `The Crownsmoke` | DESIGN.md §B12 entry | Same |
| `The Crownsmoke` | BUILD_PLAN.md §2.4.11 | Same |
| `"Crownsmoke"` mention | art/portraits/SIDECARS.txt | Provenance footnote — intentional historical record |
| `RENAME_CANDIDATES.md` | this directory | Provenance document — not renamed |

## Files modified

All `.md` files in `designs/crownsmoke/` (except RENAME_CANDIDATES.md) received bulk text replacement.  
All `.html` files in `designs/crownsmoke/art/` subtree received bulk text replacement.  
`art/portraits/SIDECARS.txt` received provenance footnote appended.

Art log files that received the bulk pass:
- EFFECTS_SPRITES_LOG.md
- SEAMLESS_LOG.md, SEAMLESS_PROMPTS.md
- TILES_LOG.md, TILES_PROMPTS.md
- SPELL_PROMPTS.md, SPRITE_PROMPTS.md
- PORTRAITS_TRIO_A_LOG.md, PORTRAITS_TRIO_B_LOG.md

## Worker 9 flag — engine integration required

When the game engine is built, wire these identifiers from scratch (no old-key migration needed — never in production):

```
save key:        ksp_oathandbone_played
tutorial key:    ksp_oathandbone_tutorials_seen
XP action:       oathandbone_battle_victory
advisor observe: observations.oathandbone
```

---

*Written before directory rename. After `mv`, this file lives at `designs/oath-and-bone/RENAME_LOG.md`.*

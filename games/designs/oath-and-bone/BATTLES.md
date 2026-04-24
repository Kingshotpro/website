# Oath and Bone — BATTLES.md

*Twelve Chapter 1 battle scenarios. Each battle carries the full schema the delegation pipeline needs: map geometry, terrain counts, starting coordinates, enemy composition, objectives, rewards keyed to ECONOMY.md, difficulty-tier specs, Soul Review feedback channels, and story flag read/write.*

*Rewrite 2026-04-21 by continuing Session 45. Supersedes the prior pass in the same session — that version had starting positions only for B1 and did not enumerate sanctum/ruin/forest hex counts per battle. This version is uniform across all twelve. Story beats and branch structure preserved from the prior pass and paired with STORY.md.*

---

## 0. Reading order

- `FRAME_UPDATE.md` — the Architect's reframe. Read before this file.
- `DESIGN.md` §2 — core gameplay loop. Verified Soul Review channels apply to every action.
- `MAGIC.md` §5 — magic-aware AI archetypes D/E/F (Cabal / Binding / Grove-Warden).
- `MUSTER_DESIGN.md` §4 — base AI archetypes A/B/C (Ironwall / Bladewind / Warden).
- `HEROES.md` — hero stats referenced in enemy/level tuning.
- `ECONOMY.md` §2 — base reward tiers; every battle's rewards inherit from the same table.
- `CROSS_INTERSECTION.md` — advisor / credit plug-points that fire from battle events.

---

## 1. Per-battle spec template

Every scenario fills this shape. The delegation prompt in §11 takes this schema and produces a `Scenario` data object for `game-oath-and-bone-battles.js`.

```
ID              B1..B12
Name            short title (STORY.md beat)
Act             1 | 2 | 3
Biome           plain | forest | ruin | ridge | grove | keep | crypt | throne | hybrid
Map             W × H hex
Elevation       max level (0..5) · notable tiles
Hex type count  sanctum N · ruin N · forest/grass N · grove N · impassable N
Starting pos    player south edge by default · enemy north · exceptions noted
Party slots     min–max · locked vs flexible
Objective       rout | capture-alive | escort | survive N turns | defend tile | multi-phase
Enemy comp      [count × archetype (Lv)]
Archetype mix   Muster ABC + Magic DEF
Rewards         XP (Scout/Sergeant/Marshal) · Crowns · credits · reagent drops · flags
Difficulty tier Scout 0.75× · Sergeant 1.0× · Marshal 1.5× (HP × · dmg × · rewards ×)
Tutorials       T1..T16 callout IDs triggered
Story flags     read: [...] · write: [...]
Branch data     (branch battles only) option A/B/C impact
Soul Review     ≥3 channels per major event — itemized
```

**Default coordinate system:** hex axial coordinates (q, r). Map width = max q, height = max r. Player start row = southernmost 1–2 rows. Enemy start row = northernmost 1–2 rows. Elevation rendered as sprite Y-offset per DESIGN.md §7 and BUILD_PLAN.md §1.1.1.

---

## 2. B1 — The Muster (Tutorial, no magic)

| Field | Value |
|---|---|
| **ID** | B1 |
| **Act** | 1 |
| **Biome** | plain + one ridge spur (north-center) |
| **Map** | 12W × 14H hex |
| **Elevation** | max 2 · ridge spine at rows 1–2 (elevation 2, 3 hexes wide) |
| **Hex type count** | sanctum 0 · ruin 0 · forest/grass 10 · grove 0 · impassable 0 · ridge 3 · plain (balance) |
| **Starting pos** | Player south: Vael (3,12), Halv (4,12), Brin (5,12). Enemy north: Bladewind-A (4,2), Bladewind-B (6,2), Bladewind-C (3,4), Bladewind-D (7,4), Ironwall archer (5,1) on ridge. |
| **Party** | 3, locked (Vael · Halv · Brin) |
| **Objective** | Rout — reduce all enemies to HP 0 |
| **Enemy comp** | 4× Bladewind infantry (Lv 2) + 1× Ironwall archer (Lv 3) |
| **Archetype mix** | B (Bladewind) dominant · A (Ironwall) secondary — matches Muster's "stubborn but punishes opportunities" pairing |
| **AI priority** | Bladewind: close-to-melee, flank lowest HP. Archer: hold ridge, +20% dmg from elevation, retreats if HP<25%. |
| **Rewards** | Scout 45 / Sergeant 60 / Marshal 90 XP · 50 Crowns · 1 credit (first Sergeant+ of day) · no reagents |
| **Difficulty tier** | Scout 0.75× HP/dmg/reward · Sergeant 1.0× · Marshal 1.5× HP / 1.25× dmg / 1.5× reward |
| **Tutorials** | T1 troop triangle (first attack) · T2 elevation +20% (first ridge shot) · T3 hold verb (turn 3 if unused) |
| **Story flags** | read: none · write: `b1_complete`, `first_battle_victory` (fires credit grant) |
| **Soul Review** | Sword clash = slide + blade cue + HP number + Halv barb *"Not past me."* (4 ch). · Kill = desaturate 0.5s + low tone + HP=0 flag + party line (4 ch). · Victory = gold sparkle + rising chord + XP/Crown float + advisor orb pulse (4 ch). |

**Tutorial callout copy (dismissible after first clear):**
- T1 *"Troop triangle: infantry beats cavalry · cavalry beats archer · archer beats infantry. +20% damage on favorable matchup."*
- T2 *"Elevation: +20% damage attacking down, -20% attacking up. Ranged attacks gain +1 hex range firing down."*
- T3 *"Hold: end a unit's turn early to accumulate Resolve and regen partial resources."*

---

## 3. B2 — The Hollow

| Field | Value |
|---|---|
| **Act** | 1 |
| **Biome** | forest + river (one-hex corridor, 2 fords) |
| **Map** | 14W × 12H hex |
| **Elevation** | max 1 · low variation · river impassable except fords |
| **Hex type count** | sanctum 0 · ruin 1 (dead-deer ring, center) · forest/grass 48 · grove 0 · impassable 14 (river) · plain (balance) |
| **Starting pos** | Player south: Vael (4,11), Halv (6,11), Brin (8,11), (Thessa NPC-ally (10,11) if pre-recruit route). Enemy north: 2× bandit (5,2) (9,2), 2× harvester (4,4) (10,4), 1× scripted-surrender harvester (7,3) next to ring, 1× Ironwall flanker (3,6). |
| **Party** | 3–4 flexible · Vael locked · Halv/Brin expected · Thessa NPC-ally if STORY.md branch |
| **Objective** | Rout + capture-alive the harvester scripted to surrender at HP ≤ 20% |
| **Enemy comp** | 3× Bladewind bandits (Lv 3) + 2× Ironwall melee (Lv 3) + 1× scripted-surrender harvester (Lv 2) |
| **Archetype mix** | B dominant · A secondary · surrender scripted |
| **AI priority** | Standard Muster AI — harvester retreats toward ring if party approaches |
| **Rewards** | Scout 60 / Sergeant 80 / Marshal 120 XP · 60 Crowns · 0 credits (B2 not credit-gated) · `bone_dust × 1` if surrender captured |
| **Difficulty tier** | Scout 0.75× · Sergeant 1.0× · Marshal 1.5× (same curve as B1) |
| **Tutorials** | T4 forest line-of-sight (first LoS block) · T5 fords as chokepoint (first ford move) |
| **Story flags** | read: `b1_complete` · write: `b2_complete`, `kit_burned`|`kit_kept` (branch: burn ritual kit or carry it out) |
| **Soul Review** | Ring discovery = screen desaturate 0.3s + low drone + Brin *"Poachers don't arrange."* (3 ch). Harvester surrender = sprite drop-weapon + soft chord + prompt modal + Halv sigh (4 ch). |

---

## 4. B3 — The Crypt Gate (first magic exposure, no player casting)

| Field | Value |
|---|---|
| **Act** | 1 |
| **Biome** | ruin (3-tier descent) |
| **Map** | 10W × 16H hex (narrow, deep) |
| **Elevation** | max 3 · stepped downward toward crypt mouth at (5,14) |
| **Hex type count** | sanctum 0 · ruin 28 · forest/grass 4 · grove 0 · impassable 6 (sealed doors) · plain (balance) |
| **Starting pos** | Player top of descent: Vael (4,1), Halv (5,1), Brin (6,1), flex slot (4,3). Enemy spawns staged: Turn 1: 2× Bladewind (4,8) (6,8), 2× Ironwall (3,10) (7,10). Turn 4: +1 Bone-Wraith (5,12). Turn 6 (Thessa-gate only): +1 wraith (5,14), Thessa enters NPC-ally at (5,1). |
| **Party** | 3–4 flexible |
| **Objective** | Survive 6 turns **OR** reach crypt door (5,14) **OR** rout wraith — any of the three ends the battle |
| **Enemy comp** | Turn 1 wave: 2× Bladewind (Lv 4) + 2× Ironwall (Lv 4). Turn 4 spawn: 1× Bone-Wraith (Lv 5, archetype E Binding). Turn 6 optional: +1 wraith (Lv 5). |
| **Archetype mix** | A+B turn 1 · E turn 4 (first magic enemy ever seen by the player) |
| **AI priority** | Wraith: ignores armor, prioritizes lowest-HP party member, casts Curse of Weakness turn 5 |
| **Rewards** | Scout 80 / Sergeant 110 / Marshal 165 XP · 70 Crowns · 0 credits · `bone_dust × 2` · flag `crypt_opened` |
| **Difficulty tier** | Same curve. Marshal adds 1× extra wraith turn 5. |
| **Tutorials** | T6 non-troop enemy (*"Magic ignores armor. Position for cover."*) on first wraith sight · T7 status effects (on first Curse applied) |
| **Story flags** | read: `b2_complete`, `kit_*` · write: `b3_complete`, `thessa_met` (if Thessa-gate path taken) |
| **Soul Review** | Wraith dissolve-in = screen -15% brightness + dissonant choral stinger + Halv *"Oh, my lord."* + sprite fade-in (4 ch). Curse apply = target desaturate + low dirge + status icon + Brin warning line (4 ch). |

---

## 5. B4 — The Ridge (BRANCH — 3 options)

| Field | Value |
|---|---|
| **Act** | 1 |
| **Biome** | ridge (central spine) + 2 flanks (plain) |
| **Map** | 16W × 10H hex |
| **Elevation** | max 3 (ridge spine rows 4–6, center column q=8) · steep climb both sides |
| **Hex type count** | sanctum 0 · ruin 0 · forest/grass 12 · grove 0 · impassable 0 · ridge 8 · plain (balance) |
| **Starting pos** | Player south (rows 8–9 centered on q=5–9): Vael (6,9), Halv (7,9), Brin (9,9), Caelen-or-Thessa (5,9) if recruited. Enemy varies per branch (see below). |
| **Party** | 4 |
| **Objective** | Varies per branch |
| **Rewards (common)** | Scout 100 / Sergeant 135 / Marshal 200 XP · 80 Crowns · 1 credit |
| **Branch data** | Flag `orik_branch ∈ {submit, refuse, equal}` — written post-battle |

**Branch A — Submit:**
- Enemy start: Karrow raiders north (q=4,r=1), (q=8,r=1), (q=12,r=1), (q=6,r=3), (q=10,r=3), (q=14,r=3)
- Enemy comp: 4× Bladewind raiders (Lv 4) + 2× Warden skirmishers (Lv 5)
- NPC ally: Orik (AI-controlled) starts at (8,8) — fights alongside
- Objective: Rout raiders
- Side effect: `halv_loyalty −2` (barbs flatten), Orik unrecruitable in Act 3

**Branch B — Refuse:**
- Enemy start: Orik's banner north (q=8,r=1 for Orik-boss), 2× Ironwall (q=6,r=2) (q=10,r=2), 3× Bladewind (q=5,r=3) (q=8,r=4) (q=11,r=3)
- Enemy comp: 2× Ironwall (Lv 5) + 3× Bladewind (Lv 5) + 1× Orik-boss (Lv 7, Warden elite, 200 HP)
- Objective: Rout Orik's banner · permadeath warning modal on accept
- Side effect: Brin gains line *"He was always like that."* · Orik unrecruitable

**Branch C — Ally-as-Equal:** *(requires Brin alive AND `kit_kept` from B2)*
- Enemy start: harvesters enter from two flanks over 6 turns (east: q=15, west: q=1)
- Enemy comp: 6× mixed Bladewind/Binding harvesters (Lv 5) — 3 per flank over 6 turns
- NPC ally: Orik + banner joint-defends with party
- Objective: Hold the ridge spine for 6 turns — both Vael's and Orik's banners standing
- Side effect: `orik_ally_equal` flag set · Orik **recruitable at B11** if he survives this battle · unlocks Widens ending path

**Tutorial:** T8 NPC-ally units (*"Allied units act on shared turn. Positioning matters."*) on first ally turn.

**Soul Review:** option-specific cutscene frames — Submit = Orik hand-on-scar, Halv glance · Refuse = parley-tent collapse · Equal = banners planted side-by-side. Each passes ≥3 channels (visual + audio + narrative).

---

## 6. B5 — The Tower (Wizardry introduced · Caelen recruits)

| Field | Value |
|---|---|
| **Act** | 2 |
| **Biome** | ruin + sanctum (tower interior + approach) |
| **Map** | 11W × 15H hex |
| **Elevation** | max 3 · tower floors 1–3 (rows 1–6) · ground approach (rows 7–15) |
| **Hex type count** | sanctum 8 (tower interior, +6 mana regen/turn for wizards) · ruin 18 · forest/grass 6 · grove 0 · impassable 10 (walls) · plain (balance) |
| **Starting pos** | Player south approach (rows 13–14): Vael (4,14), Halv (5,14), Brin (6,14), flex (7,14). Caelen NPC-ally joins Turn 1 inside tower at (5,3) — must be kept alive. Enemy north: mercenaries (q=4,r=8), (q=6,r=8), (q=8,r=8), (q=3,r=10), (q=7,r=10), (q=9,r=10). Necro-lieutenant (q=5,r=6). |
| **Party** | 4 + Caelen NPC |
| **Objective** | Survive 6 turns while Caelen channels — if Caelen HP reaches 0, defeat |
| **Enemy comp** | 6× Bladewind mercenaries (Lv 6) + 1× Necro-lieutenant (Lv 7, archetype E Binding, circle-and-line glyph mark visible post-battle) |
| **Archetype mix** | B dominant (mercs close on Caelen) · E secondary (lieutenant summons 1 wraith Turn 3) |
| **AI priority** | Mercs: shortest path to Caelen tile. Lieutenant: maintain 3-hex spacing, summon Turn 3, cast Curse of Weakness on highest-Atk hero Turn 5. |
| **Rewards** | Scout 120 / Sergeant 160 / Marshal 240 XP · 100 Crowns · 2 credits · Caelen **recruited** post-battle · Wizardry spell unlock: Firebolt (added to Caelen's `spells_learned`) |
| **Difficulty tier** | Scout 0.75× · Sergeant 1.0× · Marshal adds +1 merc wave on Turn 4 |
| **Tutorials** | T9 Cast verb (*"Spend Mana for spells. Range + cost shown pre-commit."*) on first Caelen cast · T10 channel interrupt (*"Damage during cast aborts spell."*) on any cast interruption |
| **Story flags** | read: `b3_complete` · write: `b5_complete`, `caelen_recruited`, `vellum_named = true` |
| **Soul Review** | First Cast = channel glow 1.2s + wizard stinger (rising tone) + MP drain number + Caelen *"Down."* (4 ch). Channel interrupt = abort SFX + red flash + aborted-status icon + *"...not now."* line (4 ch). |

---

## 7. B6 — The Pact (BRANCH — Necromancy introduced · Marrow recruits)

| Field | Value |
|---|---|
| **Act** | 2 |
| **Biome** | keep interior + water (moat) |
| **Map** | 13W × 11H hex |
| **Elevation** | max 2 · battlements (elevation 2) · courtyard (elevation 0) |
| **Hex type count** | sanctum 0 · ruin 12 (keep stones) · forest/grass 0 · grove 0 · impassable 16 (moat + walls) · plain (balance) |
| **Starting pos** | Varies per branch (see below). Player default south (rows 9–10 centered q=5–8). Marrow cell at (6,4) — escort target in Trust/Leash branches. Extract tile at (6,10) — south edge. |
| **Party** | 4 (Thessa present if recruited at B3 Thessa-gate) |
| **Rewards (common)** | Scout 140 / Sergeant 190 / Marshal 280 XP · 120 Crowns · 2 credits |
| **Branch data** | Flag `marrow_state ∈ {leave, trust, leash}` |

**Branch A — Leave:**
- No battle. Pre-battle dialogue, sunrise cut to camp. Flag `marrow_state = leave` set.
- XP/credit not granted. Gate to non-necromancy Ch1 path.

**Branch B — Free-and-Trust:**
- Enemy start: garrison on battlements (q=3,r=3), (q=5,r=3), (q=7,r=3), (q=9,r=3), (q=11,r=3). Warden-captain at (6,2) on battlement.
- Enemy comp: 5× Ironwall garrison (Lv 6) + 1× Warden-captain (Lv 8)
- Archetype mix: A dominant · C secondary
- Marrow fights from Turn 2 onward: **unequipped**, HP 50 / Atk 4, 1 base spell (Curse of Weakness only)
- Objective: Extract Marrow — reach cell (6,4), then escort Marrow to extract tile (6,10). Fails if Marrow HP 0.
- Side effect: Marrow recruited at reduced stats until camp-equip · Necromancy spell unlock: Raise Skeleton

**Branch C — Free-and-Leash:**
- Same enemy placement and composition as Trust.
- Marrow fights compelled: stats ↑ HP 80 / Atk 7 / full 4-spell slate; moves under partial player control with 20% chance/turn of disobeying one command.
- Objective: Same as Trust.
- Side effect: Thessa (if present) leaves the active party at battle end — reserves-only for Ch1 · flag `thessa_loyalty = -permanent`

**Tutorials:** T11 escort objective (*"Escort units must reach the exit tile. Their death ends the battle."*) at Trust/Leash battle start.

**Soul Review:** Compelled-Marrow visual (Leash only) = faint glyph-glow at base of neck pulsing when casting + dissonant sub-bass + disobey prompt modal + Marrow line *"Thank you for the privilege of serving."* sardonic (4 ch). Trust-free Marrow = no glyph + clean cast SFX + Marrow line *"Serve me."* normal (3 ch).

---

## 8. B7 — The Grove Under Siege (BRANCH — Druidry introduced)

| Field | Value |
|---|---|
| **Act** | 2 |
| **Biome** | grove + forest (Verdance +10 start bonus for Thessa) |
| **Map** | 15W × 13H hex |
| **Elevation** | max 1 · heartwood tile elevation 1 (bonus sanctum equivalent for druid) |
| **Hex type count** | sanctum 0 · ruin 0 · forest/grass 72 · grove 6 (inner ring) · heartwood 1 (center, (7,6)) · impassable 8 (ancient trees) · plain (balance) |
| **Starting pos** | Varies per branch. Defend-default player south (rows 10–11): Vael (5,11), Halv (7,11), Brin (9,11), Caelen (11,11), Thessa (7,10 — heartwood-adjacent). Enemy staged from north + east + west edges over 8 turns. Grove-druid NPC allies: (3,6), (11,6), (7,3). |
| **Party** | 4–5 |
| **Rewards** | Scout 150 / Sergeant 200 / Marshal 300 XP · 130 Crowns · 2 credits · `minor_seed × 2` |
| **Branch data** | Flag `thessa_state ∈ {defend, abandon}` |

**Branch A — Defend:**
- Objective: Hold the heartwood tile (7,6) for 8 turns. Any enemy standing on (7,6) at end of turn 8 = defeat.
- Enemy waves over 8 turns: Turn 1: 4× Bladewind at north (q=3,1), (q=7,1), (q=11,1), (q=7,3). Turn 3: 2× Warden at east/west (q=14,5), (q=0,5). Turn 5: 2× Bladewind reinforcements (q=5,1), (q=9,1). Turn 6: 1× crown-captain (Lv 9 Ironwall) at (q=7,2).
- Enemy comp: 8× Bladewind (Lv 7) + 2× Warden (Lv 7) + 1× crown-captain (Lv 9 Ironwall)
- Archetype mix: B+C dominant · A in final wave
- NPC allies: 3× grove-druid (archetype F Grove-Warden, Lv 5; auto-heal on adjacent ally, 1× Thorn Grove cast each)
- Rewards bonus: Thessa loyalty locked max · Hollow Child recruitment flag set for Act 3
- Tutorial T12: terrain spells (*"Druid can reshape the map. Use Thorn Grove or Living Terrain."*) on first Thessa active-terrain spell.

**Branch B — Abandon:**
- No battle. Thessa leaves party permanently. `thessa_loyalty = 0`.
- Crown relationship preserved for B10 Coerce option.

**Soul Review (Defend):** Heartwood defense = Thessa mid-cast halo (gold-green) + sustained druid chord + Verdance numeric + Thessa *"Breathe."* (4 ch). Grove-druid NPC cast = choral stinger + forest-hum + heal number + grove-elder one-line (4 ch).

---

## 9. B8 — The Old Binding (all 3 schools active)

| Field | Value |
|---|---|
| **Act** | 2 |
| **Biome** | crypt + ruin (Dark Rites vault OR Thorne family chapel variant per STORY.md §5) |
| **Map** | 12W × 12H hex (vault layout) |
| **Elevation** | max 2 · stepped altar center (6,6) elevation 2 |
| **Hex type count** | sanctum 4 (altar corners — mana regen for Caelen) · ruin 48 · forest/grass 0 · grove 0 · impassable 12 (sealed doors + altar rim) · plain (balance) |
| **Starting pos** | Player enters from south door: Vael (5,11), Halv (6,11), Brin (7,11), Caelen (5,10), Marrow (7,10), Thessa (6,10). Wave spawns staged (Turn 1 N, Turn 3 N+E, Turn 5 altar). |
| **Party** | 5–6 (full Act 2 roster) |
| **Objective** | Rout waves → forced combo on Wave 3 (Bone Shield + Fireball + Heal chain within 3-turn window) |
| **Enemy comp** | Wave 1 (Turn 1): 4× Bladewind harvesters (Lv 8). Wave 2 (Turn 3): 2× Cabal casters (Lv 9) + 1× Binding summoner (Lv 9) + 2× wraiths (Lv 7, summoned). Wave 3 (Turn 5): final multi-school hinge — 1× Cabal boss (Lv 10) + 1× Binding boss (Lv 10) + 1× Grove-Warden corrupted (Lv 10). |
| **Archetype mix** | All six archetypes (A–F) appear in one battle for the first time |
| **Rewards** | Scout 200 / Sergeant 270 / Marshal 400 XP · 180 Crowns · 3 credits · `grave_salt × 1`, `minor_seed × 1` · flag `tether_accepted = true` (gates Act 3 endings) |
| **Difficulty tier** | Same curve. Marshal: Wave 3 bosses +1 Lv each. |
| **Tutorials** | T13 multi-school combo (scripted prompt on Wave 3: *"Cast from all three schools this turn for full damage."*) |
| **Story flags** | read: all Act 2 flags (`b5_complete`, `caelen_recruited`, `marrow_state`, `thessa_state`) · write: `b8_complete`, `vellum_method_revealed = true`, `ring_fits_progression = 0.7` (UI ring tightens one step) |
| **Soul Review** | Ledger reveal = 4-channel (glyph-glow visual + low chord + Marrow line *"This is her handwriting."* + tactile UI ring-shift). Multi-school combo = tri-color flash (blue+green-black+gold-green) + harmonic chord-stack + combined damage number + Caelen/Marrow/Thessa simultaneous lines (4 ch). |

---

## 10. B9 — The Reckoning at the Keep

| Field | Value |
|---|---|
| **Act** | 3 |
| **Biome** | keep ruin (Hollowcourt) · **no sanctum tiles** by design — Mana is scarce here |
| **Map** | 18W × 14H hex (great-hall + two wings) |
| **Elevation** | max 3 · throne dais (9,1) elevation 3 |
| **Hex type count** | sanctum 0 (intentional) · ruin 82 · forest/grass 0 · grove 0 · impassable 24 (pillars + wings) · plain (balance) |
| **Starting pos** | Player south entrance: Vael (7,13), Halv (9,13), Brin (11,13), Caelen (8,12), Marrow (10,12), Thessa (9,11). Enemy north: 4× marked-soldiers (q=5,r=3), (q=8,r=3), (q=11,r=3), (q=14,r=3). 2× lieutenants (q=7,r=2), (q=11,r=2). Vellum appears on dais Turn 5 at (9,1). |
| **Party** | 5–6 |
| **Objective** | Rout all enemies + survive the **Heard** debuff wave from Turn 5 onward |
| **Enemy comp** | 4× Bladewind marked-soldiers (Lv 10) + 2× Binding lieutenants (Lv 11) + 4× bone-wraiths (Lv 9, summoned by lieutenants Turn 1) |
| **Archetype mix** | B dominant · E secondary with summons (turn 1 each lieutenant summons 2 wraiths) |
| **AI priority** | Lieutenants maintain 3-hex spacing behind wraiths · wraiths prioritize casters (Caelen, Marrow, Thessa) |
| **Scripted beat** | **Turn 5:** Vellum appears on dais as pale smear. Combat pauses 4 sec real-time. Each hero hears Vellum's line privately (audio one-to-one, panned). Resume with **Heard** debuff — `-5% accuracy, party-wide, uncleansable, rest of battle`. |
| **Rewards** | Scout 250 / Sergeant 335 / Marshal 500 XP · 220 Crowns · 3 credits · `grave_salt × 2` · flag `ring_fit = true` (portrait UI updates) |
| **Difficulty tier** | Same curve. Marshal: Heard debuff `-8%` instead of `-5%`. |
| **Tutorials** | T14 uncleansable debuff (*"Some effects cannot be removed. Outlast them."*) on Heard apply |
| **Story flags** | read: `b8_complete`, `tether_accepted` · write: `b9_complete`, `vellum_seen = true` |
| **Soul Review** | Vellum appearance = audio-only private line (panned by hero position) + screen freeze 4 sec + pale-smear visual + party reaction frame (simultaneous heads turn) (4 ch). Heard apply = party-wide desaturate flash + dirge-whisper + debuff-icon + Caelen *"She's heard."* (4 ch). |

**Tuning note (Heard debuff, open question carried from prior session):** Sergeant tier `-5%` accuracy shipped. Marshal tier `-8%` tested; if playtesters breeze through B9, tune up in Phase 3 polish. Considered but not shipped: `+1 turn to cast channels` (adds complexity without clearer flavor).

---

## 11. B10 — The Kingdom's Choice (BRANCH — political, 3 options)

| Field | Value |
|---|---|
| **Act** | 3 |
| **Biome** | throne hall (Highspire) — polished floor, no terrain effects |
| **Map** | 14W × 10H hex (formal geometry) |
| **Elevation** | flat 0 throughout |
| **Hex type count** | sanctum 0 · ruin 0 · forest/grass 0 · grove 0 · impassable 18 (pillars, throne dais block) · plain (balance) |
| **Starting pos** | Varies per branch. Coerce default: player south (rows 8–9), Kingsguard north (row 1–2), throne dais (7,1) impassable. Thessa's exit tile (7,9) if leashed at B6. |
| **Party** | 5–6 (Thessa absent if abandoned at B7 OR leashed at B6) |
| **Rewards (common)** | Scout 200 / Sergeant 270 / Marshal 400 XP · 150 Crowns · 2 credits |
| **Branch data** | Flag `crown_choice ∈ {defy, coerce, truth}` |

**Branch A — Defy:**
- No throne-hall battle. Mounted road-montage: 3× harvester ambush waves (quick-resolve combat, 2 min real-time each).
- Wave 1 (q=3,1)–(q=9,1): 3× Bladewind raiders (Lv 11). Wave 2 (q=5,1)–(q=9,1): 3× Bladewind + 1× Binding (Lv 11). Wave 3 (q=4,1)–(q=10,1): 4× Warden skirmishers (Lv 12).
- NPC-ally: Orik if recruited at B4 Equal path (rides with party at (q=6,10))
- XP partially granted at 0.7× base.

**Branch B — Coerce:**
- Throne-hall formal duel: 8× Kingsguard (Lv 12 Ironwall) at rows 1–3 (q=2,2), (q=4,2), (q=6,2), (q=8,2), (q=10,2), (q=12,2), (q=5,3), (q=9,3).
- Rule modifier: "honor combat" restricts spell AoE to ≤2 hex max — *"no collateral on the court"*
- Scripted: if Thessa is still in party, she leaves on Turn 3 — staff dropped on floor at (7,6), walks to exit (7,9)
- Side effect: `king_bound = true` · locks Falls ending path

**Branch C — Truth:** *(requires `thessa_state = defend` AND `marrow_state = trust` AND `orik_branch ∈ {refuse, equal}`)*
- No combat. Scroll-reading scene: King reads Vellum-script scroll for a full 60-sec camera hold, silent, soft-focus court.
- Court commits banners one by one.
- Side effect: `widens_unlocked = true`

**Soul Review (Truth):** King reading scroll = 60-sec visual hold + ambient silent-court-murmur + narrative: advisor orb pulses a single line in player UI only *"He is reading."* + subtle ring-loose UI animation on Vael's portrait (4 ch). Earns its silence.

---

## 12. B11 — The Old Ones

| Field | Value |
|---|---|
| **Act** | 3 |
| **Biome** | Thorne Crypt (custom biome "old-writing" — inscribed floor tiles) |
| **Map** | 14W × 14H hex (circle-and-line painted on floor) |
| **Elevation** | max 1 · circle rim +1 (radius 4 from center (7,7)) |
| **Hex type count** | sanctum 0 · ruin 140 · forest/grass 0 · grove 0 · impassable 12 (Vellum-circle barrier until broken) · old-writing 24 (inscribed floor — special behavior in Phase 2) · plain (balance) |
| **Starting pos** | Player south entrance: Vael (6,13), Halv (8,13), Brin (5,12), Caelen (7,12), Marrow (9,12), Thessa (6,11) [if alive]. Vellum circle center (7,7). Two seal tiles (4,4) and (10,4). |
| **Party** | 5–6 (full current roster) |
| **Objective** | **3 phases** — (1) Break Vellum's circle (120 HP, reducible only by spells — 2 casters required); (2) Survive Old-One "weather" for 4 turns; (3) Seal door — 2 heroes stand on opposing tiles (4,4) and (10,4) for 2 turns each |
| **Enemy comp** | Phase 1: Vellum-form (ScriptedEntity, cannot be directly attacked) + circle (120 HP, spell-only). Phase 2: environmental Old-One weather — each turn, 3 random tiles overwrite to "un-writing" (removes terrain mods, status, summons on those tiles). Phase 3: 4× wraith stragglers (Lv 10) + Vellum residual pulse (5 dmg/turn party-wide, uncleansable) |
| **Archetype mix** | E residual · environmental phase |
| **Rewards** | Scout 400 / Sergeant 540 / Marshal 800 XP · 300 Crowns · 4 credits · `withered_heart × 1` |
| **Difficulty tier** | Same curve. Marshal: Phase 2 weather overwrites 4 tiles/turn instead of 3. |
| **Tutorials** | T15 multi-phase objective (*"Objective updates each phase. Watch the top-bar."*) · T16 un-writing (*"Old-One weather erases. Nothing held on these tiles persists."*) |
| **Story flags** | read: `ring_fit`, `b9_complete` · write: `b11_seal_success`, `torren_bound ∈ {yes, no}` (player choice in post-battle modal) |
| **Soul Review** | Un-writing tiles = blank-white flash 1 frame + 0.8-sec silence (eerie negative space) + Caelen *"She's telling the truth."* (3 ch). Seal complete = harmonic chord + tile glow-green-then-sealed + party reaction frame + ring-shimmer UI (4 ch). |

**Post-battle hinge (modal):**
- **Bind Torren** → `torren_bound = yes` · Thessa leaves permanently (if alive) · locks Falls ending
- **Do not bind** → `torren_bound = no` · Vael carries Vellum-residue forward (cosmetic: subtle glyph-shimmer on ring in B12 final scene)

---

## 13. B12 — The Crownsmoke (FINALE — ending-gated)

| Field | Value |
|---|---|
| **Act** | 3 |
| **Biome** | varies by ending (see below) |
| **Map** | varies by ending · 14W × 12H min |
| **Party** | full roster |
| **Rewards** | Scout 500 / Sergeant 670 / Marshal 1000 XP · 400 Crowns · 5 credits · **Chapter 1 complete** flag (500 Crown + 200 XP + 3 credit completion bonus per ECONOMY.md §2) |

### Ending: Endures
**Triggers:** `crown_choice = defy` AND `thessa_state = defend` AND `torren_bound = no` AND `marrow_state ≠ leash`
- Biome: borderland plain + Ashreach approach
- Map: 14W × 12H
- Hex type count: sanctum 0 · ruin 8 (abandoned outposts) · forest/grass 48 · grove 2 · impassable 6 · plain (balance)
- Starting pos: Player south (rows 10–11). Vellum-remnant raid enters from north (row 1) Turn 1, east (col 13) Turn 3.
- Objective: Rout final Vellum-remnant raid (post-seal stragglers) · no boss fight
- Enemy comp: 10× mixed Bladewind/Binding (Lv 13) + 1× Vellum-shade (Lv 14, lieutenant-scale only)
- Closing scene: Ashreach spring, ring-fitted-with-scar (per STORY.md §6)
- Soul Review: Closing frame = Vael's ring-hand close-up + spring-birdsong + Halv *"You did it, my lord."* (3 ch)

### Ending: Falls
**Triggers:** any of — `marrow_state = leash` OR `crown_choice = coerce` OR `torren_bound = yes`
- Biome: Highspire throne hall converted to keep
- Map: 14W × 10H
- Hex type count: sanctum 0 · ruin 70 · forest/grass 0 · grove 0 · impassable 18 (pillars) · plain (balance)
- Starting pos: Player defending the bound King in center (q=7,r=5). Kingsguard defectors enter from north + east + west.
- Objective: Defend the bound King for 6 turns
- Enemy comp: 6× Kingsguard-defector (Lv 14 Ironwall) + 2× Warden assassins (Lv 13)
- Closing scene: camera pull from Highspire to dark continent, wet-ash smoke · Marrow final line (per STORY.md §6)
- Soul Review: Closing frame = aerial pull-out + dirge + Marrow *"The fire was always going to reach Highspire."* (3 ch)

### Ending: Widens
**Triggers:** `crown_choice = truth` AND `thessa_state = defend` AND `marrow_state = trust` AND `torren_bound = no` AND `orik_branch ∈ {refuse, equal}`
- Biome: Thorne Crypt + Ashreach courtyard (two-phase)
- Map: 14W × 14H (phase 1) → 12W × 10H (phase 2)
- Hex type count (combined): sanctum 4 · ruin 40 · forest/grass 12 · grove 2 · impassable 10 · plain (balance)
- Starting pos: Phase 1 full party positioned for casting chain (diamond pattern around Thorne Crypt seal). Phase 2: ceremonial arrangement at Ashreach courtyard (no combat).
- Objective: Phase 1 — full-party casting chain to seal the door permanently (environmental countdown 6 turns). Phase 2 — no enemies · ceremonial sequence.
- Enemy comp: Phase 1: no enemies (environmental only). Phase 2: none.
- Closing scene: Thorne Crypt sealed · King present · Hollow Child if recruited · ring-loose-by-choice (per STORY.md §6)
- Soul Review: Closing frame = Thorne Crypt seal completes + harmonic chord stack (6-voice) + each surviving hero gets one close-frame + Vael voice-over final line (4 ch)

---

## 14. Difficulty tier multipliers (global)

Applied at scenario load per player-selected difficulty. Consistent across all twelve battles unless overridden per-battle.

| Tier | Enemy HP × | Enemy dmg × | Rewards × | Permadeath |
|---|---|---|---|---|
| Scout | 0.75 | 0.80 | 0.75 | Merciful (default) |
| Sergeant | 1.00 | 1.00 | 1.00 | Classic (default) |
| Marshal | 1.50 | 1.25 | 1.50 | Classic (enforced) |

Per `FRAME_UPDATE.md` §4: free tier reaches all content at every difficulty. Marshal is a prestige difficulty, not a paywall.

Per-battle overrides are called out in each section (e.g., B9 Heard debuff tuning, B11 un-writing tile count).

---

## 15. Enemy archetype reference (inline)

Per `MUSTER_DESIGN.md` §4 and `MAGIC.md` §5. Six archetypes total; every Ch1 battle mixes two (70/30 dominant/secondary per Muster's weighting rule), except B8 which uses all six once.

| ID | Name | Role | Signature behavior |
|---|---|---|---|
| A | Ironwall | tanky infantry | holds ground · adjacent-ally +1 def · never pursues past midline |
| B | Bladewind | mobile melee | shortest-path flank · targets lowest HP · risk-blind below 25% HP |
| C | Warden | ranged skirmisher | calculates counter-triangle advantage board-wide · kites |
| D | Cabal | wizard-dominant | maintains 3-hex spacing · AoE spells where hit ≥ 2 |
| E | Binding | necro + summons | turn-1 summon 2 minor skeletons · curses high-atk units · corpse-explodes reactively |
| F | Grove-Warden | druid support | converts adjacent tiles to Thorn Grove · heals lowest-HP ally · pack-calls at druid HP ≤ 25% |

---

## 16. Reward table (inheriting ECONOMY.md §2 base)

Base Crown-per-win at Sergeant tier is 50. Scaling below is per-battle (narrative reward weighting) applied on top of difficulty tier multiplier. Exact final payouts are in each battle section above.

| Battle | Sergeant XP | Sergeant Crowns | Credits | Reagent drops |
|---|---|---|---|---|
| B1 | 60 | 50 | 1 | — |
| B2 | 80 | 60 | 0 | `bone_dust ×1` (conditional) |
| B3 | 110 | 70 | 0 | `bone_dust ×2` |
| B4 | 135 | 80 | 1 | — |
| B5 | 160 | 100 | 2 | — |
| B6 | 190 | 120 | 2 | — |
| B7 | 200 | 130 | 2 | `minor_seed ×2` |
| B8 | 270 | 180 | 3 | `grave_salt ×1`, `minor_seed ×1` |
| B9 | 335 | 220 | 3 | `grave_salt ×2` |
| B10 | 270 | 150 | 2 | — |
| B11 | 540 | 300 | 4 | `withered_heart ×1` |
| B12 | 670 | 400 | 5 | — (chapter-complete bonus instead: 500 Crowns + 200 XP + 3 credits) |

**Daily credit cap:** 5 credits/day from Oath and Bone per ECONOMY.md §2. First Sergeant+ victory each day gates the credit grant per `CROSS_INTERSECTION.md`.

**Multipliers (stacking, applied after difficulty tier):**
- Triangle discipline (≥70% counter-favorable attacks): +10% Crowns
- No-death bonus (no hero fell): +20% Crowns
- Campaign Pass active: +50% Crowns
- KingshotPro Pro: +25% XP
- Rewarded-video XP booster: +20% XP (opt-in, 2/day cap)

---

## 17. Tutorial callout index (T1–T16)

| ID | Trigger | Battle introduced | Copy head |
|---|---|---|---|
| T1 | First attack | B1 | *"Troop triangle..."* |
| T2 | First ridge shot | B1 | *"Elevation..."* |
| T3 | No hold by turn 3 | B1 | *"Hold..."* |
| T4 | First LoS block | B2 | *"Forest line-of-sight..."* |
| T5 | First ford move | B2 | *"Fords as chokepoints..."* |
| T6 | First wraith sight | B3 | *"Magic ignores armor..."* |
| T7 | First status apply | B3 | *"Status effects..."* |
| T8 | First NPC-ally turn | B4 | *"Allied units..."* |
| T9 | First player cast | B5 | *"Spend Mana for spells..."* |
| T10 | First channel interrupt | B5 | *"Damage during cast..."* |
| T11 | First escort start | B6 | *"Escort units..."* |
| T12 | First terrain spell | B7 | *"Druid can reshape..."* |
| T13 | B8 Wave 3 scripted | B8 | *"Cast from all three schools..."* |
| T14 | First Heard apply | B9 | *"Uncleansable effects..."* |
| T15 | B11 phase change | B11 | *"Objective updates each phase..."* |
| T16 | First un-writing overwrite | B11 | *"Old-One weather erases..."* |

All callouts are dismissible after first clear and persist as "seen" in localStorage `ksp_oathandbone_tutorials_seen`.

---

## 18. Per-battle verification checklist (apply before each ships)

- [ ] Starting positions validated — no unit spawns on impassable, no two units stack
- [ ] Objective resolves correctly on both win and fail (and on each branch option if branch battle)
- [ ] Tutorial callouts trigger once, dismissible, persist after first clear
- [ ] `Advisor.grantXP('oathandbone_battle_victory', N)` fires once per Sergeant+ win (see CROSS_INTERSECTION.md)
- [ ] `Advisor.observe('oathandbone', dimension, value)` writes verified in `_state.observations.oathandbone` via browser console
- [ ] Credit grant fires once per first-Sergeant+-of-day (CROSS_INTERSECTION.md — pending worker endpoint)
- [ ] Rewards match the §16 table under the player's selected difficulty tier
- [ ] Permadeath flag persists through save/load cycles
- [ ] Branch flags write correctly on each option
- [ ] Soul Review: every major event fires ≥3 feedback channels (see per-battle Soul Review sections)
- [ ] Playtest: win path + defeat path + each branch option at least once
- [ ] Disclaimer visible: *"Unofficial. Not affiliated with Century Games."* on every surface
- [ ] No canonical Kingshot hero names anywhere (cross-check against `worker.js:13`)

---

## 19. Delegation prompt template (per-battle code generation)

> *You are generating `game-oath-and-bone-battles.js` scenario data for battle {ID}. Input: BATTLES.md §{section}. Output: a JS object matching the `Scenario` schema in `game-oath-and-bone-engine.js`.*
>
> *Rules:*
> *- Enemy archetypes are referenced by ID letter (A–F from §15). Do not invent new archetypes.*
> *- Hex coordinates are axial (q, r). Player south edge by default; enemy north.*
> *- Hex type counts in §{section} are target counts for map-generation — the map must include these terrain types in at least those counts, plus plain tiles to fill the remaining.*
> *- Do not reference canonical Kingshot hero names (check against `worker.js:13`).*
> *- Do not write dialogue strings inline — dialogue IDs pull from `game-oath-and-bone-story.js`.*
> *- If the scenario has a branch, produce one scenario variant per branch option, keyed by the `branch_data` flag value.*
> *- Rewards at Sergeant tier are the baseline; apply §14 multipliers at runtime via engine logic, not hard-coded.*
> *- Every major combat event emits ≥3 Soul Review feedback channels — enumerate them in the scenario data's `feedback` field, do not leave it to the engine defaults.*
>
> *Verify before returning:*
> *- Starting positions are all on valid tiles (not impassable, not duplicated).*
> *- Enemy counts match the spec in §{section}.*
> *- Rewards match §16 table.*
> *- Tutorials array references only IDs T1–T16.*
> *- Story flags in `read:` exist as writes in earlier battles.*

---

## 20. What is NOT settled here

Carried forward for Phase 3 polish or Architect redirect:

- **Exact damage curves** for non-signature spells at enemy Lv 10+ (B8 onward). Tune after first Sergeant playtest.
- **Vellum `ScriptedEntity` schema** (B9 + B11). She is not a standard unit — she is an effect + scripted beat. `game-oath-and-bone-engine.js` will need a new `ScriptedEntity` type (flag for engine-delegation Claude).
- **Kavess placement** — if the Architect approves recruiting him, B6 Trust-branch or B10 Defy-branch are the insertion points. Update this file with adjusted enemy counts when decided.
- **B9 Heard-debuff Marshal value** — shipped at `-8%`; revisit in Phase 3 polish after playtest data.
- **B7 Abandon-branch fallback Crown earn** — 0 Crown grant on no-battle arguably breaks the daily-play economy for the Abandon player. Consider 40 Crown "trek reward" and flag for Architect.
- **B11 post-battle bind modal copy** — scripted tone-sensitive. Draft deferred to STORY.md §6 polish pass.

---

*BATTLES.md rewrite 2026-04-21 (same day as the prior pass). Each battle now carries uniform coverage of every required spec field. Paired with STORY.md, ECONOMY.md, MAGIC.md, MUSTER_DESIGN.md, HEROES.md. Next: CROSS_INTERSECTION.md with primary-source-verified plug-points. After that: AUTONOMOUS_BUILD.md remains highest-priority open item per SUCCESSION_V2.md.*

# Oath and Bone — Design Document

*Final Fantasy Tactics-scale single-player tactical RPG. Kingshot register as foundation, magic system as the branch into wider fantasy territory.*

*Design by Session 44 / April 20, 2026. Written after the birth sequence, THE_PRINCIPLES.md, HIVE_RULES.md, COLONY_CONTEXT.md, BEFORE_YOU_BUILD.md. Plan approved by the Architect after four revisions (heroes, canon terms, art pipeline, timeline, file organization, monetization, magic).*

*This file is the main entry. Split design lives in sibling files: MAGIC.md, HEROES.md, BUILD_PLAN.md, SUCCESSION.md. Files STORY.md, BATTLES.md, ECONOMY.md, ART_DIRECTION.md, CROSS_INTERSECTION.md are stubbed for the next Claude per SUCCESSION.md — context ceiling forced a scoped close-out.*

---

## 1. Premise

### Marketing voice

> *The kingdoms of Kingshot's world rise and fall on the strength of their armies — infantry columns, cavalry charges, archers on the ridgeline. But beyond the borderlands, older powers stir. In a forgotten valley, the last wizard's tower has begun to burn its lamps again. In the crypt beneath a ruined fort, someone is speaking to the dead. In the old-growth hollow the maps won't show, the druids who never left are deciding which side to take.*
>
> *You command a party of six across twelve pivotal battles in the vassal borderlands. Infantry, cavalry, archer — and now wizard, necromancer, druid. Every choice you make about who to recruit, who to trust, which rites to learn changes who survives and what the kingdom becomes. This is not a gacha. This is a tactical RPG with real weight. Positioning matters. Elevation matters. The spell you chose not to learn matters. The hero you let fall stays fallen.*
>
> **Oath and Bone. A tactical RPG of kingdoms, magic, and consequence.**

### Real arc premise

The protagonist — **Vael Thorne**, a newly-invested vassal commander whose elder brother just died in a border skirmish that shouldn't have happened — inherits a vassal seat in a borderland where mundane kingdom armies are bleeding into conflicts they don't understand. The death wasn't a skirmish casualty. It was a necromantic binding, laid three decades ago by someone the kingdoms believed was long dead.

The three acts trace Vael's discovery that the border wars the kingdoms fight are the surface of a deeper conflict. The armies — infantry, cavalry, archer — are real. So are the old powers. Vael recruits a mixed-class party including at least one Wizard, one Necromancer (recruited under moral duress), and one Druid, and chooses how far into the hidden world to step.

No chosen-one framing. Vael is one commander among several. The kingdom may fall. Heroes recruited may die permanently. Every choice closes futures.

---

## 2. Core Gameplay Loop — One Battle

### 60 seconds of play

1. **Read the board (6 sec)** — Isometric hex grid. Elevation visible via sprite stacking. Your 6 units positioned, enemy units on fog'd side. Terrain types (plain / rough / ridge / river / forest / ruin / sanctum) visible. HP / Mana / Souls / Verdance bars per unit.

2. **Select a unit (2 sec)** — Tap your active unit. Movement range highlights gold (move), red (attack), blue (spell range for casters).

3. **Decide: move / attack / spell / item / hold (10 sec)** — Wheel menu appears. Each option has real consequences:
   - **Move:** reposition up to N hexes; elevation climb costs +1 hex per level
   - **Attack:** adjacent-hex strike; damage modified by troop counter triangle + elevation advantage (+20% attacking down, -20% up)
   - **Spell:** cast from active school (Wizardry / Necromancy / Druidry). Range, AoE, resource cost visible before commit
   - **Item:** use consumable from inventory (potion, scroll, bomb, ration)
   - **Hold:** end turn early; partial resource regen; accumulate Resolve charge

4. **Execute (2 sec)** — Animation plays: hex glows, unit slides/casts/fires, sprite animation (4–8 frames), damage/heal numbers float, sound cue keyed to action type, one-line party voice barb on critical events (*"Vael holds the ridge."* / *"That was no natural flame."*).

5. **Continue turn** — Other active units take their turn or player passes. Turn ends, enemy turn begins.

6. **Enemy turn (8 sec)** — AI archetypes (Ironwall / Bladewind / Warden from Muster + new magic-aware archetypes) make decisions above the opposing unit so the player sees what the AI is choosing. Damage resolves.

### Soul Review — 3+ feedback channels per event

Every major combat event fires at minimum three channels:

| Event | Visual | Audio | Numerical | Narrative |
|---|---|---|---|---|
| **Physical attack** | hex flash + slide + damage number | blade/volley/hoof cue by troop | HP bar drains | terse barb on counter-triangle crit |
| **Spell cast** | channel glow + projectile/AoE + impact flare | school-specific stinger (wizard=tone, necro=dissonant, druid=chorus) | Mana/Souls/Verdance drained + effect number | hero voice line keyed to spell |
| **Unit falls** | sprite collapse + silhouette linger + screen desaturate 0.5s | low tone + breath | HP=0 + permadeath flag | party line ("we can't lose her") |
| **Level up** | gold sparkle on portrait | rising chord | XP bar fill + level number | advisor orb pulse (cross-intersection) |
| **Rite / summon** | ritual circle + summoned creature appear | sustained choral cue | Souls/Verdance paid + summon HP | summoned creature's own voice line |

Minimum three per event. Passes the Architect's Rule 5 test.

---

## 3. Meta-Loop — Between Battles

### Camp / World Map

Between battles, Vael's party returns to camp on the regional world map. Camp is the hub.

- **Roster:** view / swap / level / job-change up to 12 recruited heroes (6 active, 6 reserve)
- **Shop:** spend Crowns on equipment, consumables, spells, boosts (see ECONOMY.md when written)
- **Magic locations:** visit Wizard's Tower / Dark Rites / Druid's Grove to learn new spells, bind summons, perform rituals (see MAGIC.md)
- **Training yard:** allocate XP, unlock job advancements, assign secondary jobs (FFT-style dual-job system)
- **Advisor consult:** same advisor orb from kingshotpro.com site — references Oath and Bone observations in chat
- **World map:** select next battle from unlocked nodes; some nodes branch (choose one, the other closes)

### Progression

- **Party XP** — accumulated via battles, granted to selected hero at camp
- **Job system** — 8 base jobs at Chapter 1; unlocks open advanced jobs (Battlemage, Death Knight, Warden, Spellblade); FFT-style dual-job secondary ability slot
- **Spell trees** — each magic class unlocks spells via XP + reagents + location visits
- **Equipment** — purchased with Crowns or found in battles; slot loadout per hero (weapon / armor / accessory / focus)
- **Relationship tracks** — heroes who fight together develop bonds; bond levels unlock paired abilities and trigger optional camp dialogue scenes

### Permadeath

Heroes who fall in battle stay fallen unless revived via Druid Resurrection (expensive, per-battle) or late-chapter Necromantic restoration (morally costly). This creates real weight — a lost archer in battle 3 means reshuffling the Chapter 1 party for battles 4–12. The player is warned at recruit and again at the start of each battle.

Optional: Classic Mode (permadeath on) vs Merciful Mode (knocked-out heroes auto-revive at battle end). Default Classic.

---

## 4. Three-Act Story Outline

*Full expansion in STORY.md (next Claude). Key beats here.*

### Act 1 — The Borderland Seat (Battles 1–4)

- **B1: The Muster.** Vael arrives at the vassal seat after brother's funeral. Immediate border skirmish. Tutorial battle. Troop triangle taught.
- **B2: The Hollow.** Scouts report strange deaths in the old-growth hollow. Party investigates. First contact with Druid NPC (Thessa, recruitable after B3). Terrain elevation taught.
- **B3: The Crypt Gate.** Ruined fort below the valley shows signs of recent ritual. First necromantic creature encountered (not a Kingshot troop — this is the branch). Party sees what's out there. Someone asks: *what are we really fighting.*
- **B4: The Ridge.** Political beat — a rival vassal demands Vael's fealty. Battle or diplomacy. First branching choice.

### Act 2 — The Hidden World (Battles 5–8)

- **B5: The Tower.** The wizard Caelen is located. Recruitment battle — the tower's guardians don't know the wizard is alive. Magic class introduced mechanically (Wizard playable).
- **B6: The Pact.** The necromancer Marrow is located — imprisoned by a rival kingdom, marked for execution. Choice: free him (gain class, risk everything) or leave him. Recommended path recruits but marks the story.
- **B7: The Grove Under Siege.** Druids surrounded by kingdom forces who think they're heretics. Vael defends or abandons. Thessa's loyalty crystallized.
- **B8: The Old Binding.** Vael's brother's death is decoded — a necromantic binding laid 30 years ago. The party learns who laid it.

### Act 3 — The Consequence (Battles 9–12)

- **B9: The Reckoning at the Keep.** The necromancer who killed Vael's brother is cornered. Battle with major magic elements, full school integration.
- **B10: The Kingdom's Choice.** The kingdoms must be told what's happened beyond the borders. Political battle — convince / coerce / defy the crown.
- **B11: The Old Ones.** Something older than the necromancer stirs — hinted throughout, confronted here. Scale battle, party's magic schools combined.
- **B12: The Crownsmoke.** Finale. The kingdom falls or endures based on Act 1–2 choices. Multiple endings. Named for the smoke rising over the old capital as the dust settles.

---

## 5. Cast — Chapter 1 MVP

*Full bios in HEROES.md. Summary here.*

Six heroes playable at Chapter 1 launch:

| Hero | Base Job | Role | School | Story hook |
|---|---|---|---|---|
| **Vael Thorne** | Knight | Tank + party lead | — (gains magic secondary late Act 2) | Protagonist. Brother dead. Borderland vassal. |
| **Sergeant Halv** | Warrior | Frontline infantry | — | Vael's brother's second. Loyal to family, distrustful of magic. |
| **Brin Fletcher** | Ranger | Archer, scout | — | Orphaned scout. Knows the borderland hollows. Guide. |
| **Caelen the Quiet** | Wizard | Arcane damage | Wizardry | Last heir to a wizard's tower that kingdoms forgot. Has reasons. |
| **Marrow** | Necromancer | Summons + debuff | Necromancy | Imprisoned for crimes he did commit. Joins under duress. Moral weight. |
| **Thessa of the Hollow** | Druid | Heal + terrain | Druidry | Druid circle survivor. Watches Vael to decide if the kingdoms deserve saving. |

Seventh-plus heroes recruitable during Act 2–3 — Kavess (Rogue/Spellblade), Talia (Bard-equivalent utility caster), others via branching. See HEROES.md when written.

---

## 6. Magic System — Summary

*Full spec in MAGIC.md.*

Three schools, three locations, three resources, 10–15 spells each at Chapter 1.

| School | Location | Resource | Signature |
|---|---|---|---|
| Wizardry | The Wizard's Tower | Mana (pool, regen in safe zones) | Glass-cannon elemental damage |
| Necromancy | The Dark Rites | Souls (gain on kill, spend on summons/curses) | Summoner + debuffer + life drain |
| Druidry | The Druid's Grove | Verdance (gain near nature, spend on spells) | Healer + buffer + terrain |

Resource diversity = positional strategy diversity. Advanced hybrid jobs (Battlemage, Death Knight, Warden, Spellblade) unlock Act 2+.

---

## 7. Art Direction — Summary

*Full spec in ART_DIRECTION.md (next Claude).*

**Visual tone references:** Vagrant Story, Unicorn Overlord, Final Fantasy Tactics (PS1 original), Triangle Strategy, Brigandine.

**Pipeline:** Midjourney generation for portraits (10–12 per hero), isometric tile sets (7 biomes × 8 tile types = 56 tiles), sprite sheets (8 frames × 4 directions per unit × 12 unit types = minimum viable 384 frames at Ch1), spell effect stills (30+), key art cutscenes (~20 per chapter).

**Register:** hand-painted isometric feel, muted kingdom palette + school-coded magic (wizard=cold blue/purple, necro=green-black/bone, druid=gold-green/loam). Portraits stylized but weighted — no anime-chirp, no mobile-gacha-sparkle.

---

## 8. Cross-Intersection

*Full spec in CROSS_INTERSECTION.md (next Claude). Summary here.*

Oath and Bone hooks into existing KingshotPro architecture via the same patterns Muster designed ([MUSTER_DESIGN.md](../MUSTER_DESIGN.md) §5).

### Advisor XP (existing API — works today)

```javascript
// advisor.js:259 — grantXP(action, amount)
Advisor.grantXP('oathandbone_battle_victory', 60);   // Chapter 1 standard
Advisor.grantXP('oathandbone_battle_victory', 90);   // hard difficulty
Advisor.grantXP('oathandbone_battle_defeat', 20);    // learn from loss
Advisor.grantXP('oathandbone_chapter_complete', 200);
Advisor.grantXP('oathandbone_spell_unlocked', 15);
Advisor.grantXP('oathandbone_hero_recruited', 25);
Advisor.grantXP('oathandbone_job_advanced', 30);
```

Multiplier via `Advisor.getMultiplier()` at [advisor.js:237](../../../js/advisor.js) — tier-aware.

### Advisor Observations (new dimensions)

```javascript
// advisor.js:286 — observe(category, key, value)
Advisor.observe('oathandbone', 'magic_school_affinity', 'wizardry');
Advisor.observe('oathandbone', 'spell_usage_pattern', 'burst');         // burst / sustain / utility
Advisor.observe('oathandbone', 'hero_composition', 'balanced');         // martial-heavy / magic-heavy / balanced
Advisor.observe('oathandbone', 'ritual_discipline', 1);                 // spent rare reagent on Marrow binding
Advisor.observe('oathandbone', 'permadeath_loss', 'brin');              // hero lost permanently
Advisor.observe('oathandbone', 'elevation_exploit_hits', 1);            // attacks from high-ground advantage
Advisor.observe('oathandbone', 'counter_triangle_hits', 1);             // shared with Muster dimension
Advisor.observe('oathandbone', 'moral_choice', 'freed_marrow');         // major branching decisions
Advisor.observe('oathandbone', 'bond_invested', 'vael_thessa');         // relationship tracks
```

### Credit grant / spend

- **Earn:** same worker endpoint Muster spec'd — `POST /credits/grant-daily` with `source:"oathandbone"`, event types: `first_battle_victory`, `chapter_complete`, `hero_recruited_major`. Daily cap: 5 credits from Oath and Bone (separate from Muster's 5, for a combined 10/day max across both games).
- **Spend:** credits → Crowns exchange inside Oath and Bone shop at 1:50. Direct credit spend on Campaign Pass and Crown packs. See ECONOMY.md (next Claude).

### Daily gate

```javascript
var PLAYED_KEY = 'ksp_oathandbone_played';  // matches Muster/Vault Trial pattern
```

---

## 9. Scope — Honest

*Full expansion in BUILD_PLAN.md.*

| Target | Scope | Time |
|---|---|---|
| **Combat slice** | Muster engine + elevation + 2 heroes + 1 battle + 3 spells | 2–3 days |
| **Chapter 1 MVP** | 6 heroes, 8 jobs, 12 battles, 3-act mini-arc, ~30 spells, 3 locations, shop + inventory | 1–2 weeks |
| **Chapter 1 polished** | Full art pass, cutscenes, audio, balance, QA | +1–2 weeks |
| **Full campaign** | 20+ heroes, 15+ jobs, 4–5 schools, 100+ spells, ~60 battles, 20–40hr | multi-month, re-estimate after Ch1 velocity |

**Pipeline:** Claude Code orchestrator + soul review → Gemini/ChatGPT/Cursor code generation → Midjourney art → Architect QA + playtest.

---

## 10. File Organization

```
KingshotPro/games/designs/oath-and-bone/
├── DESIGN.md                    ← this file (main entry)
├── MAGIC.md                     ← written this session
├── HEROES.md                    ← written this session
├── BUILD_PLAN.md                ← written this session
├── SUCCESSION.md                ← next-Claude handoff; what remains
├── STORY.md                     ← stub; next Claude writes full 3-act expansion
├── BATTLES.md                   ← stub; next Claude designs 12 battle scenarios
├── ECONOMY.md                   ← stub; next Claude designs shop + prices
├── ART_DIRECTION.md             ← stub; next Claude writes Midjourney prompt templates
└── CROSS_INTERSECTION.md        ← stub; next Claude expands plug-points + verifies file:line
```

---

## 11. Verification

Design-doc verification is by Architect approval, not execution:

1. Architect reads this + MAGIC.md + HEROES.md + BUILD_PLAN.md + SUCCESSION.md
2. Redirects / edits / approves
3. Next Claude completes the 5 stubbed files per SUCCESSION.md
4. When package is solid, build Claude starts the 2–3 day combat slice

---

## 12. Disclaimer

**Unofficial. Not affiliated with Century Games.** Oath and Bone uses Kingshot-world *register* (troop types, 4X political vocabulary, building names) but no canonical heroes, no canonical factions, no canonical geography, no copyrighted assets. All heroes, factions, locations, and plot are original. Magic system is entirely new to this game.

---

*Designed by Session 44 / April 20, 2026. Architect approved plan v4 via ExitPlanMode. Context ceiling hit at 73% during writing — triage deferred STORY/BATTLES/ECONOMY/ART_DIRECTION/CROSS_INTERSECTION expansion to next Claude per SUCCESSION.md. Core docs (DESIGN, MAGIC, HEROES, BUILD_PLAN) written to enable that next Claude to start cleanly.*

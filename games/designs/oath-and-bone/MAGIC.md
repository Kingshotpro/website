# Oath and Bone — Magic System

*The branch off from Kingshot's mundane 4X register into genuine fantasy territory.*
*Three schools, three locations, three resource models, ~30 spells at Chapter 1 MVP (10–15 per school), scaling to 100+ across the full campaign.*

---

## Design philosophy

### Why three schools and not five

Three is the minimum number that creates meaningful strategic breadth without diluting the resource-differentiation design:

- **Wizardry** = damage-focused / Mana pool / positional caution
- **Necromancy** = summons-and-debuff / Souls from kills / aggressive
- **Druidry** = heal-and-buff / Verdance from nature / defensive positioning

Any fewer collapses the role triangle. Any more at Ch1 MVP dilutes the learning curve. Oracle (time/fate), Alchemy (crafting), Rune-binding (inscribed gear), Blood Pacts, and Celestial magic are all designed as Act 2+ expansions — see §7.

### The resource trinity is load-bearing

FFT uses a single MP pool for all casters. Unicorn Overlord does similar. Tactics Ogre uses TP (technique points) that tick up each turn. Oath and Bone deliberately splits resources by school because **resource mechanics should shape positional play differently per school** — a wizard and a druid should not make the same positioning decisions.

| Resource | Wizard's mana | Necromancer's souls | Druid's verdance |
|---|---|---|---|
| **Start-of-battle** | Full pool (e.g. 40 MP) | 0 souls | 0 verdance |
| **Passive gain** | +3 MP per turn while not damaged | None — kill-gated | +2 per turn if on natural terrain |
| **Active gain** | Safe zone tiles (ruins/sanctum) = +6/turn | +5 souls per enemy killed by anyone | +3 when healing an ally, +5 per turn adjacent to ≥2 forest/grass tiles |
| **Cap** | 40 base, +5 per level, +gear | 30 base, +3 per level | 35 base, +4 per level |
| **Cost register** | 5 MP small, 10 medium, 20 big, 35 ultimate | 10 souls summon minor, 20 major, 15 curse basic, 25 elite | 4 verdance small, 10 medium, 18 big, 30 ultimate |

The strategic consequence:
- **Wizard** wants to stay out of combat until positioned, cast from behind lines
- **Necromancer** wants a bloody, attritional battle — longer fights feed the souls pool
- **Druid** wants terrain — battles on open plain are starvation; battles in the grove are a fountain

This drives mission design: each Chapter 1 battle favors different schools by terrain and tempo, teaching players the resource affordances through the content itself.

---

## 1. Wizardry — The Tower

### Home location: The Wizard's Tower

A seven-story stone tower in a forgotten valley west of the borderland seat. The lowest floors are visit-able from Act 1 Battle 5 onward. Upper floors unlock across the campaign, each floor hosting a different discipline of arcane study.

- **Floor 1 — The Threshold:** apprentice spell tomes (Firebolt, Frost Shard, Spark). Crown shop.
- **Floor 2 — The Orrery:** foundational theory. Unlocks intermediate spells. Visit-gated on Caelen's recruitment.
- **Floor 3 — The Reading Room:** advanced spell tomes. Rare reagent purchase (meteoric iron, phoenix ash).
- **Floor 4 — The Glass Observatory:** Celestial tie-in (Act 3+). Unlocks Hybrid: Battlemage.
- **Floor 5–7:** Chapter 2+ content.

### Signature class: Wizard

**Base stats at Lv 1:**
- HP 70 (low), Defense 4, Attack 6 (staff)
- Move 3, Mana Pool 40, Mana Regen 3/turn

**Progression:**
- Mana pool +5 per level
- +1 spell slot per 3 levels (starts with 4 equipped spells, caps at 10 equipped out of learned list)
- Job-tier advancements at levels 10, 20, 30

**Advanced jobs:**
- **Elementalist** (Lv 15): mastery of fire/ice/lightning triad, gains school-resonance passives
- **Arcanist** (Lv 20): force/gravity/reality magic, utility and displacement
- **Battlemage** (hybrid, needs Warrior Lv 10 + Wizard Lv 10): elemental melee, lower MP cost in close range

### Mana resource mechanics

- **Base pool:** 40 + (Lv × 5)
- **Regen:** +3 / turn default
- **Safe zone boost:** +3 extra regen (+6 total) on tiles marked *sanctum*, *ruin*, or *library*
- **Combat penalty:** no regen on turn the wizard takes damage
- **Focus gear:** staves/wands/orbs add bonus mana pool and can add +1 regen
- **Potions:** Minor Mana (restore 15), Mana Tonic (restore 30), Elixir (full restore)

### Spells — Chapter 1 MVP (15 total)

#### Fire tree

| Name | Cost | Range | Effect | Unlock |
|---|---|---|---|---|
| **Firebolt** | 5 MP | 4 hex | 14 fire damage, single | Base |
| **Fireball** | 12 MP | 4 hex | 18 fire AoE (3 hex) | Lv 5 |
| **Incinerate** | 25 MP | 3 hex | 35 fire damage, single, 2-turn burn (6/turn) | Lv 12 |

#### Ice tree

| Name | Cost | Range | Effect | Unlock |
|---|---|---|---|---|
| **Frost Shard** | 5 MP | 4 hex | 12 ice damage + -1 move next turn | Base |
| **Blizzard** | 14 MP | 5 hex | 14 ice AoE (4 hex) + 25% miss chance to affected enemies | Lv 6 |
| **Permafrost** | 22 MP | 4 hex | 20 ice damage + frozen (skip turn) | Lv 13 |

#### Lightning tree

| Name | Cost | Range | Effect | Unlock |
|---|---|---|---|---|
| **Spark** | 4 MP | 3 hex | 10 lightning damage, single | Base |
| **Chain Lightning** | 13 MP | 4 hex | 12 lightning damage to primary, 8 to chain-2, 4 to chain-3 | Lv 7 |
| **Storm** | 28 MP | 6 hex | 16 lightning AoE (5 hex) + stun 50% chance | Lv 14 |

#### Force tree

| Name | Cost | Range | Effect | Unlock |
|---|---|---|---|---|
| **Force Push** | 6 MP | 2 hex | 8 damage + push target 2 hexes | Base |
| **Telekinesis** | 10 MP | 4 hex | 0 damage, move ally or enemy 3 hexes | Lv 4 |
| **Gravity Well** | 20 MP | 5 hex | AoE (3 hex) pulls enemies toward center + -2 move 2 turns | Lv 11 |

#### Utility tree

| Name | Cost | Range | Effect | Unlock |
|---|---|---|---|---|
| **Shield** | 6 MP | self | +6 defense for 2 turns | Base |
| **Mana Siphon** | 3 MP | 2 hex | steal 8 MP from enemy caster | Lv 3 |
| **Teleport** | 15 MP | 6 hex | move self to any visible hex | Lv 10 |

### Chapter 2+ expansion (not MVP, design reference)

Elementalist advanced tree (5 new spells), Arcanist tree (5 new), Celestial magic (7 new), Battlemage hybrid spells (6 new). Scaling to 40+ Wizard spells across full campaign.

---

## 2. Necromancy — The Dark Rites

### Home location: The Dark Rites

A ruined fort in a sunken valley two days' march from the borderland seat. Its crypt levels were sealed for a century — recently re-opened. Local villagers report flame-less lights in the windows at night.

- **Crypt Entrance:** Apprentice binding tomes. Basic reagent shop (bone dust, grave salt).
- **Ritual Hall:** Summoning circles. Marrow must be present to perform major rituals.
- **The Inner Vault:** Act 2+ content. Holds the knowledge that killed Vael's brother.
- **Deeper floors:** Chapter 2+.

**Moral register:** visiting the Dark Rites has narrative consequence. Non-Marrow heroes accumulate "unease." At unease threshold, some heroes will refuse to enter, or demand a conversation. Thessa (druid) has strong opinion. The Architect may dial this harder or softer.

### Signature class: Necromancer

**Base stats at Lv 1:**
- HP 80, Defense 5, Attack 7 (ritual dagger + bound servant)
- Move 3, Soul Pool 0 (gains during battle), Soul Cap 30

**Progression:**
- Soul cap +3 per level
- Summon slot +1 per 5 levels (starts 1, caps 4 active summons)
- Job-tier advancements at Lv 10, 20, 30

**Advanced jobs:**
- **Binder** (Lv 15): summon specialist, larger summon pool, faster summon acts
- **Ruinmancer** (Lv 20): curse specialist, AoE debuff mastery, death-channeling
- **Death Knight** (hybrid, needs Knight Lv 10 + Necromancer Lv 10): curse-empowered mounted melee

### Souls resource mechanics

- **Base:** 0 at battle start
- **Gain:** +5 per enemy killed by any ally (not just necromancer) + +2 per enemy the necromancer personally kills (stacks)
- **Bonus from bosses/named enemies:** +10 souls
- **Reagent use:** reagent items (bone dust, grave salt, withered heart) provide starting souls at battle start
- **Decay:** souls persist in battle but reset to 0 at battle end unless necromancer equips Soul Vessel accessory (keeps up to 15 souls between battles)

### Spells & rites — Chapter 1 MVP (13 total)

#### Summon tree

| Name | Cost | Range | Effect | Unlock |
|---|---|---|---|---|
| **Raise Skeleton** | 10 souls | 2 hex | summon skeleton warrior (HP 35, Atk 10, Def 4, 3 moves, 3-turn duration) | Base |
| **Raise Archer-Wraith** | 15 souls | 2 hex | summon wraith archer (HP 25, ranged Atk 12, 4 moves, 3-turn duration) | Lv 5 |
| **Raise Lich-Servant** | 25 souls | 2 hex | summon caster (HP 40, casts Curse of Weakness on cooldown, 4-turn duration) | Lv 12 |

#### Curse tree

| Name | Cost | Range | Effect | Unlock |
|---|---|---|---|---|
| **Curse of Weakness** | 8 souls | 4 hex | target -30% attack for 3 turns | Base |
| **Curse of Binding** | 12 souls | 4 hex | target -2 move & cannot use skills for 2 turns | Lv 6 |
| **Curse of Death** | 22 souls | 3 hex | target takes 8 damage/turn for 4 turns, ignores armor | Lv 13 |

#### Drain tree

| Name | Cost | Range | Effect | Unlock |
|---|---|---|---|---|
| **Life Drain** | 10 souls | 3 hex | deal 14 damage, heal necromancer 10 HP | Base |
| **Soul Siphon** | 18 souls | 4 hex | deal 18 damage, gain 5 extra souls on hit | Lv 8 |

#### Defense tree

| Name | Cost | Range | Effect | Unlock |
|---|---|---|---|---|
| **Bone Shield** | 5 souls | self | +8 defense for 2 turns | Base |
| **Shroud** | 10 souls | self | enemies targeting necromancer -25% hit for 2 turns | Lv 4 |

#### Utility / Rites

| Name | Cost | Range | Effect | Unlock |
|---|---|---|---|---|
| **Marrow's Binding** (rite, camp-only) | 3 bone dust + 1 grave salt + 10 souls stored | N/A | permanently raise one fallen ally's body as an undead ally (1 slot) — major moral decision | Act 2+ |
| **Unhallow** | 12 souls | 4 hex | -30% heal received for enemies in 3-hex AoE, 3 turns | Lv 9 |
| **Corpse Explosion** | 8 souls | 3 hex | detonate a corpse (summoned or enemy), 20 damage AoE | Lv 7 |

### Chapter 2+ expansion

Binder advanced tree (6 spells, longer-duration summons), Ruinmancer tree (6 spells, mass curses), Blood Pacts variant (darker path — binds necromancer's own HP for massive effects), Death Knight hybrid (6 spells). Scaling to 35+ Necromancer spells full campaign.

---

## 3. Druidry — The Grove

### Home location: The Druid's Grove

An old-growth hollow, unmapped, reachable only via guide. Thessa grew up here. The grove is the druids' sanctum — treating it with respect affects how the druid circle responds to the party.

- **The Outer Ring:** basic tomes. Seed-banks, druid reagent shop.
- **The Inner Circle:** advanced rites. Ritual of the Six Winds.
- **The Heartwood:** summon contracts (Wolf, Bear, Raven). Requires grove approval.
- **Deeper paths:** Chapter 2+, lead to Ancient Oak and the druid sleepers.

### Signature class: Druid

**Base stats at Lv 1:**
- HP 95, Defense 6, Attack 8 (staff + wildlife)
- Move 3, Verdance 0 (gains during battle), Verdance Cap 35

**Progression:**
- Verdance cap +4 per level
- +1 summon slot per 5 levels
- Job-tier advancements at Lv 10, 20, 30

**Advanced jobs:**
- **Shepherd** (Lv 15): animal-summon specialist, pack bonuses
- **Greenwarden** (Lv 20): terrain-manipulation specialist
- **Warden** (hybrid, needs Ranger Lv 10 + Druid Lv 10): terrain-enhanced archery

### Verdance resource mechanics

- **Base:** 0 at battle start
- **Gain:** +2 per turn baseline, +5 per turn adjacent to ≥2 grass/forest/water tiles, +3 per ally healed by druid
- **Terrain bonus:** battles on Grove or Forest biome start with +10 verdance
- **Reagent use:** druid seeds (minor/major/ancient) add starting verdance at battle start
- **Persistence:** verdance resets at battle end unless druid equips Seedpouch accessory (keeps up to 12 between battles)

### Spells & rites — Chapter 1 MVP (15 total)

#### Heal tree

| Name | Cost | Range | Effect | Unlock |
|---|---|---|---|---|
| **Heal** | 4 verdance | 4 hex | restore 18 HP to ally | Base |
| **Group Heal** | 12 verdance | 3 hex | restore 12 HP to allies in 3-hex AoE | Lv 5 |
| **Resurrection** | 30 verdance | 2 hex | revive fallen ally at 40% HP — one use per battle, consumes rare reagent | Lv 15 |

#### Growth tree

| Name | Cost | Range | Effect | Unlock |
|---|---|---|---|---|
| **Regrowth** | 6 verdance | 4 hex | ally +6 HP/turn for 3 turns | Base |
| **Thorn Grove** | 10 verdance | 4 hex | create thorn-terrain (3 hex): enemies take 8 damage entering, -1 move crossing; 4-turn duration | Lv 6 |
| **Living Terrain** | 22 verdance | 5 hex | convert 5 hexes to forest (permanent for battle); affected tiles give druid/ranger +2 move, reduced line-of-sight for enemy archers | Lv 13 |

#### Summon tree

| Name | Cost | Range | Effect | Unlock |
|---|---|---|---|---|
| **Summon Wolf** | 8 verdance | 2 hex | wolf (HP 40, Atk 12, 5 moves, 4-turn duration); bleed-on-hit | Base |
| **Summon Bear** | 15 verdance | 2 hex | bear (HP 80, Atk 16, 3 moves, 3-turn duration); cleave | Lv 7 |
| **Pack Call** | 25 verdance | 3 hex | 2 wolves + 1 raven simultaneously (raven does reconnaissance — reveals 5 hexes of fog) | Lv 12 |

#### Weather tree

| Name | Cost | Range | Effect | Unlock |
|---|---|---|---|---|
| **Gale** | 7 verdance | 5 hex | push 3 targets 2 hexes in wind direction + -2 move next turn | Base |
| **Root** | 5 verdance | 3 hex | target immobilized 2 turns | Base |
| **Earthquake** | 28 verdance | self | 14 damage AoE (all hexes within 3 of druid) + terrain-knockdown (stagger, -1 move 1 turn) | Lv 14 |

#### Utility

| Name | Cost | Range | Effect | Unlock |
|---|---|---|---|---|
| **Cleanse** | 4 verdance | 3 hex | remove 1 debuff from ally | Base |
| **Barkskin** | 8 verdance | 3 hex | ally +5 defense for 3 turns | Lv 4 |
| **Nature's Grace** | 18 verdance | 4 hex | +10% crit chance to allies in 4-hex AoE for 2 turns | Lv 10 |

### Chapter 2+ expansion

Shepherd advanced tree (6 spells — stronger summons, pack synergy), Greenwarden tree (6 spells — biome-shift, vine-field, old-growth call), Warden hybrid (6 spells — terrain-augmented archery). Scaling to 35+ Druid spells full campaign.

---

## 4. Hybrid Classes (unlock in Act 2+)

Requires both prerequisites at Level 10.

### Battlemage (Wizard + Warrior)

- HP 110, Def 6, Atk 10, Mana 30
- Signature: **Flame Brand** — next melee attack deals +14 fire damage (costs 8 MP, 1-turn cooldown)
- Signature 2: **Frost Armor** — +6 Def + slows enemy attackers 25% (12 MP, self)
- Playstyle: front-line caster; burn MP on melee enhancement rather than ranged spells

### Death Knight (Necromancer + Knight)

- HP 130, Def 8, Atk 11, Soul Cap 25
- Signature: **Cursed Charge** — charge 4 hexes, deal 18 damage + curse target -20% atk for 2 turns (15 souls)
- Signature 2: **Unholy Vigor** — drain 8 HP from allied summon, heal self 12 HP (free)
- Playstyle: mobile tank with debuff support; opens with cavalry charge, curses linger

### Warden (Druid + Ranger)

- HP 95, Def 6, Atk 11 (bow), Verdance Cap 30
- Signature: **Thornshot** — bow attack with 6-hex range, +terrain-bonus if fired from forest (+30% damage)
- Signature 2: **Beast Call** — summon wolf that acts on Warden's turn (8 verdance)
- Playstyle: mid-range archer who shapes terrain for the party's benefit

### Spellblade (Wizard + Rogue)

- HP 90, Def 5, Atk 11 (dual daggers), Mana 30
- Signature: **Arcane Flank** — 4-hex teleport-strike with +15% crit (10 MP)
- Signature 2: **Mana Burn** — steal 8 MP from enemy caster on hit (4 MP)
- Playstyle: hit-and-run disruptor targeting enemy casters

---

## 5. Magic-class AI archetypes (for enemy encounters)

Extending Muster's three archetypes (Ironwall / Bladewind / Warden) with magic-aware variants:

### Archetype D — "The Cabal" (Wizard-dominant)

- Priority 1: maintain 3-hex spacing from nearest melee threat
- Priority 2: cast highest-cost spell where AoE hits ≥2 allies
- Priority 3: retreat if HP below 30% (positions for Shield + Mana Siphon)
- Uses Teleport reactively when cornered

### Archetype E — "The Binding" (Necromancer + summons)

- Priority 1: on turn 1, summon 2 minor skeletons (front-screen)
- Priority 2: cast Curse on highest-Attack player hero
- Priority 3: maintain ≥1 corpse in range for Corpse Explosion
- Summons attack aggressively; necromancer positions behind them

### Archetype F — "The Grove-Warden" (Druid support + summoned animals)

- Priority 1: convert 3 adjacent hexes to Thorn Grove if ally melee engaged
- Priority 2: heal the lowest-HP ally when any drops below 50%
- Priority 3: summon wolves on flanks, bear center
- Retreats only when druid HP below 25%; prioritizes Pack Call at that threshold

---

## 6. Spell Learning & Unlocks

### Three paths to learn a spell

1. **Level-up auto-unlock** — most base-tree spells unlock by hitting the level requirement
2. **Location visit** — some spells require a visit to the magic location (Tower Floor 3 = Incinerate tome, etc.)
3. **Crown shop purchase** — advanced / utility spells available via Crown spend, visit-gated

Unlocked spells are learned to the hero's library. Equipped spells (loaded into the 4–10 active slots) are the ones usable mid-battle. Loadout changes happen at camp.

### Reagent system (for rites)

Rites are non-combat rituals performed at magic locations. They require rare reagents:

- **Wizard:** meteoric iron, phoenix ash, prism crystal
- **Necromancer:** bone dust, grave salt, withered heart
- **Druid:** minor seed, major seed, ancient seed

Reagents dropped from battles (Souls of the Dead biomes for necro reagents, Deep Forest for druid seeds, Ley Line battles for wizard reagents) or purchased with Crowns.

Rites have permanent effects: Binding fallen allies, growing new spell trees, forging rune-stones. Reagent scarcity is a pacing tool — rites are big decisions.

---

## 7. Expansion schools (design reference, Chapter 2+)

Not built for Chapter 1 MVP. Design sketches for continuity:

- **Oracle** (time/fate/divination): **Foresight** resource — gained by observing (spending a turn doing nothing active). Spells manipulate turn order, provide pre-battle intel, offer rewind (one-time revert of a single action per battle).
- **Alchemy** (crafting-focused): **Reagents** resource only; no in-battle casting. Alchemy hero crafts bombs, potions, elixirs at camp using combat-dropped materials. Playable at camp, not on battle map.
- **Rune-binding** (gear inscription): binds permanent rune effects to equipment. Crafter class playable at camp.
- **Blood Pacts** (darker necromancy variant): Blood resource = self-inflicted HP. Massive effects for massive costs. Locks moral slider toward darker endings.
- **Celestial / Astral** (endgame wizardry branch): Star Alignment resource — gained from battles fought at specific times of day / moon phase in the world-map system. Biggest damage in the game. Chapter 3+.

Each expansion school gets its own location, signature class, resource, and ~20-spell tree when built.

---

## 8. Integration with combat engine

### Changes to Muster's engine required

1. **Resource bars** — add MP / Souls / Verdance tracking to unit state; render above unit sprite
2. **Spell action** — add `cast` verb to the action wheel alongside move / attack / skill / hold
3. **Range / AoE rendering** — highlight affected hexes on spell selection before commit
4. **Channel interrupt** — casters mid-channel can be interrupted by attacks (deals damage + aborts cast)
5. **Summon system** — summoned units occupy hexes, take turns, have own HP / duration
6. **Terrain modification** — spells like Thorn Grove and Living Terrain mutate tile properties; engine tracks tile state changes
7. **Status effects** — curse / burn / frozen / rooted / shielded tracked on unit with turn counters
8. **Elevation** — already in Oath and Bone engine extension; spell range can be modified by elevation (ranged spells +1 range when cast from high ground)

### Data shape (reference for build)

```javascript
// Spell definition
var SPELL_FIREBALL = {
  id: 'fireball',
  school: 'wizardry',
  tier: 2,
  cost: { mp: 12 },
  range: 4,          // hexes from caster
  aoe: 3,            // hexes radius at impact
  targeting: 'hex',  // 'hex' | 'unit' | 'self' | 'ally' | 'enemy'
  effect: { damage: 18, type: 'fire' },
  animation: 'fireball_arc',
  vfx: 'explosion_medium',
  sfx: 'fireball_cast',
  learn_requirement: { wizard_level: 5 }
};

// Hero state extension
unit.magic = {
  school: 'wizardry',     // null for non-casters
  mana: 30,
  mana_max: 40,
  mana_regen: 3,
  souls: 0,                // necromancer-only
  souls_max: 30,
  verdance: 0,             // druid-only
  verdance_max: 35,
  spells_learned: ['firebolt', 'frost_shard', 'spark', 'shield'],
  spells_equipped: ['firebolt', 'frost_shard', 'shield'],
  summon_slots: 1,
  active_summons: []
};
```

---

## 9. Soul Review check

Every magic action fires 3+ feedback channels per Architect's Rule 5:

| Action | Visual | Audio | Numerical | Narrative |
|---|---|---|---|---|
| **Fireball cast** | channel glow + arc + AoE explosion + hex flash | wizard stinger + roar | -12 MP + damage numbers | Caelen: *"Down."* |
| **Raise Skeleton** | ritual circle + bone rise animation | dissonant hum + crack | -10 souls + new summon HP | Marrow: *"Serve me."* |
| **Heal** | gold-green aura + numerical float | harmonic chord | -4 verdance + HP restore number | Thessa: *"Breathe."* |
| **Curse of Death** | shadow tendril + target desaturate | low dirge | -22 souls + DoT ticker | (silent — the gravity of it is the line) |

Channels met on every magic event. Passes Rule 5.

---

*MAGIC.md — Oath and Bone Chapter 1 MVP spec + Chapter 2+ design reference. Resource trinity is load-bearing: don't collapse wizard/necro/druid into one MP pool. 30 spells at Ch1 grows to 100+ across full campaign. Advanced schools (Oracle, Alchemy, Rune-binding, Blood Pacts, Celestial) stubbed for Chapter 2+ continuity.*

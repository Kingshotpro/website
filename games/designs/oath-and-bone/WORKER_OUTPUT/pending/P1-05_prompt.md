# P1-05 Delegation Prompt — game-oath-and-bone-spells.js
## Spell resolution engine: school routing, resource management, status effects

## Context

You are writing the spell resolution module for Oath and Bone, a tactical hex-grid RPG. This module provides `window.OathAndBoneSpells` — the object that `game-oath-and-bone-engine.js` guards with `if (window.OathAndBoneSpells && window.OathAndBoneSpells.applyRegen)`.

This module handles:
1. Spell definitions (data objects for Chapter 1 MVP spells)
2. Spell resolution — casting, range/AoE validation, effect application by school
3. Resource management — Mana (Wizardry), Souls (Necromancy), Verdance (Druidry)
4. Per-turn resource regeneration via `applyRegen(unit)`
5. Status effect tracking and per-turn ticking
6. Summon creation and duration management

This module does NOT handle: rendering/canvas, UI overlays, hex grid math (provided by the engine), turn order (provided by the engine). Leave clear extension points for the renderer.

## Integration contract with game-oath-and-bone-engine.js

The engine calls into this module via these guards only:

```javascript
// In _resetUnitsForRound():
if (window.OathAndBoneSpells && window.OathAndBoneSpells.applyRegen) {
  window.OathAndBoneSpells.applyRegen(unit);
}
```

The engine exposes its battle state and helpers via `window.OathAndBoneEngine`:
- `window.OathAndBoneEngine.getBattle()` — returns the internal `_battle` object
- `window.OathAndBoneEngine.getTile(q, r)` — returns tile or null
- `window.OathAndBoneEngine.getUnit(id)` — returns unit or null

Hex math you may call (already available globally from engine file):
- `hexDistance(a, b)` — axial distance
- `hexesInRange(center, maxRange)` — returns [{q,r}] array

## Unit magic schema (exact — do not change field names)

A unit has `magic: null` for non-casters, or:

```javascript
unit.magic = {
  school: 'wizardry' | 'necromancy' | 'druidry',
  mana: number, mana_max: number, mana_regen: number,
  souls: number, souls_max: number,
  verdance: number, verdance_max: number,
  spells_learned: [],  // spell ids
  spells_equipped: [], // spell ids (max 4–10)
  summon_slots: number,
  active_summons: []   // unit ids of active summons
};
```

A unit also has a `status_effects: []` array — add this field when casting if absent. Each status effect:

```javascript
{ id: string, turns_remaining: number, value: number }
```

Status effect ids: `'burn'`, `'frozen'`, `'rooted'`, `'weakness'`, `'binding'`, `'bone_shield'`, `'shroud'`, `'regrowth'`, `'barkskin'`, `'nature_grace'`, `'thorn_grove'` (tile effect, not unit)

## Resource mechanics (implement exactly)

### Wizardry — Mana
- Battle start: `mana = mana_max` (starts FULL)
- Regen per round: `+mana_regen` (default 3) per unit
- Safe zone bonus: if unit's current tile has `terrain === 'sanctum'` or `terrain === 'ruin'`: +3 extra regen that turn (total +6)
- Combat penalty: NO regen on the turn the wizard took damage (track via `unit.took_damage_this_turn: boolean` — set by engine, cleared by applyRegen)
- Cap: `mana_max`

### Necromancy — Souls
- Battle start: `souls = 0` (starts EMPTY)
- Regen per round: 0 (no passive regen — kill-gated only)
- Kill gain: +5 souls per enemy killed by ANY ally; +2 extra if necromancer personally kills
- Boss/named enemy kill: +10 souls total (instead of +5)
- Cap: `souls_max`
- `applyRegen` for necromancer: no-op on passive regen (souls only gained via kills)

### Druidry — Verdance
- Battle start: `verdance = 0` (starts EMPTY, +10 if biome is 'forest' or 'grove')
- Regen per round: +2 per turn baseline
- Terrain bonus: if unit is adjacent to ≥2 tiles with terrain `'forest'` or `'river'` or `'plain'`: +5 per turn instead of +2
- Ally heal bonus: +3 verdance when druid casts a heal spell that restores HP (applied at cast time)
- Cap: `verdance_max`

## Chapter 1 MVP spell definitions

Implement ALL of these as data objects keyed by spell id in an internal `_SPELLS` map:

### Wizardry spells (15)

| id | cost | range | aoe | targeting | effect | school |
|---|---|---|---|---|---|---|
| firebolt | mp:5 | 4 | 0 | enemy | damage:14 type:fire | wizardry |
| fireball | mp:12 | 4 | 3 | hex | damage:18 type:fire | wizardry |
| incinerate | mp:25 | 3 | 0 | enemy | damage:35 type:fire, status:burn(6/turn, 2 turns) | wizardry |
| frost_shard | mp:5 | 4 | 0 | enemy | damage:12 type:ice, status:weakness(-1 move, 1 turn) | wizardry |
| blizzard | mp:14 | 5 | 4 | hex | damage:14 type:ice, miss_chance:25%, all in AoE | wizardry |
| permafrost | mp:22 | 4 | 0 | enemy | damage:20 type:ice, status:frozen(1 turn) | wizardry |
| spark | mp:4 | 3 | 0 | enemy | damage:10 type:lightning | wizardry |
| chain_lightning | mp:13 | 4 | 0 | enemy | damage:12 primary, 8 chain-2, 4 chain-3 (enemy targets nearest each time) | wizardry |
| storm | mp:28 | 6 | 5 | hex | damage:16 type:lightning, stun:50% chance, AoE | wizardry |
| force_push | mp:6 | 2 | 0 | enemy | damage:8, push_hexes:2 | wizardry |
| telekinesis | mp:10 | 4 | 0 | unit | damage:0, move_target:3 hexes (ally OR enemy) | wizardry |
| gravity_well | mp:20 | 5 | 3 | hex | pull enemies toward center, status:weakness(-2 move, 2 turns), AoE | wizardry |
| shield | mp:6 | 0 | 0 | self | status:bone_shield(+6 def, 2 turns) | wizardry |
| mana_siphon | mp:3 | 2 | 0 | enemy_caster | steal:8 mp from target | wizardry |
| teleport | mp:15 | 6 | 0 | self | teleport self to target hex | wizardry |

### Necromancy spells (13)

| id | cost | range | aoe | targeting | effect | school |
|---|---|---|---|---|---|---|
| raise_skeleton | souls:10 | 2 | 0 | hex | summon:skeleton (hp:35,atk:10,def:4,move:3,turns:3) | necromancy |
| raise_archer_wraith | souls:15 | 2 | 0 | hex | summon:archer_wraith (hp:25,atk:12,range:3,move:4,turns:3) | necromancy |
| raise_lich_servant | souls:25 | 2 | 0 | hex | summon:lich_servant (hp:40,casts:curse_of_weakness,move:3,turns:4) | necromancy |
| curse_of_weakness | souls:8 | 4 | 0 | enemy | status:weakness(-30% atk, 3 turns) | necromancy |
| curse_of_binding | souls:12 | 4 | 0 | enemy | status:binding(-2 move, no skills, 2 turns) | necromancy |
| curse_of_death | souls:22 | 3 | 0 | enemy | dot:8/turn, 4 turns, ignores armor | necromancy |
| life_drain | souls:10 | 3 | 0 | enemy | damage:14, heal_caster:10 | necromancy |
| soul_siphon | souls:18 | 4 | 0 | enemy | damage:18, gain_souls:5 on hit | necromancy |
| bone_shield | souls:5 | 0 | 0 | self | status:bone_shield(+8 def, 2 turns) | necromancy |
| shroud | souls:10 | 0 | 0 | self | status:shroud(-25% enemy hit, 2 turns) | necromancy |
| unhallow | souls:12 | 4 | 3 | hex | status:unhallow(-30% heal received, 3 turns), AoE | necromancy |
| corpse_explosion | souls:8 | 3 | 0 | hex | detonate corpse/summon, damage:20 AoE at target | necromancy |
| soul_siphon | souls:18 | 4 | 0 | enemy | damage:18, gain_souls:5 on hit | necromancy |

### Druidry spells (15)

| id | cost | range | aoe | targeting | effect | school |
|---|---|---|---|---|---|---|
| heal | verdance:4 | 4 | 0 | ally | heal:18 HP | druidry |
| group_heal | verdance:12 | 3 | 3 | hex | heal:12 HP, all allies in AoE | druidry |
| resurrection | verdance:30 | 2 | 0 | dead_ally | revive at 40% HP, one use per battle | druidry |
| regrowth | verdance:6 | 4 | 0 | ally | status:regrowth(+6 hp/turn, 3 turns) | druidry |
| thorn_grove | verdance:10 | 4 | 3 | hex | create thorn terrain: 8 dmg entering, -1 move crossing, 4 turns | druidry |
| living_terrain | verdance:22 | 5 | 5 | hex | convert 5 hexes to forest terrain permanently (for battle) | druidry |
| summon_wolf | verdance:8 | 2 | 0 | hex | summon:wolf (hp:40,atk:12,move:5,turns:4,bleed_on_hit:true) | druidry |
| summon_bear | verdance:15 | 2 | 0 | hex | summon:bear (hp:80,atk:16,move:3,turns:3,cleave:true) | druidry |
| pack_call | verdance:25 | 3 | 0 | hex | summon 2 wolves + 1 raven (raven reveals 5 hexes) | druidry |
| gale | verdance:7 | 5 | 0 | hex | push 3 nearest enemies 2 hexes, status:weakness(-2 move, 1 turn) | druidry |
| root | verdance:5 | 3 | 0 | enemy | status:rooted(immobilize, 2 turns) | druidry |
| earthquake | verdance:28 | 0 | 3 | self | damage:14 all in 3-hex radius, status:weakness(-1 move, 1 turn) | druidry |
| cleanse | verdance:4 | 3 | 0 | ally | remove:1 debuff status | druidry |
| barkskin | verdance:8 | 3 | 0 | ally | status:barkskin(+5 def, 3 turns) | druidry |
| natures_grace | verdance:18 | 4 | 4 | hex | status:nature_grace(+10% crit, 2 turns), allies in AoE | druidry |

## OathAndBoneSpells API (exact interface — do not rename)

```javascript
window.OathAndBoneSpells = {
  // Called by engine at start of each new round for each unit
  // Applies passive resource regen per school rules above
  applyRegen: function(unit) { /* ... */ },

  // Called by game logic to resolve a spell cast
  // Returns { success: bool, reason: string } — reason only on failure
  castSpell: function(casterId, spellId, targetQ, targetR) { /* ... */ },

  // Called by engine when any unit dies — handles soul gain for necromancers
  // killerUnit may be null (e.g. DoT kill)
  onUnitKilled: function(killedUnit, killerUnit) { /* ... */ },

  // Called by engine per-turn for a unit — ticks all status effects
  // Removes expired effects. Returns array of effect events for renderer.
  tickStatusEffects: function(unit) { /* returns [] of {type, unit, value} */ },

  // Lookup a spell definition by id. Returns spell object or null.
  getSpellDef: function(spellId) { /* ... */ },

  // Returns array of {q,r} hexes the spell could target from caster position
  // Accounts for elevation range bonus (ranged spells +1 range from high ground)
  getSpellTargetHexes: function(casterId, spellId) { /* ... */ },

  // Hooks — renderer attaches these
  onSpellCast: null,    // function(caster, spell, targetQ, targetR, effects)
  onSummonCreated: null, // function(summonUnit, caster)
  onStatusApplied: null, // function(unit, statusEffect)
  onResourceChanged: null // function(unit, resource, oldVal, newVal)
};
```

## Spell resolution logic (school routing)

When `castSpell` is called:

1. Look up spell definition from `_SPELLS[spellId]`
2. Verify caster has `magic` field with matching school
3. Verify caster has the spell in `spells_equipped`
4. Check resource: deduct cost (mp / souls / verdance). If insufficient, return `{success: false, reason: 'insufficient_resource'}`
5. Route by `spell.effect` type:
   - `damage` → calculate damage (base × any modifiers), apply to target units in range/AoE
   - `heal` → restore HP to targets; trigger verdance +3 bonus for druid caster
   - `summon` → create summon unit in `_battle.units`, place on target hex tile, add to caster's `magic.active_summons`
   - `status` → push status effect object to target unit's `status_effects[]`
   - `terrain` → modify tile.terrain and/or tile.tile_mods on affected hexes
   - `push` / `pull` / `teleport` → update unit.q, unit.r, tile.unit
   - `dot` (damage-over-time) → push burn/curse status to target with per-turn damage
6. Fire hook: `if (window.OathAndBoneSpells.onSpellCast) window.OathAndBoneSpells.onSpellCast(...)`
7. Return `{success: true}`

### Summon unit schema (extend unit schema)

Summons are regular units in `_battle.units` but with:
```javascript
{
  id: 'summon_' + summonType + '_' + Date.now(),
  heroId: summonType,          // e.g. 'skeleton', 'wolf', 'bear'
  team: caster.team,           // inherits caster's team
  q, r,                        // placed on target hex
  hp, hp_max,
  move, attack_range, attack_dmg,
  initiative: 5,               // summons act last in round
  acted: false,
  permadeath_loss: false,       // summons never permadeath
  magic: null,
  is_summon: true,             // flag for engine
  summon_owner: casterId,      // owner unit id
  summon_turns_remaining: N,   // duration; decremented by applyRegen each round
  status_effects: []
}
```

When `summon_turns_remaining` reaches 0 in `applyRegen`: set unit hp to 0 and remove from owner's `active_summons`.

## Soul gain routing — onUnitKilled

When any unit dies, call `window.OathAndBoneSpells.onUnitKilled(killedUnit, killerUnit)`.

For each living necromancer on the same team as the killer:
- Add +5 souls to necromancer.magic.souls (any ally kill)
- If killerUnit is that necromancer: add +2 extra souls
- If killedUnit is a boss/named enemy (check `killedUnit.is_boss === true`): +10 instead of +5
- Clamp to souls_max
- Fire `onResourceChanged` hook

## Elevation spell range bonus

In `getSpellTargetHexes`:
- If spell has `targeting !== 'self'` and `spell.range >= 2` (ranged):
  - Get attacker tile elevation vs each candidate hex elevation
  - If caster elevation > hex elevation: effective range +1 for that hex
- This mirrors the ranged attack range bonus in the engine

## Victory path — no new economy gates

Do NOT add any purchase requirement or currency check to spell casting. Spells are freely usable within their resource costs. The economy constraint: NO content locked to payment. No energy gates. No revive-for-currency. Resurrection spell is gated by game progression (Lv 15), not by payment.

## CONSTRAINTS (do not remove)

- This is Oath and Bone, an unofficial fan-made game. Add `var DISCLAIMER = 'Unofficial. Not affiliated with Century Games.';` as a constant.
- Do NOT use any of these 27 canonical Kingshot hero names: Amadeus, Jabel, Helga, Saul, Zoe, Hilde, Marlin, Petra, Eric, Jaeger, Rosa, Alcar, Margot, Vivian, Thrud, Long Fei, Yang, Sophia, Triton, Chenko, Amane, Yeonwoo, Gordon, Howard, Quinn, Diana, Fahd.
- Do NOT use the word "Crownsmoke." The game is "Oath and Bone."
- Economy rule: NO content locked to payment. No energy gates. No revive-for-currency.
- Permadeath: `permadeath_loss` flag on unit, once set to true, is NEVER cleared. Summons never set permadeath_loss.
- Do NOT hardcode any $ price.
- Vanilla JS only. No ES6 imports, no arrow functions, no classes. No frameworks. Browser-target.
- Do NOT invent function names for other modules (engine, renderer) — reference them with `if (window.X) { window.X.method() }` guards only.
- Every major spell event must emit ≥3 feedback channels via hooks. The `onSpellCast` hook is Channel 1 (visual), the renderer should add audio (Channel 2), and damage/resource numbers are Channel 3. Comment this at the onSpellCast fire site.

## Verification criteria (check before returning)

- [ ] `window.OathAndBoneSpells` declared with all listed methods
- [ ] `applyRegen(unit)` correctly handles Wizard (mana, sanctum bonus, no-regen-if-damaged), Necromancer (no passive, decrements summon timers), Druid (verdance terrain check)
- [ ] `castSpell` deducts resource before resolving; returns failure if insufficient
- [ ] `onUnitKilled` routes soul gain to all necromancers on killer's team
- [ ] Summon units have `is_summon: true`, `summon_turns_remaining`, inherit team from caster
- [ ] Status effects have `id`, `turns_remaining`, `value` fields
- [ ] `tickStatusEffects` decrements turns_remaining and removes expired effects
- [ ] No canonical Kingshot name in any string, variable, or comment
- [ ] No "Crownsmoke" anywhere
- [ ] DISCLAIMER constant present
- [ ] No arrow functions (ES6 constraint)
- [ ] Soul Review 3-channel comment at `onSpellCast` fire site

## Output

One self-contained JavaScript file. No markdown. No code fences. Just the JS. Target: `js/game-oath-and-bone-spells.js`.

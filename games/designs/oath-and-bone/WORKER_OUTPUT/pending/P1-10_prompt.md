# Delegation Prompt P1-10 — game-oath-and-bone-heroes.js

You are writing `game-oath-and-bone-heroes.js` for Oath and Bone, a tactical RPG. This module defines the 6 Chapter 1 playable heroes and exposes utilities for creating unit objects from those definitions.

---

## Context

The combat engine (`game-oath-and-bone-engine.js`) stores units in `_battle.units` keyed by unit id. When a scenario starts, it reads `scenario.playerStart[]` to place player units. Each `playerStart` entry has a unit id and (q,r) coordinates, but the engine needs a full unit object. Your module provides `OathAndBoneHeroes.createUnit(heroId, unitId, team, q, r)` to build that object.

This module does NOT load spells or run spell logic — that is `game-oath-and-bone-spells.js`. It does NOT make AI decisions — that is `game-oath-and-bone-ai.js`. It ONLY defines hero data and creates unit objects.

---

## Unit object schema — exact, match this exactly

The engine expects unit objects in this shape:

```javascript
{
  id: string,              // e.g. 'player_vael'
  heroId: string,          // 'vael' | 'halv' | 'brin' | 'caelen' | 'marrow' | 'thessa'
  team: 'player' | 'enemy',
  q: integer,              // starting hex column
  r: integer,              // starting hex row
  hp: integer,             // current HP (start = max_hp)
  max_hp: integer,
  defense: integer,        // damage reduction
  attack_dmg: integer,     // base melee/ranged attack damage
  move_range: integer,     // hexes per turn
  attack_range: integer,   // 1 = melee, 2+ = ranged
  initiative: integer,     // turn order (higher goes first)
  acted: false,            // reset to false each round by engine
  magic_school: 'wizardry' | 'necromancy' | 'druidry' | null,
  mana: integer,           // Wizardry resource (starts at max)
  max_mana: integer,
  souls: integer,          // Necromancy resource (starts at 0)
  verdance: integer,       // Druidry resource (starts at 0)
  starting_spells: [],     // array of spell ID strings
  permadeath_loss: false,  // PERMANENT — never cleared once set to true
  permadeath_game_over: boolean, // true = Vael only; false = other heroes
  troop_tag: string,       // 'infantry' | 'archer' | 'wizard' | 'necromancer' | 'druid' | 'cavalry'
  level: 1,
  status_effects: [],
  is_summon: false,
  summon_owner: null
}
```

IMPORTANT: `permadeath_loss` starts as `false`. The engine sets it to `true` when the unit reaches 0 HP. Once set, it is NEVER cleared — not on save/load, not on scenario restart.

---

## The 6 heroes — spec (HEROES.md — authoritative)

### 1. vael
- Job: Knight
- Stats: HP 120, Defense 8, Attack 12, Move 3
- Attack range: 1 (melee)
- Initiative: 14
- Magic school: null (no magic primary)
- Mana: 0, Souls: 0, Verdance: 0
- Starting spells: [] (none at base)
- Troop tag: infantry
- permadeath_game_over: true (game ends if Vael dies)
- Signatures (flavor only — not mechanics in this module): Vanguard's Oath, Braced Charge

### 2. halv
- Job: Warrior
- Stats: HP 160, Defense 10, Attack 14, Move 3
- Attack range: 1 (melee)
- Initiative: 12
- Magic school: null
- Mana: 0, Souls: 0, Verdance: 0
- Starting spells: []
- Troop tag: infantry
- permadeath_game_over: false

### 3. brin
- Job: Ranger
- Stats: HP 95, Defense 5, Attack 13, Move 4
- Attack range: 3 (bow — ranged)
- Initiative: 16 (scouts move first)
- Magic school: null
- Mana: 0, Souls: 0, Verdance: 0
- Starting spells: []
- Troop tag: archer
- permadeath_game_over: false

### 4. caelen
- Job: Wizard
- Stats: HP 70, Defense 4, Attack 6, Move 3
- Attack range: 1 (melee fallback; uses spells for range)
- Initiative: 10
- Magic school: wizardry
- Mana: 40, max_mana: 40 (starts FULL — wizardry starts with full mana)
- Souls: 0, Verdance: 0
- Starting spells: ['firebolt', 'frost_shard', 'spark', 'shield']
- Troop tag: wizard
- permadeath_game_over: false

### 5. marrow
- Job: Necromancer
- Stats: HP 80, Defense 5, Attack 7, Move 3
- Attack range: 1 (melee fallback; uses spells for range)
- Initiative: 11
- Magic school: necromancy
- Mana: 0, Souls: 0 (starts at 0 — gains through kills), max_souls: 30 (stored as max_mana field for souls cap)
- Verdance: 0
- Starting spells: ['raise_skeleton', 'curse_of_weakness', 'life_drain', 'bone_shield']
- Troop tag: necromancer
- permadeath_game_over: false

Note for Marrow: souls are stored in the `souls` field. The cap is 30. There is no `mana` mechanic for Necromancers — set `mana: 0, max_mana: 0`. Use a separate `max_souls: 30` field.

### 6. thessa
- Job: Druid
- Stats: HP 95, Defense 6, Attack 8, Move 3
- Attack range: 1 (melee/staff fallback; uses spells for range)
- Initiative: 13
- Magic school: druidry
- Mana: 0, Souls: 0, Verdance: 0 (starts at 0 — gains through terrain adjacency), max_verdance: 35
- Starting spells: ['heal', 'regrowth', 'summon_wolf', 'gale']
- Troop tag: druid
- permadeath_game_over: false

Note for Thessa: verdance starts at 0. The cap is 35. Use a separate `max_verdance: 35` field.

---

## Module API to expose

```javascript
window.OathAndBoneHeroes = {

  // Returns the base hero definition object (read-only)
  // heroId: 'vael' | 'halv' | 'brin' | 'caelen' | 'marrow' | 'thessa'
  getDefinition: function(heroId) { ... },

  // Creates a full unit object ready for the engine
  // unitId: the id string for this unit instance (e.g. 'player_vael')
  // heroId: 'vael' etc.
  // team: 'player' | 'enemy'
  // q, r: starting hex coordinates
  createUnit: function(heroId, unitId, team, q, r) { ... },

  // Returns array of all 6 heroIds
  getAllHeroIds: function() { ... },

  // Returns true if this hero's death triggers game over
  isGameOverHero: function(heroId) { ... }
};
```

---

## CONSTRAINTS (do not remove, do not paraphrase)

- This is Oath and Bone, an unofficial fan-made game. Declare `var DISCLAIMER = 'Unofficial. Not affiliated with Century Games.';` at top of file.
- Do NOT use any of these 27 canonical Kingshot hero names: Amadeus, Jabel, Helga, Saul, Zoe, Hilde, Marlin, Petra, Eric, Jaeger, Rosa, Alcar, Margot, Vivian, Thrud, Long Fei, Yang, Sophia, Triton, Chenko, Amane, Yeonwoo, Gordon, Howard, Quinn, Diana, Fahd.
- Economy rule: paying players accelerate; they do not access content unavailable to free players.
- Permadeath is real: `permadeath_loss` field starts as `false` on every unit. The engine sets it to `true` when HP reaches 0. NEVER clear it.
- No hardcoded $ prices anywhere.
- No arrow functions. Use `function() {}` syntax only.
- No `import` or `require`. Vanilla JS browser script.
- No `var window = window || {}` at the top — window is a browser global.

---

## Verification criteria (check before returning)

- All 6 heroes defined: vael, halv, brin, caelen, marrow, thessa
- `permadeath_loss: false` on every unit created (never pre-set to true)
- `permadeath_game_over: true` only on vael; false for all others
- Caelen mana starts at 40 (full), not 0 — Wizardry starts full
- Marrow souls starts at 0, max_souls: 30; mana: 0, max_mana: 0
- Thessa verdance starts at 0, max_verdance: 35
- Brin attack_range: 3 (archer — ranged)
- No canonical Kingshot name in any string, variable, or comment
- `createUnit` returns a complete unit object matching the schema above

---

## Output

One .js file. No markdown, no explanation, no code fences — just the code. Target length: 150–250 lines.

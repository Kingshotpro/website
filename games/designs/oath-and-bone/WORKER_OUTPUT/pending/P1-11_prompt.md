# Delegation Prompt P1-11 — game-oath-and-bone-battles.js (B1 scenario)

You are writing the B1 battle scenario data object for Oath and Bone, an unofficial fan-made tactical RPG. Output goes into `game-oath-and-bone-battles.js` — a new file that exposes `window.OathAndBoneBattles`.

---

## Output file structure

```javascript
var DISCLAIMER = 'Unofficial. Not affiliated with Century Games.';

var SCENARIO_B1 = { ... };  // full scenario object below

window.OathAndBoneBattles = {
  getScenario: function(id) {
    if (id === 'b1') return JSON.parse(JSON.stringify(SCENARIO_B1));
    return null;
  }
};
```

No `import`, no `require`. Vanilla browser JS only. No arrow functions — use `function() {}` syntax. No hardcoded `$` prices — none needed here.

---

## Engine integration — critical field names

The engine's `start()` function reads unit definitions from scenario data using these EXACT field names. Wrong names = engine silently reads undefined.

For unit defs inside `playerStart` and `enemyStart` arrays, use:
- `hp_max` — NOT `max_hp`
- `move` — NOT `move_range`
- `attack_range` — correct
- `attack_dmg` — correct
- `initiative` — correct
- `acted` — must be `false` (engine resets each round anyway)
- `permadeath_loss` — must be `false` (engine sets to true on HP=0 for player units)
- `magic` — `null` for non-magic heroes; for magic heroes: `{ school, mana, max_mana, souls, max_souls, verdance, max_verdance, spells }` object

For B1, all 3 player heroes (Vael, Halv, Brin) have no magic. All enemies are melee/archer infantry. Set `magic: null` for all units.

The engine creates live unit objects in `_battle.units[id]` by copying these fields. Rewards, tutorials, flags, and soul-review data do NOT go into unit objects — they live at the top level of the scenario.

---

## Scenario object schema

```javascript
var SCENARIO_B1 = {
  id: 'b1',
  name: 'The Muster',
  act: 1,
  biome: 'plain',
  map_width: 12,   // q: 0..11
  map_height: 14,  // r: 0..13
  // player starts at south (high r), enemy starts at north (low r)

  hexTypes: {
    plain:  { terrain: 'plain',  elevation: 0, tile_mods: [] },
    ridge:  { terrain: 'ridge',  elevation: 2, tile_mods: [] },
    forest: { terrain: 'forest', elevation: 0, tile_mods: [] }
  },

  // map[q][r] = { type: 'plain' | 'ridge' | 'forest' }
  // Must cover q=0..11, r=0..13 (168 tiles)
  // Ridge: 3 hexes at r=1 (q=4,5,6) — elevation 2, Ironwall archer starts at (5,1)
  // Forest: 10 hexes scattered in mid-field (r=5..9 range)
  // Everything else: plain
  map: { ... },

  playerStart: [
    // 3 units — Vael, Halv, Brin — south edge
    { id: 'player_vael', heroId: 'vael', team: 'player', q: 3, r: 12,
      hp_max: 120, move: 3, attack_range: 1, attack_dmg: 12, initiative: 14,
      defense: 8, acted: false, permadeath_loss: false, permadeath_game_over: true,
      troop_tag: 'infantry', magic: null },
    { id: 'player_halv', heroId: 'halv', team: 'player', q: 4, r: 12,
      hp_max: 160, move: 3, attack_range: 1, attack_dmg: 14, initiative: 12,
      defense: 10, acted: false, permadeath_loss: false, permadeath_game_over: false,
      troop_tag: 'infantry', magic: null },
    { id: 'player_brin', heroId: 'brin', team: 'player', q: 5, r: 12,
      hp_max: 95, move: 4, attack_range: 3, attack_dmg: 13, initiative: 16,
      defense: 5, acted: false, permadeath_loss: false, permadeath_game_over: false,
      troop_tag: 'archer', magic: null }
  ],

  enemyStart: [
    // 4× Bladewind infantry (archetype: 'bladewind', Lv 2) — fast melee flankers
    // 1× Ironwall archer (archetype: 'ironwall', Lv 3) — holds ridge, ranged
    // Enemy stats are base (Sergeant 1.0×) — engine applies difficulty tier multipliers at runtime
    { id: 'enemy_bladewind_a', heroId: null, team: 'enemy', q: 4, r: 2,
      archetype: 'bladewind', level: 2,
      hp_max: 75, move: 4, attack_range: 1, attack_dmg: 9, initiative: 13,
      defense: 3, acted: false, permadeath_loss: false, permadeath_game_over: false,
      troop_tag: 'infantry', magic: null },
    { id: 'enemy_bladewind_b', heroId: null, team: 'enemy', q: 6, r: 2,
      archetype: 'bladewind', level: 2,
      hp_max: 75, move: 4, attack_range: 1, attack_dmg: 9, initiative: 13,
      defense: 3, acted: false, permadeath_loss: false, permadeath_game_over: false,
      troop_tag: 'infantry', magic: null },
    { id: 'enemy_bladewind_c', heroId: null, team: 'enemy', q: 3, r: 4,
      archetype: 'bladewind', level: 2,
      hp_max: 75, move: 4, attack_range: 1, attack_dmg: 9, initiative: 13,
      defense: 3, acted: false, permadeath_loss: false, permadeath_game_over: false,
      troop_tag: 'infantry', magic: null },
    { id: 'enemy_bladewind_d', heroId: null, team: 'enemy', q: 7, r: 4,
      archetype: 'bladewind', level: 2,
      hp_max: 75, move: 4, attack_range: 1, attack_dmg: 9, initiative: 13,
      defense: 3, acted: false, permadeath_loss: false, permadeath_game_over: false,
      troop_tag: 'infantry', magic: null },
    { id: 'enemy_ironwall_archer', heroId: null, team: 'enemy', q: 5, r: 1,
      archetype: 'ironwall', level: 3,
      hp_max: 100, move: 2, attack_range: 3, attack_dmg: 11, initiative: 10,
      defense: 6, acted: false, permadeath_loss: false, permadeath_game_over: false,
      troop_tag: 'archer', magic: null }
  ],

  objective: {
    type: 'rout',
    description: 'Reduce all enemies to HP 0'
  },

  rewards: {
    xp: { scout: 45, sergeant: 60, marshal: 90 },
    crowns: 50,
    credits: { count: 1, condition: 'first_sergeant_win_of_day' },
    reagents: []
  },

  difficulty_tiers: {
    scout:    { hp_mult: 0.75, dmg_mult: 0.80, reward_mult: 0.75 },
    sergeant: { hp_mult: 1.00, dmg_mult: 1.00, reward_mult: 1.00 },
    marshal:  { hp_mult: 1.50, dmg_mult: 1.25, reward_mult: 1.50 }
  },

  tutorials: ['T1', 'T2', 'T3'],
  tutorial_triggers: {
    T1: { event: 'first_attack' },
    T2: { event: 'first_ridge_shot' },
    T3: { event: 'turn_3_no_hold' }
  },
  tutorial_copy: {
    T1: 'Troop triangle: infantry beats cavalry · cavalry beats archer · archer beats infantry. +20% damage on favorable matchup.',
    T2: 'Elevation: +20% damage attacking down, -20% attacking up. Ranged attacks gain +1 hex range firing down.',
    T3: 'Hold: end a unit\'s turn early to accumulate Resolve and regen partial resources.'
  },

  story_flags: {
    read: [],
    write: ['b1_complete', 'first_battle_victory']
  },

  soul_review: [
    {
      event: 'sword_clash',
      channels: ['slide_animation', 'blade_sfx', 'hp_number_float', 'halv_barb_not_past_me']
    },
    {
      event: 'kill',
      channels: ['desaturate_0_5s', 'low_tone_sfx', 'hp_zero_flag', 'party_reaction_line']
    },
    {
      event: 'victory',
      channels: ['gold_sparkle', 'rising_chord', 'xp_crown_float', 'advisor_orb_pulse']
    }
  ],

  party: {
    size: 3,
    locked: ['vael', 'halv', 'brin'],
    flexible: []
  }
};
```

---

## Map generation

The map is `q=0..11, r=0..13` (168 hexes total). Build `map` as a nested object: `map[q][r] = { type: 'plain' | 'ridge' | 'forest' }`.

Terrain distribution:
- **Ridge (3 hexes):** `(4,1)`, `(5,1)`, `(6,1)` — elevation 2. The Ironwall archer starts here.
- **Forest (10 hexes):** Scatter in the mid-field band `r=5..9`. Use something like: `(2,5), (3,7), (5,6), (6,8), (7,6), (8,5), (9,7), (10,6), (1,9), (4,9)`. No forest on starting positions.
- **All other hexes (155):** plain.

Check: none of the 8 starting positions (playerStart + enemyStart) land on forest. Positions are:
- Players: (3,12), (4,12), (5,12) — plain rows, fine
- Bladewind-A: (4,2) — plain, fine
- Bladewind-B: (6,2) — plain, fine
- Bladewind-C: (3,4) — plain, fine
- Bladewind-D: (7,4) — plain, fine
- Ironwall archer: (5,1) — ridge, correct

---

## CONSTRAINTS

- Declare `var DISCLAIMER = 'Unofficial. Not affiliated with Century Games.';` at top.
- Do NOT use any of these 27 canonical Kingshot hero names: Amadeus, Jabel, Helga, Saul, Zoe, Hilde, Marlin, Petra, Eric, Jaeger, Rosa, Alcar, Margot, Vivian, Thrud, Long Fei, Yang, Sophia, Triton, Chenko, Amane, Yeonwoo, Gordon, Howard, Quinn, Diana, Fahd.
- No hardcoded `$` prices.
- No arrow functions. Use `function() {}` syntax.
- No `import` or `require`. Vanilla browser JS.
- No `var window = window || {}` — window is a browser global.
- `permadeath_loss: false` on every unit in scenario data.
- `permadeath_game_over: true` only on Vael; false for all others.

---

## Verification before returning

- All 168 hexes (q=0..11, r=0..13) defined in `map`
- Ridge at (4,1), (5,1), (6,1) only — 3 hexes
- Forest: exactly 10 hexes, none overlapping starting positions
- playerStart: 3 units — vael at (3,12), halv at (4,12), brin at (5,12)
- enemyStart: 5 units — 4 Bladewind + 1 Ironwall archer at (5,1)
- All unit defs use `hp_max` (not `max_hp`) and `move` (not `move_range`)
- `permadeath_loss: false` on all 8 units
- `permadeath_game_over: true` on vael only
- Rewards: XP scout/sergeant/marshal = 45/60/90, crowns = 50, credits = 1 conditional
- Soul Review: 3 events, each with 4 channels — all ≥ 3 minimum
- Tutorials: T1, T2, T3 present
- Story flags write: ['b1_complete', 'first_battle_victory']
- No canonical Kingshot names
- `window.OathAndBoneBattles.getScenario('b1')` returns a deep copy

---

## Output

One `.js` file. No markdown, no explanation, no code fences. Just the code. Target: 200–350 lines.

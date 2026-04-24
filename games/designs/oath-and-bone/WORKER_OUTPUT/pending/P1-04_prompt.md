# P1-04 Delegation Prompt — game-oath-and-bone-engine.js
## Combat state machine: hex grid, unit placement, turn order

## Context

You are writing the core engine module for Oath and Bone, a tactical hex-grid RPG. This module provides `window.OathAndBoneEngine` — the object that `game-oath-and-bone.js` polls for and calls `OathAndBoneEngine.start(container, options)`.

This module handles:
1. Hex grid data structures and math (axial coordinates)
2. Tile and unit schemas
3. Battle state management
4. Unit placement from a scenario object
5. Turn order / initiative system

This module does NOT handle: rendering/canvas, spells, enemy AI, UI overlays. Those are separate modules loaded later. Leave clear extension points for them.

## Hex grid math (axial coordinates q, r)

Standard axial hex grid. All coordinates use `{q, r}` pairs:

```javascript
// Axial distance between two hexes
function hexDistance(a, b) {
  return Math.max(Math.abs(a.q - b.q), Math.abs(a.r - b.r), Math.abs((-a.q - a.r) - (-b.q - b.r)));
}

// Six axial directions
var HEX_DIRECTIONS = [
  {q:1,r:0}, {q:1,r:-1}, {q:0,r:-1},
  {q:-1,r:0}, {q:-1,r:1}, {q:0,r:1}
];

// Neighbors of a hex
function hexNeighbors(hex) {
  return HEX_DIRECTIONS.map(function(d) { return {q: hex.q + d.q, r: hex.r + d.r}; });
}
```

Implement these as internal helpers. Also implement:
- `hexRing(center, radius)` — returns all hexes at exactly `radius` distance
- `hexesInRange(center, maxRange)` — returns all hexes within `maxRange` distance (BFS or formula)

## Tile schema (exact — do not change field names)

```javascript
{
  q: number,           // axial column
  r: number,           // axial row
  terrain: string,     // 'plain' | 'rough' | 'ridge' | 'river' | 'forest' | 'ruin' | 'sanctum'
  elevation: number,   // 0–5 integer
  unit: null | string, // unit id occupying this hex, or null
  tile_mods: []        // array of modifier strings (e.g. 'sanctum_mana', 'grove_verdance')
}
```

## Unit schema (exact — do not change field names)

```javascript
{
  id: string,          // unique unit id, e.g. 'vael_1' or 'enemy_bladewind_0'
  heroId: string,      // links to hero definition (e.g. 'vael') or archetype (e.g. 'bladewind')
  team: 'player' | 'enemy',
  q: number,           // current axial position
  r: number,
  hp: number,
  hp_max: number,
  move: number,        // movement range in hexes
  attack_range: number,// 1 for melee, 2+ for ranged
  attack_dmg: number,
  initiative: number,  // higher = moves earlier in turn order
  acted: boolean,      // true if this unit has acted this turn
  permadeath_loss: boolean, // once true, never cleared
  magic: null | {      // null for non-casters
    school: 'wizardry' | 'necromancy' | 'druidry',
    mana: number, mana_max: number, mana_regen: number,
    souls: number, souls_max: number,
    verdance: number, verdance_max: number,
    spells_learned: [], // spell ids
    spells_equipped: [],// spell ids (max 4 equipped)
    summon_slots: number,
    active_summons: []  // unit ids of active summons
  }
}
```

## Elevation rules (implement in movement and attack calculations)

**Movement:**
- Base movement cost: 1 hex = 1 move point
- Climbing up: +1 move cost per elevation level difference (e.g. moving from elevation 1 to elevation 3 costs 2 + 2 = 4 move points total for that step? No — base 1 + elevation_diff penalty)
  - Correct: moving to a hex 2 elevation levels higher costs 1 (base) + 2 (elevation diff) = 3 move points
- Cannot climb more than 2 elevation levels in a single move step (cliff block)
- Descending: no extra cost (elevation diff downward = free)

**Attack modifiers:**
- Attacker at higher elevation than target: ×1.20 damage
- Attacker at lower elevation than target: ×0.80 damage
- Ranged attacks (attack_range ≥ 2) add +1 hex range when firing downhill (attacker elevation > target elevation)
- Flat (equal elevation): no modifier

## Turn order system

At the start of each battle round, build a turn queue:
1. Sort all living units (player + enemy) by `initiative` descending
2. Ties: player units go before enemy units at equal initiative
3. Each unit in queue gets one action (move + attack OR cast, or just move, or just hold)
4. When all units have acted (`acted === true`), begin a new round:
   - Reset all `acted = false`
   - Apply per-round resource regen (mana/souls/verdance — amounts defined in MAGIC module, not this file; call `window.OathAndBoneSpells.applyRegen(unit)` if it exists, else skip)
   - Rebuild turn queue for the new round

Expose:
```javascript
OathAndBoneEngine.getCurrentUnit() // returns the unit whose turn it is
OathAndBoneEngine.advanceTurn()    // marks current unit acted, moves to next
```

## Battle state object (internal)

```javascript
var _battle = {
  tiles: {},          // keyed by 'q,r' → tile object
  units: {},          // keyed by unit.id → unit object
  turnQueue: [],      // ordered array of unit ids for this round
  turnIndex: 0,       // which index in turnQueue is acting
  round: 1,
  phase: 'placement' | 'active' | 'victory' | 'defeat',
  scenario: null      // the scenario object passed to start()
};
```

## OathAndBoneEngine API (exact interface — do not rename)

```javascript
window.OathAndBoneEngine = {
  // Called by game-oath-and-bone.js after polling
  start: function(container, options) {
    // options: { practiceMode: bool }
    // Initialize _battle from _battle.scenario (set before start() via loadScenario)
    // Build tile grid from scenario.map + scenario.hexTypes
    // Place units from scenario.playerStart + scenario.enemyStart
    // Build initial turn queue
    // Set phase to 'active'
    // Call OathAndBoneEngine.onReady(container, options) if renderer is attached
  },

  // Load scenario data before start()
  loadScenario: function(scenario) { _battle.scenario = scenario; },

  // Query
  getBattle:      function() { return _battle; },
  getTile:        function(q, r) { return _battle.tiles[q + ',' + r] || null; },
  getUnit:        function(id) { return _battle.units[id] || null; },
  getCurrentUnit: function() { return _battle.units[_battle.turnQueue[_battle.turnIndex]] || null; },
  getMovableHexes: function(unitId) { /* returns array of {q,r} reachable */ },
  getAttackableHexes: function(unitId) { /* returns array of {q,r} in attack range */ },

  // Actions
  moveUnit:   function(unitId, toQ, toR) { /* validate, move, mark acted if attack skipped */ },
  attackUnit: function(attackerId, targetId) { /* apply elevation modifier to damage */ },
  advanceTurn: function() { /* mark current unit acted, move to next, handle round wrap */ },

  // Hooks — renderer attaches these
  onReady:      null, // function(container, options)
  onUnitMoved:  null, // function(unit, fromQ, fromR, toQ, toR)
  onUnitAttacked: null, // function(attacker, target, damage)
  onRoundStart: null, // function(round)
  onBattleEnd:  null  // function(result) — 'victory' or 'defeat'
};
```

## Integration with OathAndBone namespace

When battle ends:
```javascript
// Call back to the wiring module
if (typeof OathAndBone !== 'undefined') {
  if (result === 'victory') {
    // SOUL REVIEW: battle victory must fire 3+ feedback channels
    // Channel 1 (visual): onBattleEnd hook → renderer shows result overlay
    // Channel 2 (audio): onBattleEnd hook → renderer plays victory sound
    // Channel 3 (numerical): OathAndBone.onBattleVictory fires XP grant
    OathAndBone.onBattleVictory(_currentDifficultyTier, livingPlayerUnits.length);
  }
  OathAndBone.onBattleEnd(result);
  OathAndBone.observe('battles_played', 1);
  OathAndBone.observe('last_result', result);
}
```

## CONSTRAINTS (do not remove)

- This is Oath and Bone, an unofficial fan-made game. Add `var DISCLAIMER = 'Unofficial. Not affiliated with Century Games.';` as a constant.
- Do NOT use any of these 27 canonical Kingshot hero names: Amadeus, Jabel, Helga, Saul, Zoe, Hilde, Marlin, Petra, Eric, Jaeger, Rosa, Alcar, Margot, Vivian, Thrud, Long Fei, Yang, Sophia, Triton, Chenko, Amane, Yeonwoo, Gordon, Howard, Quinn, Diana, Fahd.
- Do NOT use the word "Crownsmoke." The game is "Oath and Bone."
- Economy rule: NO content locked to payment. No energy gates. No revive-for-currency.
- Permadeath: `permadeath_loss` flag on unit, once set to true, is NEVER cleared. Not on save/load. Not on scenario restart. It is a permanent flag.
- Do NOT hardcode any $ price. This module has no pricing UI — just include the constraint comment.
- Vanilla JS only. No ES6 imports. No classes. No frameworks. Browser-target.
- Do NOT invent function names for other modules (spells, renderer) — reference them with `if (window.X) { window.X.method() }` guards only.

## Verification criteria (check before returning)

- [ ] `window.OathAndBoneEngine` declared with all listed methods
- [ ] `hexDistance` function uses correct axial formula (max of 3 axes)
- [ ] Elevation climbing costs correctly (+1 per elevation level up; cannot climb >2 levels)
- [ ] Attack damage multiplied by 1.20 (higher) or 0.80 (lower); ranged adds +1 range downhill
- [ ] `permadeath_loss` flag set and comment says "never cleared"
- [ ] Victory path calls `OathAndBone.onBattleVictory` + `OathAndBone.onBattleEnd`
- [ ] Soul Review 3-channel comment present at victory path
- [ ] No canonical Kingshot name in any string, variable, or comment
- [ ] No "Crownsmoke" anywhere
- [ ] DISCLAIMER constant present

## Output

One self-contained JavaScript file. No markdown. No code fences. Just the JS. Target: `js/game-oath-and-bone-engine.js`.

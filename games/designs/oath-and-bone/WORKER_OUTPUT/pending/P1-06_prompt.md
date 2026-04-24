# Delegation Prompt P1-06 — game-oath-and-bone-ai.js

You are writing `game-oath-and-bone-ai.js` for Oath and Bone, a tactical RPG. This module implements the enemy AI decision engine — 6 archetypes that run when it is an enemy unit's turn.

---

## Context

Oath and Bone uses a hex-grid combat engine already implemented in `game-oath-and-bone-engine.js` (you do not need to read it — the full API is specified below). The spell system is in `game-oath-and-bone-spells.js` (API also below). Your module reads state through the engine API and calls engine/spell actions. It does NOT modify `_battle` directly.

---

## Data schemas — exact, do not invent fields

### Unit object (read-only)
```
{
  id: string,            // e.g. 'enemy_0'
  heroId: string,        // archetype key: 'ironwall'|'bladewind'|'warden'|'cabal'|'binding'|'grove_warden'
  team: 'player'|'enemy',
  q: integer,            // current hex column
  r: integer,            // current hex row
  hp: integer,
  max_hp: integer,
  attack_dmg: integer,
  move_range: integer,
  attack_range: integer,
  initiative: integer,
  acted: boolean,        // true = already took action this turn
  magic_school: 'wizardry'|'necromancy'|'druidry'|null,
  mana: integer,
  max_mana: integer,
  souls: integer,
  verdance: integer,
  is_summon: boolean,
  summon_owner: string|null,
  status_effects: []
}
```

### Tile object (read-only)
```
{
  q: integer,
  r: integer,
  terrain: string,       // 'plain'|'rough'|'ridge'|'river'|'forest'|'ruin'|'sanctum'
  elevation: integer,    // 0–5
  unit: string|null,     // unit ID string OR null — NOT a unit object
  tile_mods: []
}
```

IMPORTANT: `tile.unit` is a string unit ID, not a unit object. To get the unit at a tile, call `window.OathAndBoneEngine.getUnit(tile.unit)`. Never access `tile.unit.hp`, `tile.unit.team`, etc. directly.

IMPORTANT: `battle.units` is an object keyed by unit id, NOT an array. Never call `.push()`, `.filter()`, `.find()`, or `.indexOf()` on it. Use `for (var id in battle.units)` to iterate.

---

## Engine API (window.OathAndBoneEngine)

```javascript
window.OathAndBoneEngine.getBattle()
  // Returns the full battle state:
  // { tiles: {}, units: {}, turnQueue: [], turnIndex: int, round: int, phase: string, scenario: {} }
  // tiles keyed by 'q,r'; units keyed by unit.id

window.OathAndBoneEngine.getUnit(unitId)
  // Returns unit object or null

window.OathAndBoneEngine.getTile(q, r)
  // Returns tile object or null

window.OathAndBoneEngine.getCurrentUnit()
  // Returns the unit whose turn it currently is

window.OathAndBoneEngine.getMovableHexes(unitId)
  // Returns array of {q, r} the unit can legally move to this turn

window.OathAndBoneEngine.getAttackableHexes(unitId)
  // Returns array of {q, r} the unit can legally attack from its current position

window.OathAndBoneEngine.moveUnit(unitId, toQ, toR)
  // Returns true on success, false on failure

window.OathAndBoneEngine.attackUnit(attackerId, targetId)
  // Returns true on success, false on failure; sets attacker.acted = true

window.OathAndBoneEngine.advanceTurn()
  // Ends the current unit's turn and advances to the next unit in the queue
```

---

## Spell API (window.OathAndBoneSpells) — only if loaded

```javascript
window.OathAndBoneSpells.getSpellTargetHexes(casterId, spellId)
  // Returns array of {q, r} valid cast targets for this spell from caster's position

window.OathAndBoneSpells.castSpell(casterId, spellId, targetQ, targetR)
  // Deducts resource, applies effect, fires hooks
  // Returns true on success, false on failure; sets unit.acted = true internally

window.OathAndBoneSpells.getSpellDef(spellId)
  // Returns spell definition object: { id, school, cost, range, aoe, targeting, effect, ... }
```

Always guard: `if (window.OathAndBoneSpells && window.OathAndBoneSpells.castSpell)` before calling spell API.

---

## The 6 archetypes

Each enemy unit has a `heroId` field specifying its archetype. The AI uses this to select its decision tree.

### Archetype A — "ironwall" (Defensive / Turtle)
Source: MUSTER_DESIGN.md §4

- Priority 1: Keep formation — move toward nearest ally enemy unit to stay within 2 hexes
- Priority 2: If any ally enemy unit is below 40% HP and this unit has a healing spell, cast it
- Priority 3: Attack only if a player unit entered this unit's attack range; otherwise Hold (skip attack)
- Never pursues past the map midline (r < 0 means north half; do not cross r=0 going south)
- Difficulty scaling: Scout = random move among top-3 formation moves; Sergeant = nearest ally move; Marshal = nearest-ally with attack-opportunity scan

### Archetype B — "bladewind" (Aggressive / Rush)
Source: MUSTER_DESIGN.md §4

- Priority 1: Move toward the nearest player unit each turn (shortest hex distance)
- Priority 2: Attack the nearest player unit in range; always attacks rather than Holds when a target is reachable
- Priority 3: Ignores counter advantage unless HP below 25%; then retreats one step
- Never retreats except at <25% HP threshold
- Difficulty scaling: Scout = targets individually; Sergeant = same; Marshal = coordinates with lowest-HP player unit focus (attack the same target other Bladewind allies targeted last turn if it survives)

### Archetype C — "warden" (Opportunist / Counter-Puncher)
Source: MUSTER_DESIGN.md §4

- Priority 1: Scan all player units; find the one where this unit has highest attack_dmg advantage (attacker elevation > target = 1.20x; vice versa 0.80x). If advantage ≥1.10x, close to attack that target
- Priority 2: If no advantage ≥1.10x, Hold (skip attack) and reposition to improve next-turn advantage
- Priority 3: Use Hold when no good opportunity exists — never wastes action on a neutral trade
- Difficulty scaling: Scout = only considers elevation; Sergeant = same; Marshal = also prefers targets with active status_effects (they are already weakened)

### Archetype D — "cabal" (Wizard-dominant)
Source: MAGIC.md §5

- Priority 1: Maintain 3-hex spacing from nearest player melee unit (move_range ≤ 1 or attack_range ≤ 1). Move to widen distance if within 2 hexes
- Priority 2: If mana is sufficient and OathAndBoneSpells is loaded, find AoE spell targets where cast hits ≥2 player units; cast the highest-cost such spell available
- Priority 3: If HP below 30%, retreat toward map edge and do not attack; attempt to cast a defensive/positioning spell (teleport or shield if in spellset)
- Uses Teleport reactively: if no escape move exists and HP < 30%, try casting teleport_strike or any teleport spell to escape

### Archetype E — "binding" (Necromancer + summons)
Source: MAGIC.md §5

- Priority 1: On round 1, summon 2 minor skeletons if souls ≥ cost and OathAndBoneSpells is loaded (use `raise_skeleton` spell targeting hexes adjacent to this unit, one at a time)
- Priority 2: Cast Curse on the player unit with the highest attack_dmg value (use `curse` spell)
- Priority 3: Position to keep ≥1 dead unit (hp === 0) within range for corpse explosion spells; if none in range, fall back to physical attack
- Summoned units (is_summon: true, summon_owner === this unit's id) attack aggressively — treat them as Bladewind archetype for their own turns
- Necromancer itself positions behind its summons (never advances past its own summons)

### Archetype F — "grove_warden" (Druid support + summoned animals)
Source: MAGIC.md §5

- Priority 1: If any ally enemy unit is in melee contact with a player unit (distance === 1), convert up to 3 adjacent hexes to thorn-grove terrain by casting terrain-conversion spell (thorn_grove or equivalent) if verdance ≥ cost
- Priority 2: If any ally enemy unit is below 50% HP and verdance is sufficient, cast heal on the lowest-HP ally
- Priority 3: Summon wolves to flanks (wolf summon spells) or a bear center if verdance allows and round ≤ 3
- Retreats only when this unit's HP drops below 25%
- At <25% HP: prioritize pack_call or any summon spell if not yet summoned this battle; otherwise move toward pack center

---

## AI decision loop (per unit per turn)

The main entry `OathAndBoneAI.takeTurn(unitId)` must:

1. Get the unit object. If dead or not enemy team, return immediately.
2. Get the archetype from `unit.heroId`.
3. Determine the difficulty tier from `battle.scenario.difficultyTier` (1=Scout, 2=Sergeant, 3=Marshal).
4. Apply ε=0.1 random exploration: 10% of the time, override the archetype decision and take a random legal action instead (move to a random movable hex, attack a random attackable enemy if one exists).
5. Otherwise, execute the archetype's priority tree:
   a. Determine best move hex (or stay in place).
   b. If a move is chosen, call `moveUnit(unitId, q, r)`.
   c. Determine best action (attack or spell cast or hold).
   d. If attacking, call `attackUnit(unitId, targetId)`.
   e. If casting, call `OathAndBoneSpells.castSpell(unitId, spellId, q, r)`.
   f. If holding, call `advanceTurn()`.
6. After action: call `advanceTurn()`.

Note: If `attackUnit` or `castSpell` returns true (action taken), do NOT also call `advanceTurn()` — the caller (game-oath-and-bone.js) controls turn advancement after `takeTurn` returns. Actually: the AI module calls `advanceTurn()` itself after completing its action. `takeTurn` is a fire-and-forget call.

Wait — to keep it clean: `takeTurn(unitId)` executes move + action and then calls `window.OathAndBoneEngine.advanceTurn()` as its final step. The game loop calls `takeTurn` when `getCurrentUnit().team === 'enemy'`.

---

## Hex distance utility

For distance calculations inside this module, implement a local helper:

```javascript
function _aiHexDistance(a, b) {
  return Math.max(Math.abs(a.q - b.q), Math.abs(a.r - b.r), Math.abs((-a.q - a.r) - (-b.q - b.r)));
}
```

---

## Output module structure

```javascript
var DISCLAIMER = 'Unofficial. Not affiliated with Century Games.';

window.OathAndBoneAI = (function() {

  // private helpers and archetype functions

  return {
    takeTurn: function(unitId) { ... },
    // optional: getArchetypeForUnit(unit) for external inspection
  };

})();
```

Use the IIFE pattern. No imports. No arrow functions. Var declarations only. Vanilla JS only — targets a browser page.

---

## CONSTRAINTS (do not remove, do not paraphrase)

- This is Oath and Bone, an unofficial fan-made game. The DISCLAIMER variable is already declared at the top of the file.
- Do NOT use any of these 27 canonical Kingshot hero names: Amadeus, Jabel, Helga, Saul, Zoe, Hilde, Marlin, Petra, Eric, Jaeger, Rosa, Alcar, Margot, Vivian, Thrud, Long Fei, Yang, Sophia, Triton, Chenko, Amane, Yeonwoo, Gordon, Howard, Quinn, Diana, Fahd.
- Economy rule: paying players accelerate; they do not access content unavailable to free players.
- Permadeath is real: never clear `permadeath_loss` from any unit.
- No hardcoded $ prices anywhere.
- `battle.units` is an object keyed by unit ID. Use `for (var id in battle.units)` to iterate. Never call `.filter()`, `.push()`, `.find()` on it.
- `tile.unit` is a string unit ID, not a unit object. Always call `window.OathAndBoneEngine.getUnit(tile.unit)` to get the unit.
- No arrow functions. Use `function() {}` syntax only.
- No `import` or `require`. Vanilla JS browser script.

---

## Verification criteria (check before returning)

- All 6 archetypes have a functioning decision tree
- ε=0.1 random exploration implemented
- Difficulty scaling (Scout/Sergeant/Marshal) implemented for at least archetypes A, B, C
- Magic archetypes (D, E, F) guard all spell calls with `if (window.OathAndBoneSpells && ...)`
- No canonical Kingshot name in any string, variable name, or comment
- `tile.unit` is never accessed as an object (no `tile.unit.hp`, `tile.unit.team`, etc.)
- `battle.units` is never treated as an array
- `advanceTurn()` is called exactly once per `takeTurn` execution
- Module does not modify `_battle` directly (only through the engine API)

---

## Output

One .js file. No markdown, no explanation, no code fences — just the code. Target length: 300–500 lines.

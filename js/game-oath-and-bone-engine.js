var DISCLAIMER = 'Unofficial. Not affiliated with Century Games.';

// Internal helpers for hex grid math
function hexDistance(a, b) {
  return Math.max(Math.abs(a.q - b.q), Math.abs(a.r - b.r), Math.abs((-a.q - a.r) - (-b.q - b.r)));
}

var HEX_DIRECTIONS = [
  {q:1,r:0}, {q:1,r:-1}, {q:0,r:-1},
  {q:-1,r:0}, {q:-1,r:1}, {q:0,r:1}
];

function hexNeighbors(hex) {
  return HEX_DIRECTIONS.map(function(d) { return {q: hex.q + d.q, r: hex.r + d.r}; });
}

function hexRing(center, radius) {
  var results = [];
  var q = center.q;
  var r = center.r;
  if (radius === 0) return [center];

  for (var i = 0; i < 6; i++) {
    var direction = HEX_DIRECTIONS[i];
    var currentQ = q + direction.q * radius;
    var currentR = r + direction.r * radius;
    for (var j = 0; j < radius; j++) {
      results.push({q: currentQ, r: currentR});
      currentQ += direction.q;
      currentR += direction.r;
    }
  }
  return results;
}

function hexesInRange(center, maxRange) {
  var results = [];
  for (var radius = 0; radius <= maxRange; radius++) {
    results = results.concat(hexRing(center, radius));
  }
  var uniqueResults = [];
  var seen = {};
  for (var i = 0; i < results.length; i++) {
    var hex = results[i];
    var key = hex.q + ',' + hex.r;
    if (!seen[key]) {
      uniqueResults.push(hex);
      seen[key] = true;
    }
  }
  return uniqueResults.filter(function(hex) { return hexDistance(center, hex) <= maxRange; });
}


// Internal battle state
var _battle = {
  tiles: {},          // keyed by 'q,r' → tile object
  units: {},          // keyed by unit.id → unit object
  turnQueue: [],      // ordered array of unit ids for this round
  turnIndex: 0,       // which index in turnQueue is acting
  round: 1,
  phase: 'placement', // 'placement' | 'active' | 'victory' | 'defeat'
  scenario: null,     // the scenario object passed to start()
  tutorials_fired: {}, // tracks which tutorial triggers fired this session
  playerHoldUsed: false // tracks if any player unit used Hold in rounds 1-2 (T3 gate)
};

// Elevation movement cost calculation
function getMovementCost(fromTile, toTile) {
  var baseCost = 1;
  var elevationDiff = toTile.elevation - fromTile.elevation;

  if (elevationDiff > 0) {
    if (elevationDiff > 2) {
      return Infinity; // Cannot climb more than 2 elevation levels
    }
    return baseCost + elevationDiff;
  } else {
    return baseCost; // Descending is free
  }
}

// Attack damage modifier calculation
function getAttackDamageModifier(attackerTile, targetTile) {
  var elevationDiff = attackerTile.elevation - targetTile.elevation;
  if (elevationDiff > 0) {
    return 1.20; // Attacker at higher elevation
  } else if (elevationDiff < 0) {
    return 0.80; // Attacker at lower elevation
  }
  return 1.00; // Flat
}

// Ranged attack range modifier
function getRangedAttackRangeBonus(attackerTile, targetTile) {
  var elevationDiff = attackerTile.elevation - targetTile.elevation;
  if (elevationDiff > 0) {
    return 1; // Attacker at higher elevation grants +1 range downhill
  }
  return 0;
}

// Helper to get tile object from coordinates
function _getTile(q, r) {
  return _battle.tiles[q + ',' + r] || null;
}

// Helper to get unit object by ID
function _getUnit(id) {
  return _battle.units[id] || null;
}

// Helper to check if a unit is alive
function _isUnitAlive(unit) {
  return unit && unit.hp > 0;
}

// Helper to build the turn queue
function _buildTurnQueue() {
  var livingUnits = [];
  for (var unitId in _battle.units) {
    if (_isUnitAlive(_battle.units[unitId])) {
      livingUnits.push(_battle.units[unitId]);
    }
  }

  livingUnits.sort(function(a, b) {
    if (a.initiative !== b.initiative) {
      return b.initiative - a.initiative; // Higher initiative first
    }
    // Tie-breaker: player units before enemy units
    if (a.team === 'player' && b.team === 'enemy') {
      return -1;
    }
    if (a.team === 'enemy' && b.team === 'player') {
      return 1;
    }
    return 0;
  });

  _battle.turnQueue = livingUnits.map(function(unit) { return unit.id; });
  _battle.turnIndex = 0;
}

// Helper to reset units for a new round
function _resetUnitsForRound() {
  for (var unitId in _battle.units) {
    var unit = _battle.units[unitId];
    unit.acted = false;
    // Apply per-round resource regen if spells module is loaded
    if (window.OathAndBoneSpells && window.OathAndBoneSpells.applyRegen) {
      window.OathAndBoneSpells.applyRegen(unit);
    }
    // Tick ability cooldowns + ability-system statuses
    if (window.OathAndBoneAbilities) {
      if (window.OathAndBoneAbilities.tickCooldowns) window.OathAndBoneAbilities.tickCooldowns(unit);
      if (window.OathAndBoneAbilities.tickStatuses) window.OathAndBoneAbilities.tickStatuses(unit);
    }
  }
  // Apply passives once per round after per-unit resets
  if (window.OathAndBoneAbilities && window.OathAndBoneAbilities.applyPassives) {
    window.OathAndBoneAbilities.applyPassives();
  }
}

// Tutorial trigger — only fires if scenario includes the tutorial, not already
// fired this session, and not already seen (localStorage 'ksp_oathandbone_tutorials_seen').
function _fireTutorialTrigger(triggerId) {
  if (!_battle.scenario || !_battle.scenario.tutorials ||
      _battle.scenario.tutorials.indexOf(triggerId) === -1) return;
  if (_battle.tutorials_fired[triggerId]) return;
  try {
    var seen = JSON.parse(localStorage.getItem('ksp_oathandbone_tutorials_seen') || '[]');
    if (seen.indexOf(triggerId) !== -1) return;
  } catch (e) {}
  _battle.tutorials_fired[triggerId] = true;
  if (window.OathAndBoneEngine && window.OathAndBoneEngine.onTutorialTrigger) {
    window.OathAndBoneEngine.onTutorialTrigger(triggerId);
  }
}

// Helper to check for battle end conditions
function _checkBattleEnd() {
  var playerUnits = [];
  var enemyUnits = [];
  for (var unitId in _battle.units) {
    var unit = _battle.units[unitId];
    if (_isUnitAlive(unit)) {
      if (unit.team === 'player') {
        playerUnits.push(unit);
      } else {
        enemyUnits.push(unit);
      }
    }
  }

  if (playerUnits.length === 0) {
    _battle.phase = 'defeat';
    if (window.OathAndBoneEngine.onBattleEnd) {
      window.OathAndBoneEngine.onBattleEnd('defeat');
    }
    if (typeof OathAndBone !== 'undefined') {
      OathAndBone.onBattleEnd('defeat');
      OathAndBone.observe('battles_played', 1);
      OathAndBone.observe('last_result', 'defeat');
    }
    return true;
  }

  if (enemyUnits.length === 0) {
    _battle.phase = 'victory';
    // SOUL REVIEW: battle victory must fire 3+ feedback channels
    // Channel 1 (visual): onBattleEnd hook → renderer shows result overlay
    // Channel 2 (audio): onBattleEnd hook → renderer plays victory sound
    // Channel 3 (numerical): OathAndBone.onBattleVictory fires XP grant
    if (window.OathAndBoneEngine.onBattleEnd) {
      window.OathAndBoneEngine.onBattleEnd('victory');
    }
    if (typeof OathAndBone !== 'undefined') {
      var _currentDifficultyTier = _battle.scenario ? _battle.scenario.difficultyTier : 1;
      var livingPlayerUnits = playerUnits;
      OathAndBone.onBattleVictory(_currentDifficultyTier, livingPlayerUnits.length);
      OathAndBone.onBattleEnd('victory');
      OathAndBone.observe('battles_played', 1);
      OathAndBone.observe('last_result', 'victory');
    }
    return true;
  }

  return false;
}


// Saves a full battle snapshot to localStorage via OathAndBoneCache.
// Called on every turn-tick (advanceTurn) and after each action that changes
// unit state (attack, ability, spell) so a tab-close mid-battle can be resumed.
// Delegates to OathAndBoneEngine.getBattleSnapshot() for the deep-copy logic.
function _snapshotBattle() {
  if (!window.OathAndBoneCache || !window.OathAndBoneCache.saveBattleSnapshot) return;
  if (_battle.phase !== 'active') return; // don't snapshot during placement or after end
  window.OathAndBoneCache.saveBattleSnapshot(window.OathAndBoneEngine.getBattleSnapshot());
}

// Syncs live hero HP into window.OathAndBone.currentState and pushes to cache.
// Called after attacks, spells, and abilities so the debounced server save
// carries current (not pre-battle) HP values.
function _pushStateToCache() {
  if (!window.OathAndBoneCache || !window.OathAndBone || !window.OathAndBone.currentState) return;
  var st = window.OathAndBone.currentState;
  if (!st.hero_state) st.hero_state = {};
  for (var id in _battle.units) {
    var unit = _battle.units[id];
    if (unit.team !== 'player') continue;
    var key = unit.heroId || id;
    st.hero_state[key] = {
      hp:  unit.hp,
      mp:  unit.magic ? unit.magic.mana : undefined
    };
  }
  window.OathAndBoneCache.setState(st);
}

window.OathAndBoneEngine = {

  start: function(container, options) {
    if (!_battle.scenario) {
      console.error("Scenario not loaded. Call OathAndBoneEngine.loadScenario() first.");
      return;
    }

    _battle.tiles = {};
    _battle.units = {};
    _battle.turnQueue = [];
    _battle.turnIndex = 0;
    _battle.round = 1;
    _battle.phase = 'placement';
    _battle.tutorials_fired = {};
    _battle.playerHoldUsed = false;

    // Build tile grid from scenario.map + scenario.hexTypes
    for (var q in _battle.scenario.map) {
      for (var r in _battle.scenario.map[q]) {
        var tileData = _battle.scenario.map[q][r];
        var hexCoord = { q: parseInt(q), r: parseInt(r) };
        var hexType = _battle.scenario.hexTypes[tileData.type];
        var tile = {
          q: hexCoord.q,
          r: hexCoord.r,
          terrain: hexType.terrain,
          elevation: hexType.elevation,
          unit: null,
          tile_mods: hexType.tile_mods || []
        };
        _battle.tiles[hexCoord.q + ',' + hexCoord.r] = tile;
      }
    }

    // Place units from scenario.playerStart + scenario.enemyStart
    var placeUnits = function(startPositions) {
      for (var i = 0; i < startPositions.length; i++) {
        var unitDef = startPositions[i];
        var tile = _getTile(unitDef.q, unitDef.r);
        if (tile) {
          var unit = {
            id: unitDef.id,
            heroId: unitDef.heroId,
            team: unitDef.team,
            q: unitDef.q,
            r: unitDef.r,
            hp: unitDef.hp_max,
            hp_max: unitDef.hp_max,
            move: unitDef.move,
            attack_range: unitDef.attack_range,
            attack_dmg: unitDef.attack_dmg,
            initiative: unitDef.initiative,
            defense: unitDef.defense || 0,
            acted: false,
            permadeath_loss: unitDef.permadeath_loss || false, // permadeath_loss: once true, never cleared
            permadeath_game_over: unitDef.permadeath_game_over || false,
            magic: unitDef.magic ? JSON.parse(JSON.stringify(unitDef.magic)) : null,
            status_effects: [],
            abilityCooldowns: {},
            passive_defense_bonus: 0
          };
          _battle.units[unit.id] = unit;
          tile.unit = unit.id;
        } else {
          console.warn("Attempted to place unit '" + unitDef.id + "' on non-existent tile: q=" + unitDef.q + ", r=" + unitDef.r);
        }
      }
    };

    if (_battle.scenario.playerStart) {
      placeUnits(_battle.scenario.playerStart);
    }
    if (_battle.scenario.enemyStart) {
      placeUnits(_battle.scenario.enemyStart);
    }

    // Build initial turn queue
    _buildTurnQueue();

    _battle.phase = 'active';

    // Apply passives on round 1 (per-round application otherwise runs from
    // _resetUnitsForRound, which only fires when the round advances).
    if (window.OathAndBoneAbilities && window.OathAndBoneAbilities.applyPassives) {
      window.OathAndBoneAbilities.applyPassives();
    }

    if (window.OathAndBoneEngine.onReady) {
      window.OathAndBoneEngine.onReady(container, options);
    }
  },

  // Load scenario data before start()
  loadScenario: function(scenario) {
    _battle.scenario = scenario;
  },

  // Query
  getBattle: function() {
    return _battle;
  },

  getTile: function(q, r) {
    return _getTile(q, r);
  },

  getUnit: function(id) {
    return _getUnit(id);
  },

  getCurrentUnit: function() {
    if (!_battle.turnQueue || _battle.turnQueue.length === 0) return null;
    return _getUnit(_battle.turnQueue[_battle.turnIndex]);
  },

  getMovableHexes: function(unitId) {
    var unit = _getUnit(unitId);
    if (!unit || !_isUnitAlive(unit)) return [];

    var reachableHexes = [];
    var visited = {};

    var queue = [{ hex: { q: unit.q, r: unit.r }, currentMoveCost: 0 }];
    visited[unit.q + ',' + unit.r] = 0;

    while (queue.length > 0) {
      var current = queue.shift();
      var currentHex = current.hex;
      var currentCost = current.currentMoveCost;

      if (currentCost <= unit.move) {
        if (currentHex.q !== unit.q || currentHex.r !== unit.r) {
          var alreadyAdded = false;
          for (var k = 0; k < reachableHexes.length; k++) {
            if (reachableHexes[k].q === currentHex.q && reachableHexes[k].r === currentHex.r) {
              alreadyAdded = true;
              break;
            }
          }
          if (!alreadyAdded) {
            reachableHexes.push({ q: currentHex.q, r: currentHex.r });
          }
        }
      }

      // Halv's Hold the Line: if currentHex is threatened by a living enemy
      // Halv, the unit must stop here. It was allowed to step into the tile,
      // but may not continue past it. (Only applies to units on the team
      // opposing Halv — allies of Halv ignore his own ZoC.)
      var currentThreatened = false;
      if (window.OathAndBoneAbilities && window.OathAndBoneAbilities.isThreatenedByHalv) {
        currentThreatened = window.OathAndBoneAbilities.isThreatenedByHalv(currentHex.q, currentHex.r, unit.team);
      }
      if (currentThreatened && (currentHex.q !== unit.q || currentHex.r !== unit.r)) {
        continue; // Don't expand neighbors from this hex — movement stops
      }

      var neighbors = hexNeighbors(currentHex);
      for (var i = 0; i < neighbors.length; i++) {
        var neighborHex = neighbors[i];
        var neighborTile = _getTile(neighborHex.q, neighborHex.r);

        if (!neighborTile) continue;
        if (neighborTile.unit && neighborTile.unit !== unitId) continue; // Occupied by another unit

        var currentTile = _getTile(currentHex.q, currentHex.r);
        if (!currentTile) continue;

        var stepCost = getMovementCost(currentTile, neighborTile);
        if (stepCost === Infinity) continue; // Cliff block

        var newMoveCost = currentCost + stepCost;

        if (newMoveCost <= unit.move) {
          var neighborKey = neighborHex.q + ',' + neighborHex.r;
          if (visited[neighborKey] === undefined || newMoveCost < visited[neighborKey]) {
            visited[neighborKey] = newMoveCost;
            queue.push({ hex: neighborHex, currentMoveCost: newMoveCost });
          }
        }
      }
    }

    return reachableHexes;
  },

  getAttackableHexes: function(unitId) {
    var attacker = _getUnit(unitId);
    if (!attacker || !_isUnitAlive(attacker)) return [];

    var attackerTile = _getTile(attacker.q, attacker.r);
    var uniqueAttackableHexes = [];
    var seen = {};

    // Extend range by 1 for ranged units firing downhill (apply per-target below)
    var baseRange = attacker.attack_range;
    var searchRange = attacker.attack_range >= 2 ? baseRange + 1 : baseRange;
    var potentialHexes = hexesInRange({q: attacker.q, r: attacker.r}, searchRange);

    for (var i = 0; i < potentialHexes.length; i++) {
      var hex = potentialHexes[i];
      var targetTile = _getTile(hex.q, hex.r);
      if (!targetTile || !targetTile.unit) continue;

      var targetUnit = _getUnit(targetTile.unit);
      if (!targetUnit || !_isUnitAlive(targetUnit) || targetUnit.team === attacker.team) continue;

      var distance = hexDistance({q: attacker.q, r: attacker.r}, hex);
      var effectiveRange = baseRange;
      if (attacker.attack_range >= 2) {
        effectiveRange += getRangedAttackRangeBonus(attackerTile, targetTile);
      }

      if (distance <= effectiveRange) {
        var key = hex.q + ',' + hex.r;
        if (!seen[key]) {
          uniqueAttackableHexes.push({ q: hex.q, r: hex.r });
          seen[key] = true;
        }
      }
    }

    return uniqueAttackableHexes;
  },

  // Actions
  moveUnit: function(unitId, toQ, toR) {
    var unit = _getUnit(unitId);
    if (!unit || !_isUnitAlive(unit)) {
      console.error("Cannot move dead or non-existent unit: " + unitId);
      return false;
    }
    if (_battle.phase !== 'active') {
      console.error("Cannot move unit during phase: " + _battle.phase);
      return false;
    }
    if (unit.acted) {
      console.error("Unit has already acted this turn: " + unitId);
      return false;
    }

    var startTile = _getTile(unit.q, unit.r);
    var targetTile = _getTile(toQ, toR);

    if (!targetTile) {
      console.error("Cannot move to invalid hex: q=" + toQ + ", r=" + toR);
      return false;
    }
    if (targetTile.unit && targetTile.unit !== unitId) {
      console.error("Target hex is occupied by another unit: " + targetTile.unit);
      return false;
    }

    var movableHexes = this.getMovableHexes(unitId);
    var isValidMove = false;
    for (var i = 0; i < movableHexes.length; i++) {
      if (movableHexes[i].q === toQ && movableHexes[i].r === toR) {
        isValidMove = true;
        break;
      }
    }

    if (!isValidMove) {
      console.error("Invalid move: Hex " + toQ + "," + toR + " is not reachable.");
      return false;
    }

    var fromQ = unit.q;
    var fromR = unit.r;

    unit.q = toQ;
    unit.r = toR;

    startTile.unit = null;
    targetTile.unit = unitId;

    if (window.OathAndBoneEngine.onUnitMoved) {
      window.OathAndBoneEngine.onUnitMoved(unit, fromQ, fromR, toQ, toR);
    }
    return true;
  },

  attackUnit: function(attackerId, targetId) {
    var attacker = _getUnit(attackerId);
    var target = _getUnit(targetId);

    if (!attacker || !_isUnitAlive(attacker)) {
      console.error("Attacker is dead or non-existent: " + attackerId);
      return false;
    }
    if (!target || !_isUnitAlive(target)) {
      console.error("Target is dead or non-existent: " + targetId);
      return false;
    }
    if (attacker.team === target.team) {
      console.error("Cannot attack own unit.");
      return false;
    }
    if (_battle.phase !== 'active') {
      console.error("Cannot attack during phase: " + _battle.phase);
      return false;
    }
    if (attacker.acted) {
      console.error("Attacker has already acted this turn: " + attackerId);
      return false;
    }

    var attackerTile = _getTile(attacker.q, attacker.r);
    var targetTile = _getTile(target.q, target.r);

    var attackableHexes = this.getAttackableHexes(attackerId);
    var isValidTarget = false;
    for (var i = 0; i < attackableHexes.length; i++) {
      if (attackableHexes[i].q === target.q && attackableHexes[i].r === target.r) {
        isValidTarget = true;
        break;
      }
    }

    if (!isValidTarget) {
      console.error("Invalid target: " + targetId + " is not in attack range.");
      return false;
    }

    var baseDamage = attacker.attack_dmg;
    var elevationModifier = getAttackDamageModifier(attackerTile, targetTile);
    // Called Shot: consume status to multiply outgoing damage
    var calledShotMult = 1.0;
    if (window.OathAndBoneAbilities && window.OathAndBoneAbilities.consumeCalledShot) {
      calledShotMult = window.OathAndBoneAbilities.consumeCalledShot(attacker);
    }
    var rawDamage = Math.floor(baseDamage * elevationModifier * calledShotMult);
    // Passive defense (Vanguard's Oath aura) + unit base defense
    var defenseValue = (target.defense || 0) + (target.passive_defense_bonus || 0);
    var finalDamage = Math.max(1, rawDamage - defenseValue);

    target.hp -= finalDamage;
    if (target.hp < 0) target.hp = 0;
    target.took_damage_this_turn = true;

    attacker.acted = true;

    // Tutorial T1: first player attack — troop triangle explanation
    if (attacker.team === 'player') {
      _fireTutorialTrigger('T1');
    }
    // Tutorial T2: first ranged attack from elevation ≥2 firing downward — elevation bonus explanation
    if (attacker.attack_range >= 2 && attackerTile && targetTile &&
        attackerTile.elevation >= 2 && targetTile.elevation < attackerTile.elevation) {
      _fireTutorialTrigger('T2');
    }

    // permadeath_loss: once set to true, never cleared — not on save/load, not on scenario restart
    if (target.hp === 0 && target.team === 'player') {
      target.permadeath_loss = true; // Permanent flag, never cleared
    }

    if (window.OathAndBoneEngine.onUnitAttacked) {
      window.OathAndBoneEngine.onUnitAttacked(attacker, target, finalDamage);
    }

    _checkBattleEnd();

    // Persist live hero HP to cache so a mid-battle close doesn't leave
    // the world state with stale HP values.
    _pushStateToCache();
    _snapshotBattle();

    return true;
  },

  // Delegates to OathAndBoneAbilities.resolveAbility, then marks the caster
  // as acted and runs the battle-end check. Returns true on success.
  resolveAbility: function(casterId, abilityId, targetQ, targetR) {
    var caster = _getUnit(casterId);
    if (!caster || !_isUnitAlive(caster)) return false;
    if (_battle.phase !== 'active') return false;
    if (caster.acted) return false;
    if (!window.OathAndBoneAbilities || !window.OathAndBoneAbilities.resolveAbility) return false;

    var result = window.OathAndBoneAbilities.resolveAbility(casterId, abilityId, targetQ, targetR);
    if (!result || !result.success) return false;

    caster.acted = true;

    // Mark any player unit that reached 0 HP as permadeath_loss
    for (var id in _battle.units) {
      var u = _battle.units[id];
      if (u.hp === 0 && u.team === 'player' && !u.permadeath_loss) {
        u.permadeath_loss = true;
      }
    }

    _checkBattleEnd();
    _pushStateToCache();
    _snapshotBattle();
    return true;
  },

  // Delegates to OathAndBoneSpells.castSpell, then marks the caster as acted
  // and runs the battle-end check. Returns true on success, false otherwise.
  castSpell: function(casterId, spellId, targetQ, targetR) {
    var caster = _getUnit(casterId);
    if (!caster || !_isUnitAlive(caster)) return false;
    if (_battle.phase !== 'active') return false;
    if (caster.acted) return false;
    if (!window.OathAndBoneSpells || !window.OathAndBoneSpells.castSpell) return false;

    var result = window.OathAndBoneSpells.castSpell(casterId, spellId, targetQ, targetR);
    if (!result || !result.success) return false;

    caster.acted = true;

    // Mark any player unit that reached 0 HP as permadeath_loss
    for (var id in _battle.units) {
      var u = _battle.units[id];
      if (u.hp === 0 && u.team === 'player' && !u.permadeath_loss) {
        u.permadeath_loss = true;
      }
    }

    _checkBattleEnd();
    _pushStateToCache();
    _snapshotBattle();
    return true;
  },

  advanceTurn: function() {
    if (_battle.phase !== 'active') {
      console.warn("Cannot advance turn: Battle is not active. Phase: " + _battle.phase);
      return;
    }

    var currentUnit = this.getCurrentUnit();
    if (currentUnit && !currentUnit.acted) {
      currentUnit.acted = true;
      // Track player Hold usage for T3 tutorial (rounds 1–2 only)
      if (currentUnit.team === 'player' && _battle.round <= 2) {
        _battle.playerHoldUsed = true;
      }
    }

    _battle.turnIndex++;

    if (_battle.turnIndex >= _battle.turnQueue.length) {
      _battle.round++;
      _resetUnitsForRound();
      _buildTurnQueue();

      // Tutorial T3: entering round 3 with no player Hold used in rounds 1-2
      if (_battle.round === 3 && !_battle.playerHoldUsed) {
        _fireTutorialTrigger('T3');
      }

      if (window.OathAndBoneEngine.onRoundStart) {
        window.OathAndBoneEngine.onRoundStart(_battle.round);
      }

      if (_checkBattleEnd()) {
        return;
      }
    }

    if (_checkBattleEnd()) {
      return;
    }

    // Skip dead units (safeguard if a unit died mid-queue)
    while (_battle.turnIndex < _battle.turnQueue.length) {
      var nextUnit = _getUnit(_battle.turnQueue[_battle.turnIndex]);
      if (nextUnit && _isUnitAlive(nextUnit)) {
        break;
      }
      _battle.turnIndex++;
    }

    if (_battle.turnIndex >= _battle.turnQueue.length) {
      _checkBattleEnd();
    }

    // Snapshot after every turn advance (the "turn-tick" for mid-battle resume).
    _snapshotBattle();
  },

  // ── Mid-battle resume API (Concern 3) ──────────────────────────────────

  // Returns a serialisable snapshot of the current in-flight battle state.
  // Snapshot version: 1 (bump if _battle shape changes; cache discards on mismatch).
  // Called by _snapshotBattle() — exposed on the engine object so callers outside
  // the engine module can request a snapshot if needed.
  getBattleSnapshot: function() {
    var tilesCopy = {};
    for (var tk in _battle.tiles) {
      var t = _battle.tiles[tk];
      tilesCopy[tk] = {
        q: t.q, r: t.r,
        terrain: t.terrain, elevation: t.elevation,
        tile_mods: t.tile_mods ? t.tile_mods.slice() : [],
        unit: t.unit
      };
    }
    var unitsCopy = {};
    for (var uk in _battle.units) {
      var u = _battle.units[uk];
      unitsCopy[uk] = {
        id: u.id, heroId: u.heroId, team: u.team,
        q: u.q, r: u.r,
        hp: u.hp, hp_max: u.hp_max,
        move: u.move, attack_range: u.attack_range,
        attack_dmg: u.attack_dmg, initiative: u.initiative,
        defense: u.defense || 0,
        acted: u.acted,
        permadeath_loss: u.permadeath_loss || false,
        permadeath_game_over: u.permadeath_game_over || false,
        magic: u.magic ? JSON.parse(JSON.stringify(u.magic)) : null,
        status_effects: u.status_effects ? JSON.parse(JSON.stringify(u.status_effects)) : [],
        abilityCooldowns: u.abilityCooldowns ? JSON.parse(JSON.stringify(u.abilityCooldowns)) : {},
        passive_defense_bonus: u.passive_defense_bonus || 0,
        took_damage_this_turn: u.took_damage_this_turn || false
      };
    }
    return {
      tiles:           tilesCopy,
      units:           unitsCopy,
      turnQueue:       _battle.turnQueue.slice(),
      turnIndex:       _battle.turnIndex,
      round:           _battle.round,
      phase:           _battle.phase,
      scenarioId:      _battle.scenario ? (_battle.scenario.id || 'b1') : 'b1',
      tutorials_fired: JSON.parse(JSON.stringify(_battle.tutorials_fired || {})),
      playerHoldUsed:  _battle.playerHoldUsed || false
    };
  },

  // Restores _battle from a snapshot and fires onReady so the renderer
  // redraws the correct state. Called by the orchestrator when the player
  // accepts the "Resume battle?" prompt.
  resumeBattle: function(container, snapshot) {
    if (!snapshot) return;

    // Reload the scenario object from the static lookup (avoids storing
    // large scenario JSON in localStorage — only the id is in the snapshot).
    var scenarioId = snapshot.scenarioId || 'b1';
    var scenario   = (window.OathAndBoneScenarios && window.OathAndBoneScenarios[scenarioId]) || null;

    _battle.tiles          = snapshot.tiles          || {};
    _battle.units          = snapshot.units          || {};
    _battle.turnQueue      = snapshot.turnQueue      || [];
    _battle.turnIndex      = typeof snapshot.turnIndex === 'number' ? snapshot.turnIndex : 0;
    _battle.round          = typeof snapshot.round   === 'number'   ? snapshot.round    : 1;
    _battle.phase          = snapshot.phase          || 'active';
    _battle.scenario       = scenario;
    _battle.tutorials_fired = snapshot.tutorials_fired || {};
    _battle.playerHoldUsed  = snapshot.playerHoldUsed  || false;

    if (window.OathAndBoneEngine.onReady) {
      window.OathAndBoneEngine.onReady(container, { resumed: true });
    }
  },

  // Hooks — renderer attaches these
  onReady: null,           // function(container, options)
  onUnitMoved: null,       // function(unit, fromQ, fromR, toQ, toR)
  onUnitAttacked: null,    // function(attacker, target, damage)
  onRoundStart: null,      // function(round)
  onBattleEnd: null,       // function(result) — 'victory' or 'defeat'
  onTutorialTrigger: null  // function(triggerId) — 'T1'|'T2'|'T3' etc.
};

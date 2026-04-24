var DISCLAIMER = 'Unofficial. Not affiliated with Century Games.';

window.OathAndBoneSpells = (function() {

  // Internal spell definitions
  var _SPELLS = {
    // Wizardry
    'firebolt': { cost: { mp: 5 }, range: 4, aoe: 0, targeting: 'enemy', effect: { damage: 14, type: 'fire' }, school: 'wizardry' },
    'fireball': { cost: { mp: 12 }, range: 4, aoe: 3, targeting: 'hex', effect: { damage: 18, type: 'fire' }, school: 'wizardry' },
    'incinerate': { cost: { mp: 25 }, range: 3, aoe: 0, targeting: 'enemy', effect: { damage: 35, type: 'fire', status: { id: 'burn', value: 6, turns: 2 } }, school: 'wizardry' },
    'frost_shard': { cost: { mp: 5 }, range: 4, aoe: 0, targeting: 'enemy', effect: { damage: 12, type: 'ice', status: { id: 'weakness', value: -1, turns: 1 } }, school: 'wizardry' },
    'blizzard': { cost: { mp: 14 }, range: 5, aoe: 4, targeting: 'hex', effect: { damage: 14, type: 'ice', miss_chance: 25, area: 'all' }, school: 'wizardry' },
    'permafrost': { cost: { mp: 22 }, range: 4, aoe: 0, targeting: 'enemy', effect: { damage: 20, type: 'ice', status: { id: 'frozen', turns: 1 } }, school: 'wizardry' },
    'spark': { cost: { mp: 4 }, range: 3, aoe: 0, targeting: 'enemy', effect: { damage: 10, type: 'lightning' }, school: 'wizardry' },
    'chain_lightning': { cost: { mp: 13 }, range: 4, aoe: 0, targeting: 'enemy', effect: { damage: 12, chain_damage: { 2: 8, 3: 4 } }, school: 'wizardry' },
    'storm': { cost: { mp: 28 }, range: 6, aoe: 5, targeting: 'hex', effect: { damage: 16, type: 'lightning', stun_chance: 50, area: 'all' }, school: 'wizardry' },
    'force_push': { cost: { mp: 6 }, range: 2, aoe: 0, targeting: 'enemy', effect: { damage: 8, push_hexes: 2 }, school: 'wizardry' },
    'teleki_nesis': { cost: { mp: 10 }, range: 4, aoe: 0, targeting: 'unit', effect: { damage: 0, move_target: 3 }, school: 'wizardry' },
    'gravity_well': { cost: { mp: 20 }, range: 5, aoe: 3, targeting: 'hex', effect: { pull_enemies: true, status: { id: 'weakness', value: -2, turns: 2 }, area: 'all' }, school: 'wizardry' },
    'shield': { cost: { mp: 6 }, range: 0, aoe: 0, targeting: 'self', effect: { status: { id: 'bone_shield', value: 6, turns: 2 } }, school: 'wizardry' },
    'mana_siphon': { cost: { mp: 3 }, range: 2, aoe: 0, targeting: 'enemy_caster', effect: { steal: { mp: 8 } }, school: 'wizardry' },
    'teleport': { cost: { mp: 15 }, range: 6, aoe: 0, targeting: 'self', effect: { teleport_self: true }, school: 'wizardry' },

    // Necromancy
    'raise_skeleton': { cost: { souls: 10 }, range: 2, aoe: 0, targeting: 'hex', effect: { summon: { heroId: 'skeleton', hp: 35, atk: 10, def: 4, move: 3, turns: 3 } }, school: 'necromancy' },
    'raise_archer_wraith': { cost: { souls: 15 }, range: 2, aoe: 0, targeting: 'hex', effect: { summon: { heroId: 'archer_wraith', hp: 25, atk: 12, range: 3, move: 4, turns: 3 } }, school: 'necromancy' },
    'raise_lich_servant': { cost: { souls: 25 }, range: 2, aoe: 0, targeting: 'hex', effect: { summon: { heroId: 'lich_servant', hp: 40, casts: 'curse_of_weakness', move: 3, turns: 4 } }, school: 'necromancy' },
    'curse_of_weakness': { cost: { souls: 8 }, range: 4, aoe: 0, targeting: 'enemy', effect: { status: { id: 'weakness', value: -0.30, turns: 3, modifier: 'attack' } }, school: 'necromancy' }, // value is % modifier
    'curse_of_binding': { cost: { souls: 12 }, range: 4, aoe: 0, targeting: 'enemy', effect: { status: { id: 'binding', value: { move: -2, skills: false }, turns: 2 } }, school: 'necromancy' },
    'curse_of_death': { cost: { souls: 22 }, range: 3, aoe: 0, targeting: 'enemy', effect: { dot: { damage: 8, turns: 4, ignores_armor: true } }, school: 'necromancy' },
    'life_drain': { cost: { souls: 10 }, range: 3, aoe: 0, targeting: 'enemy', effect: { damage: 14, heal_caster: 10 }, school: 'necromancy' },
    'soul_siphon': { cost: { souls: 18 }, range: 4, aoe: 0, targeting: 'enemy', effect: { damage: 18, gain_souls: 5 }, school: 'necromancy' },
    'bone_shield': { cost: { souls: 5 }, range: 0, aoe: 0, targeting: 'self', effect: { status: { id: 'bone_shield', value: 8, turns: 2 } }, school: 'necromancy' },
    'shroud': { cost: { souls: 10 }, range: 0, aoe: 0, targeting: 'self', effect: { status: { id: 'shroud', value: -0.25, turns: 2, modifier: 'hit_chance' } }, school: 'necromancy' },
    'unhallow': { cost: { souls: 12 }, range: 4, aoe: 3, targeting: 'hex', effect: { status: { id: 'unhallow', value: -0.30, turns: 3, modifier: 'heal_received' }, area: 'all' }, school: 'necromancy' },
    'corpse_explosion': { cost: { souls: 8 }, range: 3, aoe: 0, targeting: 'hex', effect: { detonate: { damage: 20, aoe: 1 } }, school: 'necromancy' },

    // Druidry
    'heal': { cost: { verdance: 4 }, range: 4, aoe: 0, targeting: 'ally', effect: { heal: 18 }, school: 'druidry' },
    'group_heal': { cost: { verdance: 12 }, range: 3, aoe: 3, targeting: 'hex', effect: { heal: 12, area: 'all' }, school: 'druidry' },
    'resurrection': { cost: { verdance: 30 }, range: 2, aoe: 0, targeting: 'dead_ally', effect: { revive: { hp_percent: 0.4, uses_per_battle: 1 } }, school: 'druidry' },
    'regrowth': { cost: { verdance: 6 }, range: 4, aoe: 0, targeting: 'ally', effect: { status: { id: 'regrowth', value: 6, turns: 3 } }, school: 'druidry' },
    'thorn_grove': { cost: { verdance: 10 }, range: 4, aoe: 3, targeting: 'hex', effect: { terrain: { type: 'thorn_grove', dmg_entering: 8, move_cost_crossing: -1, turns: 4 } }, school: 'druidry' },
    'living_terrain': { cost: { verdance: 22 }, range: 5, aoe: 5, targeting: 'hex', effect: { terrain: { convert_to: 'forest', count: 5, permanent: true } }, school: 'druidry' },
    'summon_wolf': { cost: { verdance: 8 }, range: 2, aoe: 0, targeting: 'hex', effect: { summon: { heroId: 'wolf', hp: 40, atk: 12, move: 5, turns: 4, bleed_on_hit: true } }, school: 'druidry' },
    'summon_bear': { cost: { verdance: 15 }, range: 2, aoe: 0, targeting: 'hex', effect: { summon: { heroId: 'bear', hp: 80, atk: 16, move: 3, turns: 3, cleave: true } }, school: 'druidry' },
    'pack_call': { cost: { verdance: 25 }, range: 3, aoe: 0, targeting: 'hex', effect: { summon: [{ heroId: 'wolf', count: 2 }, { heroId: 'raven', reveals: 5 }] }, school: 'druidry' },
    'gale': { cost: { verdance: 7 }, range: 5, aoe: 0, targeting: 'hex', effect: { push_nearest_enemies: 3, hexes: 2, status: { id: 'weakness', value: -2, turns: 1 } }, school: 'druidry' },
    'root': { cost: { verdance: 5 }, range: 3, aoe: 0, targeting: 'enemy', effect: { status: { id: 'rooted', turns: 2 } }, school: 'druidry' },
    'earthquake': { cost: { verdance: 28 }, range: 0, aoe: 3, targeting: 'self', effect: { damage: 14, area: 'all', status: { id: 'weakness', value: -1, turns: 1 } }, school: 'druidry' },
    'cleanse': { cost: { verdance: 4 }, range: 3, aoe: 0, targeting: 'ally', effect: { remove_status: 1 }, school: 'druidry' },
    'barkskin': { cost: { verdance: 8 }, range: 3, aoe: 0, targeting: 'ally', effect: { status: { id: 'barkskin', value: 5, turns: 3 } }, school: 'druidry' },
    'natures_grace': { cost: { verdance: 18 }, range: 4, aoe: 4, targeting: 'hex', effect: { status: { id: 'nature_grace', value: 0.10, turns: 2, modifier: 'crit_chance' }, area: 'all' }, school: 'druidry' }
  };

  // Internal state
  var _battle = null; // Populated by engine via window.OathAndBoneEngine.getBattle()
  var _active_summons_to_clean_up = []; // list of unit ids to remove

  // Helper to get battle state
  function getBattle() {
    if (!_battle) {
      _battle = window.OathAndBoneEngine.getBattle();
    }
    return _battle;
  }

  // Helper to check if a unit is a caster of a specific school
  function isCasterOfSchool(unit, school) {
    return unit && unit.magic && unit.magic.school === school;
  }

  // Helper to deduct resources
  function deductResource(unit, spell) {
    var cost = spell.cost;
    if (cost.mp !== undefined) {
      if (unit.magic.mana < cost.mp) return false;
      unit.magic.mana -= cost.mp;
    }
    if (cost.souls !== undefined) {
      if (unit.magic.souls < cost.souls) return false;
      unit.magic.souls -= cost.souls;
    }
    if (cost.verdance !== undefined) {
      if (unit.magic.verdance < cost.verdance) return false;
      unit.magic.verdance -= cost.verdance;
    }
    return true;
  }

  // Helper to apply a status effect
  function applyStatusEffect(targetUnit, statusDef, caster) {
    if (!targetUnit) return;

    var existingStatus = null;
    for (var i = 0; i < targetUnit.status_effects.length; i++) {
      if (targetUnit.status_effects[i].id === statusDef.id) {
        existingStatus = targetUnit.status_effects[i];
        break;
      }
    }

    var status = {
      id: statusDef.id,
      turns_remaining: statusDef.turns || 1,
      value: statusDef.value !== undefined ? statusDef.value : 1
    };

    if (statusDef.modifier) {
      // Apply modifier logic if needed, e.g., for percentages
      if (statusDef.modifier === 'attack' || statusDef.modifier === 'defense' || statusDef.modifier === 'move' || statusDef.modifier === 'heal_received' || statusDef.modifier === 'hit_chance' || statusDef.modifier === 'crit_chance') {
        // This value might be a multiplier or a flat change.
        // For percentage effects, it's often applied multiplicatively to stats.
        // For simplicity here, we'll store it and let the engine/combat
        // logic interpret and apply it.
      }
    }

    if (existingStatus) {
      // If status exists, update its duration and value, or stack if logic allows
      // For this MVP, we'll assume lasting effect overwrites or extends.
      existingStatus.turns_remaining = Math.max(existingStatus.turns_remaining, status.turns_remaining);
      existingStatus.value = status.value; // Or some merge logic
    } else {
      targetUnit.status_effects.push(status);
      if (window.OathAndBoneSpells.onStatusApplied) {
        window.OathAndBoneSpells.onStatusApplied(targetUnit, status);
      }
    }
  }

  // Helper to create and manage summons
  function createSummon(caster, summonDef, targetQ, targetR) {
    var battle = getBattle();
    var summonId = 'summon_' + summonDef.heroId + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    var summonUnit = {
      id: summonId,
      heroId: summonDef.heroId,
      team: caster.team,
      q: targetQ,
      r: targetR,
      hp: summonDef.hp,
      hp_max: summonDef.hp,
      move: summonDef.move || 3,
      attack_range: summonDef.range || 1,
      attack_dmg: summonDef.atk || 0,
      initiative: 5,
      acted: false,
      permadeath_loss: false,
      magic: null,
      is_summon: true,
      summon_owner: caster.id,
      summon_turns_remaining: summonDef.turns,
      status_effects: [],
      casting_ability: summonDef.casts ? summonDef.casts : null, // Forlich_servant etc.
      special_effects: summonDef.bleed_on_hit ? { bleed_on_hit: true } : {},
      special_effects_2: summonDef.cleave ? { cleave: true } : {}
    };

    if (summonDef.reveals) {
        summonUnit.special_effects_2 = summonUnit.special_effects_2 || {};
        summonUnit.special_effects_2.reveal_radius = summonDef.reveals;
    }

    // Ensure summoned unit has status_effects array
    if (!summonUnit.status_effects) {
      summonUnit.status_effects = [];
    }

    battle.units[summonUnit.id] = summonUnit;
    if (caster.magic && caster.magic.active_summons) {
      caster.magic.active_summons.push(summonUnit.id);
    }

    if (window.OathAndBoneSpells.onSummonCreated) {
      window.OathAndBoneSpells.onSummonCreated(summonUnit, caster);
    }

    // Place summon on the tile
    var targetTile = window.OathAndBoneEngine.getTile(targetQ, targetR);
    if (targetTile) {
      targetTile.unit = summonUnit.id;
    }
    return summonUnit;
  }

  // Helper to get spell target hexes, considering elevation
  function getSpellTargetHexesWithElevation(caster, spellId) {
    var spellDef = _SPELLS[spellId];
    if (!spellDef) return [];

    var casterUnit = window.OathAndBoneEngine.getUnit(caster.id);
    if (!casterUnit) return [];

    var centerQ = casterUnit.q;
    var centerR = casterUnit.r;
    var effectiveRange = spellDef.range;

    // Ranged spells get +1 range from high ground
    if (spellDef.targeting !== 'self' && spellDef.range >= 2 && casterUnit.elevation > 0) {
      effectiveRange += 1;
    }

    var potentialHexes = window.hexesInRange({ q: centerQ, r: centerR }, effectiveRange);
    var validTargets = [];

    for (var i = 0; i < potentialHexes.length; i++) {
      var hex = potentialHexes[i];
      var tile = window.OathAndBoneEngine.getTile(hex.q, hex.r);
      if (!tile) continue;

      // Elevation check for range
      if (casterUnit.elevation !== undefined && tile.elevation !== undefined) {
        var elevationDiff = tile.elevation - casterUnit.elevation;
        if (elevationDiff > 0 && spellDef.range >= 2) { // Cannot target higher if range is less than 2 or if it's a specific spell
          // Allow targeting if within normal range, but might be harder to hit etc.
          // For now, we assume range check handles LOS. Elevation primarily impacts range bonus.
        } else if (elevationDiff < 0) {
            // Casting downhill is generally fine if within range.
        }
      }
      // If the spell is AoE, we need to consider the center point for targeting range
      // but then potentially include hexes outside initial range if they fall within AoE.
      // For MVP, we'll simplify: if the center hex is in range, and AoE is within that, it's considered.
      // The core hexesInRange handles the initial proximity.

      validTargets.push(hex);
    }
    return validTargets;
  }


  return {
    applyRegen: function(unit) {
      var battle = getBattle();
      if (!unit) return;

      // Clear damage taken flag
      if (unit.took_damage_this_turn !== undefined) {
        unit.took_damage_this_turn = false;
      }

      if (!unit.magic) {
        // Handle summon unit timers and cleanup
        if (unit.is_summon && unit.summon_turns_remaining !== undefined) {
          unit.summon_turns_remaining--;
          if (unit.summon_turns_remaining <= 0) {
            // Mark for removal
            if (_active_summons_to_clean_up.indexOf(unit.id) === -1) {
              _active_summons_to_clean_up.push(unit.id);
            }
          }
        }
        return; // Not a caster
      }

      // Handle active summons for caster units
      if (unit.is_summon && unit.summon_turns_remaining !== undefined) {
        unit.summon_turns_remaining--;
        if (unit.summon_turns_remaining <= 0) {
          if (_active_summons_to_clean_up.indexOf(unit.id) === -1) {
            _active_summons_to_clean_up.push(unit.id);
          }
        }
      }

      // Resource Regeneration
      switch (unit.magic.school) {
        case 'wizardry':
          // Combat penalty: NO regen on the turn the wizard took damage
          if (unit.took_damage_this_turn) {
            // No mana regen this turn
          } else {
            var regenAmount = unit.magic.mana_regen || 3;
            var tile = window.OathAndBoneEngine.getTile(unit.q, unit.r);
            if (tile && (tile.terrain === 'sanctum' || tile.terrain === 'ruin')) {
              regenAmount += 3; // Safe zone bonus
            }
            unit.magic.mana = Math.min(unit.magic.mana_max, unit.magic.mana + regenAmount);
            if (window.OathAndBoneSpells.onResourceChanged) {
              window.OathAndBoneSpells.onResourceChanged(unit, 'mana', unit.magic.mana - regenAmount, unit.magic.mana);
            }
          }
          break;

        case 'necromancy':
          // Souls only gained via kills, no passive regen.
          // Summon timers are handled above.
          break;

        case 'druidry':
          var regenAmount = 2; // Baseline
          var tile = window.OathAndBoneEngine.getTile(unit.q, unit.r);
          var adjacentTiles = []; // Get adjacent tiles from engine (or assume neighbors for now)
          // Simplified adjacency check for MVP: check tiles at distance 1
          var neighbors = window.hexesInRange({ q: unit.q, r: unit.r }, 1);
          var terrainBonuses = 0;
          for (var i = 0; i < neighbors.length; i++) {
            var neighborTile = window.OathAndBoneEngine.getTile(neighbors[i].q, neighbors[i].r);
            if (neighborTile && (neighborTile.terrain === 'forest' || neighborTile.terrain === 'river' || neighborTile.terrain === 'plain')) {
              terrainBonuses++;
            }
          }
          if (terrainBonuses >= 2) {
            regenAmount = 5; // Terrain bonus
          }
          var oldVerdance = unit.magic.verdance;
          unit.magic.verdance = Math.min(unit.magic.verdance_max, unit.magic.verdance + regenAmount);
          if (window.OathAndBoneSpells.onResourceChanged) {
            window.OathAndBoneSpells.onResourceChanged(unit, 'verdance', oldVerdance, unit.magic.verdance);
          }
          break;
      }
    },

    castSpell: function(casterId, spellId, targetQ, targetR) {
      var battle = getBattle();
      var caster = window.OathAndBoneEngine.getUnit(casterId);
      if (!caster) return { success: false, reason: 'caster_not_found' };

      var spellDef = _SPELLS[spellId];
      if (!spellDef) return { success: false, reason: 'spell_not_found' };

      if (!caster.magic || caster.magic.school !== spellDef.school) {
        return { success: false, reason: 'caster_wrong_school' };
      }

      if (caster.magic.spells_equipped.indexOf(spellId) === -1) {
        return { success: false, reason: 'spell_not_equipped' };
      }

      // Resource Check
      var cost = spellDef.cost;
      var canAfford = true;
      var resourceType = null;

      if (cost.mp !== undefined) {
        if (caster.magic.mana < cost.mp) canAfford = false;
        resourceType = 'mana';
      } else if (cost.souls !== undefined) {
        if (caster.magic.souls < cost.souls) canAfford = false;
        resourceType = 'souls';
      } else if (cost.verdance !== undefined) {
        if (caster.magic.verdance < cost.verdance) canAfford = false;
        resourceType = 'verdance';
      }

      if (!canAfford) {
        return { success: false, reason: 'insufficient_resource' };
      }

      // Deduct resource
      var oldResourceValue = 0;
      if (resourceType === 'mana') {
        oldResourceValue = caster.magic.mana;
        caster.magic.mana -= cost.mp;
      } else if (resourceType === 'souls') {
        oldResourceValue = caster.magic.souls;
        caster.magic.souls -= cost.souls;
      } else if (resourceType === 'verdance') {
        oldResourceValue = caster.magic.verdance;
        caster.magic.verdance -= cost.verdance;
      }
      if (window.OathAndBoneSpells.onResourceChanged && resourceType) {
        window.OathAndBoneSpells.onResourceChanged(caster, resourceType, oldResourceValue, caster.magic[resourceType]);
      }

      // Spell Resolution
      var spellEffects = [];
      var spellTargetTile = window.OathAndBoneEngine.getTile(targetQ, targetR);
      var spellTargetUnit = spellTargetTile ? spellTargetTile.unit : null;

      // Determine targets based on targeting and AoE
      var targets = [];
      var targetHexes = []; // For AoE spells
      var spellRange = spellDef.range || 0;

      // Check range and targeting
      var casterTile = window.OathAndBoneEngine.getTile(caster.q, caster.r);
      var actualRange = spellRange;
      if (caster.elevation !== undefined && casterTile.elevation !== undefined && casterTile.elevation > 0 && spellRange >= 2) {
          actualRange += 1;
      }

      if (spellDef.targeting === 'self') {
        if (hexDistance({q: caster.q, r: caster.r}, {q: targetQ, r: targetR}) > 0) {
             return { success: false, reason: 'invalid_target_self' };
        }
        targets.push(caster);
        targetHexes.push({q: targetQ, r: targetR});
      } else if (spellDef.targeting === 'unit' || spellDef.targeting === 'enemy' || spellDef.targeting === 'ally' || spellDef.targeting === 'dead_ally' || spellDef.targeting === 'enemy_caster') {
          var dist = hexDistance({q: caster.q, r: caster.r}, {q: targetQ, r: targetR});
          if (dist > actualRange) {
              return { success: false, reason: 'target_out_of_range' };
          }
          if (spellDef.targeting === 'enemy' && spellTargetUnit && spellTargetUnit.team === caster.team) {
              return { success: false, reason: 'target_not_enemy' };
          }
          if (spellDef.targeting === 'ally' && spellTargetUnit && spellTargetUnit.team !== caster.team) {
              return { success: false, reason: 'target_not_ally' };
          }
          if (spellDef.targeting === 'dead_ally' && spellTargetUnit && spellTargetUnit.hp > 0) {
              return { success: false, reason: 'target_not_dead' };
          }
          if (spellDef.targeting === 'enemy_caster' && (!spellTargetUnit || !spellTargetUnit.magic)) {
              return { success: false, reason: 'target_not_caster' };
          }
          if (spellTargetUnit) {
            targets.push(spellTargetUnit);
          }
          targetHexes.push({q: targetQ, r: targetR});
      } else if (spellDef.targeting === 'hex') {
          var dist = hexDistance({q: caster.q, r: caster.r}, {q: targetQ, r: targetR});
          if (dist > actualRange && spellDef.range !== 0) { // Range 0 spells can target adjacent tiles if needed
              return { success: false, reason: 'target_out_of_range' };
          }
          targetHexes = window.hexesInRange({ q: targetQ, r: targetR }, spellDef.aoe || 0);
          for (var i = 0; i < targetHexes.length; i++) {
            var hex = targetHexes[i];
            var tile = window.OathAndBoneEngine.getTile(hex.q, hex.r);
            if (tile && tile.unit) {
              if (spellDef.school === 'wizardry' || spellDef.school === 'druidry') { // Assume wizard/druid AoE affects enemies primarily unless specified
                  if (tile.unit.team !== caster.team) {
                      targets.push(tile.unit);
                  }
              } else if (spellDef.school === 'necromancy') { // Assume necromancy AoE affects enemies primarily
                   if (tile.unit.team !== caster.team) {
                      targets.push(tile.unit);
                  }
              }
              // Specific spell logic might override general enemy/ally targeting within AoE
              if (spellId === 'earthquake' && tile.unit) { // Earthquake affects all in AoE
                 targets.push(tile.unit);
              }
            }
          }
      }

      // Deduct alliance bonus for druid heal
      if (spellDef.effect.heal && spellDef.school === 'druidry') {
        // This is handled below in the heal effect application
      }

      // Apply spell effects
      var effectDetails = []; // For onSpellCast hook

      // Effect: Damage
      if (spellDef.effect.damage !== undefined) {
        for (var i = 0; i < targets.length; i++) {
          var targetUnit = targets[i];
          if (!targetUnit || targetUnit.team === caster.team) continue; // Don't damage self/allies unless explicitly targeted

          var damage = spellDef.effect.damage;
          var effectiveDamage = damage;
          var damageType = spellDef.effect.type || 'physical';
          var finalDamage = Math.max(0, effectiveDamage - (targetUnit.magic ? targetUnit.magic.defense : targetUnit.defense || 0)); // Simple defense reduction

          // Apply status effects if any
          if (spellDef.effect.status) {
            applyStatusEffect(targetUnit, spellDef.effect.status, caster);
          }

          // Track damage taken for wizardry penalty
          targetUnit.took_damage_this_turn = true;

          var oldHp = targetUnit.hp;
          targetUnit.hp -= finalDamage;
          if (targetUnit.hp < 0) targetUnit.hp = 0;

          effectDetails.push({ type: 'damage', target: targetUnit.id, amount: finalDamage, hp_remaining: targetUnit.hp, old_hp: oldHp, damage_type: damageType });

          // Handle chain lightning
          if (spellId === 'chain_lightning') {
            var hitUnits = [targetUnit];
            var currentDamage = damage;
            var currentChain = 1;
            while (currentChain < 3) {
              var nearestEnemy = null;
              var minDistance = Infinity;
              var potentialTargets = [];
              for (var _uid in battle.units) {
                var _u = battle.units[_uid];
                if (_u.team !== caster.team && _u.hp > 0 && hitUnits.indexOf(_u) === -1) {
                  potentialTargets.push(_u);
                }
              }

              for (var j = 0; j < potentialTargets.length; j++) {
                var dist = hexDistance({q: targetUnit.q, r: targetUnit.r}, {q: potentialTargets[j].q, r: potentialTargets[j].r});
                if (dist < minDistance) {
                  minDistance = dist;
                  nearestEnemy = potentialTargets[j];
                }
              }

              if (nearestEnemy) {
                var chainDamage = spellDef.effect.chain_damage[currentChain + 1] || 0; // +1 because keys are 2 and 3
                var effectiveChainDamage = chainDamage;
                var finalChainDamage = Math.max(0, effectiveChainDamage - (nearestEnemy.magic ? nearestEnemy.magic.defense : nearestEnemy.defense || 0));

                var oldHpChain = nearestEnemy.hp;
                nearestEnemy.hp -= finalChainDamage;
                if (nearestEnemy.hp < 0) nearestEnemy.hp = 0;
                nearestEnemy.took_damage_this_turn = true;

                effectDetails.push({ type: 'chain_damage', target: nearestEnemy.id, amount: finalChainDamage, hp_remaining: nearestEnemy.hp, old_hp: oldHpChain, chain_level: currentChain + 1 });
                hitUnits.push(nearestEnemy);
                currentChain++;
              } else {
                break; // No more enemies to chain to
              }
            }
          }

          // Handle Soul Siphon gain
          if (spellDef.effect.gain_souls !== undefined) {
            var soulsGained = spellDef.effect.gain_souls;
            var necros = [];
            for (var _nuid in battle.units) {
              var _nu = battle.units[_nuid];
              if (_nu.magic && _nu.magic.school === 'necromancy' && _nu.team === caster.team) {
                necros.push(_nu);
              }
            }
            for (var k = 0; k < necros.length; k++) {
              var oldSouls = necros[k].magic.souls;
              necros[k].magic.souls = Math.min(necros[k].magic.souls_max, necros[k].magic.souls + soulsGained);
              if (window.OathAndBoneSpells.onResourceChanged) {
                window.OathAndBoneSpells.onResourceChanged(necros[k], 'souls', oldSouls, necros[k].magic.souls);
              }
            }
          }
        }
      }

      // Effect: Heal
      if (spellDef.effect.heal !== undefined) {
        for (var i = 0; i < targets.length; i++) {
          var targetUnit = targets[i];
          if (!targetUnit || targetUnit.team !== caster.team) continue; // Only heal allies

          var healAmount = spellDef.effect.heal;
          var oldHp = targetUnit.hp;
          targetUnit.hp = Math.min(targetUnit.hp_max, targetUnit.hp + healAmount);
          effectDetails.push({ type: 'heal', target: targetUnit.id, amount: healAmount, hp_remaining: targetUnit.hp, old_hp: oldHp });

          // Druidry heal bonus
          if (spellDef.school === 'druidry') {
            var oldVerdance = targetUnit.magic.verdance;
            targetUnit.magic.verdance = Math.min(targetUnit.magic.verdance_max, targetUnit.magic.verdance + 3);
            if (window.OathAndBoneSpells.onResourceChanged) {
              window.OathAndBoneSpells.onResourceChanged(targetUnit, 'verdance', oldVerdance, targetUnit.magic.verdance);
            }
          }
        }
      }

      // Effect: Status
      if (spellDef.effect.status !== undefined) {
        for (var i = 0; i < targets.length; i++) {
          var targetUnit = targets[i];
          if (!targetUnit) continue; // Handle cases where target might be null from AoE targeting

          // Special targeting for status effects
          if (spellDef.targeting === 'enemy' && targetUnit.team === caster.team) continue;
          if (spellDef.targeting === 'ally' && targetUnit.team !== caster.team) continue;
          if (spellDef.targeting === 'enemy_caster' && (!targetUnit.magic)) continue;

          applyStatusEffect(targetUnit, spellDef.effect.status, caster);
          effectDetails.push({ type: 'status_applied', target: targetUnit.id, status_id: spellDef.effect.status.id, turns: spellDef.effect.status.turns });
        }
      }

      // Effect: Summon
      if (spellDef.effect.summon !== undefined) {
        if (Array.isArray(spellDef.effect.summon)) { // For pack_call
            for (var i = 0; i < spellDef.effect.summon.length; i++) {
                var summonGroup = spellDef.effect.summon[i];
                var summonHeroId = summonGroup.heroId;
                var summonCount = summonGroup.count || 1;
                var summonDef = getSummonDef(summonHeroId); // Need a helper to get summon definitions
                if (summonDef) {
                    for (var j = 0; j < summonCount; j++) {
                        createSummon(caster, summonDef, targetQ, targetR); // Summons placed at target hex
                    }
                }
            }
        } else {
            var summonDef = getSummonDef(spellDef.effect.summon.heroId);
            if (summonDef) {
                createSummon(caster, summonDef, targetQ, targetR);
            }
        }
      }

      // Effect: Terrain modification
      if (spellDef.effect.terrain !== undefined) {
        var terrainEffect = spellDef.effect.terrain;
        var terrainTargets = [];
        if (spellDef.aoe !== undefined) { // AoE terrain effects
            terrainTargets = window.hexesInRange({ q: targetQ, r: targetR }, spellDef.aoe);
        } else { // Single hex terrain effect
            terrainTargets.push({q: targetQ, r: targetR});
        }

        for (var i = 0; i < terrainTargets.length; i++) {
            var hex = terrainTargets[i];
            var tile = window.OathAndBoneEngine.getTile(hex.q, hex.r);
            if (tile) {
                if (terrainEffect.permanent) {
                    tile.terrain = terrainEffect.convert_to || terrainEffect.type;
                    // Need to handle permanent terrain changes carefully; might need battle state reset for multi-map scenarios
                } else {
                    if (!tile.tile_mods) tile.tile_mods = [];
                    tile.tile_mods.push({
                        id: spellDef.id + '_' + Date.now(), // Unique ID for the mod
                        type: terrainEffect.type || terrainEffect.convert_to,
                        turns_remaining: terrainEffect.turns,
                        dmg_entering: terrainEffect.dmg_entering,
                        move_cost_crossing: terrainEffect.move_cost_crossing
                    });
                }
                effectDetails.push({type: 'terrain_mod', hex: hex, mod: terrainEffect});
            }
        }
      }

      // Effect: Push/Pull/Teleport
      if (spellDef.effect.push_hexes !== undefined || spellDef.effect.pull_enemies !== undefined || spellDef.effect.teleport_self !== undefined) {
          if (spellDef.effect.teleport_self) {
              caster.q = targetQ;
              caster.r = targetR;
              var targetTile = window.OathAndBoneEngine.getTile(targetQ, targetR);
              if (targetTile) targetTile.unit = caster; // Update tile occupation
              effectDetails.push({type: 'teleport', unit: caster.id, target_q: targetQ, target_r: targetR});
          } else if (spellDef.effect.push_hexes !== undefined) {
              var targetUnit = targets[0]; // Assume single target for push
              if (targetUnit) {
                  var pushDirection = { q: targetUnit.q - caster.q, r: targetUnit.r - caster.r };
                  var newQ = targetUnit.q + pushDirection.q * spellDef.effect.push_hexes;
                  var newR = targetUnit.r + pushDirection.r * spellDef.effect.push_hexes;
                  // collision detection for push needs to be more robust, for now simple move
                  var pushedTile = window.OathAndBoneEngine.getTile(newQ, newR);
                  if (pushedTile && !pushedTile.unit) { // Check for empty target tile
                      var oldQ = targetUnit.q;
                      var oldR = targetUnit.r;
                      targetUnit.q = newQ;
                      targetUnit.r = newR;
                      if (window.OathAndBoneEngine.getTile(oldQ, oldR)) window.OathAndBoneEngine.getTile(oldQ, oldR).unit = null; // Clear old tile
                      if (pushedTile) pushedTile.unit = targetUnit; // Occupy new tile
                      effectDetails.push({type: 'push', unit: targetUnit.id, from_q: oldQ, from_r: oldR, to_q: newQ, to_r: newR, hexes: spellDef.effect.push_hexes});
                  }
              }
          } else if (spellDef.effect.pull_enemies !== undefined) {
              // Pulling enemies towards center of spell AoE
              for (var i = 0; i < targets.length; i++) {
                  var targetUnit = targets[i];
                  if (!targetUnit || targetUnit.team === caster.team) continue;

                  var directionToCenter = { q: targetQ - targetUnit.q, r: targetR - targetUnit.r };
                  // Normalize direction
                  if (directionToCenter.q !== 0 || directionToCenter.r !== 0) {
                      var distance = hexDistance({q: targetUnit.q, r: targetUnit.r}, {q: targetQ, r: targetR});
                      var pullDistance = Math.min(distance, spellDef.effect.pull_enemies > 0 ? spellDef.effect.pull_enemies : 1); // Pull 1 hex by default if not specified

                      var newQ = targetUnit.q + Math.round(directionToCenter.q / distance * pullDistance);
                      var newR = targetUnit.r + Math.round(directionToCenter.r / distance * pullDistance);

                      var pulledTile = window.OathAndBoneEngine.getTile(newQ, newR);
                      if (pulledTile && !pulledTile.unit) { // Check for empty target tile
                          var oldQ = targetUnit.q;
                          var oldR = targetUnit.r;
                          targetUnit.q = newQ;
                          targetUnit.r = newR;
                          if (window.OathAndBoneEngine.getTile(oldQ, oldR)) window.OathAndBoneEngine.getTile(oldQ, oldR).unit = null;
                          if (pulledTile) pulledTile.unit = targetUnit;
                           effectDetails.push({type: 'pull', unit: targetUnit.id, from_q: oldQ, from_r: oldR, to_q: newQ, to_r: newR, distance: pullDistance});
                      }
                  }
              }
          }
      }

      // Effect: Revive
      if (spellDef.effect.revive !== undefined) {
          var targetUnit = targets[0]; // Assume single target for revive
          if (targetUnit && targetUnit.hp <= 0) {
              var reviveHp = Math.floor(targetUnit.hp_max * spellDef.effect.revive.hp_percent);
              targetUnit.hp = reviveHp;
              // Handle uses per battle if applicable
              targetUnit.revive_uses_left = (targetUnit.revive_uses_left === undefined) ? spellDef.effect.revive.uses_per_battle : targetUnit.revive_uses_left - 1;
              effectDetails.push({type: 'revive', unit: targetUnit.id, hp_restored: reviveHp});
          }
      }

      // Effect: Remove status
      if (spellDef.effect.remove_status !== undefined) {
          var numToRemove = spellDef.effect.remove_status;
          var removedCount = 0;
          var debuffsToRemove = ['burn', 'frozen', 'rooted', 'weakness', 'binding', 'curse_of_death', 'unhallow']; // Example debuffs
          for (var i = targetUnit.status_effects.length - 1; i >= 0; i--) {
              if (removedCount >= numToRemove) break;
              var status = targetUnit.status_effects[i];
              if (debuffsToRemove.indexOf(status.id) !== -1) {
                  targetUnit.status_effects.splice(i, 1);
                  removedCount++;
                  effectDetails.push({type: 'status_removed', target: targetUnit.id, status_id: status.id});
              }
          }
      }

      // Effect: Detonate
      if (spellDef.effect.detonate !== undefined) {
          var detonateTargets = [];
          if (spellDef.aoe !== undefined) {
              detonateTargets = window.hexesInRange({ q: targetQ, r: targetR }, spellDef.aoe);
          } else {
              detonateTargets.push({q: targetQ, r: targetR});
          }
          for (var i = 0; i < detonateTargets.length; i++) {
              var hex = detonateTargets[i];
              var tile = window.OathAndBoneEngine.getTile(hex.q, hex.r);
              if (tile && tile.unit && (tile.unit.is_summon || tile.unit.is_corpse)) { // Detonate corpses or summons
                  var damage = spellDef.effect.detonate.damage;
                  var effectiveDamage = damage;
                  var finalDamage = Math.max(0, effectiveDamage - (tile.unit.magic ? tile.unit.magic.defense : tile.unit.defense || 0));

                  tile.unit.hp -= finalDamage;
                  if (tile.unit.hp < 0) tile.unit.hp = 0;
                  effectDetails.push({type: 'detonation_damage', target: tile.unit.id, amount: finalDamage});

                  // Remove unit if it's a summon and dies from explosion
                  if (tile.unit.is_summon && tile.unit.hp <= 0) {
                      if (_active_summons_to_clean_up.indexOf(tile.unit.id) === -1) {
                          _active_summons_to_clean_up.push(tile.unit.id);
                      }
                  }
              }
          }
      }


      // Fire the onSpellCast hook - Channel 1 (visual). Renderer should add audio (Channel 2), and damage/resource numbers are Channel 3.
      if (window.OathAndBoneSpells.onSpellCast) {
        window.OathAndBoneSpells.onSpellCast(caster, spellDef, targetQ, targetR, effectDetails);
      }

      return { success: true };
    },

    onUnitKilled: function(killedUnit, killerUnit) {
      var battle = getBattle();
      if (!killedUnit) return;

      // Handle soul gain for necromancers
      if (killedUnit.team !== 'neutral') { // Don't grant souls for killing neutral/environment
        var necromancers = [];
        var _nekTeam = killerUnit ? killerUnit.team : null;
        for (var _nkid in battle.units) {
          var _nku = battle.units[_nkid];
          if (_nku.magic && _nku.magic.school === 'necromancy' &&
              (_nekTeam ? _nku.team === _nekTeam : true)) {
            necromancers.push(_nku);
          }
        }

        for (var i = 0; i < necromancers.length; i++) {
          var nec = necromancers[i];
          var soulsGained = 0;
          var isBoss = killedUnit.is_boss === true;
          var killedByNecromancer = killerUnit && killerUnit.id === nec.id;

          if (isBoss) {
            soulsGained = 10; // Boss kill
          } else {
            soulsGained = 5; // Regular enemy kill
            if (killedByNecromancer) {
              soulsGained += 2; // Extra for personal kill
            }
          }

          if (soulsGained > 0) {
            var oldSouls = nec.magic.souls;
            nec.magic.souls = Math.min(nec.magic.souls_max, nec.magic.souls + soulsGained);
            if (window.OathAndBoneSpells.onResourceChanged) {
              window.OathAndBoneSpells.onResourceChanged(nec, 'souls', oldSouls, nec.magic.souls);
            }
          }
        }
      }
    },

    tickStatusEffects: function(unit) {
      var battle = getBattle();
      if (!unit || !unit.status_effects) return [];

      var expiredEffects = [];
      for (var i = unit.status_effects.length - 1; i >= 0; i--) {
        var status = unit.status_effects[i];
        status.turns_remaining--;

        // Tick special effects for specific status IDs
        if (status.id === 'burn') {
            // Apply burn damage
            var burnDamage = status.value || 1; // Default burn damage
            unit.took_damage_this_turn = true; // Mark as having taken damage
            var oldHp = unit.hp;
            unit.hp -= burnDamage;
            if (unit.hp < 0) unit.hp = 0;
            expiredEffects.push({type: 'status_damage', unit: unit.id, status_id: 'burn', amount: burnDamage, hp_remaining: unit.hp, old_hp: oldHp});
        } else if (status.id === 'regrowth') {
            // Apply regrowth heal
            var regenAmount = status.value || 1;
            var oldHp = unit.hp;
            unit.hp = Math.min(unit.hp_max, unit.hp + regenAmount);
             expiredEffects.push({type: 'status_heal', unit: unit.id, status_id: 'regrowth', amount: regenAmount, hp_remaining: unit.hp, old_hp: oldHp});
        } else if (status.id === 'thorn_grove') {
            // Thorn Grove is a tile effect, this would be handled differently by the engine
            // For now, we assume it's applied to the tile.
        }

        if (status.turns_remaining <= 0) {
          expiredEffects.push({type: 'status_expired', unit: unit.id, status_id: status.id});
          unit.status_effects.splice(i, 1);
        }
      }
      return expiredEffects;
    },

    getSpellDef: function(spellId) {
      return _SPELLS[spellId] || null;
    },

    getSpellTargetHexes: function(casterId, spellId) {
      var battle = getBattle();
      var caster = window.OathAndBoneEngine.getUnit(casterId);
      if (!caster) return [];

      var spellDef = _SPELLS[spellId];
      if (!spellDef) return [];

      if (!caster.magic || caster.magic.school !== spellDef.school || caster.magic.spells_equipped.indexOf(spellId) === -1) {
        return [];
      }

      var casterQ = caster.q;
      var casterR = caster.r;

      // Handle self-targeting spells directly
      if (spellDef.targeting === 'self') {
        return [{ q: casterQ, r: casterR }];
      }

      // For other spells, use the enhanced hexesInRange that considers elevation
      var potentialHexes = getSpellTargetHexesWithElevation(caster, spellId);
      var validHexes = [];

      for (var i = 0; i < potentialHexes.length; i++) {
        var hex = potentialHexes[i];
        var tile = window.OathAndBoneEngine.getTile(hex.q, hex.r);

        if (!tile) continue;

        var distance = hexDistance({q: casterQ, r: casterR}, {q: hex.q, r: hex.r});

        // Basic range check
        if (distance > (spellDef.range || 0) && spellDef.range !== 0 && !spellDef.effect.teleport_self) { // Allow range 0 for some abilities
            // Check for elevation range bonus specifically
            var casterTile = window.OathAndBoneEngine.getTile(caster.q, caster.r);
            var effectiveRange = spellDef.range;
            if (caster.elevation !== undefined && casterTile && casterTile.elevation !== undefined && casterTile.elevation > 0 && spellDef.range >= 2) {
                effectiveRange += 1;
            }
            if (distance > effectiveRange) {
                 continue;
            }
        }
        if (distance > (spellDef.range || 0) && spellDef.effect.teleport_self && distance > spellDef.range) { // Teleport has its own range
            continue;
        }


        // Targeting validation
        if (spellDef.targeting === 'enemy' && tile.unit && tile.unit.team === caster.team) continue;
        if (spellDef.targeting === 'ally' && tile.unit && tile.unit.team !== caster.team) continue;
        if (spellDef.targeting === 'dead_ally' && tile.unit && tile.unit.hp > 0) continue;
        if (spellDef.targeting === 'enemy_caster' && (!tile.unit || !tile.unit.magic)) continue;


        validHexes.push(hex);
      }

      return validHexes;
    },

    // Hooks for renderer/other modules
    onSpellCast: null,
    onSummonCreated: null,
    onStatusApplied: null,
    onResourceChanged: null
  };
})();

// Internal helper to get summon definitions (not directly exposed in API)
function getSummonDef(heroId) {
  // This would ideally be a more comprehensive lookup, possibly from an external source.
  // For MVP, we'll hardcode based on spell definitions.
  var summonDefs = {
    'skeleton': { hp: 35, atk: 10, def: 4, move: 3, turns: 3 },
    'archer_wraith': { hp: 25, atk: 12, range: 3, move: 4, turns: 3 },
    'lich_servant': { hp: 40, casts: 'curse_of_weakness', move: 3, turns: 4 },
    'wolf': { hp: 40, atk: 12, move: 5, turns: 4, bleed_on_hit: true },
    'bear': { hp: 80, atk: 16, move: 3, turns: 3, cleave: true }
  };
  return summonDefs[heroId];
}

// Internal helper to manage summon cleanup (called by engine after applyRegen)
function cleanupSummons() {
  var battle = window.OathAndBoneSpells.getBattle(); // Access via API if needed
  if (!battle) return;

  for (var i = 0; i < window.OathAndBoneSpells._active_summons_to_clean_up.length; i++) {
    var summonId = window.OathAndBoneSpells._active_summons_to_clean_up[i];
    var summonUnit = battle.units[summonId];

    if (summonUnit) {
      summonUnit.hp = 0; // Mark as dead
      // Remove from owner's active summons list
      var owner = window.OathAndBoneEngine.getUnit(summonUnit.summon_owner);
      if (owner && owner.magic && owner.magic.active_summons) {
        var index = owner.magic.active_summons.indexOf(summonId);
        if (index > -1) {
          owner.magic.active_summons.splice(index, 1);
        }
      }
      // Remove from battle units
      delete battle.units[summonId];
      // Remove from tile
      var tile = window.OathAndBoneEngine.getTile(summonUnit.q, summonUnit.r);
      if (tile && tile.unit && tile.unit === summonId) {
        tile.unit = null;
      }
    }
  }
  window.OathAndBoneSpells._active_summons_to_clean_up = []; // Clear the list
}

// --- Engine Integration Points ---
// The engine would call these. For self-contained script, we mock them for now.
// In a real scenario, these would be called by the engine.

// Example of how the engine might call applyRegen
// function _resetUnitsForRound() {
//   var battle = window.OathAndBoneEngine.getBattle();
//   if (!battle) return;
//   battle.units.forEach(function(unit) {
//     if (window.OathAndBoneSpells && window.OathAndBoneSpells.applyRegen) {
//       window.OathAndBoneSpells.applyRegen(unit);
//     }
//   });
//   cleanupSummons(); // Call cleanup after all regen is processed
// }

// Example of how the engine might call onUnitKilled
// function _handleUnitDeath(killedUnit, killerUnit) {
//   if (window.OathAndBoneSpells && window.OathAndBoneSpells.onUnitKilled) {
//     window.OathAndBoneSpells.onUnitKilled(killedUnit, killerUnit);
//   }
//   // ... other death logic
// }

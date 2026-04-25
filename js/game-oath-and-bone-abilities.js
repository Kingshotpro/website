var DISCLAIMER = 'Unofficial. Not affiliated with Century Games.';

// Hero signature abilities — parallel to the spell system.
// Abilities are cooldown-gated (not resource-gated) and school-independent.
// Magic-school signatures (Caelen/Marrow/Thessa) live in spells.js — those
// kinds are handled by the CAST pipeline, not resolveAbility.

window.OathAndBoneAbilities = (function () {

  var _ABILITIES = {
    'vanguards_oath': {
      id: 'vanguards_oath', kind: 'passive', heroId: 'vael',
      effect: 'adjacent_allies_def_bonus', value: 4,
      vfx_color: '#f0c040'
    },
    'braced_charge': {
      id: 'braced_charge', kind: 'active', heroId: 'vael',
      cooldown: 2, range: 3, target_type: 'enemy',
      effect: 'charge_attack', damage: 18,
      vfx_color: '#f0c040'
    },
    'hold_the_line': {
      id: 'hold_the_line', kind: 'passive', heroId: 'halv',
      effect: 'zone_of_control',
      vfx_color: '#c0a060'
    },
    'cleaving_stroke': {
      id: 'cleaving_stroke', kind: 'active', heroId: 'halv',
      cooldown: 3, range: 1, target_type: 'enemy',
      effect: 'cleave', cleave_falloff: 0.75,
      vfx_color: '#e05c5c'
    },
    'loose_and_fade': {
      id: 'loose_and_fade', kind: 'active', heroId: 'brin',
      cooldown: 2, range: 3, target_type: 'enemy',
      effect: 'attack_then_reposition', reposition: 2,
      vfx_color: '#a0d080'
    },
    'called_shot': {
      id: 'called_shot', kind: 'active', heroId: 'brin',
      cooldown: 3, range: 0, target_type: 'self',
      effect: 'next_attack_crit', damage_mult: 1.6,
      vfx_color: '#f0c040'
    }
  };

  function _dist(a, b) {
    return Math.max(Math.abs(a.q - b.q), Math.abs(a.r - b.r), Math.abs((-a.q - a.r) - (-b.q - b.r)));
  }

  function _neighbors(hex) {
    var DIR = [{q:1,r:0},{q:1,r:-1},{q:0,r:-1},{q:-1,r:0},{q:-1,r:1},{q:0,r:1}];
    return DIR.map(function (d) { return { q: hex.q + d.q, r: hex.r + d.r }; });
  }

  function _getStatus(unit, statusId) {
    if (!unit.status_effects) return null;
    for (var i = 0; i < unit.status_effects.length; i++) {
      if (unit.status_effects[i].id === statusId) return unit.status_effects[i];
    }
    return null;
  }

  function _addStatus(unit, status) {
    if (!unit.status_effects) unit.status_effects = [];
    var existing = _getStatus(unit, status.id);
    if (existing) {
      existing.turns_remaining = Math.max(existing.turns_remaining, status.turns_remaining);
      existing.value = status.value;
    } else {
      unit.status_effects.push(status);
    }
  }

  function _removeStatus(unit, statusId) {
    if (!unit.status_effects) return;
    for (var i = unit.status_effects.length - 1; i >= 0; i--) {
      if (unit.status_effects[i].id === statusId) unit.status_effects.splice(i, 1);
    }
  }

  return {

    // Query
    getAbilityDef: function (abilityId) {
      return _ABILITIES[abilityId] || null;
    },

    getHeroSignatures: function (unit) {
      if (!unit || !unit.heroId) return [];
      var heroDef = (window.OathAndBoneHeroes && window.OathAndBoneHeroes.getDefinition)
        ? window.OathAndBoneHeroes.getDefinition(unit.heroId) : null;
      return (heroDef && heroDef.signatures) ? heroDef.signatures : [];
    },

    getAbilityCooldown: function (unit, abilityId) {
      if (!unit.abilityCooldowns) return 0;
      return unit.abilityCooldowns[abilityId] || 0;
    },

    // Valid target hexes for an active ability
    getAbilityTargetHexes: function (casterId, abilityId) {
      var caster = window.OathAndBoneEngine.getUnit(casterId);
      if (!caster) return [];
      var def = _ABILITIES[abilityId];
      if (!def || def.kind !== 'active') return [];

      if (def.target_type === 'self') return [{ q: caster.q, r: caster.r }];

      var battle = window.OathAndBoneEngine.getBattle();
      var hexes = [];
      // Iterate all units — gather hostile targets within range
      for (var id in battle.units) {
        var u = battle.units[id];
        if (u.hp <= 0) continue;
        if (def.target_type === 'enemy' && u.team === caster.team) continue;
        var d = _dist({ q: caster.q, r: caster.r }, { q: u.q, r: u.r });
        if (d <= def.range) hexes.push({ q: u.q, r: u.r });
      }
      return hexes;
    },

    // Resolve an ability. Returns { success, reason?, effects? }.
    // Engine.resolveAbility delegates here, then marks the unit acted
    // and runs battle-end checks (parallel to castSpell).
    resolveAbility: function (casterId, abilityId, targetQ, targetR) {
      var caster = window.OathAndBoneEngine.getUnit(casterId);
      if (!caster) return { success: false, reason: 'caster_not_found' };
      if (caster.hp <= 0) return { success: false, reason: 'caster_dead' };

      var def = _ABILITIES[abilityId];
      if (!def) return { success: false, reason: 'ability_not_found' };
      if (def.kind !== 'active') return { success: false, reason: 'ability_not_active' };

      // Hero-signature gate: only the defining hero can use the ability
      if (def.heroId && caster.heroId !== def.heroId) {
        return { success: false, reason: 'ability_not_for_hero' };
      }

      // Cooldown check
      var cd = this.getAbilityCooldown(caster, abilityId);
      if (cd > 0) return { success: false, reason: 'on_cooldown', cd: cd };

      // Range check (self = always valid)
      if (def.target_type !== 'self') {
        var d = _dist({ q: caster.q, r: caster.r }, { q: targetQ, r: targetR });
        if (d > def.range) return { success: false, reason: 'out_of_range' };
      }

      var effects = [];

      // ── EFFECT DISPATCH ────────────────────────────────────────────────
      if (def.effect === 'charge_attack') {
        // Braced Charge: move caster to target hex, strike target enemy for 18
        var targetTile = window.OathAndBoneEngine.getTile(targetQ, targetR);
        if (!targetTile || !targetTile.unit) return { success: false, reason: 'no_target' };
        var target = window.OathAndBoneEngine.getUnit(targetTile.unit);
        if (!target || target.team === caster.team) return { success: false, reason: 'no_target' };

        // Step caster to an empty hex adjacent to target (one hex short of target)
        var dirQ = Math.sign(target.q - caster.q);
        var dirR = Math.sign(target.r - caster.r);
        var stopQ = target.q - dirQ;
        var stopR = target.r - dirR;
        var stopTile = window.OathAndBoneEngine.getTile(stopQ, stopR);
        if (stopTile && !stopTile.unit && (stopQ !== caster.q || stopR !== caster.r)) {
          var oldTile = window.OathAndBoneEngine.getTile(caster.q, caster.r);
          if (oldTile) oldTile.unit = null;
          caster.q = stopQ; caster.r = stopR;
          stopTile.unit = caster.id;
          effects.push({ type: 'move', unit: caster.id, to_q: stopQ, to_r: stopR });
        }

        var dmg = def.damage;
        var oldHp = target.hp;
        target.hp = Math.max(0, target.hp - dmg);
        target.took_damage_this_turn = true;
        effects.push({ type: 'damage', target: target.id, amount: dmg, old_hp: oldHp, hp_remaining: target.hp });

      } else if (def.effect === 'cleave') {
        // Cleaving Stroke: hit primary, then the hex one step beyond (same direction)
        var targetTile = window.OathAndBoneEngine.getTile(targetQ, targetR);
        if (!targetTile || !targetTile.unit) return { success: false, reason: 'no_target' };
        var target = window.OathAndBoneEngine.getUnit(targetTile.unit);
        if (!target || target.team === caster.team) return { success: false, reason: 'no_target' };

        var atk = caster.attack_dmg || 10;
        var prim = atk;
        var oldHp = target.hp;
        target.hp = Math.max(0, target.hp - prim);
        target.took_damage_this_turn = true;
        effects.push({ type: 'damage', target: target.id, amount: prim, old_hp: oldHp, hp_remaining: target.hp });

        // Direction from caster → target, extend one further
        var dq = targetQ - caster.q, dr = targetR - caster.r;
        // Normalize to unit step
        var mag = Math.max(Math.abs(dq), Math.abs(dr)) || 1;
        var behindQ = targetQ + Math.sign(dq);
        var behindR = targetR + Math.sign(dr);
        if (dq === 0) behindQ = targetQ;
        if (dr === 0) behindR = targetR;
        var behindTile = window.OathAndBoneEngine.getTile(behindQ, behindR);
        if (behindTile && behindTile.unit) {
          var behind = window.OathAndBoneEngine.getUnit(behindTile.unit);
          if (behind && behind.team !== caster.team && behind.hp > 0) {
            var splash = Math.floor(atk * (def.cleave_falloff || 0.75));
            var oldHp2 = behind.hp;
            behind.hp = Math.max(0, behind.hp - splash);
            behind.took_damage_this_turn = true;
            effects.push({ type: 'damage', target: behind.id, amount: splash, old_hp: oldHp2, hp_remaining: behind.hp });
          }
        }

      } else if (def.effect === 'attack_then_reposition') {
        // Loose and Fade: attack target with base attack_dmg, then step caster up to `reposition` hexes
        var targetTile = window.OathAndBoneEngine.getTile(targetQ, targetR);
        if (!targetTile || !targetTile.unit) return { success: false, reason: 'no_target' };
        var target = window.OathAndBoneEngine.getUnit(targetTile.unit);
        if (!target || target.team === caster.team) return { success: false, reason: 'no_target' };

        var dmg = caster.attack_dmg || 10;
        var oldHp = target.hp;
        target.hp = Math.max(0, target.hp - dmg);
        target.took_damage_this_turn = true;
        effects.push({ type: 'damage', target: target.id, amount: dmg, old_hp: oldHp, hp_remaining: target.hp });

        // Step caster up to 2 hexes AWAY from target, picking first empty valid hex
        var awayQ = Math.sign(caster.q - target.q);
        var awayR = Math.sign(caster.r - target.r);
        if (awayQ === 0 && awayR === 0) awayR = 1; // fallback
        for (var step = def.reposition; step >= 1; step--) {
          var newQ = caster.q + awayQ * step;
          var newR = caster.r + awayR * step;
          var t = window.OathAndBoneEngine.getTile(newQ, newR);
          if (t && !t.unit) {
            var oldTile = window.OathAndBoneEngine.getTile(caster.q, caster.r);
            if (oldTile) oldTile.unit = null;
            caster.q = newQ; caster.r = newR;
            t.unit = caster.id;
            effects.push({ type: 'move', unit: caster.id, to_q: newQ, to_r: newR });
            break;
          }
        }

      } else if (def.effect === 'next_attack_crit') {
        // Called Shot: add self-status; consumed on next attack. Caster's
        // turn ends (mirrors HEROES.md: "skip 1 turn").
        _addStatus(caster, {
          id: 'called_shot', turns_remaining: 2,
          value: def.damage_mult || 1.6
        });
        effects.push({ type: 'status_applied', target: caster.id, status_id: 'called_shot' });
      }

      // Set cooldown: CD 2 means "next use available 2 rounds later"
      if (!caster.abilityCooldowns) caster.abilityCooldowns = {};
      caster.abilityCooldowns[abilityId] = def.cooldown || 1;

      // Fire hook (renderer attaches for VFX + damage floats)
      if (window.OathAndBoneAbilities.onAbilityResolved) {
        window.OathAndBoneAbilities.onAbilityResolved(caster, def, targetQ, targetR, effects);
      }

      return { success: true, effects: effects };
    },

    // Called once per round from engine._resetUnitsForRound.
    // Clears the stale passive aura and re-applies fresh from living heroes.
    applyPassives: function () {
      var battle = window.OathAndBoneEngine.getBattle();
      if (!battle) return;

      // Clear previous passive bonuses on every unit
      for (var uid in battle.units) {
        battle.units[uid].passive_defense_bonus = 0;
      }

      // Vael alive → +4 Def to adjacent allies
      for (var id in battle.units) {
        var u = battle.units[id];
        if (u.hp <= 0) continue;
        if (u.heroId === 'vael') {
          var adj = _neighbors({ q: u.q, r: u.r });
          for (var i = 0; i < adj.length; i++) {
            var t = window.OathAndBoneEngine.getTile(adj[i].q, adj[i].r);
            if (t && t.unit) {
              var ally = window.OathAndBoneEngine.getUnit(t.unit);
              if (ally && ally.team === u.team && ally.id !== u.id) {
                ally.passive_defense_bonus = 4;
              }
            }
          }
        }
      }
      // Halv's Hold the Line is applied in getMovableHexes — no per-round state needed.
    },

    // Ticks all ability cooldowns for this unit by -1 (floor 0).
    // Called per-unit in engine._resetUnitsForRound.
    tickCooldowns: function (unit) {
      if (!unit || !unit.abilityCooldowns) return;
      for (var abId in unit.abilityCooldowns) {
        if (unit.abilityCooldowns[abId] > 0) unit.abilityCooldowns[abId] -= 1;
      }
    },

    // Ticks unit's status_effects (local — engine doesn't run spells.js ticker).
    // Decrements turns_remaining, removes expired. Does NOT apply tick damage here
    // (spells.js.tickStatusEffects owns damage ticks; we're only keeping ability
    // statuses like called_shot alive long enough to fire).
    tickStatuses: function (unit) {
      if (!unit || !unit.status_effects) return;
      for (var i = unit.status_effects.length - 1; i >= 0; i--) {
        var s = unit.status_effects[i];
        if (s.turns_remaining > 0) s.turns_remaining -= 1;
        if (s.turns_remaining <= 0) unit.status_effects.splice(i, 1);
      }
    },

    // Consume called_shot status on attack — returns damage multiplier, removes status.
    consumeCalledShot: function (attacker) {
      var s = _getStatus(attacker, 'called_shot');
      if (!s) return 1.0;
      var mult = s.value || 1.6;
      _removeStatus(attacker, 'called_shot');
      return mult;
    },

    // Zone-of-control check: is this hex threatened by a living enemy Halv?
    // Used by engine.getMovableHexes to honor Hold the Line.
    isThreatenedByHalv: function (q, r, unitTeam) {
      var battle = window.OathAndBoneEngine.getBattle();
      if (!battle) return false;
      for (var id in battle.units) {
        var u = battle.units[id];
        if (u.hp <= 0) continue;
        if (u.heroId !== 'halv') continue;
        if (u.team === unitTeam) continue; // allies aren't blocked by their own Halv
        var d = _dist({ q: q, r: r }, { q: u.q, r: u.r });
        if (d === 1) return true;
      }
      return false;
    },

    // Hooks for renderer
    onAbilityResolved: null
  };
})();

var DISCLAIMER = 'Unofficial. Not affiliated with Century Games.';

var HERO_DEFINITIONS = {
  'vael': {
    heroId: 'vael',
    max_hp: 120,
    defense: 8,
    attack_dmg: 12,
    move_range: 3,
    attack_range: 1,
    initiative: 14,
    magic_school: null,
    max_mana: 0,
    max_souls: 0,
    max_verdance: 0,
    starting_spells: [],
    troop_tag: 'infantry',
    permadeath_game_over: true,
    signatures: [
      { id: 'vanguards_oath', name: "Vanguard's Oath", kind: 'passive',
        effect: 'adjacent_allies_def_bonus', value: 4,
        desc: 'Adjacent allies +4 Def while Vael stands.' },
      { id: 'braced_charge', name: 'Braced Charge', kind: 'active',
        cooldown: 2, range: 3, target_type: 'enemy',
        effect: 'charge_attack', damage: 18,
        desc: 'Charge up to 3 hexes and strike for 18 damage.' }
    ]
  },
  'halv': {
    heroId: 'halv',
    max_hp: 160,
    defense: 10,
    attack_dmg: 14,
    move_range: 3,
    attack_range: 1,
    initiative: 12,
    magic_school: null,
    max_mana: 0,
    max_souls: 0,
    max_verdance: 0,
    starting_spells: [],
    troop_tag: 'infantry',
    permadeath_game_over: false,
    signatures: [
      { id: 'hold_the_line', name: 'Hold the Line', kind: 'passive',
        effect: 'zone_of_control',
        desc: 'Adjacent enemies cannot move past Halv\u2019s threatened tiles.' },
      { id: 'cleaving_stroke', name: 'Cleaving Stroke', kind: 'active',
        cooldown: 3, range: 1, target_type: 'enemy',
        effect: 'cleave', cleave_falloff: 0.75,
        desc: 'Strike target + unit directly behind it.' }
    ]
  },
  'brin': {
    heroId: 'brin',
    max_hp: 95,
    defense: 5,
    attack_dmg: 13,
    move_range: 4,
    attack_range: 3,
    initiative: 16,
    magic_school: null,
    max_mana: 0,
    max_souls: 0,
    max_verdance: 0,
    starting_spells: [],
    troop_tag: 'archer',
    permadeath_game_over: false,
    signatures: [
      { id: 'loose_and_fade', name: 'Loose and Fade', kind: 'active',
        cooldown: 2, range: 3, target_type: 'enemy',
        effect: 'attack_then_reposition', reposition: 2,
        desc: 'Attack, then reposition up to 2 hexes.' },
      { id: 'called_shot', name: 'Called Shot', kind: 'active',
        cooldown: 3, range: 0, target_type: 'self',
        effect: 'next_attack_crit', damage_mult: 1.6,
        desc: 'Skip this turn. Next attack +60% damage, guaranteed hit.' }
    ]
  },
  'caelen': {
    heroId: 'caelen',
    max_hp: 70,
    defense: 4,
    attack_dmg: 6,
    move_range: 3,
    attack_range: 1,
    initiative: 10,
    magic_school: 'wizardry',
    max_mana: 40,
    max_souls: 0,
    max_verdance: 0,
    starting_spells: ['firebolt', 'frost_shard', 'spark', 'shield'],
    troop_tag: 'wizard',
    permadeath_game_over: false,
    signatures: [
      { id: 'frost_shard', name: 'Frost Shard', kind: 'spell',
        desc: 'Wizardry signature — see CAST panel.' },
      { id: 'shield', name: 'Shield', kind: 'spell',
        desc: 'Wizardry signature — see CAST panel.' }
    ]
  },
  'marrow': {
    heroId: 'marrow',
    max_hp: 80,
    defense: 5,
    attack_dmg: 7,
    move_range: 3,
    attack_range: 1,
    initiative: 11,
    magic_school: 'necromancy',
    max_mana: 0,
    max_souls: 30,
    max_verdance: 0,
    starting_spells: ['raise_skeleton', 'curse_of_weakness', 'life_drain', 'bone_shield'],
    troop_tag: 'necromancer',
    permadeath_game_over: false,
    signatures: [
      { id: 'raise_skeleton', name: 'Raise Skeleton', kind: 'spell',
        desc: 'Necromancy signature \u2014 see CAST panel.' },
      { id: 'curse_of_weakness', name: 'Curse of Weakness', kind: 'spell',
        desc: 'Necromancy signature \u2014 see CAST panel.' }
    ]
  },
  'thessa': {
    heroId: 'thessa',
    max_hp: 95,
    defense: 6,
    attack_dmg: 8,
    move_range: 3,
    attack_range: 1,
    initiative: 13,
    magic_school: 'druidry',
    max_mana: 0,
    max_souls: 0,
    max_verdance: 35,
    starting_spells: ['heal', 'regrowth', 'summon_wolf', 'gale'],
    troop_tag: 'druid',
    permadeath_game_over: false,
    signatures: [
      { id: 'heal', name: 'Heal', kind: 'spell',
        desc: 'Druidry signature \u2014 see CAST panel.' },
      { id: 'summon_wolf', name: 'Summon Wolf', kind: 'spell',
        desc: 'Druidry signature \u2014 see CAST panel.' }
    ]
  }
};

var ALL_HERO_IDS = Object.keys(HERO_DEFINITIONS);

window.OathAndBoneHeroes = {

  getDefinition: function(heroId) {
    if (!HERO_DEFINITIONS[heroId]) {
      console.error("Hero definition not found for heroId:", heroId);
      return null;
    }
    // Return a copy to prevent external modification
    return JSON.parse(JSON.stringify(HERO_DEFINITIONS[heroId]));
  },

  createUnit: function(heroId, unitId, team, q, r) {
    var definition = this.getDefinition(heroId);
    if (!definition) {
      return null;
    }

    var unit = {
      id: unitId,
      heroId: heroId,
      team: team,
      q: q,
      r: r,
      hp: definition.max_hp,
      max_hp: definition.max_hp,
      defense: definition.defense,
      attack_dmg: definition.attack_dmg,
      move_range: definition.move_range,
      attack_range: definition.attack_range,
      initiative: definition.initiative,
      acted: false,
      magic_school: definition.magic_school,
      mana: definition.magic_school === 'wizardry' ? definition.max_mana : 0,
      max_mana: definition.magic_school === 'wizardry' ? definition.max_mana : 0,
      souls: 0, // Necromancy resource starts at 0
      max_souls: definition.max_souls,
      verdance: 0, // Druidry resource starts at 0
      max_verdance: definition.max_verdance,
      starting_spells: definition.starting_spells,
      permadeath_loss: false, // Always starts as false
      permadeath_game_over: definition.permadeath_game_over,
      troop_tag: definition.troop_tag,
      level: 1,
      status_effects: [],
      is_summon: false,
      summon_owner: null
    };

    // Special handling for Necromancer's mana/souls
    if (definition.magic_school === 'necromancy') {
      unit.mana = 0;
      unit.max_mana = 0;
    }

    return unit;
  },

  getAllHeroIds: function() {
    return ALL_HERO_IDS;
  },

  isGameOverHero: function(heroId) {
    var definition = HERO_DEFINITIONS[heroId];
    return definition ? definition.permadeath_game_over : false;
  }
};
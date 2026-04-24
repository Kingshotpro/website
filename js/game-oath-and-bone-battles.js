var DISCLAIMER = 'Unofficial. Not affiliated with Century Games.';

var SCENARIO_B1 = {
  id: 'b1',
  name: 'The Muster',
  act: 1,
  biome: 'plain',
  map_width: 12,
  map_height: 14,

  // Runtime tier field — engine.js:193 reads scenario.difficultyTier.
  // Default sergeant. The player's selected tier (scout/sergeant/marshal)
  // overrides this at battle start. Before this default existed, the
  // engine read undefined → tripped the scout-gate (no XP) guard even on
  // Sergeant+ wins. Schema-align gap flagged in BUILD_STATUS succession_note.
  difficultyTier: 'sergeant',

  hexTypes: {
    plain:      { terrain: 'plain',      elevation: 0, tile_mods: [] },
    ridge:      { terrain: 'ridge',      elevation: 2, tile_mods: [] },
    forest:     { terrain: 'forest',     elevation: 0, tile_mods: [] },
    // Worker 18: visual variety — no gameplay effects yet (Worker 19 scope)
    water:      { terrain: 'water',      elevation: 0, tile_mods: [] },
    ruin:       { terrain: 'ruin',       elevation: 0, tile_mods: [] },
    cliff_edge: { terrain: 'cliff_edge', elevation: 0, tile_mods: [] },
    rough:      { terrain: 'rough',      elevation: 0, tile_mods: [] },
    sanctum:    { terrain: 'sanctum',    elevation: 0, tile_mods: [] }
  },

  map: {
    '0': { '0': { type: 'plain' }, '1': { type: 'plain' }, '2': { type: 'plain' }, '3': { type: 'plain' }, '4': { type: 'water' }, '5': { type: 'water' }, '6': { type: 'water' }, '7': { type: 'water' }, '8': { type: 'water' }, '9': { type: 'plain' }, '10': { type: 'plain' }, '11': { type: 'plain' }, '12': { type: 'plain' }, '13': { type: 'plain' } },
    '1': { '0': { type: 'plain' }, '1': { type: 'plain' }, '2': { type: 'plain' }, '3': { type: 'plain' }, '4': { type: 'plain' }, '5': { type: 'plain' }, '6': { type: 'plain' }, '7': { type: 'plain' }, '8': { type: 'plain' }, '9': { type: 'forest' }, '10': { type: 'plain' }, '11': { type: 'plain' }, '12': { type: 'plain' }, '13': { type: 'plain' } },
    '2': { '0': { type: 'plain' }, '1': { type: 'plain' }, '2': { type: 'plain' }, '3': { type: 'plain' }, '4': { type: 'plain' }, '5': { type: 'forest' }, '6': { type: 'plain' }, '7': { type: 'rough' }, '8': { type: 'plain' }, '9': { type: 'plain' }, '10': { type: 'plain' }, '11': { type: 'plain' }, '12': { type: 'plain' }, '13': { type: 'plain' } },
    '3': { '0': { type: 'plain' }, '1': { type: 'cliff_edge' }, '2': { type: 'plain' }, '3': { type: 'plain' }, '4': { type: 'plain' }, '5': { type: 'plain' }, '6': { type: 'rough' }, '7': { type: 'plain' }, '8': { type: 'plain' }, '9': { type: 'ruin' }, '10': { type: 'plain' }, '11': { type: 'plain' }, '12': { type: 'plain' }, '13': { type: 'plain' } },
    '4': { '0': { type: 'cliff_edge' }, '1': { type: 'ridge' }, '2': { type: 'plain' }, '3': { type: 'plain' }, '4': { type: 'plain' }, '5': { type: 'plain' }, '6': { type: 'plain' }, '7': { type: 'plain' }, '8': { type: 'plain' }, '9': { type: 'forest' }, '10': { type: 'ruin' }, '11': { type: 'plain' }, '12': { type: 'plain' }, '13': { type: 'plain' } },
    '5': { '0': { type: 'cliff_edge' }, '1': { type: 'ridge' }, '2': { type: 'plain' }, '3': { type: 'plain' }, '4': { type: 'plain' }, '5': { type: 'forest' }, '6': { type: 'forest' }, '7': { type: 'plain' }, '8': { type: 'plain' }, '9': { type: 'plain' }, '10': { type: 'ruin' }, '11': { type: 'plain' }, '12': { type: 'plain' }, '13': { type: 'plain' } },
    '6': { '0': { type: 'cliff_edge' }, '1': { type: 'ridge' }, '2': { type: 'plain' }, '3': { type: 'plain' }, '4': { type: 'plain' }, '5': { type: 'plain' }, '6': { type: 'plain' }, '7': { type: 'plain' }, '8': { type: 'plain' }, '9': { type: 'plain' }, '10': { type: 'plain' }, '11': { type: 'plain' }, '12': { type: 'plain' }, '13': { type: 'plain' } },
    '7': { '0': { type: 'plain' }, '1': { type: 'cliff_edge' }, '2': { type: 'plain' }, '3': { type: 'plain' }, '4': { type: 'plain' }, '5': { type: 'forest' }, '6': { type: 'plain' }, '7': { type: 'plain' }, '8': { type: 'plain' }, '9': { type: 'plain' }, '10': { type: 'plain' }, '11': { type: 'plain' }, '12': { type: 'plain' }, '13': { type: 'plain' } },
    '8': { '0': { type: 'plain' }, '1': { type: 'plain' }, '2': { type: 'plain' }, '3': { type: 'plain' }, '4': { type: 'rough' }, '5': { type: 'plain' }, '6': { type: 'plain' }, '7': { type: 'plain' }, '8': { type: 'forest' }, '9': { type: 'plain' }, '10': { type: 'plain' }, '11': { type: 'plain' }, '12': { type: 'plain' }, '13': { type: 'plain' } },
    '9': { '0': { type: 'plain' }, '1': { type: 'plain' }, '2': { type: 'forest' }, '3': { type: 'plain' }, '4': { type: 'plain' }, '5': { type: 'plain' }, '6': { type: 'rough' }, '7': { type: 'forest' }, '8': { type: 'sanctum' }, '9': { type: 'plain' }, '10': { type: 'plain' }, '11': { type: 'plain' }, '12': { type: 'plain' }, '13': { type: 'plain' } },
    '10': { '0': { type: 'plain' }, '1': { type: 'plain' }, '2': { type: 'plain' }, '3': { type: 'rough' }, '4': { type: 'plain' }, '5': { type: 'forest' }, '6': { type: 'plain' }, '7': { type: 'plain' }, '8': { type: 'rough' }, '9': { type: 'plain' }, '10': { type: 'plain' }, '11': { type: 'plain' }, '12': { type: 'plain' }, '13': { type: 'plain' } },
    '11': { '0': { type: 'plain' }, '1': { type: 'plain' }, '2': { type: 'plain' }, '3': { type: 'plain' }, '4': { type: 'plain' }, '5': { type: 'rough' }, '6': { type: 'plain' }, '7': { type: 'plain' }, '8': { type: 'plain' }, '9': { type: 'plain' }, '10': { type: 'plain' }, '11': { type: 'plain' }, '12': { type: 'plain' }, '13': { type: 'plain' } }
  },

  playerStart: [
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
      troop_tag: 'archer', magic: null },
    { id: 'player_caelen', heroId: 'caelen', team: 'player', q: 6, r: 12,
      hp_max: 70, move: 3, attack_range: 1, attack_dmg: 6, initiative: 10,
      defense: 4, acted: false, permadeath_loss: false, permadeath_game_over: false,
      troop_tag: 'wizard',
      magic: {
        school: 'wizardry',
        mana: 40, mana_max: 40, mana_regen: 3,
        spells_equipped: ['firebolt', 'frost_shard', 'spark', 'shield'],
        active_summons: []
      }
    }
  ],

  enemyStart: [
    { id: 'enemy_bladewind_a', heroId: 'bladewind', team: 'enemy', q: 4, r: 2,
      archetype: 'bladewind', level: 2,
      hp_max: 75, move: 4, attack_range: 1, attack_dmg: 9, initiative: 13,
      defense: 3, acted: false, permadeath_loss: false, permadeath_game_over: false,
      troop_tag: 'infantry', magic: null },
    { id: 'enemy_bladewind_b', heroId: 'bladewind', team: 'enemy', q: 6, r: 2,
      archetype: 'bladewind', level: 2,
      hp_max: 75, move: 4, attack_range: 1, attack_dmg: 9, initiative: 13,
      defense: 3, acted: false, permadeath_loss: false, permadeath_game_over: false,
      troop_tag: 'infantry', magic: null },
    { id: 'enemy_bladewind_c', heroId: 'bladewind', team: 'enemy', q: 3, r: 4,
      archetype: 'bladewind', level: 2,
      hp_max: 75, move: 4, attack_range: 1, attack_dmg: 9, initiative: 13,
      defense: 3, acted: false, permadeath_loss: false, permadeath_game_over: false,
      troop_tag: 'infantry', magic: null },
    { id: 'enemy_bladewind_d', heroId: 'bladewind', team: 'enemy', q: 7, r: 4,
      archetype: 'bladewind', level: 2,
      hp_max: 75, move: 4, attack_range: 1, attack_dmg: 9, initiative: 13,
      defense: 3, acted: false, permadeath_loss: false, permadeath_game_over: false,
      troop_tag: 'infantry', magic: null },
    { id: 'enemy_ironwall_archer', heroId: 'ironwall', team: 'enemy', q: 5, r: 1,
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
    size: 4,
    locked: ['vael', 'halv', 'brin', 'caelen'],
    flexible: []
  }
};

window.OathAndBoneBattles = {
  getScenario: function(id) {
    if (id === 'b1') return JSON.parse(JSON.stringify(SCENARIO_B1));
    return null;
  }
};
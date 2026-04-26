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
    },
    { id: 'player_marrow', heroId: 'marrow', team: 'player', q: 7, r: 12,
      hp_max: 80, move: 3, attack_range: 1, attack_dmg: 7, initiative: 11,
      defense: 5, acted: false, permadeath_loss: false, permadeath_game_over: false,
      troop_tag: 'necromancer',
      magic: {
        school: 'necromancy',
        souls: 15, souls_max: 30,
        spells_equipped: ['raise_skeleton', 'curse_of_weakness', 'life_drain', 'bone_shield'],
        active_summons: []
      }
    },
    { id: 'player_thessa', heroId: 'thessa', team: 'player', q: 8, r: 12,
      hp_max: 95, move: 3, attack_range: 1, attack_dmg: 8, initiative: 13,
      defense: 6, acted: false, permadeath_loss: false, permadeath_game_over: false,
      troop_tag: 'druid',
      magic: {
        school: 'druidry',
        verdance: 10, verdance_max: 35,
        spells_equipped: ['heal', 'regrowth', 'summon_wolf', 'gale'],
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
    size: 6,
    locked: ['vael', 'halv', 'brin', 'caelen', 'marrow', 'thessa'],
    flexible: []
  }
};

// ── SCENARIO_B2 — The Hollow (forest biome, terrain-teaching) ─────────────
// Worker 21. Dimensions match renderer MAP_W=12/MAP_H=14.
// BATTLES.md specifies 14×12 — deviation noted in CHAPTER_LOG.md.
// Tutorial T4/T5 declared; engine wiring deferred (see CHAPTER_LOG.md).
var SCENARIO_B2 = {
  id: 'b2',
  name: 'The Hollow',
  act: 1,
  biome: 'forest',
  map_width: 12,
  map_height: 14,

  difficultyTier: 'sergeant',

  hexTypes: {
    plain:      { terrain: 'plain',      elevation: 0, tile_mods: [] },
    ridge:      { terrain: 'ridge',      elevation: 2, tile_mods: [] },
    forest:     { terrain: 'forest',     elevation: 0, tile_mods: [] },
    water:      { terrain: 'water',      elevation: 0, tile_mods: [] },
    ruin:       { terrain: 'ruin',       elevation: 0, tile_mods: [] },
    cliff_edge: { terrain: 'cliff_edge', elevation: 0, tile_mods: [] },
    rough:      { terrain: 'rough',      elevation: 0, tile_mods: [] },
    sanctum:    { terrain: 'sanctum',    elevation: 0, tile_mods: [] }
  },

  // Outer key = q (0-11), inner key = r (0-13).
  // Water top strip (r=0) demonstrates impassable terrain.
  // Forest bands at q=1-2, 5-7, 10 create narrow plain corridors at q=3-4 and q=8-9.
  map: {
    '0':  { '0':{type:'water'}, '1':{type:'plain'}, '2':{type:'plain'}, '3':{type:'plain'}, '4':{type:'plain'}, '5':{type:'plain'}, '6':{type:'plain'}, '7':{type:'plain'}, '8':{type:'plain'}, '9':{type:'plain'}, '10':{type:'plain'}, '11':{type:'plain'}, '12':{type:'plain'}, '13':{type:'plain'} },
    '1':  { '0':{type:'water'}, '1':{type:'forest'}, '2':{type:'forest'}, '3':{type:'forest'}, '4':{type:'forest'}, '5':{type:'forest'}, '6':{type:'forest'}, '7':{type:'plain'}, '8':{type:'plain'}, '9':{type:'plain'}, '10':{type:'plain'}, '11':{type:'plain'}, '12':{type:'plain'}, '13':{type:'plain'} },
    '2':  { '0':{type:'water'}, '1':{type:'forest'}, '2':{type:'forest'}, '3':{type:'forest'}, '4':{type:'forest'}, '5':{type:'forest'}, '6':{type:'plain'}, '7':{type:'plain'}, '8':{type:'plain'}, '9':{type:'plain'}, '10':{type:'plain'}, '11':{type:'plain'}, '12':{type:'plain'}, '13':{type:'plain'} },
    '3':  { '0':{type:'water'}, '1':{type:'plain'}, '2':{type:'plain'}, '3':{type:'plain'}, '4':{type:'plain'}, '5':{type:'plain'}, '6':{type:'plain'}, '7':{type:'plain'}, '8':{type:'plain'}, '9':{type:'plain'}, '10':{type:'plain'}, '11':{type:'plain'}, '12':{type:'plain'}, '13':{type:'plain'} },
    '4':  { '0':{type:'water'}, '1':{type:'plain'}, '2':{type:'plain'}, '3':{type:'plain'}, '4':{type:'plain'}, '5':{type:'plain'}, '6':{type:'plain'}, '7':{type:'plain'}, '8':{type:'plain'}, '9':{type:'plain'}, '10':{type:'plain'}, '11':{type:'plain'}, '12':{type:'plain'}, '13':{type:'plain'} },
    '5':  { '0':{type:'water'}, '1':{type:'forest'}, '2':{type:'forest'}, '3':{type:'forest'}, '4':{type:'forest'}, '5':{type:'forest'}, '6':{type:'forest'}, '7':{type:'plain'}, '8':{type:'plain'}, '9':{type:'plain'}, '10':{type:'plain'}, '11':{type:'plain'}, '12':{type:'plain'}, '13':{type:'plain'} },
    '6':  { '0':{type:'water'}, '1':{type:'forest'}, '2':{type:'forest'}, '3':{type:'forest'}, '4':{type:'forest'}, '5':{type:'forest'}, '6':{type:'plain'}, '7':{type:'plain'}, '8':{type:'ruin'}, '9':{type:'plain'}, '10':{type:'plain'}, '11':{type:'plain'}, '12':{type:'plain'}, '13':{type:'plain'} },
    '7':  { '0':{type:'water'}, '1':{type:'forest'}, '2':{type:'forest'}, '3':{type:'forest'}, '4':{type:'forest'}, '5':{type:'forest'}, '6':{type:'plain'}, '7':{type:'plain'}, '8':{type:'plain'}, '9':{type:'plain'}, '10':{type:'plain'}, '11':{type:'plain'}, '12':{type:'plain'}, '13':{type:'plain'} },
    '8':  { '0':{type:'water'}, '1':{type:'plain'}, '2':{type:'plain'}, '3':{type:'plain'}, '4':{type:'plain'}, '5':{type:'plain'}, '6':{type:'plain'}, '7':{type:'plain'}, '8':{type:'plain'}, '9':{type:'plain'}, '10':{type:'plain'}, '11':{type:'plain'}, '12':{type:'plain'}, '13':{type:'plain'} },
    '9':  { '0':{type:'water'}, '1':{type:'plain'}, '2':{type:'plain'}, '3':{type:'plain'}, '4':{type:'plain'}, '5':{type:'plain'}, '6':{type:'plain'}, '7':{type:'plain'}, '8':{type:'plain'}, '9':{type:'plain'}, '10':{type:'plain'}, '11':{type:'plain'}, '12':{type:'plain'}, '13':{type:'plain'} },
    '10': { '0':{type:'water'}, '1':{type:'forest'}, '2':{type:'forest'}, '3':{type:'forest'}, '4':{type:'forest'}, '5':{type:'forest'}, '6':{type:'forest'}, '7':{type:'plain'}, '8':{type:'plain'}, '9':{type:'plain'}, '10':{type:'plain'}, '11':{type:'plain'}, '12':{type:'plain'}, '13':{type:'plain'} },
    '11': { '0':{type:'water'}, '1':{type:'plain'}, '2':{type:'plain'}, '3':{type:'plain'}, '4':{type:'plain'}, '5':{type:'plain'}, '6':{type:'plain'}, '7':{type:'plain'}, '8':{type:'plain'}, '9':{type:'plain'}, '10':{type:'plain'}, '11':{type:'plain'}, '12':{type:'plain'}, '13':{type:'plain'} }
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
    { id: 'enemy_bladewind_b1', heroId: 'bladewind', team: 'enemy', q: 3, r: 2,
      archetype: 'bladewind', level: 3,
      hp_max: 85, move: 4, attack_range: 1, attack_dmg: 10, initiative: 13,
      defense: 3, acted: false, permadeath_loss: false, permadeath_game_over: false,
      troop_tag: 'infantry', magic: null },
    { id: 'enemy_bladewind_b2', heroId: 'bladewind', team: 'enemy', q: 8, r: 2,
      archetype: 'bladewind', level: 3,
      hp_max: 85, move: 4, attack_range: 1, attack_dmg: 10, initiative: 13,
      defense: 3, acted: false, permadeath_loss: false, permadeath_game_over: false,
      troop_tag: 'infantry', magic: null },
    { id: 'enemy_bladewind_b3', heroId: 'bladewind', team: 'enemy', q: 3, r: 5,
      archetype: 'bladewind', level: 3,
      hp_max: 85, move: 4, attack_range: 1, attack_dmg: 10, initiative: 13,
      defense: 3, acted: false, permadeath_loss: false, permadeath_game_over: false,
      troop_tag: 'infantry', magic: null },
    // Druid NPC — becomes Thessa if 'thessa_recruited' story flag written on victory.
    // Uses bladewind sprite (archer troop_tag for range 2 attack) until druid sprite ships.
    // Conditional story flag write requires story-flag engine: deferred (see CHAPTER_LOG.md).
    { id: 'enemy_druid_thessa', heroId: 'bladewind', team: 'enemy', q: 6, r: 3,
      archetype: 'bladewind', level: 2,
      hp_max: 65, move: 3, attack_range: 2, attack_dmg: 8, initiative: 14,
      defense: 2, acted: false, permadeath_loss: false, permadeath_game_over: false,
      troop_tag: 'archer', magic: null }
  ],

  objective: {
    type: 'rout',
    description: 'Reduce all enemies to HP 0'
  },

  rewards: {
    xp: { scout: 60, sergeant: 80, marshal: 120 },
    crowns: 60,
    credits: { count: 0, condition: null },
    reagents: []
  },

  difficulty_tiers: {
    scout:    { hp_mult: 0.75, dmg_mult: 0.80, reward_mult: 0.75 },
    sergeant: { hp_mult: 1.00, dmg_mult: 1.00, reward_mult: 1.00 },
    marshal:  { hp_mult: 1.50, dmg_mult: 1.25, reward_mult: 1.50 }
  },

  tutorials: ['T4', 'T5'],
  tutorial_triggers: {
    T4: { event: 'first_forest_attack' },
    T5: { event: 'first_water_blocked' }
  },
  tutorial_copy: {
    T4: 'Forest cover: units in forest tiles gain +1 evasion against ranged attacks. Use the trees.',
    T5: 'Water is impassable. Work through the forest corridors to reach the enemy.'
  },

  story_flags: {
    read: ['b1_complete'],
    write: ['b2_complete', 'thessa_recruited']
  },

  soul_review: [
    {
      event: 'sword_clash',
      channels: ['slide_animation', 'blade_sfx', 'hp_number_float', 'brin_hollow_remark']
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

// ── SCENARIO_B3 — The Crypt Gate (ruins biome, first necromantic creature) ──
// Worker 21. Introduces magic to the world via Skeleton enemy.
// Skeleton uses bladewind sprite (V2 scope: dedicated skeleton sprite).
// BATTLES.md specifies 10×16 — deviation noted in CHAPTER_LOG.md.
var SCENARIO_B3 = {
  id: 'b3',
  name: 'The Crypt Gate',
  act: 1,
  biome: 'ruin',
  map_width: 12,
  map_height: 14,

  difficultyTier: 'sergeant',

  hexTypes: {
    plain:      { terrain: 'plain',      elevation: 0, tile_mods: [] },
    ridge:      { terrain: 'ridge',      elevation: 2, tile_mods: [] },
    forest:     { terrain: 'forest',     elevation: 0, tile_mods: [] },
    water:      { terrain: 'water',      elevation: 0, tile_mods: [] },
    ruin:       { terrain: 'ruin',       elevation: 0, tile_mods: [] },
    cliff_edge: { terrain: 'cliff_edge', elevation: 0, tile_mods: [] },
    rough:      { terrain: 'rough',      elevation: 0, tile_mods: [] },
    sanctum:    { terrain: 'sanctum',    elevation: 0, tile_mods: [] }
  },

  // Crypt interior (r=0-6) = ruin + cliff_edge broken walls.
  // Approach (r=7-13) = plain. Outer columns (q=0, q=11) = cliff_edge wall.
  map: {
    '0':  { '0':{type:'cliff_edge'}, '1':{type:'cliff_edge'}, '2':{type:'cliff_edge'}, '3':{type:'cliff_edge'}, '4':{type:'cliff_edge'}, '5':{type:'cliff_edge'}, '6':{type:'cliff_edge'}, '7':{type:'plain'}, '8':{type:'plain'}, '9':{type:'plain'}, '10':{type:'plain'}, '11':{type:'plain'}, '12':{type:'plain'}, '13':{type:'plain'} },
    '1':  { '0':{type:'ruin'}, '1':{type:'ruin'}, '2':{type:'ruin'}, '3':{type:'ruin'}, '4':{type:'ruin'}, '5':{type:'ruin'}, '6':{type:'ruin'}, '7':{type:'plain'}, '8':{type:'plain'}, '9':{type:'plain'}, '10':{type:'plain'}, '11':{type:'plain'}, '12':{type:'plain'}, '13':{type:'plain'} },
    '2':  { '0':{type:'ruin'}, '1':{type:'ruin'}, '2':{type:'cliff_edge'}, '3':{type:'ruin'}, '4':{type:'ruin'}, '5':{type:'ruin'}, '6':{type:'ruin'}, '7':{type:'plain'}, '8':{type:'plain'}, '9':{type:'plain'}, '10':{type:'plain'}, '11':{type:'plain'}, '12':{type:'plain'}, '13':{type:'plain'} },
    '3':  { '0':{type:'cliff_edge'}, '1':{type:'ruin'}, '2':{type:'ruin'}, '3':{type:'ruin'}, '4':{type:'ruin'}, '5':{type:'ruin'}, '6':{type:'ruin'}, '7':{type:'plain'}, '8':{type:'plain'}, '9':{type:'plain'}, '10':{type:'plain'}, '11':{type:'plain'}, '12':{type:'plain'}, '13':{type:'plain'} },
    '4':  { '0':{type:'cliff_edge'}, '1':{type:'ruin'}, '2':{type:'ruin'}, '3':{type:'cliff_edge'}, '4':{type:'ruin'}, '5':{type:'ruin'}, '6':{type:'ruin'}, '7':{type:'plain'}, '8':{type:'plain'}, '9':{type:'plain'}, '10':{type:'plain'}, '11':{type:'plain'}, '12':{type:'plain'}, '13':{type:'plain'} },
    '5':  { '0':{type:'ruin'}, '1':{type:'ruin'}, '2':{type:'ruin'}, '3':{type:'plain'}, '4':{type:'ruin'}, '5':{type:'ruin'}, '6':{type:'ruin'}, '7':{type:'plain'}, '8':{type:'plain'}, '9':{type:'plain'}, '10':{type:'plain'}, '11':{type:'plain'}, '12':{type:'plain'}, '13':{type:'plain'} },
    '6':  { '0':{type:'ruin'}, '1':{type:'ruin'}, '2':{type:'ruin'}, '3':{type:'plain'}, '4':{type:'ruin'}, '5':{type:'ruin'}, '6':{type:'ruin'}, '7':{type:'plain'}, '8':{type:'plain'}, '9':{type:'plain'}, '10':{type:'plain'}, '11':{type:'plain'}, '12':{type:'plain'}, '13':{type:'plain'} },
    '7':  { '0':{type:'cliff_edge'}, '1':{type:'ruin'}, '2':{type:'cliff_edge'}, '3':{type:'ruin'}, '4':{type:'ruin'}, '5':{type:'ruin'}, '6':{type:'ruin'}, '7':{type:'plain'}, '8':{type:'plain'}, '9':{type:'plain'}, '10':{type:'plain'}, '11':{type:'plain'}, '12':{type:'plain'}, '13':{type:'plain'} },
    '8':  { '0':{type:'cliff_edge'}, '1':{type:'ruin'}, '2':{type:'ruin'}, '3':{type:'ruin'}, '4':{type:'ruin'}, '5':{type:'ruin'}, '6':{type:'ruin'}, '7':{type:'plain'}, '8':{type:'plain'}, '9':{type:'plain'}, '10':{type:'plain'}, '11':{type:'plain'}, '12':{type:'plain'}, '13':{type:'plain'} },
    '9':  { '0':{type:'ruin'}, '1':{type:'ruin'}, '2':{type:'ruin'}, '3':{type:'ruin'}, '4':{type:'cliff_edge'}, '5':{type:'ruin'}, '6':{type:'ruin'}, '7':{type:'plain'}, '8':{type:'plain'}, '9':{type:'plain'}, '10':{type:'plain'}, '11':{type:'plain'}, '12':{type:'plain'}, '13':{type:'plain'} },
    '10': { '0':{type:'ruin'}, '1':{type:'ruin'}, '2':{type:'ruin'}, '3':{type:'ruin'}, '4':{type:'ruin'}, '5':{type:'ruin'}, '6':{type:'ruin'}, '7':{type:'plain'}, '8':{type:'plain'}, '9':{type:'plain'}, '10':{type:'plain'}, '11':{type:'plain'}, '12':{type:'plain'}, '13':{type:'plain'} },
    '11': { '0':{type:'cliff_edge'}, '1':{type:'cliff_edge'}, '2':{type:'cliff_edge'}, '3':{type:'cliff_edge'}, '4':{type:'cliff_edge'}, '5':{type:'cliff_edge'}, '6':{type:'cliff_edge'}, '7':{type:'plain'}, '8':{type:'plain'}, '9':{type:'plain'}, '10':{type:'plain'}, '11':{type:'plain'}, '12':{type:'plain'}, '13':{type:'plain'} }
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
    // Skeleton — first non-Kingshot creature. Uses bladewind sprite until V2 skeleton sprite ships.
    { id: 'enemy_skeleton_a', heroId: 'bladewind', team: 'enemy', q: 5, r: 1,
      archetype: 'bladewind', level: 3,
      hp_max: 55, move: 3, attack_range: 1, attack_dmg: 8, initiative: 8,
      defense: 2, acted: false, permadeath_loss: false, permadeath_game_over: false,
      troop_tag: 'infantry', magic: null },
    { id: 'enemy_bladewind_c1', heroId: 'bladewind', team: 'enemy', q: 3, r: 4,
      archetype: 'bladewind', level: 4,
      hp_max: 95, move: 4, attack_range: 1, attack_dmg: 11, initiative: 13,
      defense: 4, acted: false, permadeath_loss: false, permadeath_game_over: false,
      troop_tag: 'infantry', magic: null },
    { id: 'enemy_bladewind_c2', heroId: 'bladewind', team: 'enemy', q: 7, r: 3,
      archetype: 'bladewind', level: 4,
      hp_max: 95, move: 4, attack_range: 1, attack_dmg: 11, initiative: 13,
      defense: 4, acted: false, permadeath_loss: false, permadeath_game_over: false,
      troop_tag: 'infantry', magic: null },
    { id: 'enemy_bladewind_c3', heroId: 'bladewind', team: 'enemy', q: 9, r: 5,
      archetype: 'bladewind', level: 4,
      hp_max: 95, move: 4, attack_range: 1, attack_dmg: 11, initiative: 13,
      defense: 4, acted: false, permadeath_loss: false, permadeath_game_over: false,
      troop_tag: 'infantry', magic: null }
  ],

  objective: {
    type: 'rout',
    description: 'Reduce all enemies to HP 0'
  },

  rewards: {
    xp: { scout: 80, sergeant: 110, marshal: 165 },
    crowns: 70,
    credits: { count: 0, condition: null },
    reagents: []
  },

  difficulty_tiers: {
    scout:    { hp_mult: 0.75, dmg_mult: 0.80, reward_mult: 0.75 },
    sergeant: { hp_mult: 1.00, dmg_mult: 1.00, reward_mult: 1.00 },
    marshal:  { hp_mult: 1.50, dmg_mult: 1.25, reward_mult: 1.50 }
  },

  tutorials: ['T6', 'T7'],
  tutorial_triggers: {
    T6: { event: 'first_skeleton_kill' },
    T7: { event: 'magic_revealed' }
  },
  tutorial_copy: {
    T6: 'These aren\'t Kingshot soldiers. Something older walks the borderlands. We need a wizard.',
    T7: 'Magic ignores armor. Position for cover and close to melee range quickly.'
  },

  story_flags: {
    read: ['b2_complete'],
    write: ['b3_complete', 'magic_revealed']
  },

  soul_review: [
    {
      event: 'skeleton_first_sight',
      channels: ['screen_darken_15pct', 'dissonant_choral_stinger', 'halv_oh_my_lord', 'sprite_fade_in']
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

// ── SCENARIOS lookup — Worker 21 ─────────────────────────────────────────────
// Single source of truth for all Act 1 scenario data.
// Orchestrator reads window.OathAndBoneScenarios[id] to start any scenario.
var SCENARIOS = {
  'b1': SCENARIO_B1,
  'b2': SCENARIO_B2,
  'b3': SCENARIO_B3
};
window.OathAndBoneScenarios = SCENARIOS;

// Campaign progression order — used by cache.js for optimistic client unlock.
var OAB_SCENARIO_ORDER = ['b1', 'b2', 'b3'];
window.OAB_SCENARIO_ORDER = OAB_SCENARIO_ORDER;

window.OathAndBoneBattles = {
  getScenario: function(id) {
    var s = SCENARIOS[id];
    if (s) return JSON.parse(JSON.stringify(s));
    return null;
  }
};
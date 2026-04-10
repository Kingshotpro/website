/**
 * advisor.js — Avatar state manager
 * KingshotPro | Phase 1
 *
 * Manages the player's advisor: archetype, name, XP, level,
 * observations, and behavioral tags. Persists in localStorage.
 * Depends on advisor-names.js being loaded first.
 */
(function () {
  'use strict';

  // ── XP Thresholds ────────────────────────
  var LEVEL_THRESHOLDS = [0, 50, 150, 300, 500, 750, 1100, 1600, 2200, 3000];
  var MAX_LOG_ENTRIES  = 50;
  var AVATAR_PREFIX    = 'ksp_avatar_';

  // ── Archetype definitions ────────────────
  var ARCHETYPES = {
    steward: {
      title: 'The Steward',
      specialty: 'Resources & efficiency',
      voice: 'Methodical, loyal, never wastes words'
    },
    sage: {
      title: 'The Sage',
      specialty: 'Strategy & long-term planning',
      voice: 'Patient, analytical, sees patterns others miss'
    },
    herald: {
      title: 'The Herald',
      specialty: 'Rankings & competitive standing',
      voice: 'Direct, urgent, always knows where you stand'
    }
  };

  // ── Internal state ───────────────────────
  var _state   = null;
  var _fid     = null;
  var _listeners = {};

  // ── Default state factory ────────────────
  function createState(archetype, nameEntry) {
    var now = Date.now();
    return {
      archetype:       archetype,
      nameId:          nameEntry.id,
      name:            nameEntry.name,
      gender:          nameEntry.gender,
      xp:              0,
      level:           1,
      xp_log:          [],
      observations: {
        calc_usage:    {},
        war_table:     { plays: 0, aggressive_picks: 0, defensive_picks: 0 },
        vault_trial:   { plays: 0, total_score: 0, missed_topics: [] },
        visit_pattern: { total: 0, streak: 0, last_visit: 0, days: {} }
      },
      items:           [],
      abilities:       [],
      achievements:    [],
      ascension_level: 0,
      last_visit:      now,
      created:         now
    };
  }

  // ── Level calculation ────────────────────
  function calcLevel(xp) {
    for (var i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
      if (xp >= LEVEL_THRESHOLDS[i]) return i + 1;
    }
    return 1;
  }

  function xpForNextLevel(level) {
    if (level >= LEVEL_THRESHOLDS.length) return null; // max level
    return LEVEL_THRESHOLDS[level]; // threshold for level+1 (0-indexed array, level is 1-indexed)
  }

  // ── Event system ─────────────────────────
  function emit(event, data) {
    var cbs = _listeners[event];
    if (!cbs) return;
    for (var i = 0; i < cbs.length; i++) {
      try { cbs[i](data); } catch (e) { console.error('Advisor event error:', e); }
    }
  }

  // ── Day key for dedup ────────────────────
  function dayKey(ts) {
    var d = new Date(ts || Date.now());
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  }

  // ── Greeting bank ────────────────────────
  var GREETINGS = {
    steward: {
      first:    'I am {name}. Your Steward. I\'ve already begun studying your kingdom.',
      returning: [
        'Governor {player}. Council session {visits}. I remember all of them.',
        'Welcome back, {player}. Your Steward has been reviewing the ledgers.',
        '{player}. The kingdom waited. Now let us proceed.',
        'Governor. Your records are current. Shall we begin?'
      ],
      streak:   '{days} days running. Consistency becomes you, Governor.',
      absence:  'It\'s been {days} days, {player}. Your kingdom didn\'t stop while you were away.'
    },
    sage: {
      first:    'I am {name}. Your Sage. I see patterns others miss. Yours are... interesting.',
      returning: [
        '{player}. Visit {visits}. Each one teaches me more about how you think.',
        'Governor {player}. The patterns are becoming clearer.',
        'You\'ve returned. I expected you would.',
        '{player}. I\'ve been watching the data shift. We should talk.'
      ],
      streak:   '{days} days without a break. Your discipline reveals more than you know.',
      absence:  '{days} days of silence. The data moved without you, {player}.'
    },
    herald: {
      first:    'I am {name}. Your Herald. I already know where you stand. Let\'s change that.',
      returning: [
        '{player}. Session {visits}. The board has changed since last time.',
        'Governor {player}. Your Herald has been tracking movements.',
        'Back again. Good. Your rivals haven\'t been idle.',
        '{player}. Rankings shifted. Let me brief you.'
      ],
      streak:   '{days} days straight. The board is starting to notice you.',
      absence:  '{days} days gone, {player}. Others moved up. Let\'s see where you stand.'
    }
  };

  function fillTemplate(str, vars) {
    return str.replace(/\{(\w+)\}/g, function (m, k) { return vars[k] !== undefined ? vars[k] : m; });
  }

  // ── Behavioral tag derivation ────────────
  function deriveTags(obs) {
    var tags = [];
    var cu = obs.calc_usage || {};

    var troops   = cu.troops   || 0;
    var building = cu.building || 0;
    var gear     = cu.gear     || 0;
    var charm    = cu.charm    || 0;
    var shards   = cu.shards   || 0;
    var heroGear = cu['hero-gear'] || 0;
    var totalCalc = 0;
    for (var k in cu) totalCalc += cu[k];

    // Combat vs builder
    if (troops > 3 && troops > building * 3) tags.push('combat_prioritizer');
    if (building > 3 && building > troops * 3) tags.push('builder');

    // Optimizer
    var optTotal = gear + charm + shards + heroGear;
    if (optTotal > 5 && optTotal > troops && optTotal > building) tags.push('optimizer');

    // Neglects gear
    if (gear === 0 && totalCalc >= 10) tags.push('neglects_gear');

    // Visit patterns
    var vp = obs.visit_pattern || {};
    if (vp.streak >= 5) tags.push('daily_player');

    // War table
    var wt = obs.war_table || {};
    if (wt.plays >= 5 && wt.aggressive_picks / wt.plays > 0.7) tags.push('aggressive_tactician');

    // Vault trial gaps
    var vt = obs.vault_trial || {};
    if (vt.plays >= 3 && vt.missed_topics && vt.missed_topics.length > 0) {
      var topicCounts = {};
      for (var i = 0; i < vt.missed_topics.length; i++) {
        var t = vt.missed_topics[i];
        topicCounts[t] = (topicCounts[t] || 0) + 1;
      }
      for (var topic in topicCounts) {
        if (topicCounts[topic] >= 3) tags.push('knowledge_gap_' + topic);
      }
    }

    return tags;
  }

  // ── Public API ───────────────────────────
  var Advisor = {

    ARCHETYPES: ARCHETYPES,
    LEVEL_THRESHOLDS: LEVEL_THRESHOLDS,

    /**
     * Load advisor state for a given FID.
     * Returns true if state was found, false if new player (needs selection).
     */
    load: function (fid) {
      _fid = fid;
      try {
        var raw = localStorage.getItem(AVATAR_PREFIX + fid);
        if (raw) {
          _state = JSON.parse(raw);
          return true;
        }
      } catch (e) { /* corrupt — treat as new */ }
      _state = null;
      return false;
    },

    /** Check if an advisor exists for a FID without loading it. */
    exists: function (fid) {
      try {
        return localStorage.getItem(AVATAR_PREFIX + fid) !== null;
      } catch (e) { return false; }
    },

    /**
     * Create a new advisor for the current FID.
     * Called after archetype selection.
     */
    create: function (archetype) {
      if (!_fid) throw new Error('Call Advisor.load(fid) first');
      var nameEntry = pickRandomAdvisorName();
      _state = createState(archetype, nameEntry);
      this.save();
      emit('created', { archetype: archetype, name: nameEntry.name });
      return _state;
    },

    /** Persist current state to localStorage. */
    save: function () {
      if (!_fid || !_state) return;
      try {
        localStorage.setItem(AVATAR_PREFIX + _fid, JSON.stringify(_state));
      } catch (e) { console.error('Advisor save failed:', e); }
    },

    /** Grant XP for an action. Handles level-up detection. */
    grantXP: function (action, amount) {
      if (!_state) return;

      var prevLevel = calcLevel(_state.xp);
      _state.xp += amount;
      var newLevel = calcLevel(_state.xp);
      _state.level = newLevel;

      // Log entry (keep last N)
      _state.xp_log.push({ action: action, xp: amount, ts: Date.now() });
      if (_state.xp_log.length > MAX_LOG_ENTRIES) {
        _state.xp_log = _state.xp_log.slice(-MAX_LOG_ENTRIES);
      }

      this.save();
      emit('xp', { action: action, amount: amount, total: _state.xp, level: newLevel });

      if (newLevel > prevLevel) {
        emit('levelup', { from: prevLevel, to: newLevel, xp: _state.xp });
      }
    },

    /** Record a behavioral observation. */
    observe: function (category, key, value) {
      if (!_state || !_state.observations) return;
      var cat = _state.observations[category];
      if (!cat) {
        _state.observations[category] = {};
        cat = _state.observations[category];
      }

      if (typeof value === 'number') {
        cat[key] = (cat[key] || 0) + value;
      } else if (Array.isArray(cat[key])) {
        cat[key].push(value);
      } else {
        cat[key] = value;
      }

      this.save();
    },

    /** Process a daily visit — XP + streak tracking. */
    processDailyVisit: function () {
      if (!_state) return;
      var today = dayKey();
      var vp = _state.observations.visit_pattern;

      // Already visited today
      if (vp.days && vp.days[today]) return;

      vp.total = (vp.total || 0) + 1;

      // Streak calculation
      var yesterday = dayKey(Date.now() - 86400000);
      if (vp.days && vp.days[yesterday]) {
        vp.streak = (vp.streak || 0) + 1;
      } else {
        vp.streak = 1;
      }

      // Record day visited
      if (!vp.days) vp.days = {};
      vp.days[today] = true;

      // Prune old day records (keep last 30)
      var keys = Object.keys(vp.days).sort();
      if (keys.length > 30) {
        for (var i = 0; i < keys.length - 30; i++) {
          delete vp.days[keys[i]];
        }
      }

      vp.last_visit = Date.now();
      _state.last_visit = Date.now();

      this.grantXP('daily_visit', 10);
    },

    /** Get current level. */
    getLevel: function () {
      return _state ? calcLevel(_state.xp) : 1;
    },

    /** Get XP needed for next level. Returns null at max. */
    getNextLevelXP: function () {
      return _state ? xpForNextLevel(calcLevel(_state.xp)) : LEVEL_THRESHOLDS[1];
    },

    /** Derive behavioral tags from observations. */
    getTags: function () {
      return _state ? deriveTags(_state.observations) : [];
    },

    /** Get an appropriate greeting based on state + observations. */
    getGreeting: function (playerName) {
      if (!_state) return '';
      var arch = _state.archetype || 'steward';
      var bank = GREETINGS[arch] || GREETINGS.steward;
      var vp   = _state.observations.visit_pattern || {};

      var vars = {
        name:   _state.name,
        player: playerName || 'Governor',
        visits: vp.total || 1,
        days:   vp.streak || 1
      };

      // First visit
      if (vp.total <= 1) {
        return fillTemplate(bank.first, vars);
      }

      // Streak
      if (vp.streak >= 3) {
        return fillTemplate(bank.streak, vars);
      }

      // Long absence (7+ days)
      if (vp.last_visit && Date.now() - vp.last_visit > 7 * 86400000) {
        var absentDays = Math.floor((Date.now() - vp.last_visit) / 86400000);
        vars.days = absentDays;
        return fillTemplate(bank.absence, vars);
      }

      // Normal returning
      var idx = (vp.total - 1) % bank.returning.length;
      return fillTemplate(bank.returning[idx], vars);
    },

    /** Get the archetype info. */
    getArchetype: function () {
      if (!_state) return null;
      return ARCHETYPES[_state.archetype] || null;
    },

    /** Get avatar image path for current advisor. */
    getAvatarImage: function () {
      if (!_state) return '';
      var entry = getAdvisorNameById(_state.nameId);
      return entry ? getAdvisorAvatar(entry) : '';
    },

    /** Get the full current state (read-only copy). */
    getState: function () {
      return _state ? JSON.parse(JSON.stringify(_state)) : null;
    },

    /** Get current FID. */
    getFid: function () {
      return _fid;
    },

    /** Register an event listener. Events: 'xp', 'levelup', 'created'. */
    on: function (event, callback) {
      if (!_listeners[event]) _listeners[event] = [];
      _listeners[event].push(callback);
    },

    /** Remove an event listener. */
    off: function (event, callback) {
      if (!_listeners[event]) return;
      _listeners[event] = _listeners[event].filter(function (cb) { return cb !== callback; });
    }
  };

  // ── Auto-init on page load ────────────────
  function autoInit() {
    var lastFid = '';
    try { lastFid = localStorage.getItem('ksp_last_fid') || ''; } catch (e) {}
    if (!lastFid) return;

    var loaded = Advisor.load(lastFid);
    if (loaded) {
      Advisor.processDailyVisit();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    autoInit();
  }

  // ── Export ────────────────────────────────
  window.Advisor = Advisor;
})();

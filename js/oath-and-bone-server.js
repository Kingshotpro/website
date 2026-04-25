/**
 * oath-and-bone-server.js — thin HTTP client over the four
 * Worker 23 oath-and-bone server-state endpoints.
 *
 * Exposes window.OathAndBoneServer = { save, load, spend, recordBattleResult }.
 * Worker 22 (client persistence) wires this into the engine; this file
 * does NOT reach into the renderer or engine itself.
 *
 * All four endpoints require a ksp_session cookie and a linked user.fid
 * on the server-side user record. Anonymous players (no cookie, or cookie
 * but no fid) get 401/400 — Worker 22 falls back to localStorage in that
 * case.
 *
 * Endpoint contracts mirror the server (see worker.js handlers and
 * games/designs/oath-and-bone/SERVER_PERSIST_LOG.md).
 */
(function () {
  'use strict';

  var API = 'https://kingshotpro-api.kingshotpro.workers.dev';

  // Internal — uniform fetch with credentials + JSON body. Returns the
  // parsed JSON response or throws on network/parse error. Server error
  // responses (non-2xx) DO resolve normally — caller checks res.ok or
  // res.error so it can distinguish HTTP 402 insufficient_crowns (a
  // gameplay outcome) from HTTP 500 (a real failure).
  function request(method, path, body) {
    var init = {
      method: method,
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    };
    if (body !== undefined) init.body = JSON.stringify(body);

    return fetch(API + path, init).then(function (r) {
      var status = r.status;
      return r.json().then(function (data) {
        // Pass through both: caller may want the status code (e.g. 401
        // → prompt sign-in, 402 → show "not enough Crowns" UI).
        data.__status = status;
        return data;
      }).catch(function () {
        return { __status: status, error: 'invalid_response' };
      });
    });
  }

  // POST /oath-and-bone/save — persist the canonical save document.
  // state: full save object — { hero_state, crown_balance, equipped,
  // learned_spells, fallen_heroes, current_chapter, current_battle, ... }
  // Returns: { ok, last_save_iso, version } | { error, missing? }
  function save(state) {
    return request('POST', '/oath-and-bone/save', { state: state });
  }

  // GET /oath-and-bone/load — return the player's save state.
  // Returns: { ok, state, first_load } | { error }
  function load() {
    return request('GET', '/oath-and-bone/load');
  }

  // POST /oath-and-bone/spend — debit Crown balance.
  // amount: integer > 0 (Crown amount to spend)
  // itemId: string (≤64 chars, audit identifier)
  // context: 'shop' | 'boost' | 'training'
  // Returns: { ok, new_balance, spend_id } | { error, amount?, balance? }
  function spend(amount, itemId, context) {
    return request('POST', '/oath-and-bone/spend', {
      amount: amount,
      item_id: itemId,
      context: context,
    });
  }

  // POST /oath-and-bone/battle-result — record a battle outcome.
  // Server appends to history, unions fallen heroes (permadeath enforced),
  // credits Crowns, and grants daily credit if Sergeant or Marshal first
  // win of day.
  //
  // result fields:
  //   scenarioId       string (e.g. 'B5')
  //   outcome          'victory' | 'defeat' | 'flee'
  //   heroesLost       string[] of hero ids
  //   xpEarned         integer ≥ 0 (≤ 1500)
  //   crownsEarned     integer ≥ 0 (≤ 1000)
  //   difficultyTier   'scout' | 'sergeant' | 'marshal'
  //
  // Returns: { ok, new_crown_balance, fallen_heroes, crown_credit_grant }
  // crown_credit_grant: null if no grant fired, else
  //   { granted, capped, daily_used, daily_cap, new_credit_balance,
  //     already_granted_for_event? }
  function recordBattleResult(result) {
    return request('POST', '/oath-and-bone/battle-result', {
      scenario_id:     result.scenarioId,
      result:          result.outcome,
      heroes_lost:     result.heroesLost || [],
      xp_earned:       result.xpEarned       || 0,
      crowns_earned:   result.crownsEarned   || 0,
      difficulty_tier: result.difficultyTier,
    });
  }

  window.OathAndBoneServer = {
    save: save,
    load: load,
    spend: spend,
    recordBattleResult: recordBattleResult,
  };
})();

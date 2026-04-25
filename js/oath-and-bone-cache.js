/**
 * oath-and-bone-cache.js — localStorage cache layer over Worker 23's
 * four server-state endpoints.
 *
 * Exposes window.OathAndBoneCache = {
 *   getState, setState, getCrownBalance,
 *   spend, recordBattleResult,
 *   syncFromServer, syncToServer,
 *   isOffline, getPendingWrites,
 *   saveBattleSnapshot, loadBattleSnapshot, clearBattleSnapshot
 * }
 *
 * Storage keys (all under localStorage, namespace ksp_oab_):
 *   ksp_oab_state              — cached oab_state JSON
 *   ksp_oab_history_<YYYY-MM>  — current month's battle history (read-mostly)
 *   ksp_oab_pending_writes     — array of unsynced state changes
 *   ksp_oab_last_sync_iso      — ISO timestamp of last successful server sync
 *   ksp_oab_battle_resume      — mid-battle snapshot (Concern 3)
 *
 * Sync strategy:
 *   - syncFromServer(): fetch server state → overwrite cache if server is newer
 *     (compare last_save_iso). If network fails, use cached state. If no cache,
 *     use default first-time-player state.
 *   - Every setState(): write to localStorage synchronously + debounce server save.
 *   - Debounce window: 500ms idle batches multiple changes into one save call.
 *   - Conflict: server wins. If server last_save_iso > cache, overwrite cache.
 *   - Crown spend: cache debit immediately; revert if server rejects.
 *   - pagehide: sendBeacon flush so closing tab doesn't lose progress.
 *   - focus: re-sync if cache is > 60s stale.
 *
 * Dependency: window.OathAndBoneServer (Worker 23). If absent, falls back to
 * localStorage-only mode (anonymous player / offline).
 */
(function () {
  'use strict';

  var NS          = 'ksp_oab_';
  var KEY_STATE   = NS + 'state';
  var KEY_PENDING = NS + 'pending_writes';
  var KEY_SYNC    = NS + 'last_sync_iso';
  var KEY_RESUME  = NS + 'battle_resume';

  var SNAPSHOT_VERSION = 1;
  var DEBOUNCE_MS      = 500;
  var OFFLINE_TTL_MS   = 30000;   // 30s
  var STALE_RESYNC_MS  = 60000;   // re-sync on focus if cache is > 60s old
  var RESUME_MAX_AGE   = 86400000; // 24h in ms

  // Server-authoritative default for first-time players. Must mirror
  // SERVER_PERSIST_LOG §2.2 default state (plus Worker 21's unlocked_scenarios).
  var DEFAULT_STATE = {
    hero_state:         {},
    crown_balance:      0,
    equipped:           {},
    learned_spells:     [],
    fallen_heroes:      [],
    current_chapter:    1,
    current_battle:     'b1',
    unlocked_scenarios: ['b1'],
    last_save_iso:      null,
    version:            0
  };

  // ── Module state ────────────────────────────────────────────────────────
  var _lastServerError = 0;   // Date.now() of last failed server call
  var _debounceTimer   = null;
  var _pendingWrites   = [];  // unsynced state changes (survives across page reloads via ls)

  // ── localStorage helpers ────────────────────────────────────────────────
  function lsGet(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  }
  function lsSet(key, val) {
    try { localStorage.setItem(key, val); return true; } catch (e) { return false; }
  }
  function lsRemove(key) {
    try { localStorage.removeItem(key); } catch (e) {}
  }

  function historyKey() {
    return NS + 'history_' + new Date().toISOString().slice(0, 7);
  }

  // ── PUBLIC: getState ────────────────────────────────────────────────────
  function getState() {
    var raw = lsGet(KEY_STATE);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch (e) { return null; }
  }

  // ── PUBLIC: setState ────────────────────────────────────────────────────
  // Write to localStorage synchronously; queue debounced server save.
  function setState(state) {
    if (!state || typeof state !== 'object') return;
    lsSet(KEY_STATE, JSON.stringify(state));
    _pendingWrites.push({ ts: Date.now() });
    lsSet(KEY_PENDING, JSON.stringify(_pendingWrites));
    _scheduleSave();
  }

  // ── PUBLIC: getCrownBalance ─────────────────────────────────────────────
  // Synchronous read from cache — fast path for UI.
  function getCrownBalance() {
    var st = getState();
    return st ? (typeof st.crown_balance === 'number' ? st.crown_balance : 0) : 0;
  }

  // ── PUBLIC: spend ────────────────────────────────────────────────────────
  // Optimistic cache debit + server validation; reverts on rejection.
  // Worker 24 (shop) should call this instead of OathAndBoneServer.spend().
  function spend(amount, itemId, ctx) {
    var st = getState();
    if (!st) {
      return Promise.reject(new Error('No game state loaded'));
    }

    var prevBalance = typeof st.crown_balance === 'number' ? st.crown_balance : 0;

    // Optimistic debit — instant UI feedback
    st.crown_balance = Math.max(0, prevBalance - amount);
    lsSet(KEY_STATE, JSON.stringify(st));

    if (!window.OathAndBoneServer || !window.OathAndBoneServer.spend) {
      // Server unavailable — revert
      st.crown_balance = prevBalance;
      lsSet(KEY_STATE, JSON.stringify(st));
      return Promise.reject(new Error('Server not available'));
    }

    return window.OathAndBoneServer.spend(amount, itemId, ctx).then(function (res) {
      if (res && res.ok) {
        // Server authoritative balance replaces our optimistic debit
        var cur = getState() || st;
        cur.crown_balance = res.new_balance;
        lsSet(KEY_STATE, JSON.stringify(cur));
        _lastServerError = 0;
        return res;
      } else {
        // Server rejected — revert the debit
        var cur2 = getState() || st;
        cur2.crown_balance = prevBalance;
        lsSet(KEY_STATE, JSON.stringify(cur2));
        _lastServerError = Date.now();
        if (res && res.__status === 402) {
          _toast('Not enough Crowns. Balance: ' + (typeof res.balance === 'number' ? res.balance : prevBalance));
        } else {
          _toast('Spend failed: ' + ((res && res.error) || 'server error'));
        }
        return res;
      }
    }).catch(function (e) {
      var cur3 = getState() || st;
      cur3.crown_balance = prevBalance;
      lsSet(KEY_STATE, JSON.stringify(cur3));
      _lastServerError = Date.now();
      _toast('Network error — Crown spend could not be processed.');
      throw e;
    });
  }

  // ── PUBLIC: recordBattleResult ───────────────────────────────────────────
  // Writes to local history immediately; forwards to server; updates cache
  // with server-authoritative values on success.
  function recordBattleResult(result) {
    // Local history write — player sees their history immediately
    var hk   = historyKey();
    var hist = [];
    try { hist = JSON.parse(lsGet(hk) || '[]'); } catch (e) {}
    hist.push(Object.assign({}, result, { ts: Date.now() }));
    lsSet(hk, JSON.stringify(hist));

    if (!window.OathAndBoneServer || !window.OathAndBoneServer.recordBattleResult) {
      return Promise.reject(new Error('Server not available'));
    }

    return window.OathAndBoneServer.recordBattleResult(result).then(function (res) {
      if (res && res.ok) {
        // Merge server-authoritative fields into local cache
        var st = getState();
        if (st) {
          if (typeof res.new_crown_balance === 'number') {
            st.crown_balance = res.new_crown_balance;
          }
          if (Array.isArray(res.fallen_heroes)) {
            st.fallen_heroes = res.fallen_heroes;
          }
          // Worker 21 additions — server returns updated unlock chain on victory
          if (Array.isArray(res.unlocked_scenarios)) {
            st.unlocked_scenarios = res.unlocked_scenarios;
          }
          if (res.current_battle) {
            st.current_battle = res.current_battle;
          }
          lsSet(KEY_STATE, JSON.stringify(st));
        }
        _lastServerError = 0;
      } else {
        _lastServerError = Date.now();
      }
      return res;
    }).catch(function (e) {
      _lastServerError = Date.now();
      throw e;
    });
  }

  // ── PUBLIC: syncFromServer ───────────────────────────────────────────────
  // Pulls fresh state from server; overwrites cache when server is newer.
  // Returns the authoritative state (server, cached, or default).
  function syncFromServer() {
    if (!window.OathAndBoneServer || !window.OathAndBoneServer.load) {
      return Promise.resolve(getState() || _defaultState());
    }

    return window.OathAndBoneServer.load().then(function (res) {
      if (res && res.ok && res.state) {
        var serverState = res.state;
        var cached      = getState();

        // Conflict resolution: server wins if it has a newer last_save_iso
        // (or if there is no local cache).
        var serverIsNewer = !cached ||
          !cached.last_save_iso ||
          (serverState.last_save_iso &&
            serverState.last_save_iso > cached.last_save_iso);

        if (serverIsNewer) {
          lsSet(KEY_STATE, JSON.stringify(serverState));
          // Clear pending writes — server is now ahead of any queued changes
          _pendingWrites = [];
          lsSet(KEY_PENDING, JSON.stringify([]));
        }

        lsSet(KEY_SYNC, new Date().toISOString());
        _lastServerError = 0;
        return serverIsNewer ? serverState : cached;

      } else if (res && (res.__status === 401 || res.__status === 400)) {
        // Anonymous player or no FID linked — use cache or default.
        // Not an error condition; just means no server-side save.
        _lastServerError = 0;
        _showSignInBanner();
        return getState() || _defaultState();

      } else {
        // Server error or unexpected response
        _lastServerError = Date.now();
        return getState() || _defaultState();
      }
    }).catch(function () {
      _lastServerError = Date.now();
      return getState() || _defaultState();
    });
  }

  // ── PUBLIC: syncToServer ─────────────────────────────────────────────────
  // Pushes the current cached state to the server. Requeues on failure.
  function syncToServer() {
    if (!window.OathAndBoneServer || !window.OathAndBoneServer.save) {
      return Promise.resolve();
    }
    var st = getState();
    if (!st) return Promise.resolve();

    // Drain the pending queue — one save covers all queued changes
    var hadPending = _pendingWrites.length > 0;
    _pendingWrites = [];
    lsSet(KEY_PENDING, JSON.stringify([]));

    if (!hadPending) return Promise.resolve();

    return window.OathAndBoneServer.save(st).then(function (res) {
      if (res && res.ok) {
        lsSet(KEY_SYNC, new Date().toISOString());
        // Update cache with server-assigned last_save_iso + version
        var cur = getState();
        if (cur) {
          if (res.last_save_iso) cur.last_save_iso = res.last_save_iso;
          if (typeof res.version === 'number') cur.version = res.version;
          lsSet(KEY_STATE, JSON.stringify(cur));
        }
        _lastServerError = 0;
      } else {
        _lastServerError = Date.now();
        // Re-queue so the next debounce cycle retries
        if (st) {
          _pendingWrites.push({ ts: Date.now() });
          lsSet(KEY_PENDING, JSON.stringify(_pendingWrites));
        }
      }
    }).catch(function () {
      _lastServerError = Date.now();
      if (st) {
        _pendingWrites.push({ ts: Date.now() });
        lsSet(KEY_PENDING, JSON.stringify(_pendingWrites));
      }
    });
  }

  // ── PUBLIC: isOffline ────────────────────────────────────────────────────
  function isOffline() {
    if (!_lastServerError) return false;
    return (Date.now() - _lastServerError) < OFFLINE_TTL_MS;
  }

  // ── PUBLIC: getPendingWrites ─────────────────────────────────────────────
  function getPendingWrites() {
    return _pendingWrites.slice();
  }

  // ── PUBLIC: saveBattleSnapshot ───────────────────────────────────────────
  // Wraps the raw engine snapshot with a version tag + timestamp.
  function saveBattleSnapshot(engineSnapshot) {
    var wrapped = {
      version:  SNAPSHOT_VERSION,
      ts:       new Date().toISOString(),
      battle:   engineSnapshot
    };
    lsSet(KEY_RESUME, JSON.stringify(wrapped));
  }

  // ── PUBLIC: loadBattleSnapshot ───────────────────────────────────────────
  // Returns the wrapped snapshot object ({ version, ts, battle }) or null if:
  //   - nothing stored
  //   - snapshot is > 24h old
  //   - snapshot version doesn't match SNAPSHOT_VERSION (state shape changed)
  function loadBattleSnapshot() {
    var raw = lsGet(KEY_RESUME);
    if (!raw) return null;
    try {
      var wrapped = JSON.parse(raw);
      if (!wrapped || wrapped.version !== SNAPSHOT_VERSION) {
        lsRemove(KEY_RESUME);
        return null;
      }
      var age = Date.now() - new Date(wrapped.ts).getTime();
      if (age > RESUME_MAX_AGE) {
        lsRemove(KEY_RESUME);
        return null;
      }
      return wrapped;
    } catch (e) {
      lsRemove(KEY_RESUME);
      return null;
    }
  }

  // ── PUBLIC: clearBattleSnapshot ─────────────────────────────────────────
  function clearBattleSnapshot() {
    lsRemove(KEY_RESUME);
  }

  // ── Private helpers ──────────────────────────────────────────────────────

  function _defaultState() {
    return JSON.parse(JSON.stringify(DEFAULT_STATE));
  }

  function _scheduleSave() {
    if (_debounceTimer) clearTimeout(_debounceTimer);
    _debounceTimer = setTimeout(syncToServer, DEBOUNCE_MS);
  }

  function _toast(msg) {
    try {
      var el = document.createElement('div');
      el.style.cssText = [
        'position:fixed', 'bottom:20px', 'left:50%',
        'transform:translateX(-50%)',
        'background:#8b1010', 'color:#fff',
        'padding:10px 22px', 'border-radius:4px',
        'z-index:10000', 'font-family:sans-serif', 'font-size:13px',
        'pointer-events:none', 'max-width:340px', 'text-align:center'
      ].join(';');
      el.textContent = msg;
      document.body.appendChild(el);
      setTimeout(function () {
        if (el.parentNode) el.parentNode.removeChild(el);
      }, 4000);
    } catch (e) {}
  }

  var _bannerShown = false;
  function _showSignInBanner() {
    if (_bannerShown) return;
    if (typeof document === 'undefined') return;
    _bannerShown = true;
    try {
      if (document.getElementById('oab-signin-banner')) return;
      var banner = document.createElement('div');
      banner.id = 'oab-signin-banner';
      banner.style.cssText = [
        'position:fixed', 'top:0', 'left:0', 'right:0',
        'background:#182848', 'border-bottom:2px solid #3a5a9a',
        'padding:10px 20px', 'text-align:center',
        'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
        'font-size:12px', 'color:#c0d4f0', 'z-index:9998'
      ].join(';');
      banner.innerHTML = 'Sign in to save progress across devices \u2192 ' +
        '<a href="/auth/login" style="color:#f0c040;font-weight:700">Sign in</a>';
      if (document.body) document.body.insertBefore(banner, document.body.firstChild);
    } catch (e) {}
  }

  // ── Event listeners ──────────────────────────────────────────────────────

  // pagehide: flush pending writes synchronously via sendBeacon so closing
  // the tab doesn't lose a queued save. sendBeacon sends cookies automatically.
  window.addEventListener('pagehide', function () {
    if (_debounceTimer) {
      clearTimeout(_debounceTimer);
      _debounceTimer = null;
    }
    var st = getState();
    if (!st || !_pendingWrites.length) return;

    var API = 'https://kingshotpro-api.kingshotpro.workers.dev';
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      var blob = new Blob(
        [JSON.stringify({ state: st })],
        { type: 'application/json' }
      );
      navigator.sendBeacon(API + '/oath-and-bone/save', blob);
      _pendingWrites = [];
      lsSet(KEY_PENDING, JSON.stringify([]));
    } else {
      // Fallback: best-effort sync (may not complete if tab closes quickly)
      syncToServer();
    }
  });

  // focus: re-sync if cache is stale (> 60s since last successful sync)
  window.addEventListener('focus', function () {
    var lastSync = lsGet(KEY_SYNC);
    if (!lastSync) return; // never synced → syncFromServer() during init handled it
    var age = Date.now() - new Date(lastSync).getTime();
    if (age < STALE_RESYNC_MS) return;
    syncFromServer().then(function (freshState) {
      if (freshState && window.OathAndBone && window.OathAndBone.currentState) {
        window.OathAndBone.currentState = freshState;
      }
    });
  });

  // ── Init: restore pending writes from localStorage ───────────────────────
  try {
    var saved = JSON.parse(lsGet(KEY_PENDING) || '[]');
    if (Array.isArray(saved)) _pendingWrites = saved;
  } catch (e) {}

  // If there were pending writes from a previous page load (e.g. sendBeacon
  // failed), schedule a flush now.
  if (_pendingWrites.length) {
    _scheduleSave();
  }

  // ── Public API ───────────────────────────────────────────────────────────
  window.OathAndBoneCache = {
    getState:             getState,
    setState:             setState,
    getCrownBalance:      getCrownBalance,
    spend:                spend,
    recordBattleResult:   recordBattleResult,
    syncFromServer:       syncFromServer,
    syncToServer:         syncToServer,
    isOffline:            isOffline,
    getPendingWrites:     getPendingWrites,
    saveBattleSnapshot:   saveBattleSnapshot,
    loadBattleSnapshot:   loadBattleSnapshot,
    clearBattleSnapshot:  clearBattleSnapshot
  };

}());

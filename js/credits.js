/**
 * credits.js — Credit balance, Pro badge, and kingdom request system
 * KingshotPro
 *
 * Fetches user state on page load (tier, credits).
 * Renders credit pill in topbar, Pro badge next to nickname.
 * Provides requestKingdom() for kingdom request buttons.
 */
(function () {
  'use strict';

  var API = 'https://kingshotpro-api.kingshotpro.workers.dev';
  var state = { tier: 'free', credits: 0, fid: '', loaded: false };

  function fetchUserState() {
    fetch(API + '/credits/balance', { credentials: 'include' })
      .then(function (r) {
        if (!r.ok) return null;
        return r.json();
      })
      .then(function (data) {
        if (!data) {
          // Not logged in (401) — apply paywall as free
          applyKingdomPaywall();
          return;
        }
        state.tier = data.tier || 'free';
        state.credits = data.balance || 0;
        state.fid = data.fid || '';
        state.loaded = true;

        // Sync tier to localStorage so other scripts (advisor-cta) can read it
        try { localStorage.setItem('ksp_tier', state.tier); } catch (e) {}

        renderCreditPill();
        renderProBadge();
        applyKingdomPaywall();
        revealProFeatures();
      })
      .catch(function () {
        // Network error — apply paywall as free
        applyKingdomPaywall();
      });
  }

  function renderCreditPill() {
    var el = document.getElementById('tb-credits');
    if (!el) return;
    el.style.display = 'inline-flex';
    el.textContent = '\u26A1 ' + state.credits;
    el.title = state.credits + ' credits';
  }

  function renderProBadge() {
    if (state.tier !== 'pro') return;
    var nick = document.querySelector('.tb-nick');
    if (!nick) return;
    // Don't double-add
    if (nick.querySelector('.tb-pro-badge')) return;
    var badge = document.createElement('span');
    badge.className = 'tb-pro-badge';
    badge.textContent = 'PRO';
    nick.appendChild(badge);
  }

  // Reveal Pro-only UI sections (chat export on profile page, etc.)
  function revealProFeatures() {
    if (state.tier !== 'pro') return;
    var exportSection = document.getElementById('chat-export-section');
    if (exportSection) exportSection.style.display = 'block';
  }

  // Kingdom detail page paywall — blur Players and Events panels for free users
  function applyKingdomPaywall() {
    if (state.tier === 'pro') return;
    var playerPanel = document.getElementById('player-panel');
    var eventPanel = document.getElementById('event-panel');
    if (!playerPanel || !eventPanel) return; // not on a kingdom detail page

    [playerPanel, eventPanel].forEach(function (panel) {
      // Wrap existing content in a blurred container
      var wrapper = document.createElement('div');
      wrapper.style.cssText = 'position:relative;';
      var blur = document.createElement('div');
      blur.style.cssText = 'filter:blur(6px);pointer-events:none;user-select:none;opacity:0.4;';
      while (panel.firstChild) blur.appendChild(panel.firstChild);
      wrapper.appendChild(blur);

      // Overlay with upgrade prompt
      var overlay = document.createElement('div');
      overlay.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center;z-index:10;padding:24px;background:var(--surface-2);border:1px solid var(--gold);border-radius:12px;max-width:320px;';
      overlay.innerHTML =
        '<div style="font-size:28px;margin-bottom:8px;">🔒</div>' +
        '<div style="color:var(--text);font-weight:700;font-size:15px;margin-bottom:8px;">Pro Feature</div>' +
        '<div style="color:var(--text-muted);font-size:13px;margin-bottom:16px;">Player rankings and event data require a Pro subscription.</div>' +
        '<a href="' + (window.location.pathname.indexOf('/kingdoms/') !== -1 ? '../../pricing.html' : 'pricing.html') + '" style="display:inline-block;padding:10px 24px;background:var(--gold);color:var(--bg);border-radius:8px;font-weight:700;font-size:14px;text-decoration:none;">Upgrade to Pro — $4.99/mo</a>';
      wrapper.appendChild(overlay);
      panel.appendChild(wrapper);
    });
  }

  // Expose for kingdom request buttons
  window.KSP_CREDITS = {
    getState: function () { return state; },
    requestKingdom: function (type, kingdom, callback) {
      if (!state.loaded) {
        callback({ error: 'not_loaded', message: 'Please log in to request kingdoms.' });
        return;
      }
      var cost = type === 'add' ? 5 : 3;
      if (state.credits < cost) {
        callback({ error: 'insufficient_credits', message: 'You need ' + cost + ' credits. You have ' + state.credits + '.', balance: state.credits, cost: cost });
        return;
      }
      fetch(API + '/kingdom/request', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: type, kingdom: kingdom })
      })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (data.error) {
            callback(data);
            return;
          }
          state.credits = data.balance;
          renderCreditPill();
          callback({ ok: true, balance: data.balance });
        })
        .catch(function () {
          callback({ error: 'network', message: 'Network error. Try again.' });
        });
    },
    exportChat: function (callback) {
      fetch(API + '/advisor/history', { credentials: 'include' })
        .then(function (r) {
          if (!r.ok) throw new Error('not authorized');
          return r.json();
        })
        .then(function (data) { callback(data); })
        .catch(function () { callback({ error: 'Failed to export. Are you logged in as Pro?' }); });
    },
    /**
     * unlockWorldChat(kingdomId, snapshotId, callback)
     *
     * Spends 1 credit to unlock a single world-chat snapshot. The server
     * records the unlock per-user so it persists across devices; the
     * client also stores a localStorage flag for instant UI response.
     *
     * Worker endpoint: POST /worldchat/unlock { kingdom, snapshot }
     * Response:        { ok, balance } on success, { error, cost?, balance? } on failure.
     */
    unlockWorldChat: function (kingdomId, snapshotId, callback) {
      if (!state.loaded) {
        callback({ error: 'not_loaded', message: 'Please log in to unlock world chat.' });
        return;
      }
      var cost = 1;
      if (state.credits < cost) {
        callback({
          error:   'insufficient_credits',
          message: 'You need ' + cost + ' credit. You have ' + state.credits + '.',
          balance: state.credits,
          cost:    cost,
        });
        return;
      }
      fetch(API + '/worldchat/unlock', {
        method:      'POST',
        credentials: 'include',
        headers:     { 'Content-Type': 'application/json' },
        body:        JSON.stringify({ kingdom: kingdomId, snapshot: snapshotId }),
      })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (data.error) { callback(data); return; }
          state.credits = data.balance;
          renderCreditPill();
          callback({ ok: true, balance: data.balance });
        })
        .catch(function () {
          callback({ error: 'network', message: 'Network error. Try again.' });
        });
    }
  };

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fetchUserState);
  } else {
    fetchUserState();
  }
})();

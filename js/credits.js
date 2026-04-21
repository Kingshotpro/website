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

  // ── Kingdom intel unlocks (time-boxed via credits) ───────────────
  // Credits buy a time-limited unlock for one kingdom's intelligence panels.
  // Pro subscription bypasses the paywall entirely.
  //
  // localStorage: ksp_intel_{kid}_until = unix_seconds_expiry
  function getIntelExpiry(kid) {
    try {
      var raw = localStorage.getItem('ksp_intel_' + kid + '_until');
      return raw ? parseInt(raw, 10) : 0;
    } catch (e) { return 0; }
  }
  function setIntelExpiry(kid, expirySeconds) {
    try { localStorage.setItem('ksp_intel_' + kid + '_until', String(expirySeconds)); } catch (e) {}
  }
  function intelIsUnlocked(kid) {
    return getIntelExpiry(kid) > Math.floor(Date.now() / 1000);
  }
  function intelRemainingHuman(kid) {
    var secs = getIntelExpiry(kid) - Math.floor(Date.now() / 1000);
    if (secs <= 0)            return '';
    if (secs < 3600)          return Math.floor(secs / 60) + 'm left';
    if (secs < 86400)         return Math.floor(secs / 3600) + 'h left';
    return Math.floor(secs / 86400) + 'd left';
  }

  // Intel unlock pricing — keep in sync with Worker + pricing.html
  var INTEL_UNLOCK_OPTIONS = [
    { credits: 1, duration: 86_400,     label: '24 hours' },
    { credits: 3, duration: 604_800,    label: '7 days'   },
    { credits: 8, duration: 2_592_000,  label: '30 days'  },
  ];

  // Derive kingdom ID from the current URL. Format: /kingdoms/{id}/ or /kingdoms/{id}/index.html
  function currentKingdomId() {
    var m = window.location.pathname.match(/\/kingdoms\/(\d+)\b/);
    return m ? parseInt(m[1], 10) : null;
  }

  // Path prefix to pricing page (works from any depth)
  function pricingHref() {
    var base = (window.KSP_BASE || '');
    return base + 'pricing.html';
  }

  function applyKingdomPaywall() {
    var kid = currentKingdomId();
    if (kid === null) return;  // not a kingdom detail page

    // Pro subscription: unlock permanently, no action needed.
    if (state.tier === 'pro') return;

    // Time-boxed credit unlock active? Show panels, plus a tiny "Xh left" pill.
    if (intelIsUnlocked(kid)) {
      renderIntelStatusPill(kid);
      return;
    }

    var playerPanel = document.getElementById('player-panel');
    var eventPanel  = document.getElementById('event-panel');
    if (!playerPanel || !eventPanel) return;

    [playerPanel, eventPanel].forEach(function (panel) {
      if (panel.getAttribute('data-paywalled') === '1') return; // idempotent
      panel.setAttribute('data-paywalled', '1');

      var wrapper = document.createElement('div');
      wrapper.style.cssText = 'position:relative;min-height:320px;';

      var blur = document.createElement('div');
      blur.style.cssText = 'filter:blur(6px);pointer-events:none;user-select:none;opacity:0.4;';
      while (panel.firstChild) blur.appendChild(panel.firstChild);
      wrapper.appendChild(blur);

      var overlay = document.createElement('div');
      overlay.className = 'ksp-paywall';
      overlay.innerHTML = buildPaywallHTML(kid);
      wrapper.appendChild(overlay);
      panel.appendChild(wrapper);

      wireUnlockButtons(overlay, kid, panel);
    });
  }

  function buildPaywallHTML(kid) {
    var balance = state.credits;
    var optionsHtml = INTEL_UNLOCK_OPTIONS.map(function (opt) {
      var affordable = balance >= opt.credits;
      var cls = 'ksp-unlock-btn' + (affordable ? '' : ' disabled');
      var costClass = affordable ? '' : 'style="opacity:0.55"';
      return (
        '<button type="button" class="' + cls + '" data-credits="' + opt.credits + '" data-duration="' + opt.duration + '" ' + costClass + '>' +
          '<div class="ksp-unlock-duration">' + opt.label + '</div>' +
          '<div class="ksp-unlock-cost">\u26A1 ' + opt.credits + ' credit' + (opt.credits === 1 ? '' : 's') + '</div>' +
        '</button>'
      );
    }).join('');

    return (
      '<div class="ksp-paywall-inner">' +
        '<div class="ksp-paywall-lock">\u{1F512}</div>' +
        '<div class="ksp-paywall-title">KvK Intelligence \u00B7 Kingdom ' + kid + '</div>' +
        '<div class="ksp-paywall-sub">Player rankings, kill counts, hero & pet power, Mystic Trial standings, Rebel Conquest stages. Everything you need to scout this kingdom.</div>' +

        '<div class="ksp-paywall-section-label">Unlock with credits (this kingdom only)</div>' +
        '<div class="ksp-paywall-options">' + optionsHtml + '</div>' +
        '<div class="ksp-paywall-balance">Your balance: \u26A1 ' + balance + ' credit' + (balance === 1 ? '' : 's') +
          ' \u00B7 <a href="' + pricingHref() + '">Buy more</a></div>' +

        '<div class="ksp-paywall-or">\u2014 or \u2014</div>' +

        '<a class="ksp-paywall-pro" href="' + pricingHref() + '">Go Pro \u2192 every kingdom, unlimited</a>' +
      '</div>'
    );
  }

  function wireUnlockButtons(overlay, kid, panel) {
    var buttons = overlay.querySelectorAll('.ksp-unlock-btn');
    buttons.forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        if (btn.classList.contains('disabled')) {
          window.location.href = pricingHref();
          return;
        }
        var credits  = parseInt(btn.getAttribute('data-credits'),  10);
        var duration = parseInt(btn.getAttribute('data-duration'), 10);
        if (!state.loaded) {
          alert('Please enter your Player ID on the homepage to use credits.');
          return;
        }
        if (state.credits < credits) {
          window.location.href = pricingHref();
          return;
        }
        btn.disabled = true;
        btn.classList.add('loading');
        window.KSP_CREDITS.unlockKingdomIntel(kid, duration, credits, function (res) {
          btn.disabled = false;
          btn.classList.remove('loading');
          if (res.ok) {
            var expiry = Math.floor(Date.now() / 1000) + duration;
            setIntelExpiry(kid, expiry);
            // Wipe the blurred wrapper + paywall so panels show cleanly
            panel.removeAttribute('data-paywalled');
            panel.innerHTML = '';
            // Hard reload to let the page re-render its panels fresh
            window.location.reload();
          } else if (res.error === 'insufficient_credits') {
            window.location.href = pricingHref();
          } else {
            alert(res.message || 'Unlock failed. Try again in a moment.');
          }
        });
      });
    });
  }

  function renderIntelStatusPill(kid) {
    if (document.getElementById('ksp-intel-pill')) return;
    var container = document.querySelector('.k-header-compact') || document.querySelector('.k-pagetabs');
    if (!container) return;
    var pill = document.createElement('div');
    pill.id = 'ksp-intel-pill';
    pill.style.cssText = 'display:inline-flex;align-items:center;gap:6px;padding:4px 10px;background:rgba(74,222,128,0.1);border:1px solid #4ade80;color:#4ade80;border-radius:6px;font-size:11px;font-weight:700;margin-left:8px;';
    pill.innerHTML = '\u2713 Intel Unlocked \u00B7 ' + intelRemainingHuman(kid);
    container.appendChild(pill);
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
     * unlockKingdomIntel(kid, durationSec, costCredits, callback)
     *
     * Spends credits to unlock a kingdom's KvK intelligence panels
     * (Players, Events — and any future panels that gate by kingdom)
     * for a specific duration. The expiry is kept client-side in
     * localStorage so the UI updates instantly; the Worker also
     * records the unlock server-side so reinstalling the browser
     * doesn't forfeit paid time.
     *
     * Worker endpoint: POST /intel/unlock-kingdom
     *   Body: { kingdom, duration_sec, cost_credits }
     *   Response: { ok, balance, expiry_sec } | { error, cost, balance }
     */
    unlockKingdomIntel: function (kid, durationSec, costCredits, callback) {
      if (!state.loaded) {
        callback({ error: 'not_loaded', message: 'Please log in to unlock intel.' });
        return;
      }
      if (state.credits < costCredits) {
        callback({
          error:   'insufficient_credits',
          message: 'You need ' + costCredits + ' credits. You have ' + state.credits + '.',
          balance: state.credits,
          cost:    costCredits,
        });
        return;
      }
      fetch(API + '/intel/unlock-kingdom', {
        method:      'POST',
        credentials: 'include',
        headers:     { 'Content-Type': 'application/json' },
        body:        JSON.stringify({
          kingdom:      kid,
          duration_sec: durationSec,
          cost_credits: costCredits,
        }),
      })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (data.error) { callback(data); return; }
          state.credits = data.balance;
          renderCreditPill();
          callback({ ok: true, balance: data.balance, expiry_sec: data.expiry_sec });
        })
        .catch(function () {
          callback({ error: 'network', message: 'Network error. Try again.' });
        });
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

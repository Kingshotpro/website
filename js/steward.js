/**
 * steward.js — The Steward advisor widget
 * KingshotPro | Phase 1 (rule-based, no API cost)
 *
 * Fixed bottom-right floating widget.
 * Collapsed: gold avatar button. Expanded: chat panel.
 * Wires into advisory.js ADVICE_TREE for personalized advice.
 *
 * Name is configurable — default "The Steward" per naming research.
 * Awaiting Architect approval; change ADVISOR_NAME to switch.
 */
(function () {
  'use strict';

  var ADVISOR_NAME = 'The Steward';
  var PROFILE_KEY  = 'ksp_profile';

  // ── State ─────────────────────────────────
  var expanded = false;
  var panel, bubble, messages;

  // ── Helpers ───────────────────────────────
  function esc(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function getProfile() {
    // Try localStorage first (persistent), then sessionStorage (fallback)
    try {
      var lastFid = localStorage.getItem('ksp_last_fid');
      if (lastFid) {
        var stored = localStorage.getItem('ksp_profile_' + lastFid);
        if (stored) return JSON.parse(stored);
      }
      var raw = sessionStorage.getItem(PROFILE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  // ── Build DOM ─────────────────────────────
  function buildWidget() {
    // Container
    var wrap = document.createElement('div');
    wrap.className = 'stw-wrap';
    wrap.id = 'steward';

    // Collapsed bubble
    bubble = document.createElement('button');
    bubble.className = 'stw-bubble';
    bubble.setAttribute('aria-label', 'Open ' + ADVISOR_NAME);
    bubble.innerHTML = '<span class="stw-bubble-icon">\u{1F451}</span>';
    wrap.appendChild(bubble);

    // Expanded panel
    panel = document.createElement('div');
    panel.className = 'stw-panel';
    panel.innerHTML =
      '<div class="stw-header">' +
        '<span class="stw-title">' + esc(ADVISOR_NAME) + '</span>' +
        '<button class="stw-close" aria-label="Close">\u00D7</button>' +
      '</div>' +
      '<div class="stw-messages" id="stw-messages"></div>';
    wrap.appendChild(panel);

    document.body.appendChild(wrap);
    messages = document.getElementById('stw-messages');

    // Events
    bubble.addEventListener('click', togglePanel);
    panel.querySelector('.stw-close').addEventListener('click', togglePanel);

    // Initial greeting
    greet();

    // Listen for profile changes (FID lookup triggers this)
    window.addEventListener('ksp:profile', function () { greet(); });
  }

  function togglePanel() {
    expanded = !expanded;
    var wrap = document.getElementById('steward');
    if (expanded) {
      wrap.classList.add('open');
      bubble.classList.add('hidden');
    } else {
      wrap.classList.remove('open');
      bubble.classList.remove('hidden');
    }
  }

  // ── Messages ──────────────────────────────
  function addMessage(text) {
    var msg = document.createElement('div');
    msg.className = 'stw-msg';
    msg.innerHTML = text;
    messages.appendChild(msg);
    messages.scrollTop = messages.scrollHeight;
  }

  function clearMessages() {
    if (messages) messages.innerHTML = '';
  }

  // ── Greet based on profile state ──────────
  function greet() {
    clearMessages();
    var profile = getProfile();

    if (!profile) {
      // No profile yet
      addMessage(
        'Greetings, Governor. I am ' + esc(ADVISOR_NAME) + '. ' +
        'Enter your FID above and I\u2019ll review your realm.'
      );
      return;
    }

    var name = esc(profile.nickname || 'Governor');
    var kid  = profile.kid || '?';
    var label = esc(profile.spendingLabel || 'Governor');

    if (profile.furnaceLevel && profile.furnaceLevel > 0) {
      // Full data
      addMessage(
        'Welcome back, <strong>' + name + '</strong>. ' +
        'You are a <strong>' + label + ' Governor</strong> in Kingdom ' + kid + '.'
      );
      // Advice from advisory.js
      var advice = window.KSP && window.KSP.getAdvice ? window.KSP.getAdvice(profile) : null;
      if (advice) {
        addMessage('<em>' + esc(advice.headline) + '</em>');
        var tipsHTML = '<div class="stw-tips">';
        for (var i = 0; i < advice.tips.length; i++) {
          tipsHTML += '<div class="stw-tip">' +
            '<strong>' + esc(advice.tips[i].title) + '</strong><br>' +
            '<span>' + esc(advice.tips[i].body) + '</span></div>';
        }
        tipsHTML += '</div>';
        addMessage(tipsHTML);
      }
    } else {
      // Partial data — no furnace
      addMessage(
        'Welcome back, <strong>' + name + '</strong>. ' +
        'I see you in Kingdom ' + kid + '.'
      );
      addMessage(
        'Tell me your Furnace level and I\u2019ll give you personalized guidance.'
      );
      // Quick furnace input inside widget
      addMessage(
        '<div class="stw-furnace-form">' +
          '<input type="number" id="stw-furnace" class="stw-input" ' +
            'placeholder="Furnace level" min="1" max="35">' +
          '<button class="btn btn-primary btn-sm stw-furnace-btn" id="stw-furnace-btn">Go</button>' +
        '</div>'
      );
      // Wire button after it's in DOM
      setTimeout(function () {
        var btn = document.getElementById('stw-furnace-btn');
        if (btn) btn.addEventListener('click', handleFurnaceInput);
      }, 0);
    }
  }

  function handleFurnaceInput() {
    var inp = document.getElementById('stw-furnace');
    if (!inp) return;
    var lv = parseInt(inp.value, 10);
    if (!lv || lv < 1 || lv > 35) return;

    // Update profile with furnace data
    var profile = getProfile();
    if (!profile) return;
    profile.furnaceLevel = lv;

    // Recalculate game stage
    if (lv < 15) {
      profile.gameStage = 'early';
      profile.stageLabel = 'Early Game';
    } else if (lv <= 21) {
      profile.gameStage = 'mid';
      profile.stageLabel = 'Mid Game';
    } else {
      profile.gameStage = 'late';
      profile.stageLabel = 'Late Game';
    }

    try { sessionStorage.setItem(PROFILE_KEY, JSON.stringify(profile)); } catch (e) {}

    // Re-greet with full data
    greet();

    // Update profile card on main page if it exists
    if (window.KSP && window.KSP.loadProfile) {
      var card = document.getElementById('profile-card');
      if (card && typeof renderProfileCard === 'function') {
        renderProfileCard(profile);
      }
    }
  }

  // ── Pulse animation for new content ───────
  function pulse() {
    bubble.classList.add('pulse');
    setTimeout(function () { bubble.classList.remove('pulse'); }, 2000);
  }

  // ── Init ──────────────────────────────────
  function init() {
    buildWidget();

    // Re-greet if profile is saved after page load (FID form submit)
    // fid.js writes to both localStorage and sessionStorage; poll sessionStorage for changes
    var lastProfile = sessionStorage.getItem(PROFILE_KEY);
    setInterval(function () {
      var current = sessionStorage.getItem(PROFILE_KEY);
      if (current !== lastProfile) {
        lastProfile = current;
        greet();
        if (!expanded) pulse();
      }
    }, 1000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

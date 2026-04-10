/**
 * steward.js — Advisor chat panel
 * KingshotPro | Phase 1
 *
 * Open by default on page load. Shows avatar image, welcome message,
 * and pre-selected response buttons for first interaction.
 * Minimizable to a compact bar. Persistent across pages.
 */
(function () {
  'use strict';

  var PROFILE_KEY = 'ksp_profile';

  // ── State ─────────────────────────────────
  var minimized = false;
  var wrap, chatBody, inputArea;

  // ── Helpers ───────────────────────────────
  function esc(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function getProfile() {
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

  function getAdvisorState() {
    if (window.Advisor && window.Advisor.getState) return window.Advisor.getState();
    return null;
  }

  function getAvatarSrc() {
    if (window.Advisor && window.Advisor.getAvatarImage) {
      var src = window.Advisor.getAvatarImage();
      if (src) return src;
    }
    // Default — pick based on page depth
    var inSub = /\/calculators\//.test(window.location.pathname);
    return (inSub ? '../' : '') + 'avatars/male_default.png';
  }

  function getAdvisorName() {
    var state = getAdvisorState();
    if (state && state.name) return state.name;
    return 'Your Advisor';
  }

  function getArchetypeTitle() {
    var state = getAdvisorState();
    if (state && window.Advisor && window.Advisor.ARCHETYPES) {
      var arch = window.Advisor.ARCHETYPES[state.archetype];
      if (arch) return arch.title;
    }
    return '';
  }

  // ── Build DOM ─────────────────────────────
  function buildWidget() {
    wrap = document.createElement('div');
    wrap.className = 'adv-chat';
    wrap.id = 'adv-chat';

    wrap.innerHTML =
      // Minimized bar
      '<div class="adv-chat-min" id="adv-chat-min">' +
        '<img class="adv-chat-min-img" id="adv-chat-min-img" src="' + getAvatarSrc() + '" alt="Advisor">' +
        '<span class="adv-chat-min-name" id="adv-chat-min-name">' + esc(getAdvisorName()) + '</span>' +
        '<span class="adv-chat-min-dot"></span>' +
        '<button class="adv-chat-expand" id="adv-chat-expand" aria-label="Open chat">\u25B2</button>' +
      '</div>' +
      // Full panel
      '<div class="adv-chat-panel" id="adv-chat-panel">' +
        '<div class="adv-chat-header">' +
          '<img class="adv-chat-avatar" id="adv-chat-avatar" src="' + getAvatarSrc() + '" alt="Advisor">' +
          '<div class="adv-chat-hdr-info">' +
            '<span class="adv-chat-hdr-name" id="adv-chat-hdr-name">' + esc(getAdvisorName()) + '</span>' +
            '<span class="adv-chat-hdr-title" id="adv-chat-hdr-title">' + esc(getArchetypeTitle()) + '</span>' +
          '</div>' +
          '<button class="adv-chat-minimize" id="adv-chat-minimize" aria-label="Minimize">\u2013</button>' +
        '</div>' +
        '<div class="adv-chat-body" id="adv-chat-body"></div>' +
        '<div class="adv-chat-input" id="adv-chat-input"></div>' +
      '</div>';

    document.body.appendChild(wrap);

    chatBody  = document.getElementById('adv-chat-body');
    inputArea = document.getElementById('adv-chat-input');

    // Events
    document.getElementById('adv-chat-minimize').addEventListener('click', minimize);
    document.getElementById('adv-chat-expand').addEventListener('click', expand);
    document.getElementById('adv-chat-min').addEventListener('click', function (e) {
      if (e.target.closest('#adv-chat-expand') || e.target.id === 'adv-chat-expand') return;
      expand();
    });

    // Start open
    wrap.classList.add('open');
    greet();

    // Poll for profile changes
    var lastProfile = sessionStorage.getItem(PROFILE_KEY);
    setInterval(function () {
      var current = sessionStorage.getItem(PROFILE_KEY);
      if (current !== lastProfile) {
        lastProfile = current;
        refreshAdvisorInfo();
        greet();
      }
    }, 1000);
  }

  function minimize() {
    minimized = true;
    wrap.classList.remove('open');
    wrap.classList.add('minimized');
  }

  function expand() {
    minimized = false;
    wrap.classList.add('open');
    wrap.classList.remove('minimized');
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  function refreshAdvisorInfo() {
    var name = getAdvisorName();
    var title = getArchetypeTitle();
    var src = getAvatarSrc();
    var el;

    el = document.getElementById('adv-chat-hdr-name');
    if (el) el.textContent = name;
    el = document.getElementById('adv-chat-hdr-title');
    if (el) el.textContent = title;
    el = document.getElementById('adv-chat-avatar');
    if (el) el.src = src;
    el = document.getElementById('adv-chat-min-img');
    if (el) el.src = src;
    el = document.getElementById('adv-chat-min-name');
    if (el) el.textContent = name;
  }

  // ── Messages ──────────────────────────────
  function addAdvisorMsg(html) {
    var row = document.createElement('div');
    row.className = 'adv-msg adv-msg-advisor';
    row.innerHTML = '<div class="adv-msg-bubble">' + html + '</div>';
    chatBody.appendChild(row);
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  function addUserMsg(text) {
    var row = document.createElement('div');
    row.className = 'adv-msg adv-msg-user';
    row.innerHTML = '<div class="adv-msg-bubble">' + esc(text) + '</div>';
    chatBody.appendChild(row);
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  function showQuickReplies(replies) {
    inputArea.innerHTML = '';
    var container = document.createElement('div');
    container.className = 'adv-quick-replies';

    for (var i = 0; i < replies.length; i++) {
      (function (reply) {
        var btn = document.createElement('button');
        btn.className = 'adv-quick-btn';
        btn.textContent = reply.label;
        btn.addEventListener('click', function () {
          addUserMsg(reply.label);
          inputArea.innerHTML = '';
          if (reply.action) reply.action();
        });
        container.appendChild(btn);
      })(replies[i]);
    }

    inputArea.appendChild(container);
  }

  // ── Greet ─────────────────────────────────
  function greet() {
    chatBody.innerHTML = '';
    inputArea.innerHTML = '';
    var profile = getProfile();
    var advState = getAdvisorState();

    if (profile && profile.furnaceLevel > 0 && advState) {
      // Returning player with advisor — personalized greeting
      var greeting = '';
      if (window.Advisor && window.Advisor.getGreeting) {
        greeting = window.Advisor.getGreeting(profile.nickname);
      }
      if (!greeting) {
        greeting = 'Welcome back, ' + esc(profile.nickname) + '.';
      }

      addAdvisorMsg(esc(greeting));

      // Show advice
      var advice = window.KSP && window.KSP.getAdvice ? window.KSP.getAdvice(profile) : null;
      if (advice) {
        setTimeout(function () {
          addAdvisorMsg('<em>' + esc(advice.headline) + '</em>');
          var html = '';
          for (var i = 0; i < advice.tips.length; i++) {
            html += '<div class="adv-tip">' +
              '<strong>' + esc(advice.tips[i].title) + '</strong><br>' +
              '<span>' + esc(advice.tips[i].body) + '</span></div>';
          }
          addAdvisorMsg(html);
        }, 400);
      }

      showQuickReplies([
        { label: 'What should I focus on today?', action: function () { showDailyFocus(profile); } },
        { label: 'Tell me about my kingdom', action: function () { showKingdomSummary(profile); } },
        { label: 'Open calculators', action: function () { window.location.href = 'calculators/building.html'; } }
      ]);

    } else if (profile && profile.furnaceLevel > 0) {
      // Has profile but no advisor yet — should go through selection
      addAdvisorMsg('Welcome, <strong>' + esc(profile.nickname) + '</strong>. I see your kingdom. Choose your advisor above to begin our work together.');

    } else {
      // No profile — first visit
      greetNewVisitor();
    }
  }

  function greetNewVisitor() {
    addAdvisorMsg(
      'Governor. You\'ve found something the other tools don\'t have \u2014 ' +
      'an advisor who learns your kingdom, tracks your progress, and gives you ' +
      'strategy built around <em>your</em> account. Not generic guides. <em>Yours.</em>'
    );

    setTimeout(function () {
      addAdvisorMsg('Let\'s start. What brings you here?');

      showQuickReplies([
        {
          label: '\u{1F50D} Help me find my Player ID',
          action: function () {
            addAdvisorMsg(
              '<strong>How to find your Player ID:</strong><br><br>' +
              '1. Open Kingshot<br>' +
              '2. Tap your <strong>avatar</strong> (top-left corner)<br>' +
              '3. Go to <strong>Settings \u2192 Player Info</strong><br>' +
              '4. Your ID is the number next to <strong>"FID"</strong> \u2014 usually 7\u201310 digits<br><br>' +
              'Enter it in the box above and I\'ll pull up everything about your account.'
            );
            showQuickReplies([
              { label: 'Got it, let me enter it now', action: function () { focusPlayerIdInput(); } },
              { label: 'I don\'t play Kingshot yet', action: function () { showNewPlayerWelcome(); } }
            ]);
          }
        },
        {
          label: '\u2694\uFE0F What can you do for me?',
          action: function () {
            addAdvisorMsg(
              'I can do things no other Kingshot site does:<br><br>' +
              '\u{1F451} <strong>Know your account</strong> \u2014 your furnace, spending, server age, all pulled instantly<br>' +
              '\u{1F4CA} <strong>36 calculators</strong> \u2014 buildings, troops, gear, heroes, events \u2014 all pre-filled with your data<br>' +
              '\u{1F9E0} <strong>Personalized advice</strong> \u2014 not guides written for everyone. Strategy built for your exact situation<br>' +
              '\u{1F3AE} <strong>Games & progression</strong> \u2014 I grow as you use the site. Level me up. I get smarter.<br><br>' +
              'Enter your Player ID above and I\'ll show you.'
            );
            showQuickReplies([
              { label: 'Let me enter my Player ID', action: function () { focusPlayerIdInput(); } },
              { label: 'Show me the calculators', action: function () {
                  var inSub = /\/calculators\//.test(window.location.pathname);
                  window.location.href = (inSub ? '' : 'calculators/') + 'building.html';
                }
              }
            ]);
          }
        },
        {
          label: '\u{1F331} I\'m new to Kingshot',
          action: function () { showNewPlayerWelcome(); }
        }
      ]);
    }, 800);
  }

  function showNewPlayerWelcome() {
    addAdvisorMsg(
      'Welcome to the realm. Kingshot is a medieval strategy game \u2014 you build a kingdom, ' +
      'train armies, and compete with other governors across servers.<br><br>' +
      'When you\'re ready, come back with your Player ID and I\'ll be here. ' +
      'In the meantime, the <strong>calculators</strong> and <strong>gift codes</strong> work for everyone.'
    );
    showQuickReplies([
      { label: '\u{1F381} Show me gift codes', action: function () {
          var inSub = /\/calculators\//.test(window.location.pathname);
          window.location.href = (inSub ? '../' : '') + 'codes.html';
        }
      },
      { label: '\u{1F4CA} Open calculators', action: function () {
          var inSub = /\/calculators\//.test(window.location.pathname);
          window.location.href = (inSub ? '' : 'calculators/') + 'building.html';
        }
      }
    ]);
  }

  function showDailyFocus(profile) {
    var advice = window.KSP && window.KSP.getAdvice ? window.KSP.getAdvice(profile) : null;
    if (advice && advice.tips && advice.tips[0]) {
      addAdvisorMsg(
        'Today\'s priority: <strong>' + esc(advice.tips[0].title) + '</strong><br><br>' +
        esc(advice.tips[0].body)
      );
    } else {
      addAdvisorMsg('Keep building. Consistency wins in this game.');
    }
  }

  function showKingdomSummary(profile) {
    addAdvisorMsg(
      '<strong>' + esc(profile.nickname) + '</strong> \u2014 ' +
      esc(profile.spendingLabel) + ' Governor<br>' +
      'Kingdom ' + (profile.kid || '?') + ' \u2014 ' + esc(profile.serverAgeLabel || '') + '<br>' +
      'Furnace Level ' + (profile.furnaceLevel || '?') + ' \u2014 ' + esc(profile.stageLabel || '') +
      (profile.dollars > 0 ? '<br>Lifetime investment: $' + profile.dollars.toFixed(0) : '')
    );
  }

  function focusPlayerIdInput() {
    var input = document.getElementById('fid-input');
    if (input) {
      input.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(function () { input.focus(); }, 400);
    }
    addAdvisorMsg('Enter your Player ID in the box above. I\'ll do the rest.');
  }

  // ── Init ──────────────────────────────────
  function init() {
    buildWidget();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

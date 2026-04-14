/**
 * advisor-orb.js — Living advisor orb + council chamber
 * KingshotPro | Phase 1
 *
 * The advisor appears as a breathing, glowing portrait circle.
 * Entry: materializes at center, speaks, glides to resting position.
 * Click: expands into full council chamber panel.
 * Portrait feels alive: breathing zoom, firelight flicker, mouse parallax.
 *
 * Replaces steward.js entirely.
 */
(function () {
  'use strict';

  // ── DOM refs ──────────────────────────────
  var orbWrap, orbCircle, orbImg, orbParallax;
  var speechBubble;
  var panel, panelImg, panelName, panelChat, panelInput, panelMinBtn;
  var backdrop;
  var engaged = false;
  var isMobile = window.innerWidth <= 640;

  // ── Helpers ───────────────────────────────
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function getProfile() {
    try {
      var fid = localStorage.getItem('ksp_last_fid');
      if (fid) { var s = localStorage.getItem('ksp_profile_' + fid); if (s) return JSON.parse(s); }
      var r = sessionStorage.getItem('ksp_profile');
      return r ? JSON.parse(r) : null;
    } catch (e) { return null; }
  }

  function getBase() {
    var p = location.pathname;
    // Hero + kingdom detail pages are 2 levels deep
    if ((/\/heroes\/[a-z]/.test(p) && !/\/heroes\.html/.test(p)) || /\/kingdoms\/\d/.test(p)) return '../../';
    return /\/calculators\/|\/games\/|\/guides\/|\/alliance\/|\/kingdoms\//.test(p) ? '../' : '';
  }

  function getAvatarSrc() {
    if (window.Advisor && window.Advisor.getAvatarImage) {
      var s = window.Advisor.getAvatarImage(); if (s) return s;
    }
    return getBase() + 'avatars/ysabel_v4.jpg';
  }

  function getIdleVideo() { return getBase() + 'avatars/ysabel_v4_web.mp4'; }
  function getGreetingVideo() { return getBase() + 'avatars/ysabel_v4_web.mp4'; }

  // Greeting plays once per page load — NOT cached across sessions
  var greetingPlayed = false;

  function getAdvisorName() {
    var st = window.Advisor && window.Advisor.getState ? window.Advisor.getState() : null;
    return st && st.name ? st.name : 'Your Advisor';
  }

  function getArchetypeTitle() {
    var st = window.Advisor && window.Advisor.getState ? window.Advisor.getState() : null;
    if (st && window.Advisor.ARCHETYPES) {
      var a = window.Advisor.ARCHETYPES[st.archetype];
      if (a) return a.title;
    }
    return '';
  }

  // ── Build DOM ─────────────────────────────
  function build() {
    var src = getAvatarSrc();
    var name = getAdvisorName();
    var title = getArchetypeTitle();

    // — Orb wrapper (holds circle + speech bubble, not clipped) —
    orbWrap = document.createElement('div');
    orbWrap.className = 'orb-wrap';
    orbWrap.id = 'orb-wrap';

    // The circle
    orbCircle = document.createElement('div');
    orbCircle.className = 'orb-circle';

    // Parallax layer (moves with mouse)
    orbParallax = document.createElement('div');
    orbParallax.className = 'orb-parallax';

    // Static image shows immediately (fast, always works)
    orbImg = document.createElement('img');
    orbImg.className = 'orb-img';
    orbImg.src = src;
    orbImg.alt = name;
    orbParallax.appendChild(orbImg);

    // Video overlays on top when loaded (317KB compressed — fine for all devices)
    {
      var orbVid = document.createElement('video');
      orbVid.className = 'orb-vid';
      orbVid.src = getBase() + 'avatars/ysabel_v4_web.mp4';
      orbVid.muted = true;
      orbVid.loop = true;
      orbVid.autoplay = true;
      orbVid.playsInline = true;
      orbVid.setAttribute('playsinline', '');
      orbVid.style.position = 'absolute';
      orbVid.style.top = '0';
      orbVid.style.left = '0';

      orbVid.addEventListener('canplay', function () {
        orbImg.style.display = 'none';
      });
      orbVid.addEventListener('error', function () {
        orbVid.style.display = 'none';
        orbImg.style.display = 'block';
      });

      orbParallax.appendChild(orbVid);
    }
    orbCircle.appendChild(orbParallax);
    orbWrap.appendChild(orbCircle);

    // Speech bubble (outside circle, not clipped)
    speechBubble = document.createElement('div');
    speechBubble.className = 'orb-speech';
    speechBubble.id = 'orb-speech';
    orbWrap.appendChild(speechBubble);

    // Mute/unmute toggle
    var muteBtn = document.createElement('button');
    muteBtn.className = 'orb-mute';
    muteBtn.innerHTML = '\u{1F50A}';
    muteBtn.setAttribute('aria-label', 'Toggle sound');
    var muted = false;
    try { muted = localStorage.getItem('ksp_muted') === '1'; } catch (e) {}
    if (muted) muteBtn.innerHTML = '\u{1F507}';
    muteBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      muted = !muted;
      muteBtn.innerHTML = muted ? '\u{1F507}' : '\u{1F50A}';
      try { localStorage.setItem('ksp_muted', muted ? '1' : '0'); } catch (e) {}
      window._kspMuted = muted;
    });
    window._kspMuted = muted;
    orbWrap.appendChild(muteBtn);

    orbCircle.addEventListener('click', function () {
      if (!engaged) expand();
    });

    document.body.appendChild(orbWrap);

    // — Backdrop —
    backdrop = document.createElement('div');
    backdrop.className = 'orb-backdrop';
    backdrop.addEventListener('click', minimize);
    document.body.appendChild(backdrop);

    // — Council chamber panel —
    panel = document.createElement('div');
    panel.className = 'orb-panel';
    panel.id = 'orb-panel';

    // Panel portrait — video with greeting on first open, idle loop after
    var panelHdr = document.createElement('div');
    panelHdr.className = 'orb-panel-portrait';
    panelHdr.id = 'orb-panel-portrait';

    var panelVid = document.createElement('video');
    panelVid.id = 'orb-panel-vid';
    panelVid.playsInline = true;
    panelVid.setAttribute('playsinline', '');
    panelVid.poster = src;
    panelVid.src = getIdleVideo();
    panelVid.muted = true;
    panelVid.loop = true;
    panelHdr.appendChild(panelVid);

    // Fallback image
    panelImg = document.createElement('img');
    panelImg.className = 'orb-img';
    panelImg.src = src;
    panelImg.style.display = 'none';
    panelHdr.appendChild(panelImg);

    panelVid.addEventListener('error', function () {
      panelVid.style.display = 'none';
      panelImg.style.display = 'block';
    });

    // Minimize button
    panelMinBtn = document.createElement('button');
    panelMinBtn.className = 'orb-panel-min';
    panelMinBtn.innerHTML = '&minus;';
    panelMinBtn.setAttribute('aria-label', 'Minimize');
    panelMinBtn.addEventListener('click', minimize);
    panelHdr.appendChild(panelMinBtn);

    panel.appendChild(panelHdr);

    // Name + title
    panelName = document.createElement('div');
    panelName.className = 'orb-panel-name';
    panelName.innerHTML = '<strong>' + esc(name) + '</strong>' + (title ? ' <span>' + esc(title) + '</span>' : '');
    panel.appendChild(panelName);

    // Chat area
    panelChat = document.createElement('div');
    panelChat.className = 'orb-panel-chat';
    panel.appendChild(panelChat);

    // Input area (quick replies go here)
    panelInput = document.createElement('div');
    panelInput.className = 'orb-panel-input';
    panel.appendChild(panelInput);

    document.body.appendChild(panel);

    // — Mouse parallax (desktop only) —
    if (!isMobile) {
      var px = 0, py = 0, tx = 0, ty = 0;
      document.addEventListener('mousemove', function (e) {
        tx = (window.innerWidth / 2 - e.clientX) / (window.innerWidth / 2) * 4;
        ty = (window.innerHeight / 2 - e.clientY) / (window.innerHeight / 2) * 3;
      });
      (function tick() {
        px += (tx - px) * 0.08;
        py += (ty - py) * 0.08;
        if (orbParallax) orbParallax.style.transform = 'translate(' + px.toFixed(2) + 'px,' + py.toFixed(2) + 'px)';
        requestAnimationFrame(tick);
      })();
    }
  }

  // ── Entry sequence ────────────────────────
  function runEntry() {
    var entered = false;
    try { entered = sessionStorage.getItem('ksp_orb_entered') === '1'; } catch (e) {}

    if (entered || isMobile) {
      // Returning visit — go directly to rest, greet by name
      orbWrap.classList.add('orb-at-rest');
      orbWrap.style.opacity = '1';
      setTimeout(function () {
        var greeting = 'I see you, Governor...';
        var profile = getProfile();
        var advState = getAdvisorState();
        if (profile && profile.nickname && advState && advState.name) {
          greeting = profile.nickname + '. ' + advState.name + ' is here.';
        } else if (profile && profile.nickname) {
          greeting = 'Welcome back, ' + profile.nickname + '.';
        }
        showSpeech(greeting + '<br><span class="orb-tap-hint">\u25B6 Tap</span>');
        setTimeout(hideSpeech, 5000);
      }, 1000);
      return;
    }

    // ── Full entrance choreography ──
    // She arrives. She floats. She beckons. She settles.

    orbWrap.classList.add('orb-at-center');

    // 1. Fade in while floating at center
    requestAnimationFrame(function () {
      orbWrap.style.opacity = '1';
    });

    // 2. Speech bubble appears — invitation to click
    setTimeout(function () {
      showSpeech('I have counsel for you, Governor.<br><span class="orb-tap-hint">\u25B6 Tap to begin</span>');
    }, 1000);

    // 3. Clickable at center — clicking speech bubble OR orb opens council immediately
    var centerClicked = false;
    function onCenterClick() {
      if (centerClicked) return;
      centerClicked = true;
      glideToRest();
      setTimeout(expand, 900);
    }
    speechBubble.addEventListener('click', onCenterClick);

    // 4. If not clicked, auto-glide to rest after floating for 5 seconds
    setTimeout(function () {
      if (!centerClicked) glideToRest();
    }, 5500);

    function glideToRest() {
      hideSpeech();
      orbWrap.classList.remove('orb-at-center');
      orbWrap.classList.add('orb-at-rest', 'orb-gliding');
      try { sessionStorage.setItem('ksp_orb_entered', '1'); } catch (e) {}

      setTimeout(function () {
        orbWrap.classList.remove('orb-gliding');
        speechBubble.removeEventListener('click', onCenterClick);
      }, 900);
    }
  }

  // ── Speech bubble ─────────────────────────
  function showSpeech(text) {
    speechBubble.innerHTML = text;
    speechBubble.classList.add('visible');
  }

  function hideSpeech() {
    speechBubble.classList.remove('visible');
  }

  // ── Expand / Minimize ─────────────────────
  function expand() {
    engaged = true;
    orbWrap.classList.add('orb-hidden');
    backdrop.classList.add('visible');
    panel.classList.add('visible');
    hideSpeech();

    var vid = document.getElementById('orb-panel-vid');

    // First open: play greeting with audio. User clicked, so autoplay policy is satisfied.
    if (!greetingPlayed && vid) {
      greetingPlayed = true;
      videoSpeaking = true; // Block TTS immediately — before any async

      vid.src = getGreetingVideo();
      vid.muted = false;
      vid.loop = false;
      vid.load();

      function playGreeting() {
        var playPromise = vid.play();
        if (playPromise !== undefined) {
          playPromise.catch(function () {
            // Browser blocked audio — fall back to muted video + TTS clips
            vid.muted = true;
            videoSpeaking = false;
            vid.play().catch(function () {});
          });
        }
      }

      // Play when ready
      if (vid.readyState >= 3) {
        playGreeting();
      } else {
        vid.addEventListener('canplay', function onReady() {
          vid.removeEventListener('canplay', onReady);
          playGreeting();
        });
      }

      // When greeting ends, switch to idle loop and re-enable TTS
      vid.addEventListener('ended', function onEnd() {
        vid.removeEventListener('ended', onEnd);
        videoSpeaking = false;
        switchToIdle(vid);
      });

    } else if (vid) {
      vid.play().catch(function () {});
    }

    // If chat is empty, greet
    if (panelChat.children.length === 0) {
      greet();
    }
    panelChat.scrollTop = panelChat.scrollHeight;
  }

  function minimize() {
    engaged = false;
    panel.classList.remove('visible');
    backdrop.classList.remove('visible');
    orbWrap.classList.remove('orb-hidden');
    stopVoice();
  }

  // ── Audio playback ───────────────────────
  var currentAudio = null;
  var videoSpeaking = false; // true when greeting video is playing with audio

  function playVoice(clipName) {
    // Don't play if muted
    if (window._kspMuted) return;
    // Don't overlap with greeting video audio
    if (videoSpeaking) return;

    if (currentAudio) {
      currentAudio.pause();
      currentAudio = null;
    }
    var src = getBase() + 'avatars/audio/' + clipName + '.mp3';
    currentAudio = new Audio(src);
    currentAudio.volume = 1.0;
    currentAudio.play().catch(function () {
      // Audio blocked — user hasn't interacted yet. Silent fallback.
    });
  }

  function stopVoice() {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio = null;
    }
  }

  // ── Video helpers ─────────────────────────
  function switchToIdle(vid) {
    // Hide video, show static image with CSS breathing/firelight instead
    // The idle video has lip movement from TTS — looks like she's talking to nobody
    vid.pause();
    vid.style.display = 'none';
    // Show the fallback image in the panel portrait
    var panelPortrait = document.getElementById('orb-panel-portrait');
    if (panelPortrait) {
      var img = panelPortrait.querySelector('.orb-img');
      if (img) img.style.display = 'block';
    }
  }

  function showTapToHear(vid) {
    var portrait = document.getElementById('orb-panel-portrait');
    if (!portrait) return;
    var tap = document.createElement('div');
    tap.className = 'orb-tap-audio';
    tap.innerHTML = '\u{1F50A} Tap to hear her speak';
    portrait.appendChild(tap);
    tap.addEventListener('click', function () {
      tap.remove();
      vid.currentTime = 0;
      vid.muted = false;
      vid.loop = false;
      vid.play().catch(function () {});
      // Re-attach ended handler
      vid.addEventListener('ended', function onEnd() {
        vid.removeEventListener('ended', onEnd);
        switchToIdle(vid);
      });
    });
  }

  // ── Messages ──────────────────────────────
  function addAdvisorMsg(html) {
    var msg = document.createElement('div');
    msg.className = 'orb-msg orb-msg-adv';
    msg.innerHTML = '<div class="orb-msg-bub">' + html + '</div>';
    panelChat.appendChild(msg);
    panelChat.scrollTop = panelChat.scrollHeight;
  }

  function addUserMsg(text) {
    var msg = document.createElement('div');
    msg.className = 'orb-msg orb-msg-usr';
    msg.innerHTML = '<div class="orb-msg-bub">' + esc(text) + '</div>';
    panelChat.appendChild(msg);
    panelChat.scrollTop = panelChat.scrollHeight;
  }

  function showQuickReplies(replies) {
    panelInput.innerHTML = '';
    var wrap = document.createElement('div');
    wrap.className = 'orb-replies';
    for (var i = 0; i < replies.length; i++) {
      (function (r) {
        var btn = document.createElement('button');
        btn.className = 'orb-reply-btn';
        btn.textContent = r.label;
        btn.addEventListener('click', function () {
          addUserMsg(r.label);
          panelInput.innerHTML = '';
          if (r.action) r.action();
        });
        wrap.appendChild(btn);
      })(replies[i]);
    }
    panelInput.appendChild(wrap);
  }

  // ── Greet ─────────────────────────────────
  function greet() {
    panelChat.innerHTML = '';
    panelInput.innerHTML = '';
    var profile = getProfile();
    var advState = window.Advisor && window.Advisor.getState ? window.Advisor.getState() : null;

    if (profile && profile.furnaceLevel > 0 && advState) {
      var greeting = window.Advisor.getGreeting ? window.Advisor.getGreeting(profile.nickname) : '';
      addAdvisorMsg(greeting || ('Welcome back, <strong>' + esc(profile.nickname) + '</strong>.'));

      var advice = window.KSP && window.KSP.getAdvice ? window.KSP.getAdvice(profile) : null;
      if (advice) {
        setTimeout(function () {
          addAdvisorMsg('<em>' + esc(advice.headline) + '</em>');
          var h = '';
          for (var i = 0; i < advice.tips.length; i++) {
            h += '<div class="orb-tip"><strong>' + esc(advice.tips[i].title) + '</strong><br>' +
              '<span>' + esc(advice.tips[i].body) + '</span></div>';
          }
          addAdvisorMsg(h);
        }, 400);
      }

      showQuickReplies([
        { label: 'What should I focus on today?', action: function () { showFocus(profile); } },
        { label: 'Tell me about my kingdom', action: function () { showKingdom(profile); } },
        { label: 'Open calculators', action: function () { location.href = 'calculators/building.html'; } }
      ]);
    } else {
      greetNew();
    }
  }

  function greetNew() {
    addAdvisorMsg(
      'Governor. You\'ve found something the other tools don\'t have \u2014 ' +
      'an advisor who learns your kingdom, tracks your progress, and gives you ' +
      'strategy built around <em>your</em> account. Not generic guides. <em>Yours.</em>'
    );
    playVoice('welcome1');
    setTimeout(function () {
      addAdvisorMsg('Tell me who you are, Governor.');
      showQuickReplies([
        { label: '\u2694\uFE0F I play Kingshot \u2014 let me enter my Player ID', action: showPlayerIdInput },
        { label: '\u{1F331} I\'m new to Kingshot', action: showNewPlayer }
      ]);
    }, 9000);
  }

  function helpFindId() {
    addAdvisorMsg(
      '<strong>How to find your Player ID:</strong><br><br>' +
      '1. Open Kingshot<br>' +
      '2. Tap your <strong>avatar</strong> (top-left)<br>' +
      '3. <strong>Settings \u2192 Player Info</strong><br>' +
      '4. The number next to <strong>"FID"</strong> \u2014 usually 7\u201310 digits<br><br>' +
      'Enter it above and I\'ll pull up everything about your account.'
    );
    playVoice('help_find_id');
    showPlayerIdInput();
  }

  function showCapabilities() {
    addAdvisorMsg(
      '\u{1F451} <strong>Know your account</strong> \u2014 furnace, spending, server age, pulled instantly<br>' +
      '\u{1F4CA} <strong>36 calculators</strong> \u2014 all pre-filled with your data<br>' +
      '\u{1F9E0} <strong>Personalized advice</strong> \u2014 strategy built for your exact situation<br>' +
      '\u{1F3AE} <strong>Your advisor grows</strong> \u2014 level up, earn XP, I get smarter'
    );
    playVoice('capabilities');
    showQuickReplies([
      { label: 'Let me enter my Player ID', action: focusInput },
      { label: 'Show me the calculators', action: function () { location.href = 'calculators/building.html'; } }
    ]);
  }

  function showNewPlayer() {
    addAdvisorMsg(
      'Welcome to the realm. Kingshot is a medieval strategy game \u2014 ' +
      'build a kingdom, train armies, compete across servers.<br><br>' +
      'When you\'re ready, come back with your Player ID. The calculators and gift codes work for everyone.'
    );
    playVoice('new_player');
    showQuickReplies([
      { label: '\u{1F381} Show me gift codes', action: function () {
        var sub = /\/calculators\//.test(location.pathname);
        location.href = (sub ? '../' : '') + 'codes.html';
      }},
      { label: '\u{1F4CA} Open calculators', action: function () { location.href = 'calculators/building.html'; } }
    ]);
  }

  function showFocus(profile) {
    var advice = window.KSP && window.KSP.getAdvice ? window.KSP.getAdvice(profile) : null;
    if (advice && advice.tips && advice.tips[0]) {
      addAdvisorMsg('Today\'s priority: <strong>' + esc(advice.tips[0].title) + '</strong><br><br>' + esc(advice.tips[0].body));
    } else {
      addAdvisorMsg('Keep building. Consistency wins in this game.');
    }
  }

  function showKingdom(profile) {
    addAdvisorMsg(
      '<strong>' + esc(profile.nickname) + '</strong> \u2014 ' + esc(profile.spendingLabel) + ' Governor<br>' +
      'Kingdom ' + (profile.kid || '?') + ' \u2014 ' + esc(profile.serverAgeLabel || '') + '<br>' +
      'Furnace Level ' + (profile.furnaceLevel || '?') + ' \u2014 ' + esc(profile.stageLabel || '') +
      (profile.dollars > 0 ? '<br>Lifetime investment: $' + profile.dollars.toFixed(0) : '')
    );
  }

  function focusInput() {
    addAdvisorMsg('Enter your Player ID below. I\'ll do the rest.');
    playVoice('got_it');
    showPlayerIdInput();
  }

  function showPlayerIdInput() {
    addAdvisorMsg('Enter your Player ID below. You\'ll find it in-game: avatar \u2192 Settings \u2192 Player Info. The number next to FID.');
    panelInput.innerHTML = '';
    var wrap = document.createElement('div');
    wrap.className = 'orb-fid-input';
    wrap.innerHTML =
      '<input type="text" id="orb-fid-field" inputmode="numeric" ' +
      'placeholder="Your Player ID (e.g. 7291048)" maxlength="12" ' +
      'pattern="\\d{5,12}" autocomplete="off">' +
      '<button id="orb-fid-go" class="orb-reply-btn" style="background:var(--gold);color:var(--bg);font-weight:700;text-align:center;">Look up</button>';
    panelInput.appendChild(wrap);

    var field = document.getElementById('orb-fid-field');
    var btn = document.getElementById('orb-fid-go');

    setTimeout(function () { field.focus(); }, 100);

    function doLookup() {
      var val = field.value.trim();
      if (!val || !/^\d{5,12}$/.test(val)) {
        addAdvisorMsg('That doesn\'t look right. Your Player ID is 5\u201312 digits \u2014 numbers only.');
        return;
      }
      addUserMsg(val);
      panelInput.innerHTML = '';
      addAdvisorMsg('Looking up your kingdom...');

      // Fill the main page FID input and submit
      var mainInput = document.getElementById('fid-input');
      if (mainInput) {
        mainInput.value = val;
        var form = document.getElementById('fid-form');
        if (form) form.dispatchEvent(new Event('submit', { cancelable: true }));
      }
    }

    btn.addEventListener('click', doLookup);
    field.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); doLookup(); }
    });
  }

  // ── Update identity ───────────────────────
  function updateIdentity(name, title, src) {
    if (orbImg) orbImg.src = src;
    if (panelImg) panelImg.src = src;
    if (panelName) panelName.innerHTML = '<strong>' + esc(name) + '</strong>' + (title ? ' <span>' + esc(title) + '</span>' : '');
  }

  // ── Init ──────────────────────────────────
  function init() {
    build();
    runEntry();

    // Listen for profile changes
    var last = sessionStorage.getItem('ksp_profile');
    setInterval(function () {
      var cur = sessionStorage.getItem('ksp_profile');
      if (cur !== last) {
        last = cur;
        var st = window.Advisor && window.Advisor.getState ? window.Advisor.getState() : null;
        if (st) updateIdentity(st.name, (window.Advisor.ARCHETYPES[st.archetype] || {}).title || '', getAvatarSrc());
        if (engaged) greet();
      }
    }, 1000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ── Public API ────────────────────────────
  window.AdvisorOrb = {
    expand: expand,
    minimize: minimize,
    addAdvisorMsg: addAdvisorMsg,
    addUserMsg: addUserMsg,
    showQuickReplies: showQuickReplies,
    showSpeechBubble: showSpeech,
    hideSpeechBubble: hideSpeech,
    updateIdentity: updateIdentity,
    isEngaged: function () { return engaged; }
  };
})();

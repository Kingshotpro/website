/**
 * profile.js — Player Profile Page
 * KingshotPro
 *
 * Renders a shareable player profile from FID lookup.
 * URL format: profile.html?fid=1234567
 * Also works with manual entry on the page.
 */

(function () {
  'use strict';

  var FID_API = 'https://kingshotpro-api.kingshotpro.workers.dev/player';

  function escH(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ─── PROFILE CLASSIFICATION (mirrors fid.js classifyProfile) ───
  function classifyProfile(raw) {
    var furnaceLevel = Number(raw.stove_lv) || 0;
    var kid          = Number(raw.kid)      || 0;
    var payAmt       = Number(raw.pay_amt)  || 0;
    var dollars      = payAmt / 100;

    var spendingTier, spendingLabel;
    if (dollars === 0)        { spendingTier = 'f2p';   spendingLabel = 'Free Commander'; }
    else if (dollars < 100)   { spendingTier = 'low';   spendingLabel = 'Tactician'; }
    else if (dollars < 500)   { spendingTier = 'mid';   spendingLabel = 'Veteran'; }
    else                      { spendingTier = 'whale'; spendingLabel = 'Warlord'; }

    var gameStage, stageLabel;
    if (furnaceLevel < 15)       { gameStage = 'early'; stageLabel = 'Early Game'; }
    else if (furnaceLevel <= 21) { gameStage = 'mid';   stageLabel = 'Mid Game'; }
    else                         { gameStage = 'late';  stageLabel = 'Late Game'; }

    var serverAge, serverAgeLabel;
    if (kid < 500)       { serverAge = 'mature'; serverAgeLabel = 'Mature (180+ days)'; }
    else if (kid <= 1000){ serverAge = 'mid';    serverAgeLabel = 'Established (90–180 days)'; }
    else                 { serverAge = 'new';    serverAgeLabel = 'New (<90 days)'; }

    return {
      fid:            raw.fid || raw.uid || '',
      nickname:       raw.nickname || 'Unknown',
      furnaceLevel:   furnaceLevel,
      kid:            kid,
      dollars:        dollars,
      spendingTier:   spendingTier,
      spendingLabel:  spendingLabel,
      gameStage:      gameStage,
      stageLabel:     stageLabel,
      serverAge:      serverAge,
      serverAgeLabel: serverAgeLabel,
    };
  }

  // ─── RENDER PROFILE ───

  function renderProfile(profile) {
    document.getElementById('profile-empty').style.display = 'none';
    document.getElementById('profile-content').style.display = 'block';

    // Update page title and meta
    document.title = profile.nickname + ' — Player Profile — KingshotPro';

    // Update OG meta tags dynamically (for share previews)
    setMeta('og:title', profile.nickname + ' — Kingshot Player Profile');
    setMeta('og:description', 'Furnace ' + profile.furnaceLevel + ' · Kingdom ' + profile.kid + ' · ' + profile.stageLabel + ' · ' + profile.spendingLabel);
    setMeta('og:url', window.location.origin + '/profile.html?fid=' + profile.fid);

    // Banner
    var banner = document.getElementById('profile-banner');
    banner.innerHTML =
      '<div class="profile-avatar-lg">' + escH(profile.nickname.charAt(0).toUpperCase()) + '</div>' +
      '<div class="profile-nickname">' + escH(profile.nickname) + '</div>' +
      '<div class="profile-kingdom">Kingdom ' + profile.kid + ' · ' + escH(profile.serverAgeLabel) + '</div>' +
      '<div class="profile-badges">' +
        '<span class="profile-badge badge-stage">' + escH(profile.stageLabel) + '</span>' +
        '<span class="profile-badge badge-tier">' + escH(profile.spendingLabel) + '</span>' +
        '<span class="profile-badge badge-server">' + escH(profile.serverAgeLabel) + '</span>' +
      '</div>';

    // Stats grid
    var stats = document.getElementById('profile-stats');
    stats.innerHTML =
      '<div class="profile-stat-card">' +
        '<div class="profile-stat-value">' + profile.furnaceLevel + '</div>' +
        '<div class="profile-stat-label">Furnace Level</div>' +
      '</div>' +
      '<div class="profile-stat-card">' +
        '<div class="profile-stat-value">' + profile.kid + '</div>' +
        '<div class="profile-stat-label">Kingdom</div>' +
      '</div>' +
      '<div class="profile-stat-card">' +
        '<div class="profile-stat-value">' + escH(profile.spendingLabel) + '</div>' +
        '<div class="profile-stat-label">Commander Tier</div>' +
      '</div>';

    // Analysis section
    var analysis = document.getElementById('profile-analysis');
    var analysisText = getAnalysis(profile);
    analysis.innerHTML =
      '<h3>Profile Analysis</h3>' + analysisText;

    // Hero recommendations
    var heroes = document.getElementById('profile-heroes');
    var heroRec = getHeroRecommendation(profile);
    heroes.innerHTML =
      '<h3>Recommended Heroes</h3>' + heroRec;

    // Strategic advice
    var advice = document.getElementById('profile-advice');
    var adviceText = getAdvice(profile);
    advice.innerHTML =
      '<h3>Strategic Outlook</h3>' + adviceText;

    // Share button
    var shareBtn = document.getElementById('share-btn');
    var shareCopied = document.getElementById('share-copied');
    shareBtn.onclick = function () {
      var url = window.location.origin + '/profile.html?fid=' + profile.fid;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(function () {
          shareCopied.style.display = 'block';
          setTimeout(function () { shareCopied.style.display = 'none'; }, 3000);
        });
      } else {
        // Fallback
        var input = document.createElement('input');
        input.value = url;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
        shareCopied.style.display = 'block';
        setTimeout(function () { shareCopied.style.display = 'none'; }, 3000);
      }
    };
  }

  function setMeta(property, content) {
    var meta = document.querySelector('meta[property="' + property + '"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('property', property);
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', content);
  }

  // ─── GAME ANALYSIS ───

  function getAnalysis(p) {
    var html = '';

    if (p.gameStage === 'early') {
      html += '<p><strong>Early game player</strong> on a ';
      if (p.serverAge === 'new') {
        html += 'new server. You\'re in the growth phase — building power and establishing your base. ';
        html += 'Focus on furnace progression, troop training, and joining an active alliance.</p>';
      } else {
        html += p.serverAgeLabel.toLowerCase() + ' server. With a low furnace on an older kingdom, ';
        html += 'you may face pressure from established players. Prioritize furnace upgrades and find a protective alliance.</p>';
      }
    } else if (p.gameStage === 'mid') {
      html += '<p><strong>Mid-game player</strong> (Furnace ' + p.furnaceLevel + ') ';
      html += 'on a ' + p.serverAgeLabel.toLowerCase() + ' server. ';
      html += 'You\'re past the initial grind — now it\'s about strategic hero investment, gear optimization, and preparing for KvK. ';
      html += 'This is where smart resource management separates good players from great ones.</p>';
    } else {
      html += '<p><strong>Late-game player</strong> (Furnace ' + p.furnaceLevel + ') ';
      html += 'on a ' + p.serverAgeLabel.toLowerCase() + ' server. ';
      html += 'At this stage, optimization matters more than growth. Hero lineups, rally compositions, ';
      html += 'and KvK preparation define your competitive edge.</p>';
    }

    // Spending context
    if (p.spendingTier === 'f2p') {
      html += '<p>As a <strong>Free Commander</strong>, your strength comes from discipline and smart shard investment. ';
      html += 'See our <a href="guides/f2p.html" style="color:var(--gold);">F2P Guide</a> for strategies.</p>';
    } else if (p.spendingTier === 'whale') {
      html += '<p>As a <strong>Warlord</strong>-tier investor, you have access to the full hero roster. ';
      html += 'The question isn\'t what you can unlock — it\'s what to prioritize first.</p>';
    }

    return html;
  }

  // ─── HERO RECOMMENDATIONS ───

  function getHeroRecommendation(p) {
    var heroes = [];
    var note = '';

    if (p.gameStage === 'early') {
      if (p.spendingTier === 'f2p' || p.spendingTier === 'low') {
        heroes = ['Jabel', 'Zoe', 'Marlin', 'Chenko', 'Saul'];
        note = 'Focus on Jabel for garrison, Marlin for offense. Chenko is your best rally joiner. Saul boosts construction speed. Save universal shards for later generations.';
      } else {
        heroes = ['Amadeus', 'Jabel', 'Zoe', 'Marlin', 'Helga'];
        note = 'Amadeus is your rally carry from day one. Jabel + Zoe anchor garrison. Marlin for long-term archer investment.';
      }
    } else if (p.gameStage === 'mid') {
      if (p.spendingTier === 'f2p' || p.spendingTier === 'low') {
        heroes = ['Zoe', 'Marlin', 'Petra', 'Chenko', 'Saul'];
        note = 'Add Petra as cavalry rally lead. Zoe + Marlin remain core. Start saving shards for Yang (Gen 6).';
      } else {
        heroes = ['Amadeus', 'Petra', 'Zoe', 'Hilde', 'Marlin'];
        note = 'Amadeus + Petra for rally offense. Zoe + Hilde for garrison. Start planning for Gen 5 heroes.';
      }
    } else {
      if (p.spendingTier === 'f2p' || p.spendingTier === 'low') {
        heroes = ['Yang', 'Zoe', 'Marlin', 'Petra', 'Chenko'];
        note = 'Yang is your endgame rally carry (S+ tier). Zoe still holds garrison. All-in on Yang shards.';
      } else if (p.spendingTier === 'whale') {
        heroes = ['Amadeus', 'Vivian', 'Thrud', 'Yang', 'Triton'];
        note = 'Amadeus + Vivian form the strongest rally core. Thrud multiplies cavalry. Triton dominates garrison.';
      } else {
        heroes = ['Amadeus', 'Vivian', 'Yang', 'Zoe', 'Petra'];
        note = 'Amadeus + Vivian for rallies. Yang for F2P-accessible power. Zoe anchors garrison.';
      }
    }

    var pills = heroes.map(function(h) {
      return '<span class="profile-hero-pill">' + escH(h) + '</span>';
    }).join('');

    return '<p style="font-size:13px;color:var(--text-muted);">' + escH(note) + '</p>' +
      '<div class="profile-hero-list">' + pills + '</div>' +
      '<p style="font-size:12px;margin-top:12px;"><a href="heroes.html" style="color:var(--gold);">View full hero database with filters &rarr;</a></p>';
  }

  // ─── STRATEGIC ADVICE ───

  function getAdvice(p) {
    var html = '<ul style="margin:0;padding-left:18px;">';

    // Game stage advice
    if (p.gameStage === 'early') {
      html += '<li style="font-size:13px;color:var(--text-muted);margin-bottom:8px;">Prioritize furnace upgrades — every level unlocks new troop tiers and building capacity.</li>';
      html += '<li style="font-size:13px;color:var(--text-muted);margin-bottom:8px;">Join every alliance event. The rewards compound faster than solo play.</li>';
      html += '<li style="font-size:13px;color:var(--text-muted);margin-bottom:8px;">Don\'t spread hero shards across many heroes. Pick 3-4 and go deep.</li>';
    } else if (p.gameStage === 'mid') {
      html += '<li style="font-size:13px;color:var(--text-muted);margin-bottom:8px;">Gear optimization matters more than new heroes at this stage. Focus on completing sets.</li>';
      html += '<li style="font-size:13px;color:var(--text-muted);margin-bottom:8px;">Start studying your KvK matchup opponents. See our <a href="guides/kvk.html" style="color:var(--gold);">KvK Guide</a>.</li>';
      html += '<li style="font-size:13px;color:var(--text-muted);margin-bottom:8px;">Consider a farm account for resource supply. See our <a href="guides/farm-account.html" style="color:var(--gold);">Farm Account Guide</a>.</li>';
    } else {
      html += '<li style="font-size:13px;color:var(--text-muted);margin-bottom:8px;">Rally composition matters more than raw power. Study troop type matchups.</li>';
      html += '<li style="font-size:13px;color:var(--text-muted);margin-bottom:8px;">Coordinate with your alliance for KvK. Individual strength means nothing without teamwork.</li>';
      html += '<li style="font-size:13px;color:var(--text-muted);margin-bottom:8px;">Widgets don\'t work in solo attacks — adjust hero selection for solo vs group content.</li>';
    }

    // Server age advice
    if (p.serverAge === 'new' && p.gameStage !== 'early') {
      html += '<li style="font-size:13px;color:var(--text-muted);margin-bottom:8px;">Your server is young — you have time to establish dominance before KvK pressure builds.</li>';
    } else if (p.serverAge === 'mature' && p.gameStage === 'early') {
      html += '<li style="font-size:13px;color:var(--text-muted);margin-bottom:8px;">On a mature server with a low furnace, consider transferring to a newer kingdom for a more balanced experience.</li>';
    }

    html += '</ul>';
    return html;
  }

  // ─── API LOOKUP ───

  function lookupFid(fid) {
    var errorEl = document.getElementById('profile-error');
    var btn = document.getElementById('profile-lookup-btn');
    errorEl.style.display = 'none';
    btn.disabled = true;
    btn.textContent = 'Looking up...';

    fetch(FID_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fid: String(fid).trim(), cdkey: '' }),
    })
    .then(function (res) {
      if (!res.ok) throw new Error('API returned ' + res.status);
      return res.json();
    })
    .then(function (data) {
      var raw = (data && data.data) ? data.data : data;
      if (!raw || raw.nickname === undefined) throw new Error('Player not found');
      var profile = classifyProfile(Object.assign({}, raw, { fid: fid }));

      // Cache profile locally
      if (window.KSP && window.KSP.loadProfile) {
        // Let fid.js handle storage if available
        try {
          var json = JSON.stringify(profile);
          localStorage.setItem('ksp_profile_' + fid, json);
          localStorage.setItem('ksp_last_fid', fid);
        } catch(e) {}
      }

      // Update URL without reload
      if (window.history.replaceState) {
        window.history.replaceState(null, '', 'profile.html?fid=' + fid);
      }

      renderProfile(profile);
    })
    .catch(function (err) {
      console.error('Profile lookup error:', err);
      if (err.message.includes('404') || err.message.includes('not found')) {
        errorEl.textContent = 'Player ID not found. Double-check your ID in-game.';
      } else {
        errorEl.textContent = 'Lookup failed. Please try again.';
      }
      errorEl.style.display = 'block';
    })
    .finally(function () {
      btn.disabled = false;
      btn.textContent = 'Look Up';
    });
  }

  // ─── INIT ───

  document.addEventListener('DOMContentLoaded', function () {
    // Check URL for FID
    var params = new URLSearchParams(window.location.search);
    var fid = params.get('fid');

    if (fid && /^\d{5,12}$/.test(fid)) {
      // Try cached profile first for instant render
      var cached = null;
      try {
        var stored = localStorage.getItem('ksp_profile_' + fid);
        if (stored) cached = JSON.parse(stored);
      } catch(e) {}

      if (cached) {
        renderProfile(cached);
        // Still refresh from API in background for fresh data
        lookupFid(fid);
      } else {
        lookupFid(fid);
      }
    } else if (!fid) {
      // No FID in URL — check localStorage for last known
      try {
        var lastFid = localStorage.getItem('ksp_last_fid');
        if (lastFid) {
          var input = document.getElementById('profile-fid-input');
          if (input) input.value = lastFid;
        }
      } catch(e) {}
    }

    // Wire lookup button
    var btn = document.getElementById('profile-lookup-btn');
    var input = document.getElementById('profile-fid-input');
    if (btn) {
      btn.addEventListener('click', function () {
        var val = (input.value || '').trim();
        if (!val || !/^\d{5,12}$/.test(val)) {
          var err = document.getElementById('profile-error');
          err.textContent = 'Enter a valid Player ID (5-12 digits).';
          err.style.display = 'block';
          return;
        }
        lookupFid(val);
      });
    }
    if (input) {
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') btn.click();
      });
    }
  });
})();

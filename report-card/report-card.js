/**
 * report-card.js — Kingdom Report Card generator.
 *
 * FLOW
 *   1. User submits a Player ID.
 *   2. Fetch profile via the Cloudflare Worker /player/lookup endpoint.
 *      → returns { fid, nickname, kid, stove_lv, avatar_image, total_recharge }
 *   3. Fetch the global players_data.json (cross-kingdom top players).
 *   4. Match this player by nickname (fuzzy) within their kingdom across
 *      available stat categories.
 *   5. Compute percentiles and pick a title + strength + weakness.
 *   6. Render the card. Allow download-as-image via html2canvas, and
 *      offer a shareable link with ?fid= prefilled.
 *
 * FAILURE MODES handled gracefully:
 *   - Player not found by CG → show "FID not found" error.
 *   - Player found but kingdom not in our scraper rotation → render a
 *     partial card using only what we know from /player/lookup.
 *   - Player found AND kingdom scraped but player outside top 60 → same
 *     partial card + "your kingdom is scraped but you're below our top-60
 *     cut" note.
 *
 * The card is deliberately square (1:1) + ~560px wide — optimized for
 * Discord embeds, X/Twitter cards, and phone-screen screenshots.
 */
(function () {
  'use strict';

  var API = 'https://kingshotpro-api.kingshotpro.workers.dev';
  var LOOKUP_URL = API + '/player/lookup';
  var PLAYERS_DATA_URL = '../players/players_data.json';

  // Category meta — order matters; first = most prestigious stat for titling.
  var CATEGORIES = [
    { id: 'personal_power',    label: 'Player Power',   unit: 'power',  format: 'power' },
    { id: 'kill_count',        label: 'Kill Count',     unit: 'kills',  format: 'number' },
    { id: 'hero_power',        label: 'Top Hero Power', unit: 'hero',   format: 'power' },
    { id: 'heros_total_power', label: 'Heroes Total',   unit: 'power',  format: 'power' },
    { id: 'total_pet_power',   label: 'Pet Power',      unit: 'pets',   format: 'power' },
    { id: 'mystic_trial',      label: 'Mystic Trial',   unit: 'stage',  format: 'level' },
  ];

  // Title ladder — based on best percentile across ANY stat the player has.
  // Order matters: most aspirational first; we pick the first whose
  // threshold this player meets.
  var TITLES = [
    { threshold: 1,  name: 'Sovereign',  sub: 'Top 1% of your kingdom — legendary status.' },
    { threshold: 3,  name: 'Warlord',    sub: 'Top 3% — a dominant force.' },
    { threshold: 10, name: 'Champion',   sub: 'Top 10% of your kingdom.' },
    { threshold: 25, name: 'Veteran',    sub: 'Upper quartile. Solid, established.' },
    { threshold: 50, name: 'Knight',     sub: 'Above average. Climbing.' },
    { threshold: 75, name: 'Squire',     sub: 'Middle of the pack. Room to grow.' },
    { threshold: 100, name: 'Governor',  sub: 'Early in your reign. Build the walls.' },
  ];

  // In-game Town Center level labels (Kingshot uses 1-30 + TG 1-10)
  function townCenterLabel(stove_lv) {
    if (!stove_lv) return '';
    if (stove_lv > 30) return 'Truegold TC' + (stove_lv - 30);
    return 'Town Center ' + stove_lv;
  }

  function formatPower(v) {
    v = Number(v) || 0;
    if (v >= 1e9) return (v / 1e9).toFixed(2) + 'B';
    if (v >= 1e6) return (v / 1e6).toFixed(1) + 'M';
    if (v >= 1e3) return (v / 1e3).toFixed(1) + 'K';
    return String(v);
  }
  function formatNumber(v) {
    v = Number(v) || 0;
    if (v >= 1e6) return (v / 1e6).toFixed(2) + 'M';
    if (v >= 1e3) return (v / 1e3).toFixed(1) + 'K';
    return String(v);
  }
  function formatValue(v, fmt) {
    if (fmt === 'power')  return formatPower(v);
    if (fmt === 'level')  return String(v);
    return formatNumber(v);
  }

  // Normalize names for matching — strip tags, whitespace, case
  function normalizeName(raw) {
    if (!raw) return '';
    var s = String(raw).trim();
    // Strip leading alliance tag like "[CRB]"
    s = s.replace(/^\[[^\]]+\]\s*/, '');
    // Strip OCR artifacts
    s = s.replace(/^[()Il×x\s]+/, '');
    return s.toLowerCase().replace(/\s+/g, '');
  }

  // Status helpers
  function setStatus(message, type) {
    var el = document.getElementById('rc-status');
    if (!message) { el.className = 'rc-status'; return; }
    el.textContent = message;
    el.className = 'rc-status ' + (type || 'info');
  }

  // Look up a player's stats in players_data.json for their kingdom
  function findPlayerInScraperData(playersData, nickname, kid) {
    var nickNorm = normalizeName(nickname);
    if (!nickNorm) return null;
    var found = {};          // category_id → {rank_in_kingdom, value, kingdom_size_estimate}
    var kingdomSizes = {};   // category_id → how many entries we saw for this kingdom

    CATEGORIES.forEach(function (cat) {
      var entries = (playersData.categories && playersData.categories[cat.id]) || [];
      var kingdomEntries = entries.filter(function (e) { return e.kingdom === kid; });
      kingdomSizes[cat.id] = kingdomEntries.length;

      for (var i = 0; i < kingdomEntries.length; i++) {
        var e = kingdomEntries[i];
        if (normalizeName(e.name) === nickNorm) {
          found[cat.id] = {
            rank_in_kingdom: e.rank_in_kingdom,
            value:           e.value,
            kingdom_size:    kingdomEntries.length,
          };
          break;
        }
      }
    });

    return {
      matched_categories: Object.keys(found),
      stats:              found,
      kingdom_scraped:    Object.values(kingdomSizes).some(function (n) { return n > 0; }),
      kingdom_sizes:      kingdomSizes,
    };
  }

  function bestPercentile(scraperMatch) {
    // Lower rank = better. Percentile = rank / kingdom_size × 100.
    // Return the BEST (lowest) percentile across any category.
    var best = 101;
    CATEGORIES.forEach(function (cat) {
      var s = scraperMatch.stats[cat.id];
      if (!s || !s.kingdom_size) return;
      var pct = (s.rank_in_kingdom / Math.max(s.kingdom_size, 60)) * 100;
      if (pct < best) best = pct;
    });
    return best;
  }

  function pickTitle(percentile) {
    for (var i = 0; i < TITLES.length; i++) {
      if (percentile <= TITLES[i].threshold) return TITLES[i];
    }
    return TITLES[TITLES.length - 1];
  }

  function pickStrengthAndWeakness(scraperMatch) {
    var ranked = [];
    CATEGORIES.forEach(function (cat) {
      var s = scraperMatch.stats[cat.id];
      if (!s || !s.kingdom_size) return;
      var pct = (s.rank_in_kingdom / Math.max(s.kingdom_size, 60)) * 100;
      ranked.push({ cat: cat, pct: pct, rank: s.rank_in_kingdom, value: s.value });
    });
    if (!ranked.length) return { strength: null, weakness: null };
    ranked.sort(function (a, b) { return a.pct - b.pct; });   // best first (lowest pct)
    return {
      strength: ranked[0],
      weakness: ranked.length > 1 ? ranked[ranked.length - 1] : null,
    };
  }

  // Render the card DOM from computed data
  function renderCard(profile, scraperMatch) {
    var card = document.getElementById('rc-card');

    // Header
    document.getElementById('rc-kingdom-title').textContent =
      'Kingdom ' + (profile.kid || '?');

    // Avatar
    var avatarEl = document.getElementById('rc-avatar');
    if (profile.avatar_image) {
      avatarEl.innerHTML = '';
      var img = document.createElement('img');
      img.src = profile.avatar_image;
      img.crossOrigin = 'anonymous';
      img.onerror = function () {
        avatarEl.textContent = (profile.nickname || '?').charAt(0).toUpperCase();
      };
      avatarEl.appendChild(img);
    } else {
      avatarEl.textContent = (profile.nickname || '?').charAt(0).toUpperCase();
    }

    // Player identity
    var nickParts = extractNicknameAndTag(profile.nickname || '');
    var nameEl = document.getElementById('rc-player-name');
    nameEl.innerHTML = (nickParts.tag ? '<span class="rc-player-tag">[' + nickParts.tag + ']</span>' : '') +
                       escapeHtml(nickParts.name || 'Governor');

    document.getElementById('rc-player-sub').innerHTML =
      'Player ID <strong>' + escapeHtml(String(profile.fid || '?')) + '</strong>' +
      (profile.stove_lv ? ' · ' + townCenterLabel(profile.stove_lv) : '');

    // Title banner
    var pct = null;
    var strength_weakness = { strength: null, weakness: null };
    if (scraperMatch && scraperMatch.matched_categories.length > 0) {
      pct = bestPercentile(scraperMatch);
      strength_weakness = pickStrengthAndWeakness(scraperMatch);
    }

    var title = pct !== null ? pickTitle(pct) : TITLES[TITLES.length - 1];
    document.getElementById('rc-title-name').textContent = title.name.toUpperCase();
    document.getElementById('rc-title-sub').textContent = title.sub;

    // Stats grid — show up to 4 strongest categories
    var statsGrid = document.getElementById('rc-stats-grid');
    statsGrid.innerHTML = '';
    if (scraperMatch && scraperMatch.matched_categories.length > 0) {
      var allStats = [];
      CATEGORIES.forEach(function (cat) {
        var s = scraperMatch.stats[cat.id];
        if (!s) return;
        var p = (s.rank_in_kingdom / Math.max(s.kingdom_size, 60)) * 100;
        allStats.push({ cat: cat, pct: p, rank: s.rank_in_kingdom, value: s.value });
      });
      allStats.sort(function (a, b) { return a.pct - b.pct; });
      allStats.slice(0, 4).forEach(function (s) {
        var div = document.createElement('div');
        div.className = 'rc-stat';
        div.innerHTML =
          '<div class="rc-stat-label">' + escapeHtml(s.cat.label) + '</div>' +
          '<div class="rc-stat-value">' + formatValue(s.value, s.cat.format) + '</div>' +
          '<div class="rc-stat-sub">#' + s.rank + ' · top ' + Math.max(1, Math.round(s.pct)) + '%</div>';
        statsGrid.appendChild(div);
      });
    } else {
      // Fallback: show TC level + kingdom info only
      var tc = document.createElement('div');
      tc.className = 'rc-stat';
      tc.innerHTML =
        '<div class="rc-stat-label">Town Center</div>' +
        '<div class="rc-stat-value">' + (profile.stove_lv || '?') + '</div>' +
        '<div class="rc-stat-sub">' + townCenterLabel(profile.stove_lv) + '</div>';
      statsGrid.appendChild(tc);

      var kd = document.createElement('div');
      kd.className = 'rc-stat';
      kd.innerHTML =
        '<div class="rc-stat-label">Kingdom</div>' +
        '<div class="rc-stat-value">K' + (profile.kid || '?') + '</div>' +
        '<div class="rc-stat-sub">' + (scraperMatch && scraperMatch.kingdom_scraped ? 'Scraped — rank not in top 60' : 'Not yet scraped') + '</div>';
      statsGrid.appendChild(kd);
    }

    // Callouts — strength + weakness
    var calloutsEl = document.getElementById('rc-callouts');
    calloutsEl.innerHTML = '';
    if (strength_weakness.strength) {
      var s = strength_weakness.strength;
      var div = document.createElement('div');
      div.className = 'rc-callout strength';
      div.innerHTML =
        '<div class="rc-callout-label">💪 Your Strength</div>' +
        '<div class="rc-callout-value">' + escapeHtml(s.cat.label) + '</div>' +
        '<div class="rc-callout-sub">#' + s.rank + ' in kingdom · top ' + Math.max(1, Math.round(s.pct)) + '%</div>';
      calloutsEl.appendChild(div);
    }
    if (strength_weakness.weakness) {
      var w = strength_weakness.weakness;
      var divw = document.createElement('div');
      divw.className = 'rc-callout weakness';
      divw.innerHTML =
        '<div class="rc-callout-label">📉 Your Weakness</div>' +
        '<div class="rc-callout-value">' + escapeHtml(w.cat.label) + '</div>' +
        '<div class="rc-callout-sub">#' + w.rank + ' in kingdom · top ' + Math.max(1, Math.round(w.pct)) + '%</div>';
      calloutsEl.appendChild(divw);
    }

    card.classList.add('visible');

    // Show/hide the "kingdom not scraped" note
    var noteEl = document.getElementById('rc-unranked-note');
    if (!scraperMatch || !scraperMatch.matched_categories.length) {
      noteEl.style.display = 'block';
      noteEl.innerHTML = scraperMatch && scraperMatch.kingdom_scraped
        ? '<strong>Your kingdom is scraped but you fall outside our top-60 rankings.</strong> We show the stats we know — rank your way up to appear on the leaderboards.'
        : '<strong>Your kingdom isn\'t in our scraper rotation yet.</strong> Request a scrape from the <a href="../kingdoms/">Kingdom Rankings</a> page (5 credits) to unlock your full stats next time.';
    } else {
      noteEl.style.display = 'none';
    }

    document.getElementById('rc-actions').style.display = 'flex';
  }

  function extractNicknameAndTag(raw) {
    var s = String(raw || '').trim();
    var m = s.match(/^\[([^\]]{1,8})\]\s*(.+)$/);
    if (m) return { tag: m[1], name: m[2] };
    return { tag: '', name: s };
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // Wire the form
  async function handleSubmit(e) {
    e.preventDefault();
    var fid = document.getElementById('rc-fid').value.trim();
    var btn = document.getElementById('rc-btn');
    if (!/^\d{4,12}$/.test(fid)) {
      setStatus('Player ID must be 4-12 digits.', 'err');
      return;
    }
    setStatus('Looking up your profile… this can take up to ~15s the first time.', 'info');
    btn.disabled = true;
    btn.textContent = 'Working…';

    try {
      // 1. Fetch profile from the Worker /player/lookup endpoint
      var resp = await fetch(LOOKUP_URL, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ fid: fid }),
      });
      if (!resp.ok) {
        if (resp.status === 404) throw new Error('Player ID not found. Double-check the number.');
        if (resp.status === 429) throw new Error('Lookups are rate-limited right now. Wait a few seconds and try again.');
        throw new Error('Lookup failed (HTTP ' + resp.status + ').');
      }
      var profile = await resp.json();

      // 2. Fetch scraper data
      setStatus('Calculating your kingdom rank…', 'info');
      var pdResp = await fetch(PLAYERS_DATA_URL);
      var playersData = pdResp.ok ? await pdResp.json() : { categories: {}, kingdoms_covered: [] };

      // 3. Match in scraper data
      var scraperMatch = findPlayerInScraperData(playersData, profile.nickname, profile.kid);

      // 4. Render
      renderCard(profile, scraperMatch);
      setStatus('', null);

      // Update URL so it's shareable
      var newUrl = window.location.pathname + '?fid=' + encodeURIComponent(fid);
      window.history.replaceState({}, '', newUrl);
    } catch (err) {
      setStatus(err.message || 'Something went wrong. Try again.', 'err');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Generate';
    }
  }

  // Download card as image (html2canvas)
  async function handleDownload() {
    var card = document.getElementById('rc-card');
    if (!card.classList.contains('visible')) return;
    var btn = document.getElementById('rc-download');
    var original = btn.textContent;
    btn.textContent = 'Rendering…';
    btn.disabled = true;
    try {
      // Tell html2canvas to ignore the decorative ::before/::after (can cause artifacts)
      var canvas = await html2canvas(card, {
        backgroundColor: '#0d0d0f',
        scale: 2,        // 2x for retina sharpness
        useCORS: true,
        allowTaint: false,
        logging: false,
      });
      var link = document.createElement('a');
      link.download = 'kingshotpro-report-card.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      setStatus('Image export failed — try taking a screenshot instead. (' + err.message + ')', 'err');
    } finally {
      btn.textContent = original;
      btn.disabled = false;
    }
  }

  function handleCopyLink() {
    var url = window.location.href;
    navigator.clipboard.writeText(url).then(function () {
      var btn = document.getElementById('rc-copy-link');
      var original = btn.textContent;
      btn.textContent = '✓ Copied!';
      setTimeout(function () { btn.textContent = original; }, 1800);
    }).catch(function () {
      setStatus('Copy failed — the URL is ' + url, 'err');
    });
  }

  document.getElementById('rc-form').addEventListener('submit', handleSubmit);
  document.getElementById('rc-download').addEventListener('click', handleDownload);
  document.getElementById('rc-copy-link').addEventListener('click', handleCopyLink);

  // If URL has ?fid=, prefill and auto-generate
  var params = new URLSearchParams(window.location.search);
  var prefilledFid = params.get('fid');
  if (prefilledFid && /^\d{4,12}$/.test(prefilledFid)) {
    document.getElementById('rc-fid').value = prefilledFid;
    document.getElementById('rc-form').dispatchEvent(new Event('submit', { cancelable: true }));
  }
})();

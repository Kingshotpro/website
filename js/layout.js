/**
 * layout.js — Sidebar + Topbar layout injection
 * KingshotPro | Phase 1
 *
 * Dynamically builds the sidebar nav and sticky topbar.
 * Include on every page BEFORE page-specific scripts.
 * Removes any existing <nav class="nav"> (old top-nav).
 */
(function () {
  'use strict';

  // ── Path prefix (pages in /calculators/ or /guides/ need ../) ──
  var loc = window.location.pathname;
  var inSub = /\/calculators\/|\/guides\/|\/games\/|\/alliance\//.test(loc);
  var B = inSub ? '../' : '';

  // ── Navigation items ──────────────────────
  // cat  = category header
  // href = null → "Coming Soon"
  var NAV = [
    { icon: '\u{1F3E0}', label: 'Home',             href: B + 'index.html',                     key: 'home' },
    { icon: '\u{1F451}', label: 'Pro Plans',          href: B + 'pricing.html',                   key: 'pricing',    badges: ['New'] },
    { icon: '\u2764\uFE0F', label: 'Support Advisor',   href: B + 'support.html',                   key: 'support' },
    { icon: '\u{1F4DD}', label: 'Player Survey',       href: B + 'survey.html',                    key: 'survey',     badges: ['New'] },
    { cat: 'COMMUNITY' },
    { icon: '\u{1F381}', label: 'Gift Codes',       href: B + 'codes.html',                     key: 'codes',      badges: ['Popular'] },
    { icon: '\u{1F514}', label: 'Code Alerts',       href: B + 'auto-redeem.html',               key: 'auto-redeem', badges: ['Pro'] },
    { icon: '\u{1F4C5}', label: 'Event Calendar',    href: B + 'calendar.html',                  key: 'calendar',    badges: ['New'] },
    { icon: '\u{1F9B8}', label: 'Hero Database',     href: B + 'heroes.html',                    key: 'heroes',      badges: ['New'] },
    { icon: '\u{1F464}', label: 'Player Profile',   href: B + 'profile.html',                   key: 'profile',     badges: ['New'] },
    { cat: 'CALCULATORS' },
    { icon: '\u{1F3F0}', label: 'Building',         href: B + 'calculators/building.html',      key: 'building',   badges: ['Popular'] },
    { icon: '\u2694\uFE0F', label: 'Troop Training', href: B + 'calculators/troops.html',       key: 'troops',     badges: ['Popular'] },
    { icon: '\u{1F6E1}\uFE0F', label: 'Governor Gear', href: B + 'calculators/gear.html',       key: 'gear' },
    { icon: '\u2728',   label: 'Governor Charm',    href: B + 'calculators/charm.html',          key: 'charm' },
    { icon: '\u{1F9B8}', label: 'Hero Shards',      href: B + 'calculators/shards.html',         key: 'shards' },
    { icon: '\u{1F409}', label: 'Pets',             href: B + 'calculators/pets.html',            key: 'pets' },
    { icon: '\u{1F4CA}', label: 'Hero XP',          href: B + 'calculators/hero-xp.html',        key: 'hero-xp',    badges: ['New'] },
    { icon: '\u2694\uFE0F', label: 'Hero Gear',     href: B + 'calculators/hero-gear.html',      key: 'hero-gear' },
    { icon: '\u{1F4C8}', label: 'Hero Comparison',  href: B + 'calculators/hero-compare.html',   key: 'hero-compare' },
    { icon: '\u{1F3C6}', label: 'KvK Score',        href: B + 'calculators/kvk.html',            key: 'kvk' },
    { icon: '\u{1F52C}', label: 'War Academy',      href: B + 'calculators/war-academy.html',    key: 'war-academy' },
    { icon: '\u2B50',   label: 'VIP',               href: B + 'calculators/vip.html',            key: 'vip' },
    { icon: '\u{1F48E}', label: 'Truegold',         href: B + 'calculators/truegold.html',       key: 'truegold' },
    { cat: 'PLANNERS' },
    { icon: '\u{1F91D}', label: 'Alliance Mob.',    href: B + 'calculators/alliance-mob.html',   key: 'alliance-mob', badges: ['New'] },
    { icon: '\u{1F528}', label: 'Forgehammer',      href: B + 'calculators/forgehammer.html',    key: 'forgehammer' },
    { icon: '\u{1F4E6}', label: 'Pack Value',       href: B + 'calculators/pack-value.html',     key: 'pack-value',  badges: ['Pro'] },
    { cat: 'EVENTS' },
    { icon: '\u2694\uFE0F', label: 'Viking Vengeance', href: B + 'calculators/viking.html',      key: 'viking' },
    { icon: '\u{1F43B}', label: 'Troop Split',      href: B + 'calculators/troop-split.html',    key: 'troop-split' },
    { icon: '\u{1F52E}', label: 'Mystic Trials',    href: B + 'calculators/mystic.html',         key: 'mystic' },
    { cat: 'TOOLS' },
    { icon: '\u{1F6EB}', label: 'Transfer Calc',      href: B + 'calculators/transfer.html',       key: 'transfer',    badges: ['New'] },
    { icon: '\u{1F5FA}\uFE0F', label: 'Rally Planner', href: B + 'calculators/rally-planner.html', key: 'rally-planner' },
    { icon: '\u{1F5FA}\uFE0F', label: 'Map Planner',   href: B + 'calculators/map-planner.html',   key: 'map-planner' },
    { icon: '\u{1F48A}', label: 'Healing Cost',     href: B + 'calculators/healing.html',         key: 'healing' },
    { cat: 'ALLIANCE' },
    { icon: '\u{1F3D8}\uFE0F', label: 'Hive Layout',   href: B + 'calculators/hive-layout.html',   key: 'hive-layout', badges: ['New'] },
    { icon: '\u2694\uFE0F', label: 'War Planner',       href: B + 'calculators/war-planner.html',   key: 'war-planner', badges: ['New'] },
    { icon: '\u{1F4CB}', label: 'Alliance Roster',      href: B + 'calculators/roster.html',        key: 'roster',      badges: ['New'] },
    { cat: 'UTILITY' },
    { icon: '\u23F1\uFE0F', label: 'Speedup Calc',     href: B + 'calculators/speedups.html',      key: 'speedups',    badges: ['New'] },
    { icon: '\u{1F4CA}', label: 'Resource Planner',     href: B + 'calculators/resources.html',     key: 'resources',   badges: ['New'] },
    { icon: '\u{1F4AA}', label: 'Power Calculator',     href: B + 'calculators/power.html',         key: 'power',       badges: ['New'] },
    { icon: '\u2705',   label: 'Daily Checklist',       href: B + 'calculators/daily.html',         key: 'daily',       badges: ['New'] },
    { icon: '\u{1F4C5}', label: 'Event Timer',          href: B + 'calculators/events.html',        key: 'events',      badges: ['New'] },
    { cat: 'GAMES' },
    { icon: '\u2694\uFE0F', label: 'War Table',          href: B + 'games/war-table.html',           key: 'war-table',   badges: ['Daily'] },
    { icon: '\u{1F3F0}', label: 'Vault Trial',           href: B + 'games/vault-trial.html',         key: 'vault-trial', badges: ['Daily'] },
    { cat: 'ARCADE' },
    { icon: '\u{1F33A}', label: 'Kingdom Bloom',         href: B + 'games/bloom.html',               key: 'bloom' },
    { icon: '\u{1F30A}', label: 'Kingdom Drift',         href: B + 'games/drift.html',               key: 'drift' },
    { icon: '\u{1F4AB}', label: 'Royal Pulse',           href: B + 'games/pulse.html',               key: 'pulse' },
    { icon: '\u{1F525}', label: 'Torch Flicker',         href: B + 'games/flicker.html',             key: 'flicker' },
    { icon: '\u{1F30D}', label: 'Kingdom Orbit',         href: B + 'games/orbit.html',               key: 'orbit' },
    { cat: 'ALLIANCE' },
    { icon: '\u{1F6E1}\uFE0F', label: 'Alliance Pages',  href: B + 'alliance/index.html',            key: 'alliance',    badges: ['New'] },
    { icon: '\u{1F4CB}', label: 'Alliance Directory',   href: B + 'alliance/directory.html',         key: 'directory' },
    { cat: 'GUIDES' },
    { icon: '\u{1F4D6}', label: 'Beginner Guide',       href: B + 'guides/beginner.html',           key: 'beginner',    badges: ['New'] },
    { icon: '\u{1F4B0}', label: 'F2P Guide',             href: B + 'guides/f2p.html',                key: 'f2p',         badges: ['New'] },
    { icon: '\u2694\uFE0F', label: 'KvK Guide',          href: B + 'guides/kvk.html',                key: 'kvk',         badges: ['New'] },
    { icon: '\u{1F9B8}', label: 'Hero Guide',            href: B + 'guides/hero-guide.html',          key: 'hero-guide',  badges: ['New'] },
    { icon: '\u{1F525}', label: 'Furnace Guide',          href: B + 'guides/furnace.html',              key: 'furnace',     badges: ['New'] },
    { icon: '\u{1F91D}', label: 'Alliance Guide',        href: B + 'guides/alliance.html',             key: 'alliance-guide', badges: ['New'] },
    { icon: '\u{1F310}', label: 'Server Age Guide',      href: B + 'guides/server-age.html',           key: 'server-age',  badges: ['New'] },
    { icon: '\u{1F4B0}', label: 'Pack Value Guide',     href: B + 'guides/pack-value.html',           key: 'pack-value',  badges: ['New'] },
    { icon: '\u{1F9B8}', label: 'F2P Hero Builds',       href: B + 'guides/f2p-heroes.html',           key: 'f2p-heroes', badges: ['New'] },
    { icon: '\u{1F33E}', label: 'Farm Account Guide',   href: B + 'guides/farm-account.html',         key: 'farm-account', badges: ['New'] },
    { icon: '\u{1F4DA}', label: 'Glossary',              href: B + 'guides/glossary.html',            key: 'glossary' },
  ];

  // ── Active page ───────────────────────────
  function isActive(item) {
    if (!item.key) return false;
    if (item.key === 'home') {
      return loc === '/' || loc.endsWith('/index.html') || loc.endsWith('/');
    }
    return loc.indexOf(item.key + '.html') !== -1;
  }

  // ── Accordion state ────────────────────────
  var STORAGE_KEY = 'ksp_sb_collapsed';

  function getCollapsed() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
    catch(e) { return []; }
  }
  function saveCollapsed(arr) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(arr)); } catch(e) {}
  }

  // ── Build sidebar HTML ────────────────────
  function sidebarHTML() {
    var collapsed = getCollapsed();
    var h = '<nav class="sb-scroll" role="navigation" aria-label="Main">';

    // Group items by category
    var sections = [];
    var currentSection = null;
    for (var i = 0; i < NAV.length; i++) {
      var it = NAV[i];
      if (it.cat) {
        currentSection = { cat: it.cat, items: [] };
        sections.push(currentSection);
      } else if (currentSection) {
        currentSection.items.push(it);
      } else {
        // Items before first category (Home)
        sections.push({ single: it });
      }
    }

    for (var s = 0; s < sections.length; s++) {
      var sec = sections[s];

      // Single item (Home — no accordion)
      if (sec.single) {
        h += renderItem(sec.single);
        continue;
      }

      // Check if this section has the active page
      var hasActive = false;
      for (var j = 0; j < sec.items.length; j++) {
        if (isActive(sec.items[j])) { hasActive = true; break; }
      }

      var catId = sec.cat.toLowerCase().replace(/\s+/g, '-');
      var isCollapsed = !hasActive && collapsed.indexOf(catId) !== -1;
      var chevron = isCollapsed ? '\u25B8' : '\u25BE';
      var catCls = isCollapsed ? ' collapsed' : '';

      h += '<div class="sb-cat' + catCls + '" data-section="' + catId + '">';
      h += '<span class="sb-cat-label">' + sec.cat + '</span>';
      h += '<span class="sb-chevron">' + chevron + '</span>';
      h += '</div>';
      h += '<div class="sb-group' + (isCollapsed ? ' collapsed' : '') + '" data-group="' + catId + '">';
      for (var k = 0; k < sec.items.length; k++) {
        h += renderItem(sec.items[k]);
      }
      h += '</div>';
    }

    // Ecosystem section removed — don't send users to competitor sites

    // Ad slot: sidebar bottom
    h += '<div class="ad-slot sb-ad" data-slot="sidebar-bottom"></div>';

    // Avatar panel — shows advisor name, level, XP bar
    h += '<div class="sb-advisor" id="sb-advisor"></div>';

    h += '</nav>';
    return h;
  }

  function renderItem(it) {
    var active = isActive(it) ? ' active' : '';
    var dis    = !it.href ? ' disabled' : '';
    var bHTML  = '';
    if (it.badges) {
      for (var b = 0; b < it.badges.length; b++) {
        var t = it.badges[b];
        bHTML += '<span class="sb-badge ' + t.toLowerCase() + '">' + t + '</span>';
      }
    }
    if (!it.href) bHTML += '<span class="sb-badge soon">Soon</span>';
    var tag = it.href ? 'a' : 'span';
    var hr  = it.href ? ' href="' + it.href + '"' : '';
    var r = '<' + tag + hr + ' class="sb-item' + active + dis + '">';
    r += '<span class="sb-icon">' + it.icon + '</span>';
    r += '<span class="sb-text">' + it.label + '</span>';
    r += bHTML;
    r += '</' + tag + '>';
    return r;
  }

  // ── Build topbar HTML ─────────────────────
  function topbarHTML() {
    var profileBit = '';
    try {
      var raw = null;
      // Try localStorage first (persistent), then sessionStorage (fallback)
      var lastFid = localStorage.getItem('ksp_last_fid');
      if (lastFid) raw = localStorage.getItem('ksp_profile_' + lastFid);
      if (!raw) raw = sessionStorage.getItem('ksp_profile');
      if (raw) {
        var p = JSON.parse(raw);
        var ch = (p.nickname || '?').charAt(0).toUpperCase();
        profileBit =
          '<div class="tb-profile">' +
            '<span class="tb-av">' + ch + '</span>' +
            '<span class="tb-nick">' + (p.nickname || 'Player') + '</span>' +
            '<span class="tb-kid">K' + (p.kid || '?') + '</span>' +
          '</div>';
      }
    } catch (e) { /* private mode */ }
    if (!profileBit) {
      profileBit = '<a href="' + B + 'index.html#fid-form" class="btn btn-sm btn-outline tb-fid">Enter Player ID</a>';
    }
    return '<button class="tb-menu" id="sb-toggle" aria-label="Toggle navigation">' +
      '<span></span><span></span><span></span></button>' +
      '<a href="' + B + 'index.html" class="tb-brand">KingshotPro</a>' +
      '<div class="tb-spacer"></div>' + profileBit;
  }

  // ── Inject ────────────────────────────────
  function inject() {
    var old = document.querySelector('nav.nav');
    if (old) old.remove();

    var tb = document.createElement('header');
    tb.className = 'topbar';
    tb.id = 'topbar';
    tb.innerHTML = topbarHTML();
    document.body.prepend(tb);

    var sb = document.createElement('aside');
    sb.className = 'sidebar';
    sb.id = 'sidebar';
    sb.innerHTML = sidebarHTML();
    document.body.insertBefore(sb, tb.nextSibling);

    var ov = document.createElement('div');
    ov.className = 'sb-overlay';
    ov.id = 'sb-overlay';
    document.body.appendChild(ov);

    function toggle() {
      sb.classList.toggle('open');
      ov.classList.toggle('open');
    }
    document.getElementById('sb-toggle').addEventListener('click', toggle);
    ov.addEventListener('click', toggle);

    // Close sidebar on link click (mobile)
    sb.addEventListener('click', function (e) {
      if (window.innerWidth <= 768 && e.target.closest('a.sb-item')) {
        sb.classList.remove('open');
        ov.classList.remove('open');
      }
    });

    // Accordion toggle on category headers
    sb.addEventListener('click', function (e) {
      var cat = e.target.closest('.sb-cat');
      if (!cat) return;
      var sectionId = cat.getAttribute('data-section');
      if (!sectionId) return;
      var group = sb.querySelector('[data-group="' + sectionId + '"]');
      if (!group) return;

      var isNowCollapsed = !group.classList.contains('collapsed');
      group.classList.toggle('collapsed');
      cat.classList.toggle('collapsed');

      // Update chevron
      var chev = cat.querySelector('.sb-chevron');
      if (chev) chev.textContent = isNowCollapsed ? '\u25B8' : '\u25BE';

      // Persist state
      var arr = getCollapsed();
      var idx = arr.indexOf(sectionId);
      if (isNowCollapsed && idx === -1) arr.push(sectionId);
      else if (!isNowCollapsed && idx !== -1) arr.splice(idx, 1);
      saveCollapsed(arr);
    });

    // ── Populate advisor panel ───────────────
    populateAdvisorPanel();
    // Update panel when XP changes
    if (window.Advisor) {
      window.Advisor.on('xp', populateAdvisorPanel);
      window.Advisor.on('levelup', function (data) {
        populateAdvisorPanel();
        showLevelUpBanner(data);
      });
    }
  }

  function populateAdvisorPanel() {
    var el = document.getElementById('sb-advisor');
    if (!el) return;
    if (!window.Advisor) { el.innerHTML = ''; return; }

    var state = window.Advisor.getState();
    if (!state) {
      // No advisor yet — show teaser
      el.innerHTML =
        '<div class="sb-adv-teaser">' +
          '<span class="sb-adv-teaser-icon">\u{1F451}</span>' +
          '<span>Enter your Player ID to meet your advisor</span>' +
        '</div>';
      return;
    }

    var level = window.Advisor.getLevel();
    var xp = state.xp;
    var nextXP = window.Advisor.getNextLevelXP();
    var prevXP = window.Advisor.LEVEL_THRESHOLDS[level - 1] || 0;
    var progress = nextXP ? ((xp - prevXP) / (nextXP - prevXP)) * 100 : 100;
    if (progress > 100) progress = 100;

    var arch = window.Advisor.getArchetype();
    var archTitle = arch ? arch.title : '';
    var imgSrc = window.Advisor.getAvatarImage ? window.Advisor.getAvatarImage() : '';

    el.innerHTML =
      '<div class="sb-adv-card">' +
        '<div class="sb-adv-top">' +
          (imgSrc ? '<img class="sb-adv-img" src="' + imgSrc + '" alt="">' : '') +
          '<div class="sb-adv-info">' +
            '<div class="sb-adv-name">' + esc(state.name) + '</div>' +
            '<div class="sb-adv-arch">' + esc(archTitle) + '</div>' +
          '</div>' +
          '<div class="sb-adv-level">' + level + '</div>' +
        '</div>' +
        '<div class="sb-adv-xp-wrap">' +
          '<div class="sb-adv-xp-bar"><div class="sb-adv-xp-fill" style="width:' + progress.toFixed(1) + '%"></div></div>' +
          '<div class="sb-adv-xp-label">' + xp + (nextXP ? ' / ' + nextXP : ' XP') + ' XP</div>' +
        '</div>' +
      '</div>';
  }

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // ── Level-up banner ───────────────────────
  function showLevelUpBanner(data) {
    var state = window.Advisor ? window.Advisor.getState() : null;
    var name = state ? state.name : 'Your Advisor';
    var arch = state ? state.archetype : 'steward';
    var msg = window.getLevelUpMessage ? window.getLevelUpMessage(arch, data.to) : '';

    var banner = document.createElement('div');
    banner.className = 'levelup-banner';
    banner.innerHTML =
      '<span class="levelup-icon">\u2B50</span> ' +
      '<strong>' + esc(name) + '</strong> reached <strong>Level ' + data.to + '</strong>!' +
      (msg ? '<br><span style="font-size:13px;opacity:0.8;font-style:italic;">' + esc(msg) + '</span>' : '');
    document.body.appendChild(banner);

    requestAnimationFrame(function () { banner.classList.add('visible'); });
    setTimeout(function () {
      banner.classList.remove('visible');
      setTimeout(function () { banner.remove(); }, 500);
    }, 4000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }
})();

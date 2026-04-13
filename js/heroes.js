/**
 * heroes.js — Kingshot Hero Database
 * KingshotPro
 *
 * Data sources (cross-verified April 13, 2026):
 *   - kingshotmastery.com/guides/kingshot-hero-tier-list-2025
 *   - kingshotguides.com/guide/the-only-kingshot-hero-tier-list-you-actually-need/
 *   - grindnstrat.com/kingshot-hero-lineup-guide-year-solo-rally-garrison/
 *   - kingshotdata.com/category/heroes/
 *
 * Troop type pattern: Gen 2-6 each have exactly 3 legendary heroes (1 infantry, 1 cavalry, 1 archer).
 * Gen 1 has 4 legendary heroes. Epic heroes span multiple generations.
 *
 * IMPORTANT: Do NOT add data that hasn't been verified from at least 2 sources.
 * If a field is uncertain, mark it with a comment. Better to say "unknown" than to guess.
 */

var HEROES = [
  // ─── GENERATION 1 — LEGENDARY ───
  {
    name:     'Amadeus',
    gen:      1,
    rarity:   'legendary',
    troop:    'infantry',
    rally:    'S',
    garrison: 'B',
    bear:     'S',
    joiner:   'A',
    f2p:      false,
    bestUse:  'Rally lead & bear hunt',
    desc:     'One of the strongest offensive heroes in the game. His first skill provides dependable rally value. Remains S-tier for rallies across all generations. Often requires premium investment to fully star up.',
    tags:     ['rally-lead', 'bear', 'offensive', 'long-term'],
  },
  {
    name:     'Jabel',
    gen:      1,
    rarity:   'legendary',
    troop:    'cavalry',
    rally:    'B',
    garrison: 'S',
    bear:     'B',
    joiner:   '-',
    f2p:      true,
    bestUse:  'Garrison defender',
    desc:     'The foundational garrison tank. Extremely robust and available early. Core of any defensive lineup from day one through late game.',
    tags:     ['garrison', 'defensive', 'f2p-friendly', 'tank'],
  },
  {
    name:     'Helga',
    gen:      1,
    rarity:   'legendary',
    troop:    'infantry',
    rally:    'A',
    garrison: 'B',
    bear:     'B',
    joiner:   '-',
    f2p:      false,
    bestUse:  'Early rally alternative',
    desc:     'A decent early offensive hero who serves as an Amadeus alternative. Falls off in later generations as stronger rally leads become available.',
    tags:     ['rally-lead', 'offensive', 'early-game'],
  },
  {
    name:     'Saul',
    gen:      1,
    rarity:   'legendary',
    troop:    'archer',
    rally:    'B',
    garrison: 'A',
    bear:     'B',
    joiner:   'S',
    f2p:      true,
    bestUse:  'Garrison joiner & stacking',
    desc:     'An S-tier joiner for garrison defense via stacking. Also invaluable for F2P players due to construction speed boosts. Dual-purpose hero: city management and garrison.',
    tags:     ['garrison', 'joiner', 'stacking', 'f2p-friendly', 'construction'],
  },

  // ─── GENERATION 2 — LEGENDARY ───
  {
    name:     'Zoe',
    gen:      2,
    rarity:   'legendary',
    troop:    'infantry',
    rally:    'B',
    garrison: 'S',
    bear:     '-',
    joiner:   '-',
    f2p:      true,
    bestUse:  'F2P garrison tank',
    desc:     'The F2P garrison MVP. Remains viable well into Gen 5-6 with proper support. Her defensive capabilities, damage reduction, and crowd control are unmatched for free players.',
    tags:     ['garrison', 'defensive', 'f2p-friendly', 'tank', 'long-term'],
  },
  {
    name:     'Hilde',
    gen:      2,
    rarity:   'legendary',
    troop:    'cavalry',
    rally:    'B',
    garrison: 'S',
    bear:     'A',
    joiner:   'S',
    f2p:      false,
    bestUse:  'Garrison joiner & healer',
    desc:     'A dedicated healer who can also disable enemies briefly. One of the best healers in the game. S-tier joiner for garrison stacking.',
    tags:     ['garrison', 'joiner', 'stacking', 'healer', 'support'],
  },
  {
    name:     'Marlin',
    gen:      2,
    rarity:   'legendary',
    troop:    'archer',
    rally:    'S',
    garrison: 'B',
    bear:     'B',
    joiner:   '-',
    f2p:      true,
    bestUse:  'Long-term archer carry',
    desc:     'Excellent ranged damage dealer. A long-term F2P investment — aim for 465 shards to reach 4-stars quickly when available. Excels in both PvE and PvP, powerful in arena and expedition.',
    tags:     ['rally-lead', 'offensive', 'f2p-friendly', 'long-term', 'arena'],
  },

  // ─── GENERATION 3 — LEGENDARY ───
  {
    name:     'Petra',
    gen:      3,
    rarity:   'legendary',
    troop:    'cavalry',
    rally:    'S',
    garrison: 'B',
    bear:     'B',
    joiner:   '-',
    f2p:      true,
    bestUse:  'Cavalry rally lead',
    desc:     'The premier cavalry rally lead. Often featured in Hero Roulette events, making her accessible to F2P players. Flexible hero that excels on offense.',
    tags:     ['rally-lead', 'offensive', 'cavalry', 'f2p-friendly'],
  },
  {
    name:     'Eric',
    gen:      3,
    rarity:   'legendary',
    troop:    'infantry',
    rally:    'B',
    garrison: 'S',
    bear:     'B',
    joiner:   '-',
    f2p:      false,
    bestUse:  'Garrison defender',
    desc:     'A solid garrison infantry defender who joins the defensive rotation. Reliable but not as impactful as Zoe for F2P players.',
    tags:     ['garrison', 'defensive'],
  },
  {
    name:     'Jaeger',
    gen:      3,
    rarity:   'legendary',
    troop:    'archer',
    rally:    'B',
    garrison: 'S',
    bear:     'B',
    joiner:   '-',
    f2p:      false,
    bestUse:  'Garrison archer',
    desc:     'Garrison-oriented archer who strengthens defensive lineups. Lower priority for F2P players compared to Marlin.',
    tags:     ['garrison', 'defensive'],
  },

  // ─── GENERATION 4 — LEGENDARY ───
  {
    name:     'Rosa',
    gen:      4,
    rarity:   'legendary',
    troop:    'archer',
    rally:    'A',
    garrison: 'B',
    bear:     'B',
    joiner:   '-',
    f2p:      false,
    bestUse:  'Arena specialist',
    desc:     'Strong offensive archer and arena specialist. Accessible through specific events. Only invest if you see a clear path to consistent shard collection.',
    tags:     ['rally-lead', 'offensive', 'arena'],
  },
  {
    name:     'Alcar',
    gen:      4,
    rarity:   'legendary',
    troop:    'infantry',
    rally:    'B',
    garrison: 'S',
    bear:     'A',
    joiner:   '-',
    f2p:      false,
    bestUse:  'Garrison infantry',
    desc:     'Premium garrison infantry defender. Strong in garrison and bear hunt but typically requires significant investment.',
    tags:     ['garrison', 'defensive', 'bear'],
  },
  {
    name:     'Margot',
    gen:      4,
    rarity:   'legendary',
    troop:    'cavalry',
    rally:    'B',
    garrison: 'S',
    bear:     'S',
    joiner:   'A',
    f2p:      false,
    bestUse:  'Garrison & bear joiner',
    desc:     'Excels in garrison defense and bear hunt. A strong joiner who adds depth to both defensive and PvE lineups.',
    tags:     ['garrison', 'joiner', 'bear', 'defensive'],
  },

  // ─── GENERATION 5 — LEGENDARY ───
  {
    name:     'Vivian',
    gen:      5,
    rarity:   'legendary',
    troop:    'archer',
    rally:    'S+',
    garrison: 'B',
    bear:     'S',
    joiner:   'S',
    f2p:      false,
    bestUse:  'Army-wide damage buff',
    desc:     'One of the most impactful heroes in the game. Provides army-wide damage buffs that elevate entire rally lineups. S+ tier for rallies.',
    tags:     ['rally-lead', 'offensive', 'bear', 'joiner', 'buff', 'long-term'],
  },
  {
    name:     'Thrud',
    gen:      5,
    rarity:   'legendary',
    troop:    'cavalry',
    rally:    'S',
    garrison: 'A',
    bear:     'B',
    joiner:   '-',
    f2p:      false,
    bestUse:  'Cavalry multiplier',
    desc:     'A powerful cavalry multiplier who amplifies cavalry-heavy rally compositions. Strong on offense with some garrison flexibility.',
    tags:     ['rally-lead', 'offensive', 'cavalry'],
  },
  {
    name:     'Long Fei',
    gen:      5,
    rarity:   'legendary',
    troop:    'infantry',
    rally:    'A',
    garrison: 'S',
    bear:     'A',
    joiner:   '-',
    f2p:      false,
    bestUse:  'Garrison infantry',
    desc:     'Late-game garrison infantry specialist. Strong across garrison and bear hunt. A premium investment for defensive players.',
    tags:     ['garrison', 'defensive', 'bear'],
  },

  // ─── GENERATION 6 — LEGENDARY ───
  {
    name:     'Yang',
    gen:      6,
    rarity:   'legendary',
    troop:    'archer',
    rally:    'S+',
    garrison: 'B',
    bear:     'S',
    joiner:   '-',
    f2p:      true,
    bestUse:  'F2P rally carry',
    desc:     'The F2P late-game MVP. Provides significant rally impact and is accessible through challenging events, alliance activities, and daily play. Prioritize saving shards for Yang from Gen 5 onward.',
    tags:     ['rally-lead', 'offensive', 'f2p-friendly', 'long-term'],
  },
  {
    name:     'Sophia',
    gen:      6,
    rarity:   'legendary',
    troop:    'cavalry',
    rally:    'S',
    garrison: 'A',
    bear:     'B',
    joiner:   '-',
    f2p:      false,
    bestUse:  'Confusion-based debuffer',
    desc:     'A cavalry debuffer who disrupts enemy formations with confusion effects. Strong rally presence with some garrison capability.',
    tags:     ['rally-lead', 'offensive', 'cavalry', 'debuff'],
  },
  {
    name:     'Triton',
    gen:      6,
    rarity:   'legendary',
    troop:    'infantry',
    rally:    'A',
    garrison: 'S',
    bear:     'A',
    joiner:   '-',
    f2p:      false,
    bestUse:  'Garrison infantry',
    desc:     'The strongest frontline unit in Gen 6. Dominates garrison defense and is a solid bear hunt contributor.',
    tags:     ['garrison', 'defensive', 'bear', 'tank'],
  },

  // ─── EPIC HEROES ───
  {
    name:     'Chenko',
    gen:      1,
    rarity:   'epic',
    troop:    'cavalry',
    rally:    '-',
    garrison: '-',
    bear:     'S',
    joiner:   'S',
    f2p:      true,
    bestUse:  'Best F2P rally joiner',
    desc:     'His first skill provides dependable rally value — considered the best rally joiner skill for F2P players. Essential for bear hunt participation.',
    tags:     ['joiner', 'bear', 'f2p-friendly', 'long-term'],
  },
  {
    name:     'Amane',
    gen:      1,
    rarity:   'epic',
    troop:    'archer',
    rally:    '-',
    garrison: '-',
    bear:     'S',
    joiner:   'S',
    f2p:      true,
    bestUse:  'Offensive stacking joiner',
    desc:     'An excellent offensive stacking joiner for bear hunt and rallies. Pairs well with archer-heavy compositions.',
    tags:     ['joiner', 'bear', 'stacking', 'f2p-friendly'],
  },
  {
    name:     'Yeonwoo',
    gen:      1,
    rarity:   'epic',
    troop:    'archer',
    rally:    '-',
    garrison: '-',
    bear:     'S',
    joiner:   'S',
    f2p:      true,
    bestUse:  'Non-chance offensive joiner',
    desc:     'A reliable joiner whose offensive contribution does not rely on chance mechanics. Consistent value in rally and bear hunt.',
    tags:     ['joiner', 'bear', 'f2p-friendly'],
  },
  {
    name:     'Gordon',
    gen:      1,
    rarity:   'epic',
    troop:    'cavalry',
    rally:    'B',
    garrison: '-',
    bear:     '-',
    joiner:   'A',
    f2p:      true,
    bestUse:  'Early-game reliable',
    desc:     'A reliable early-game hero who provides decent value until stronger options become available.',
    tags:     ['early-game', 'f2p-friendly', 'joiner'],
  },
  {
    name:     'Howard',
    gen:      1,
    rarity:   'epic',
    troop:    'infantry',
    rally:    '-',
    garrison: 'B',
    bear:     '-',
    joiner:   '-',
    f2p:      true,
    bestUse:  'Garrison only',
    desc:     'Limited utility — garrison only. Quickly outclassed by Gen 2+ heroes. Low priority for investment.',
    tags:     ['garrison', 'early-game', 'f2p-friendly'],
  },
  {
    name:     'Quinn',
    gen:      1,
    rarity:   'epic',
    troop:    'archer',
    rally:    '-',
    garrison: '-',
    bear:     '-',
    joiner:   '-',
    f2p:      true,
    bestUse:  'Low priority',
    desc:     'Low boost value with limited combat utility. Not recommended for significant investment.',
    tags:     ['f2p-friendly', 'early-game'],
  },
  {
    name:     'Diana',
    gen:      1,
    rarity:   'epic',
    troop:    'archer',
    rally:    '-',
    garrison: '-',
    bear:     '-',
    joiner:   '-',
    f2p:      true,
    bestUse:  'Gathering (no battle skills)',
    desc:     'No battle skills — she is a gathering hero only. Useful for resource farming with farm accounts but has zero combat value.',
    tags:     ['gathering', 'f2p-friendly', 'farm'],
  },
  {
    name:     'Fahd',
    gen:      1,
    rarity:   'epic',
    troop:    'cavalry',
    rally:    '-',
    garrison: '-',
    bear:     'D',
    joiner:   'B',
    f2p:      true,
    bestUse:  'Low priority joiner',
    desc:     'Very low priority. Only use if you have absolutely no other joiner options. Quickly outclassed.',
    tags:     ['f2p-friendly', 'early-game'],
  },
];

// ─── LINEUP RECOMMENDATIONS ───
// These are verified from community sources + tier lists. Not exhaustive.

var LINEUPS = {
  f2p_early: {
    label: 'F2P Early Game (Gen 1-2)',
    heroes: ['Jabel', 'Zoe', 'Marlin', 'Chenko', 'Saul'],
    note: 'Jabel + Zoe for garrison. Marlin for offense. Chenko for rally joining. Saul for construction speed + garrison stacking.',
  },
  f2p_mid: {
    label: 'F2P Mid Game (Gen 3-4)',
    heroes: ['Zoe', 'Marlin', 'Petra', 'Chenko', 'Saul'],
    note: 'Add Petra as cavalry rally lead. Zoe and Marlin remain core. Start saving shards for Gen 6 Yang.',
  },
  f2p_late: {
    label: 'F2P Late Game (Gen 5-6)',
    heroes: ['Zoe', 'Marlin', 'Yang', 'Petra', 'Chenko'],
    note: 'Yang becomes your F2P rally carry. Zoe still holds garrison. Save everything for Yang shards from Gen 5 onward.',
  },
  rally_offense: {
    label: 'Rally Offense (Spender)',
    heroes: ['Amadeus', 'Vivian', 'Petra', 'Thrud', 'Rosa'],
    note: 'Amadeus + Vivian lead. Petra for cavalry rallies. Thrud multiplies cavalry. Rosa for arena crossover.',
  },
  garrison_defense: {
    label: 'Garrison Defense',
    heroes: ['Jabel', 'Zoe', 'Eric', 'Hilde', 'Saul'],
    note: 'Jabel + Zoe core tanks. Eric adds infantry depth. Hilde heals and stacks. Saul stacks via joining.',
  },
  bear_hunt: {
    label: 'Bear Hunt',
    heroes: ['Amadeus', 'Vivian', 'Chenko', 'Amane', 'Yeonwoo'],
    note: 'Amadeus and Vivian lead damage. Chenko, Amane, Yeonwoo as S-tier joiners.',
  },
};

// ─── FILTER & RENDER ───

var activeFilters = { gen: 'all', troop: 'all', role: 'all', rarity: 'all', f2p: 'all' };

function escH(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function tierColor(tier) {
  if (tier === 'S+') return '#fbbf24';
  if (tier === 'S')  return '#4ade80';
  if (tier === 'A')  return '#60a5fa';
  if (tier === 'B')  return '#9ca3af';
  if (tier === 'C')  return '#f87171';
  if (tier === 'D')  return '#ef4444';
  return '#6b7280';
}

function tierBadge(label, tier) {
  if (!tier || tier === '-') return '<span class="hero-tier hero-tier-none">' + label + ': —</span>';
  return '<span class="hero-tier" style="color:' + tierColor(tier) + '">' + label + ': ' + tier + '</span>';
}

function matchesFilters(hero) {
  if (activeFilters.gen !== 'all' && hero.gen !== Number(activeFilters.gen)) return false;
  if (activeFilters.troop !== 'all' && hero.troop !== activeFilters.troop) return false;
  if (activeFilters.rarity !== 'all' && hero.rarity !== activeFilters.rarity) return false;
  if (activeFilters.f2p !== 'all') {
    if (activeFilters.f2p === 'yes' && !hero.f2p) return false;
    if (activeFilters.f2p === 'no' && hero.f2p) return false;
  }
  if (activeFilters.role !== 'all') {
    var r = activeFilters.role;
    if (r === 'rally' && hero.rally !== 'S' && hero.rally !== 'S+' && hero.rally !== 'A') return false;
    if (r === 'garrison' && hero.garrison !== 'S' && hero.garrison !== 'A') return false;
    if (r === 'joiner' && hero.joiner !== 'S' && hero.joiner !== 'A') return false;
    if (r === 'bear' && hero.bear !== 'S' && hero.bear !== 'A') return false;
  }
  return true;
}

function renderHeroCard(hero) {
  var troopIcon = { infantry: '\u2694\uFE0F', cavalry: '\uD83C\uDFC7', archer: '\uD83C\uDFF9' }[hero.troop] || '';
  var rarityClass = hero.rarity === 'legendary' ? 'hero-legendary' : 'hero-epic';
  var f2pBadge = hero.f2p ? '<span class="hero-f2p">F2P</span>' : '';

  var heroSlug = hero.name.toLowerCase().replace(/ /g, '-').replace(/'/g, '');
  var heroLink = 'heroes/' + heroSlug + '/';

  return '<a href="' + heroLink + '" class="hero-card ' + rarityClass + '" style="text-decoration:none;display:block;">' +
    '<div class="hero-card-header">' +
      '<div class="hero-name-row">' +
        '<span class="hero-name">' + escH(hero.name) + '</span>' +
        f2pBadge +
      '</div>' +
      '<div class="hero-meta">' +
        troopIcon + ' ' + hero.troop.charAt(0).toUpperCase() + hero.troop.slice(1) +
        ' · Gen ' + hero.gen +
        ' · ' + hero.rarity.charAt(0).toUpperCase() + hero.rarity.slice(1) +
      '</div>' +
    '</div>' +
    '<div class="hero-tiers">' +
      tierBadge('Rally', hero.rally) +
      tierBadge('Garrison', hero.garrison) +
      tierBadge('Bear', hero.bear) +
      tierBadge('Joiner', hero.joiner) +
    '</div>' +
    '<div class="hero-best-use">' + escH(hero.bestUse) + '</div>' +
    '<div class="hero-desc">' + escH(hero.desc) + '</div>' +
  '</a>';
}

function renderLineup(key) {
  var l = LINEUPS[key];
  var heroNames = l.heroes.map(function(name) {
    return '<span class="lineup-hero">' + escH(name) + '</span>';
  }).join(' ');
  return '<div class="lineup-card">' +
    '<div class="lineup-label">' + escH(l.label) + '</div>' +
    '<div class="lineup-heroes">' + heroNames + '</div>' +
    '<div class="lineup-note">' + escH(l.note) + '</div>' +
  '</div>';
}

function renderAll() {
  var container = document.getElementById('hero-grid');
  if (!container) return;

  var filtered = HEROES.filter(matchesFilters);

  if (filtered.length === 0) {
    container.innerHTML = '<p class="text-muted" style="text-align:center;padding:40px;">No heroes match your filters.</p>';
    return;
  }

  // Group by generation
  var byGen = {};
  filtered.forEach(function(h) {
    if (!byGen[h.gen]) byGen[h.gen] = [];
    byGen[h.gen].push(h);
  });

  var html = '';
  var gens = Object.keys(byGen).sort(function(a, b) { return Number(a) - Number(b); });
  gens.forEach(function(gen) {
    html += '<h2 class="hero-gen-header">Generation ' + gen + '</h2>';
    html += '<div class="hero-gen-grid">';
    byGen[gen].forEach(function(h) { html += renderHeroCard(h); });
    html += '</div>';
  });

  container.innerHTML = html;

  // Update count
  var countEl = document.getElementById('hero-count');
  if (countEl) countEl.textContent = filtered.length + ' of ' + HEROES.length + ' heroes';
}

function renderLineups() {
  var container = document.getElementById('lineup-grid');
  if (!container) return;
  var html = '';
  Object.keys(LINEUPS).forEach(function(key) { html += renderLineup(key); });
  container.innerHTML = html;
}

function setFilter(key, value) {
  activeFilters[key] = value;
  // Update button active states
  var btns = document.querySelectorAll('[data-filter="' + key + '"]');
  btns.forEach(function(btn) {
    btn.classList.toggle('filter-active', btn.getAttribute('data-value') === value);
  });
  renderAll();
}

function initAdvisorRecommendation() {
  var el = document.getElementById('advisor-rec');
  if (!el) return;

  // Load player profile if available
  var profile = (window.KSP && window.KSP.loadProfile) ? window.KSP.loadProfile() : null;
  if (!profile) {
    el.innerHTML = '<p class="text-muted">Enter your Player ID on the <a href="index.html" style="color:var(--gold);">homepage</a> for personalized hero recommendations.</p>';
    return;
  }

  var recs = [];
  if (profile.gameStage === 'early') {
    recs.push('Your furnace is below 15 — focus on <strong>Jabel</strong> (garrison) and <strong>Marlin</strong> (offense). Save universal shards.');
    recs.push('Get <strong>Chenko</strong> starred up for rally joining — his first skill is the best F2P joiner skill in the game.');
    recs.push('Don\'t spread resources thin. Pick 3-4 heroes and invest deeply.');
  } else if (profile.gameStage === 'mid') {
    recs.push('Mid-game: <strong>Zoe</strong> should be your garrison anchor. Add <strong>Petra</strong> for cavalry rallies.');
    recs.push('Start saving shards for <strong>Yang</strong> (Gen 6) — he will be your F2P endgame carry.');
    if (profile.spendingTier === 'f2p') {
      recs.push('As F2P, avoid Alcar, Margot, and Eric — they require premium investment to shine.');
    }
  } else {
    recs.push('Late game: <strong>Yang</strong> is your priority if you haven\'t maxed him. S+ rally carry.');
    recs.push('<strong>Vivian</strong> provides army-wide buffs that elevate every rally. Worth investing in.');
    if (profile.spendingTier === 'whale') {
      recs.push('At your spend level, <strong>Amadeus + Vivian + Thrud</strong> form the strongest rally core in the game.');
    }
  }

  var html = '<div class="advisor-rec-header">Advisor Recommendation for ' + escH(profile.nickname) + '</div>';
  html += '<ul class="advisor-rec-list">';
  recs.forEach(function(r) { html += '<li>' + r + '</li>'; });
  html += '</ul>';
  el.innerHTML = html;
}

document.addEventListener('DOMContentLoaded', function() {
  // Wire filter buttons
  document.querySelectorAll('[data-filter]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      setFilter(btn.getAttribute('data-filter'), btn.getAttribute('data-value'));
    });
  });

  renderAll();
  renderLineups();
  initAdvisorRecommendation();
});

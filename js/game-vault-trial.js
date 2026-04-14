// VAULT_QUESTIONS — rewritten April 14, 2026 during the Site Content Audit.
// The previous 35 questions referenced fabricated heroes (Leonidas, Attila, Hannibal,
// Robin Hood, Cleopatra, Midas, etc.) and fabricated events (Monster Hunt, Treasure
// Trove, Heroic Challenge, Resource Rush, Building Boom). None existed in Kingshot.
// This replacement uses only content that is cross-verified against:
//   - js/heroes.js (the canonical hero database, cross-verified April 13 from 4 sources)
//   - meta.html (verified troop formation data)
//   - External sources: kingshotmastery.com, kingshotguides.com
//   - docs/specs/KINGSHOT_KNOWLEDGE_BASE.md (advisor prompt, internal consistency)
// Wrong-answer options use REAL Kingshot hero names and REAL game concepts so that
// players learning from this quiz never encounter anything fabricated — correct OR wrong.
var VAULT_QUESTIONS = [
  { id:1, text:"Which troop type counters Cavalry in Kingshot?", options:["Infantry","Archers","Cavalry","None"], correct:0, category:"troops", explanation:"Infantry counters Cavalry. The triangle is Infantry → Cavalry → Archers → Infantry." },
  { id:2, text:"Which troop type counters Archers in Kingshot?", options:["Infantry","Cavalry","Archers","None"], correct:1, category:"troops", explanation:"Cavalry counters Archers by bypassing the frontline to eliminate them directly." },
  { id:3, text:"Which troop type counters Infantry in Kingshot?", options:["Infantry","Cavalry","Archers","None"], correct:2, category:"troops", explanation:"Archers counter Infantry with ranged damage that outpaces the infantry wall." },
  { id:4, text:"Which Gen 1 Legendary hero is the foundational F2P garrison tank?", options:["Amadeus","Jabel","Helga","Saul"], correct:1, category:"heroes", explanation:"Jabel is the foundational garrison tank — available early, free, and the core of every F2P defensive lineup from day one through early Gen 3." },
  { id:5, text:"Which Gen 1 Legendary hero is the top-tier S rally lead from day one?", options:["Amadeus","Jabel","Helga","Saul"], correct:0, category:"heroes", explanation:"Amadeus is one of the strongest offensive heroes in the game, holding S-tier rally across all generations." },
  { id:6, text:"Which Gen 2 Legendary hero is considered the F2P garrison MVP?", options:["Hilde","Marlin","Zoe","Eric"], correct:2, category:"heroes", explanation:"Zoe is the F2P garrison MVP and remains viable well into Gen 5-6 with proper support." },
  { id:7, text:"Which Gen 2 Legendary hero is the long-term F2P archer carry?", options:["Marlin","Jaeger","Rosa","Vivian"], correct:0, category:"heroes", explanation:"Marlin is the long-term F2P archer carry — excels in both PvE and PvP, strong in arena and expedition." },
  { id:8, text:"Which Gen 2 Legendary hero is considered the best healer in the game?", options:["Zoe","Marlin","Petra","Hilde"], correct:3, category:"heroes", explanation:"Hilde is a dedicated healer and one of the best healers in Kingshot. She's also an S-tier garrison joiner." },
  { id:9, text:"Which Gen 3 Legendary cavalry hero is the premier cavalry rally lead, often featured in Hero Roulette events?", options:["Hilde","Petra","Sophia","Margot"], correct:1, category:"heroes", explanation:"Petra is the premier cavalry rally lead and is often featured in Hero Roulette events, making her accessible to F2P players." },
  { id:10, text:"Which Gen 5 Legendary hero provides army-wide damage buffs and holds S+ rally rating?", options:["Thrud","Long Fei","Vivian","Rosa"], correct:2, category:"heroes", explanation:"Vivian provides army-wide damage buffs that elevate entire rally lineups. S+ tier for rallies." },
  { id:11, text:"Which Gen 5 Legendary cavalry hero multiplies cavalry damage?", options:["Petra","Thrud","Sophia","Hilde"], correct:1, category:"heroes", explanation:"Thrud is a powerful cavalry multiplier who amplifies cavalry-heavy rally compositions." },
  { id:12, text:"Which Gen 6 Legendary hero is the F2P late-game rally carry?", options:["Sophia","Triton","Yang","Vivian"], correct:2, category:"heroes", explanation:"Yang is the F2P late-game MVP. S+ rally carry, accessible through challenging events, alliance activities, and daily play." },
  { id:13, text:"Which Gen 6 Legendary infantry hero is the strongest frontline unit in Gen 6?", options:["Long Fei","Alcar","Eric","Triton"], correct:3, category:"heroes", explanation:"Triton dominates Gen 6 garrison defense and is a solid bear hunt contributor." },
  { id:14, text:"Which Epic cavalry hero has the best F2P rally joiner skill in Kingshot?", options:["Gordon","Amane","Chenko","Fahd"], correct:2, category:"heroes", explanation:"Chenko's first skill provides dependable rally value and is considered the best rally joiner skill for F2P players." },
  { id:15, text:"Which Gen 1 Epic archer hero is a pure gathering hero with no battle skills?", options:["Quinn","Diana","Yeonwoo","Amane"], correct:1, category:"heroes", explanation:"Diana has no battle skills — she is a gathering hero only, useful for resource farming with farm accounts." },
  { id:16, text:"Which Epic archer hero is an excellent offensive stacking joiner for bear hunt?", options:["Howard","Amane","Quinn","Fahd"], correct:1, category:"heroes", explanation:"Amane is an excellent offensive stacking joiner for bear hunt and rallies, pairing well with archer-heavy compositions." },
  { id:17, text:"How often does Bear Hunt occur in Kingshot?", options:["Daily","Every 2 days","Weekly","Monthly"], correct:1, category:"events", explanation:"Bear Hunt occurs every 2 days and lasts 30 minutes. It's rally-based and gives resources without cost — always participate." },
  { id:18, text:"Which Kingshot event is the monthly kingdom vs kingdom competition?", options:["Hall of Governors","Bear Hunt","KvK (Kingdom vs Kingdom)","Alliance Mobilization"], correct:2, category:"events", explanation:"KvK (Kingdom vs Kingdom) is the monthly kingdom vs kingdom competition. Preparation matters more than raw power." },
  { id:19, text:"Which Kingshot event is THE major growth event where you should save speedups and resources?", options:["Bear Hunt","Viking Vengeance","Hall of Governors","Swordland Showdown"], correct:2, category:"events", explanation:"Hall of Governors is the major growth event in Kingshot. Save speedups and resources for this — massive rewards." },
  { id:20, text:"What is the single most valuable early gem purchase in Kingshot?", options:["Speedups","Second building queue","Hero shards","Resource packs"], correct:1, category:"strategy", explanation:"The second building queue is the most valuable early gem purchase — it doubles your construction throughput for the entire game." },
  { id:21, text:"According to the KingshotPro meta guide, what's the minimum percentage of each troop type every formation should include?", options:["0%","5%","10%","25%"], correct:1, category:"troops", explanation:"All formations should include at least 5% of each troop type to utilize hero bonuses effectively. Never send a march with 0% of any type." },
  { id:22, text:"Which building gates your overall progression and unlocks higher troop tiers in Kingshot?", options:["Embassy","Town Center","Barracks","Alliance Hall"], correct:1, category:"buildings", explanation:"The Town Center gates everything in Kingshot — every other building caps at your Town Center level. Rush Town Center upgrades to unlock higher tiers faster." }
];
// ── Vault Trial Game Engine ────────────────
(function () {
  'use strict';

  var TODAY = new Date().toISOString().slice(0, 10);
  var PLAYED_KEY = 'ksp_vt_played';
  var TOTAL_Q = 5;

  function alreadyPlayed() {
    try { return localStorage.getItem(PLAYED_KEY) === TODAY; } catch (e) { return false; }
  }

  function pickQuestions() {
    var pool = VAULT_QUESTIONS.slice();
    var picked = [];
    for (var i = 0; i < TOTAL_Q && pool.length > 0; i++) {
      var idx = Math.floor(Math.random() * pool.length);
      picked.push(pool.splice(idx, 1)[0]);
    }
    return picked;
  }

  function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  function init() {
    var container = document.getElementById('vt-game');
    if (!container) return;

    if (alreadyPlayed()) {
      container.innerHTML = '<div class="card" style="text-align:center;padding:40px;">' +
        '<h2 style="color:var(--gold);">Trial complete for today.</h2>' +
        '<p class="text-muted">The Vault resets tomorrow. Return for new questions.</p>' +
        '</div>';
      return;
    }

    var questions = pickQuestions();
    var current = 0;
    var score = 0;

    function showQuestion() {
      if (current >= questions.length) {
        showResults();
        return;
      }

      var q = questions[current];
      var html = '<div class="vt-question">' +
        '<div class="vt-progress">Question ' + (current + 1) + ' of ' + TOTAL_Q + '</div>' +
        '<h3 class="vt-text">' + esc(q.text) + '</h3>' +
        '<div class="vt-options">';

      for (var i = 0; i < q.options.length; i++) {
        html += '<button class="btn btn-outline vt-opt" data-idx="' + i + '">' + esc(q.options[i]) + '</button>';
      }

      html += '</div><div id="vt-feedback" class="hidden"></div></div>';
      container.innerHTML = html;

      // Wire options
      container.querySelectorAll('.vt-opt').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var picked = parseInt(this.getAttribute('data-idx'));
          var correct = picked === q.correct;
          if (correct) score++;

          // Disable all buttons
          container.querySelectorAll('.vt-opt').forEach(function (b, j) {
            b.disabled = true;
            if (j === q.correct) b.style.borderColor = '#4ade80';
            if (j === picked && !correct) b.style.borderColor = '#f87171';
          });

          // Track missed category
          if (!correct && window.Advisor) {
            Advisor.observe('vault_trial', 'missed_topics', q.category);
          }

          // Show feedback
          var fb = document.getElementById('vt-feedback');
          fb.innerHTML = '<p style="margin-top:12px;color:' + (correct ? '#4ade80' : '#f87171') + ';">' +
            (correct ? '\u2705 Correct!' : '\u274C Wrong.') + '</p>' +
            '<p class="text-muted" style="font-size:13px;">' + esc(q.explanation) + '</p>' +
            '<button class="btn btn-primary mt-8" id="vt-next">' + (current < TOTAL_Q - 1 ? 'Next Question' : 'See Results') + '</button>';
          fb.classList.remove('hidden');

          document.getElementById('vt-next').addEventListener('click', function () {
            current++;
            showQuestion();
          });
        });
      });
    }

    function showResults() {
      var xpMap = { 5: 75, 4: 55, 3: 35 };
      var xp = xpMap[score] || 20;

      if (window.Advisor) {
        Advisor.observe('vault_trial', 'plays', 1);
        Advisor.grantXP('vault_trial', xp);
      }

      try { localStorage.setItem(PLAYED_KEY, TODAY); } catch (e) {}

      container.innerHTML = '<div class="card" style="text-align:center;padding:32px;">' +
        '<h2 style="color:var(--gold);">Trial Complete</h2>' +
        '<div style="font-size:48px;margin:16px 0;">' + score + ' / ' + TOTAL_Q + '</div>' +
        '<p class="text-muted">' +
          (score === 5 ? 'Perfect. Your knowledge is formidable.' :
           score >= 3 ? 'Solid showing. Room to sharpen.' :
           'The Vault has much to teach you. Return tomorrow.') +
        '</p>' +
        '<p style="color:var(--gold);font-weight:700;font-size:18px;">+' + xp + ' XP</p>' +
        '</div>';
    }

    showQuestion();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else { init(); }
})();

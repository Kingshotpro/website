var VAULT_QUESTIONS = [
  { id:1, text:"Which troop type counters Cavalry?", options:["Infantry","Archers","Siege","Cavalry"], correct:0, category:"troops", explanation:"Infantry counters Cavalry with +10% damage and defense bonuses." },
  { id:2, text:"Who is the hero known for boosting infantry attack?", options:["Gaius","Leonidas","Hannibal","Alexander"], correct:1, category:"heroes", explanation:"Leonidas is renowned for his infantry attack boost." },
  { id:3, text:"What resource is primarily used to train troops?", options:["Gold","Wood","Food","Stone"], correct:2, category:"resources", explanation:"Food is the main resource required for troop training." },
  { id:4, text:"During which event can you earn double rewards for defeating monsters?", options:["Monster Hunt","Treasure Trove","Heroic Challenge","Resource Rush"], correct:0, category:"events", explanation:"Monster Hunt event offers double rewards for defeating monsters." },
  { id:5, text:"Which building increases your army's defense?", options:["Barracks","Watchtower","Castle","Wall"], correct:3, category:"buildings", explanation:"The Wall increases your army's defense." },
  { id:6, text:"Which hero is best known for cavalry speed boost?", options:["Caesar","Attila","Boudica","Napoleon"], correct:1, category:"heroes", explanation:"Attila is known for his cavalry speed boost." },
  { id:7, text:"Which resource is crucial for constructing buildings?", options:["Food","Gold","Stone","Wood"], correct:3, category:"resources", explanation:"Wood is crucial for constructing buildings." },
  { id:8, text:"What is the primary benefit of upgrading your Castle?", options:["Increased troop training speed","More resources","Higher troop capacity","Faster healing"], correct:2, category:"buildings", explanation:"Upgrading the Castle increases troop capacity." },
  { id:9, text:"Which troop type is effective against Infantry?", options:["Cavalry","Siege","Archers","Infantry"], correct:2, category:"troops", explanation:"Archers are effective against Infantry with +10% damage." },
  { id:10, text:"Which event allows you to gain extra hero experience?", options:["Heroic Challenge","Resource Rush","Monster Hunt","Treasure Trove"], correct:0, category:"events", explanation:"Heroic Challenge grants extra hero experience." },
  { id:11, text:"Who is the hero known for increasing archer attack?", options:["Artemis","Robin Hood","Apollo","Hercules"], correct:1, category:"heroes", explanation:"Robin Hood is known for increasing archer attack." },
  { id:12, text:"Which resource is essential for researching technologies?", options:["Gold","Stone","Food","Wood"], correct:0, category:"resources", explanation:"Gold is essential for researching technologies." },
  { id:13, text:"Which building allows you to scout enemy territories?", options:["Castle","Watchtower","Barracks","Wall"], correct:1, category:"buildings", explanation:"The Watchtower allows you to scout enemy territories." },
  { id:14, text:"Which troop type is weak against Archers?", options:["Cavalry","Infantry","Siege","Archers"], correct:1, category:"troops", explanation:"Infantry is weak against Archers." },
  { id:15, text:"Which event rewards you for gathering resources?", options:["Resource Rush","Heroic Challenge","Monster Hunt","Treasure Trove"], correct:0, category:"events", explanation:"Resource Rush rewards players for gathering resources." },
  { id:16, text:"Which hero is known for siege engine attack boost?", options:["Archimedes","Leonardo","Hannibal","Archimedes"], correct:2, category:"heroes", explanation:"Hannibal is known for his siege engine attack boost." },
  { id:17, text:"Which building provides a bonus to troop training speed?", options:["Barracks","Castle","Stable","Workshop"], correct:0, category:"buildings", explanation:"The Barracks provides a bonus to troop training speed." },
  { id:18, text:"What is the advantage of using Siege engines?", options:["Fast movement","High defense","Long range attack","Quick training"], correct:2, category:"troops", explanation:"Siege engines have a long range attack advantage." },
  { id:19, text:"Which hero is best for resource gathering?", options:["Cleopatra","Genghis Khan","Caesar","Alexander"], correct:0, category:"heroes", explanation:"Cleopatra is best known for resource gathering." },
  { id:20, text:"Which resource is primarily used for healing troops?", options:["Food","Stone","Gold","Wood"], correct:0, category:"resources", explanation:"Food is primarily used for healing troops." },
  { id:21, text:"What is the main purpose of the Workshop building?", options:["Training Infantry","Producing Siege engines","Scouting","Resource storage"], correct:1, category:"buildings", explanation:"The Workshop is used for producing Siege engines." },
  { id:22, text:"Which troop type has the highest defense?", options:["Infantry","Cavalry","Archers","Siege"], correct:0, category:"troops", explanation:"Infantry has the highest defense among troop types." },
  { id:23, text:"Which event focuses on alliance cooperation?", options:["Alliance War","Resource Rush","Monster Hunt","Heroic Challenge"], correct:0, category:"events", explanation:"Alliance War focuses on alliance cooperation." },
  { id:24, text:"Which hero is known for boosting cavalry attack?", options:["Alexander","Caesar","Napoleon","Attila"], correct:3, category:"heroes", explanation:"Attila is known for boosting cavalry attack." },
  { id:25, text:"Which building increases resource production?", options:["Farm","Quarry","Lumber Mill","All of the above"], correct:3, category:"buildings", explanation:"All these buildings increase resource production." },
  { id:26, text:"Which troop type is effective against Siege engines?", options:["Cavalry","Infantry","Archers","Siege"], correct:0, category:"troops", explanation:"Cavalry is effective against Siege engines." },
  { id:27, text:"Which event offers rewards for upgrading buildings?", options:["Building Boom","Monster Hunt","Resource Rush","Heroic Challenge"], correct:0, category:"events", explanation:"Building Boom offers rewards for upgrading buildings." },
  { id:28, text:"Which hero is best for increasing gold production?", options:["Midas","Leonidas","Caesar","Cleopatra"], correct:0, category:"heroes", explanation:"Midas is best known for increasing gold production." },
  { id:29, text:"Which resource is needed for upgrading the Castle?", options:["Stone","Gold","Wood","Food"], correct:1, category:"resources", explanation:"Gold is needed for upgrading the Castle." },
  { id:30, text:"What is the primary function of the Stable building?", options:["Training Cavalry","Storing food","Researching technologies","Scouting"], correct:0, category:"buildings", explanation:"The Stable is primarily used for training Cavalry." },
  { id:31, text:"Which troop type has the fastest movement speed?", options:["Cavalry","Infantry","Archers","Siege"], correct:0, category:"troops", explanation:"Cavalry has the fastest movement speed." },
  { id:32, text:"Which event gives bonuses for hero upgrades?", options:["Heroic Challenge","Monster Hunt","Resource Rush","Building Boom"], correct:0, category:"events", explanation:"Heroic Challenge gives bonuses for hero upgrades." },
  { id:33, text:"Which hero is known for his defensive capabilities?", options:["Leonidas","Caesar","Napoleon","Hannibal"], correct:0, category:"heroes", explanation:"Leonidas is known for his defensive capabilities." },
  { id:34, text:"Which resource is required for crafting equipment?", options:["Gold","Wood","Stone","Food"], correct:0, category:"resources", explanation:"Gold is required for crafting equipment." },
  { id:35, text:"Which building is essential for troop healing?", options:["Hospital","Barracks","Workshop","Stable"], correct:0, category:"buildings", explanation:"The Hospital is essential for troop healing." }
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

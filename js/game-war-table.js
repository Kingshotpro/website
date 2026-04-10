var WAR_SCENARIOS = [
  { id:1, left:{name:"Iron Legion",infantry:5000,cavalry:2000,archers:1000,tier:"T3",buff:"+15% ATK"}, right:{name:"Swift Riders",infantry:1000,cavalry:6000,archers:1000,tier:"T3",buff:"+10% DEF"}, winner:"left", explanation:"Infantry dominates the Cavalry-heavy right army despite lower total count.", aggressive:"right" },
  { id:2, left:{name:"Emerald Guard",infantry:3000,cavalry:3000,archers:2000,tier:"T2",buff:"+5% DEF"}, right:{name:"Dark Horde",infantry:1000,cavalry:8000,archers:1000,tier:"T2",buff:"+20% ATK"}, winner:"right", explanation:"Overwhelming Cavalry numbers with attack buff overpower the mixed left army.", aggressive:"right" },
  { id:3, left:{name:"Silver Spears",infantry:0,cavalry:7000,archers:3000,tier:"T3",buff:"+10% ATK"}, right:{name:"Golden Archers",infantry:3000,cavalry:1000,archers:6000,tier:"T3",buff:"+5% DEF"}, winner:"left", explanation:"Cavalry overwhelms the Archer-heavy right army.", aggressive:"left" },
  { id:4, left:{name:"Crimson Blades",infantry:5000,cavalry:2000,archers:3000,tier:"T1",buff:"+10% DEF"}, right:{name:"Frost Wolves",infantry:2000,cavalry:5000,archers:2000,tier:"T2",buff:"+10% ATK"}, winner:"right", explanation:"Tier advantage and Cavalry numbers secure victory for the right side.", aggressive:"right" },
  { id:5, left:{name:"Shadow Assassins",infantry:4000,cavalry:3000,archers:3000,tier:"T2",buff:"+15% ATK"}, right:{name:"Sun Warriors",infantry:6000,cavalry:1000,archers:3000,tier:"T2",buff:"+5% DEF"}, winner:"left", explanation:"Infantry advantage and attack buff overcome the right's defense buff.", aggressive:"left" },
  { id:6, left:{name:"Azure Knights",infantry:2000,cavalry:6000,archers:2000,tier:"T3",buff:"+10% DEF"}, right:{name:"Verdant Archers",infantry:1000,cavalry:2000,archers:7000,tier:"T3",buff:"+10% ATK"}, winner:"right", explanation:"Archers with attack buff counter the Cavalry-heavy left army.", aggressive:"left" },
  { id:7, left:{name:"Bronze Shields",infantry:7000,cavalry:1000,archers:2000,tier:"T2",buff:"+5% ATK"}, right:{name:"Thunder Riders",infantry:2000,cavalry:5000,archers:1000,tier:"T2",buff:"+15% DEF"}, winner:"left", explanation:"Infantry numbers and attack buff overcome Cavalry and defense buff.", aggressive:"right" },
  { id:8, left:{name:"Obsidian Guard",infantry:6000,cavalry:3000,archers:1000,tier:"T1",buff:"+20% ATK"}, right:{name:"Ivory Legion",infantry:3000,cavalry:2000,archers:5000,tier:"T1",buff:"+20% DEF"}, winner:"right", explanation:"Defense buff and Archer advantage counter the attack-heavy left army.", aggressive:"left" },
  { id:9, left:{name:"Golden Horde",infantry:1000,cavalry:8000,archers:1000,tier:"T3",buff:"+5% DEF"}, right:{name:"Emerald Legion",infantry:5000,cavalry:1000,archers:4000,tier:"T3",buff:"+15% ATK"}, winner:"right", explanation:"Infantry and Archer combination with attack buff beats Cavalry.", aggressive:"left" },
  { id:10, left:{name:"Crimson Archers",infantry:1000,cavalry:1000,archers:8000,tier:"T2",buff:"+10% ATK"}, right:{name:"Steel Cavalry",infantry:2000,cavalry:7000,archers:1000,tier:"T2",buff:"+10% DEF"}, winner:"right", explanation:"Cavalry numbers and defense buff overpower the Archer-heavy left army.", aggressive:"right" },
  { id:11, left:{name:"Ivory Knights",infantry:5000,cavalry:3000,archers:2000,tier:"T3",buff:"+5% ATK"}, right:{name:"Shadow Riders",infantry:1000,cavalry:6000,archers:3000,tier:"T3",buff:"+10% DEF"}, winner:"left", explanation:"Infantry advantage and attack buff counter the Cavalry-heavy right.", aggressive:"right" },
  { id:12, left:{name:"Silver Archers",infantry:2000,cavalry:2000,archers:6000,tier:"T1",buff:"+20% ATK"}, right:{name:"Bronze Warriors",infantry:6000,cavalry:1000,archers:3000,tier:"T1",buff:"+5% DEF"}, winner:"left", explanation:"Archer numbers and attack buff beat the Infantry-heavy right.", aggressive:"left" },
  { id:13, left:{name:"Onyx Legion",infantry:3000,cavalry:5000,archers:2000,tier:"T2",buff:"+5% DEF"}, right:{name:"Emerald Archers",infantry:2000,cavalry:1000,archers:7000,tier:"T2",buff:"+15% ATK"}, winner:"right", explanation:"Archer numbers with attack buff counter Cavalry.", aggressive:"left" },
  { id:14, left:{name:"Frost Archers",infantry:1000,cavalry:1000,archers:8000,tier:"T3",buff:"+10% DEF"}, right:{name:"Crimson Cavalry",infantry:3000,cavalry:5000,archers:2000,tier:"T3",buff:"+5% ATK"}, winner:"right", explanation:"Cavalry numbers and attack buff overpower Archer-heavy left.", aggressive:"right" },
  { id:15, left:{name:"Golden Infantry",infantry:8000,cavalry:1000,archers:1000,tier:"T2",buff:"+5% ATK"}, right:{name:"Sapphire Riders",infantry:2000,cavalry:6000,archers:2000,tier:"T2",buff:"+10% DEF"}, winner:"left", explanation:"Infantry numbers and attack buff counter Cavalry.", aggressive:"right" },
  { id:16, left:{name:"Ruby Legion",infantry:3000,cavalry:3000,archers:4000,tier:"T1",buff:"+15% ATK"}, right:{name:"Emerald Knights",infantry:4000,cavalry:2000,archers:4000,tier:"T1",buff:"+10% DEF"}, winner:"left", explanation:"Balanced composition with attack buff beats the defensive right.", aggressive:"left" },
  { id:17, left:{name:"Ivory Archers",infantry:1000,cavalry:2000,archers:7000,tier:"T3",buff:"+5% DEF"}, right:{name:"Obsidian Cavalry",infantry:2000,cavalry:6000,archers:2000,tier:"T3",buff:"+10% ATK"}, winner:"right", explanation:"Cavalry numbers and attack buff overpower the Archer-heavy left.", aggressive:"right" },
  { id:18, left:{name:"Emerald Infantry",infantry:6000,cavalry:1000,archers:3000,tier:"T2",buff:"+10% ATK"}, right:{name:"Sapphire Archers",infantry:2000,cavalry:1000,archers:7000,tier:"T2",buff:"+5% DEF"}, winner:"left", explanation:"Infantry numbers and attack buff beat Archer-heavy right.", aggressive:"left" },
  { id:19, left:{name:"Bronze Cavalry",infantry:1000,cavalry:8000,archers:1000,tier:"T1",buff:"+10% DEF"}, right:{name:"Golden Legion",infantry:5000,cavalry:2000,archers:3000,tier:"T1",buff:"+15% ATK"}, winner:"right", explanation:"Infantry and Archer mix with attack buff counter Cavalry.", aggressive:"left" },
  { id:20, left:{name:"Ruby Archers",infantry:1000,cavalry:1000,archers:8000,tier:"T3",buff:"+5% ATK"}, right:{name:"Crimson Riders",infantry:2000,cavalry:7000,archers:1000,tier:"T3",buff:"+10% DEF"}, winner:"right", explanation:"Cavalry numbers and defense buff overpower Archer-heavy left.", aggressive:"right" }
];
// ── War Table Game Engine ──────────────────
(function () {
  'use strict';

  var TODAY = new Date().toISOString().slice(0, 10);
  var PLAYED_KEY = 'ksp_wt_played';
  var SEEN_KEY = 'ksp_wt_seen';

  function alreadyPlayed() {
    try { return localStorage.getItem(PLAYED_KEY) === TODAY; } catch (e) { return false; }
  }

  function getSeenIds() {
    try { var s = localStorage.getItem(SEEN_KEY); return s ? JSON.parse(s) : []; } catch (e) { return []; }
  }

  function pickScenario() {
    var seen = getSeenIds();
    var unseen = WAR_SCENARIOS.filter(function (s) { return seen.indexOf(s.id) === -1; });
    if (unseen.length === 0) { seen = []; unseen = WAR_SCENARIOS; }
    var pick = unseen[Math.floor(Math.random() * unseen.length)];
    seen.push(pick.id);
    try { localStorage.setItem(SEEN_KEY, JSON.stringify(seen.slice(-15))); } catch (e) {}
    return pick;
  }

  function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  function renderArmy(army) {
    return '<div class="wt-army">' +
      '<h3>' + esc(army.name) + '</h3>' +
      '<div class="wt-tier">' + esc(army.tier) + '</div>' +
      '<div class="wt-troops">' +
        '<div>\u{1F6E1}\uFE0F Infantry: <strong>' + army.infantry.toLocaleString() + '</strong></div>' +
        '<div>\u{1F40E} Cavalry: <strong>' + army.cavalry.toLocaleString() + '</strong></div>' +
        '<div>\u{1F3F9} Archers: <strong>' + army.archers.toLocaleString() + '</strong></div>' +
      '</div>' +
      '<div class="wt-buff">' + esc(army.buff) + '</div>' +
    '</div>';
  }

  function init() {
    var container = document.getElementById('wt-game');
    if (!container) return;

    if (alreadyPlayed()) {
      container.innerHTML = '<div class="card" style="text-align:center;padding:40px;">' +
        '<h2 style="color:var(--gold);">You\'ve played today.</h2>' +
        '<p class="text-muted">The War Table resets tomorrow. Return then for a new battle.</p>' +
        '</div>';
      return;
    }

    var scenario = pickScenario();

    container.innerHTML =
      '<div class="wt-matchup">' +
        renderArmy(scenario.left) +
        '<div class="wt-vs">VS</div>' +
        renderArmy(scenario.right) +
      '</div>' +
      '<div class="wt-buttons">' +
        '<button class="btn btn-primary wt-pick" data-pick="left">\u{1F6E1}\uFE0F ' + esc(scenario.left.name) + ' Wins</button>' +
        '<button class="btn btn-outline wt-pick" data-pick="right">\u2694\uFE0F ' + esc(scenario.right.name) + ' Wins</button>' +
      '</div>' +
      '<div id="wt-result" class="hidden"></div>';

    // Wire buttons
    var btns = container.querySelectorAll('.wt-pick');
    btns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var pick = this.getAttribute('data-pick');
        var correct = pick === scenario.winner;
        var xp = correct ? 50 : 20;

        // Track pick type
        if (window.Advisor) {
          var pickType = (scenario.aggressive === pick) ? 'aggressive_picks' : 'defensive_picks';
          Advisor.observe('war_table', pickType, 1);
          Advisor.observe('war_table', 'plays', 1);
          Advisor.grantXP('war_table', xp);
        }

        // Mark played today
        try { localStorage.setItem(PLAYED_KEY, TODAY); } catch (e) {}

        // Hide buttons
        container.querySelector('.wt-buttons').classList.add('hidden');

        // Show result
        var result = document.getElementById('wt-result');
        var winName = scenario.winner === 'left' ? scenario.left.name : scenario.right.name;
        result.innerHTML =
          '<div class="card ' + (correct ? 'wt-correct' : 'wt-wrong') + '">' +
            '<h3>' + (correct ? '\u2705 Correct!' : '\u274C Not quite.') + '</h3>' +
            '<p><strong>' + esc(winName) + '</strong> wins this battle.</p>' +
            '<p class="text-muted">' + esc(scenario.explanation) + '</p>' +
            '<p style="color:var(--gold);font-weight:700;">+' + xp + ' XP</p>' +
          '</div>';
        result.classList.remove('hidden');
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else { init(); }
})();

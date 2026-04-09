/**
 * calc-viking.js — Viking Vengeance Event Calculator
 * KingshotPro
 *
 * Data: kingshotguide.org/data-center/viking-vengeance-data
 *       + kingshotguide.org/calculator/viking-vengeance-calculator — April 2026
 *
 * 11 difficulty levels, 20 waves each (220 total waves).
 * Waves 7/14/17 = online members only. Waves 10/20 = Alliance HQ.
 */

// [difficulty, name, wave1_troops, wave20_troops, rating]
var VV_LEVELS = [
  [1,  'Beginner',      300,    241494,  'Easy'],
  [2,  'Novice',         333,    269986,  'Easy'],
  [3,  'Intermediate',   371,    301846,  'Medium'],
  [4,  'Advanced',       417,    337463,  'Medium'],
  [5,  'Expert',         466,    377285,  'Hard'],
  [6,  'Master',         523,    421000,  'Hard'],
  [7,  'Grandmaster',    587,    473000,  'Extreme'],
  [8,  'Champion',       659,    531000,  'Extreme'],
  [9,  'Legend',         740,    596000,  'Extreme'],
  [10, 'Mythic',         831,    669000,  'Extreme'],
  [11, 'Apex',           912,    737000,  'Extreme'],
];

// Wave types (same across all difficulty levels)
var WAVE_TYPES = {
  normal: [1,2,3,4,5,6,8,9,11,12,13,15,16,18,19],
  elite: [7,14,17],     // online members only
  hq: [10,20],           // Alliance HQ
};

// Recommended troop ratios
var RATIOS = {
  normal: { inf: 50, cav: 50, label: '5:5 Inf:Cav' },
  elite:  { inf: 50, cav: 50, label: '5:5 or 6:4 Inf:Cav' },
  hq10:   { inf: 30, cav: 70, label: '3:7 Inf:Cav (max damage)' },
  hq20:   { inf: 70, cav: 30, label: '7:3 Inf:Cav (survival)' },
};

function populateSelect() {
  var sel = document.getElementById('vv-level');
  for (var i = 0; i < VV_LEVELS.length; i++) {
    var d = VV_LEVELS[i];
    sel.innerHTML += '<option value="' + i + '">Level ' + d[0] + ': ' + d[1] + ' (' + d[4] + ')</option>';
  }
}

function calculate() {
  var idx = parseInt(document.getElementById('vv-level').value, 10);
  var troops = parseInt(document.getElementById('vv-troops').value, 10) || 0;
  var results = document.getElementById('vv-results');
  var d = VV_LEVELS[idx];

  var html = '<div class="result-grid">';
  html += '<div class="result-item"><div class="result-label">Difficulty</div><div class="result-value">' + d[1] + '</div></div>';
  html += '<div class="result-item"><div class="result-label">Rating</div><div class="result-value">' + d[4] + '</div></div>';
  html += '<div class="result-item"><div class="result-label">Wave 1 Enemies</div><div class="result-value">' + d[2].toLocaleString() + '</div></div>';
  html += '<div class="result-item"><div class="result-label">Wave 20 Enemies</div><div class="result-value large">' + d[3].toLocaleString() + '</div></div>';
  html += '</div>';

  if (troops > 0) {
    var ratio20 = troops > 0 ? (troops / d[3] * 100).toFixed(1) : '0';
    var canClear = troops >= d[3] * 0.6;
    html += '<div class="alert ' + (canClear ? 'alert-info' : 'alert-warn') + ' mt-16" style="font-size:13px;">';
    html += 'Your ' + troops.toLocaleString() + ' troops = <strong>' + ratio20 + '%</strong> of Wave 20 enemies. ';
    html += canClear ? 'You should be able to clear this difficulty.' : 'This may be too difficult. Consider a lower level.';
    html += '</div>';
  }

  html += '<h3 style="margin-top:20px;font-size:15px;color:var(--text);">Wave Guide</h3>';
  html += '<table class="data-table mt-8"><thead><tr><th>Wave</th><th>Type</th><th>Recommended Ratio</th></tr></thead><tbody>';

  for (var w = 1; w <= 20; w++) {
    var type, ratio;
    if (w === 10) { type = 'HQ'; ratio = RATIOS.hq10.label; }
    else if (w === 20) { type = 'HQ'; ratio = RATIOS.hq20.label; }
    else if (WAVE_TYPES.elite.indexOf(w) !== -1) { type = 'Elite (online only)'; ratio = RATIOS.elite.label; }
    else { type = 'Normal'; ratio = RATIOS.normal.label; }
    var cls = type === 'HQ' ? ' style="color:var(--gold);font-weight:600"' : type.indexOf('Elite') !== -1 ? ' style="color:var(--blue)"' : '';
    html += '<tr><td>' + w + '</td><td' + cls + '>' + type + '</td><td>' + ratio + '</td></tr>';
  }
  html += '</tbody></table>';

  html += '<div class="alert alert-info mt-16" style="font-size:12px;">Strategy: Empty city of Infantry/Cavalry for reinforcements. Keep best defensive heroes at home. Recall 1 march for HQ waves (9→10, 19→20). Do not heal during event.</div>';
  results.innerHTML = html;
}

document.addEventListener('DOMContentLoaded', function() {
  populateSelect();
  document.getElementById('vv-calc-btn').addEventListener('click', calculate);
});

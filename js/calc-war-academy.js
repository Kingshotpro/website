/**
 * calc-war-academy.js — War Academy Research Calculator
 * KingshotPro
 * Data: kingshot.net/database/war-academy — April 2026
 *
 * 30 technologies (10 infantry, 10 cavalry, 10 archer)
 * Each tech: [level, food, wood, stone, iron, gold, tg_dust, time_sec]
 */

var WA_TECHS = {
  'truegold-battalion': {
    name: 'Truegold Battalion', cat: 'Infantry', benefit: '+200 Deploy Cap/lv',
    levels: [
      [1, 300000,480000,60000,15000,5000,16,480],
      [2, 480000,480000,96000,24000,8000,25,768],
      [3, 780000,780000,150000,39000,13000,41,1248],
      [4, 1200000,1200000,250000,64000,21000,68,2064],
      [5, 2000000,2000000,400000,100000,33000,108,3240],
    ]
  },
  'truegold-shields': {
    name: 'Truegold Shields', cat: 'Infantry', benefit: 'Infantry Health',
    levels: [
      [1, 800000,800000,160000,40000,10000,40,1200],
      [2, 1100000,1100000,220000,56000,14000,56,1800],
      [3, 1400000,1400000,290000,74000,18000,74,2220],
      [4, 2000000,2000000,400000,100000,25000,102,3060],
      [5, 2700000,2700000,540000,130000,34000,136,4080],
      [6, 3600000,3600000,730000,180000,46000,184,5520],
      [7, 4900000,4900000,990000,240000,62000,248,7440],
      [8, 6600000,6600000,1300000,330000,83000,334,10020],
    ]
  },
  'truegold-blades': {
    name: 'Truegold Blades', cat: 'Infantry', benefit: 'Infantry Lethality',
    levels: [
      [1, 800000,800000,160000,40000,10000,40,1200],
      [2, 1100000,1100000,220000,56000,14000,56,1680],
      [3, 1400000,1400000,290000,74000,18000,74,2220],
      [4, 2000000,2000000,400000,100000,25000,102,3060],
      [5, 2700000,2700000,540000,130000,34000,136,4080],
      [6, 3600000,3600000,730000,180000,46000,184,5520],
      [7, 4900000,4900000,990000,240000,62000,248,7440],
      [8, 6600000,6600000,1300000,330000,83000,334,10020],
    ]
  },
};

var currentTech = 'truegold-battalion';

function fmt(n) { return n.toLocaleString(); }
function fmtTime(s) {
  if (s < 60) return s + 's';
  if (s < 3600) return Math.floor(s/60) + 'm ' + (s%60 > 0 ? (s%60)+'s' : '');
  var h = Math.floor(s/3600), m = Math.floor((s%3600)/60);
  if (h < 24) return h + 'h ' + (m > 0 ? m+'m' : '');
  var d = Math.floor(h/24); h = h%24;
  return d + 'd ' + (h > 0 ? h+'h' : '');
}

function populateTechs() {
  var sel = document.getElementById('wa-tech');
  for (var key in WA_TECHS) {
    var t = WA_TECHS[key];
    sel.innerHTML += '<option value="' + key + '">' + t.cat + ': ' + t.name + '</option>';
  }
  sel.addEventListener('change', function() {
    currentTech = this.value;
    populateLevels();
  });
  populateLevels();
}

function populateLevels() {
  var tech = WA_TECHS[currentTech];
  var from = document.getElementById('wa-from');
  var to = document.getElementById('wa-to');
  from.innerHTML = '<option value="0">Not started</option>';
  to.innerHTML = '';
  for (var i = 0; i < tech.levels.length; i++) {
    var lv = tech.levels[i][0];
    from.innerHTML += '<option value="' + lv + '">Level ' + lv + '</option>';
    to.innerHTML += '<option value="' + lv + '">Level ' + lv + '</option>';
  }
  to.value = tech.levels[tech.levels.length - 1][0];
}

function calculate() {
  var tech = WA_TECHS[currentTech];
  var fromLv = parseInt(document.getElementById('wa-from').value, 10);
  var toLv = parseInt(document.getElementById('wa-to').value, 10);
  var results = document.getElementById('wa-results');

  if (toLv <= fromLv) {
    results.innerHTML = '<p class="result-placeholder">Target must be higher than current.</p>';
    return;
  }

  var totals = [0,0,0,0,0,0,0]; // food,wood,stone,iron,gold,dust,time
  var rows = [];
  for (var i = 0; i < tech.levels.length; i++) {
    var d = tech.levels[i];
    if (d[0] > fromLv && d[0] <= toLv) {
      for (var j = 0; j < 7; j++) totals[j] += d[j+1];
      rows.push(d);
    }
  }

  var html = '<div class="result-grid">';
  var labels = ['Food','Wood','Stone','Iron','Gold','TG Dust','Time'];
  for (var k = 0; k < 6; k++) {
    html += '<div class="result-item"><div class="result-label">' + labels[k] + '</div>';
    html += '<div class="result-value">' + fmt(totals[k]) + '</div></div>';
  }
  html += '<div class="result-item"><div class="result-label">Total Time</div>';
  html += '<div class="result-value">' + fmtTime(totals[6]) + '</div></div>';
  html += '</div>';

  html += '<table class="data-table mt-16"><thead><tr>';
  html += '<th>Lv</th><th>Food</th><th>Wood</th><th>Stone</th><th>Iron</th><th>Gold</th><th>TG Dust</th><th>Time</th>';
  html += '</tr></thead><tbody>';
  for (var m = 0; m < rows.length; m++) {
    var r = rows[m];
    html += '<tr><td>' + r[0] + '</td>';
    for (var n = 1; n <= 6; n++) html += '<td>' + fmt(r[n]) + '</td>';
    html += '<td>' + fmtTime(r[7]) + '</td></tr>';
  }
  html += '</tbody></table>';
  html += '<div class="alert alert-info mt-16" style="font-size:12px;">3 of 30 technologies loaded. More being added from kingshot.net. <a href="https://github.com/Kingshotpro/website/issues" target="_blank">Contribute data &rarr;</a></div>';

  results.innerHTML = html;
}

document.addEventListener('DOMContentLoaded', function() {
  populateTechs();
  document.getElementById('wa-calc-btn').addEventListener('click', calculate);
});

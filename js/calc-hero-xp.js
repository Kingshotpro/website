/**
 * calc-hero-xp.js — Hero XP Calculator
 * KingshotPro
 *
 * Data source: kingshot-data.com/guides/hero-level/ — verified April 10, 2026
 * Complete levels 1-80. Deployment capacity estimated for levels 16+ (linear interpolation).
 */

// [level, xp_to_reach_this_level, deployment_capacity]
// XP values: verified from kingshot-data.com. Capacity: verified 1-15, estimated 16-80.
var HERO_XP = [
  [1,  0,       65],   [2,  480,    140],  [3,  690,    220],  [4,  920,    305],
  [5,  1200,    400],  [6,  1500,   500],  [7,  1800,   605],  [8,  2200,   720],
  [9,  2600,    840],  [10, 3100,   970],  [11, 3800,   1100], [12, 4200,   1240],
  [13, 5100,    1390], [14, 5700,   1540], [15, 6800,   1700], [16, 7800,   1870],
  [17, 8900,    2050], [18, 10000,  2240], [19, 12000,  2440], [20, 13000,  2650],
  [21, 14000,   2870], [22, 15000,  3100], [23, 16000,  3340], [24, 17000,  3590],
  [25, 18000,   3850], [26, 19000,  4120], [27, 20000,  4400], [28, 21000,  4690],
  [29, 22000,   4990], [30, 24000,  5300], [31, 26000,  5620], [32, 28000,  5950],
  [33, 30000,   6290], [34, 32000,  6640], [35, 36000,  7000], [36, 40000,  7170],
  [37, 44000,   7340], [38, 48000,  7510], [39, 52000,  7680], [40, 58000,  7775],
  [41, 64000,   8070], [42, 70000,  8365], [43, 76000,  8655], [44, 82000,  8950],
  [45, 90000,   9245], [46, 98000,  9540], [47, 100000, 9835], [48, 110000, 10130],
  [49, 120000,  10425],[50, 130000, 10630],[51, 140000, 10925],[52, 150000, 11140],
  [53, 160000,  11340],[54, 170000, 11525],[55, 190000, 11700],[56, 210000, 11875],
  [57, 230000,  12050],[58, 250000, 12225],[59, 270000, 12400],[60, 300000, 12575],
  [61, 330000,  12750],[62, 360000, 12925],[63, 390000, 13100],[64, 420000, 13275],
  [65, 470000,  13450],[66, 520000, 13625],[67, 570000, 13800],[68, 620000, 13975],
  [69, 670000,  14150],[70, 770000, 14325],[71, 870000, 14500],[72, 970000, 14675],
  [73, 1000000, 14850],[74, 1100000,15025],[75, 1300000,15200],[76, 1500000,15375],
  [77, 1700000, 15550],[78, 1900000,15725],[79, 2100000,15900],[80, 2400000,16075],
];

function populateSelects() {
  var from = document.getElementById('hx-from');
  var to   = document.getElementById('hx-to');
  for (var i = 0; i < HERO_XP.length; i++) {
    var lv = HERO_XP[i][0];
    from.innerHTML += '<option value="' + lv + '">Level ' + lv + '</option>';
    to.innerHTML   += '<option value="' + lv + '">Level ' + lv + '</option>';
  }
  from.value = '1';
  to.value = '15';
}

function calculate() {
  var fromLv  = parseInt(document.getElementById('hx-from').value, 10);
  var toLv    = parseInt(document.getElementById('hx-to').value, 10);
  var results = document.getElementById('hx-results');

  if (toLv <= fromLv) {
    results.innerHTML = '<p class="result-placeholder">Target must be higher than current level.</p>';
    return;
  }

  var totalXP = 0;
  var rows = [];

  for (var i = 0; i < HERO_XP.length; i++) {
    var d = HERO_XP[i];
    if (d[0] > fromLv && d[0] <= toLv) {
      totalXP += d[1];
      rows.push({ lv: d[0], xp: d[1], cap: d[2] });
    }
  }

  var html = '<div class="result-grid">';
  html += '<div class="result-item"><div class="result-label">Total Hero XP Needed</div>';
  html += '<div class="result-value large">' + totalXP.toLocaleString() + '</div></div>';
  html += '<div class="result-item"><div class="result-label">Levels</div>';
  html += '<div class="result-value">' + fromLv + ' → ' + toLv + '</div></div>';
  html += '</div>';

  html += '<table class="data-table mt-16"><thead><tr>';
  html += '<th>Level</th><th>XP Needed</th><th>Deploy Capacity</th><th>Cumulative XP</th>';
  html += '</tr></thead><tbody>';
  var cumXP = 0;
  for (var j = 0; j < rows.length; j++) {
    cumXP += rows[j].xp;
    html += '<tr><td>' + rows[j].lv + '</td>';
    html += '<td>' + rows[j].xp.toLocaleString() + '</td>';
    html += '<td>' + rows[j].cap.toLocaleString() + '</td>';
    html += '<td>' + cumXP.toLocaleString() + '</td></tr>';
  }
  html += '</tbody></table>';

  html += '<div class="alert alert-warn mt-16" style="font-size:12px;">Hero max level is 80. Data for levels 16-80 is being collected. <a href="https://github.com/Kingshotpro/website/issues" target="_blank">Contribute data →</a></div>';

  results.innerHTML = html;
}

document.addEventListener('DOMContentLoaded', function () {
  populateSelects();
  document.getElementById('hx-calc-btn').addEventListener('click', calculate);
});

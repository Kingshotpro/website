/**
 * calc-map.js — Map Planner
 * KingshotPro
 * Calculate distances and march times between coordinates.
 */
function calculate() {
  var x1 = parseInt(document.getElementById('mp-x1').value,10) || 0;
  var y1 = parseInt(document.getElementById('mp-y1').value,10) || 0;
  var x2 = parseInt(document.getElementById('mp-x2').value,10) || 0;
  var y2 = parseInt(document.getElementById('mp-y2').value,10) || 0;
  var speed = parseInt(document.getElementById('mp-speed').value,10) || 100;
  var results = document.getElementById('mp-results');

  var dx = x2 - x1;
  var dy = y2 - y1;
  var distance = Math.sqrt(dx*dx + dy*dy);
  var baseMarchSec = Math.round(distance * 6); // ~6 sec per tile at 100% speed
  var actualMarchSec = Math.round(baseMarchSec * (100 / speed));

  var html = '<div class="result-grid">';
  html += '<div class="result-item"><div class="result-label">Distance</div><div class="result-value">' + distance.toFixed(1) + ' <span class="result-unit">tiles</span></div></div>';
  html += '<div class="result-item"><div class="result-label">Est. March Time</div><div class="result-value">';
  if (actualMarchSec < 60) html += actualMarchSec + 's';
  else if (actualMarchSec < 3600) html += Math.floor(actualMarchSec/60) + 'm ' + (actualMarchSec%60) + 's';
  else { var h=Math.floor(actualMarchSec/3600),m=Math.floor((actualMarchSec%3600)/60); html += h+'h '+m+'m'; }
  html += '</div></div>';
  html += '<div class="result-item"><div class="result-label">From</div><div class="result-value">(' + x1 + ', ' + y1 + ')</div></div>';
  html += '<div class="result-item"><div class="result-label">To</div><div class="result-value">(' + x2 + ', ' + y2 + ')</div></div>';
  html += '</div>';
  html += '<div class="alert alert-warn mt-16" style="font-size:12px;">March time formula is estimated (~6s per tile at 100% speed). Actual times depend on terrain and march speed bonuses. <a href="https://github.com/Kingshotpro/website/issues" target="_blank">Report corrections &rarr;</a></div>';
  results.innerHTML = html;
}
document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('mp-calc-btn').addEventListener('click', calculate);
});

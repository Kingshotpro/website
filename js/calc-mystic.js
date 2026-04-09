/**
 * calc-mystic.js — Mystic Trials Tracker
 * KingshotPro
 * Track trial progress and plan resource usage.
 */
function calculate() {
  var trials = parseInt(document.getElementById('my-trials').value,10) || 0;
  var energy = parseInt(document.getElementById('my-energy').value,10) || 0;
  var costPer = parseInt(document.getElementById('my-cost').value,10) || 10;
  var results = document.getElementById('my-results');

  var totalCost = trials * costPer;
  var remaining = energy - totalCost;
  var maxTrials = costPer > 0 ? Math.floor(energy / costPer) : 0;

  var html = '<div class="result-grid">';
  html += '<div class="result-item"><div class="result-label">Planned Trials</div><div class="result-value">' + trials + '</div></div>';
  html += '<div class="result-item"><div class="result-label">Energy Cost</div><div class="result-value">' + totalCost.toLocaleString() + '</div></div>';
  html += '<div class="result-item"><div class="result-label">Energy Remaining</div><div class="result-value ' + (remaining<0?'text-red':'text-green') + '">' + remaining.toLocaleString() + '</div></div>';
  html += '<div class="result-item"><div class="result-label">Max Affordable</div><div class="result-value">' + maxTrials + '</div></div>';
  html += '</div>';
  html += '<div class="alert alert-info mt-16" style="font-size:12px;">Trial rewards and difficulty scaling will be added when verified. Enter your in-game energy cost per trial above.</div>';
  results.innerHTML = html;
}
document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('my-calc-btn').addEventListener('click', calculate);
});

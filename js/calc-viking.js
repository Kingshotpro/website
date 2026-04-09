/**
 * calc-viking.js — Viking Vengeance Event Tracker
 * KingshotPro
 * Track your Viking Vengeance progress and plan troop deployment.
 */
function calculate() {
  var waves = parseInt(document.getElementById('vk-waves').value,10) || 0;
  var troopsPerWave = parseInt(document.getElementById('vk-troops').value,10) || 0;
  var losses = parseFloat(document.getElementById('vk-loss').value) || 10;
  var results = document.getElementById('vk-results');

  var totalDeployed = waves * troopsPerWave;
  var totalLost = Math.round(totalDeployed * (losses / 100));
  var surviving = totalDeployed - totalLost;

  var html = '<div class="result-grid">';
  html += '<div class="result-item"><div class="result-label">Waves Completed</div><div class="result-value">' + waves + '</div></div>';
  html += '<div class="result-item"><div class="result-label">Total Deployed</div><div class="result-value">' + totalDeployed.toLocaleString() + '</div></div>';
  html += '<div class="result-item"><div class="result-label">Est. Losses</div><div class="result-value text-red">' + totalLost.toLocaleString() + '</div></div>';
  html += '<div class="result-item"><div class="result-label">Surviving</div><div class="result-value text-green">' + surviving.toLocaleString() + '</div></div>';
  html += '</div>';
  html += '<div class="alert alert-info mt-16" style="font-size:12px;">Wave difficulty data and scoring formulas will be added as they are verified from community sources.</div>';
  results.innerHTML = html;
}
document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('vk-calc-btn').addEventListener('click', calculate);
});

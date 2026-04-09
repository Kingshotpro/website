/**
 * calc-kvk.js — KvK Score Tracker
 * KingshotPro
 * No official scoring formula published. This tool lets players
 * track their KvK contributions manually.
 */
function calculate() {
  var kills = parseInt(document.getElementById('kvk-kills').value,10) || 0;
  var trained = parseInt(document.getElementById('kvk-trained').value,10) || 0;
  var gathered = parseInt(document.getElementById('kvk-gathered').value,10) || 0;
  var power = parseInt(document.getElementById('kvk-power').value,10) || 0;
  var results = document.getElementById('kvk-results');

  var html = '<div class="result-grid">';
  html += '<div class="result-item"><div class="result-label">Troops Killed</div><div class="result-value">' + kills.toLocaleString() + '</div></div>';
  html += '<div class="result-item"><div class="result-label">Troops Trained</div><div class="result-value">' + trained.toLocaleString() + '</div></div>';
  html += '<div class="result-item"><div class="result-label">Resources Gathered</div><div class="result-value">' + gathered.toLocaleString() + '</div></div>';
  html += '<div class="result-item"><div class="result-label">Power Gained</div><div class="result-value">' + power.toLocaleString() + '</div></div>';
  html += '</div>';
  html += '<div class="alert alert-info mt-16" style="font-size:12px;">KvK scoring weights are not publicly documented. Use this to track your contributions. Exact point formulas will be added when verified.</div>';
  results.innerHTML = html;
}
document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('kvk-calc-btn').addEventListener('click', calculate);
});

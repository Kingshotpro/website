/**
 * calc-alliance-mob.js — Alliance Mobilization Planner
 * KingshotPro
 * Planning tool for rally/garrison coordination. No game data needed.
 */
function calculate() {
  var members = parseInt(document.getElementById('am-members').value,10) || 0;
  var rallies = parseInt(document.getElementById('am-rallies').value,10) || 1;
  var troopsPer = parseInt(document.getElementById('am-troops').value,10) || 0;
  var results = document.getElementById('am-results');

  var perRally = Math.floor(members / rallies);
  var remainder = members % rallies;
  var totalTroops = members * troopsPer;

  var html = '<div class="result-grid">';
  html += '<div class="result-item"><div class="result-label">Members per Rally</div><div class="result-value">' + perRally + '</div></div>';
  html += '<div class="result-item"><div class="result-label">Total Troops</div><div class="result-value">' + totalTroops.toLocaleString() + '</div></div>';
  html += '<div class="result-item"><div class="result-label">Simultaneous Rallies</div><div class="result-value">' + rallies + '</div></div>';
  html += '<div class="result-item"><div class="result-label">Extra Members</div><div class="result-value">' + remainder + ' <span class="result-unit">(garrison)</span></div></div>';
  html += '</div>';

  html += '<table class="data-table mt-16"><thead><tr><th>Rally #</th><th>Members</th><th>Est. Troops</th></tr></thead><tbody>';
  for (var i = 0; i < rallies; i++) {
    var cnt = perRally + (i < remainder ? 1 : 0);
    html += '<tr><td>Rally ' + (i+1) + '</td><td>' + cnt + '</td><td>' + (cnt*troopsPer).toLocaleString() + '</td></tr>';
  }
  if (remainder > 0 && rallies > 1) {
    html += '<tr><td>Garrison</td><td>' + remainder + '</td><td>' + (remainder*troopsPer).toLocaleString() + '</td></tr>';
  }
  html += '</tbody></table>';
  results.innerHTML = html;
}
document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('am-calc-btn').addEventListener('click', calculate);
});

/**
 * calc-rally.js — Rally Planner
 * KingshotPro
 * Calculate rally timing and troop coordination.
 */
function calculate() {
  var marchTime = parseInt(document.getElementById('rp-march').value,10) || 0;
  var rallyTimer = parseInt(document.getElementById('rp-timer').value,10) || 300;
  var joiners = parseInt(document.getElementById('rp-joiners').value,10) || 0;
  var troopsPer = parseInt(document.getElementById('rp-troops').value,10) || 0;
  var results = document.getElementById('rp-results');

  var totalTroops = joiners * troopsPer;
  var totalTime = rallyTimer + marchTime;
  var minJoinTime = rallyTimer - 30; // must join before last 30s

  var html = '<div class="result-grid">';
  html += '<div class="result-item"><div class="result-label">Total Rally Troops</div><div class="result-value">' + totalTroops.toLocaleString() + '</div></div>';
  html += '<div class="result-item"><div class="result-label">Rally Timer</div><div class="result-value">' + Math.floor(rallyTimer/60) + 'm ' + (rallyTimer%60) + 's</div></div>';
  html += '<div class="result-item"><div class="result-label">March Time</div><div class="result-value">' + marchTime + 's</div></div>';
  html += '<div class="result-item"><div class="result-label">Total (timer+march)</div><div class="result-value">' + Math.floor(totalTime/60) + 'm ' + (totalTime%60) + 's</div></div>';
  html += '</div>';

  html += '<table class="data-table mt-16"><thead><tr><th>Joiner</th><th>Join By</th><th>Est. Troops</th></tr></thead><tbody>';
  for (var i = 1; i <= joiners; i++) {
    html += '<tr><td>Member ' + i + '</td><td>' + Math.floor(minJoinTime/60) + 'm ' + (minJoinTime%60) + 's before launch</td>';
    html += '<td>' + troopsPer.toLocaleString() + '</td></tr>';
  }
  html += '</tbody></table>';
  results.innerHTML = html;
}
document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('rp-calc-btn').addEventListener('click', calculate);
});

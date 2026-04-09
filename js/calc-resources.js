/**
 * calc-resources.js — Resource Planner
 * KingshotPro
 * Input current resources + production rate, see when you can afford an upgrade.
 */

function calculate() {
  var fields = ['food', 'wood', 'stone', 'iron', 'gold'];
  var labels = ['Food', 'Wood', 'Stone', 'Iron', 'Gold'];
  var results = document.getElementById('res-results');
  var maxHours = 0;
  var rows = [];

  for (var i = 0; i < fields.length; i++) {
    var current = parseInt(document.getElementById('res-cur-' + fields[i]).value, 10) || 0;
    var rate    = parseInt(document.getElementById('res-rate-' + fields[i]).value, 10) || 0;
    var target  = parseInt(document.getElementById('res-target-' + fields[i]).value, 10) || 0;
    var deficit = target - current;
    var hours   = deficit > 0 && rate > 0 ? Math.ceil(deficit / rate) : 0;
    if (hours > maxHours) maxHours = hours;
    rows.push({ label: labels[i], current: current, rate: rate, target: target, deficit: deficit > 0 ? deficit : 0, hours: hours });
  }

  var html = '<div class="result-grid">';
  html += '<div class="result-item"><div class="result-label">Time Until Affordable</div>';
  if (maxHours > 0) {
    var d = Math.floor(maxHours / 24), h = maxHours % 24;
    html += '<div class="result-value large">' + (d > 0 ? d + 'd ' : '') + h + 'h</div>';
  } else {
    html += '<div class="result-value large text-green">Ready now</div>';
  }
  html += '</div>';
  html += '<div class="result-item"><div class="result-label">Bottleneck</div>';
  var bottleneck = rows.reduce(function(a, b) { return a.hours > b.hours ? a : b; });
  html += '<div class="result-value">' + (bottleneck.hours > 0 ? bottleneck.label : 'None') + '</div></div>';
  html += '</div>';

  html += '<table class="data-table mt-16"><thead><tr><th>Resource</th><th>Have</th><th>Need</th><th>Deficit</th><th>/hr</th><th>Hours</th></tr></thead><tbody>';
  for (var j = 0; j < rows.length; j++) {
    var r = rows[j];
    var cls = r.deficit > 0 ? ' style="color:var(--red)"' : '';
    html += '<tr><td>' + r.label + '</td><td>' + r.current.toLocaleString() + '</td>';
    html += '<td>' + r.target.toLocaleString() + '</td>';
    html += '<td' + cls + '>' + (r.deficit > 0 ? r.deficit.toLocaleString() : '—') + '</td>';
    html += '<td>' + r.rate.toLocaleString() + '</td>';
    html += '<td>' + (r.hours > 0 ? r.hours + 'h' : '✓') + '</td></tr>';
  }
  html += '</tbody></table>';

  results.innerHTML = html;
}

document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('res-calc-btn').addEventListener('click', calculate);
});

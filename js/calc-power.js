/**
 * calc-power.js — Power Calculator
 * KingshotPro
 * Estimate total account power from troops, buildings, research, heroes.
 */

// Approximate power per troop by tier
var TROOP_POWER = [0, 2, 4, 8, 16, 36, 64, 100, 160, 280, 480, 800];

function calculate() {
  var results = document.getElementById('pow-results');
  var totalPower = 0;
  var breakdown = [];

  // Troops
  var troopPower = 0;
  for (var t = 1; t <= 11; t++) {
    var qty = parseInt(document.getElementById('pow-t' + t).value, 10) || 0;
    troopPower += qty * (TROOP_POWER[t] || 0);
  }
  totalPower += troopPower;
  breakdown.push({ label: 'Troop Power', value: troopPower });

  // Building power (rough: furnace level × 50K)
  var furnace = parseInt(document.getElementById('pow-furnace').value, 10) || 0;
  var buildPower = furnace * 50000;
  totalPower += buildPower;
  breakdown.push({ label: 'Building Power (est.)', value: buildPower });

  // Research (rough: input directly)
  var resPower = parseInt(document.getElementById('pow-research').value, 10) || 0;
  totalPower += resPower;
  breakdown.push({ label: 'Research Power', value: resPower });

  // Hero power (rough: input directly)
  var heroPower = parseInt(document.getElementById('pow-heroes').value, 10) || 0;
  totalPower += heroPower;
  breakdown.push({ label: 'Hero Power', value: heroPower });

  var html = '<div class="result-grid">';
  html += '<div class="result-item"><div class="result-label">Estimated Total Power</div>';
  html += '<div class="result-value large">' + totalPower.toLocaleString() + '</div></div>';
  html += '</div>';

  html += '<table class="data-table mt-16"><thead><tr><th>Category</th><th>Power</th><th>% of Total</th></tr></thead><tbody>';
  for (var i = 0; i < breakdown.length; i++) {
    var pct = totalPower > 0 ? ((breakdown[i].value / totalPower) * 100).toFixed(1) : '0';
    html += '<tr><td>' + breakdown[i].label + '</td>';
    html += '<td>' + breakdown[i].value.toLocaleString() + '</td>';
    html += '<td>' + pct + '%</td></tr>';
  }
  html += '</tbody></table>';

  // Benchmark
  html += '<div class="alert alert-info mt-16" style="font-size:12px;">';
  if (totalPower < 1000000) html += 'Early game. Focus on furnace upgrades and troop training.';
  else if (totalPower < 5000000) html += 'Growing. You\'re competitive on newer servers.';
  else if (totalPower < 20000000) html += 'Mid-game. Competitive for most kingdom events.';
  else if (totalPower < 50000000) html += 'Strong. Rally leader territory.';
  else html += 'Endgame powerhouse. Kingdom throne contender.';
  html += '</div>';

  results.innerHTML = html;
}

document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('pow-calc-btn').addEventListener('click', calculate);
});

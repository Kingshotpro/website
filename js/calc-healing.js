/**
 * calc-healing.js — Healing Cost Calculator
 * KingshotPro
 * Healing costs per troop are not publicly documented.
 * This tool calculates based on user-observed rates.
 */
function calculate() {
  var troops = parseInt(document.getElementById('heal-troops').value,10) || 0;
  var foodPer = parseFloat(document.getElementById('heal-food').value) || 0;
  var woodPer = parseFloat(document.getElementById('heal-wood').value) || 0;
  var stonePer = parseFloat(document.getElementById('heal-stone').value) || 0;
  var ironPer = parseFloat(document.getElementById('heal-iron').value) || 0;
  var results = document.getElementById('heal-results');

  var html = '<div class="result-grid">';
  html += '<div class="result-item"><div class="result-label">Total Food</div><div class="result-value">' + Math.ceil(troops*foodPer).toLocaleString() + '</div></div>';
  html += '<div class="result-item"><div class="result-label">Total Wood</div><div class="result-value">' + Math.ceil(troops*woodPer).toLocaleString() + '</div></div>';
  html += '<div class="result-item"><div class="result-label">Total Stone</div><div class="result-value">' + Math.ceil(troops*stonePer).toLocaleString() + '</div></div>';
  html += '<div class="result-item"><div class="result-label">Total Iron</div><div class="result-value">' + Math.ceil(troops*ironPer).toLocaleString() + '</div></div>';
  html += '</div>';
  html += '<div class="alert alert-info mt-16" style="font-size:12px;">Enter per-troop costs from your in-game infirmary. Costs vary by troop tier. Community-verified rates will be added as data is collected.</div>';
  results.innerHTML = html;
}
document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('heal-calc-btn').addEventListener('click', calculate);
});

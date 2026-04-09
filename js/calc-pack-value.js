/**
 * calc-pack-value.js — Pack Value Calculator
 * KingshotPro
 * Compare pack value by converting contents to gem equivalents.
 * Users input pack price and contents; tool calculates value per dollar.
 */

// Estimated gem equivalents for common items
var GEM_VALUES = {
  gems: 1,
  speedup_1h: 50,      // 1-hour speedup ≈ 50 gems
  speedup_8h: 400,
  speedup_24h: 1200,
  vip_points: 2,        // 1 VIP point = 2 gems
  resource_100k: 5,     // 100K resources ≈ 5 gems
};

function calculate() {
  var price = parseFloat(document.getElementById('pv-price').value) || 0;
  var gems = parseInt(document.getElementById('pv-gems').value,10) || 0;
  var sp1 = parseInt(document.getElementById('pv-sp1').value,10) || 0;
  var sp8 = parseInt(document.getElementById('pv-sp8').value,10) || 0;
  var sp24 = parseInt(document.getElementById('pv-sp24').value,10) || 0;
  var vip = parseInt(document.getElementById('pv-vip').value,10) || 0;
  var res = parseInt(document.getElementById('pv-res').value,10) || 0;
  var results = document.getElementById('pv-results');

  if (price <= 0) {
    results.innerHTML = '<p class="result-placeholder">Enter the pack price.</p>';
    return;
  }

  var totalGemValue = gems
    + (sp1 * GEM_VALUES.speedup_1h)
    + (sp8 * GEM_VALUES.speedup_8h)
    + (sp24 * GEM_VALUES.speedup_24h)
    + (vip * GEM_VALUES.vip_points)
    + (Math.floor(res / 100000) * GEM_VALUES.resource_100k);

  var gemsPerDollar = Math.round(totalGemValue / price);

  var html = '<div class="result-grid">';
  html += '<div class="result-item"><div class="result-label">Total Gem Value</div><div class="result-value large">' + totalGemValue.toLocaleString() + '</div></div>';
  html += '<div class="result-item"><div class="result-label">Gems per Dollar</div><div class="result-value">' + gemsPerDollar.toLocaleString() + '</div></div>';
  html += '<div class="result-item"><div class="result-label">Pack Price</div><div class="result-value">$' + price.toFixed(2) + '</div></div>';
  html += '</div>';

  html += '<table class="data-table mt-16"><thead><tr><th>Item</th><th>Qty</th><th>Gem Value</th></tr></thead><tbody>';
  if (gems>0) html += '<tr><td>Gems</td><td>'+gems.toLocaleString()+'</td><td>'+gems.toLocaleString()+'</td></tr>';
  if (sp1>0) html += '<tr><td>1h Speedups</td><td>'+sp1+'</td><td>'+(sp1*GEM_VALUES.speedup_1h).toLocaleString()+'</td></tr>';
  if (sp8>0) html += '<tr><td>8h Speedups</td><td>'+sp8+'</td><td>'+(sp8*GEM_VALUES.speedup_8h).toLocaleString()+'</td></tr>';
  if (sp24>0) html += '<tr><td>24h Speedups</td><td>'+sp24+'</td><td>'+(sp24*GEM_VALUES.speedup_24h).toLocaleString()+'</td></tr>';
  if (vip>0) html += '<tr><td>VIP Points</td><td>'+vip.toLocaleString()+'</td><td>'+(vip*GEM_VALUES.vip_points).toLocaleString()+'</td></tr>';
  if (res>0) html += '<tr><td>Resources</td><td>'+res.toLocaleString()+'</td><td>'+(Math.floor(res/100000)*GEM_VALUES.resource_100k).toLocaleString()+'</td></tr>';
  html += '</tbody></table>';

  html += '<div class="alert alert-warn mt-16" style="font-size:12px;">Gem equivalents are community estimates. A "good" pack is typically 150+ gems/$. Top packs during events can exceed 300 gems/$.</div>';
  results.innerHTML = html;
}
document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('pv-calc-btn').addEventListener('click', calculate);
});

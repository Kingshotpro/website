/**
 * calc-hero-compare.js — Hero Stat Comparison
 * KingshotPro
 * Hero stats are loaded dynamically on kingshot.net.
 * This tool lets users input and compare two heroes manually.
 */
function calculate() {
  var h1 = document.getElementById('hc-hero1').value || 'Hero 1';
  var h2 = document.getElementById('hc-hero2').value || 'Hero 2';
  var stats = ['health','lethality','defense','march-speed'];
  var labels = ['Health','Lethality','Defense','March Speed'];
  var results = document.getElementById('hc-results');
  var html = '<table class="data-table"><thead><tr><th>Stat</th><th>'+h1+'</th><th>'+h2+'</th><th>Diff</th></tr></thead><tbody>';
  for (var i = 0; i < stats.length; i++) {
    var v1 = parseFloat(document.getElementById('hc-'+stats[i]+'-1').value) || 0;
    var v2 = parseFloat(document.getElementById('hc-'+stats[i]+'-2').value) || 0;
    var diff = v1 - v2;
    var cls = diff > 0 ? 'text-green' : diff < 0 ? 'text-red' : '';
    html += '<tr><td>'+labels[i]+'</td><td>'+v1.toLocaleString()+'</td><td>'+v2.toLocaleString()+'</td>';
    html += '<td class="'+cls+'">'+(diff>0?'+':'')+diff.toLocaleString()+'</td></tr>';
  }
  html += '</tbody></table>';
  html += '<div class="alert alert-info mt-16" style="font-size:12px;">Enter hero stats from in-game hero detail screen. Automated hero database coming in a future update.</div>';
  results.innerHTML = html;
}
document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('hc-calc-btn').addEventListener('click', calculate);
});

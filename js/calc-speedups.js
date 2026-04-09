/**
 * calc-speedups.js — Speedup Inventory Calculator
 * KingshotPro
 * Input your speedup inventory, see total time + gem value.
 * Optionally input a target time to find optimal usage.
 */

var SPEEDS = [
  { id: 'sp-1m',  label: '1 min',   sec: 60,     gems: 1 },
  { id: 'sp-5m',  label: '5 min',   sec: 300,    gems: 5 },
  { id: 'sp-10m', label: '10 min',  sec: 600,    gems: 10 },
  { id: 'sp-15m', label: '15 min',  sec: 900,    gems: 13 },
  { id: 'sp-30m', label: '30 min',  sec: 1800,   gems: 25 },
  { id: 'sp-60m', label: '1 hour',  sec: 3600,   gems: 50 },
  { id: 'sp-3h',  label: '3 hour',  sec: 10800,  gems: 150 },
  { id: 'sp-8h',  label: '8 hour',  sec: 28800,  gems: 400 },
  { id: 'sp-24h', label: '24 hour', sec: 86400,  gems: 1200 },
];

function fmtTime(s) {
  if (s <= 0) return '0s';
  var d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600),
      m = Math.floor((s % 3600) / 60);
  var parts = [];
  if (d) parts.push(d + 'd');
  if (h) parts.push(h + 'h');
  if (m) parts.push(m + 'm');
  return parts.join(' ') || '< 1m';
}

function renderInputs() {
  var el = document.getElementById('sp-inputs');
  var html = '';
  for (var i = 0; i < SPEEDS.length; i++) {
    var s = SPEEDS[i];
    html += '<div class="form-group" style="display:flex;align-items:center;gap:8px;">';
    html += '<label style="min-width:70px;margin:0;">' + s.label + '</label>';
    html += '<input type="number" id="' + s.id + '" value="0" min="0" style="width:80px;">';
    html += '</div>';
  }
  el.innerHTML = html;
}

function calculate() {
  var totalSec = 0, totalGems = 0;
  var rows = [];

  for (var i = 0; i < SPEEDS.length; i++) {
    var s = SPEEDS[i];
    var qty = parseInt(document.getElementById(s.id).value, 10) || 0;
    if (qty > 0) {
      var sec = qty * s.sec;
      var gems = qty * s.gems;
      totalSec += sec;
      totalGems += gems;
      rows.push({ label: s.label, qty: qty, time: sec, gems: gems });
    }
  }

  var targetSec = 0;
  var targetH = parseInt(document.getElementById('sp-target-h').value, 10) || 0;
  var targetM = parseInt(document.getElementById('sp-target-m').value, 10) || 0;
  targetSec = targetH * 3600 + targetM * 60;

  var results = document.getElementById('sp-results');
  var html = '<div class="result-grid">';
  html += '<div class="result-item"><div class="result-label">Total Time</div>';
  html += '<div class="result-value large">' + fmtTime(totalSec) + '</div></div>';
  html += '<div class="result-item"><div class="result-label">Gem Equivalent</div>';
  html += '<div class="result-value">' + totalGems.toLocaleString() + '</div></div>';
  html += '</div>';

  if (targetSec > 0) {
    var diff = totalSec - targetSec;
    var cls = diff >= 0 ? 'alert-info' : 'alert-error';
    var msg = diff >= 0
      ? 'You have <strong>' + fmtTime(diff) + '</strong> surplus after covering ' + fmtTime(targetSec) + '.'
      : 'You are <strong>' + fmtTime(Math.abs(diff)) + '</strong> short of ' + fmtTime(targetSec) + '. Need ~' + Math.ceil(Math.abs(diff) / 60 * 1).toLocaleString() + ' gems to cover the gap.';
    html += '<div class="alert ' + cls + ' mt-16" style="font-size:13px;">' + msg + '</div>';
  }

  if (rows.length > 0) {
    html += '<table class="data-table mt-16"><thead><tr><th>Speedup</th><th>Qty</th><th>Time</th><th>Gems</th></tr></thead><tbody>';
    for (var j = 0; j < rows.length; j++) {
      html += '<tr><td>' + rows[j].label + '</td><td>' + rows[j].qty + '</td>';
      html += '<td>' + fmtTime(rows[j].time) + '</td><td>' + rows[j].gems.toLocaleString() + '</td></tr>';
    }
    html += '</tbody></table>';
  }

  results.innerHTML = html;
}

document.addEventListener('DOMContentLoaded', function() {
  renderInputs();
  document.getElementById('sp-calc-btn').addEventListener('click', calculate);
});

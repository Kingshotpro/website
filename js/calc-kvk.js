/**
 * calc-kvk.js — KvK (Kingdom vs Kingdom) Score Calculator
 * KingshotPro
 *
 * Data: kingshotguide.org/guide/kingshot-kvk-event — April 2026
 * Cross-verified with kingshotdata.com
 *
 * 5 preparation days, each with scored activities.
 * Points determine State Bonus for Battle Day.
 */

var KVK_DAYS = [
  { day: 1, name: 'City Construction', actions: [
    { label: 'Charm level increase', unit: 'levels', pts: 70 },
    { label: 'Truegold building upgrade', unit: 'upgrades', pts: 2000 },
    { label: 'Speedups used (1M each)', unit: 'million', pts: 30 },
    { label: 'Intel Mission completed', unit: 'missions', pts: 6000 },
  ]},
  { day: 2, name: 'Basic Skills Up', actions: [
    { label: 'Truegold building upgrade', unit: 'upgrades', pts: 2000 },
    { label: 'Speedups used (1M each)', unit: 'million', pts: 30 },
    { label: 'Hero Roulette spin', unit: 'spins', pts: 8000 },
    { label: 'Hero Shards ascension (Epic)', unit: 'ascensions', pts: 1220 },
    { label: 'Hero Shards ascension (Mythic)', unit: 'ascensions', pts: 3040 },
    { label: 'Resources gathered (per 1K food/wood)', unit: 'thousands', pts: 2 },
  ]},
  { day: 3, name: 'Pet Training', actions: [
    { label: 'Pet advancement', unit: 'levels', pts: 50 },
    { label: 'Advanced Taming Mark', unit: 'marks', pts: 15000 },
    { label: 'Common Taming Mark', unit: 'marks', pts: 1150 },
    { label: 'Charm level increase', unit: 'levels', pts: 70 },
    { label: 'Hero Roulette spin', unit: 'spins', pts: 8000 },
    { label: 'Intel Mission completed', unit: 'missions', pts: 6000 },
  ]},
  { day: 4, name: 'Hero Development', actions: [
    { label: 'Charm level increase', unit: 'levels', pts: 70 },
    { label: 'Hero Gear Forgehammer used', unit: 'hammers', pts: 4000 },
    { label: 'Hero Exclusive Gear Widget', unit: 'widgets', pts: 8000 },
    { label: 'Mithril used', unit: 'mithril', pts: 40000 },
    { label: 'Troops trained (per unit, T1-T3)', unit: 'troops', pts: 3 },
    { label: 'Troops trained (per unit, T4-T6)', unit: 'troops', pts: 10 },
    { label: 'Troops trained (per unit, T7-T10)', unit: 'troops', pts: 30 },
  ]},
  { day: 5, name: 'Power Boost', actions: [
    { label: 'Pet advancement', unit: 'levels', pts: 50 },
    { label: 'Advanced Taming Mark', unit: 'marks', pts: 15000 },
    { label: 'Common Taming Mark', unit: 'marks', pts: 1150 },
    { label: 'Mithril used', unit: 'mithril', pts: 40000 },
    { label: 'Forgehammer used', unit: 'hammers', pts: 4000 },
    { label: 'Widget used', unit: 'widgets', pts: 8000 },
    { label: 'Truegold building upgrade', unit: 'upgrades', pts: 2000 },
    { label: 'Speedups used (1M each)', unit: 'million', pts: 30 },
    { label: 'Intel Mission completed', unit: 'missions', pts: 6000 },
  ]},
];

var selectedDay = 0;

function renderDayTabs() {
  var tabs = document.getElementById('kvk-tabs');
  var html = '';
  for (var i = 0; i < KVK_DAYS.length; i++) {
    var cls = i === selectedDay ? ' active' : '';
    html += '<div class="tab' + cls + '" data-day="' + i + '">Day ' + KVK_DAYS[i].day + '</div>';
  }
  tabs.innerHTML = html;
  tabs.addEventListener('click', function(e) {
    var t = e.target.closest('.tab');
    if (!t) return;
    selectedDay = parseInt(t.getAttribute('data-day'), 10);
    renderDayTabs();
    renderInputs();
  });
}

function renderInputs() {
  var day = KVK_DAYS[selectedDay];
  var el = document.getElementById('kvk-inputs');
  var html = '<h3 style="color:var(--gold);margin-bottom:12px;">Day ' + day.day + ': ' + day.name + '</h3>';
  for (var i = 0; i < day.actions.length; i++) {
    var a = day.actions[i];
    html += '<div class="form-group">';
    html += '<label>' + a.label + ' <span class="text-muted">(' + a.pts.toLocaleString() + ' pts each)</span></label>';
    html += '<input type="number" class="kvk-qty" data-idx="' + i + '" placeholder="0" min="0" value="0">';
    html += '</div>';
  }
  el.innerHTML = html;
}

function calculate() {
  var day = KVK_DAYS[selectedDay];
  var inputs = document.querySelectorAll('.kvk-qty');
  var results = document.getElementById('kvk-results');
  var total = 0;
  var rows = [];

  for (var i = 0; i < inputs.length; i++) {
    var qty = parseInt(inputs[i].value, 10) || 0;
    var pts = qty * day.actions[i].pts;
    total += pts;
    if (qty > 0) rows.push({ label: day.actions[i].label, qty: qty, pts: pts });
  }

  var html = '<div class="result-grid">';
  html += '<div class="result-item"><div class="result-label">Day ' + day.day + ' Total</div>';
  html += '<div class="result-value large">' + total.toLocaleString() + ' <span class="result-unit">pts</span></div></div>';
  html += '</div>';

  if (rows.length > 0) {
    html += '<table class="data-table mt-16"><thead><tr><th>Activity</th><th>Qty</th><th>Points</th></tr></thead><tbody>';
    for (var j = 0; j < rows.length; j++) {
      html += '<tr><td>' + rows[j].label + '</td><td>' + rows[j].qty.toLocaleString() + '</td>';
      html += '<td>' + rows[j].pts.toLocaleString() + '</td></tr>';
    }
    html += '</tbody></table>';
  }

  html += '<div class="alert alert-info mt-16" style="font-size:12px;">Data from kingshotguide.org KvK event guide. Points determine your State Bonus for Battle Day. Winner kingdom earns 50 Kingdom Coins.</div>';
  results.innerHTML = html;
}

document.addEventListener('DOMContentLoaded', function() {
  renderDayTabs();
  renderInputs();
  document.getElementById('kvk-calc-btn').addEventListener('click', calculate);
});

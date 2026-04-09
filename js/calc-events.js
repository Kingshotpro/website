/**
 * calc-events.js — Event Timer
 * KingshotPro
 * Countdown timers for recurring game events.
 */

// Known recurring events: [name, schedule description, interval hours, icon]
var EVENTS = [
  { name: 'Viking Vengeance', desc: 'Bi-weekly Tue & Thu', icon: '⚔️', intervalH: 84 },
  { name: 'Mystic Trials',   desc: 'Daily rotation',      icon: '🔮', intervalH: 24 },
  { name: 'Bear Hunt',       desc: 'Multiple daily',       icon: '🐻', intervalH: 8 },
  { name: 'Alliance Gifts',  desc: 'Daily reset',          icon: '🎁', intervalH: 24 },
  { name: 'VIP Chest',       desc: 'Daily reset',          icon: '⭐', intervalH: 24 },
];

var customTimers = [];

function addCustomTimer() {
  var name = document.getElementById('evt-name').value.trim() || 'Custom Event';
  var hours = parseInt(document.getElementById('evt-hours').value, 10) || 0;
  var mins  = parseInt(document.getElementById('evt-mins').value, 10) || 0;
  var totalMs = (hours * 3600 + mins * 60) * 1000;
  if (totalMs <= 0) return;

  customTimers.push({
    name: name,
    endTime: Date.now() + totalMs,
    icon: '📌',
  });

  document.getElementById('evt-name').value = '';
  document.getElementById('evt-hours').value = '';
  document.getElementById('evt-mins').value = '';
  render();
}

function fmtCountdown(ms) {
  if (ms <= 0) return '<span class="text-green">Now!</span>';
  var s = Math.floor(ms / 1000);
  var h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return (h > 0 ? h + 'h ' : '') + m + 'm ' + sec + 's';
}

function render() {
  var el = document.getElementById('evt-results');
  var now = Date.now();

  var html = '<h3 style="font-size:15px;color:var(--text);margin-bottom:12px;">Recurring Events</h3>';
  html += '<table class="data-table"><thead><tr><th></th><th>Event</th><th>Schedule</th></tr></thead><tbody>';
  for (var i = 0; i < EVENTS.length; i++) {
    var e = EVENTS[i];
    html += '<tr><td>' + e.icon + '</td><td>' + e.name + '</td><td>' + e.desc + '</td></tr>';
  }
  html += '</tbody></table>';

  if (customTimers.length > 0) {
    html += '<h3 style="font-size:15px;color:var(--text);margin:20px 0 12px;">Your Timers</h3>';
    html += '<table class="data-table"><thead><tr><th></th><th>Event</th><th>Countdown</th></tr></thead><tbody>';
    for (var j = 0; j < customTimers.length; j++) {
      var t = customTimers[j];
      var remaining = t.endTime - now;
      html += '<tr><td>' + t.icon + '</td><td>' + t.name + '</td>';
      html += '<td>' + fmtCountdown(remaining) + '</td></tr>';
    }
    html += '</tbody></table>';
  }

  el.innerHTML = html;
}

document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('evt-add-btn').addEventListener('click', addCustomTimer);
  render();
  setInterval(render, 1000); // live countdown
});

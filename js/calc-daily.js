/**
 * calc-daily.js — Daily Checklist
 * KingshotPro
 * Interactive daily task tracker. Resets each day.
 * Stored in localStorage with date key. Streak counter.
 */

var TASKS = [
  { id: 'construction', label: 'Construction queue active', icon: '🏗️' },
  { id: 'research',     label: 'Research queue active',     icon: '🔬' },
  { id: 'training',     label: 'Troop training queue',      icon: '⚔️' },
  { id: 'gathering',    label: 'Send gathering marches',    icon: '🌾' },
  { id: 'vip-chest',    label: 'Collect VIP chest',         icon: '🎁' },
  { id: 'alliance-help',label: 'Alliance help (all)',       icon: '🤝' },
  { id: 'daily-quests', label: 'Complete daily quests',     icon: '📋' },
  { id: 'bear-hunt',    label: 'Join Bear Hunt rallies',    icon: '🐻' },
  { id: 'mystic-trial', label: 'Mystic Trial attempts',     icon: '🔮' },
  { id: 'hero-xp',      label: 'Use Hero XP items',        icon: '📊' },
  { id: 'pet-feed',     label: 'Feed pets',                 icon: '🐉' },
  { id: 'events',       label: 'Check active events',      icon: '📅' },
];

var STORE_PREFIX = 'ksp_daily_';
var STREAK_KEY = 'ksp_streak';

function today() {
  return new Date().toISOString().slice(0, 10);
}

function loadChecks() {
  try {
    var raw = localStorage.getItem(STORE_PREFIX + today());
    return raw ? JSON.parse(raw) : {};
  } catch (e) { return {}; }
}

function saveChecks(checks) {
  try { localStorage.setItem(STORE_PREFIX + today(), JSON.stringify(checks)); } catch (e) {}
}

function getStreak() {
  try {
    var data = JSON.parse(localStorage.getItem(STREAK_KEY) || '{}');
    return data;
  } catch (e) { return {}; }
}

function updateStreak(allDone) {
  var streak = getStreak();
  var t = today();
  if (allDone) {
    if (streak.lastDate === t) return; // already counted today
    var yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    if (streak.lastDate === yesterday) {
      streak.count = (streak.count || 0) + 1;
    } else {
      streak.count = 1;
    }
    streak.lastDate = t;
  }
  try { localStorage.setItem(STREAK_KEY, JSON.stringify(streak)); } catch (e) {}
}

function render() {
  var checks = loadChecks();
  var el = document.getElementById('daily-list');
  var done = 0;

  var html = '';
  for (var i = 0; i < TASKS.length; i++) {
    var t = TASKS[i];
    var checked = checks[t.id] ? true : false;
    if (checked) done++;
    html += '<label class="daily-item' + (checked ? ' done' : '') + '">';
    html += '<input type="checkbox" class="daily-check" data-id="' + t.id + '"' + (checked ? ' checked' : '') + '>';
    html += '<span class="daily-icon">' + t.icon + '</span>';
    html += '<span class="daily-label">' + t.label + '</span>';
    html += '</label>';
  }
  el.innerHTML = html;

  // Progress
  var pct = Math.round((done / TASKS.length) * 100);
  document.getElementById('daily-progress').innerHTML =
    '<div style="display:flex;justify-content:space-between;margin-bottom:6px;">' +
    '<span>' + done + '/' + TASKS.length + ' tasks</span>' +
    '<span>' + pct + '%</span></div>' +
    '<div style="background:var(--surface-2);border-radius:4px;height:8px;overflow:hidden;">' +
    '<div style="background:var(--gold);height:100%;width:' + pct + '%;border-radius:4px;transition:width 0.3s;"></div></div>';

  // Streak
  var streak = getStreak();
  document.getElementById('daily-streak').innerHTML =
    '🔥 ' + (streak.count || 0) + ' day streak';

  if (done === TASKS.length) updateStreak(true);

  // Wire checkboxes
  var boxes = document.querySelectorAll('.daily-check');
  for (var j = 0; j < boxes.length; j++) {
    boxes[j].addEventListener('change', function() {
      var id = this.getAttribute('data-id');
      var c = loadChecks();
      c[id] = this.checked;
      saveChecks(c);
      render();
    });
  }
}

document.addEventListener('DOMContentLoaded', render);

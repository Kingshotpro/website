/**
 * calc-roster.js — Alliance Roster Tracker
 * KingshotPro
 * Manage alliance members. Stored in localStorage.
 */

var ROSTER_KEY = 'ksp_roster';

function loadRoster() {
  try { return JSON.parse(localStorage.getItem(ROSTER_KEY)) || []; }
  catch (e) { return []; }
}

function saveRoster(roster) {
  try { localStorage.setItem(ROSTER_KEY, JSON.stringify(roster)); } catch (e) {}
}

function addMember() {
  var name = document.getElementById('ros-name').value.trim();
  var power = parseInt(document.getElementById('ros-power').value, 10) || 0;
  var furnace = parseInt(document.getElementById('ros-furnace').value, 10) || 0;
  var troops = parseInt(document.getElementById('ros-troops').value, 10) || 0;
  var status = document.getElementById('ros-status').value;

  if (!name) return;

  var roster = loadRoster();
  roster.push({ name: name, power: power, furnace: furnace, troops: troops, status: status, added: new Date().toISOString().slice(0, 10) });
  saveRoster(roster);

  document.getElementById('ros-name').value = '';
  document.getElementById('ros-power').value = '';
  document.getElementById('ros-furnace').value = '';
  document.getElementById('ros-troops').value = '';
  renderRoster();
}

function removeMember(idx) {
  var roster = loadRoster();
  roster.splice(idx, 1);
  saveRoster(roster);
  renderRoster();
}

function exportCSV() {
  var roster = loadRoster();
  var csv = 'Name,Power,Furnace,Troops,Status,Added\n';
  for (var i = 0; i < roster.length; i++) {
    var m = roster[i];
    csv += '"' + m.name + '",' + m.power + ',' + m.furnace + ',' + m.troops + ',' + m.status + ',' + m.added + '\n';
  }
  var blob = new Blob([csv], { type: 'text/csv' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'alliance_roster.csv';
  a.click();
  URL.revokeObjectURL(url);
}

var sortCol = 'power';
var sortAsc = false;

function sortRoster(col) {
  if (sortCol === col) sortAsc = !sortAsc;
  else { sortCol = col; sortAsc = false; }
  renderRoster();
}

function renderRoster() {
  var roster = loadRoster();
  var el = document.getElementById('ros-results');

  // Sort
  roster.sort(function(a, b) {
    var va = a[sortCol], vb = b[sortCol];
    if (typeof va === 'string') va = va.toLowerCase();
    if (typeof vb === 'string') vb = vb.toLowerCase();
    if (va < vb) return sortAsc ? -1 : 1;
    if (va > vb) return sortAsc ? 1 : -1;
    return 0;
  });

  var html = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">';
  html += '<span style="font-size:14px;color:var(--text-muted);">' + roster.length + ' members</span>';
  if (roster.length > 0) html += '<button class="btn btn-outline btn-sm" onclick="exportCSV()">Export CSV</button>';
  html += '</div>';

  if (roster.length === 0) {
    html += '<p class="result-placeholder">No members added yet. Use the form to add alliance members.</p>';
    el.innerHTML = html;
    return;
  }

  var arrow = sortAsc ? ' ↑' : ' ↓';
  html += '<table class="data-table"><thead><tr>';
  html += '<th onclick="sortRoster(\'name\')" style="cursor:pointer">Name' + (sortCol === 'name' ? arrow : '') + '</th>';
  html += '<th onclick="sortRoster(\'power\')" style="cursor:pointer">Power' + (sortCol === 'power' ? arrow : '') + '</th>';
  html += '<th onclick="sortRoster(\'furnace\')" style="cursor:pointer">FC' + (sortCol === 'furnace' ? arrow : '') + '</th>';
  html += '<th onclick="sortRoster(\'status\')" style="cursor:pointer">Status' + (sortCol === 'status' ? arrow : '') + '</th>';
  html += '<th></th></tr></thead><tbody>';

  for (var i = 0; i < roster.length; i++) {
    var m = roster[i];
    var statusCls = m.status === 'active' ? 'text-green' : m.status === 'inactive' ? 'text-red' : '';
    html += '<tr><td>' + m.name + '</td><td>' + m.power.toLocaleString() + '</td>';
    html += '<td>' + m.furnace + '</td>';
    html += '<td class="' + statusCls + '">' + m.status + '</td>';
    html += '<td><button class="btn btn-sm" style="padding:2px 8px;font-size:11px;color:var(--red);background:none;border:1px solid var(--red);" onclick="removeMember(' + i + ')">✕</button></td></tr>';
  }
  html += '</tbody></table>';

  el.innerHTML = html;
}

document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('ros-add-btn').addEventListener('click', addMember);
  renderRoster();
});

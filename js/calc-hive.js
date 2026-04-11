/**
 * calc-hive.js — Hive Layout Planner
 * KingshotPro
 * Interactive grid for alliance city placement.
 * Click cells to cycle: Empty → R5 → R4 → R3 → Farmer → Flag → Empty
 */

var GRID_SIZE = 13;
var CELL_TYPES = [
  { id: 'empty',    label: '',       color: '#1e2030', border: '#2a2d3e' },
  { id: 'r5',       label: 'R5',     color: '#f0c040', border: '#d4a830' },
  { id: 'r4',       label: 'R4',     color: '#5c8ce0', border: '#4a70b8' },
  { id: 'r3',       label: 'R3',     color: '#4caf82', border: '#3d8f6a' },
  { id: 'farmer',   label: 'F',      color: '#7a7d8e', border: '#5a5d6e' },
  { id: 'flag',     label: '⚑',     color: '#e05c5c', border: '#c04040' },
  { id: 'trap',     label: '🪤',    color: '#8B4513', border: '#6B3410' },
  { id: 'hospital', label: '🏥',    color: '#2d8659', border: '#1d6640' },
  { id: 'barracks', label: '⚔',     color: '#7048a6', border: '#5a3890' },
  { id: 'wall',     label: '🧱',    color: '#6d6050', border: '#504030' },
  { id: 'tower',    label: '🗼',    color: '#4a6fa5', border: '#3a5f90' },
  { id: 'resource', label: '📦',    color: '#2a8a5a', border: '#1a7a4a' },
];

var grid = [];
var currentBrush = 1; // default R5

function initGrid() {
  grid = [];
  for (var r = 0; r < GRID_SIZE; r++) {
    grid[r] = [];
    for (var c = 0; c < GRID_SIZE; c++) {
      grid[r][c] = 0;
    }
  }
}

function renderGrid() {
  var el = document.getElementById('hive-grid');
  var html = '<div class="hive-grid-inner">';
  for (var r = 0; r < GRID_SIZE; r++) {
    for (var c = 0; c < GRID_SIZE; c++) {
      var t = CELL_TYPES[grid[r][c]];
      html += '<div class="hive-cell" data-r="' + r + '" data-c="' + c + '" ' +
        'style="background:' + t.color + ';border-color:' + t.border + ';">' +
        t.label + '</div>';
    }
  }
  html += '</div>';
  el.innerHTML = html;

  // Wire clicks
  var cells = el.querySelectorAll('.hive-cell');
  for (var i = 0; i < cells.length; i++) {
    cells[i].addEventListener('click', function() {
      var row = parseInt(this.getAttribute('data-r'), 10);
      var col = parseInt(this.getAttribute('data-c'), 10);
      grid[row][col] = currentBrush;
      renderGrid();
      updateStats();
    });
    cells[i].addEventListener('contextmenu', function(e) {
      e.preventDefault();
      var row = parseInt(this.getAttribute('data-r'), 10);
      var col = parseInt(this.getAttribute('data-c'), 10);
      grid[row][col] = 0;
      renderGrid();
      updateStats();
    });
  }
}

function renderBrushes() {
  var el = document.getElementById('hive-brushes');
  var html = '';
  for (var i = 0; i < CELL_TYPES.length; i++) {
    var t = CELL_TYPES[i];
    var active = i === currentBrush ? ' hive-brush-active' : '';
    html += '<button class="hive-brush' + active + '" data-brush="' + i + '" ' +
      'style="background:' + t.color + ';border-color:' + t.border + ';">' +
      (t.label || '✕') + '</button>';
  }
  el.innerHTML = html;

  var btns = el.querySelectorAll('.hive-brush');
  for (var j = 0; j < btns.length; j++) {
    btns[j].addEventListener('click', function() {
      currentBrush = parseInt(this.getAttribute('data-brush'), 10);
      renderBrushes();
    });
  }
}

function updateStats() {
  var counts = {};
  for (var i = 0; i < CELL_TYPES.length; i++) counts[CELL_TYPES[i].id] = 0;
  for (var r = 0; r < GRID_SIZE; r++) {
    for (var c = 0; c < GRID_SIZE; c++) {
      counts[CELL_TYPES[grid[r][c]].id]++;
    }
  }

  var el = document.getElementById('hive-stats');
  var html = '<div class="result-grid">';
  html += '<div class="result-item"><div class="result-label">R5 (Leaders)</div><div class="result-value" style="color:#f0c040">' + counts.r5 + '</div></div>';
  html += '<div class="result-item"><div class="result-label">R4 (Officers)</div><div class="result-value" style="color:#5c8ce0">' + counts.r4 + '</div></div>';
  html += '<div class="result-item"><div class="result-label">R3 (Members)</div><div class="result-value" style="color:#4caf82">' + counts.r3 + '</div></div>';
  html += '<div class="result-item"><div class="result-label">Farmers</div><div class="result-value" style="color:#7a7d8e">' + counts.farmer + '</div></div>';
  html += '<div class="result-item"><div class="result-label">Flags</div><div class="result-value" style="color:#e05c5c">' + counts.flag + '</div></div>';
  html += '<div class="result-item"><div class="result-label">Total Placed</div><div class="result-value">' + (GRID_SIZE * GRID_SIZE - counts.empty) + '</div></div>';
  html += '</div>';
  el.innerHTML = html;
}

function autoLayout() {
  initGrid();
  var center = Math.floor(GRID_SIZE / 2);
  // R5 in center
  grid[center][center] = 1;
  // R4 inner ring
  for (var dr = -1; dr <= 1; dr++) {
    for (var dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      grid[center + dr][center + dc] = 2;
    }
  }
  // R3 next ring
  for (var dr2 = -2; dr2 <= 2; dr2++) {
    for (var dc2 = -2; dc2 <= 2; dc2++) {
      if (Math.abs(dr2) <= 1 && Math.abs(dc2) <= 1) continue;
      if (center + dr2 >= 0 && center + dr2 < GRID_SIZE && center + dc2 >= 0 && center + dc2 < GRID_SIZE) {
        grid[center + dr2][center + dc2] = 3;
      }
    }
  }
  // Farmers outer ring
  for (var dr3 = -3; dr3 <= 3; dr3++) {
    for (var dc3 = -3; dc3 <= 3; dc3++) {
      if (Math.abs(dr3) <= 2 && Math.abs(dc3) <= 2) continue;
      if (center + dr3 >= 0 && center + dr3 < GRID_SIZE && center + dc3 >= 0 && center + dc3 < GRID_SIZE) {
        grid[center + dr3][center + dc3] = 4;
      }
    }
  }
  // Flags at corners
  grid[center - 3][center] = 5;
  grid[center + 3][center] = 5;
  grid[center][center - 3] = 5;
  grid[center][center + 3] = 5;

  renderGrid();
  updateStats();
}

function clearGrid() {
  initGrid();
  renderGrid();
  updateStats();
}

document.addEventListener('DOMContentLoaded', function() {
  initGrid();
  renderBrushes();
  renderGrid();
  updateStats();
  document.getElementById('hive-auto').addEventListener('click', autoLayout);
  document.getElementById('hive-clear').addEventListener('click', clearGrid);
});

/**
 * calc-building.js — Building Upgrade Calculator
 * KingshotPro | Phase 1
 *
 * IMPORTANT: Resource cost tables below are marked with their verification status.
 * Values marked [EST] are community estimates — verify at kingshotdata.com.
 * Values marked [VERIFIED] have been confirmed in-game.
 * Update this file as data is confirmed. See SPEC.md for data policy.
 */

// ─────────────────────────────────────────
// DATA TABLES
// Each entry: [level, food, wood, stone, iron, gold, time_seconds]
// 0 values = data not yet collected for this level
// ─────────────────────────────────────────

// Data source: kingshot.net/database/buildings — verified April 2026
// Format: [from_level, food, wood, stone, iron, gold, time_seconds]
// "from_level" is the level BEFORE the upgrade (upgrading from X to X+1)
// gold = 0 for levels 1–30 (Truegold only appears in TG levels)
// Level 11 Town Center stone marked [EST] — extraction uncertain, verify in-game

const BUILDING_DATA = {

  castle: {
    name: 'Town Center',
    maxLevel: 30,
    source: 'kingshot.net/database/buildings/town-center',
    costs: [
      // [from_lv, food,        wood,        stone,      iron,      gold, time_sec]
      [1,  0,          0,           0,          0,         0,    0      ],
      [2,  0,          180,         0,          0,         0,    6      ],
      [3,  0,          805,         0,          0,         0,    60     ],
      [4,  0,          1800,        360,        0,         0,    180    ],
      [5,  0,          7600,        1500,       0,         0,    600    ],
      [6,  0,          19000,       3800,       960,       0,    1800   ],
      [7,  0,          69000,       13000,      3400,      0,    3600   ],
      [8,  0,          120000,      25000,      6300,      0,    9000   ],
      [9,  0,          260000,      52000,      13000,     0,    16200  ],
      [10, 0,          460000,      92000,      23000,     0,    21600  ],
      [11, 1300000,    1300000,     200000,     65000,     0,    27000  ], // stone [EST] ~200K
      [12, 1600000,    1600000,     330000,     84000,     0,    32400  ],
      [13, 2300000,    2300000,     470000,     110000,    0,    39600  ],
      [14, 3100000,    3100000,     630000,     150000,    0,    50400  ],
      [15, 4600000,    4600000,     930000,     230000,    0,    64800  ],
      [16, 5900000,    5900000,     1100000,    290000,    0,    109680 ],
      [17, 9300000,    9300000,     1800000,    480000,    0,    131040 ],
      [18, 12000000,   12000000,    2500000,    620000,    0,    157380 ],
      [19, 15000000,   15000000,    3100000,    780000,    0,    236400 ],
      [20, 21000000,   21000000,    4300000,    1000000,   0,    294600 ],
      [21, 27000000,   27000000,    5400000,    1300000,   0,    380340 ],
      [22, 36000000,   36000000,    7200000,    1800000,   0,    572940 ],
      [23, 44000000,   44000000,    8900000,    2200000,   0,    806400 ],
      [24, 60000000,   60000000,    12000000,   3000000,   0,    1127580],
      [25, 81000000,   81000000,    16000000,   4000000,   0,    1584120],
      [26, 100000000,  100000000,   21000000,   5200000,   0,    1818360],
      [27, 140000000,  140000000,   24000000,   7400000,   0,    2185980],
      [28, 190000000,  190000000,   39000000,   9900000,   0,    2507520],
      [29, 240000000,  240000000,   49000000,   12000000,  0,    2894520],
    ],
    note: 'Source: kingshot.net (April 2026). Level 11 stone [EST].'
  },

  academy: {
    name: 'War Academy',
    maxLevel: 30,
    source: 'kingshot.net/database/buildings/academy',
    costs: [
      [1,  0,         105,       0,        0,       0,   2      ],
      [2,  0,         160,       0,        0,       0,   9      ],
      [3,  0,         725,       0,        0,       0,   45     ],
      [4,  0,         1600,      320,      0,       0,   135    ],
      [5,  0,         6800,      1300,     0,       0,   270    ],
      [6,  0,         17000,     3400,     860,     0,   540    ],
      [7,  0,         62000,     12000,    3100,    0,   1080   ],
      [8,  0,         110000,    22000,    5600,    0,   1620   ],
      [9,  0,         230000,    47000,    11000,   0,   2430   ],
      [10, 0,         410000,    82000,    20000,   0,   3240   ],
      [11, 520000,    520000,    100000,   26000,   0,   4050   ],
      [12, 670000,    670000,    130000,   33000,   0,   4860   ],
      [13, 950000,    950000,    190000,   47000,   0,   5940   ],
      [14, 1200000,   1200000,   250000,   63000,   0,   7560   ],
      [15, 1800000,   1800000,   370000,   93000,   0,   9720   ],
      [16, 2300000,   2300000,   470000,   110000,  0,   16440  ],
      [17, 3700000,   3700000,   740000,   180000,  0,   19740  ],
      [18, 5000000,   5000000,   1000000,  250000,  0,   23700  ],
      [19, 6200000,   6200000,   1200000,  310000,  0,   35520  ],
      [20, 8600000,   8600000,   1700000,  430000,  0,   44430  ],
      [21, 10000000,  10000000,  2100000,  540000,  0,   57750  ],
      [22, 14000000,  14000000,  2800000,  720000,  0,   86640  ],
      [23, 17000000,  17000000,  3500000,  890000,  0,   121320 ],
      [24, 24000000,  24000000,  4800000,  1200000, 0,   169860 ],
      [25, 32000000,  32000000,  6500000,  1600000, 0,   237780 ],
      [26, 42000000,  42000000,  8400000,  2100000, 0,   273420 ],
      [27, 59000000,  59000000,  11000000, 2900000, 0,   328140 ],
      [28, 79000000,  79000000,  15000000, 3900000, 0,   377340 ],
      [29, 98000000,  98000000,  19000000, 4900000, 0,   433980 ],
    ],
    note: 'Source: kingshot.net (April 2026).'
  },

  barracks: {
    name: 'Barracks',
    maxLevel: 30,
    source: 'kingshot.net/database/buildings/barracks',
    costs: [
      [1,  0,         0,         0,       0,      0,   2      ],
      [2,  0,         140,       0,       0,      0,   9      ],
      [3,  0,         645,       0,       0,      0,   45     ],
      [4,  0,         1400,      285,     0,      0,   135    ],
      [5,  0,         6000,      1200,    0,      0,   270    ],
      [6,  0,         15000,     3000,    765,    0,   540    ],
      [7,  0,         55000,     11000,   2700,   0,   1080   ],
      [8,  0,         100000,    20000,   5000,   0,   1620   ],
      [9,  0,         200000,    41000,   10000,  0,   2430   ],
      [10, 0,         360000,    73000,   18000,  0,   3240   ],
      [11, 460000,    460000,    92000,   23000,  0,   4050   ],
      [12, 580000,    580000,    110000,  29000,  0,   4860   ],
      [13, 830000,    830000,    160000,  41000,  0,   5940   ],
      [14, 1100000,   1100000,   220000,  55000,  0,   7560   ],
      [15, 1600000,   1600000,   320000,  81000,  0,   9720   ],
      [16, 2000000,   2000000,   410000,  100000, 0,   16440  ],
      [17, 3200000,   3200000,   650000,  160000, 0,   19740  ],
      [18, 4300000,   4300000,   870000,  210000, 0,   23700  ],
      [19, 5400000,   5400000,   1000000, 270000, 0,   35520  ],
      [20, 7500000,   7500000,   1500000, 370000, 0,   44430  ],
      [21, 9500000,   9500000,   1900000, 470000, 0,   57750  ],
      [22, 12000000,  12000000,  2500000, 630000, 0,   86640  ],
      [23, 15000000,  15000000,  3100000, 780000, 0,   121320 ],
      [24, 21000000,  21000000,  4200000, 1000000,0,   169860 ],
      [25, 28000000,  28000000,  5700000, 1400000,0,   237780 ],
      [26, 36000000,  36000000,  7300000, 1800000,0,   273420 ],
      [27, 52000000,  52000000,  10000000,2600000,0,   328140 ],
      [28, 69000000,  69000000,  13000000,3400000,0,   377340 ],
      [29, 86000000,  86000000,  17000000,4300000,0,   433980 ],
    ],
    note: 'Source: kingshot.net (April 2026).'
  },

  hospital: {
    name: 'Infirmary',
    maxLevel: 30,
    source: 'kingshot.net/database/buildings/infirmary',
    costs: [
      // [from_lv, food,      wood,       stone,     iron,     gold, time_sec]
      [1,  0,         0,          0,         0,        0,    2],
      [2,  0,         100,        0,         0,        0,    9],
      [3,  0,         460,        0,         0,        0,    40],
      [4,  0,         1000,       205,       0,        0,    125],
      [5,  0,         4300,       865,       0,        0,    250],
      [6,  0,         10000,      2100,      545,      0,    500],
      [7,  0,         39000,      7800,      1900,     0,    990],
      [8,  0,         72000,      14000,     3600,     0,    1500],
      [9,  0,         140000,     29000,     7400,     0,    2250],
      [10, 0,         260000,     52000,     13000,    0,    3000],
      [11, 320000,    320000,     65000,     16000,    0,    3780],
      [12, 420000,    420000,     84000,     21000,    0,    4530],
      [13, 590000,    590000,     110000,    29000,    0,    5520],
      [14, 780000,    780000,     150000,    39000,    0,    7050],
      [15, 1100000,   1100000,    230000,    58000,    0,    9060],
      [16, 1400000,   1400000,    290000,    74000,    0,    15360],
      [17, 2300000,   2300000,    460000,    100000,   0,    18420],
      [18, 3100000,   3100000,    620000,    150000,   0,    22110],
      [19, 3900000,   3900000,    780000,    190000,   0,    33180],
      [20, 5300000,   5300000,    1000000,   260000,   0,    41460],
      [21, 6800000,   6800000,    1300000,   340000,   0,    53910],
      [22, 9000000,   9000000,    1800000,   450000,   0,    80880],
      [23, 11000000,  11000000,   2200000,   560000,   0,    113220],
      [24, 15000000,  15000000,   3000000,   750000,   0,    158520],
      [25, 20000000,  20000000,   4000000,   1000000,  0,    221940],
      [26, 26000000,  26000000,   5200000,   1300000,  0,    255240],
      [27, 37000000,  37000000,   7400000,   1800000,  0,    306240],
      [28, 49000000,  49000000,   9900000,   2400000,  0,    352200],
      [29, 61000000,  61000000,   12000000,  3000000,  0,    405060],
    ],
  },

  storehouse: {
    name: 'Storehouse',
    maxLevel: 30,
    source: 'kingshot.net/database/buildings/storehouse',
    costs: [
      // [from_lv, food,      wood,       stone,     iron,     gold, time_sec]
      [1,  0,         60,         0,         0,        0,    2],
      [2,  0,         90,         0,         0,        0,    9],
      [3,  0,         400,        0,         0,        0,    45],
      [4,  0,         900,        180,       0,        0,    135],
      [5,  0,         3800,       760,       0,        0,    270],
      [6,  0,         9600,       1900,      480,      0,    540],
      [7,  0,         34000,      6900,      1700,     0,    1080],
      [8,  0,         63000,      12000,     3100,     0,    1620],
      [9,  0,         130000,     26000,     6500,     0,    2430],
      [10, 0,         230000,     46000,     11000,    0,    3240],
      [11, 290000,    290000,     57000,     14000,    0,    4050],
      [12, 370000,    370000,     74000,     18000,    0,    4860],
      [13, 520000,    520000,     100000,    26000,    0,    5940],
      [14, 690000,    690000,     130000,    34000,    0,    7560],
      [15, 1000000,   1000000,    200000,    51000,    0,    9720],
      [16, 1300000,   1300000,    260000,    65000,    0,    16440],
      [17, 2000000,   2000000,    400000,    100000,   0,    19740],
      [18, 2700000,   2700000,    550000,    130000,   0,    23700],
      [19, 3400000,   3400000,    690000,    170000,   0,    35550],
      [20, 4700000,   4700000,    940000,    230000,   0,    44430],
      [21, 6000000,   6000000,    1200000,   300000,   0,    57750],
      [22, 7900000,   7900000,    1500000,   390000,   0,    86640],
      [23, 9800000,   9800000,    1900000,   490000,   0,    121320],
      [24, 13000000,  13000000,   2600000,   660000,   0,    169860],
      [25, 17000000,  17000000,   3500000,   890000,   0,    237780],
      [26, 23000000,  23000000,   4600000,   1100000,  0,    273420],
      [27, 32000000,  32000000,   6500000,   1600000,  0,    328140],
      [28, 43000000,  43000000,   8700000,   2100000,  0,    377340],
      [29, 54000000,  54000000,   10000000,  2700000,  0,    433980],
    ],
  },

};

// ─────────────────────────────────────────
// STATE
// ─────────────────────────────────────────

let currentBuilding = 'castle';

// ─────────────────────────────────────────
// TAB SWITCH
// ─────────────────────────────────────────

function switchTab(el, building) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  currentBuilding = building;
  populateLevelSelects();
  clearResults();
}

// ─────────────────────────────────────────
// LEVEL SELECTS
// ─────────────────────────────────────────

function populateLevelSelects() {
  const data    = BUILDING_DATA[currentBuilding];
  const maxLv   = data.maxLevel;
  const fromSel = document.getElementById('from-level');
  const toSel   = document.getElementById('to-level');

  fromSel.innerHTML = '';
  toSel.innerHTML   = '';

  for (let i = 1; i < maxLv; i++) {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = `Level ${i}`;
    fromSel.appendChild(opt);
  }

  fromSel.value = 1;

  for (let i = 2; i <= maxLv; i++) {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = `Level ${i}`;
    toSel.appendChild(opt);
  }

  toSel.value = Math.min(5, maxLv);

  // When from changes, ensure to > from
  fromSel.addEventListener('change', () => {
    const from = Number(fromSel.value);
    Array.from(toSel.options).forEach(o => {
      o.disabled = Number(o.value) <= from;
    });
    if (Number(toSel.value) <= from) {
      toSel.value = from + 1;
    }
  });
}

// ─────────────────────────────────────────
// CALCULATE
// ─────────────────────────────────────────

function calculate() {
  const fromLv = Number(document.getElementById('from-level').value);
  const toLv   = Number(document.getElementById('to-level').value);
  const buff   = Number(document.getElementById('buff-slider').value) / 100;
  const data   = BUILDING_DATA[currentBuilding];

  if (toLv <= fromLv) {
    showError('Target level must be greater than current level.');
    return;
  }

  // Collect costs for levels in range
  const relevant = data.costs.filter(
    row => row[0] >= fromLv && row[0] < toLv
  );

  if (relevant.length === 0) {
    showDataPending(data);
    return;
  }

  // Sum resources
  let food = 0, wood = 0, stone = 0, iron = 0, gold = 0, timeSec = 0;
  relevant.forEach(row => {
    food  += row[1];
    wood  += row[2];
    stone += row[3];
    iron  += row[4];
    gold  += row[5];
    timeSec += row[6];
  });

  // Apply construction buff to time
  const adjustedTime = timeSec / (1 + buff);

  renderResults({ food, wood, stone, iron, gold, timeSec: adjustedTime, fromLv, toLv, levelsFound: relevant.length });
}

// ─────────────────────────────────────────
// RESULT RENDERING
// ─────────────────────────────────────────

function renderResults({ food, wood, stone, iron, gold, timeSec, fromLv, toLv, levelsFound }) {
  const area = document.getElementById('result-area');

  const levels = toLv - fromLv;
  const missing = levels - levelsFound;

  area.innerHTML = `
    <div style="margin-bottom:16px;font-size:13px;color:var(--text-muted);">
      Levels ${fromLv} → ${toLv}
      ${missing > 0 ? `<span class="text-red"> · ${missing} level(s) missing data</span>` : ''}
    </div>
    <div class="result-grid">
      <div class="result-item">
        <div class="result-label">🍖 Food</div>
        <div class="result-value">${fmtNum(food)}</div>
      </div>
      <div class="result-item">
        <div class="result-label">🪵 Wood</div>
        <div class="result-value">${fmtNum(wood)}</div>
      </div>
      <div class="result-item">
        <div class="result-label">🪨 Stone</div>
        <div class="result-value">${fmtNum(stone)}</div>
      </div>
      <div class="result-item">
        <div class="result-label">⚙️ Iron</div>
        <div class="result-value">${fmtNum(iron)}</div>
      </div>
      ${gold > 0 ? `
      <div class="result-item">
        <div class="result-label">💰 Gold</div>
        <div class="result-value">${fmtNum(gold)}</div>
      </div>` : ''}
      <div class="result-item">
        <div class="result-label">⏱️ Time</div>
        <div class="result-value">${fmtTime(timeSec)}</div>
      </div>
    </div>
  `;

  document.getElementById('data-notice').classList.remove('hidden');
}

function showDataPending(data) {
  const area = document.getElementById('result-area');
  area.innerHTML = `
    <div class="alert alert-warn">
      <div>
        <strong>Data collection in progress</strong><br>
        <span style="font-size:13px;">${data.name} upgrade costs are being verified from in-game sources.
        Want to help? Submit your building costs on
        <a href="https://github.com/growaleaf/kingshot-pro/issues" target="_blank" rel="noopener">GitHub</a>.
        </span>
      </div>
    </div>
    <p style="font-size:13px;color:var(--text-muted);margin-top:12px;">
      In the meantime, visit
      <a href="https://kingshotdata.com" target="_blank" rel="noopener">kingshotdata.com</a>
      or
      <a href="https://kingshotcalculator.com" target="_blank" rel="noopener">kingshotcalculator.com</a>
      for building cost data.
    </p>
  `;
  document.getElementById('data-notice').classList.add('hidden');
}

function showError(msg) {
  const area = document.getElementById('result-area');
  area.innerHTML = `<div class="alert alert-error">${msg}</div>`;
}

function clearResults() {
  document.getElementById('result-area').innerHTML =
    '<p class="result-placeholder">Select levels and click Calculate.</p>';
  document.getElementById('data-notice').classList.add('hidden');
}

// ─────────────────────────────────────────
// FORMATTING
// ─────────────────────────────────────────

function fmtNum(n) {
  if (n === 0) return '—';
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + 'B';
  if (n >= 1_000_000)     return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000)         return (n / 1_000).toFixed(1) + 'K';
  return n.toLocaleString();
}

function fmtTime(sec) {
  if (sec <= 0) return '—';
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const parts = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  return parts.length ? parts.join(' ') : '<1m';
}

// ─────────────────────────────────────────
// INIT
// ─────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  populateLevelSelects();

  // Show profile hint if a profile is stored
  const profile = window.KSP?.loadProfile?.();
  if (profile) {
    document.getElementById('profile-hint').classList.remove('hidden');
  }
});

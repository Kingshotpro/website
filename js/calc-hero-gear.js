/**
 * calc-hero-gear.js — Hero Gear Enhancement Calculator
 * KingshotPro
 *
 * Data: Perplexity citing kingshotcalculator.net + kingshot.net — April 2026
 * XP sources: Gray scrap (10), Green (30), Blue (60), Purple (150)
 * Levels 0-100 = Mythic quality (XP only)
 * Levels 101-200 = Red quality (XP + Mithril + Mythic pieces + Forgehammers)
 *
 * Total per piece 0-100: ~73,320 XP
 * Total per piece 101-200: ~52,000 XP, 150 Mithril, 48 Mythic, 650 Forgehammers
 */

var SCRAP_XP = { gray: 10, green: 30, blue: 60, purple: 150 };

// Approximate XP per level (0-100). Exponential curve.
// Total ~73,320 XP for 100 levels = avg 733 per level, scaling from ~100 to ~2500
function xpForLevel(lv) {
  if (lv <= 0) return 0;
  if (lv <= 100) return Math.round(100 + (lv * lv * 0.22));
  // 101-200: ~520 XP per level average
  return Math.round(300 + ((lv - 100) * (lv - 100) * 0.15));
}

// Materials for levels 101-200 per level (averaged)
// Total: 150 Mithril, 48 Mythic, 650 Forgehammers across 100 levels
function matsForLevel(lv) {
  if (lv <= 100) return { mithril: 0, mythic: 0, forgehammers: 0 };
  return {
    mithril: 1.5,       // 150 / 100
    mythic: 0.48,        // 48 / 100
    forgehammers: 6.5,   // 650 / 100
  };
}

function calculate() {
  var fromLv = parseInt(document.getElementById('hg-from').value, 10) || 0;
  var toLv   = parseInt(document.getElementById('hg-to').value, 10) || 100;
  var pieces = parseInt(document.getElementById('hg-pieces').value, 10) || 1;
  var results = document.getElementById('hg-results');

  if (toLv <= fromLv) {
    results.innerHTML = '<p class="result-placeholder">Target must be higher than current.</p>';
    return;
  }

  var totalXP = 0, totalMith = 0, totalMyth = 0, totalFH = 0;
  for (var lv = fromLv + 1; lv <= toLv; lv++) {
    totalXP += xpForLevel(lv);
    var m = matsForLevel(lv);
    totalMith += m.mithril;
    totalMyth += m.mythic;
    totalFH += m.forgehammers;
  }

  totalMith = Math.ceil(totalMith);
  totalMyth = Math.ceil(totalMyth);
  totalFH = Math.ceil(totalFH);

  var html = '<div class="result-grid">';
  html += '<div class="result-item"><div class="result-label">XP Needed (per piece)</div>';
  html += '<div class="result-value">' + totalXP.toLocaleString() + '</div></div>';
  html += '<div class="result-item"><div class="result-label">Purple Scraps Equiv.</div>';
  html += '<div class="result-value">' + Math.ceil(totalXP / 150).toLocaleString() + '</div></div>';

  if (toLv > 100) {
    html += '<div class="result-item"><div class="result-label">Mithril</div>';
    html += '<div class="result-value">' + totalMith.toLocaleString() + '</div></div>';
    html += '<div class="result-item"><div class="result-label">Mythic Pieces</div>';
    html += '<div class="result-value">' + totalMyth.toLocaleString() + '</div></div>';
    html += '<div class="result-item"><div class="result-label">Forgehammers</div>';
    html += '<div class="result-value">' + totalFH.toLocaleString() + '</div></div>';
  }

  if (pieces > 1) {
    html += '<div class="result-item"><div class="result-label">Total XP (' + pieces + ' pcs)</div>';
    html += '<div class="result-value large">' + (totalXP * pieces).toLocaleString() + '</div></div>';
    if (toLv > 100) {
      html += '<div class="result-item"><div class="result-label">Total Mithril (' + pieces + ' pcs)</div>';
      html += '<div class="result-value">' + (totalMith * pieces).toLocaleString() + '</div></div>';
    }
  }
  html += '</div>';

  html += '<div class="alert alert-info mt-16" style="font-size:12px;">';
  html += '<strong>XP per scrap:</strong> Gray=10, Green=30, Blue=60, Purple=150<br>';
  html += 'Levels 1-100 use XP only. Levels 101-200 (Red gear) also need Mithril, Mythic pieces, and Forgehammers.';
  html += '</div>';

  html += '<div class="alert alert-warn mt-8" style="font-size:12px;">XP curve is estimated from known totals (73,320 XP for 0-100). Per-level breakdown may vary slightly from in-game. <a href="https://github.com/Kingshotpro/website/issues" target="_blank">Report discrepancies &rarr;</a></div>';

  results.innerHTML = html;
}

document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('hg-calc-btn').addEventListener('click', calculate);
});

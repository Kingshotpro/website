/**
 * calc-war.js — Alliance War Planner
 * KingshotPro
 * Coordinate rallies, assign members, plan timing.
 */

function calculate() {
  var numRallies = parseInt(document.getElementById('war-rallies').value, 10) || 1;
  var members = (document.getElementById('war-members').value || '').split('\n').filter(function(s) { return s.trim(); });
  var targets = (document.getElementById('war-targets').value || '').split('\n').filter(function(s) { return s.trim(); });
  var results = document.getElementById('war-results');

  if (members.length === 0) {
    results.innerHTML = '<p class="result-placeholder">Enter at least one member name.</p>';
    return;
  }

  numRallies = Math.min(numRallies, targets.length || 1, members.length);

  // Assign members round-robin to rallies
  var rallies = [];
  for (var i = 0; i < numRallies; i++) {
    rallies.push({
      target: targets[i] || 'Target ' + (i + 1),
      leader: members[i] || 'TBD',
      joiners: []
    });
  }
  // Remaining members become joiners
  for (var j = numRallies; j < members.length; j++) {
    rallies[j % numRallies].joiners.push(members[j]);
  }

  var html = '<div class="result-grid">';
  html += '<div class="result-item"><div class="result-label">Rallies</div><div class="result-value">' + numRallies + '</div></div>';
  html += '<div class="result-item"><div class="result-label">Members</div><div class="result-value">' + members.length + '</div></div>';
  html += '<div class="result-item"><div class="result-label">Per Rally (avg)</div><div class="result-value">' + Math.ceil(members.length / numRallies) + '</div></div>';
  html += '</div>';

  for (var k = 0; k < rallies.length; k++) {
    var r = rallies[k];
    html += '<div class="card mt-16">';
    html += '<div class="card-title" style="color:var(--gold);">Rally ' + (k + 1) + ': ' + r.target + '</div>';
    html += '<p style="font-size:13px;margin-bottom:8px;"><strong>Leader:</strong> ' + r.leader + '</p>';
    html += '<p style="font-size:13px;color:var(--text-muted);">';
    html += '<strong>Joiners (' + r.joiners.length + '):</strong> ';
    html += r.joiners.length > 0 ? r.joiners.join(', ') : 'None assigned';
    html += '</p></div>';
  }

  var garrison = [];
  if (members.length > numRallies * 8) {
    for (var g = numRallies * 8; g < members.length; g++) {
      garrison.push(members[g]);
    }
  }
  if (garrison.length > 0) {
    html += '<div class="card mt-16"><div class="card-title">Garrison / Reserve</div>';
    html += '<p style="font-size:13px;color:var(--text-muted);">' + garrison.join(', ') + '</p></div>';
  }

  results.innerHTML = html;
}

document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('war-calc-btn').addEventListener('click', calculate);
});

/**
 * advisor-select.js — Archetype selection overlay
 * KingshotPro | Phase 1
 *
 * Full-screen overlay triggered after FID lookup for new players.
 * Player picks archetype → random name assigned → advisor introduces itself.
 */
(function () {
  'use strict';

  var overlay   = document.getElementById('adv-select-overlay');
  var titleEl   = document.getElementById('adv-select-title');
  var revealEl  = document.getElementById('adv-reveal');
  var revealImg = document.getElementById('adv-reveal-img');
  var revealTxt = document.getElementById('adv-reveal-text');

  if (!overlay) return;

  var _profile = null;

  // ── Show the selection overlay ───────────
  function showSelection(profile) {
    _profile = profile;
    var name = profile.nickname || 'Governor';
    titleEl.textContent = 'Governor ' + name + '. Every ruler needs a trusted voice. Choose yours.';
    overlay.classList.add('visible');
    document.body.style.overflow = 'hidden';
  }

  // ── Hide the overlay ────────────────────
  function hideSelection() {
    overlay.classList.add('fading');
    setTimeout(function () {
      overlay.classList.remove('visible', 'fading');
      document.body.style.overflow = '';
    }, 600);
  }

  // ── Handle archetype card click ─────────
  var cards = overlay.querySelectorAll('.adv-card[data-archetype]');
  for (var i = 0; i < cards.length; i++) {
    cards[i].addEventListener('click', function () {
      var archetype = this.getAttribute('data-archetype');
      if (!archetype || !window.Advisor) return;

      // Highlight selected card
      for (var j = 0; j < cards.length; j++) cards[j].classList.remove('selected');
      this.classList.add('selected');

      // Create advisor with random name
      var state = window.Advisor.create(archetype);
      window.Advisor.grantXP('fid_lookup', 25);

      // Get name entry for avatar image
      var nameEntry = getAdvisorNameById(state.nameId);
      var imgSrc = nameEntry ? getAdvisorAvatar(nameEntry) : 'avatars/male_default.png';
      var archetypeInfo = window.Advisor.ARCHETYPES[archetype];

      // Show name reveal
      revealImg.innerHTML = '<img src="' + imgSrc + '" alt="' + state.name + '">';
      var greeting = window.Advisor.getGreeting(_profile ? _profile.nickname : 'Governor');
      revealTxt.textContent = greeting;
      revealEl.classList.add('visible');

      // Auto-close after delay
      setTimeout(function () {
        hideSelection();

        // Trigger advisory now that advisor exists
        if (window.KSP && window.KSP.renderAdvisory && _profile) {
          window.KSP.renderAdvisory(_profile);
        }
      }, 3000);
    });
  }

  // ── Handle locked card click ────────────
  var locked = overlay.querySelectorAll('.adv-card-locked');
  for (var k = 0; k < locked.length; k++) {
    locked[k].addEventListener('click', function () {
      var existing = this.querySelector('.adv-locked-tip');
      if (existing) return;
      var tip = document.createElement('div');
      tip.className = 'adv-locked-tip';
      tip.textContent = 'Unlock with KingshotPro \u2014 coming soon';
      this.appendChild(tip);
      setTimeout(function () { if (tip.parentNode) tip.remove(); }, 2500);
    });
  }

  // ── Export for fid.js to call ────────────
  window.KSP = window.KSP || {};
  window.KSP.showAdvisorSelection = showSelection;
})();

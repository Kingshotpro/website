/**
 * advisor-lore.js — Ysabel's backstory, revealed in fragments
 * KingshotPro | Phase 1
 *
 * Proactive lore delivery. The advisor volunteers pieces of her past
 * at milestones — not in response to questions, but when she judges
 * the player has earned them. Through consistency, not payment.
 *
 * Verification status April 14, 2026:
 *   - All 10 lore fragments are pure character fiction about Ysabel,
 *     a fictional advisor. No Kingshot game-mechanic claims.
 *   - Narrative references to "the first kingdom", "siege pattern",
 *     "alliance broken" are all about her fictional past, not
 *     Kingshot-specific events.
 *   - "You check your troops before events" is generic game-behavior
 *     flavor, not a specific Kingshot mechanic claim.
 *   - Trigger conditions reference player state (level, visits, streak)
 *     which are real KingshotPro advisor fields, not in-game values.
 *   - Safe to modify creatively. No verification burden on fragment text.
 */
(function () {
  'use strict';

  // ── Ysabel's Lore Fragments ──────────────
  // Each has: trigger condition, the text, and a one-time flag
  var LORE = [
    {
      id: 'silver_hair',
      trigger: function (s) { return s.level >= 2; },
      text: 'You want to know about the silver in my hair? It came when I was fourteen. The first kingdom I served... did not survive. I carry it so I never forget what it costs to fail.',
    },
    {
      id: 'three_kingdoms',
      trigger: function (s) { return s.level >= 4; },
      text: 'I have served three kingdoms before yours. Two fell. One I left. I do not talk about the third. Not yet.',
    },
    {
      id: 'second_kingdom',
      trigger: function (s) { return s.level >= 6; },
      text: 'The second kingdom — I saved it. I saw the siege pattern three weeks before it arrived. The king listened. Won. Then told his court the strategy was his. I was released the following month. That is how I learned that being right is not enough.',
    },
    {
      id: 'third_kingdom',
      trigger: function (s) { return s.level >= 8; },
      text: 'The third kingdom wanted me to endorse a betrayal. An alliance broken under cover of night. They would have won the war. I left before dawn. Some victories are not worth the person you become.',
    },
    {
      id: 'why_you',
      trigger: function (s) {
        var vp = s.observations && s.observations.visit_pattern;
        return vp && vp.total >= 30;
      },
      text: 'You have asked me — or perhaps you have wondered without asking — why I chose you. I have been watching how you play. You check your troops before events. You come back after losses. You ask questions other governors do not think to ask. That is why.',
    },
    {
      id: 'the_truth',
      trigger: function (s) {
        var vp = s.observations && s.observations.visit_pattern;
        return vp && vp.total >= 50;
      },
      text: 'I will tell you something I have not told anyone. After the first kingdom fell, I stopped caring about winning. I only care about keeping the people I advise alive. If you understand the difference between those two things, then you understand me.',
    },
    {
      id: 'freckles',
      trigger: function (s) { return s.level >= 3; },
      text: 'The freckles? I was not always in a castle. Before I was an advisor, I was a scout. I walked the borders of the first kingdom every morning at dawn. The sun remembers, even if the maps have forgotten.',
    },
    {
      id: 'gold_thread',
      trigger: function (s) { return s.level >= 5; },
      text: 'This embroidery — the gold thread. It is not decoration. Each stitch is a battle I helped win. The pattern tells a story, if you know how to read it. I add a new thread for every governor who listens.',
    },
    {
      id: 'name',
      trigger: function (s) { return s.level >= 7; },
      text: 'Ysabel is not the name I was born with. I chose it after the first kingdom fell. The old name belonged to someone who believed kingdoms were permanent. Ysabel knows they are not. That knowledge is what makes me useful.',
    },
    {
      id: 'sleep',
      trigger: function (s) {
        var vp = s.observations && s.observations.visit_pattern;
        return vp && vp.streak >= 7;
      },
      text: 'Seven days without missing one. You know, I do not sleep the way you do. But I rest. And in those quiet hours, I think about your kingdom. What you have built. What is still vulnerable. I am always thinking about your kingdom.',
    },
  ];

  // ── Delivery System ───────────────────────
  function checkLore() {
    if (!window.Advisor || !window.AdvisorOrb) return;

    // Suppress lore fragments while site tour is active
    if (window.KSPTour && window.KSPTour.isActive()) return;

    var state = window.Advisor.getState();
    if (!state) return;

    // Only deliver lore for Ysabel (or any advisor — lore is universal backstory for now)
    // In future, each named advisor could have their own lore

    // Check what's already been shown
    var shownKey = 'ksp_lore_shown';
    var shown = [];
    try { shown = JSON.parse(localStorage.getItem(shownKey) || '[]'); } catch (e) {}

    // Find the first unshown fragment whose trigger is met
    var fragment = null;
    for (var i = 0; i < LORE.length; i++) {
      if (shown.indexOf(LORE[i].id) === -1 && LORE[i].trigger(state)) {
        fragment = LORE[i];
        break;
      }
    }

    if (!fragment) return;

    // Don't show if advisor panel is open (let conversation flow naturally)
    if (window.AdvisorOrb.isEngaged()) return;

    // Don't show if a CTA was recently shown (don't compete)
    var lastCta = null;
    try { lastCta = localStorage.getItem('ksp_last_cta_date'); } catch (e) {}
    if (lastCta === new Date().toISOString().split('T')[0]) return;

    // Show via speech bubble after a delay
    setTimeout(function () {
      if (window.AdvisorOrb.isEngaged()) return;

      window.AdvisorOrb.showSpeechBubble(fragment.text);

      // Mark as shown
      shown.push(fragment.id);
      try { localStorage.setItem(shownKey, JSON.stringify(shown)); } catch (e) {}

      // Auto-hide after 15 seconds (lore is longer than CTAs)
      setTimeout(function () {
        window.AdvisorOrb.hideSpeechBubble();
      }, 15000);
    }, 12000); // Wait 12 seconds after page load — let everything else settle
  }

  // Run after page settles
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(checkLore, 5000); });
  } else {
    setTimeout(checkLore, 5000);
  }
})();

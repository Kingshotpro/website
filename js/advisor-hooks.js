/**
 * advisor-hooks.js — Wires calculators + pages into the advisor system
 * KingshotPro | Phase 1
 *
 * Automatically detects calculator runs and page visits.
 * Grants XP, records observations, tracks behavior.
 * Include on every page AFTER advisor.js and advisor-names.js.
 *
 * No per-calculator edits needed — hooks into existing DOM events.
 */
(function () {
  'use strict';

  // ── Wait for Advisor to be available ──────
  if (!window.Advisor) return;

  // ── Detect which calculator page we're on ─
  var path = window.location.pathname;
  var calcMatch = path.match(/calculators\/([^.]+)\.html/);
  var calcName = calcMatch ? calcMatch[1] : null;
  var pageName = null;

  if (path.endsWith('codes.html')) pageName = 'codes';
  else if (path.endsWith('auto-redeem.html')) pageName = 'auto-redeem';
  else if (path.endsWith('index.html') || path === '/' || path.endsWith('/')) pageName = 'home';

  // ── Track page visit ──────────────────────
  if (pageName === 'codes') {
    Advisor.grantXP('codes_visit', 3);
  }

  // ── Hook into calculator "Calculate" buttons ─
  if (calcName) {
    // Find all calc buttons by common patterns
    var calcBtns = document.querySelectorAll(
      '[id$="-calc-btn"], [id$="-calculate"], button.btn-primary'
    );

    var xpGranted = {}; // debounce: one XP grant per calc per session

    calcBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        // Debounce: only grant XP once per calculator per session
        if (xpGranted[calcName]) return;
        xpGranted[calcName] = true;

        // Record observation
        Advisor.observe('calc_usage', calcName, 1);

        // Listen for actual XP amount (after multiplier)
        var toastShown = false;
        Advisor.on('xp', function onXP(data) {
          if (!toastShown && data.action === 'calculator_run') {
            toastShown = true;
            showXPToast('+' + data.amount + ' XP');
            // One-shot — remove after firing
            Advisor.off('xp', onXP);
          }
        });

        // Grant XP (multiplier applied inside)
        Advisor.grantXP('calculator_run', 5);

        // Visual feedback: brief gold flash on the orb
        var orb = document.querySelector('.orb-circle');
        if (orb) {
          orb.style.boxShadow = '0 0 30px 8px rgba(240, 192, 64, 0.8)';
          setTimeout(function () { orb.style.boxShadow = ''; }, 800);
        }
      });
    });
  }

  // ── XP Toast notification ─────────────────
  function showXPToast(text) {
    var existing = document.getElementById('xp-toast');
    if (existing) existing.remove();

    var toast = document.createElement('div');
    toast.id = 'xp-toast';
    toast.className = 'xp-toast';
    toast.textContent = text;
    document.body.appendChild(toast);

    // Animate in
    requestAnimationFrame(function () {
      toast.classList.add('visible');
    });

    // Remove after 2s
    setTimeout(function () {
      toast.classList.remove('visible');
      setTimeout(function () { toast.remove(); }, 400);
    }, 2000);
  }

  // ── Guide links by topic ────────────────
  var GUIDE_LINKS = {
    combat_prioritizer: { url: 'guides/kvk.html', text: 'KvK Guide' },
    builder: { url: 'guides/town-center.html', text: 'Town Center Guide' },
    optimizer: { url: 'guides/hero-guide.html', text: 'Hero Guide' },
    neglects_gear: { url: 'guides/hero-guide.html', text: 'Hero Guide' },
    daily_player: { url: 'guides/beginner.html', text: 'Beginner Guide' },
    aggressive_tactician: { url: 'guides/kvk.html', text: 'KvK Guide' },
  };

  // ── Observation-based advisor comments ────
  // After enough data, the advisor speaks through the orb speech bubble
  function checkForInsight() {
    if (!window.AdvisorOrb) return;
    var tags = Advisor.getTags();
    if (tags.length === 0) return;

    var state = Advisor.getState();
    if (!state) return;
    var visits = (state.observations.visit_pattern || {}).total || 0;
    if (visits < 3) return; // need enough data

    // Only show insight once per session
    var insightShown = false;
    try { insightShown = sessionStorage.getItem('ksp_insight_shown') === '1'; } catch (e) {}
    if (insightShown) return;

    var archetype = state.archetype || 'steward';
    var insight = pickInsight(tags, archetype);
    if (!insight) return;

    // Append guide link if relevant
    var guideLink = '';
    for (var t = 0; t < tags.length; t++) {
      if (GUIDE_LINKS[tags[t]]) {
        var g = GUIDE_LINKS[tags[t]];
        // Path prefix detection (must match layout.js):
        // Hero detail pages (/heroes/{slug}/) and kingdom detail pages (/kingdoms/{id}/)
        // are 2 levels deep and need ../../
        var p = location.pathname;
        var base;
        if ((/\/heroes\/[a-z]/.test(p) && !/\/heroes\.html/.test(p)) || /\/kingdoms\/\d/.test(p)) {
          base = '../../';
        } else if (/\/calculators\/|\/guides\/|\/games\/|\/alliance\/|\/kingdoms\//.test(p)) {
          base = '../';
        } else {
          base = '';
        }
        guideLink = ' <a href="' + base + g.url + '" style="color:var(--gold);font-weight:600;">Read the ' + g.text + ' \u2192</a>';
        break;
      }
    }

    // Show via speech bubble after a delay
    setTimeout(function () {
      if (window.AdvisorOrb && !window.AdvisorOrb.isEngaged()) {
        window.AdvisorOrb.showSpeechBubble(insight + guideLink);
        setTimeout(function () {
          window.AdvisorOrb.hideSpeechBubble();
        }, 10000);
      }
      try { sessionStorage.setItem('ksp_insight_shown', '1'); } catch (e) {}
    }, 5000);
  }

  // ── Insight picker ────────────────────────
  var INSIGHTS = {
    steward: {
      combat_prioritizer: [
        'Governor. You study your armies often — but never your walls. Either you trust them, or you\'ve forgotten they exist.',
        'Eleven troop calculations. Zero for buildings. Your soldiers fight well — but from crumbling towers.',
        'Your focus on combat is clear. Shall I review whether your infrastructure can sustain it?'
      ],
      builder: [
        'Your foundations grow strong. But walls alone don\'t win wars, Governor.',
        'The building calculator sees heavy use. Your kingdom\'s bones are solid. What about its teeth?',
        'Infrastructure is your instinct. That\'s rare and valuable.'
      ],
      optimizer: [
        'You study every edge — gear, charms, heroes. You leave nothing to chance.',
        'The details matter to you. That\'s why you\'re ahead of most who never check.',
        'Your optimization instinct is your advantage. Keep refining.'
      ],
      neglects_gear: [
        'I\'ve noticed something. Your heroes fight without proper equipment. The numbers suggest this costs you more than you realize.',
        'Every calculator except gear. Your heroes are strong — but fighting bare-handed.',
        'Governor. Have you checked your gear recently? The gear calculator exists for a reason.'
      ],
      daily_player: [
        'Your consistency is your weapon. Most governors check in once. You\'re here every day.',
        'Five days running. The compounding begins now.',
        'Daily discipline. That\'s what separates governors who grow from those who stall.'
      ],
      aggressive_tactician: [
        'You favor the aggressive play. Noted. My counsel will lean into that.',
        'Your War Table choices tell me something — you don\'t wait. You strike.',
        'Aggression is a strategy, not a flaw. Let\'s make sure your army supports it.'
      ]
    },
    sage: {
      combat_prioritizer: [
        'You ask about troops. Never about buildings. There\'s a pattern in what you avoid.',
        'I see where your attention goes. And where it doesn\'t. Both are revealing.',
        'The troop calculator is your most visited tool. Have you asked yourself why?'
      ],
      builder: [
        'You build first and fight second. A rare patience. The data supports your instinct.',
        'Infrastructure before combat. You think in years, not days.',
        'Your building focus suggests a long-term mind. I\'ll adapt my counsel accordingly.'
      ],
      optimizer: [
        'You seek every marginal gain. The pattern is clear in your calculator history.',
        'Optimization is not perfectionism. It\'s seeing what others overlook.',
        'You\'ve touched every detail calculator. You understand that edges compound.'
      ],
      neglects_gear: [
        'An absence in your history. No gear calculations. The data suggests this costs you quietly.',
        'I notice what you don\'t look at. Gear is the gap.',
        'Your heroes have power. But power without equipment is... less than it could be.'
      ],
      daily_player: [
        'Every day you return. The data compounds. So does my understanding of you.',
        'Consistency is the most undervalued strategy in this game. You already know that.',
        'Your pattern is daily. That tells me more than any single calculation.'
      ],
      aggressive_tactician: [
        'Your choices on the War Table lean aggressive. Interesting. The data will tell us if that serves you.',
        'You choose the offensive option. Repeatedly. This is not random — it\'s instinct.',
        'Aggression as default. I\'ll calibrate my analysis to match your nature.'
      ]
    },
    herald: {
      combat_prioritizer: [
        'You check troops constantly. Good. That\'s where the board moves fastest.',
        'Combat focus. Smart. The governors who track their army are the ones who use it.',
        'You\'re watching your troops. That means you\'re preparing for something.'
      ],
      builder: [
        'Building focus. Not glamorous, but the governors who build early dominate later.',
        'Infrastructure now. Power later. You\'re playing a longer game than most.',
        'While others rush combat, you\'re building the foundation that outlasts them.'
      ],
      optimizer: [
        'Every edge. Every detail. You\'re not here to participate — you\'re here to win.',
        'The optimization pattern is clear. You want the advantage and you\'re hunting for it.',
        'Detail-obsessed. That\'s not an insult — it\'s what the top governors do.'
      ],
      neglects_gear: [
        'Your heroes are fighting without proper gear. On the board, that shows.',
        'Gear is the difference between placing and winning. You haven\'t checked it once.',
        'Everyone ignores gear until it costs them a battle. Don\'t be everyone.'
      ],
      daily_player: [
        'Five days straight. The board is starting to notice you.',
        'Daily check-ins. That\'s what the top players do. You\'re already behaving like one.',
        'Consistency puts you ahead of ninety percent of governors. Keep showing up.'
      ],
      aggressive_tactician: [
        'You pick the aggressive option every time. On the board, that translates to wins.',
        'Aggressive. Direct. That\'s the kind of player who climbs rankings.',
        'Your instinct is to attack. Good. Defense doesn\'t win kingdoms.'
      ]
    }
  };

  function pickInsight(tags, archetype) {
    var bank = INSIGHTS[archetype] || INSIGHTS.steward;
    for (var i = 0; i < tags.length; i++) {
      var lines = bank[tags[i]];
      if (lines && lines.length) {
        return lines[Math.floor(Math.random() * lines.length)];
      }
    }
    return null;
  }

  // ── Run insight check after page settles ──
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      setTimeout(checkForInsight, 3000);
    });
  } else {
    setTimeout(checkForInsight, 3000);
  }

})();

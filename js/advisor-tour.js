/**
 * advisor-tour.js — Bot-scripted site tour for new users
 * KingshotPro
 *
 * Purpose: Ysabel walks the player through 7 stops showing KingshotPro's
 * unique features. Each stop is a real page — so each stop counts as a
 * fresh ad impression. The tour ends at the profile page with an
 * open-ended "look up another player" call that kicks off a browsing loop.
 *
 * Cost per tour: $0. All dialogue is pre-written (no API calls).
 * Personalization via variable substitution from localStorage profile.
 *
 * State lives in localStorage: ksp_tour_state
 *   { fid, step, startedAt, completed, skipped, completedAt }
 *
 * step values:
 *   0 or null  = not started
 *   1-7        = active, currently on that stop
 *   99         = finished or skipped, never show again
 *
 * The tour checks state on every page load via checkTour(). If the user
 * is on the correct URL for their current step, the speech bubble renders.
 * If not, we do nothing (future: show a "Resume tour" pill).
 *
 * Suppresses CTA / lore / insight bubbles while active so they don't
 * collide. Other advisor scripts check window.KSPTour.isActive() before firing.
 */
(function () {
  'use strict';

  var TOUR_KEY = 'ksp_tour_state';

  // ── Helpers: path + profile ────────────────
  function getBase() {
    var p = location.pathname;
    // Hero + kingdom detail pages are 2 levels deep
    if ((/\/heroes\/[a-z]/.test(p) && !/\/heroes\.html/.test(p)) || /\/kingdoms\/\d/.test(p)) return '../../';
    return /\/calculators\/|\/games\/|\/guides\/|\/alliance\/|\/kingdoms\//.test(p) ? '../' : '';
  }

  function getProfile() {
    try {
      var lastFid = localStorage.getItem('ksp_last_fid');
      if (lastFid) {
        var raw = localStorage.getItem('ksp_profile_' + lastFid);
        if (raw) return JSON.parse(raw);
      }
      var session = sessionStorage.getItem('ksp_profile');
      return session ? JSON.parse(session) : null;
    } catch (e) { return null; }
  }

  // ── Data: directory lookup for user's kingdom ──
  function hasUserKingdomData(kid, onReady) {
    if (!kid) { onReady(false); return; }
    fetch(getBase() + 'kingdoms/directory_data.json', { cache: 'no-store' })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        var has = data && data.kingdoms && data.kingdoms.some(function (k) {
          return String(k.id) === String(kid) && k.topPower != null;
        });
        onReady(has);
      })
      .catch(function () { onReady(false); });
  }

  // ── Stop definitions ───────────────────────
  // Each stop: which URL it lives on, the scripted dialogue, and how to
  // navigate to the next stop. Speech can be a function or string.
  var TOUR_STOPS = [
    {
      step: 1,
      title: 'Your Kingdom',
      urlPattern: /\/kingdoms\/\d+\/?(index\.html)?$/,
      buildUrl: function (profile, hasOwnData) {
        var kid = profile && profile.kid;
        if (hasOwnData && kid) return getBase() + 'kingdoms/' + kid + '/';
        return getBase() + 'kingdoms/223/';
      },
      speech: function (profile, hasOwnData) {
        var name = (profile && profile.nickname) ? ', ' + escapeHtml(profile.nickname) : '';
        if (hasOwnData) {
          return "Your kingdom" + name + ". Every alliance ranked by power. Every leaderboard I can reach. " +
            "<strong>I watch your kingdom while you sleep</strong> — every shift, every climb. " +
            "No other tool does this. This is why you came.";
        } else {
          return "This is Kingdom 223 — a sample of what I track. Every alliance, every power value, " +
            "every ranking. <strong>Your kingdom is next in the rollout.</strong> No other tool does this.";
        }
      },
      nextText: 'Next: KvK Scoring \u2192'
    },
    {
      step: 2,
      title: 'KvK Scoring',
      urlPattern: /\/calculators\/kvk\.html/,
      buildUrl: function () { return getBase() + 'calculators/kvk.html'; },
      speech: function (profile) {
        return "KvK is where kingdoms break. Most players don't know how far behind they are until the battle day. " +
          "This calculator scores every preparation point across all 5 days. " +
          "<strong>Fill in what you've done. See your gap. See what you can still earn.</strong>";
      },
      nextText: 'Next: Troop Formations \u2192'
    },
    {
      step: 3,
      title: 'PvP Meta',
      urlPattern: /\/meta\.html/,
      buildUrl: function () { return getBase() + 'meta.html'; },
      speech: function (profile) {
        return "When you rally, the troop ratio matters more than the tier. " +
          "<strong>50:20:30</strong> standard. <strong>60:20:20</strong> garrison. <strong>10:10:80</strong> bear hunt. " +
          "Verified from four sources. Learn the formations and your power doubles in practice.";
      },
      nextText: 'Next: Heroes \u2192'
    },
    {
      step: 4,
      title: 'Hero Database',
      urlPattern: /\/heroes\.html$/,
      buildUrl: function () { return getBase() + 'heroes.html'; },
      speech: function (profile) {
        var tail = '';
        if (profile && profile.spendingTier === 'f2p') {
          tail = " For you, free-to-play, <strong>Yang is the endgame carry</strong>. Start saving shards from Gen 5 onward.";
        } else if (profile && profile.spendingTier === 'whale') {
          tail = " At your spend level, <strong>Amadeus + Vivian + Thrud</strong> form the strongest rally core in the game.";
        } else if (profile && (profile.spendingTier === 'low' || profile.spendingTier === 'mid')) {
          tail = " For selective spenders, <strong>Petra</strong> is the cavalry rally lead worth chasing through Hero Roulette.";
        }
        return "27 heroes. Cross-verified from four sources. Filter by role, generation, F2P viability. " +
          "Compare any two side-by-side. Build a 3-hero team and see its synergy." + tail;
      },
      nextText: 'Next: Event Calendar \u2192'
    },
    {
      step: 5,
      title: 'Event Calendar',
      urlPattern: /\/calendar\.html/,
      buildUrl: function () { return getBase() + 'calendar.html'; },
      speech: function (profile) {
        return "The schedule. Bear Hunt every 2 days. KvK monthly. " +
          "<strong>Turn on browser notifications</strong> and I'll remind you before each one. " +
          "Export to your phone's calendar so you never miss Hall of Governors — that's where your biggest weekly gains come from.";
      },
      nextText: 'Next: Your Profile \u2192'
    },
    {
      step: 6,
      title: 'Your Profile',
      urlPattern: /\/profile\.html/,
      buildUrl: function (profile) {
        var fid = profile && profile.fid;
        return getBase() + 'profile.html' + (fid ? '?fid=' + fid : '');
      },
      speech: function (profile) {
        var name = (profile && profile.nickname) || 'Governor';
        return "This is what I see when I look at you, <strong>" + escapeHtml(name) + "</strong>. " +
          "Your game stage. Your spending pattern. Your server age. Your recommended lineup. " +
          "Share this with your alliance. Look up a rival to know what you're up against.";
      },
      nextText: 'Finish Tour \u2192'
    },
    {
      step: 7,
      title: 'Complete',
      urlPattern: /\/profile\.html/,
      buildUrl: function () { return getBase() + 'profile.html'; },
      speech: function (profile) {
        return "We're done with the tour. But the site doesn't end here. " +
          "Try looking up another player — a rival, an ally, anyone. " +
          "Every Player ID has a profile. Every kingdom has rankings. " +
          "<strong>Come back every day. I'll be here.</strong>";
      },
      nextText: null,
      isFinal: true
    }
  ];

  // ── State management ───────────────────────
  function getState() {
    try {
      var raw = localStorage.getItem(TOUR_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) { return null; }
  }

  function saveState(state) {
    try { localStorage.setItem(TOUR_KEY, JSON.stringify(state)); } catch (e) {}
  }

  function startTour() {
    var profile = getProfile();
    if (!profile || !profile.fid) return;

    var state = {
      fid: profile.fid,
      step: 1,
      startedAt: new Date().toISOString(),
      skipped: false,
      completed: false
    };
    saveState(state);

    // Navigate to first stop. Check for user's kingdom data first.
    hasUserKingdomData(profile.kid, function (hasData) {
      var firstStop = TOUR_STOPS[0];
      window.location.href = firstStop.buildUrl(profile, hasData);
    });
  }

  function skipTour() {
    var state = getState() || {};
    state.skipped = true;
    state.step = 99;
    saveState(state);
    hideBubble();
  }

  function completeTour() {
    var state = getState() || {};
    state.completed = true;
    state.step = 99;
    state.completedAt = new Date().toISOString();
    saveState(state);

    // Award XP via the advisor system
    if (window.Advisor && window.Advisor.grantXP) {
      try { window.Advisor.grantXP('tour_complete', 75); } catch (e) {}
    }
    hideBubble();
  }

  function advanceTour() {
    var state = getState();
    if (!state) return;
    state.step++;

    if (state.step > TOUR_STOPS.length) {
      completeTour();
      return;
    }

    saveState(state);
    var profile = getProfile();
    var nextStop = TOUR_STOPS[state.step - 1];

    // Step 1 needs the kingdom-data check; all other stops are static URLs
    if (state.step === 1) {
      hasUserKingdomData(profile && profile.kid, function (hasData) {
        window.location.href = nextStop.buildUrl(profile, hasData);
      });
    } else {
      window.location.href = nextStop.buildUrl(profile);
    }
  }

  // ── Bubble rendering ───────────────────────
  function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function renderTourBubble(stop, profile, hasOwnData) {
    if (!window.AdvisorOrb || !window.AdvisorOrb.showSpeechBubble) return;

    var speechText = typeof stop.speech === 'function'
      ? stop.speech(profile, hasOwnData)
      : stop.speech;

    var state = getState();
    var stepLabel = '<div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Tour step ' + state.step + ' of ' + TOUR_STOPS.length + '</div>';

    var buttonRow = '<div style="margin-top:14px;display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap;">';
    if (stop.isFinal) {
      buttonRow += '<button onclick="window.KSPTour.complete()" style="background:var(--gold);color:var(--bg);border:none;padding:8px 18px;border-radius:6px;font-weight:700;cursor:pointer;font-family:inherit;">Complete tour (+75 XP)</button>';
    } else {
      buttonRow += '<button onclick="window.KSPTour.skip()" style="background:transparent;color:var(--text-muted);border:1px solid var(--border);padding:8px 12px;border-radius:6px;cursor:pointer;font-family:inherit;">Skip</button>';
      buttonRow += '<button onclick="window.KSPTour.advance()" style="background:var(--gold);color:var(--bg);border:none;padding:8px 16px;border-radius:6px;font-weight:700;cursor:pointer;font-family:inherit;">' + (stop.nextText || 'Next \u2192') + '</button>';
    }
    buttonRow += '</div>';

    var html = stepLabel + speechText + buttonRow;
    window.AdvisorOrb.showSpeechBubble(html);
  }

  function hideBubble() {
    if (window.AdvisorOrb && window.AdvisorOrb.hideSpeechBubble) {
      window.AdvisorOrb.hideSpeechBubble();
    }
  }

  // ── URL match check ────────────────────────
  function matchesStop(stop) {
    return stop.urlPattern.test(window.location.pathname);
  }

  // ── Page load check ────────────────────────
  function checkTour() {
    var state = getState();
    if (!state || state.completed || state.skipped) return;
    if (state.step < 1 || state.step > TOUR_STOPS.length) return;

    var stop = TOUR_STOPS[state.step - 1];
    if (!matchesStop(stop)) {
      // User is not on the expected tour stop URL.
      // v2 could show a "Resume tour" pill here. For now: silent.
      return;
    }

    var profile = getProfile();
    if (!profile) return; // tour requires FID

    // Wait for orb to be rendered, then for page to settle
    var delay = 2500;
    setTimeout(function () {
      if (state.step === 1) {
        hasUserKingdomData(profile.kid, function (hasData) {
          renderTourBubble(stop, profile, hasData);
        });
      } else {
        renderTourBubble(stop, profile, false);
      }
    }, delay);
  }

  // ── Public API ─────────────────────────────
  window.KSPTour = {
    start: startTour,
    skip: skipTour,
    advance: advanceTour,
    complete: completeTour,
    isActive: function () {
      var state = getState();
      return !!(state && !state.completed && !state.skipped &&
                state.step >= 1 && state.step <= TOUR_STOPS.length);
    },
    hasRun: function () {
      // Has this user ever started, completed, or skipped a tour?
      var state = getState();
      return !!(state && state.step != null);
    },
    getState: getState,
    reset: function () {
      try { localStorage.removeItem(TOUR_KEY); } catch (e) {}
    }
  };

  // ── Init on page load ──────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkTour);
  } else {
    checkTour();
  }
})();

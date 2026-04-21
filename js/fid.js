/**
 * fid.js — Player FID lookup and profile management
 * KingshotPro | Phase 1
 *
 * Calls the Century Games player API, derives player profile,
 * stores in localStorage (keyed by FID) with sessionStorage fallback.
 */

// All API calls go through the Cloudflare Worker proxy at api.kingshotpro.com.
// Direct centurygame.com calls are intentionally avoided — proxy keeps user IPs
// away from Century Games' origin and centralises any future signing logic.
// See worker/worker.js + worker/wrangler.toml for deployment.
const FID_API        = 'https://kingshotpro-api.kingshotpro.workers.dev/player';
const PROFILE_KEY    = 'ksp_profile';       // sessionStorage fallback key
const LAST_FID_KEY   = 'ksp_last_fid';      // localStorage — last looked-up FID

// ─────────────────────────────────────────
// API CALL
// ─────────────────────────────────────────

async function fetchPlayerProfile(fid) {
  const res = await fetch(FID_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fid: String(fid).trim(), cdkey: '' }),
    // NOTE: If CORS blocks this, a Netlify proxy function at
    // /api/fid-lookup will be added in Phase 1.1
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API returned ${res.status}: ${text.slice(0, 120)}`);
  }

  const data = await res.json();

  // Century Games API returns { code, data: { ... } } or similar
  // Normalise: if the payload is wrapped, unwrap it
  if (data && data.data) return data.data;
  if (data && data.nickname !== undefined) return data;
  throw new Error('Unexpected API response shape');
}

// ─────────────────────────────────────────
// PROFILE CLASSIFICATION
// ─────────────────────────────────────────

function classifyProfile(raw) {
  // Century Games API returns the field as 'stove_lv' (internal code name).
  // The game's in-game UI calls this the Town Center. Verified April 14, 2026.
  const townCenterLevel = Number(raw.stove_lv) || 0;
  const kid             = Number(raw.kid)      || 0;
  const payAmt          = Number(raw.pay_amt)  || 0; // lifetime spend in cents
  const dollars         = payAmt / 100;

  // Spending tier — display labels from NAMING_RESEARCH_FINDINGS.md
  // IMPORTANT: if a TC-based fallback label system is ever added,
  // do NOT use "Veteran" for any TC band — it collides with the mid-tier label here.
  // Use "Campaigner" for Town Center 15–21 in any fallback system.
  let spendingTier, spendingLabel;
  if (dollars === 0) {
    spendingTier  = 'f2p';
    spendingLabel = 'Free Commander';
  } else if (dollars < 100) {
    spendingTier  = 'low';
    spendingLabel = 'Tactician';
  } else if (dollars < 500) {
    spendingTier  = 'mid';
    spendingLabel = 'Veteran';
  } else {
    spendingTier  = 'whale';
    spendingLabel = 'Warlord';
  }

  // Game stage
  let gameStage, stageLabel;
  if (townCenterLevel < 15) {
    gameStage  = 'early';
    stageLabel = 'Early Game';
  } else if (townCenterLevel <= 21) {
    gameStage  = 'mid';
    stageLabel = 'Mid Game';
  } else {
    gameStage  = 'late';
    stageLabel = 'Late Game';
  }

  // Server age (kingdom ID as proxy — lower ID = older server)
  let serverAge, serverAgeLabel;
  if (kid < 500) {
    serverAge      = 'mature';
    serverAgeLabel = 'Mature (180+ days)';
  } else if (kid <= 1000) {
    serverAge      = 'mid';
    serverAgeLabel = 'Established (90–180 days)';
  } else {
    serverAge      = 'new';
    serverAgeLabel = 'New (<90 days)';
  }

  return {
    fid:          raw.fid || raw.uid || '',
    nickname:     raw.nickname || 'Unknown',
    townCenterLevel,
    // Legacy field for backward compat with existing localStorage profiles
    // Old field name was 'furnaceLevel' before April 14, 2026 rename
    furnaceLevel: townCenterLevel,
    kid,
    dollars,
    spendingTier,
    spendingLabel,
    gameStage,
    stageLabel,
    serverAge,
    serverAgeLabel,
  };
}

// ─────────────────────────────────────────
// PROFILE STORAGE (localStorage primary, sessionStorage fallback)
// ─────────────────────────────────────────

function saveProfile(profile) {
  var json = JSON.stringify(profile);
  var fid  = profile.fid || 'unknown';

  // Primary: localStorage keyed by FID (persists across sessions)
  try {
    localStorage.setItem('ksp_profile_' + fid, json);
    localStorage.setItem(LAST_FID_KEY, fid);
  } catch (e) { /* private mode or quota — fall through */ }

  // Fallback: sessionStorage with generic key (backward compat)
  try {
    sessionStorage.setItem(PROFILE_KEY, json);
  } catch (e) { /* ignore */ }
}

// Backfill townCenterLevel on profiles saved before the April 14 rename.
// Old profiles only have furnaceLevel; new profiles have both.
function migrateProfile(profile) {
  if (!profile) return profile;
  if (profile.townCenterLevel == null && profile.furnaceLevel != null) {
    profile.townCenterLevel = profile.furnaceLevel;
  }
  if (profile.furnaceLevel == null && profile.townCenterLevel != null) {
    profile.furnaceLevel = profile.townCenterLevel; // keep legacy readers working
  }
  return profile;
}

function loadProfile() {
  // 1. Try localStorage with last known FID
  try {
    var lastFid = localStorage.getItem(LAST_FID_KEY);
    if (lastFid) {
      var stored = localStorage.getItem('ksp_profile_' + lastFid);
      if (stored) return migrateProfile(JSON.parse(stored));
    }
  } catch (e) { /* fall through */ }

  // 2. Fallback: sessionStorage (backward compat / private browsing)
  try {
    var raw = sessionStorage.getItem(PROFILE_KEY);
    return raw ? migrateProfile(JSON.parse(raw)) : null;
  } catch (e) { return null; }
}

function loadProfileByFid(fid) {
  try {
    var stored = localStorage.getItem('ksp_profile_' + fid);
    return stored ? migrateProfile(JSON.parse(stored)) : null;
  } catch (e) { return null; }
}

function getLastFid() {
  try { return localStorage.getItem(LAST_FID_KEY) || ''; }
  catch (e) { return ''; }
}

function clearProfile() {
  try { sessionStorage.removeItem(PROFILE_KEY); } catch (e) {}
}

/**
 * signOut — "Forget me on this device."
 *
 * Wipes every ksp_* key in localStorage and sessionStorage EXCEPT:
 *   - ksp_cookie_consent  (legal — user already chose)
 *   - ksp_sb_collapsed    (pure UI preference, not identity)
 *
 * This deletes: Player ID, profile, tier, avatar, advisor state, XP,
 * tour progress, alliance, CTA counters, calendar events, roster,
 * streaks — everything tied to the account identity. Device
 * preferences that aren't personal (sidebar collapse state, cookie
 * consent) stay so the UI doesn't re-trigger its welcome flows.
 *
 * After this runs, reloading the page looks like a first-time visit.
 */
function signOut(opts) {
  opts = opts || {};
  var KEEP = { 'ksp_cookie_consent': 1, 'ksp_sb_collapsed': 1 };

  try {
    var toRemove = [];
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (k && k.indexOf('ksp_') === 0 && !KEEP[k]) toRemove.push(k);
    }
    for (var j = 0; j < toRemove.length; j++) localStorage.removeItem(toRemove[j]);
  } catch (e) { /* private mode or storage disabled */ }

  try {
    var sRemove = [];
    for (var m = 0; m < sessionStorage.length; m++) {
      var sk = sessionStorage.key(m);
      if (sk && sk.indexOf('ksp_') === 0) sRemove.push(sk);
    }
    for (var n = 0; n < sRemove.length; n++) sessionStorage.removeItem(sRemove[n]);
  } catch (e) { /* ignore */ }

  if (opts.redirect !== false) {
    // Send to homepage — the Player ID lookup form lives there.
    var base = (window.KSP_BASE || '');
    window.location.href = base + 'index.html';
  }
}

// Export for other pages
window.KSP = window.KSP || {};
window.KSP.loadProfile    = loadProfile;
window.KSP.loadProfileByFid = loadProfileByFid;
window.KSP.getLastFid     = getLastFid;
window.KSP.signOut        = signOut;

// ─────────────────────────────────────────
// PROFILE CARD RENDERER
// ─────────────────────────────────────────

function renderProfileCard(profile) {
  const card = document.getElementById('profile-card');
  if (!card) return;

  card.innerHTML = `
    <div class="profile-header">
      <div class="profile-avatar">${profile.nickname.charAt(0).toUpperCase()}</div>
      <div>
        <div class="profile-name">${escHtml(profile.nickname)}</div>
        <div class="profile-sub">Kingdom ${profile.kid} · ${profile.serverAgeLabel}</div>
      </div>
    </div>
    <div class="profile-stats">
      <div class="profile-stat">
        <div class="profile-stat-value">${profile.townCenterLevel || profile.furnaceLevel || 0}</div>
        <div class="profile-stat-label">Town Center</div>
      </div>
      <div class="profile-stat">
        <div class="profile-stat-value">${profile.stageLabel}</div>
        <div class="profile-stat-label">Stage</div>
      </div>
      <div class="profile-stat">
        <div class="profile-stat-value">${profile.spendingLabel}</div>
        <div class="profile-stat-label">Tier</div>
      </div>
    </div>
    <div style="text-align:center;margin-top:12px;">
      <a href="profile.html?fid=${escHtml(profile.fid)}" style="color:var(--gold);font-size:13px;font-weight:600;">View Full Profile &rarr;</a>
    </div>
  `;

  card.classList.add('visible');
}

// ─────────────────────────────────────────
// TOUR START PROMPT
// ─────────────────────────────────────────
// First-time users see an invitation to take the site tour after their
// first successful FID lookup. One-shot — if they decline or skip, the
// prompt never appears again. Delivered via the advisor orb speech bubble.

function promptTourStart(profile) {
  if (!window.AdvisorOrb || !window.AdvisorOrb.showSpeechBubble) return;
  if (!window.KSPTour) return;

  const name = profile && profile.nickname ? escHtml(profile.nickname) : 'Governor';
  const html =
    '<div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Welcome</div>' +
    'Welcome, <strong>' + name + '</strong>. I can show you what this site actually does. ' +
    '<strong>Two minutes, seven stops.</strong> You\'ll see things no other tool can show you — ' +
    'your kingdom, your KvK math, your rally compositions, and more.' +
    '<div style="margin-top:14px;display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap;">' +
    '<button onclick="window.KSPTour.skip()" ' +
    'style="background:transparent;color:var(--text-muted);border:1px solid var(--border);padding:8px 14px;border-radius:6px;cursor:pointer;font-family:inherit;">' +
    'Maybe later</button>' +
    '<button onclick="window.KSPTour.start()" ' +
    'style="background:var(--gold);color:var(--bg);border:none;padding:8px 18px;border-radius:6px;font-weight:700;cursor:pointer;font-family:inherit;">' +
    'Take the tour \u2192</button>' +
    '</div>';

  window.AdvisorOrb.showSpeechBubble(html);
}

// ─────────────────────────────────────────
// ERROR / STATUS HELPERS
// ─────────────────────────────────────────

function showFidError(msg) {
  const el = document.getElementById('fid-error');
  if (!el) return;
  el.textContent = msg;
  el.classList.remove('hidden');
}

function hideFidError() {
  const el = document.getElementById('fid-error');
  if (el) el.classList.add('hidden');
}

function setSubmitState(btn, loading) {
  btn.disabled = loading;
  btn.textContent = loading ? 'Looking up…' : 'Look up';
}

// ─────────────────────────────────────────
// FORM HANDLER
// ─────────────────────────────────────────

async function handleFidSubmit(e) {
  e.preventDefault();
  hideFidError();

  const input = document.getElementById('fid-input');
  const btn   = document.getElementById('fid-btn');
  const fid   = (input?.value || '').trim();

  if (!fid || !/^\d{5,12}$/.test(fid)) {
    showFidError('Please enter a valid Player ID (numbers only, 5–12 digits).');
    return;
  }

  setSubmitState(btn, true);

  // ── Admin bypass: magic Player ID unlocks everything ──
  // Skips the API call entirely, creates a synthetic elite-tier profile.
  if (fid === '99999') {
    const profile = {
      fid: '99999',
      nickname: 'Architect',
      townCenterLevel: 30,
      furnaceLevel: 30,
      kid: 1908,
      dollars: 9999,
      spendingTier: 'whale',
      spendingLabel: 'Warlord',
      gameStage: 'late',
      stageLabel: 'Late Game',
      serverAge: 'mature',
      serverAgeLabel: 'Mature (180+ days)',
    };
    saveProfile(profile);
    renderProfileCard(profile);
    // Set elite tier for all premium features
    try {
      localStorage.setItem('ksp_tier', 'elite');
      localStorage.setItem('ksp_last_fid', '99999');
    } catch (e) {}
    if (window.AccountSwitcher && window.AccountSwitcher.addAccount) {
      window.AccountSwitcher.addAccount('99999', 'Architect');
    }
    if (window.Advisor) {
      if (!window.Advisor.load('99999')) {
        window.Advisor.create('99999', 'steward', 'Ysabel');
      }
      window.Advisor.processDailyVisit();
      window.Advisor.grantXP('admin_login', 100);
    }
    if (window.KSP?.renderAdvisory) window.KSP.renderAdvisory(profile);
    setSubmitState(btn, false);
    document.getElementById('profile-card')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    return;
  }

  try {
    const raw     = await fetchPlayerProfile(fid);
    const profile = classifyProfile({ ...raw, fid });
    saveProfile(profile);
    renderProfileCard(profile);

    // Auto-add to multi-account switcher
    if (window.AccountSwitcher && window.AccountSwitcher.addAccount) {
      window.AccountSwitcher.addAccount(fid, profile.nickname);
    }

    // Advisor system: load existing, or auto-assign the single available advisor.
    //
    // Archetype selection is temporarily bypassed — we only ship one advisor
    // right now and forcing a choice between one option is dead flow. When
    // additional advisors ship, restore the selection call by replacing the
    // Advisor.create() line with `window.KSP.showAdvisorSelection(profile)`.
    // The selection overlay code in advisor-select.js is left intact for that.
    const DEFAULT_ADVISOR_ARCHETYPE = 'sage';
    if (window.Advisor) {
      const hasAdvisor = window.Advisor.load(fid);
      if (hasAdvisor) {
        // Returning player — process visit + grant lookup XP
        window.Advisor.processDailyVisit();
        window.Advisor.grantXP('fid_lookup', 25);
      } else {
        // New player — silently assign the default advisor. The orb appears
        // on screen and greets the player via the normal advisory-hooks flow.
        window.Advisor.create(DEFAULT_ADVISOR_ARCHETYPE);
        window.Advisor.grantXP('fid_lookup', 25);
      }
    }

    // Trigger advisory display
    if (window.KSP?.renderAdvisory) {
      window.KSP.renderAdvisory(profile);
    }

    // Tour prompt: first-time users get offered a guided walkthrough.
    // Only shown once per browser — if they skip or complete, never again.
    // Delay lets the advisor orb settle first.
    setTimeout(function () {
      if (window.KSPTour && !window.KSPTour.hasRun() && !window.KSPTour.isActive()) {
        promptTourStart(profile);
      }
    }, 3000);

    // Scroll to profile
    document.getElementById('profile-card')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  } catch (err) {
    console.error('FID lookup error:', err);

    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      // CORS or network error
      showFidError(
        'Unable to reach the game server from your browser. ' +
        'This may be a network restriction — try on a different connection, ' +
        'or enter your stats manually below.'
      );
      showManualEntry();
    } else if (err.message.includes('404') || err.message.includes('not found')) {
      showFidError('Player ID not found. Double-check your ID in-game: avatar → Settings → Player Info.');
    } else {
      showFidError('Lookup failed. Please check your Player ID and try again.');
    }
  } finally {
    setSubmitState(btn, false);
  }
}

// ─────────────────────────────────────────
// MANUAL FALLBACK (if CORS blocks API)
// ─────────────────────────────────────────

function showManualEntry() {
  const manual = document.getElementById('manual-entry');
  if (manual) manual.classList.remove('hidden');
}

function handleManualSubmit(e) {
  e.preventDefault();

  // Try the new input ID first, fall back to legacy ID for browsers with cached HTML
  const tcInput = document.getElementById('manual-tc') || document.getElementById('manual-furnace');
  const townCenterLevel = Number(tcInput?.value) || 0;
  const spendingTier  = document.getElementById('manual-spend')?.value || 'f2p';
  const kid           = Number(document.getElementById('manual-kid')?.value) || 999;
  const nickname      = (document.getElementById('manual-name')?.value || 'Player').trim();

  // Build a synthetic profile
  const spendingLabels = { f2p: 'Free Commander', low: 'Tactician', mid: 'Veteran', whale: 'Warlord' };
  let gameStage, stageLabel;
  if (townCenterLevel < 15)       { gameStage = 'early'; stageLabel = 'Early Game'; }
  else if (townCenterLevel <= 21) { gameStage = 'mid';   stageLabel = 'Mid Game'; }
  else                            { gameStage = 'late';  stageLabel = 'Late Game'; }

  let serverAge, serverAgeLabel;
  if (kid < 500)       { serverAge = 'mature'; serverAgeLabel = 'Mature (180+ days)'; }
  else if (kid <= 1000){ serverAge = 'mid';    serverAgeLabel = 'Established (90–180 days)'; }
  else                 { serverAge = 'new';    serverAgeLabel = 'New (<90 days)'; }

  const profile = {
    fid: 'manual', nickname, townCenterLevel,
    // Legacy field for backward compat
    furnaceLevel: townCenterLevel,
    kid, dollars: 0,
    spendingTier, spendingLabel: spendingLabels[spendingTier] || spendingTier,
    gameStage, stageLabel, serverAge, serverAgeLabel,
  };

  saveProfile(profile);
  renderProfileCard(profile);

  if (window.KSP?.renderAdvisory) {
    window.KSP.renderAdvisory(profile);
  }

  document.getElementById('profile-card')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ─────────────────────────────────────────
// INIT
// ─────────────────────────────────────────

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

document.addEventListener('DOMContentLoaded', () => {
  // Wire main FID form
  const form = document.getElementById('fid-form');
  if (form) form.addEventListener('submit', handleFidSubmit);

  // Wire manual entry form
  const manualForm = document.getElementById('manual-form');
  if (manualForm) manualForm.addEventListener('submit', handleManualSubmit);

  // Wire FID help tooltip
  const helpBtn = document.getElementById('fid-help-btn');
  const helpTip = document.getElementById('fid-help-tooltip');
  if (helpBtn && helpTip) {
    helpBtn.addEventListener('click', function () {
      helpTip.classList.toggle('hidden');
    });
  }

  // Auto-fill FID input for returning players
  const lastFid = getLastFid();
  const input   = document.getElementById('fid-input');
  if (lastFid && input && !input.value) {
    input.value = lastFid;
  }

  // Restore profile from localStorage (persists across sessions now)
  const saved = loadProfile();
  if (saved) {
    renderProfileCard(saved);
    if (window.KSP?.renderAdvisory) {
      window.KSP.renderAdvisory(saved);
    }
  }
});

/**
 * fid.js — Player FID lookup and profile management
 * KingshotPro | Phase 1
 *
 * Calls the Century Games player API, derives player profile,
 * stores in sessionStorage, triggers advisory display.
 */

// All API calls go through the Cloudflare Worker proxy at api.kingshotpro.com.
// Direct centurygame.com calls are intentionally avoided — proxy keeps user IPs
// away from Century Games' origin and centralises any future signing logic.
// See worker/worker.js + worker/wrangler.toml for deployment.
const FID_API    = 'https://api.kingshotpro.com/player';
const PROFILE_KEY = 'ksp_profile';

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
  const furnaceLevel = Number(raw.stove_lv) || 0;
  const kid          = Number(raw.kid)      || 0;
  const payAmt       = Number(raw.pay_amt)  || 0; // lifetime spend in cents
  const dollars      = payAmt / 100;

  // Spending tier — display labels from NAMING_RESEARCH_FINDINGS.md
  // IMPORTANT: if a furnace-based fallback label system is ever added,
  // do NOT use "Veteran" for any furnace band — it collides with the mid-tier label here.
  // Use "Campaigner" for furnace 15–21 in any fallback system.
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
  if (furnaceLevel < 15) {
    gameStage  = 'early';
    stageLabel = 'Early Game';
  } else if (furnaceLevel <= 21) {
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
    furnaceLevel,
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
// SESSION STORAGE
// ─────────────────────────────────────────

function saveProfile(profile) {
  try {
    sessionStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch (e) { /* private mode — ignore */ }
}

function loadProfile() {
  try {
    const raw = sessionStorage.getItem(PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}

function clearProfile() {
  try { sessionStorage.removeItem(PROFILE_KEY); } catch (e) {}
}

// Export for other pages
window.KSP = window.KSP || {};
window.KSP.loadProfile = loadProfile;

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
        <div class="profile-stat-value">${profile.furnaceLevel}</div>
        <div class="profile-stat-label">Furnace</div>
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
  `;

  card.classList.add('visible');
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
    showFidError('Please enter a valid FID (numbers only, 5–12 digits).');
    return;
  }

  setSubmitState(btn, true);

  try {
    const raw     = await fetchPlayerProfile(fid);
    const profile = classifyProfile({ ...raw, fid });
    saveProfile(profile);
    renderProfileCard(profile);

    // Trigger advisory display
    if (window.KSP?.renderAdvisory) {
      window.KSP.renderAdvisory(profile);
    }

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
      showFidError('FID not found. Double-check your player ID in-game (Settings → Player Info).');
    } else {
      showFidError('Lookup failed. Please check your FID and try again.');
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

  const furnaceLevel  = Number(document.getElementById('manual-furnace')?.value) || 0;
  const spendingTier  = document.getElementById('manual-spend')?.value || 'f2p';
  const kid           = Number(document.getElementById('manual-kid')?.value) || 999;
  const nickname      = (document.getElementById('manual-name')?.value || 'Player').trim();

  // Build a synthetic profile
  const spendingLabels = { f2p: 'Free Commander', low: 'Tactician', mid: 'Veteran', whale: 'Warlord' };
  let gameStage, stageLabel;
  if (furnaceLevel < 15)       { gameStage = 'early'; stageLabel = 'Early Game'; }
  else if (furnaceLevel <= 21) { gameStage = 'mid';   stageLabel = 'Mid Game'; }
  else                         { gameStage = 'late';  stageLabel = 'Late Game'; }

  let serverAge, serverAgeLabel;
  if (kid < 500)       { serverAge = 'mature'; serverAgeLabel = 'Mature (180+ days)'; }
  else if (kid <= 1000){ serverAge = 'mid';    serverAgeLabel = 'Established (90–180 days)'; }
  else                 { serverAge = 'new';    serverAgeLabel = 'New (<90 days)'; }

  const profile = {
    fid: 'manual', nickname, furnaceLevel, kid, dollars: 0,
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

  // Restore profile if page was reloaded
  const saved = loadProfile();
  if (saved) {
    renderProfileCard(saved);
    if (window.KSP?.renderAdvisory) {
      window.KSP.renderAdvisory(saved);
    }
  }
});

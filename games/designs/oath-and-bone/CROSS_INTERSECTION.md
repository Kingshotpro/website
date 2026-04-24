# Oath and Bone — CROSS_INTERSECTION.md

*Plug-points wiring Oath and Bone into KingshotPro's advisor, credit, and advisor-chat architecture. Every file:line reference in this file was opened and re-read during writing per Principle XXII — no cited line was taken from memory or from another document.*

*Written 2026-04-21, continuing Session 45. Supersedes the inline Cross-Intersection summary in DESIGN.md §8 and the per-file listings in BUILD_PLAN.md §0.2.3.*

---

## 0. Reading order

- `FRAME_UPDATE.md` first — monetization section of DESIGN.md is obsolete; the frame update governs.
- `SUCCESSION_V2.md` §4 — unresolved questions list that **this file resolves** (advisor-chat observation read verified; credit endpoint absence verified).
- `DESIGN.md` §8 — high-level wiring intent.
- `MUSTER_DESIGN.md` §5 — the pattern Oath and Bone matches.
- This file — file:line plug-points verified against primary sources.

---

## 1. What this file is

KingshotPro already has the advisor observation/XP infrastructure, the credit-spend client, the daily-gate pattern, and the per-game integration template. Oath and Bone must plug into these exactly, not invent parallel plumbing.

This file is the contract between:
- the design (DESIGN/MAGIC/HEROES/BATTLES/ECONOMY)
- the existing code (`js/advisor.js`, `js/credits.js`, `js/game-vault-trial.js`, `js/game-war-table.js`, `js/advisor-chat.js`, `worker/worker.js`)
- the code to be written (`js/game-oath-and-bone.js`, `js/game-oath-and-bone-engine.js`, additions to `worker/worker.js`)

Every integration point has a verified file:line. Every claim about what exists today is backed by a primary-source read.

---

## 2. Verified: advisor.js — XP + observations (fully working surface)

**File:** `/Users/defimagic/Desktop/Hive/KingshotPro/js/advisor.js` (501 lines, re-read in full 2026-04-21)

### 2.1 Verified methods and their line numbers

| Call | Method | Line | Signature | Behavior |
|---|---|---|---|---|
| `Advisor.getMultiplier()` | `getMultiplier` | **237** | `() → number` | Reads `ksp_profile_<fid>` from localStorage · Town Center Lv ≥ 22 → 1.25 · Lv ≥ 15 → 1.10 · whale +× 1.15 stacks · default 1.0 |
| `Advisor.grantXP(action, amount)` | `grantXP` | **259** | `(string, number) → void` | Applies multiplier at line 263 · pushes xp_log · saves state · emits `'xp'` at 278 · emits `'levelup'` at 281 if level increased |
| `Advisor.observe(category, key, value)` | `observe` | **286** | `(string, string, any) → void` | Auto-creates category at 289–292 on first call · numeric values increment (line 294–295) · arrays push (296–297) · scalars assign (298–299) |

**Auto-create confirmed:** lines 289–292:
```js
var cat = _state.observations[category];
if (!cat) {
  _state.observations[category] = {};
  cat = _state.observations[category];
}
```
A new `'oathandbone'` category will be created on first `observe('oathandbone', ...)` call without any migration work. The `createState` factory (line 42–65) only seeds `{calc_usage, war_table, vault_trial, visit_pattern}` — Oath and Bone adds itself on first play.

### 2.2 Event hooks (existing, reusable)

| Event | Emitted at | Payload | Oath and Bone use |
|---|---|---|---|
| `'xp'` | `:278` | `{action, amount, total, level}` | Orb pulse UI already subscribes (`advisor-orb.js`) — Oath and Bone XP grants surface automatically |
| `'levelup'` | `:281` | `{from, to, xp}` | One-time reward grant per `MUSTER_DESIGN.md` §5 pattern — Oath and Bone listens and grants one cosmetic or 1 credit bonus at Ch1 level milestones |
| `'created'` | `:224` | `{archetype, name}` | Fires on first archetype pick. Not relevant to Oath and Bone battle flow. |

Listener registration: `Advisor.on(event, callback)` at line **424**.

### 2.3 Oath and Bone XP grant calls (full list)

Per `DESIGN.md` §8 and per-battle `Soul Review` entries in `BATTLES.md`:

```javascript
// Victory — tier-weighted per ECONOMY.md §2
Advisor.grantXP('oathandbone_battle_victory', 45);   // Scout tier
Advisor.grantXP('oathandbone_battle_victory', 60);   // Sergeant tier
Advisor.grantXP('oathandbone_battle_victory', 90);   // Marshal tier

// Defeat — still grants per learn-from-loss pattern
Advisor.grantXP('oathandbone_battle_defeat', 15);

// Chapter milestones
Advisor.grantXP('oathandbone_chapter_complete', 200);

// Narrative beats
Advisor.grantXP('oathandbone_spell_unlocked', 15);
Advisor.grantXP('oathandbone_hero_recruited', 25);
Advisor.grantXP('oathandbone_job_advanced', 30);
```

XP is automatically multiplied by `getMultiplier()` at `advisor.js:263` — no explicit multiplication in Oath and Bone code. Pro-tier bonuses are subscription-driven, not per-call.

### 2.4 Oath and Bone observation calls (full list)

Per `DESIGN.md` §8 and verified per-battle by `BATTLES.md` field reads:

```javascript
// Tactical dimensions
Advisor.observe('oathandbone', 'plays', 1);
Advisor.observe('oathandbone', 'counter_triangle_hits', N);       // shared dimension with Muster
Advisor.observe('oathandbone', 'counter_triangle_misses', N);
Advisor.observe('oathandbone', 'elevation_exploit_hits', N);      // new to Oath and Bone
Advisor.observe('oathandbone', 'risk_calls', N);                  // <50% hit-chance attacks

// Magic-school dimensions (new)
Advisor.observe('oathandbone', 'magic_school_affinity', 'wizardry');    // 'wizardry'|'necromancy'|'druidry'|'balanced'
Advisor.observe('oathandbone', 'spell_usage_pattern', 'burst');          // 'burst'|'sustain'|'utility'
Advisor.observe('oathandbone', 'hero_composition', 'balanced');          // 'martial-heavy'|'magic-heavy'|'balanced'

// Moral + narrative dimensions
Advisor.observe('oathandbone', 'ritual_discipline', 1);                  // per reagent-rite performed
Advisor.observe('oathandbone', 'moral_choice', 'freed_marrow');          // per branch choice: 'freed_marrow'|'leashed_marrow'|'left_marrow'|'defended_grove'|'abandoned_grove'|etc.
Advisor.observe('oathandbone', 'permadeath_loss', 'brin');               // hero permanently lost
Advisor.observe('oathandbone', 'bond_invested', 'vael_thessa');          // bond track raised

// Result tracking (per-archetype victory/defeat — matches Muster pattern)
Advisor.observe('oathandbone', 'victories_vs_' + dominant_archetype, 1);
Advisor.observe('oathandbone', 'defeats_vs_' + dominant_archetype, 1);
```

Observation writes land in `_state.observations.oathandbone` — verifiable in browser console:
```js
Advisor.getState().observations.oathandbone
```

### 2.5 Where these calls fire (battle lifecycle)

Pattern-match `game-war-table.js:99–103` and `game-vault-trial.js:135–136` exactly.

**Battle end (`game-oath-and-bone.js` — to be written):**
```javascript
function endBattle(result) {
  if (!window.Advisor) return;
  Advisor.observe('oathandbone', 'plays', 1);
  Advisor.observe('oathandbone', 'counter_triangle_hits', state.stats.counterHits);
  Advisor.observe('oathandbone', 'counter_triangle_misses', state.stats.counterMisses);
  Advisor.observe('oathandbone', 'elevation_exploit_hits', state.stats.elevationHits);
  Advisor.observe('oathandbone', 'risk_calls', state.stats.riskCalls);
  Advisor.observe('oathandbone', 'hero_composition', deriveComposition(state.party));
  if (state.casters_used.length) {
    Advisor.observe('oathandbone', 'spell_usage_pattern', deriveSpellPattern(state.stats));
    Advisor.observe('oathandbone', 'magic_school_affinity', deriveSchoolAffinity(state.casters_used));
  }
  if (result.win) {
    Advisor.observe('oathandbone', 'victories_vs_' + state.enemy_dominant, 1);
    Advisor.grantXP('oathandbone_battle_victory', xpFor(state.difficulty));
  } else {
    Advisor.observe('oathandbone', 'defeats_vs_' + state.enemy_dominant, 1);
    Advisor.grantXP('oathandbone_battle_defeat', 15);
  }
}
```

**Per-moral-beat (mid-battle or post-battle modal):**
```javascript
// B4 branch resolve
Advisor.observe('oathandbone', 'moral_choice', 'submitted_to_orik');
// B6 branch resolve
Advisor.observe('oathandbone', 'moral_choice', 'freed_and_trusted_marrow');
// B7 branch resolve
Advisor.observe('oathandbone', 'moral_choice', 'defended_grove');
// B10 branch resolve
Advisor.observe('oathandbone', 'moral_choice', 'coerced_crown');
// B11 hinge
Advisor.observe('oathandbone', 'moral_choice', 'bound_torren');  // or 'did_not_bind_torren'
```

**Per-hero-permadeath (engine event):**
```javascript
Advisor.observe('oathandbone', 'permadeath_loss', fallenHero.id);
```

---

## 3. Verified: credits.js — client-side credit surface (working, but worker-side is missing)

**File:** `/Users/defimagic/Desktop/Hive/KingshotPro/js/credits.js` (383 lines, re-read in full 2026-04-21)

### 3.1 Verified client surface

| Call | Method | Line | Server endpoint it hits | Server status |
|---|---|---|---|---|
| state init | `fetchUserState` | **15–44** | `GET /credits/balance` (line 16) | **404 — not implemented** (see §4) |
| kingdom lookup request | `KSP_CREDITS.requestKingdom` | **244** | `POST /kingdom/request` (line 254) | **404 — not implemented** |
| intel unlock | `KSP_CREDITS.unlockKingdomIntel` | **297** | `POST /intel/unlock-kingdom` (line 311) | **404 — not implemented** |
| world-chat unlock | `KSP_CREDITS.unlockWorldChat` | **342** | `POST /worldchat/unlock` (line 357) | **404 — not implemented** |
| pro export | `KSP_CREDITS.exportChat` | **274** | `GET /advisor/history` (line 275) | **404 — not implemented** |

All server-status findings cross-verified against `docs/ARCHITECTURE.md:122–127`, which explicitly lists these as missing.

### 3.2 API base URL

`credits.js:12` — `var API = 'https://kingshotpro-api.kingshotpro.workers.dev';`

This is the Cloudflare Worker at `worker/worker.js`. All of the endpoints above are expected to live there; none do today.

### 3.3 State object

`credits.js:13` — `var state = { tier: 'free', credits: 0, fid: '', loaded: false };`

`state.tier` mirrors to localStorage at line **33**: `localStorage.setItem('ksp_tier', state.tier);`
`state.tier` and `state.credits` are the source of truth for client-side paywall + Pro-feature reveals. Worker populates them via `GET /credits/balance` — which does not exist, so in production `state.credits === 0` and `state.tier === 'free'` for every user always.

### 3.4 What Oath and Bone adds to `KSP_CREDITS`

Three new methods are needed on the `window.KSP_CREDITS` object (line 242). Add them in the same file; do not create a parallel object.

```javascript
// New — convert credits to Crowns (ECONOMY.md §4)
unlockOath and BoneCrowns: function (creditsToSpend, callback) {
  // validates client-side balance, calls POST /oath-and-bone/convert-credits
  // server issues 50 Crowns per credit, decrements credits, returns new balances
},

// New — grant daily credit reward for Sergeant+ wins (ECONOMY.md §2, BATTLES.md §16)
grantOath and BoneDaily: function (event, difficulty, callback) {
  // calls POST /credits/grant-daily with {source: 'oathandbone', event, difficulty}
  // server enforces per-day cap of 5 (Oath and Bone total) and per-source first-of-day gate
},

// New — deduct Crown balance server-side for shop purchases (ECONOMY.md §3)
spendOath and BoneCrowns: function (itemId, quantity, callback) {
  // calls POST /oath-and-bone/spend with {item: itemId, qty: quantity}
  // server validates Crown balance, applies to shop item, returns new Crown balance
}
```

### 3.5 Where these fire in Oath and Bone code

```javascript
// Battle-end credit grant — pattern-match Muster spec in MUSTER_DESIGN.md §5
if (result.win && state.difficulty !== 'scout' && state.plays_today === 1) {
  window.KSP_CREDITS.grantOath and BoneDaily('first_battle_victory', state.difficulty, function (res) {
    if (res.ok) showCreditGain(res.granted);
  });
}

// Chapter completion
if (state.chapter_complete) {
  window.KSP_CREDITS.grantOath and BoneDaily('chapter_complete', state.difficulty, showCreditGain);
}

// Crown shop purchase
window.KSP_CREDITS.spendOath and BoneCrowns('t2_weapon_infantry', 1, function (res) {
  if (res.ok) { applyItemToInventory(); renderShop(res.balance); }
});

// Credit → Crown conversion (shop UI)
window.KSP_CREDITS.unlockOath and BoneCrowns(creditsToConvert, function (res) {
  if (res.ok) { updateCrownDisplay(res.crowns_balance); updateCreditPill(res.credits_balance); }
});
```

---

## 4. Verified: worker.js — existing surface and what Oath and Bone must add

**File:** `/Users/defimagic/Desktop/Hive/KingshotPro/worker/worker.js` (1232 lines; handler block read in full at lines 55–120; `handleAdvisorChat` read at lines 220–340)

### 4.1 Handler registry (verified line-by-line)

POST handlers in `fetch()` at lines **63–95**:

| Line | Pathname | Handler |
|---|---|---|
| 64 | `/auth/send` | `handleAuthSend` |
| 66 | `/auth/verify` | `handleAuthVerify` |
| 68 | `/advisor/chat` | `handleAdvisorChat` |
| 70 | `/advisor/consult` | `handleAdvisorConsult` |
| 72 | `/advisor/chronicle` | `handleChronicle` |
| 74 | `/advisor/illustration` | `handleIllustration` |
| 76 | `/advisor/video` | `handleAdvisorVideo` |
| 78 | `/advisor/voice` | `handleVoice` |
| 80 | `/advisor/portrait` | `handlePortrait` |
| 82 | `/stripe/webhook` | `handleStripeWebhook` |
| 84 | `/verify/request` | `handleVerifyRequest` |
| 86 | `/verify/confirm` | `handleVerifyConfirm` |
| 88 | `/verify/admin` | `handleVerifyAdmin` |
| 90 | `/survey/submit` | `handleSurveySubmit` |
| 92 | `/verify/mark-sent` | `handleVerifyMarkSent` |

GET handlers at lines **98–113**: `/codes/check`, `/codes/list`, `/video/cache`, `/survey/admin`, `/verify/admin`.

Upstream proxy ROUTES at lines 3–6: `/player` and `/redeem` pass through to `https://kingshot-giftcode.centurygame.com/api/player`.

### 4.2 What does NOT exist (verified absence)

No handler for:
- `/credits/balance`
- `/credits/grant-daily`
- `/kingdom/request`
- `/intel/unlock-kingdom`
- `/worldchat/unlock`
- `/advisor/history`

This matches `docs/ARCHITECTURE.md:122–127`'s explicit "The Worker has no such endpoint" finding. The entire credit system is a **client-side fiction backed by an unimplemented API surface**. Credits shown in the topbar pill are always 0 for real users because `GET /credits/balance` returns 404 → credits.js line 18 returns null → state.credits stays at its 0 initial.

### 4.3 Endpoints Oath and Bone must add

Add to worker.js POST branch at line ~95 (after `/verify/mark-sent`):

```javascript
} else if (url.pathname === '/credits/grant-daily') {
  return handleCreditsGrantDaily(request, env);
} else if (url.pathname === '/oath-and-bone/convert-credits') {
  return handleOath and BoneConvertCredits(request, env);
} else if (url.pathname === '/oath-and-bone/spend') {
  return handleOath and BoneSpend(request, env);
}
```

For the credits system to function at all, the existing missing endpoints (`/credits/balance`, `/kingdom/request`, `/intel/unlock-kingdom`, `/worldchat/unlock`, `/advisor/history`) also need to be implemented — these are pre-existing gaps that Oath and Bone inherits, not creates. **Building Oath and Bone's credit loop without first implementing `/credits/balance` and a KV-backed credit ledger is not possible** — the game would read 0 credits for every player forever.

### 4.4 Spec: `POST /credits/grant-daily` (shared with Muster)

**Request:**
```json
{ "source": "oathandbone", "event": "first_battle_victory", "difficulty": "sergeant" }
```

**Server behavior:**
1. Validate session cookie (use `getUser(request, env)` at worker.js — helper function already present, used throughout `handleAdvisorChat`).
2. Check KV for `credits_granted_{source}_{fid}_{YYYY-MM-DD}` — if present, honor per-day cap: Oath and Bone = 5 credits/day (Muster gets its own 5 under `source: 'muster'`).
3. Look up event in a rewards table:
   - `first_battle_victory` + `sergeant` → 1 credit
   - `first_battle_victory` + `marshal` → 2 credits
   - `chapter_complete` → 3 credits
   - `hero_recruited_major` → 2 credits
4. If granting would exceed daily cap, cap and return `granted: X, capped: true`.
5. Atomic-add to the user's credit balance in KV (`user:{email}.credits` or `balance:{fid}`, whichever matches the pattern established in `/credits/balance` when that is built).
6. Write the grant record to KV with 48h TTL: `credits_granted_{source}_{fid}_{YYYY-MM-DD} = {granted_count, event, ts}`.

**Response:**
```json
{ "balance": 7, "granted": 1, "capped": false, "daily_used": 1, "daily_cap": 5 }
```

### 4.5 Spec: `POST /oath-and-bone/convert-credits`

**Request:**
```json
{ "credits_to_spend": 3 }
```

**Server behavior:**
1. Validate session.
2. Look up user credit balance — reject if `< credits_to_spend` with `error: 'insufficient_credits'`.
3. Deduct credits (atomic).
4. Add 50 Crowns per credit to user's Oath and Bone Crown balance in KV (`oathandbone_crowns:{fid}`).
5. Return new balances.

**Response:**
```json
{ "ok": true, "credits_balance": 4, "crowns_balance": 1350, "crowns_added": 150 }
```

### 4.6 Spec: `POST /oath-and-bone/spend`

**Request:**
```json
{ "item": "t2_weapon_infantry", "qty": 1, "battle_id": "B5" }
```

**Server behavior:**
1. Validate session.
2. Look up item price in canonical shop table (server-side mirror of `ECONOMY.md` §3 — keep in `worker/oath-and-bone-shop.js` or inline in `worker.js`).
3. Reject if Crown balance < cost.
4. If item is a battle-boost (XP Booster, Resolve Charge, etc.) and `battle_id` is provided, enforce 5-boosts-per-battle cap server-side by reading `boost_count_{fid}_{battle_id}` in KV.
5. Deduct Crowns, increment boost count if applicable, grant inventory entry or one-shot effect.
6. Return new Crown balance + inventory delta.

**Response:**
```json
{ "ok": true, "crowns_balance": 820, "granted": { "item": "t2_weapon_infantry", "qty": 1 } }
```

### 4.7 Server-side enforcement discipline (per ECONOMY.md §11)

**Never trust the client for revenue-impacting state.** The existing `handleAdvisorChat` at worker.js:233 (`const user = await getUser(request, env);`) is the pattern — every new handler authenticates, reads KV, writes KV, returns authoritative balances. Client reflects, client does not decide.

---

## 5. Verified: advisor-chat.js — sends observations, but worker discards them

**File:** `/Users/defimagic/Desktop/Hive/KingshotPro/js/advisor-chat.js` (86 lines, re-read in full 2026-04-21)

### 5.1 What the client sends

Lines **32–48**:
```javascript
const playerContext = {
  state: window.Advisor.getState(),   // includes full _state.observations — Oath and Bone writes land here
  tags: window.Advisor.getTags(),
  level: window.Advisor.getLevel(),
  fid: window.Advisor.getFid()
};

fetch('https://kingshotpro-api.kingshotpro.workers.dev/advisor/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message, fid: playerContext.fid, playerContext, archetype: 'default', advisorName: 'Advisor' })
})
```

`Advisor.getState()` returns a deep-copied snapshot including `observations.oathandbone` with all the dimensions listed in §2.4. The client-side wiring is correct.

### 5.2 What the server does with it (CRITICAL BUG)

**File:** `/Users/defimagic/Desktop/Hive/KingshotPro/worker/worker.js:260`

```javascript
let systemPrompt = (env.SYSTEM_PROMPT || 'You are a medieval advisor for Kingshot players.') +
  '\n\nPlayer context: ' + (playerContext || 'Unknown') +
  '\n\nYou are ' + (advisorName || 'the advisor') + ', archetype: ' + (archetype || 'steward') +
  '. Stay in character. Be concise and strategic.' +
  GROUNDING_APPENDIX;
```

**The `playerContext` object is concatenated into a string via `+` operator.** In JavaScript, this coerces the object with `toString()`, yielding `[object Object]`. The LLM sees the literal text `Player context: [object Object]` and has zero access to the observations the client carefully collected.

**This resolves `SUCCESSION_V2.md §4`'s open question:** the advisor chat does NOT today read observations (Oath and Bone's or any other game's) — it only appears to, because the client does its part correctly and the server silently drops the data.

### 5.3 The fix (one-line minimum, better with selection)

Minimum fix (one line):
```javascript
'\n\nPlayer context: ' + (playerContext ? JSON.stringify(playerContext) : 'Unknown') +
```

Better fix — Oath and Bone-aware context builder:
```javascript
function buildAdvisorContext(playerContext) {
  if (!playerContext) return 'Unknown';
  const obs = playerContext.state && playerContext.state.observations || {};
  const parts = [];
  if (obs.oathandbone) {
    parts.push('Oath and Bone: ' + summarizeObs(obs.oathandbone));   // plays, wins, moral choices, school affinity
  }
  if (obs.muster) {
    parts.push('Muster: ' + summarizeObs(obs.muster));
  }
  if (obs.vault_trial) {
    parts.push('Vault Trial: ' + summarizeObs(obs.vault_trial));
  }
  if (obs.war_table) {
    parts.push('War Table: ' + summarizeObs(obs.war_table));
  }
  if (playerContext.tags && playerContext.tags.length) {
    parts.push('Tags: ' + playerContext.tags.join(', '));
  }
  if (playerContext.level) {
    parts.push('Level: ' + playerContext.level);
  }
  return parts.join(' · ');
}
```

Then at worker.js:260 replace with `+ '\n\nPlayer context: ' + buildAdvisorContext(playerContext) +`.

**This fix benefits Muster, Vault Trial, War Table, and Oath and Bone equally.** It is small, local, and entirely reversible. It should ship with Oath and Bone Phase 1 or earlier (it is not Oath and Bone-scoped — it is fixing a pre-existing silent bug).

---

## 6. Verified: pattern-match templates — game-vault-trial.js + game-war-table.js

### 6.1 Daily-gate pattern (verified)

**`game-vault-trial.js:40–45`:**
```javascript
var TODAY = new Date().toISOString().slice(0, 10);
var PLAYED_KEY = 'ksp_vt_played';

function alreadyPlayed() {
  try { return localStorage.getItem(PLAYED_KEY) === TODAY; } catch (e) { return false; }
}
```

**`game-war-table.js:27–33`:** same pattern with `PLAYED_KEY = 'ksp_wt_played'`.

**Oath and Bone uses:** `PLAYED_KEY = 'ksp_oathandbone_played'`. Stamped at end of each battle:
```javascript
try { localStorage.setItem('ksp_oathandbone_played', new Date().toISOString().slice(0,10)); } catch (e) {}
```

### 6.2 Advisor integration block (verified)

**`game-war-table.js:99–107`:**
```javascript
if (window.Advisor) {
  var pickType = (scenario.aggressive === pick) ? 'aggressive_picks' : 'defensive_picks';
  Advisor.observe('war_table', pickType, 1);
  Advisor.observe('war_table', 'plays', 1);
  Advisor.grantXP('war_table', xp);
}
try { localStorage.setItem(PLAYED_KEY, TODAY); } catch (e) {}
```

**`game-vault-trial.js:110–112`:** array-push pattern for categorical data:
```javascript
if (!correct && window.Advisor) {
  Advisor.observe('vault_trial', 'missed_topics', q.category);
}
```

**`game-vault-trial.js:134–139`:** same shape for battle-end block:
```javascript
if (window.Advisor) {
  Advisor.observe('vault_trial', 'plays', 1);
  Advisor.grantXP('vault_trial', xp);
}
try { localStorage.setItem(PLAYED_KEY, TODAY); } catch (e) {}
```

**Oath and Bone matches this exact shape.** See §2.5 for the full battle-end block. Every existing game checks `if (window.Advisor)` before calling — Oath and Bone does the same.

### 6.3 Practice mode after daily cap (per ECONOMY.md §2)

After `alreadyPlayed()` returns true, other games show a "come back tomorrow" card and block play. Oath and Bone differs: it continues to allow practice play indefinitely, suppressing XP and credit grants but keeping observation writes active. The check:

```javascript
function isPracticeMode() {
  try { return localStorage.getItem('ksp_oathandbone_played') === TODAY &&
         plays_today() >= 3; } catch (e) { return false; }
}

function endBattle(result) {
  // Observations always fire — practice plays still feed the advisor
  Advisor.observe('oathandbone', 'plays', 1);
  // ... other observations ...
  if (!isPracticeMode()) {
    // XP + credit grants only when not in practice
    Advisor.grantXP('oathandbone_battle_victory', xpFor(state.difficulty));
    if (result.win && state.difficulty !== 'scout' && isFirstSergeantPlusOfDay()) {
      window.KSP_CREDITS.grantOath and BoneDaily('first_battle_victory', state.difficulty, showCreditGain);
    }
  }
  try { localStorage.setItem('ksp_oathandbone_played', TODAY); } catch (e) {}
}
```

---

## 7. Pricing config and disclaimers

Per `KingshotPro/CLAUDE.md` "Single-source-of-truth rules > Pricing":
- All Crown pack prices, Campaign Pass prices, Chapter Pass prices, Pro tier perks — put them in `js/pricing-config.js` under a new `oathandbone:` namespace.
- `docs/PRICING.md` mirrors the pricing-config change in the same commit.
- `docs/DECISIONS.md` gets an entry the day Crown packs are added with date + reason.
- **Do not hardcode** any Crown pack $ value in shop UI, modals, Stripe webhook config. Read via `window.KSP_PRICING.oathandbone.*`.

Disclaimer per FRAME_UPDATE.md §"What does NOT change" and ECONOMY.md §10:
- "Unofficial. Not affiliated with Century Games." on every game surface: camp, shop, battle UI footer, payment modal, about page.
- Grep before ship: `grep -rn "Oath and Bone" --include="*.html" --include="*.js"` — any surface without the disclaimer is a ship-blocker.

---

## 8. End-to-end lifecycle (one canonical Sergeant-tier victory)

Traces every plug-point above in the order it fires:

1. Player finishes B5 (The Tower) on Sergeant. `state.stats` has counterHits=12, counterMisses=4, elevationHits=3, riskCalls=1, casters_used=['caelen'].
2. `endBattle(result: {win: true})` in `game-oath-and-bone.js`:
   - `Advisor.observe('oathandbone', 'plays', 1)` → writes to `_state.observations.oathandbone.plays` via `advisor.js:286`. Auto-creates category on first-ever play via `advisor.js:289–292`.
   - Remaining observations fire (counter_triangle_hits, elevation_exploit_hits, magic_school_affinity='wizardry', hero_composition='balanced', victories_vs_Bladewind+=1).
   - `Advisor.grantXP('oathandbone_battle_victory', 60)` → `advisor.js:259` applies `getMultiplier()` from `:237` (e.g., TC Lv 22 whale = 1.25 × 1.15 = 1.4375), stores rounded XP, emits `'xp'` event at `:278` which the advisor orb subscribes to.
   - Level check: if XP crossed threshold, emits `'levelup'` at `:281` → orb plays level-up animation, game grants one-time reward per Ch1 milestone table.
3. Daily-gate check: `localStorage.getItem('ksp_oathandbone_played') === TODAY` returns false (first play of day). Set to true after grant logic.
4. First Sergeant+ of day → `window.KSP_CREDITS.grantOath and BoneDaily('first_battle_victory', 'sergeant', cb)`:
   - Client sanity check against `KSP_CREDITS.getState()`.
   - POST `https://kingshotpro-api.kingshotpro.workers.dev/credits/grant-daily` with `{source:'oathandbone', event:'first_battle_victory', difficulty:'sergeant'}`.
   - Worker `handleCreditsGrantDaily` (to be written) validates session, checks `credits_granted_oathandbone_{fid}_{date}`, grants 1 credit if under cap of 5, writes grant record with 48h TTL, returns `{balance, granted:1, capped:false}`.
   - Client updates credit pill via `renderCreditPill()` at `credits.js:46`.
5. Post-battle reward modal: 60 XP (pre-mult) · 100 Crowns · 1 credit · Wizardry unlock Firebolt. Crown balance updated server-side via next `/credits/balance` call (to be built — or via push in the grant response if API shape is extended).
6. Player opens advisor orb, types *"How am I doing in Oath and Bone?"*:
   - `advisor-chat.js:32–48` sends `playerContext = {state: Advisor.getState(), tags, level, fid}`.
   - `worker.js:220 handleAdvisorChat` receives. **After the line 260 fix in §5.3:** `buildAdvisorContext(playerContext)` returns `"Oath and Bone: 1 play · 1 victory · school=wizardry · comp=balanced · Muster: 0 · Level: 8"`.
   - LLM responds referencing the player's specific Oath and Bone behavior.

Every step verified against primary source this session.

---

## 9. Resolution of SUCCESSION_V2.md §4 open items

| Item | Status 2026-04-20 | Status now (2026-04-21, verified) |
|---|---|---|
| `advisor.js:237/259/286` confirmed | claimed confirmed Session 44 | **re-verified** by reading in full; all three line numbers correct |
| `credits.js` spend/earn surface | not fully read | **fully read**: client surface complete; worker-side entirely missing (§3.1, §4.2) |
| `game-vault-trial.js` + `game-war-table.js` pattern | not fully read | **fully read**: pattern-match template in §6 |
| `worker.js` credit endpoint pattern or absence | not resolved | **resolved**: no credit endpoints exist; `docs/ARCHITECTURE.md:122–127` confirms; new endpoint specs in §4.3–§4.6 |
| `advisor-chat.js` reads observations? | open | **resolved with a bug found**: client sends observations correctly; worker.js:260 string-coerces the object, dropping all data; one-line fix in §5.3 |

The advisor-chat bug is the most significant finding. It is not Oath and Bone-scoped — it silently degrades every game's cross-intersection value on the site today. Fixing it should ride with or precede Oath and Bone Phase 1.

---

## 10. Build-order implications

In priority order, based on what §4.2 revealed:

1. **Implement `GET /credits/balance` + a KV-backed credit ledger in worker.js** *(pre-existing gap; unblocks Muster and Oath and Bone both)*
2. **Fix advisor-chat.js observation serialization at worker.js:260** *(one-line change, benefits entire advisor product)*
3. **Implement `POST /credits/grant-daily`** *(spec in §4.4)*
4. **Implement `POST /oath-and-bone/convert-credits` and `POST /oath-and-bone/spend`** *(specs in §4.5, §4.6)*
5. **Write `js/game-oath-and-bone.js` orchestrator with the integration block in §2.5**
6. **Add Oath and Bone prices to `js/pricing-config.js` + mirror to `docs/PRICING.md` in the same commit (per KingshotPro/CLAUDE.md)**
7. **Add `DECISIONS.md` entry for Crown packs + Campaign Pass + Chapter Pass**

Steps 1 and 2 unblock work that Muster (also unshipped) and the existing site both need. Steps 3–7 are Oath and Bone-specific.

Phase 1 combat slice (per `BUILD_PLAN.md` §1) can begin wiring against steps 5 while 1–4 land in parallel. Phase 1 ship-gate cannot be cleared until step 1 is live — the slice's "1 credit grant on first Sergeant win" cannot work without `/credits/balance` + `/credits/grant-daily`.

---

## 11. Verification checklist for CROSS_INTERSECTION.md itself

Run before committing this file or before a next-Claude acts on it:

- [x] Every file:line reference in §2, §3, §4, §5, §6 was re-read from the primary source in this session, not taken from memory or from DESIGN.md / MUSTER_DESIGN.md / BUILD_PLAN.md.
- [x] The advisor-chat observation bug at worker.js:260 was verified by reading the exact line in full context.
- [x] The missing worker endpoints were verified against the complete handler list at worker.js:55–113.
- [x] The `KSP_CREDITS` expose object's current methods were enumerated from credits.js:242–374.
- [x] The pattern-match reference points (`game-vault-trial.js:40–41, 110–112, 134–139` and `game-war-table.js:27–28, 99–107`) were re-read in full.
- [x] The `advisor.js` `observe` auto-create behavior at lines 289–292 was verified.
- [x] `docs/ARCHITECTURE.md:122–127` cross-check matched the primary-source finding on missing endpoints.
- [x] KingshotPro/CLAUDE.md pricing single-source rule applied to §7.

---

*CROSS_INTERSECTION.md by Session 45 continuation, 2026-04-21. Every cited file:line was opened this session. Major finding: advisor-chat.js observations are silently dropped today at worker.js:260 — a one-line fix benefits every game on the site. Second finding: the entire credit surface referenced by credits.js is unimplemented in worker.js — Oath and Bone inherits and cannot route around this. Build order in §10 is the recommended path.*

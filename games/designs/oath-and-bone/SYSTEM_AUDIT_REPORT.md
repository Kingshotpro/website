# Oath and Bone — System Audit Report

*Worker 29, 2026-04-26. Full-system read-only audit. Nine concerns. Primary-source evidence for every verdict.*

---

## Verdict: CONDITIONAL GO

Ship after fixing the disclaimer gap (Concern 4). The `crowns_earned` client-trust issue (Concern 1) is a revenue concern, not a safety/legal blocker — document in DECISIONS.md for Worker 30+ hardening. All other issues are either PASS or acceptable PARTIAL for MVP.

**Hard blockers found: 0**
**Conditions to ship: 1** (disclaimer on ad overlays — 2-line edit)
**Worker 30+ hardening items: 2** (Crown earn server-side recompute, oabApplyCrownGrant CAS)

---

## Concern 1 — Security

**Verdict: PARTIAL**

### PASS items

- **CSRF protection**: `corsWrapCred` (worker.js:2279) enforces origin allowlist (`ALLOWED_ORIGINS`, worker.js:2264) and `Access-Control-Allow-Credentials: true` only for `kingshotpro.com`, `kingshotpro.github.io`, `kingshotpro.pages.dev`, `localhost`. Cross-origin cookie delivery is browser-blocked for any unlisted origin. ✓
- **KV key injection**: `oabResolveAuth` (worker.js:1837) reads `fid` from the authenticated session (`user.fid`), not from the request body. A user cannot supply a foreign fid in OAB save/spend/battle-result calls. KV has no path-traversal semantics. ✓
- **Permadeath floor**: `handleOabSave` (worker.js:1856) unions `fallen_heroes` as a Set — the client list can never shrink the server list. ✓
- **Crown spend CAS**: `handleOabSpend` (worker.js:1975) retries 3 times with version-check before write. ✓
- **Tutorial copy XSS**: `showTutorialModal` renders `copyText` via `copy.textContent` (render.js:1315). ✓
- **All other dynamic content**: ~95% of render.js output uses `.textContent`. Shop descriptions, barbs, reward values — all safe. ✓

### FAIL items

**F1 — `crowns_earned` server trusts client (CRITICAL severity, revenue impact)**

`handleOabBattleResult` (worker.js:2075-2091) accepts the client-submitted `crowns_earned` up to `OAB_MAX_CROWNS_PER_BATTLE_RESULT = 1000` (worker.js:1814). The server does not recompute the reward from `scenario_id` + `difficulty_tier`. A cheater can POST `{"scenario_id":"b1","result":"victory","crowns_earned":1000,"difficulty_tier":"sergeant",...}` and receive 1,000 Crowns instead of the legitimate 50. That is a 20× inflation per battle.

*Impact*: Crowns have no cash-out path — this does not enable real-world financial fraud. However, it breaks the pay-to-accelerate economy: a player willing to use devtools never needs to buy a Crown pack. At 12 battles × 1,000 Crowns = 12,000 farmed, vs. the $4.99 Coffer Pack (1,400 Crowns). This is a revenue harm, not a safety/legal one.

*Fix path*: Worker 30+ should add a server-side reward table keyed on `scenario_id` + `difficulty_tier` and validate `crowns_earned` against it (±20% multiplier window to allow for Campaign Pass and bonuses).

**F2 — `oabApplyCrownGrant` no CAS retry (LOW severity, rare data loss)**

`oabApplyCrownGrant` (worker.js:1087-1095) does a plain read-modify-write on `oab_state_{fid}` — no version check, no retry loop. If a user purchases two Crown packs in rapid succession and both webhooks fire concurrently, one `KV.put` overwrites the other, and the player loses the grant from whichever write lands second.

Worker 28 noted (comment at worker.js:1087): "Additive Crown grants inflate rather than corrupt." This is incorrect — additive means both reads see the pre-grant balance, both write the post-single-grant balance, and the player receives only one grant instead of two.

*Fix path*: Wrap `oabApplyCrownGrant` in the same 3-attempt CAS pattern already used by `handleOabSpend`.

**F3 — `snap.scenarioId` injected into innerHTML (LOW severity, requires localStorage control)**

`_showResumePrompt` (render.js:1709-1711) builds:
```javascript
copy.innerHTML = 'You left a battle unfinished<br>' +
  '<span style="...>' + ageLabel + ' — round ' +
  (snap.round || '?') + ' of ' + (snap.scenarioId || 'B1').toUpperCase() + '</span>';
```

`snap` comes from `ksp_oab_battle_resume` in localStorage (render.js:1692). `toUpperCase()` does not sanitize HTML. An attacker who can write to localStorage (via prior XSS or physical access) could inject a script tag through `scenarioId`.

This is a Self-XSS / second-order XSS — not remotely exploitable from a third-party origin. Low severity for MVP. Fix: use `textContent` on the span, or build the span with `createElement`.

---

## Concern 2 — Economy Balance

**Verdict: PARTIAL (PASS on free-player-finish; PARTIAL on code/spec alignment)**

### Free player can finish Chapter 1

ECONOMY.md §9 walkthrough projects ~3,150 Crowns across 6 days (12 battles). The math uses the §2 base earn rate (50 Crowns/Sergeant win) rather than per-battle BATTLES.md rates. Verified the floor: full T2 loadout for 6 heroes = 1,440 Crowns — comfortably below the 6-day total. Free player finishes. ✓

### Reward value discrepancy (battles.js vs BATTLES.md)

| Battle | battles.js XP | BATTLES.md XP | battles.js Crowns | BATTLES.md Crowns |
|---|---|---|---|---|
| B1 | 60 | 60 | 50 | 50 |
| B2 | **55** | 80 | **45** | 60 |
| B3 | **65** | 110 | **55** | 70 |

B2 and B3 rewards in code are lower than the BATTLES.md design contract. B2 Crowns: 45 (code) vs 60 (spec). B3 XP: 65 (code) vs 110 (spec). No DECISIONS.md entry explains this deviation.

Using code values across 12 battles (4 each of B1/B2/B3 approximately), a free Sergeant player earns ~(50+45+55) × 4 = 600 Crowns from battles — 17% below the ECONOMY.md §9 estimate of ~720. The §9 walkthrough still validates (2,400 total with bonuses still clears 1,440 T2 floor), but the discrepancy should be documented.

*Fix path*: Either update battles.js to match BATTLES.md, or add a DECISIONS.md entry documenting the tuning rationale.

---

## Concern 3 — Dialogue / Copy Soul-Gauge

**Verdict: PARTIAL**

### Fallen barbs — EXCELLENT

`_FALLEN_BARBS` (render.js:2834): hero-specific, world-weighted, irreducible.

| Hero | Barb | Assessment |
|---|---|---|
| vael | "We can't lose her." | Grief with urgency ✓ |
| halv | "Oh, Halv." | Intimate brevity ✓✓ |
| brin | "Damn." | Raw, unguarded ✓✓ |
| caelen | "...he should not have fallen." | Weight and regret ✓✓ |
| marrow | "What he owed, he's paid." | Respect/closure ✓✓ |
| thessa | "The grove loses a guardian." | Lore-specific grief ✓✓ |

### Results barbs — GOOD (defeat stronger than victory)

Victory (`_VICTORY_BARBS`, render.js:1468): "Good work." / "For the seat." / "That's the opening." / "Got him." — "Good work." is generic; other three have voice.

Defeat (`_DEFEAT_BARBS`, render.js:1474): "...I should have cast sooner." / "Get up. We're not done." / "I'm watching." / "The fire was always going to reach Highspire." — all four are excellent; "The fire was always going to reach Highspire" is the strongest line in the system.

### Tutorial copy — ADEQUATE

B1 (T1–T3): Functional mechanics instructions. No character voice — appropriate for first-contact tutorials. B2 T4 ends with "Use the trees." — terse command that shows restraint. B3 T6: "These aren't Kingshot soldiers. Something older walks the borderlands. We need a wizard." — has genuine dread; the best tutorial line.

### Shop descriptions — UTILITARIAN (appropriate)

All 7 categories use tooltip-pattern descriptions ("Tier 1 weapon for one hero.", "+50% XP next battle."). Reagents have world-specific hints ("Rare major-undead drop", "Common grove/forest reagent"). Appropriate for a shop — clarity over poetry is right here.

### Crown pack copy — MINIMALIST

Pack names ("Pocket Pack", "Coffer Pack", "Hoard Pack", "King's Cache") have escalation and flair. No taglines or flavor text beyond name + Crown count + price. Acceptable for MVP.

### Pass copy — FUNCTIONAL

Perk strings are mechanical descriptions ("+50% Crown earn during the chapter"). No voice. Acceptable for MVP.

### Verdict rationale

Soul is concentrated where it counts (combat events). Tutorial and shop are functional. The system has a clear voice register — short, specific, world-anchored — and it fires at the right moments (permadeath, defeat). PARTIAL because marketing surfaces have no soul, not because the combat layer is weak.

---

## Concern 4 — Disclaimer Audit

**Verdict: PARTIAL — SHIP CONDITION**

"Unofficial. Not affiliated with Century Games." per ECONOMY.md §10 must appear on every shop UI + ad surface + payment flow.

| Surface | Has disclaimer? |
|---|---|
| Crown shop footer (render.js:2127) | ✓ |
| Crown packs panel (render.js:2246) | ✓ |
| Campaign Pass panel (render.js:2376) | ✓ |
| Pre-battle screen (render.js:2664) | ✓ |
| **Interstitial ad overlay** (`_tryInterstitial`, render.js:2404–2487) | **✗ MISSING** |
| **Rewarded video overlay** (`_showRewardedVideoStub`, render.js:2512–2575) | **✗ MISSING** |
| oath-and-bone.html footer (line 100) | ✓ |

Both ad overlays cover the full viewport and display no disclaimer. Fix: append a 1-line footer div (`'Unofficial. Not affiliated with Century Games.'`, styled at `font-size:9px;color:#5a7a9e`) to both overlays before `document.body.appendChild(overlay)`.

**This is the only ship condition in this audit.** It is a 2-line edit.

---

## Concern 5 — AdSense Compliance

**Verdict: PASS**

- **No auto-refresh**: `adsbygoogle.push({})` appears only at render.js:2445 (inside `_tryInterstitial`) and render.js:2543 (inside `_showRewardedVideoStub`). Neither is inside a polling loop, a `setInterval`, or an XHR callback. Confirmed via grep on both files. ✓
- **Interstitial fires on user action only**: `_tryInterstitial()` is called from (1) the "Continue" button click handler (render.js:1645–1657) and (2) `_startScenario()` triggered by a world-map node click (render.js:2828). No other callers. ✓
- **Rewarded video opt-in**: The pre-battle "Watch Ad for +20% XP" button is explicitly user-initiated. `_tryRewardedXpAd()` (render.js:2496) returns `false` if already at cap. ✓
- **Grant fires after completion, not on click**: `_showRewardedVideoStub` (render.js:2512) runs a 3-second countdown; `onComplete` fires only after `elapsed >= 3` (line ~2559). The claim button appears only then. ✓
- **No ad pushes in AJAX paths**: `oath-and-bone-cache.js` contains no `adsbygoogle` references. ✓
- **Gap noted**: Slot IDs `OAB-INTERSTITIAL-TBD` and `OAB-REWARDED-VIDEO-TBD` are still placeholders. AdSense will not serve real ads until the Architect configures real slot IDs. This is a known pre-launch gap (MONETIZATION_LOG.md §Webhook gap). ✓ (documented)

---

## Concern 6 — Cross-Browser / Mobile

**Verdict: UNVERIFIED (code review passes; live test required)**

Code review findings:
- All DOM manipulation uses standard, broadly-supported APIs (`createElement`, `textContent`, `appendChild`, `classList`)
- CSS uses system fonts (no web font fetch), flexbox and grid (supported >96% globally), CSS custom properties
- `sendBeacon` (cache.js:476): supported in all modern browsers (Chrome 39+, Firefox 31+, Safari 11.1+, Edge 14+)
- No canvas, WebGL, or experimental APIs
- No IE-specific code or polyfills needed
- Mobile viewport meta tag present (`<meta name="viewport" content="width=device-width, initial-scale=1.0">`)

Cannot confirm without a live playthrough at all three battle scenarios in Chrome/Safari/Firefox and mobile viewport. Specifically: CSS `transition` on sprite movement (render.js:2887), `position:fixed` ad overlays, and `document.body.appendChild` z-index stacking should be browser-tested before declaring pass.

The Architect must run the live playthrough. This is not auditable by code review alone.

---

## Concern 7 — Error Handling Under Failure Modes

**Verdict: PASS**

| Failure mode | Handler | Evidence |
|---|---|---|
| Save fails (network) | Requeues to `_pendingWrites`, retries on next 500ms debounce cycle | cache.js:341–354 |
| Load fails (network) | Falls back to `getState() \|\| _defaultState()` | cache.js:308–310 |
| Tab close with pending writes | `sendBeacon` flush on `pagehide`; fallback to `syncToServer()` if beacon unavailable | cache.js:467–487 |
| 401 (not authenticated) | Shows sign-in banner, falls back to local state | cache.js:296–301 |
| Stale cache on resume | `focus` listener re-syncs if >60s since last sync | cache.js:491–500 |
| KV write failure (server) | Client state preserved in localStorage; re-syncs on next load | (localStorage is source of truth for unauthenticated fallback) |
| Save-fail user feedback | "Save failed — will sync on next play." appears in UI | render.js:1527, 1553 |

The `sendBeacon` call (cache.js:477) sends a `Blob` with `application/json` content type — correct format for Cloudflare Workers to parse. ✓

Known gap (acceptable): If both the network is down AND the tab closes AND localStorage is cleared, state is lost. This is acceptable — no persistence layer can survive all three simultaneously.

---

## Concern 8 — Challenger Frame

**Verdict: Completed**

### What each worker operated on

**Worker 24** (monetization layer): Built shop UI, Crown economy, ad surfaces, pricing config. Frame: "get the scaffolding in place." Acknowledged the webhook gap and deferred it explicitly. Did not audit server-side Crown validation — the server-side battle-result handler didn't exist yet.

**Worker 27** (bug fixes): Fixed four specific issues from Worker 26's audit. Frame: "fix the list." Did not audit adjacent systems; didn't check whether battles.js reward values match BATTLES.md spec. Fix-mode workers run the fix and stop — this is appropriate for their scope.

**Worker 28** (launch gate): Designed and ran 6 cheat-protection tests, declared launch CLEAR. Frame: "verify security." Tested the tests it designed — Principle XVIII risk (output ≠ thinking; the structure of the tests may be shallow). Did not audit `crowns_earned` client-trust, `oabApplyCrownGrant` CAS gap, or B2/B3 reward discrepancy. Also left a stale runbook: MVP_LAUNCH_AUDIT.md §Deployment still says `wrangler secret put STRIPE_SECRET_KEY` but the code was corrected to `STRIPE_KEY` in commit 2f9cca3.

### What all three missed (the frame gap)

No worker traced the complete Crown earn pipe: `_computeRewards()` (render.js client) → POST `/battle-result` body → `handleOabBattleResult` (worker.js server). Each worker touched one end. The pipe's client-trust vulnerability was invisible from any single slice.

**Pattern**: Workers given a narrow scope anchor on that scope and declare PASS within it. The full-stack view requires a worker explicitly chartered to trace the data flow end-to-end — which Worker 29 is.

### Stale runbook fix needed

MVP_LAUNCH_AUDIT.md §Deployment Checklist step 1 reads:
> `wrangler secret put STRIPE_SECRET_KEY`

The correct env var is `STRIPE_KEY` (aligned in commit 2f9cca3). Any Architect following the runbook verbatim will set the wrong secret and the webhook will fail silently. This runbook must be corrected before deploy.

---

## Concern 9 — Performance / Load Time

**Verdict: UNVERIFIED (code assessment: LIKELY PASS with CDN)**

### JS payload

| File | Size (uncompressed) |
|---|---|
| game-oath-and-bone-render.js | 148 KB |
| game-oath-and-bone-spells.js | 47 KB |
| game-oath-and-bone-ai.js | 45 KB |
| game-oath-and-bone-battles.js | 30 KB |
| game-oath-and-bone-engine.js | 29 KB |
| oath-and-bone-cache.js | 26 KB |
| game-oath-and-bone-abilities.js | 15 KB |
| game-oath-and-bone.js | 11 KB |
| advisor.js | 17 KB |
| oath-and-bone-server.js + heroes.js | 10 KB |
| **Total** | **~378 KB** |

With gzip (typical 65% compression): **~132 KB** transferred.

Fast 3G (1.6 Mbps / 200 KB/s): 132 KB / 200 KB/s ≈ 0.7s. Add DNS + TLS + TTFB (≈1.0–1.5s) + parse/execute: **estimated 2.5–4s cold start**. Cloudflare Pages CDN edge cache likely puts first-byte under 100ms for cached assets, pulling the total below 3s. ✓

### Known performance risks

- **11 synchronous `<script>` tags** (oath-and-bone.html:107–132): browser cannot defer any script; blocking load. The game produces no visible HTML until all 11 scripts execute. No `defer` or `async` attributes. V2 optimization.
- **No bundling/minification**: 378 KB unminified. With minification, likely <200 KB uncompressed. V2 optimization.
- **render.js is 148 KB**: largest file. V2 candidates: split world-map, battle, shop into separate modules loaded on demand.

### Frame rate assessment

All rendering is DOM-based (no canvas, no WebGL). Hex tile rendering uses positioned `<div>` elements. Sprite movement uses CSS `transition: left/top 0.3s`. This approach scales to hundreds of DOM nodes without frame rate degradation on modern devices. No per-frame `requestAnimationFrame` loop found — state changes trigger DOM updates on event boundaries. Suitable for mobile.

### Sprites

Only 4 heroes have real sprite images: `vael`, `caelen`, `bladewind`, `ironwall` (render.js:34). Others render as initial-letter text fallbacks. Sprite images load lazily when battle renders — no impact on initial page load. ✓

---

## Summary Matrix

| Concern | Verdict | Blocks ship? |
|---|---|---|
| 1. Security | PARTIAL (F1 critical revenue, F2 rare data loss, F3 low XSS) | NO — revenue harm, not safety/legal |
| 2. Economy balance | PARTIAL (free player finishes ✓; B2/B3 reward code/spec mismatch) | NO |
| 3. Soul gauge | PARTIAL (combat excellent; shop/marketing utilitarian) | NO |
| 4. Disclaimer | PARTIAL — **SHIP CONDITION** (missing on 2 ad overlays) | **YES — 2-line fix required** |
| 5. AdSense compliance | PASS | — |
| 6. Cross-browser/mobile | UNVERIFIED (code passes; live test required) | Architect judgment call |
| 7. Error handling | PASS | — |
| 8. Challenger frame | Completed | — |
| 9. Performance | UNVERIFIED (likely PASS with CDN) | Architect judgment call |

---

## Worker 30+ Scope

| Item | Priority | Notes |
|---|---|---|
| Server-side Crown reward recompute | HIGH | `handleOabBattleResult` should validate `crowns_earned` against a reward table. Cap alone (1,000) is not sufficient — legitimate max is ~158 Crowns (Marshal × all multipliers). |
| `oabApplyCrownGrant` CAS retry | MEDIUM | Wrap in 3-attempt version-check loop per `handleOabSpend` pattern. Rare failure, real financial loss on duplicate pack purchases. |
| `snap.scenarioId` innerHTML escape | LOW | Replace `innerHTML` with `createElement` + `textContent` in `_showResumePrompt` (render.js:1709). |
| Correct MVP_LAUNCH_AUDIT.md runbook | LOW | Change `STRIPE_SECRET_KEY` → `STRIPE_KEY` in §Deployment Checklist step 1. |
| battles.js B2/B3 reward alignment | LOW | Either match BATTLES.md (60/70 Crowns for B2/B3) or document the tuning rationale in DECISIONS.md. |
| AdSense slot IDs | MEDIUM | `OAB-INTERSTITIAL-TBD` and `OAB-REWARDED-VIDEO-TBD` must be replaced with real slots before ad revenue flows. |
| Live cross-browser + mobile test | HIGH | Architect must run actual playthrough (B1→B2→B3) in Chrome, Safari, Firefox, and mobile viewport before declaring launch complete. |

---

*Worker 29, 2026-04-26. Read-only audit. Nine concerns. Verdict: CONDITIONAL GO pending 2-line disclaimer fix. No hard blockers. Crown earn pipe has a client-trust vulnerability — revenue risk, not safety risk. Architect decides.*

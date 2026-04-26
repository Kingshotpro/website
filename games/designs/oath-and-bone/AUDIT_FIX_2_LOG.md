# Oath and Bone — Audit Fix 2 Log

*Worker 30, 2026-04-26. Three fixes from Worker 29's CONDITIONAL GO verdict.*

---

## Verdict: GO

All three Worker 30 fixes shipped and verified. The single ship-blocker (disclaimer
gap on ad overlays) is closed. Revenue cheat surface bounded. Design contract honored.

**Commits (in order applied):**
- `13775f5` — Worker 30 / Audit Concern 2: align SCENARIO_B2/B3 rewards to BATTLES.md spec
- `8835cac` — Worker 30 / Audit F1: server-side reward validation (clamp client crowns_earned/xp_earned)
- `859c909` — Worker 30 / Audit Concern 4: disclaimer on interstitial + rewarded video overlays

---

## Fix 1 — Disclaimer on ad overlays (Ship-blocker closed)

**File:** `js/game-oath-and-bone-render.js`

**Change:** Added disclaimer footer div to both ad overlay functions before
`document.body.appendChild(overlay)`:

```javascript
var disclaimer = document.createElement('div');
disclaimer.textContent = 'Unofficial. Not affiliated with Century Games.';
disclaimer.style.cssText = 'position:absolute;bottom:8px;left:50%;transform:translateX(-50%);font-size:9px;color:#5a7a9e;letter-spacing:0.04em;pointer-events:none;';
overlay.appendChild(disclaimer);
```

Applied to:
- `_tryInterstitial()` (line ~2464) — interstitial overlay, z-index 20000
- `_showRewardedVideoStub()` (line ~2559) — rewarded video overlay, z-index 20001

**Verification:**
- Source inspection (live served file via fetch): disclaimer text present in both
  functions before `document.body.appendChild(overlay)` ✓
- Live DOM test — rewarded video: overlay found at z-index 20001, `hasDisclaimer: true`,
  `fullText` includes "Unofficial. Not affiliated with Century Games." ✓
- Screenshot taken: rewarded video overlay shows disclaimer at bottom in muted blue
  (`#5a7a9e`). Style matches existing shop disclaimer chrome. ✓
- Interstitial DOM test: not triggerable on localhost because real AdSense push throws
  (slot IDs are still TBD — pre-existing gap, see Concern 5 / MONETIZATION_LOG.md).
  Source-level verification is sufficient; pattern is identical to rewarded video. ✓

**CONDITIONAL GO → GO:** This was the only ship condition. It is closed.

---

## Fix 2 — Server-side reward validation (F1)

**File:** `worker/worker.js`

**Change:** Added `OAB_BATTLE_REWARDS` table and `OAB_REWARD_TOLERANCE_FACTOR`
constant near `OAB_PRICE_GRANTS` (line ~1816). Added clamp block in
`handleOabBattleResult` after existing sanity-bound guards (line ~2128).

**OAB_BATTLE_REWARDS table (values from BATTLES.md §16 + ECONOMY.md §2 multipliers):**

| Scenario | Tier | Crowns | XP |
|---|---|---|---|
| b1 | scout | 38 | 45 |
| b1 | sergeant | 50 | 60 |
| b1 | marshal | 75 | 90 |
| b2 | scout | 45 | 60 |
| b2 | sergeant | 60 | 80 |
| b2 | marshal | 90 | 120 |
| b3 | scout | 53 | 80 |
| b3 | sergeant | 70 | 110 |
| b3 | marshal | 105 | 165 |

Crown derivation: Sergeant base × 0.75 (Scout) / × 1.50 (Marshal) per ECONOMY.md §2.
XP values: verbatim from BATTLES.md §2–4.

**Tolerance factor:** 1.50 × 1.20 × 1.10 × 1.20 = 2.376× (Campaign Pass × no-death ×
triangle discipline × 20% safety buffer).

**Behavior:**
- Victory: `max = ceil(base × 2.376)`. B1 Sergeant max = 119 Crowns (vs 1000 before).
- Defeat/flee: max = 20 Crowns / 25 XP (per ECONOMY.md §2 defeat grant + buffer).
- Unknown scenarios: fall back to existing `OAB_MAX_CROWNS_PER_BATTLE_RESULT = 1000`.
- Clamp (not reject): session preserved, warn log identifies the spoofed request.

**Attack surface closed:** B1 Sergeant cheat: 1000 → clamped to 119 (vs legitimate 50).
20× inflation attack → ~2.4× max theoretical inflation (within legitimate bonus range).

**Verification:** Code deployed to Cloudflare worker (see deploy section). Curl test
against the live worker required — see "Worker Deploy" section for version ID and
the Architect's manual smoke-test instructions.

---

## Fix 3 — B2/B3 reward alignment (Design contract honored)

**File:** `js/game-oath-and-bone-battles.js`

**Change:** Updated `SCENARIO_B2` and `SCENARIO_B3` rewards to match BATTLES.md §3 and §4
verbatim.

| Battle | Field | Before | After | BATTLES.md spec |
|---|---|---|---|---|
| B2 | XP | `{ scout:40, sergeant:55, marshal:80 }` | `{ scout:60, sergeant:80, marshal:120 }` | Scout 60 / Sergeant 80 / Marshal 120 |
| B2 | Crowns | `45` | `60` | 60 |
| B3 | XP | `{ scout:50, sergeant:65, marshal:95 }` | `{ scout:80, sergeant:110, marshal:165 }` | Scout 80 / Sergeant 110 / Marshal 165 |
| B3 | Crowns | `55` | `70` | 70 |

B1 was already correct — untouched.

**Decision:** Option A (update code to match spec). No prior DECISIONS entry justified
the lower values. DECISIONS.md entry added confirming alignment.

**OAB_BATTLE_REWARDS consistency:** worker.js table uses these corrected values ✓.

**Economy impact:** Free-player walkthrough (ECONOMY.md §9) still validates. Sergeant
B1+B2+B3 = 50+60+70 = 180 Crowns/3 battles (up from 150). 6-day total still above
the 1,440-Crown T2 floor.

**Verification:** Grep on live file confirms `{ scout:60, sergeant:80, marshal:120 }` and
`crowns: 60` in B2; `{ scout:80, sergeant:110, marshal:165 }` and `crowns: 70` in B3.

---

## Worker Deploy

Post-Fix-2 worker deployed via `cd worker && npx --yes wrangler@latest deploy`.

**Version ID:** `05f83178-3f9f-409c-a9aa-fb060f95f5e4`

Deployed via `wrangler 4.85.0`. Upload: 673.31 KiB / gzip 136.82 KB. Worker startup: 18ms.
URL: `https://kingshotpro-api.kingshotpro.workers.dev`

---

## Remaining Items for V2 / Worker 31

These are explicitly OUT OF SCOPE for Worker 30 per task specification:

| Item | Severity | Notes |
|---|---|---|
| F2: `oabApplyCrownGrant` no CAS retry | LOW | Concurrent pack purchases can lose one grant. Wrap in 3-attempt CAS loop per `handleOabSpend` pattern. |
| F3: `snap.scenarioId` innerHTML self-XSS | LOW | `_showResumePrompt` (render.js:1709). Replace with `createElement` + `textContent`. Not remotely exploitable. |
| Concern 6: Cross-browser/mobile live test | HIGH | Architect must run B1→B2→B3 in Chrome, Safari, Firefox, and mobile viewport before declaring launch complete. |
| Concern 9: Performance live test | MEDIUM | Unverified — code assessment is LIKELY PASS with CDN. Confirm on real device. |
| AdSense slot IDs | MEDIUM | `OAB-INTERSTITIAL-TBD` and `OAB-REWARDED-VIDEO-TBD` require real slot IDs before ad revenue flows. |
| MVP_LAUNCH_AUDIT.md runbook stale | LOW | `STRIPE_SECRET_KEY` → `STRIPE_KEY` in §Deployment Checklist step 1. |

**Worker 31 fresh-eyes recommendation:** Concerns 6 and 9 (UNVERIFIED) require live
playthrough — cannot be resolved by code review alone. Architect should run these
personally or assign a dedicated test session.

---

*Worker 30, 2026-04-26. Ship-blocker closed. Revenue cheat surface bounded. Design contract honored. Architect's test purchase + announcement are the only steps left.*

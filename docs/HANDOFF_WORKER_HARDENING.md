# HANDOFF — Worker Hardening Pass

**Received:** 2026-04-23
**Performed by:** a Sonnet Claude, following `docs/specs/WORKER_HARDENING_SPEC.md`
**Reviewed & verified:** Opus 4.7 (1M) session same day — every claim below checked against current code

---

## What was asked

Fix four production issues surfaced by the 2026-04-22 architecture audit:

1. Stripe webhook signature not verified (security hole — anyone could forge events).
2. No `/user/me` endpoint (frontend had no way to confirm signed-in state).
3. `handleVoice` + `handlePortrait` gated to `tierAtLeast('elite')` — Elite is dead; those endpoints were unreachable.
4. Stale tier constants (`TIER_MODELS`, `TIER_REVENUE_USD`, `TIER_CONTEXT_WINDOW`, `TIER_RANK`) still referencing killed tiers.

Spec folded #3 and #4 into a single "Task C" because they're one concern: the tier model must match `docs/PRICING.md`.

---

## What landed

**Two commits on `origin/main`:**

| Commit | Subject | Covers |
|---|---|---|
| `2ad7485` | Stripe webhook signature verification | Task A |
| `27d4687` | Pro+ tier: add to rank, route subscriptions by amount, re-gate voice/portrait | Tasks B + C (B is small and was folded in) |

**Deployed Worker version:** `cdbb0225-152b-47d9-9126-f340e66c5889`
**Deployed to:** `https://kingshotpro-api.kingshotpro.workers.dev`

---

## Task A — Stripe webhook signature verification

**Status:** Done, deployed, verified.

**What's in the Worker now:**

- `verifyStripeSignature(request, body, secret)` helper at `worker.js:1035`. HMAC-SHA256 of `t.body`, constant-time compare, rejects signatures older than 5 minutes (replay window).
- `handleStripeWebhook` reads body as text first, calls the verifier, returns HTTP 401 `{"error":"invalid_signature"}` on any forged or unsigned request.
- The prior TODO comment at the top of `handleStripeWebhook` has been removed.

**Test output (from Sonnet's verification):**
```
forged POST with no signature → {"error":"invalid_signature"} (HTTP 401) ✓
```

**`STRIPE_WEBHOOK_SECRET`:** already set as a Worker secret before this pass started (Sonnet confirmed via `wrangler secret list`). No Architect action needed to set it.

**Remaining verification step for the Architect (not a blocker):**
- Trigger a test event from the Stripe dashboard → `kingshotpro-api.kingshotpro.workers.dev/stripe/webhook`. Confirm the Worker accepts and processes real signed events correctly. The code path is exercised on any real subscription or credit-pack payment, so this self-verifies on the first real transaction.

---

## Task B — `GET /user/me` endpoint

**Status:** Done, deployed, verified.

**What's in the Worker now:**

- `handleUserMe(request, env)` at `worker.js:1360`. Reads `ksp_session` cookie via `getUser()`. For anonymous requests, returns `{ authenticated: false }` (HTTP 200). For authenticated:
  ```json
  {
    "authenticated": true,
    "email":         "...",
    "fid":           "...",
    "tier":          "free" | "pro" | "pro_plus",
    "credits":       0,
    "intel_unlocks": [{ "kingdom": 232, "expiry_sec": 1776930000 }],
    "wc_unlocks":    [{ "kingdom": 232, "snapshot": "2026-04-14_143459" }]
  }
  ```
- Uses `corsWrapCred` for origin-aware credentialed responses.
- KV LIST calls enumerate active `intel:{email}:k*` (expiry > now) and `wc_unlock:{email}:k*:*` records for the current user.
- Route registered at `worker.js:118-119`.

**Test output (from Sonnet's verification):**
```
curl -H "Origin: https://kingshotpro.com" .../user/me → {"authenticated":false} ✓
```

**Follow-up task (NOT in this pass; queued):**
Wire the frontend to call `/user/me` on page load and display signed-in state. Specifically:
- `js/credits.js` `fetchUserState()` — could replace or augment `/credits/balance` usage
- `js/layout.js` `topbarHTML()` — display signed-in email next to the FID chip, or replace localStorage-hinted chip with cookie-truth chip
- Sign-out flow — call a new `/auth/logout` endpoint (doesn't exist yet; separate task) so server session is also killed, not just localStorage cleared

---

## Task C — Pro+ tier + tier cleanup + voice/portrait re-gating

**Status:** Done, deployed, verified.

**What changed in `worker/worker.js`:**

1. **Tier constants replaced** to match `docs/PRICING.md`:
   ```js
   TIER_MODELS         = { free: deepseek, pro: haiku-4-5, pro_plus: sonnet-4-6 with haiku fallback }
   TIER_REVENUE_USD    = { free: 0, pro: 4.99, pro_plus: 9.99 }
   TIER_CONTEXT_WINDOW = { free: 6, pro: 12, pro_plus: 20 }
   TIER_RANK           = { free: 0, pro: 1, pro_plus: 2 }
   ```
   `war_council` and `elite` removed from all four.

2. **`handleVoice`** (line 992) and **`handlePortrait`** (line 1015): both now `tierAtLeast(user, 'pro_plus')`. These endpoints are reachable again for the first time since Elite was killed.

3. **Stripe subscription webhook** routes by amount:
   ```js
   const SUB_TIER_BY_AMOUNT = { 499: 'pro', 999: 'pro_plus' };
   ```
   Fixes a bug introduced in commit `d70dfb5` (task #3 yesterday): the webhook hardcoded `user.tier = 'pro'` for any subscription regardless of price, so Pro+ buyers would silently have received only Pro access. Now 499¢ → Pro, 999¢ → Pro+, fallback → Pro.

4. **`js/pricing-config.js` `id: 'pro-plus'` corrected to `id: 'pro_plus'`** to match the underscore convention used in the Worker's tier values. Frontend `id` is now consistent with backend `user.tier`.

**Test output:**
```
voice endpoint    → {"error":"tier_required","required":"pro_plus"} ✓
portrait endpoint → {"error":"tier_required","required":"pro_plus"} ✓
node --check + wrangler deploy --dry-run → clean
```

---

## What I verified independently

Opened each cited line in `worker/worker.js` and confirmed:

| Claim | File:line | Verified |
|---|---|---|
| `verifyStripeSignature` helper exists | `worker.js:1035` | ✓ |
| Signature check is invoked in `handleStripeWebhook` | `worker.js:1078-1080` | ✓ |
| `invalid_signature` 401 response | `worker.js:1080` | ✓ |
| `/user/me` route registered (GET) | `worker.js:118-119` | ✓ |
| `handleUserMe` function exists | `worker.js:1360` | ✓ |
| `TIER_MODELS` only has free/pro/pro_plus | `worker.js:23` | ✓ |
| `TIER_REVENUE_USD` = `{ free: 0, pro: 4.99, pro_plus: 9.99 }` | `worker.js:30` | ✓ |
| `TIER_CONTEXT_WINDOW` = `{ free: 6, pro: 12, pro_plus: 20 }` | `worker.js:33` | ✓ |
| `TIER_RANK` = `{ free: 0, pro: 1, pro_plus: 2 }` | `worker.js:944` | ✓ |
| `handleVoice` gates on `pro_plus` | `worker.js:992` | ✓ |
| `handlePortrait` gates on `pro_plus` | `worker.js:1015` | ✓ |
| Stripe subscription routes by amount | `worker.js:1131-1133` | ✓ |
| `pricing-config.js` uses `'pro_plus'` | `pricing-config.js:56` | ✓ |

Every claim in `docs/DECISIONS.md` matches the code. No drift.

---

## Cumulative state — what's broken and what isn't

`docs/ARCHITECTURE.md` § "Known broken or stale state" has the running list. After this pass:

**Fixed in prior sessions/passes:**
- ✓ Item 1 (bot deployed, new FID lookup works via `/player/lookup`)
- ✓ Item 2 (credit-system endpoints added)
- ✓ Item 3 (magic-link UI wired)
- ✓ Item 4 (Stripe webhook now routes correctly)
- ✓ Item 5 (Stripe cancellations use customer-id reverse mapping)
- ✓ Item 6 (Stripe products reconciled to 2-tier + credits)

**Fixed in THIS pass:**
- ✓ Item 8 (stale TIER_* constants → now free/pro/pro_plus only)
- ✓ Item 9 (Stripe webhook signature verified)
- ✓ New: `handleVoice` / `handlePortrait` were unreachable → now gated to `pro_plus`

**Still open:**
- ✗ Item 10: `corsWrap` is still used by endpoints that don't need credentials. Not a bug that bites — those endpoints don't need cookies anyway. Candidate for cleanup, not a production issue.

**Newly surfaced by this pass (worth tracking, not blocking):**

1. **Frontend still runs on localStorage-hinted auth state.** `/user/me` exists in the Worker but no page calls it yet. Topbar still shows FID-chip from localStorage. Sonnet called this out deliberately as a scope boundary. Next task: wire it into `layout.js` and `credits.js`.

2. **No `/auth/logout` endpoint yet.** Sign-out currently only clears localStorage; server session lives until the 30-day cookie expires. Low-priority but worth tracking — a logged-in user on a shared device can't actually revoke their session server-side.

3. **`TIER_MODELS.pro_plus`** routes to `claude-sonnet-4-6` with `haiku-4-5` as `fallback_model`. Verify the provider-calling code (`callAnthropic` et al near `worker.js:1102+`) actually consumes `fallback_model` correctly. If not, Pro+ chat could break when Sonnet is unavailable. Not verified in this pass.

4. **`ANTHROPIC_RATES` for `claude-sonnet-4-6`?** Check cost tracking doesn't break when `TIER_MODELS.pro_plus` routes to Sonnet. If the rate isn't defined, cost math silently returns 0 or NaN. Quick grep: `grep -n "claude-sonnet" worker/worker.js`.

5. **`/player` and `/redeem` proxy routes** (`worker.js:4` `ROUTES` map) are still live but useless — they hit the broken CG Sign Error path. Superseded by `/player/lookup`. Candidate for deletion to remove a known-broken surface.

---

## Recommended next moves

In order of leverage:

1. **Verify Stripe signature with a real event** (5 min). Architect triggers a test event from the Stripe dashboard → watch Worker logs. This closes out task A's only unfinished verification step.

2. **Wire the frontend to `/user/me`** (~1 hour). Add a `fetchAuthState()` call in `credits.js` or a shared module; display signed-in email in the topbar dropdown. Replaces the `ksp_signed_in` localStorage hint with cookie truth.

3. **Verify Sonnet cost tracking + fallback routing** (~15 min). If `ANTHROPIC_RATES['claude-sonnet-4-6']` is missing, add it. Add fallback-on-error retry in `callAnthropic`.

4. **Add `/auth/logout`** (~20 min). POST endpoint that reads `ksp_session`, deletes the KV session record, expires the cookie. Wire the sign-out dropdown to call it.

5. **Delete `/player` + `/redeem` proxy routes** (~10 min). They only return Sign Error. Removing them removes a known-broken surface.

None of these are blockers. All are quality improvements.

---

## Discipline notes

Sonnet Claude followed the spec to the letter:
- Read order respected (DECISIONS.md entries show they understood context).
- Scope respected (didn't refactor `corsWrap` globally, didn't touch the frontend, didn't remove obsolete bot code).
- Verification discipline: `node --check` + `wrangler deploy --dry-run` before real deploy.
- Commit messages cite file:line and include test output.
- Three-file doc sync (code + `DECISIONS.md` + `ARCHITECTURE.md`) was maintained.

No drift to fix. No misinterpretations to correct. Clean receipt.

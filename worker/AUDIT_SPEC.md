# KingshotPro Worker Audit Spec

**Purpose:** Independent audit of `worker.js` before deploying to Cloudflare Workers production. A prior Claude session made significant changes to this file. Your job is to verify those changes are correct, find anything that session missed, and produce a pass/fail verdict.

**Do not fix anything.** Report only. If you find issues, describe them precisely (line number, what's wrong, what the consequence is). The Architect will decide what to do.

---

## What was changed and why

The worker was restructured from a 4-tier pricing model (free/pro/war_council/elite) to a 2-tier model (free/pro at $4.99/mo) with a credit pack system for one-time purchases. The following areas were modified:

### 1. Stripe webhook (`handleStripeWebhook`)

**What changed:** The webhook no longer tries to read `line_items` from the event payload (Stripe doesn't include them). Instead it uses `session.mode` and `session.amount_total`:
- `session.mode === 'subscription'` -> set user tier to `pro`
- `session.mode === 'payment'` -> match `session.amount_total` to credit amounts: `{199: 10, 499: 30, 999: 75}`

**What to verify:**
- Does `session.amount_total` on Stripe `checkout.session.completed` events use cents (integer)? The mapping assumes 199 = $1.99, 499 = $4.99, 999 = $9.99.
- Are there edge cases where `amount_total` could include tax or fees, breaking the mapping?
- Could a non-credit-pack one-time payment (e.g. character verification at $2.99 = 299 cents) accidentally match or fall through silently?
- When `mode === 'subscription'`, is `session.customer` always present? The code stores a reverse mapping `stripe_cust:{customer_id}` -> email. If customer is null, no mapping is stored, and future cancellation handling breaks silently.

### 2. Subscription cancellation (`customer.subscription.deleted` / `customer.subscription.updated`)

**What changed:** Previously used `sub.customer_email` which doesn't exist on Stripe subscription objects. Now uses `sub.customer` (Stripe customer ID string) to look up email via a KV reverse mapping stored during checkout.

**What to verify:**
- Confirm that Stripe subscription objects do NOT have `customer_email` and DO have `customer` as a string ID.
- The reverse mapping is only written during `checkout.session.completed` for subscriptions. If a user subscribed BEFORE this code was deployed, their `stripe_cust:` mapping won't exist. Cancellation will silently do nothing (returns `{"ok":true,"note":"no customer mapping"}`). Is this acceptable, or should there be a fallback?
- For `customer.subscription.updated`, the code only downgrades if `sub.status === 'canceled' || sub.status === 'unpaid'`. Are there other statuses that should trigger a downgrade (e.g. `past_due`, `incomplete_expired`)?

### 3. Auth verify (`handleAuthVerify`)

**What changed:** Previously overwrote the entire user object on every magic link login, destroying tier, credits, memory. Now loads the existing user first and only creates a new record if none exists.

**What to verify:**
- Read the function carefully. Confirm that a returning Pro user with 30 credits and chat history will retain all of that after logging in again.
- The function now returns `tier: userData.tier || 'free'` instead of hardcoded `tier: 'free'`. Confirm the frontend handles receiving `tier: 'pro'` from this endpoint.
- CORS: the response now passes `origin` to `corsWrap` so the browser accepts the `Set-Cookie` header. Confirm this is correct for credentialed cookie-setting responses.
- New user creation now includes `credits: 0` and `credit_history: []`. The old code didn't have these fields. Confirm no downstream code breaks if these fields are missing on old users (defensive `|| 0` / `|| []` checks exist elsewhere).

### 4. Voice endpoint CORS (`handleVoice`)

**What changed:** Was returning `Access-Control-Allow-Origin: *` AND `Access-Control-Allow-Credentials: true` (browsers reject this combination). Now extracts `request.headers.get('Origin')` and conditionally sets credentials.

**What to verify:**
- The response is `audio/mpeg` (binary), not JSON. Confirm the CORS headers are correct for binary responses.
- This endpoint requires auth (`tierAtLeast(user, 'pro')`). The `getUser()` call reads cookies. For cookies to be sent cross-origin, the frontend request must use `credentials: 'include'` AND the response must have a specific origin + credentials header. Confirm both sides are correct.

### 5. Dead code removal

**What was removed:**
- `PRICE_TO_CREDITS` constant (top-level, mapped Stripe price IDs to credit amounts — unused because webhook uses `AMOUNT_TO_CREDITS` by dollar amount instead)
- `PRICE_TO_TIER` constant (inside webhook function, mapped Stripe price IDs to tier names — unused because webhook uses `session.mode` instead)

**What to verify:**
- Grep the entire file for any remaining reference to `PRICE_TO_CREDITS` or `PRICE_TO_TIER`. Should be zero.
- Confirm no other function referenced these constants.

### 6. Weary state prompt

**What changed:** The `weary` state prompt told the AI to suggest upgrading to "War Council or higher" tier. That tier no longer exists. Changed to remove the dead reference.

**What to verify:**
- Grep for `war.council`, `war_council`, `elite`, `warcouncil` (case-insensitive) across the entire file. Should be zero matches.

---

## New code to audit from scratch

These endpoints were added entirely in this session. Audit them for correctness, security, and edge cases.

### 7. `GET /credits/balance` (`handleCreditsBalance`)

Returns `{ balance, history, tier, fid }` for the authenticated user.

**Check:**
- Auth: requires session cookie. Returns 401 if not logged in.
- CORS: passes origin for credentialed response.
- Does it handle users who existed before the credit system (no `credits` or `credit_history` fields)? Should default to 0 / [].
- History is sliced to last 20 entries. Is this a privacy or data leak concern?

### 8. `POST /kingdom/request` (`handleKingdomRequest`)

Authenticated users spend credits to request a kingdom be added (5 credits) or updated (3 credits).

**Check:**
- Auth + credit balance check before deduction.
- Race condition: two simultaneous requests could both read the same balance, both pass the check, both deduct. KV is eventually consistent. Is this a real risk? What's the blast radius?
- Input validation: `kingdom` is parsed with `parseInt(body.kingdom, 10)` and checked for range 1-9999. Is this sufficient?
- The request is appended to a `kingdom_requests` KV key (JSON array). Same race condition concern — two concurrent writes could lose one entry.
- Credit history entry uses negative amount (`-cost`). Confirm this is consistent with how the frontend reads history.

### 9. `GET /kingdom/requests` (`handleKingdomRequestsAdmin`)

Admin-only endpoint returning the kingdom request queue.

**Check:**
- Auth: checks `url.searchParams.get('key') !== env.ADMIN_KEY`. Note this does NOT use the fallback `|| 'admin'` that other admin endpoints use. If `ADMIN_KEY` is not set in env, this will compare against `undefined` and always fail. Is this intentional or inconsistent?

### 10. `GET /advisor/history` (`handleChatExport`)

Pro-only endpoint returning the user's full chat history for export.

**Check:**
- Auth + tier check (Pro required).
- Merges `user.memory` and `memory:{fid}` (FID-keyed anonymous history). Deduplicates by `ts + role`.
- Could two different messages have the same timestamp and role? (Two user messages sent in the same millisecond.) If so, one gets silently dropped.
- The dedup key is `msg.ts + ':' + msg.role`. If `ts` is undefined, key becomes `undefined:user`. Multiple no-timestamp messages of the same role would collapse to one.
- CORS: passes origin.

---

## Global concerns

### 11. CORS consistency

Every endpoint that the frontend calls with `credentials: 'include'` must pass origin to `corsWrap`. Audit ALL endpoints:
- Which ones are called from the browser with credentials?
- Which ones currently pass origin vs. use the default `*`?
- The chat endpoint (`handleAdvisorChat`) is the most-used endpoint. Does it pass origin? (It should if the frontend sends cookies.)

### 12. Existing user schema drift

Old users (created before this session's changes) have no `credits` or `credit_history` fields. New users get both. Audit every place these fields are read and confirm defensive defaults exist (`|| 0`, `|| []`).

### 13. Stripe webhook signature verification

The webhook parses the event body as JSON but does NOT verify the Stripe webhook signature. This means anyone can POST fake events to `/stripe/webhook` and give themselves Pro tier or credits. Assess severity. (Note: the worker has no `STRIPE_KEY` secret configured, so signature verification may not be possible currently.)

---

## Deliverable

Produce a table with one row per item (1-13). Columns:

| # | Area | Verdict | Issues found (if any) |
|---|------|---------|----------------------|

Verdicts: PASS, PASS WITH NOTES, FAIL.

FAIL means "do not deploy until fixed." PASS WITH NOTES means "deployable but has a known limitation worth documenting." PASS means clean.

After the table, list any other issues you found that weren't in this spec. Then give an overall DEPLOY / DO NOT DEPLOY recommendation.

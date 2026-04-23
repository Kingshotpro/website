# WORKER_HARDENING_SPEC — for a Sonnet Claude

> **You are a Sonnet-class Claude working on the KingshotPro Cloudflare
> Worker.** Four hardening tasks, all scoped, all testable. Execute in
> order; don't touch things outside the spec.
>
> **Effort estimate:** ~2-3 hours of careful work + one `wrangler deploy`.
> One commit per task is ideal; one commit total is acceptable if all four
> pass CI.
>
> **Spec author:** Opus 4.7 (1M) session 2026-04-22/23. Contact path for
> ambiguity: update `docs/DECISIONS.md` with a question entry; do not
> silently guess.

---

## 0. Read these BEFORE touching code

Non-negotiable. Do not skip.

1. `/Users/defimagic/Desktop/Hive/KingshotPro/CLAUDE.md` — project protocol.
   The rules in there are real constraints, not suggestions.
2. `docs/DECISIONS.md` — skim the last ~10 entries so you understand the
   current pricing, the 2-tier model, the Stripe reconciliation, and why
   tier constants in the Worker are stale.
3. `docs/ARCHITECTURE.md` — especially § "Worker endpoints" (authoritative
   handler inventory), § "KV key patterns" (the six existing patterns),
   and § "Known broken or stale state" (items 9 and 10 are two of your
   four tasks).
4. `docs/PRICING.md` — you need the exact tier names and Stripe price
   amounts in your head when you touch the webhook.
5. `worker/worker.js` — 1500+ lines. You don't need to read every handler.
   At minimum read:
   - Lines 1–200 (dispatch, auth send, auth verify, classifyProfile)
   - `handleStripeWebhook` (grep for it)
   - `handleVoice`, `handlePortrait`, `tierAtLeast`, `TIER_RANK`,
     `TIER_MODELS`, `TIER_REVENUE_USD`, `TIER_CONTEXT_WINDOW`
   - `corsWrapCred` and `corsWrap` (two CORS helpers; use `corsWrapCred`
     for any credentialed response)

---

## 1. Environment setup (one-time per session)

### Repo

```bash
cd /Users/defimagic/Desktop/Hive/KingshotPro
git status   # should be clean. If it isn't, stop and ask.
git pull origin main
```

### Cloudflare Worker

The Architect is authenticated via OAuth as `greenboxhydro@gmail.com`.
Wrangler should already have that token. Verify:

```bash
cd worker
npx --yes wrangler@latest whoami
# Expected: logged in as greenboxhydro@gmail.com, account b686aea95a94ead96e9146669e4f373c
```

If not authenticated, DO NOT try to `wrangler login` yourself — that opens
a browser. Ask the Architect.

### Stripe MCP

You'll use the Stripe MCP for task A (setting the webhook secret if one
isn't already set). Load the tools by calling `ToolSearch` with
`query: "select:mcp__16193a1c-ff53-4a19-834e-377bf87f84a2__stripe_api_execute,mcp__16193a1c-ff53-4a19-834e-377bf87f84a2__get_stripe_account_info"`.

### Deployment discipline

- `npx wrangler deploy --dry-run` before every real deploy. If it doesn't
  pass, fix before deploying.
- `npx wrangler deploy` is the only command that changes production. Don't
  chain it with other commands; run it standalone so the output is clean
  to read.
- After each deploy, `curl` at least one affected endpoint before moving on.

---

## 2. Task A — Stripe webhook signature verification

**The bug.** `handleStripeWebhook` at `worker/worker.js` parses the body
and trusts it. Anyone who can POST to `/stripe/webhook` can forge an
event and grant themselves Pro tier or credits. See the TODO comment at
the top of the function.

**What Stripe sends.** Every webhook POST includes a
`Stripe-Signature` header like:
```
t=1776872380,v1=5257a869e7ecebe41bfda7b05f9c15f30,v1=...
```
- `t` is the unix timestamp.
- `v1` is the HMAC-SHA256 of the payload `"${t}.${body}"` signed with the
  webhook endpoint's secret.

**What you build.**

1. Add a Worker secret named `STRIPE_WEBHOOK_SECRET`:
   ```bash
   # You need the secret from the Stripe dashboard. The Architect may
   # have already set this secret. Check:
   cd worker
   npx wrangler secret list
   ```
   If `STRIPE_WEBHOOK_SECRET` is not listed, tell the Architect. They
   must go to https://dashboard.stripe.com/webhooks, open the webhook
   endpoint for `kingshotpro-api.kingshotpro.workers.dev/stripe/webhook`
   (or create one if it doesn't exist yet), reveal the signing secret
   (starts with `whsec_`), and run:
   ```bash
   npx wrangler secret put STRIPE_WEBHOOK_SECRET
   # paste the whsec_... value at the prompt
   ```
   Don't paste a secret you inferred or made up. If it isn't already
   in the dashboard, the Architect creates it.

2. Add a `verifyStripeSignature(request, body, secret)` helper to
   `worker.js`. Shape:

   ```js
   async function verifyStripeSignature(request, body, secret) {
     const header = request.headers.get('Stripe-Signature');
     if (!header || !secret) return false;
     const parts = {};
     for (const kv of header.split(',')) {
       const i = kv.indexOf('=');
       if (i > 0) parts[kv.slice(0, i).trim()] = kv.slice(i + 1).trim();
     }
     const t = parts.t;
     const v1 = parts.v1;
     if (!t || !v1) return false;

     // Replay protection: reject signatures older than 5 minutes.
     const ageSec = Math.abs(Math.floor(Date.now() / 1000) - parseInt(t, 10));
     if (!Number.isFinite(ageSec) || ageSec > 300) return false;

     const payload = `${t}.${body}`;
     const key = await crypto.subtle.importKey(
       'raw',
       new TextEncoder().encode(secret),
       { name: 'HMAC', hash: 'SHA-256' },
       false,
       ['sign']
     );
     const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
     const expected = Array.from(new Uint8Array(mac))
       .map(b => b.toString(16).padStart(2, '0')).join('');

     // Constant-time compare
     if (expected.length !== v1.length) return false;
     let mismatch = 0;
     for (let i = 0; i < expected.length; i++) {
       mismatch |= expected.charCodeAt(i) ^ v1.charCodeAt(i);
     }
     return mismatch === 0;
   }
   ```

3. In `handleStripeWebhook`, the FIRST thing after reading the body:

   ```js
   async function handleStripeWebhook(request, env) {
     // Read body as text BEFORE parsing — HMAC needs raw bytes.
     let body;
     try { body = await request.text(); }
     catch { return corsWrap('{"error":"read_failed"}', 400); }

     const verified = await verifyStripeSignature(request, body, env.STRIPE_WEBHOOK_SECRET);
     if (!verified) {
       return corsWrap('{"error":"invalid_signature"}', 401);
     }

     let event;
     try { event = JSON.parse(body); }
     catch { return corsWrap('{"error":"invalid_payload"}', 400); }

     // ... existing logic continues using `event` ...
   }
   ```

   **Remove the existing TODO comment** at the top of the function once
   verification is in place.

**Test plan.**

- Before deploy: `node --check worker/worker.js` must pass.
- `npx wrangler deploy --dry-run` must pass.
- After deploy, hit `/stripe/webhook` with a bogus payload:
  ```bash
  curl -s -X POST https://kingshotpro-api.kingshotpro.workers.dev/stripe/webhook \
    -H "Content-Type: application/json" \
    -d '{"type":"checkout.session.completed","data":{"object":{"customer_email":"attacker@evil.com","mode":"subscription"}}}'
  # Expected: {"error":"invalid_signature"} — NOT {"ok":true} as before
  ```
- Confirm real webhooks still work by having the Architect trigger a
  test event from the Stripe dashboard → your Worker logs should show
  the event being processed normally.

**What can go wrong.**
- If you forget to read the body as text first, `request.text()` can only
  be called once — subsequent `request.json()` will throw.
- If the secret isn't set, the verification always fails. That's safe (no
  forgery) but blocks real Stripe too. Coordinate with the Architect.

---

## 3. Task B — `GET /user/me` endpoint

**The bug.** Frontend has no way to know if a user is signed in. The
session cookie is `httpOnly`, so JS can't read it. `auth/index.html`
sets `ksp_signed_in=1` in localStorage as a UI hint, but that's
advisory, not authoritative.

**What you build.**

1. Add a `handleUserMe` function. Shape:

   ```js
   async function handleUserMe(request, env) {
     const user = await getUser(request, env);
     if (!user) {
       return corsWrapCred(request, JSON.stringify({ authenticated: false }), 200);
     }

     // Gather active intel unlocks for this user. KV LIST with prefix.
     const nowSec = Math.floor(Date.now() / 1000);
     const intelList = await env.KV.list({ prefix: `intel:${user.email}:` });
     const intel_unlocks = [];
     for (const k of intelList.keys) {
       // Key: intel:{email}:k{kid} → value is expiry_sec string
       const m = k.name.match(/^intel:[^:]+:k(\d+)$/);
       if (!m) continue;
       const expiry_sec = parseInt(await env.KV.get(k.name), 10);
       if (expiry_sec && expiry_sec > nowSec) {
         intel_unlocks.push({ kingdom: parseInt(m[1], 10), expiry_sec });
       }
     }

     // World chat snapshot unlocks (permanent, so list all).
     const wcList = await env.KV.list({ prefix: `wc_unlock:${user.email}:` });
     const wc_unlocks = [];
     for (const k of wcList.keys) {
       // Key: wc_unlock:{email}:k{kid}:{snapshot_id}
       const m = k.name.match(/^wc_unlock:[^:]+:k(\d+):(.+)$/);
       if (!m) continue;
       wc_unlocks.push({ kingdom: parseInt(m[1], 10), snapshot: m[2] });
     }

     return corsWrapCred(request, JSON.stringify({
       authenticated: true,
       email:         user.email,
       fid:           user.fid || '',
       tier:          user.tier || 'free',
       credits:       user.credits || 0,
       intel_unlocks,
       wc_unlocks,
     }), 200);
   }
   ```

2. Register the route in the GET dispatcher block (near lines 98-113):

   ```js
   if (request.method === 'GET' && url.pathname === '/user/me') {
     return handleUserMe(request, env);
   }
   ```

3. **No frontend changes in this task.** A separate task (not in this
   spec) will wire `credits.js` and `layout.js` to call `/user/me` and
   display signed-in state. Leave that for later.

**Test plan.**

- Anonymous: `curl -H "Origin: https://kingshotpro.com" https://kingshotpro-api.kingshotpro.workers.dev/user/me`
  → `{"authenticated":false}`
- Signed-in: manually sign in via magic link flow on the live site,
  then use the `ksp_session` cookie in a curl:
  ```bash
  curl -H "Origin: https://kingshotpro.com" -H "Cookie: ksp_session=..." \
    https://kingshotpro-api.kingshotpro.workers.dev/user/me
  # Expected: { authenticated: true, email: ..., tier: ..., credits: ..., intel_unlocks: [...], wc_unlocks: [...] }
  ```

**Performance note.** KV LIST is ~50-200ms per call depending on key
count. Two LIST calls per `/user/me` request is fine for low traffic
(<100 reqs/min). If this endpoint becomes hot, cache the result in
`user.active_unlocks_cache` on the user record and invalidate when
unlocks happen.

---

## 4. Task C — Pro+ tier: add to rank, route, and gating

This task folds the old "re-gate voice/portrait" + "clean stale tier
constants" items. They're one concern: the tier model must match the
2-tier + Pro+ structure in `docs/PRICING.md`.

**Current state (stale):**

```js
const TIER_MODELS = {
  free:        { provider: 'deepseek',  model: 'deepseek-chat' },
  pro:         { provider: 'anthropic', model: 'claude-haiku-4-5' },
  war_council: { provider: 'anthropic', model: 'claude-haiku-4-5' },
  elite:       { provider: 'anthropic', model: 'claude-haiku-4-5' },
};
const TIER_REVENUE_USD = {
  free: 0, pro: 9.99, war_council: 29.99, elite: 99.99,
};
const TIER_CONTEXT_WINDOW = {
  free: 6, pro: 12, war_council: 20, elite: 30,
};
const TIER_RANK = { free: 0, pro: 1, war_council: 2, elite: 3 };
```

Plus: `handleVoice` checks `tierAtLeast('elite')`, `handlePortrait`
checks `tierAtLeast('elite')`. Elite is killed → those endpoints
are unreachable.

Plus: the Stripe webhook I wrote at `worker.js:1039+` sets every
subscription payer to `tier = 'pro'` regardless of which subscription
they bought. Pro+ buyers silently get Pro access. That's a bug I
introduced and missed. Fixing it is part of this task.

**Target state:**

```js
const TIER_MODELS = {
  free:     { provider: 'deepseek',  model: 'deepseek-chat' },
  pro:      { provider: 'anthropic', model: 'claude-haiku-4-5' },
  pro_plus: { provider: 'anthropic', model: 'claude-sonnet-4-6', fallback_model: 'claude-haiku-4-5' },
};
const TIER_REVENUE_USD = { free: 0, pro: 4.99, pro_plus: 9.99 };
const TIER_CONTEXT_WINDOW = { free: 6, pro: 12, pro_plus: 20 };
const TIER_RANK = { free: 0, pro: 1, pro_plus: 2 };
```

The `pro_plus` key uses an underscore to match JS identifier conventions.
Stripe/user records should store `"pro_plus"` as the tier value (not
`"pro-plus"` or `"pro+"`).

**Changes to make:**

1. **Replace the four `TIER_*` constants** (lines ~21-42 plus line 948)
   with the target state above.

2. **`handleVoice`**: change `tierAtLeast(user, 'elite')` →
   `tierAtLeast(user, 'pro_plus')`. Voice messages are a Pro+ perk.

3. **`handlePortrait`**: change `tierAtLeast(user, 'elite')` →
   `tierAtLeast(user, 'pro_plus')`. Custom portraits are a Pro+ perk.

4. **Fix the subscription tier routing in `handleStripeWebhook`**
   (within the `if (session.mode === 'subscription')` branch). Current
   hardcodes `user.tier = 'pro'`. Replace with amount-based routing:

   ```js
   const SUB_TIER_BY_AMOUNT = { 499: 'pro', 999: 'pro_plus' };
   const tier = SUB_TIER_BY_AMOUNT[session.amount_total] || 'pro';
   user.tier = tier;
   user.credit_history.push({
     at: Date.now(),
     kind: 'subscription_start',
     tier,
     amount_cents: session.amount_total,
     stripe_session_id: session.id || '',
   });
   responsePayload.tier = tier;
   ```

5. **Model-routing for `/advisor/chat`**: if `handleAdvisorChat` uses
   `TIER_MODELS[user.tier]`, Pro+ users now get Sonnet. Verify that the
   provider-calling code (`callAnthropic` and friends) handles the
   `claude-sonnet-4-6` model string. Look around worker.js:1102+ for
   the provider helpers. If Sonnet isn't in `ANTHROPIC_RATES`, the cost
   tracker may break — add the rate if missing.

6. **Do NOT touch** the archived Stripe product IDs. The webhook routes
   on amount, not product ID. The archived products are inert.

**Test plan.**

- `node --check worker/worker.js` passes.
- `npx wrangler deploy --dry-run` passes.
- After deploy:
  - `curl -X POST .../advisor/chat ...` still works for Pro users.
  - `/advisor/voice` returns 403 with `tier_required: pro_plus` for free
    users, 403 for Pro users, 200 for Pro+ users (if any exist yet).
  - `/advisor/portrait` same.
- Simulate a subscription checkout event to a test user and verify:
  - 499¢ amount → `user.tier === 'pro'`
  - 999¢ amount → `user.tier === 'pro_plus'`

**What could go wrong.**
- If you change the tier string from `'pro-plus'` to `'pro_plus'` and the
  frontend somewhere renders the tier with a dash, the UI could mismatch.
  Grep `js/` for `pro-plus` and fix any hardcoded references.
- Existing users with `tier === 'war_council'` or `tier === 'elite'` in
  their KV records (unlikely given zero subscriptions pre-reconciliation,
  but verify): `tierAtLeast('pro_plus')` on those records returns false
  because they're not in the new `TIER_RANK`. If any exist, either
  migrate them to `'pro_plus'` or add a legacy alias. Check by listing
  users:
  ```bash
  # If you need to audit, there's no bulk script today. Grepping
  # through a KV namespace list is painful. A quick proxy: create
  # a one-off admin endpoint that counts users by tier, then remove.
  # OR: trust that it's fine given zero historical subscriptions.
  ```

---

## 5. Commit + handoff requirements

### One commit per task is ideal

- Task A: "Stripe webhook signature verification"
- Task B: "GET /user/me endpoint"
- Task C: "Pro+ tier: add to rank, route subscriptions by amount, re-gate voice/portrait"

Each commit message should:
- Cite the file:line references you changed.
- Include the test you ran and its output (or "dry-run passes" + "curl
  test X returned Y").
- Note `wrangler deploy` was run, with the version ID from the deploy
  output.

### Update `docs/DECISIONS.md`

One entry per task, at the top, dated 2026-04-23 (or whenever you run).
Follow the format of existing entries. Each entry: verdict, context,
status, file links.

### Update `docs/ARCHITECTURE.md`

- § "Known broken or stale state": tick off items 4 (stale tier
  constants), 9 (Stripe signature), and add a note that elite-gated
  endpoints are now pro_plus-gated.
- § "Worker endpoints": add `GET /user/me` to the inventory.
- § "KV key patterns": unchanged.

### Update `CLAUDE.md` if warranted

If you find a missing rule in CLAUDE.md that would have prevented a
future mind from making the same kind of mistake, add it. The existing
rules are not sacred; additive wisdom is welcome.

---

## 6. What NOT to do in this pass

- **Don't refactor `corsWrap` vs `corsWrapCred` globally.** That's a
  separate pass and touching too many endpoints at once inflates the
  blast radius. Leave existing calls to `corsWrap` alone except where
  the target task demands otherwise.
- **Don't remove `handleVoice` or `handlePortrait`.** They work — the
  bug was only in their gating. Once gated to Pro+, they'll actually
  be reachable.
- **Don't migrate existing `war_council` or `elite` user records.** Zero
  historical subscribers at those tiers (verified at reconciliation
  2026-04-22). If you find any, flag in DECISIONS.md and stop — don't
  silently rename.
- **Don't change the Worker's `main` or `compatibility_date`.**
- **Don't bump `@cloudflare/puppeteer`.** It's load-bearing for
  `/player/lookup`.
- **Don't touch the frontend (`js/*`) in this task.** Wiring
  `/user/me` into the topbar is a follow-up task; stay focused on the
  Worker.

---

## 7. If you hit something the spec didn't anticipate

Stop. Add an entry to `docs/DECISIONS.md` titled "Question from Worker
hardening pass" with the decision point. Ship what you have so far in
a commit. The Architect or the next Claude picks it up.

Do not guess. Do not silently work around.

---

## 8. Final checklist before you ship

- [ ] All three tasks implemented.
- [ ] `node --check worker/worker.js` clean.
- [ ] `npx wrangler deploy --dry-run` clean.
- [ ] `npx wrangler deploy` ran and output a version ID.
- [ ] `curl` tests for A, B, C all returned expected responses.
- [ ] `docs/DECISIONS.md` updated with three entries.
- [ ] `docs/ARCHITECTURE.md` "Known broken" section updated.
- [ ] All commits pushed to `origin/main`.
- [ ] Stripe webhook still works after signature verification (verify
      via a real Stripe test event from the dashboard — Architect may
      need to do this).

When all boxes are checked, you're done. Stop. Handoff.

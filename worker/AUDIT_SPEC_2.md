# KingshotPro Worker — Post-Deploy Audit Spec (Round 2)

**Purpose:** Verify the deployed worker is functioning correctly after security fixes. This is a live endpoint audit, not a code review. The prior audit (AUDIT_SPEC.md) reviewed the code. This audit tests the running system.

**Context:** The worker was deployed after fixing 7 issues found in Round 1:
1. Stripe webhook signature verification added
2. XSS escaping added to admin HTML pages
3. Kingdom request queue changed from shared array to individual KV keys
4. CORS origin passthrough added to all credentialed endpoints
5. Hardcoded Simli API key fallback removed
6. Session KV entries now expire after 30 days
7. try/catch added to Pro endpoint request parsing

Plus three business decisions implemented:
- B: `past_due` and `incomplete_expired` added to subscription downgrade condition
- C: `'admin'` default killed on all admin endpoints — explicit ADMIN_KEY required

---

## File to read first

Read `KingshotPro/worker/worker.js` — the full file. You need to understand the code to write meaningful tests.

## Tests to perform

### TEST 1 — Webhook rejects unsigned requests

**What:** The Stripe webhook endpoint must reject any request without a valid `Stripe-Signature` header.

**How:**
```bash
# Should return 400 "missing signature"
curl -s -X POST https://kingshotpro-api.kingshotpro.workers.dev/stripe/webhook \
  -H "Content-Type: application/json" \
  -d '{"type":"checkout.session.completed","data":{"object":{"mode":"subscription","customer_email":"attacker@test.com","customer":"cus_fake"}}}' 

# Should return 400 "invalid signature"
curl -s -X POST https://kingshotpro-api.kingshotpro.workers.dev/stripe/webhook \
  -H "Content-Type: application/json" \
  -H "Stripe-Signature: t=1234567890,v1=fakesignature" \
  -d '{"type":"checkout.session.completed","data":{"object":{"mode":"subscription","customer_email":"attacker@test.com","customer":"cus_fake"}}}'
```

**Expected:** Both return error responses. Neither creates or modifies any user in KV.

### TEST 2 — Admin panels reject default key

**What:** All admin endpoints must reject `?key=admin` and return 401.

**How:**
```bash
curl -s https://kingshotpro-api.kingshotpro.workers.dev/verify/admin?key=admin
curl -s https://kingshotpro-api.kingshotpro.workers.dev/survey/admin?key=admin
curl -s https://kingshotpro-api.kingshotpro.workers.dev/video/cache?key=admin
curl -s https://kingshotpro-api.kingshotpro.workers.dev/kingdom/requests?key=admin
```

**Expected:** All four return 401 Unauthorized.

### TEST 3 — Admin panels work with real key

**What:** Admin endpoints must work with the real ADMIN_KEY.

**How:** Read the admin key from `KingshotPro/admin/CREDENTIALS.md`, then:
```bash
curl -s "https://kingshotpro-api.kingshotpro.workers.dev/verify/admin?key=REAL_KEY" | head -50
curl -s "https://kingshotpro-api.kingshotpro.workers.dev/survey/admin?key=REAL_KEY" | head -50
curl -s "https://kingshotpro-api.kingshotpro.workers.dev/kingdom/requests?key=REAL_KEY"
```

**Expected:** Verification and survey admin return HTML pages. Kingdom requests returns JSON `{"requests":[...]}`.

### TEST 4 — Credits balance requires auth

**What:** `/credits/balance` must return 401 for unauthenticated requests and include proper CORS headers for credentialed requests.

**How:**
```bash
# No cookie — should get 401
curl -s -i https://kingshotpro-api.kingshotpro.workers.dev/credits/balance \
  -H "Origin: https://kingshotpro.com"
```

**Expected:** 401 response with `Access-Control-Allow-Origin: https://kingshotpro.com` and `Access-Control-Allow-Credentials: true`.

### TEST 5 — OPTIONS preflight returns correct CORS

**What:** The OPTIONS handler must echo the requesting origin and include credentials header.

**How:**
```bash
curl -s -i -X OPTIONS https://kingshotpro-api.kingshotpro.workers.dev/credits/balance \
  -H "Origin: https://kingshotpro.com" \
  -H "Access-Control-Request-Method: GET"
```

**Expected:** 204 response with:
- `Access-Control-Allow-Origin: https://kingshotpro.com`
- `Access-Control-Allow-Credentials: true`
- `Access-Control-Allow-Methods: GET, POST, OPTIONS`

### TEST 6 — Kingdom request requires auth

**What:** `/kingdom/request` must reject unauthenticated requests.

**How:**
```bash
curl -s -X POST https://kingshotpro-api.kingshotpro.workers.dev/kingdom/request \
  -H "Content-Type: application/json" \
  -H "Origin: https://kingshotpro.com" \
  -d '{"type":"add","kingdom":100}'
```

**Expected:** 401 with auth_required error.

### TEST 7 — Chat export requires auth + Pro

**What:** `/advisor/history` must reject unauthenticated users (401) and free-tier users (403).

**How:**
```bash
# No cookie
curl -s https://kingshotpro-api.kingshotpro.workers.dev/advisor/history \
  -H "Origin: https://kingshotpro.com"
```

**Expected:** 401 auth_required.

### TEST 8 — Advisor chat endpoint responds

**What:** `/advisor/chat` should still work for basic requests (the most important endpoint — make sure we didn't break it).

**How:**
```bash
curl -s -X POST https://kingshotpro-api.kingshotpro.workers.dev/advisor/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"What heroes are good for F2P?","fid":"9999999","playerContext":"test","archetype":"steward","advisorName":"Ysabel"}'
```

**Expected:** JSON response with `response` field containing advisor text, `energy_remaining` field, `tier: "free"`.

### TEST 9 — Malformed request bodies return 400

**What:** Endpoints with the new try/catch should return clean 400 errors for malformed JSON.

**How:**
```bash
curl -s -X POST https://kingshotpro-api.kingshotpro.workers.dev/advisor/chat \
  -H "Content-Type: application/json" \
  -d 'not json'

curl -s -X POST https://kingshotpro-api.kingshotpro.workers.dev/kingdom/request \
  -H "Content-Type: application/json" \
  -d 'not json'
```

**Expected:** Both return `{"error":"bad request"}` with status 400.

### TEST 10 — Code-level verification

After running live tests, do a final code grep to confirm cleanliness:

```bash
# All should return zero matches:
grep -c "PRICE_TO_CREDITS\|PRICE_TO_TIER\|war_council\|War Council\|elite" worker.js
grep -c "|| 'admin'" worker.js
grep -c "05ll4nqf31s20n3gk232x4fi" worker.js
grep -c "customer_email" worker.js  # should be 1 match only (in checkout.session.completed, NOT in subscription handler)
```

---

## Deliverable

A table with one row per test (1-10). Columns:

| # | Test | Result | Notes |
|---|------|--------|-------|

Results: PASS or FAIL. If FAIL, include the actual response.

Then an overall verdict: **LIVE AND CLEAN** or **ISSUES FOUND**.

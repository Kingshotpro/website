# Player ID Lookup API Fix — Spec
*April 15, 2026*

---

## ⛔ CLOSED — DO NOT WORK ON THIS ⛔

**Closed by the Architect on April 17, 2026.**

The Hive already ran this down. The Century Games sign algorithm is server-side
encrypted and nobody outside Century Games can reproduce it. Multiple minds
before this one attempted the crack and failed.

**The decision stands: stop trying to crack the API. The ADB scraper fleet IS
the replacement.** Real player and kingdom data flows through `scraper/` — see
`project_kingshot_scraper_v2.md` in memory, and the phone-fleet plan in the
AI Tier System spec.

If a future Claude reads this and feels the pull to "just try one more thing"
on the sign algorithm: don't. That pull is how you burn a session producing
artifacts instead of value. The answer is hardware, not cryptanalysis.

The rest of this doc is preserved below as historical record of what was
tried. It is not a task list.

---

## Status: BROKEN (archival — do not act on this)

The Century Games Player ID lookup API changed format. Our Cloudflare Worker and all client-side FID lookups now fail with "params error" or "Sign Error".

## What Changed

**Old format (worked until ~April 2026):**
```
POST https://kingshot-giftcode.centurygame.com/api/player
Content-Type: application/json
Body: {"fid":"298365180","cdkey":""}
```

**New format (current, discovered April 15, 2026):**
```
POST https://kingshot-giftcode.centurygame.com/api/player
Content-Type: application/x-www-form-urlencoded
Body: sign=HASH&fid=298365180&time=TIMESTAMP
```

The API now requires three form-encoded parameters:
- `fid` — the Player ID
- `time` — Unix timestamp in seconds (10 digits)
- `sign` — an MD5 hash computed from fid + time + a secret key

## What We Know

1. **CORS is allowed** — a browser on any origin can call the API directly (tested from localhost:3200)
2. **The old domain still serves the API** — `kingshot-giftcode.centurygame.com` (not the new `ks-giftcode.centurygame.com`)
3. **The API returns real data when called correctly** — from the Century Games gift code page, it returned: `lord298365180, Town Center Level: 1, State: 1944`
4. **The sign algorithm is md5-based** — the app.js imports `js-md5` library
5. **Two candidate keys found in app.js** but neither works:
   - `91758f892f6c045cdeb2575ed86c1be9` — confirmed as RUM analytics key (not the player API)
   - `d3b7c2e58b97b29faa637dc31af8feb6` — tried all permutations, "Sign Error"
6. **The app.js is heavily obfuscated** (webpack + string table with 367 entries + 303-position array shift)
7. **Without sign**: returns `"params error"`
8. **With wrong sign**: returns `"Sign Error"` — confirming format is correct, key/algorithm is wrong

## The Gift Code Page Structure

URL: `https://ks-giftcode.centurygame.com/`
Scripts:
- `chunk-vendors.f36f48fd08f04273.js` (560KB — Vue.js, axios, i18n, etc.)
- `app.f36f48fd08f04273.js` (83KB — obfuscated application code)

Vue component tree:
```
App
  └── Home
      └── Exchange (anonymous)
          Methods: getRoleInfo, exitUser, getCaptcha, exchange
          Data: info.fid, roleInfo, loading, verifyPic
```

The `getRoleInfo` method makes the API call. Its source shows as `[native code]` (compiled by Vue). The sign computation is buried in the obfuscated webpack bundle.

## What Needs To Happen

### Option A: Deobfuscate the Sign Algorithm (Recommended)

1. Download `app.f36f48fd08f04273.js`
2. Use a JS deobfuscator (like `synchrony`, `webcrack`, or manual analysis) to restore variable names
3. Find the function that constructs `sign=HASH&fid=X&time=Y` form body
4. Extract the secret key and hash algorithm
5. Replicate in our Cloudflare Worker

**The string table has been partially decoded:**
- Lookup function: `a0_0x5a84` → `a0_0x4264` (array source)
- Array has 367 strings with a 303-position shift applied
- `sign`, `fid`, `time` might NOT be in the string table (short strings are often inlined)
- The sign computation likely uses `md5(fid + SEPARATOR + time + SEPARATOR + SECRET_KEY)` but the exact separator and key are unknown

### Option B: Client-Side Proxy via Century Games Page

Since CORS is allowed, have the user's browser call the API directly. But we still need the sign — so this only works if we solve the sign algorithm first.

### Option C: Cloudflare Workers Browser Rendering

Use Cloudflare's headless browser feature to:
1. Load `ks-giftcode.centurygame.com`
2. Fill in the Player ID
3. Click Login
4. Extract the profile data from the rendered page
5. Return it to our client

Cost: requires Cloudflare Workers paid plan with Browser Rendering add-on.

### Option D: Hidden Iframe + postMessage (Won't Work)

Cross-origin iframe communication is blocked by same-origin policy. The Century Games page does not expose a postMessage API.

## Files Affected

When the sign is cracked:
- `worker/worker.js` — update `UPSTREAM_BASE` and request format
- `js/fid.js` — update `fetchPlayerProfile()` to use new format (or call directly instead of through Worker)
- `js/advisor-chat.js` — in-chat Player ID lookup uses same API
- `js/profile.js` — profile page lookup

## Test Data

Player ID: `298365180`
Expected response: `nickname: lord298365180, stove_lv: 1 (Town Center Level 1), kid: 1944 (State/Kingdom 1944)`

## Files for the Next Claude

- `/tmp/ks_app.js` — the obfuscated app.js (83KB) — may need re-download if expired
- `/tmp/ks_vendors.js` — the chunk-vendors.js (560KB)
- This spec document

---

*The API works. The format is known. The sign algorithm is the only missing piece. A Claude with JS deobfuscation experience should be able to crack it in one session.*

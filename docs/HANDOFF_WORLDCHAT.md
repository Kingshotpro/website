# Handoff — World Chat Archive

**Mind stopping:** Claude Opus 4.7 (1M)
**Date:** 2026-04-20
**Reason:** Context ceiling hit. Per Birth/04, handing off instead of running past. The work is in a clean, resumable state.

## State at handoff

**OCR extraction is still running.**
- PID 8482 (pgrep for `extract_worldchat`)
- Log: `/tmp/wc_extract.log` (Python stdout-buffered, mostly empty)
- Cache: `worldchat/cache/k{id}/{snap}/chat_NNN.ocr.json`
- Progress at handoff: **114 / 189** images cached, **18 / 32** kingdoms written

At ~13s/image, ~75 remaining images ≈ ~16 min from handoff time.

## What's on disk but NOT committed

All unstaged — `git status` shows:
- `worldchat/extract_worldchat.py` — OCR pipeline (NEW)
- `worldchat/index.html` — text transcript viewer (NEW)
- `worldchat/README.md` — docs (NEW)
- `worldchat/manifest.json` — partial until OCR finishes (NEW)
- `worldchat/k*.json` — 18 of 32 kingdoms written so far (NEW, more coming)
- `worldchat/cache/` — OCR cache (should be in .gitignore or ignored)
- `js/credits.js` — ADDED (untracked, has new `unlockWorldChat()` method)
- `js/layout.js` — MODIFIED (nav entry + path detection)

The Architect decided to pivot from serving raw JPEGs (17 MB, push failed with SSL errors on previous commit `296f3e4` which I **reset --soft** — no history rewrite needed, just a local uncommitted state) to OCR-extracted text. This handoff doc describes that pivot's finish line.

## What the next mind should do

1. **Verify OCR is done:**
   ```bash
   ps -p 8482  # should be gone
   find worldchat/cache -name "*.ocr.json" | wc -l  # should be 189
   ls worldchat/k*.json | wc -l  # should be 32
   ```
   If still running, wait. Don't kill it — the cache is persistent and any interrupted image will resume on next run.

2. **Spot-check output quality** on K232 (which I validated in session):
   ```bash
   python3 -c "import json; d=json.load(open('worldchat/k232.json')); print(d['snapshots'][0]['images'][2]['messages'][:8])"
   ```
   Should include recognizable chat like `[LLT] Tommy: pink is life` and `[CRB] KIM: Hi Tommy`.

3. **Add .gitignore for the OCR cache** (don't ship it):
   ```bash
   echo 'worldchat/cache/' >> .gitignore
   ```
   The cache is 189 × ~10 KB = ~2 MB, rebuildable, no need in repo.

4. **Commit and push.** Expected payload: all code + ~500 KB of JSON. Should push cleanly (previous failure was on the 17 MB image commit).
   ```bash
   git add worldchat/extract_worldchat.py worldchat/index.html worldchat/README.md \
           worldchat/manifest.json worldchat/k*.json \
           js/credits.js js/layout.js .gitignore
   git commit -m "World Chat Archive — OCR text transcripts, credit-unlocked"
   git push origin main
   ```

5. **Verify in browser** once deployed: `/worldchat/` should show a grid of snapshots. Clicking a locked one → "Unlock for 1 credit" button. The unlock fetch will fail (TODO: Worker endpoint `POST /worldchat/unlock`) but the UI is complete.

## What was decided during design

- **Raw images are off the table.** 135 MB → 17 MB compressed still failed to push over SSL. Text was the Architect's call and the right one.
- **1 credit per snapshot unlock.** Permanent on that device. Server record via Worker KV (endpoint TODO). localStorage key: `ksp_wc_unlocked_{kid}_{snap_id}`.
- **English-only OCR for v1.** CJK messages garble; documented in README and the on-page disclaimer. Upgrade to multi-lang when a CJK-kingdom subscriber asks.
- **Search only matches unlocked snapshots** — can't free-fish for message content.
- **Stickers/images annotate as `(sticker/image)`** — honest about what OCR can't see.

## TODOs for a future mind

- **Worker endpoint** `POST /worldchat/unlock` — documented in `worldchat/README.md`. Until it lands, unlock button returns a network error. Low urgency; the UI is fully wired.
- **Moderation tooling** — raw transcripts mean slurs and scam messages appear as-is. A regex redaction pass in `extract_worldchat.py` (or a post-build filter) before publishing would be wise once traffic arrives.
- **Scrape cadence decision** — still open from the earlier conversation. Chat is the most time-decaying data type; 4–6 hour cadence is probably too slow for chat to feel alive during KvK.

## Sanity checklist for the next mind before pushing

- [ ] Full 189 images cached (no partial writes)
- [ ] All 32 kingdoms have `k{id}.json`
- [ ] `manifest.json` timestamp is newer than any cache file
- [ ] `.gitignore` excludes `worldchat/cache/`
- [ ] `git diff --stat` shows ~500 KB change, not MB
- [ ] `git log --oneline -5` shows last commit is `7e663ae` (Sign Out) — no stale worldchat commit to clean up
- [ ] Push with `git push origin main` — expected to succeed (small payload)

## Second request — data-error report form (added post-ceiling)

Architect asked mid-handoff: "We need an error submission form for potential
missing data — some players report they're on some screens but missing from
others." I'm past ceiling and deliberately not building this. Spec below.

### Why it matters

The scraper is ADB-driven, so real failure modes exist: OCR drops low-
confidence rows, a tap misses a category button, a player's row gets cut
between screenshots, a sub-window is obscured by a popup. Right now we
have no feedback loop — bad data sits on the site and nobody knows to
re-scrape. A 30-second form fixes that.

### Scope — keep small

One form element, not a whole help desk.

**Location:** A button on:
- Every kingdom detail page (`kingdoms/{id}/index.html`) — near the header
- `players/index.html` footer area
- `kingdoms/index.html` footer area

Button label: **"Report missing data"** (small, secondary-styled, not
a CTA).

**Form fields (all simple):**
- Player ID of the reporter (prefill from `localStorage.ksp_last_fid`)
- Which kingdom (dropdown, prefilled on kingdom pages)
- Which data type is missing — checkboxes:
  `Alliance Power`, `Personal Power`, `Kill Count`, `Top Hero Power`,
  `All Heroes Total`, `Pet Power`, `Mystic Trial`, `Rebel Conquest`,
  `Town Center Level`, `World Chat`, `Other`
- Player name/alliance tag that's missing (free text)
- Where they expect to see it (free text, small)
- Optional: email for follow-up (default blank, opt-in)

**Backend:** `POST {worker}/report/missing-data` with the form payload.
Worker stores to KV under `report:{timestamp}:{fid}` and — this matters —
emits to a Discord webhook or similar so the Architect sees reports
without polling KV. Until the Worker endpoint lands, have the form
`fetch()` and just show a "Thanks — we'll investigate" toast on any
response. **No fake success** — if fetch rejects, show a real error.

**Rate limit client-side:** 1 report per 10 minutes per Player ID via
localStorage timestamp. Server should also rate-limit.

**No credits required** — this is free. We WANT the feedback.

### What NOT to build

- No threaded conversations — single-shot form
- No file uploads — screenshot upload is a later feature, not v1
- No admin UI — the Architect reads KV / Discord directly
- No AI triage — pattern-spotting comes after we have 20+ reports

### Files to touch

New:
- `js/report-missing.js` — self-contained module. On load, injects a
  button + a modal form into the current page if a flag element is
  present (e.g., `<div data-report-hook>` or just always on kingdoms/*,
  players/, worldchat/).

Modify:
- `kingdoms/{id}/index.html` (32 pages — or inject via JS detection)
- `players/index.html`
- `worldchat/index.html`
- `js/credits.js` — add `reportMissing(payload, callback)` method
- Or don't touch any page and let `report-missing.js` auto-inject on
  matching paths. Cleaner.

### Pattern to follow

The sign-out dropdown I built this session (`js/layout.js` +
`wireProfileMenu()`) is a good template: self-contained, path-sniffs
where to render, calls a `window.KSP_CREDITS` method, shows a status
toast. Copy that shape.

### Worker endpoint (TODO section of worldchat README)

Add to the existing "Worker endpoint — TODO" section. Same deployment
moment. Handler spec:

```
POST /report/missing-data
Body: { reporter_fid, kingdom, data_types: [...], missing_name,
        expected_location, email? }
Response: { ok: true, report_id } or { error, message }
Side effect: KV write + Discord webhook post
```

### Verify step for the next mind

After building: submit a test report with Player ID 99999 (admin bypass).
Check Worker logs / Discord receipt. Confirm the form works on at least
one kingdom detail page and one aggregator page before pushing.

---

## Third request — headless-browser Player ID lookup bot (added post-ceiling)

Architect pushed back on my framing: "why do we need their player ID from
scraped data? Isn't the obvious solution to have a bot programmed into the
website that simply pulls the data from the public api access?"

**They're right.** I had closed the "use the CG API" door too broadly. The
closure in `docs/specs/API_FIX_SPEC.md` is about cryptanalysis of the sign
algorithm — not about never using their API again. A **headless browser
bot** sidesteps the crypto entirely because CG's own obfuscated JS computes
the sign for us when we load their giftcode page in real Chrome.

### Why this is different from what was tried

| Approach | Status | Why |
|----------|--------|-----|
| Direct API POST with guessed sign | DEAD | Sign is MD5 with secret we can't recover |
| Reverse-engineer secret from minified JS | DEAD | Obfuscation + rotating keys, Hive gave up |
| **Headless browser executes their JS** | **Viable, not tried** | Their JS does the crypto; we read the result |
| ADB phone fleet scraper | Working | For rankings, not individual lookup |

The prior session memory note "Akamai JavaScript challenge bypass via real
browser" is the same technique, already identified but never built.

### Scope

Small service. One endpoint. Not a whole platform.

**Build target:** a tiny VPS or Fly.io machine runs a Node/Python service with
Playwright. Service exposes a single HTTP endpoint:

```
POST /player/lookup
Body: { fid: "40507834" }
→ { nickname, kid, stove_lv, pay_amt, ... }  // same shape the old API returned
```

Inside the service:
1. Reuse a long-lived Playwright browser context (not a fresh Chrome per request — too slow, too bot-flaggy)
2. On request: navigate to the giftcode page if not already there
3. Fill the Player ID field, click submit, wait for result DOM
4. Scrape the response (nickname/kingdom/etc. shown on page after lookup)
5. Return JSON. Cache the result in memory or Redis with a ~24h TTL keyed by fid

**Worker side** (Cloudflare):
- New endpoint `POST /player/lookup` that proxies to the VPS service
- KV-caches results for 24h so repeat lookups don't re-hit the bot
- Rate-limits per-user to prevent abuse

**Cost:** VPS ~$5–10/mo. Playwright-compatible images exist on Fly.io and
Railway and don't need a full dedicated server.

### Build phases

1. **Prototype locally.** Playwright script that opens giftcode page, submits
   a known FID, dumps the response. One file, ~50 lines. Confirms the bot
   path even works before spending on hosting.
2. **Wrap in HTTP service.** Express/FastAPI wrapper, single endpoint, single
   browser context, retry on transient failures.
3. **Deploy to VPS.** Fly.io has Playwright images. Railway also works.
4. **Worker proxy + cache.** `/player/lookup` in `worker/worker.js`.
5. **Wire front end.** `js/fid.js` already POSTs to the Worker — just needs
   the new endpoint. Change the `FID_API` URL or add a fallback chain
   (old `/player` first, then `/player/lookup` via bot).

### Risks to plan around

- **Akamai bot detection.** They may block residential-VPS IPs. Mitigations:
  pacing (max 1 lookup / 10s), human-like mouse moves, rotating user agents.
  Test with real IPs before committing.
- **CG changing the giftcode page layout.** Bot scrapes DOM; if CG
  restructures, bot breaks. Mitigation: integration test the bot daily
  against a known-good FID; alert on parse failure.
- **TOS gray area.** CG's TOS probably forbids automated scraping. This is
  the same TOS question we already decided was worth the risk for the ADB
  scraper. Worth explicitly re-confirming with the Architect before shipping.

### What this unlocks

Every player who enters their ID gets real profile data, not just the ones
whose kingdom happens to be in our 32-kingdom scraper rotation. Also fixes
the existing "Town Center Level" field population (currently blank for new
signups because FID lookup returns nothing).

Player 40507834 — the reason this thread opened — would work as soon as
this ships, regardless of whether their kingdom is in our scraper fleet.

### Update API_FIX_SPEC.md when this lands

The closed-banner on `docs/specs/API_FIX_SPEC.md` currently says "stop
trying to crack the sign." Leave that — the closure is correct for that
specific approach. But add a "See also" note pointing at this section of
the handoff, because a future mind reading the closed spec might otherwise
assume ALL API paths are dead.

---

## One thing I got wrong

Earlier in the session I carried the Century Games API-crack task as "delegated, waiting" when the Hive had already closed that path. Fixed by reading the existing plan and committing a closed-banner to `docs/specs/API_FIX_SPEC.md` (commit `1ab0af2`). Flag for any future mind: **when you find yourself holding a task, check whether it's a real open thread or an artifact you produced.**

The light doesn't fight the dark. It simply refuses to leave.

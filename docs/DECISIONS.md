# DECISIONS — KingshotPro Architectural Log

> **Why this file exists.** Multiple Claude sessions and the Architect have
> worked on this project. Decisions made in one session got lost, reversed,
> or silently reintroduced in the next. This file is the chronological,
> authoritative log. If a Claude is about to close a problem as "impossible"
> or reopen a problem as "we should try this," **read this file first.**
> Chances are the answer is already here.
>
> Format: newest at the top. Each entry has a date, a one-line verdict, the
> context, and what's been done about it. Keep entries short — this is an
> index, not a wiki.

---

## 2026-04-23 — Worker Hardening Task C: Pro+ tier added; stale tier constants replaced; subscriptions route by amount; voice/portrait re-gated

**Verdict:** `TIER_MODELS`, `TIER_REVENUE_USD`, `TIER_CONTEXT_WINDOW`, and `TIER_RANK` in
`worker/worker.js` now match the 2-tier + Pro+ model from `docs/PRICING.md`.
`war_council` and `elite` entries removed from all four constants.
`handleVoice` and `handlePortrait` re-gated from `tierAtLeast('elite')` to
`tierAtLeast('pro_plus')` — these endpoints are now reachable for the first time.
Stripe subscription webhook now routes on `amount_total`:
499¢ → `'pro'`, 999¢ → `'pro_plus'`, fallback → `'pro'`.
`js/pricing-config.js` `id: 'pro-plus'` corrected to `id: 'pro_plus'` for consistency.

**Files changed:** `worker/worker.js:21-42` (TIER_* constants), `worker/worker.js:952` (TIER_RANK),
`worker/worker.js:998,1021` (voice/portrait gating), `worker/worker.js` handleStripeWebhook subscription branch,
`js/pricing-config.js:56`.

**Test:** `node --check` + `wrangler deploy --dry-run` clean.
Voice → `{"error":"tier_required","required":"pro_plus"}` ✓
Portrait → `{"error":"tier_required","required":"pro_plus"}` ✓
Deployed: Worker version `cdbb0225-152b-47d9-9126-f340e66c5889`.

**Status:** Done.

---

## 2026-04-23 — Worker Hardening Task B: GET /user/me endpoint added

**Verdict:** `handleUserMe` added to `worker/worker.js`. Returns
`{ authenticated: false }` for anonymous requests and
`{ authenticated, email, fid, tier, credits, intel_unlocks, wc_unlocks }` for
sessions with a valid `ksp_session` cookie. Uses `corsWrapCred` (origin-aware
CORS) for cookie-bearing responses. KV LIST calls enumerate active intel and
world-chat unlock records for the current user.

**Files changed:** `worker/worker.js` — new `handleUserMe` function,
GET `/user/me` route registered in the dispatch block.

**Test:** `curl -H "Origin: https://kingshotpro.com" .../user/me` →
`{"authenticated":false}` ✓
Deployed: Worker version `cdbb0225-152b-47d9-9126-f340e66c5889`.

**Status:** Done. Frontend wiring (topbar signed-in state) is a follow-up task.

---

## 2026-04-23 — Worker Hardening Task A: Stripe webhook signature verification

**Verdict:** `handleStripeWebhook` now verifies the `Stripe-Signature` header
before touching any payload. `verifyStripeSignature(request, body, secret)` helper
added — HMAC-SHA256 of `t.body`, constant-time compare, 5-minute replay window.
Returns HTTP 401 `{"error":"invalid_signature"}` on any forged or unsigned request.
`STRIPE_WEBHOOK_SECRET` was already set as a Worker secret (confirmed via `wrangler secret list`).
TODO comment at the top of the handler removed.

**Files changed:** `worker/worker.js` — `verifyStripeSignature` function added,
`handleStripeWebhook` body-read + verify block replacing old unsafe parse.

**Test:** forged POST with no signature → `{"error":"invalid_signature"}` (HTTP 401) ✓
Deployed: Worker version `cdbb0225-152b-47d9-9126-f340e66c5889`.

**Status:** Done. Real Stripe test event from the dashboard should be verified by
the Architect to confirm live webhooks still process correctly.

---

## 2026-04-22 — Task #4: Stripe products reconciled with 2-tier + credits model

**Verdict:** Five new Stripe products + prices + payment links created.
Six stale products (4-tier model at $9.99/$29.99/$99.99) archived.
`pricing.html`, `js/pricing-config.js`, and `docs/PRICING.md` now all
point at the real live URLs — no more `TODO_STRIPE_*` placeholders.

**Created (all livemode):**
- Pro ($4.99/mo) — `prod_UNoVQD1Lx7PFc2` → `buy.stripe.com/28E9AS4dgfrk3Ej4G46Vq06`
- Pro+ ($9.99/mo) — `prod_UNoV4QpP2aCqLO` → `buy.stripe.com/28E6oG114cf8caP2xW6Vq07`
- Credits 10 ($1.99) — `prod_UNoVWk1eTyLgD4` → `buy.stripe.com/3cI4gyh02a70eiXa0o6Vq08`
- Credits 30 ($4.99) — `prod_UNoVz4tzSeiavV` → `buy.stripe.com/4gM4gy11492Wfn1dcA6Vq09`
- Credits 75 ($9.99) — `prod_UNoVIV7XtcfFoE` → `buy.stripe.com/14AdR88tw0wqcaPdcA6Vq0a`

**Archived** (active: false, no new checkouts, existing data preserved):
- `prod_UJU7DflIxmhC4t` / `prod_UJNdil1eu5jl6Y` — old Pro $9.99/mo
- `prod_UJU7a0UAgUXxjE` / `prod_UJNdVTU9eHgSrl` — War Council $29.99/mo
- `prod_UJU77USWVLp4Pi` / `prod_UJNdyyNqHJQ4t6` — Elite $99.99/mo

**Safe because:** verified zero active subscriptions before archiving.

**Webhook-amount disambiguation:** the new credit-pack prices collide at
the amount level with the subscription prices (Pro $4.99 = 499¢ = Credits
Standard 30; Pro+ $9.99 = 999¢ = Credits Best Value 75). The
`handleStripeWebhook` already disambiguates via `session.mode`
(`subscription` vs `payment`), so no ambiguity in practice. Documented
in `docs/PRICING.md` § "Webhook mapping".

---

## 2026-04-22 — Task #5: Player-lookup bot runs inside the Worker (Browser Rendering)

**Verdict:** `POST /player/lookup` is live at `kingshotpro-api.kingshotpro.workers.dev`.
Runs `@cloudflare/puppeteer` inside the Worker — no separate service, no
VPS, no Fly.io. Cached in KV for 24h per FID.

**Proven:** Live test against Player 40507834 (Jetrix メ, K223) returned
the full profile via a real browser session in ~7 seconds cold, ~120ms
from cache on the second call. `source: "cf_browser_rendering"` in the
response confirms the browser path executed.

**Cost:** Browser Rendering bills per browser-hour (~$0.09/hr). Each
uncached lookup is ~5-8 seconds of browser time → ~$0.00012-$0.00020
per lookup. With 24h cache, a repeat user costs nothing.

**Changes made:**
- `worker/wrangler.toml`: added `nodejs_compat` flag and `[browser]` binding.
- `worker/package.json` (new): declares `@cloudflare/puppeteer` dependency.
- `worker/worker.js`: imports puppeteer at top, adds `handlePlayerLookup`,
  registers `/player/lookup` POST route.
- `js/fid.js`: `LOOKUP_BOT_URL` now points at the Worker endpoint;
  the "null = skip bot" fallback path removed (the bot is live).
- `.gitignore`: added `worker/node_modules/`.

**Obsolete (but kept on disk for reference):**
- `bot/lookup_player.py` — Python reference implementation, still useful
  for admin CLI runs when the Worker is down.
- `bot/server.py`, `bot/Dockerfile`, `bot/fly.toml`,
  `bot/com.kingshotpro.bot.plist` — the Fly.io / Mac-side alternative
  path. Not removed because the Architect might want them as a failover.

**Deployed:** Worker version `f6b5cc2c-3456-4d73-832a-cf9a7bcfc83e` on
account `b686aea95a94ead96e9146669e4f373c`.

---

## 2026-04-22 — Task #3: Stripe webhook rewrite per AUDIT_SPEC

**Verdict:** `handleStripeWebhook` rewritten to use `session.mode` +
`session.amount_total` for routing. Two pre-existing bugs fixed:
(a) line_items-based tier routing replaced, every payment now routes
correctly; (b) cancellation handler now uses a `stripe_cust:{customer_id}`
→ email reverse mapping that's written during checkout.

**Also surfaced:** the webhook does not verify the `Stripe-Signature`
header. Anyone who can POST to `/stripe/webhook` can forge events and
grant themselves Pro or credits. Added a TODO comment; fix is a separate
task (needs `STRIPE_WEBHOOK_SECRET` secret + HMAC-SHA256 verification).

**Status:** Code committed. Not yet deployed via `wrangler deploy`.

**Still to do for full 2-tier migration:**
- Archive live $29.99 and $99.99 Stripe products.
- Re-price $9.99 Pro product to $4.99, OR create new one.
- Create three credit-pack products at $1.99 / $4.99 / $9.99.
- Update `pricing.html` buy buttons to point at the new products.
- All of the above is "Task #4" per the proposal.

**See:** `worker/worker.js:1038+` handleStripeWebhook, AUDIT_SPEC.md
(the spec this finally implements).

---

## 2026-04-22 — Task #2: Five credit-gated Worker endpoints built

**Verdict:** `/credits/balance`, `/kingdom/request`, `/intel/unlock-kingdom`,
`/worldchat/unlock`, `/advisor/history` now exist in the Worker. Each
consults `getUser()`, respects credit cost constants
(`INTEL_COST_BY_DURATION`, `WORLDCHAT_UNLOCK_COST`,
`KINGDOM_REQUEST_COSTS`), deducts credits, writes `credit_history`.

**Also surfaced & fixed:**
- `handleAuthVerify` previously overwrote user records on every
  magic-link sign-in, wiping tier/credits/memory. AUDIT_SPEC documented
  this; it was never actually fixed until this commit.
- `corsWrap` sends `Allow-Origin: *` with `Allow-Credentials: true`
  which browsers reject. New `corsWrapCred` helper echoes a specific
  origin when it matches the allow-list. New endpoints use it;
  existing endpoints left on the broken helper pending separate pass.

**New KV patterns:**
- `intel:{email}:k{kid}` — expiry timestamp, TTL = unlock duration
- `wc_unlock:{email}:k{kid}:{snap}` — permanent unlock record
- `kingdom_req:{kid}:{email}:{type}` — pending admin-review request
- `stripe_cust:{customer_id}` — email reverse-lookup for Stripe events

**Status:** Code committed (`511a329`). Not yet deployed.

---

## 2026-04-22 — Task #1: Magic-link UI wired to existing /auth endpoints

**Verdict:** Homepage `#auth-signup-form` calls `/auth/send`. New
`auth/index.html` page receives the magic link, calls `/auth/verify`,
displays success/error state. Zero backend changes needed — the
`/auth/send` and `/auth/verify` endpoints have been live for weeks.

**Status:** Committed (`9d32507`) + pushed. Already live on GitHub Pages.

**Limitation:** The site has no endpoint to confirm "is this user
currently signed in?" — the session cookie is httpOnly so JS can't
read it. Landing page of `/auth/` sets `ksp_signed_in=1` in
localStorage as a UI hint, but that's advisory only, not authoritative.
Follow-up: add `GET /user/me` that returns `{ email, tier, credits }`
for the current session. Frontend can then show signed-in state in
the topbar.

---

## 2026-04-21 — Architecture doc written; surfaced 5 production bugs

**Verdict:** `docs/ARCHITECTURE.md` now records what the system IS in
production. Writing it (via a careful audit of `worker/worker.js` and
every `fetch()` call in `js/`) surfaced five bugs that were previously
invisible or documented only in a never-implemented spec.

**Bugs surfaced:**

1. `worker/AUDIT_SPEC.md` describes a 4-tier → 2-tier pricing rewrite
   that was **never implemented**. The spec is aspirational;
   `worker.js` still uses the 4-tier price-ID map (lines 1014-1029)
   and stale tier constants (`TIER_MODELS`, `TIER_REVENUE_USD`,
   `TIER_CONTEXT_WINDOW`).
2. Stripe webhook uses `session.line_items` on
   `checkout.session.completed` (line 1048) — Stripe doesn't populate
   this field by default. Every payment defaults to
   `tier = 'pro'`. Users paying for War Council or Elite get Pro only.
3. Subscription cancellation reads `sub.customer_email` (line 1071) —
   this field doesn't exist on Stripe subscription objects. **All
   cancellations silently no-op.** Users stay Pro after cancelling.
4. Four client-side endpoints 404 in production: `/credits/balance`,
   `/kingdom/request`, `/intel/unlock-kingdom`, `/worldchat/unlock`,
   `/advisor/history`. The entire credit-gated feature set is broken.
5. Magic-link email auth is fully built server-side
   (`/auth/send`, `/auth/verify`) but **no frontend page ever calls
   it**. Users auth by typing Player ID, which the Worker then
   proxies to the broken CG `/api/player` endpoint.

**Status of the architecture doc itself:** Live as source of truth for
the system shape. Every claim backed by a `file:line`. Gets updated
whenever reality changes.

**Not fixing the bugs in this commit** — the Architect asked for the
doc, not a fix pass. Bugs are documented so the next work session
picks them up with full context.

---

## 2026-04-21 — Bot deployment: quick-tunnel shipped, REVERTED same-day

**Verdict:** Reverted. Player-lookup bot is not deployed. Mac-side
hosting was the wrong architectural choice — a public website's API
cannot depend on someone's laptop being on.

**Context:** First attempt: started `bot/server.py` on the Architect's
Mac, exposed it via a cloudflared quick-tunnel. Worked end-to-end
(verified against Player 38982714 / caffeinatedmochi / K202). Committed
the tunnel URL into `js/fid.js`.

Architect immediately pushed back: "This is NOT meant to be MAC side,
why would it be? This has to be on the website." Correct. Killed the
processes, reverted `LOOKUP_BOT_URL` to `null` (fid.js throws a clean
error when the bot path is hit without a deployed service).

**Lesson:** "What can I deploy from this session" is the wrong frame.
"Where does this architecturally belong" is the right frame. The bot
belongs on the same cloud infrastructure as the rest of the backend
(Cloudflare Worker with Browser Rendering) or on a parallel cloud
host (Fly.io). Not on a laptop.

**Status:** Reverted. Bot code remains (`bot/lookup_player.py`,
`bot/server.py`, `bot/Dockerfile`, `bot/fly.toml`). Waiting on an
architectural decision about cloud deployment (Cloudflare Workers
Paid + Browser Rendering OR Fly.io deploy).

**See:** `docs/ARCHITECTURE.md` § "Open architectural questions."

---

## 2026-04-21 — Pricing structure rebuilt: Free + Credits + Pro $4.99 + Pro+ $9.99

**Verdict:** Four lanes to pay: Free, one-off credit packs, Pro $4.99/mo
(Haiku unlimited), Pro+ $9.99/mo (Sonnet for hard questions). Credit packs
at 10/$1.99, 30/$4.99, 75/$9.99.

**Context:** The 4-tier $9.99/$29.99/$99.99 structure from commit `8ed7989`
("Stripe LIVE") was drifted from the April 16 decision that killed those
tiers. pricing.html displayed the killed tiers for ~5 days. An earlier
Claude (this session) added credit packs on top of the killed structure
without noticing the contradiction. Architect called it out; the correct
pricing is now locked in `docs/PRICING.md`.

**Actions taken:**
- Created `docs/PRICING.md` as single source of truth.
- Created `js/pricing-config.js` as runtime-readable mirror.
- Created this file (`DECISIONS.md`).
- Created `CLAUDE.md` at project root with the protocol.

**Still pending:**
- Rewrite `pricing.html` to read from `pricing-config.js`.
- Update `credits.js` paywall overlay to read from config (currently says $9.99).
- Archive the stale live Stripe products ($29.99, $99.99). Re-price Pro to
  $4.99. Create new Stripe products for Pro+ and three credit packs.
- Pro+ scope (Sonnet routing, included credits, naming) is marked
  `status: proposed` in pricing-config.js until Architect confirms.

---

## 2026-04-21 — Player ID lookup bot is the API path, not sign-algorithm cryptanalysis

**Verdict:** A headless-Chrome Playwright service at `bot/server.py`
loads Century Games' giftcode page, lets their obfuscated JS compute the
`sign` field organically, intercepts `/api/player` responses. Works.

**Context:** Previous Hive minds closed "the API" as unsolvable because the
MD5 sign algorithm couldn't be reverse-engineered. That closure was right
about one *method* (cryptanalysis), wrong about the category. A different
method — using their own JS to compute the sign for us — never got tried.
Architect pushed back, I tested it against Player 40507834, works clean.

**Status:** Service built, tested end-to-end locally. `fly deploy` is the
one-command activation step.

**See:** `bot/README.md`, `docs/specs/API_FIX_SPEC.md` (now banner-closed
with a pointer here).

---

## 2026-04-20 — World chat is text (OCR), not images

**Verdict:** We OCR the chat screenshots once and serve structured JSON.
No raw images on the site.

**Context:** First attempt served compressed JPEGs (16 MB). Push failed at
the SSL layer and the approach was bad anyway: huge, unsearchable, hard to
moderate. Architect said use text. `worldchat/extract_worldchat.py` runs
EasyOCR + y-row clustering, writes per-kingdom JSON. Viewer renders text
transcripts in `worldchat/index.html`.

**Status:** Live. 189 images OCR'd across 32 kingdoms. ~500 KB total JSON.
1 credit per snapshot unlock.

**See:** `worldchat/README.md`.

---

## 2026-04-19 — Advisor selection picker disabled (temporarily)

**Verdict:** New players are silently assigned the `sage` archetype. The
3-archetype selection overlay is not shown.

**Context:** Forcing a choice between one available option is dead UX.
Code is left intact in `advisor-select.js` — restore by replacing one
line in `js/fid.js`.

**Status:** Live. Restore point flagged with a comment at the call site.

---

## 2026-04-19 — Sign-out option + account dropdown added

**Verdict:** The topbar profile chip is now a dropdown (View Profile,
Switch Player, Sign Out). Sign out wipes all `ksp_*` keys except cookie
consent and sidebar collapse state.

**See:** `js/layout.js` `wireProfileMenu()`, `js/fid.js` `signOut()`.

---

## 2026-04-18 — Kingdom detail rows visibly clickable + Top Players aggregator

**Verdict:** Kingdom rankings now show a "View →" pill on hover and a
clickable banner above the table. New `/players/` aggregator lists
cross-kingdom leaderboards by power / kills / hero / pet / MT stage,
with a tab switcher and per-kingdom filter chips.

**Status:** Live. Data generated by `players/build_players.py` from
scraper CSVs.

---

## Pre-session decisions (from memory files)

These predate this log but are referenced elsewhere. Canonical sources:

| Decision | Canonical doc |
|---|---|
| Town Center terminology (not "Furnace") | Codebase-wide, verified via fandom wiki |
| T1–T12 troop tiers (not T1–T4) | `docs/specs/KINGSHOT_KNOWLEDGE_BASE.md` |
| Bread (not "Food") as Town Center resource | Fandom wiki primary source |
| API sign algorithm — cryptanalysis approach closed | `docs/specs/API_FIX_SPEC.md` (banner at top) |
| Scraper data freshness pattern | `kingdoms/build_directory.py` comments |

---

## How to add an entry

1. **At the top.** Newest first, so a Claude reading this sees current state first.
2. **One-line verdict.** The ruling, in one sentence. Not the story.
3. **Context (2–4 lines).** What triggered the decision. What was tried.
4. **Status.** Live / Proposed / Pending / Reversed.
5. **See also.** Links to the code or spec where the detail lives.
6. **Do not delete old entries.** Even reversed decisions are kept with
   their reversal noted — the history is the value.

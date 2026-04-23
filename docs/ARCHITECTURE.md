# ARCHITECTURE — KingshotPro

> **Purpose.** This doc records what the KingshotPro system IS, right now,
> on disk and in production. Not what we intend. Not what's planned. What
> exists.
>
> **For future Claudes.** If you're starting work on this project, read this
> before anything else in the repo. It will save you from rebuilding
> something that already exists (and save the Architect from answering
> "how was this built?" questions that have answers in the code).
>
> **Discipline.** Every claim in this doc is backed by a specific
> `file:line`. If you can't cite it, don't write it. If you're unsure, say
> "unknown" — never "probably."
>
> **Last verified:** 2026-04-21 by reading `worker/worker.js` (1232 lines),
> `wrangler.toml`, all files in `js/`, `.github/workflows/deploy.yml`.

---

## TL;DR — the shape of the system in five lines

1. **Static site** served from GitHub Pages at `kingshotpro.com`.
2. **Cloudflare Worker** at `kingshotpro-api.kingshotpro.workers.dev` is the ONLY backend. ~21 endpoints. Handles auth, AI, Stripe webhook, character verification, survey, video cache.
3. **Cloudflare KV** is the ONLY database. No D1, no Postgres. Six key patterns (`user:`, `session:`, `auth_token:`, `memory:`, `verified:`, `verify:`).
4. **Data pipelines** live in `scraper/` (ADB-driven screenshot capture on an Android phone) → extracted via OCR → three `build_*.py` scripts → JSON files served by GitHub Pages.
5. **Magic-link email auth is fully built server-side but never wired to the frontend.** Nothing calls `/auth/send` yet. Users "auth" today by typing a Player ID into a form; the FID is kept in localStorage only.

---

## Platform Boundaries — who runs what

| Platform | What lives here | Where defined |
|---|---|---|
| **GitHub repo** `Kingshotpro/website` | All source. Pushed to `main` auto-deploys to Pages. | `.github/workflows/deploy.yml` |
| **GitHub Pages** | Static site at `kingshotpro.com`. HTML, CSS, JS, data JSON files. | `CNAME` = `kingshotpro.com` |
| **Cloudflare Worker** `kingshotpro-api` | Backend: auth, AI calls, Stripe webhook, character verification, etc. | `worker/wrangler.toml` |
| **Cloudflare KV** namespace `KV` (id `6279d210...35e4`) | User records, sessions, magic-link tokens, memory, verification state. | `worker/wrangler.toml:7-9` |
| **Resend** | Transactional email (magic links). API key as `RESEND_KEY` Worker secret. | `worker/worker.js:166-173` |
| **Anthropic / DeepSeek / OpenAI** | AI model calls via their APIs. Keys as Worker secrets. | `worker/worker.js:21-26` (TIER_MODELS) |
| **Stripe** | Subscription + one-time payments. Webhook at `/stripe/webhook`. | `worker/worker.js:1011-1086` |
| **Scraper (Android phone + Mac)** | ADB-driven in-game screenshot capture + OCR extraction. NOT cloud. | `scraper/kingshot_scraper.py`, `scraper/extract_data.py` |
| **Century Games servers** | Upstream game data via giftcode page lookup. Hit via proxy or (future) bot. | `worker/worker.js:1` (UPSTREAM_BASE) |

GitHub Pages cannot run a live HTTP service — it serves static files only.
Any backend logic belongs in the Cloudflare Worker.

---

## Request flow — what actually happens when a user visits

### First-time visit, types Player ID

1. Static HTML loads from `kingshotpro.com` (GitHub Pages).
2. `js/layout.js` injects topbar + sidebar, sets `window.KSP_BASE` path prefix.
3. `js/fid.js` `handleFidForm` receives submitted Player ID.
4. `fetchPlayerProfile(fid)` tries three sources in order:
   - `fetchFromRegistry(fid)` reads static `/players/registry.json` off GitHub Pages. Hit → done, no backend call.
   - Miss → `fetch(FID_API)` to `https://kingshotpro-api.kingshotpro.workers.dev/player`.
   - The Worker proxies raw POST to `https://kingshot-giftcode.centurygame.com/api/player`. **This fails for every new FID with "Sign Error"** because CG now requires a `sign` field the Worker does not compute (`worker/worker.js:114-142`).
   - Miss → `fetchFromLookupBot(fid)` calls `LOOKUP_BOT_URL` — **currently `null`**, so this throws. No automated lookup is wired.
5. Throws → user sees error on homepage.
6. Manual workaround: admin runs `python3 bot/lookup_player.py {fid} --save`, commits `players/registry.json`, pushes. Pages redeploys in ~1 min. User's next attempt hits the registry → done.

### Currently in production: no path 4. Most new FIDs fail at step 4c.

### Returning visit (FID already in localStorage)

1. `js/layout.js` reads `ksp_profile_{fid}` from localStorage and renders topbar chip.
2. No backend call. The profile is pure client-side state.

### Paid-feature click (e.g. "Unlock kingdom intel with 1 credit")

1. `js/credits.js` `unlockKingdomIntel(kid, duration, cost, cb)` attempts `POST {Worker}/intel/unlock-kingdom`.
2. **The Worker has no such endpoint** (verified — not in the handler list `worker/worker.js:64-94`).
3. Fetch returns 404. The paywall shows "Unlock failed."
4. **Every credit-gated feature on the site is currently broken this way.** See "Frontend-backend mismatches" below.

---

## Worker endpoints — authoritative inventory

Source: `worker/worker.js:64-112`. This is the complete list of endpoints
the Worker responds to.

### POST
| Path | Handler | Auth? | What it does |
|---|---|---|---|
| `/auth/send` | `handleAuthSend` | none | Sends magic-link email via Resend. Stores `auth_token:{token}` in KV (10-min TTL). |
| `/auth/verify` | `handleAuthVerify` | token | Validates magic link. Creates `user:{email}` record. Sets `ksp_session` cookie. |
| `/advisor/chat` | `handleAdvisorChat` | `getUser` | Routes AI chat by tier (DeepSeek for free, Haiku for paid). |
| `/advisor/consult` | `handleAdvisorConsult` | `getUser` | Variant of chat (see line 356). |
| `/advisor/chronicle` | `handleChronicle` | `tierAtLeast('pro')` | Monthly chronicle generation. |
| `/advisor/illustration` | `handleIllustration` | `tierAtLeast('pro')` | Battle illustration via DALL-E. |
| `/advisor/video` | `handleAdvisorVideo` | `getUser` | Simli video response. |
| `/advisor/voice` | `handleVoice` | `tierAtLeast('pro_plus')` | Daily voice message via OpenAI TTS. |
| `/advisor/portrait` | `handlePortrait` | `tierAtLeast('pro_plus')` | Custom advisor portrait via DALL-E. |
| `/stripe/webhook` | `handleStripeWebhook` | Stripe signature (not verified) | Subscription & one-time payment events. |
| `/verify/request` | `handleVerifyRequest` | none | User submits character verification request. |
| `/verify/confirm` | `handleVerifyConfirm` | admin token | Admin confirms a verification. |
| `/verify/mark-sent` | `handleVerifyMarkSent` | admin token | Mark verification package as shipped. |
| `/survey/submit` | `handleSurveySubmit` | none | Public survey form submission. |

### GET
| Path | Handler | Auth? | What it does |
|---|---|---|---|
| `/codes/check` | `handleCodeCheck` | none | Check a gift-code redemption. |
| `/codes/list` | `handleCodeList` | none | List known gift codes. |
| `/video/cache` | `handleVideoCacheAdmin` | admin token | View the Simli video cache. |
| `/survey/admin` | `handleSurveyAdmin` | admin token | View collected survey responses. |
| `/verify/admin` | `handleVerifyAdminPage` | admin token | Admin dashboard for character verification. |
| `/user/me` | `handleUserMe` | `getUser` (cookie) | Returns `{ authenticated, email, fid, tier, credits, intel_unlocks, wc_unlocks }`. |
| `/player` | proxy → `centurygame.com/api/player` | none | **Currently broken for every new FID** — CG added sign requirement. |
| `/redeem` | proxy → same | none | Same upstream, same brokenness. |

---

## Frontend → Backend map — what works and what 404s

Source: grep of every `fetch(API + ...)` call across `js/*.js`.

| Frontend call | Where | Worker has it? | Status |
|---|---|---|---|
| `GET /credits/balance` | `credits.js:16` | **NO** | 404 — credit balance always shows 0 to users |
| `POST /kingdom/request` | `credits.js:254` | **NO** | 404 — "Request new kingdom" button fails silently |
| `POST /intel/unlock-kingdom` | `credits.js:311` | **NO** | 404 — new KvK paywall (shipped today) fails |
| `POST /worldchat/unlock` | `credits.js:357` | **NO** | 404 — world chat unlock fails |
| `GET /advisor/history` | `credits.js:275` | **NO** | 404 — Pro chat export fails |
| `POST /player` | `fid.js` (FID_API) | yes (proxy) | Broken: returns Sign Error on every new FID |
| `POST /lookup` (bot) | `fid.js` (LOOKUP_BOT_URL) | N/A — URL is `null` | Throws client-side error |
| `POST /advisor/*` | multiple | yes | Works for authenticated users |
| `POST /auth/send` | **nowhere** | yes | Backend ready, frontend never calls it |
| `POST /auth/verify` | **nowhere** | yes | Backend ready, frontend never calls it |

---

## KV key patterns — complete schema in production

Source: grep of every `env.KV.put/get/delete` in `worker.js`.

| Key pattern | Shape | TTL | Written by | Read by |
|---|---|---|---|---|
| `user:{email}` | `{ email, fid, tier, created, energy_today, energy_date, memory }` | none | `handleAuthVerify`, `handleStripeWebhook` | `getUser`, advisor endpoints |
| `session:{sessionToken}` | `{ email }` | none (sessions don't expire) | `handleAuthVerify` | `getUser` |
| `auth_token:{token}` | `{ email, created }` | 600s | `handleAuthSend` | `handleAuthVerify` |
| `memory:{fid}` | Array of chat turns | none | advisor endpoints for anonymous users | advisor endpoints |
| `verify:{fid}` | Pending verification record | ? | `handleVerifyRequest` | verify admin endpoints |
| `verified:{fid}` | Confirmed verification record | none | `handleVerifyConfirm` | public verify check |

**Missing fields on `user:{email}`:** the audit spec calls for `credits`,
`credit_history`, `stripe_customer_id`. They are not in the record shape
written by `handleAuthVerify` (`worker.js:198-208`) or the Stripe webhook
(`worker.js:1063`). Any code that expects them will see `undefined`.

---

## Stripe — state of the subscription pipeline

### The spec vs reality gap

`worker/AUDIT_SPEC.md` describes a rewrite that moves from 4-tier pricing
($9.99/$29.99/$99.99) to 2-tier ($4.99 Pro + credit packs). **That rewrite
is not in the code.** `worker.js` still has the 4-tier price-ID mapping at
lines 1014-1029 and still uses `session.line_items?.data` to pick tier
(line 1048).

### Bugs in the current webhook handler

1. **`session.line_items` is empty on `checkout.session.completed`** events
   (per Stripe docs). The loop at `worker.js:1050-1056` never matches. The
   default `tier = 'pro'` (line 1049) applies to everyone. **Anyone who
   completes any checkout becomes Pro, regardless of what they actually
   paid for.** Users paying for "War Council" or "Elite" get Pro instead.
2. **`sub.customer_email` does not exist** on Stripe subscription objects
   (line 1071). The check returns `{"ok":true}` with no action. **Subscription
   cancellations silently fail.** Users stay Pro after cancelling.

### Stale tier constants still in code

- `TIER_MODELS` (`worker.js:21-26`) — has `war_council` and `elite` entries.
- `TIER_REVENUE_USD` (`worker.js:29-34`) — has Pro at `9.99`, not `4.99`.
- `TIER_CONTEXT_WINDOW` (`worker.js:37-42`) — has all four tiers.
- `GROUNDING_APPENDIX` (`worker.js:14`) references "T1-T10" troop tiers but
  per prior decision Kingshot has T1-T12 (Truegold, Tempered Truegold).

### Stripe dashboard (per `pricing.html` buy links)

Three live products:
- Pro monthly `price_1TKr9uCTwcITa9f2GJdMCqzy` → `$9.99/mo`
- War Council monthly `price_1TKr9vCTwcITa9f2oceLoWsD` → `$29.99/mo`
- Elite monthly `price_1TKr9vCTwcITa9f2k1AbY1QL` → `$99.99/mo`

Per the April 16 pricing decision (`docs/PRICING.md`): these prices are
wrong. Should be Pro `$4.99` + three credit packs at `$1.99/$4.99/$9.99`.
No credit-pack product exists in Stripe. Whatever is in the Stripe dashboard
today is authoritative until Architect confirms the tear-down.

---

## Data pipelines — scraper → JSON → site

Three data pipelines produce JSON files that GitHub Pages serves. Never
hand-edit the JSON — always regenerate.

```
scraper/ (Android phone + Mac)
├── kingshot_scraper.py    ADB-driven screenshot capture in-game
├── extract_data.py        EasyOCR → CSVs in scraper/data/kingdoms/k{id}/{timestamp}/

kingdoms/
├── build_directory.py     CSV → kingdoms/directory_data.json
├── directory_data.json    consumed by kingdoms/index.html
└── {kid}/index.html       per-kingdom detail pages (32 of them)

players/
├── build_players.py       CSV → players/players_data.json
├── players_data.json      consumed by players/index.html
└── registry.json          manual lookups via bot/lookup_player.py (NOT from scraper)

worldchat/
├── extract_worldchat.py   scraper PNGs → OCR text → k{id}.json + manifest.json
├── cache/                 OCR intermediate (gitignored)
├── k{id}.json             per-kingdom chat logs (32 of them)
├── manifest.json          global index
└── index.html             viewer

bot/
├── lookup_player.py       Playwright — loads CG giftcode page, scrapes API response
├── server.py              FastAPI wrapper. NOT deployed. Needs a cloud home.
├── Dockerfile             container for Fly.io / Railway / any Docker host
├── fly.toml               Fly.io config
└── com.kingshotpro.bot.plist  launchd (Mac-side, NOT used in production)
```

Deployment: push to `main` → `.github/workflows/deploy.yml` → Pages rebuilds.
No Worker deploy is automated; Worker needs `wrangler deploy` manually.

---

## Known broken or stale state — not a wishlist, just what's broken right now

These are facts about current production, not aspirations. Each is tied
to a specific file:line.

1. ~~**Every new FID lookup fails**~~ **FIXED and deployed 2026-04-22.**
   New `POST /player/lookup` endpoint in the Worker uses Cloudflare
   Browser Rendering (`@cloudflare/puppeteer`) to drive CG's giftcode
   page, intercept the `/api/player` response, cache in KV 24h.
   Proven live against Jetrix (K223): cold ~7s, cached ~120ms.
   The legacy `/player` proxy at `worker.js:114-142` is still there
   but only hit by older frontends; current `fid.js` uses `/player/lookup`.
2. ~~**Credit system is entirely broken**~~ **FIXED in commit 511a329**
   (not yet deployed). Five Worker endpoints added:
   `/credits/balance`, `/kingdom/request`, `/intel/unlock-kingdom`,
   `/worldchat/unlock`, `/advisor/history`. `wrangler deploy` required.
3. ~~**Magic-link auth is orphaned**~~ **FIXED in commit 9d32507.**
   Homepage signup form + `/auth/` verify page now live on Pages.
4. ~~**Stripe webhook assigns everyone to Pro**~~ **FIXED (uncommitted).**
   Now routes on `session.mode` + `amount_total`. Credit packs map
   199/499/999 cents → 10/30/75 credits. Subscription → Pro.
5. ~~**Stripe cancellations silently no-op**~~ **FIXED (uncommitted).**
   Now uses `stripe_cust:{customer_id}` reverse mapping stored during
   checkout. `canceled`/`unpaid`/`incomplete_expired` → downgrade to free.
6. **Stripe products vs pricing doc are still out of sync.** Live Stripe
   products are at $9.99/$29.99/$99.99. `docs/PRICING.md` says Pro $4.99
   + credit packs. The webhook now handles the credit-pack amounts
   (199/499/999) but no credit-pack products exist in Stripe yet. Task #4.
7. **Sign-out button works** (shipped earlier this session) — exception to the
   broken-list, noted so the next Claude doesn't rebuild it.
8. ~~**`TIER_MODELS`, `TIER_REVENUE_USD`, `TIER_CONTEXT_WINDOW`** constants stale.~~
   **FIXED 2026-04-23.** All four `TIER_*` constants now match 2-tier + Pro+
   model. `war_council`/`elite` removed. `pro_plus` added with Sonnet routing.
   `handleVoice`/`handlePortrait` re-gated to `tierAtLeast('pro_plus')`.
9. ~~**Stripe webhook does NOT verify the `Stripe-Signature` header.**~~
   **FIXED 2026-04-23.** `verifyStripeSignature` HMAC-SHA256 helper added.
   Returns HTTP 401 on missing or invalid signature. 5-minute replay window.
   `STRIPE_WEBHOOK_SECRET` Worker secret confirmed present.
10. **CORS on existing endpoints is broken for credentialed requests.**
    `corsWrap` sets `Allow-Origin: *` with `Allow-Credentials: true` —
    browsers reject this. New `corsWrapCred` helper (origin-aware) was
    added for the 5 new endpoints and for `handleAuthVerify`; the rest
    of the endpoints still use the broken helper. Systematic conversion
    is a separate pass.

---

## Where to look first for common tasks

| You want to… | Read first |
|---|---|
| Change pricing | `docs/PRICING.md` (source of truth) + `js/pricing-config.js` (runtime) |
| Add a backend endpoint | `worker/worker.js` handler list at lines 64-112. Match the `handleX` pattern. |
| Add a KV key pattern | This doc's KV table. Update when you add one. |
| Understand user identity | `getUser` (`worker.js:420`) + `handleAuthVerify` (`worker.js:181`) |
| Fix a paywalled feature | `js/credits.js` + the missing endpoints table above |
| Add a scraped data source | `scraper/extract_data.py` for OCR, then a new `build_*.py` matching the existing pattern |
| Deploy a change | `git push origin main` (static + JSON). `wrangler deploy` from `worker/` for Worker changes. |

---

## Open architectural questions that need the Architect

These are things the code can't answer — they're policy/business decisions
that need human input before any build.

1. **Is Cloudflare Workers on the Paid plan?** The code runs on Free tier
   (Workers Free allows the existing endpoints). Browser Rendering for the
   lookup bot requires Workers Paid (~$5/mo base). I cannot check plan
   tier from inside the repo.
2. **Do we tear down the Stripe $9.99/$29.99/$99.99 products and rebuild
   for the 2-tier + credit pack model?** The Architect must decide — those
   products have historical charges tied to them.
3. **The Pro+ $9.99 tier (proposed today) — final scope?** Named in
   `docs/PRICING.md` § "Pro+" as proposed with three open questions
   (naming, included credits, Sonnet routing stringency).
4. **Does magic-link UI ship before or after the 2-tier Stripe rebuild?**
   Both unblock users but depend on each other for full flow.

---

## Changing this doc

Every edit to this doc gets an entry in `docs/DECISIONS.md` the same day.
Why? Because if this doc goes stale without a decision log entry, the next
Claude has no way to know whether the change was approved or drift.

If you find a claim in this doc that's wrong, do NOT silently fix it —
verify it against the code, then update both this doc and DECISIONS.md
with the correction and when you made it.

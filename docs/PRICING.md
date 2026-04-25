# PRICING — Authoritative Source of Truth

> **This file is the one truth about KingshotPro pricing.** If code, Stripe
> products, or any other memory file disagrees with this, THEY are wrong,
> not this doc. Any change here must sync to `js/pricing-config.js` in the
> same commit. No exceptions.

**Last confirmed by the Architect:** 2026-04-21
**Supersedes:** the killed `$9.99 / $29.99 / $99.99` tier structure from
commit `8ed7989` and any memory summary that still references it.

---

## Tier Structure

Four lanes to pay (or not pay). Free users get real utility. Credits are the
impulse path. Two subscriptions give increasing AI quality + included credits.

### 1. Free

- $0/mo, no account required
- Alliance rankings on every kingdom page
- All calculators, all guides, hero database
- Top Players aggregator
- **5 AI advisor conversations per day** (DeepSeek-backed)
- 6-turn conversation context

### 2. Credits (one-off packs)

| Pack | Credits | Price | Per-credit |
|------|---------|-------|------------|
| Starter | 10 | $1.99 | $0.199 |
| Standard | 30 | $4.99 | $0.166 |
| Best value | 75 | $9.99 | $0.133 |

**What credits unlock:**

| Cost | Unlocks |
|------|---------|
| ⚡ 1 | 24 hours of one kingdom's KvK intel (player rankings, kills, hero/pet power, Mystic Trial, Rebel Conquest) |
| ⚡ 3 | 7 days of one kingdom's KvK intel |
| ⚡ 8 | 30 days of one kingdom's KvK intel |
| ⚡ 1 | One world chat snapshot (permanent on that device) |
| ⚡ 3 | Refresh request for a tracked kingdom (standard, 72h turnaround) |
| ⚡ 5 | Add a new kingdom to tracking (standard, 72h) |
| ⚡ 6 | Refresh request — expedited (24h) |
| ⚡ 10 | Add a new kingdom — expedited (24h) |
| ⚡ 2.99 ($) | Character verification sticker (Pro subscribers) |
| ⚡ 4.99 ($) | Character verification sticker (Free users) |

### 3. Pro — $4.99/month

- Everything Free has, plus:
- **Unlimited AI advisor conversations** (Haiku 4.5-backed)
- 12-turn conversation context
- Kingdom Player details + Event details (all tracked kingdoms, unlimited)
- Chat history export
- Discounted character verification ($2.99 vs $4.99)
- **5 bonus credits included each month** (for kingdom requests / intel days)

### 4. Pro+ — $9.99/month  *(PROPOSED — awaiting Architect confirmation)*

Architect stated on 2026-04-21: *"we decided to add a $9.99/mo amount
for higher end ai (again making sure well within scope of what ai is
used so we're profitable)."*

Proposed scope (needs Architect sign-off before going live):

- Everything Pro has, plus:
- **Sonnet-class AI** for complex strategy questions (routing: routine chat still uses Haiku, deep analysis routes to Sonnet)
- 20-turn conversation context
- 15 bonus credits per month (vs Pro's 5)
- Priority on kingdom-request queue
- "War Council" badge on in-site presence

**Open questions for the Architect:**
1. Should Pro+ inherit the name "War Council" (kept as visible category
   per the April 16 decision doc)? Or a cleaner name like "Pro+"?
2. Included credits — 15/mo reasonable, or different number?
3. Cost-check: Sonnet is ~5× Haiku on tokens. At 200 msg/day average Pro+
   user, 10% routed to Sonnet = ~$4.50 variable cost. Leaves ~55% margin.
   OK, or should routing be stricter?

---

## Killed tiers

- `$29.99/mo War Council` — killed per April 16 decision. Keep the NAME as a
  category badge, but no subscription at this price.
- `$99.99/mo Elite` — killed per April 16 decision. Removed entirely.
- `$9.99/mo "old" Pro` — killed April 16, but a *new* $9.99 tier (Pro+, above)
  is planned with different scope. Don't confuse the two.

## Stripe state (current — reconciled 2026-04-22)

All products and prices below are LIVE on account `acct_1TKjtXCTwcITa9f2`
(`kingshotpro` display name). Active subscription count at reconciliation: 0.

### Active (current model)

| Name | Price | Product ID | Price ID | Buy link |
|------|-------|-----------|----------|----------|
| Pro | $4.99/mo | `prod_UNoVQD1Lx7PFc2` | `price_1TP2snCTwcITa9f2DRnl3zFX` | `buy.stripe.com/28E9AS4dgfrk3Ej4G46Vq06` |
| Pro+ | $9.99/mo | `prod_UNoV4QpP2aCqLO` | `price_1TP2sqCTwcITa9f2sG0bTArf` | `buy.stripe.com/28E6oG114cf8caP2xW6Vq07` |
| Credits — 10 (Starter) | $1.99 one-time | `prod_UNoVWk1eTyLgD4` | `price_1TP2stCTwcITa9f22LhqHc4c` | `buy.stripe.com/3cI4gyh02a70eiXa0o6Vq08` |
| Credits — 30 (Standard) | $4.99 one-time | `prod_UNoVz4tzSeiavV` | `price_1TP2suCTwcITa9f2PmWgSAmQ` | `buy.stripe.com/4gM4gy11492Wfn1dcA6Vq09` |
| Credits — 75 (Best Value) | $9.99 one-time | `prod_UNoVIV7XtcfFoE` | `price_1TP2sxCTwcITa9f2AiA4SJH9` | `buy.stripe.com/14AdR88tw0wqcaPdcA6Vq0a` |

### Archived (old 4-tier model)

Archived on 2026-04-22, `active: false`. No new checkouts possible on
these. Left in Stripe so historical receipts stay valid.

- `prod_UJU7DflIxmhC4t` / `prod_UJNdil1eu5jl6Y` — old "KingshotPro Pro" $9.99/mo
- `prod_UJU7a0UAgUXxjE` / `prod_UJNdVTU9eHgSrl` — old "KingshotPro War Council" $29.99/mo
- `prod_UJU77USWVLp4Pi` / `prod_UJNdyyNqHJQ4t6` — old "KingshotPro Elite" $99.99/mo

### Webhook mapping

The Worker's `handleStripeWebhook` at `worker/worker.js:1039` routes on
`session.mode` + `session.amount_total`. Matching amounts:
  - 499 → grants 30 credits (Credits — Standard) OR Pro tier if subscription
  - 199 → 10 credits
  - 999 → 75 credits OR Pro+ tier if subscription

Note: 499 is ambiguous between "30 credits" and "Pro subscription" at the
amount level. `session.mode` disambiguates (`payment` vs `subscription`)
so there's no conflict in practice. Same for 999.

---

---

## Oath and Bone Crown Economy

> Added 2026-04-25 (Worker 24). Numbers are verbatim from
> `games/designs/oath-and-bone/ECONOMY.md`. Mirror lives in
> `js/pricing-config.js` at `window.KSP_PRICING.oathandbone`.
> `stripe_url` fields are `TBD-MANUAL` until the Architect creates
> the products — see `games/designs/oath-and-bone/STRIPE_SETUP_GUIDE.md`.

### Crown packs (one-time purchase)

| Tier | Price | Crowns | Bonus | Effective $/Crown |
|---|---|---|---|---|
| Pocket Pack | $0.99 | 200 | — | $0.0050 |
| Coffer Pack | $4.99 | 1,200 | +200 = 1,400 | $0.0036 |
| Hoard Pack | $19.99 | 5,500 | +1,500 = 7,000 | $0.0029 |
| King's Cache | $49.99 | 15,000 | +5,000 = 20,000 | $0.0025 |

First-purchase bonus: first pack of any tier grants +50% bonus Crowns (one-time per account). Server-enforced.

### Campaign Pass (Stripe subscription)

| Pass | Price | Duration | Perks |
|---|---|---|---|
| Chapter Pass | $4.99 | One chapter | +50% Crown earn, 50 Crown daily stipend, one exclusive portrait frame, cutscene gallery access |
| Campaign Pass | $9.99/month | One month | Above + 100 Crown daily stipend + one job-advancement token/month + Chapter N+1 beta access |

Pass active state: `cache.isCampaignPassActive()`. Pass suppresses all interstitial ads.

### Crown shop categories (in-game, Crown-denominated)

Order mirrors ECONOMY.md §3: `equipment`, `consumables`, `spells`,
`reagents`, `boosts`, `training`, `cosmetics`. No real-money prices
inside the shop — all Crown costs are defined in the shop item tables
in ECONOMY.md, not in this file.

### Credit → Crown conversion

Rate: 1 credit = 50 Crowns, one-way. Endpoint: `POST /oath-and-bone/convert-credits`.

### Hard constraints (per ECONOMY.md §10)

- No content, hero, job, spell, or ending locked to spend.
- No gacha — all shop items are direct-priced.
- No energy gates — unlimited practice mode after daily cap.
- No pay-to-win — paying accelerates; everything reachable by free play.
- Permadeath is real — no revive-for-Crowns.
- "Unofficial. Not affiliated with Century Games." disclaimer on all shop + payment UI.

---

## Changing this doc

1. Edit the numbers here first.
2. Update `js/pricing-config.js` in the same commit.
3. Note the change in `docs/DECISIONS.md` with date + reasoning.
4. Before merging, grep the repo for any hardcoded price that isn't
   consuming `js/pricing-config.js` — those are bugs, fix them.

**Never update the code without updating this doc. Never update this doc
without updating the code.**

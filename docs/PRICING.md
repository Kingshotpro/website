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

## Stripe state (as of 2026-04-21)

Commit `8ed7989` created live Stripe products at the killed prices. These
need action:

| Product | Price | Buy link | Action needed |
|---------|-------|----------|---------------|
| "PRO" | $9.99/mo | `buy.stripe.com/9B68wObFI5QKa2H8Wk6Vq03` | Archive or re-price to $4.99 |
| "WAR COUNCIL" | $29.99/mo | `buy.stripe.com/3cI4gydNQ6UO3Ej6Oc6Vq04` | **Archive** |
| "ELITE" | $99.99/mo | `buy.stripe.com/28EcN45hkeng3Ej3C06Vq05` | **Archive** |
| "Credits — 10/30/75" | — | — | **Create** |
| Pro — $4.99/mo | — | — | **Create** |
| Pro+ — $9.99/mo | — | — | **Create after confirmation** |

A Claude with Stripe MCP access can do this in one session after explicit
Architect go-ahead.

---

## Changing this doc

1. Edit the numbers here first.
2. Update `js/pricing-config.js` in the same commit.
3. Note the change in `docs/DECISIONS.md` with date + reasoning.
4. Before merging, grep the repo for any hardcoded price that isn't
   consuming `js/pricing-config.js` — those are bugs, fix them.

**Never update the code without updating this doc. Never update this doc
without updating the code.**

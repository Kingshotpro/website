# Stripe Setup Guide — Oath and Bone

*This is the Architect-only manual step. All code is deployed with `TBD-MANUAL`
placeholders in `js/pricing-config.js`. After creating these products in the Stripe
dashboard, paste the resulting payment-link URLs into the `stripe_url` fields below
and commit the change (both `js/pricing-config.js` and `docs/PRICING.md` in the same
commit, per project CLAUDE.md).*

---

## 1. Pre-flight checks

1. Log in to [dashboard.stripe.com](https://dashboard.stripe.com).
2. Confirm you are on account `acct_1TKjtXCTwcITa9f2` (display name: `kingshotpro`).
3. Decide: test mode first (toggle top-left), then go live. Steps are identical in both modes.

---

## 2. Crown pack products (one-time payments)

Create 4 products. For each: **Products → Add product → One-time price**.

| Product name in Stripe | Amount | pricing-config.js key | stripe_url field to update |
|---|---|---|---|
| OAB Crown Pack — Pocket | $0.99 | `oathandbone.crown_packs.pocket` | `stripe_url` |
| OAB Crown Pack — Coffer | $4.99 | `oathandbone.crown_packs.coffer` | `stripe_url` |
| OAB Crown Pack — Hoard | $19.99 | `oathandbone.crown_packs.hoard` | `stripe_url` |
| OAB Crown Pack — King's Cache | $49.99 | `oathandbone.crown_packs.kings` | `stripe_url` |

For each product after creating:
1. Go to **Payment links → Create link** for that product.
2. Copy the `buy.stripe.com/…` URL.
3. Paste it into the matching `stripe_url` field in `js/pricing-config.js`.

**Webhook extension needed** — the existing `handleStripeWebhook` in
`worker/worker.js:1039` routes on `session.mode` + `session.amount_total`. Crown pack
amounts (99, 499, 1999, 4999) do not yet map to any Oath and Bone grant. Before going
live, extend the webhook handler to recognize these amounts + grant Crowns to the
player's `oab_state_{fid}.crown_balance` via the KV layer. This is Worker 28+ scope —
see MONETIZATION_LOG.md §Webhook gap.

---

## 3. Pass products (subscriptions)

Create 2 products. For each: **Products → Add product → Recurring price → Monthly**.

| Product name in Stripe | Amount | pricing-config.js key | stripe_url field to update |
|---|---|---|---|
| OAB Chapter Pass | $4.99/month | `oathandbone.passes.chapter` | `stripe_url` |
| OAB Campaign Pass | $9.99/month | `oathandbone.passes.campaign` | `stripe_url` |

Same payment-link creation steps as packs.

**Pass activation webhook** — on `checkout.session.completed` for subscription mode, the
worker must set `campaign_pass_active: true` and `pass_expires_iso: <ISO of next billing
date>` in the player's KV state. Also on `customer.subscription.deleted` / `invoice.payment_failed`,
clear those fields. Until wired, the pass only activates if you manually set those fields in KV
for testing. Worker 28+ scope.

---

## 4. Webhook amount disambiguation

Current `worker.js:1039` matches amounts like this:
```
499 → 30 credits (payment) OR Pro subscription (subscription)
199 → 10 credits
999 → 75 credits OR Pro+ subscription
```

New OAB amounts to add:
```
99   → OAB Pocket Pack (payment) → grant 200 Crowns
499  → already used — CAUTION: Crown Pack Coffer at $4.99 collides with 30-credit pack
       at $4.99. Disambiguate by metadata. In the Stripe product creation above, add a
       metadata field:  product_type = oab_crown_coffer
       In the webhook, check metadata.product_type before routing.
1999 → OAB Hoard Pack (payment) → grant 7000 Crowns
4999 → OAB King's Cache (payment) → grant 20000 Crowns
499  → Chapter Pass (subscription) → same metadata disambiguation as above
999  → Campaign Pass (subscription) → same as Pro+; use metadata product_type = oab_campaign_pass
```

**Recommendation:** add `metadata.product_type` to every new Stripe product at creation
time. The webhook can then route cleanly on metadata instead of amount, avoiding the
$4.99 / $9.99 ambiguity entirely. This also makes future product additions safe.

---

## 5. After creating products — code change

Open `js/pricing-config.js` and replace the 6 `'TBD-MANUAL'` values:

```js
window.KSP_PRICING.oathandbone = {
  crown_packs: {
    pocket: { usd: 0.99,  crowns: 200,   bonus: 0,    stripe_url: 'https://buy.stripe.com/YOUR_POCKET_LINK' },
    coffer: { usd: 4.99,  crowns: 1200,  bonus: 200,  stripe_url: 'https://buy.stripe.com/YOUR_COFFER_LINK' },
    hoard:  { usd: 19.99, crowns: 5500,  bonus: 1500, stripe_url: 'https://buy.stripe.com/YOUR_HOARD_LINK'  },
    kings:  { usd: 49.99, crowns: 15000, bonus: 5000, stripe_url: 'https://buy.stripe.com/YOUR_KINGS_LINK'  },
  },
  passes: {
    chapter:  { usd: 4.99, duration: '1 chapter',  stripe_url: 'https://buy.stripe.com/YOUR_CHAPTER_LINK'  },
    campaign: { usd: 9.99, duration: '1 month',    stripe_url: 'https://buy.stripe.com/YOUR_CAMPAIGN_LINK' },
  },
  ...
```

Also update `docs/PRICING.md` Stripe state table with the new product IDs and price IDs.
Add a DECISIONS entry: `"2026-MM-DD — Architect: Oath and Bone Stripe products created"`.

---

## 6. AdSense slot IDs (separate from Stripe)

The interstitial and rewarded video units in the game reference placeholder slot IDs:
- `OAB-INTERSTITIAL-TBD` in `_tryInterstitial()` in `game-oath-and-bone-render.js`
- `OAB-REWARDED-VIDEO-TBD` in `_showRewardedVideoStub()` in `game-oath-and-bone-render.js`

To activate real ads:
1. Log in to [adsense.google.com](https://adsense.google.com).
2. Create a **Display ad** unit for the interstitial (300×250 recommended) and note its slot ID.
3. Create a **Rewarded ad** unit for the rewarded video (requires AdSense approval for rewarded).
4. Replace `'OAB-INTERSTITIAL-TBD'` and `'OAB-REWARDED-VIDEO-TBD'` in `game-oath-and-bone-render.js`
   with the real slot IDs.

Rewarded video requires a separate AdSense approval. Until approved, the stub shows a
"slot not yet configured" placeholder and the boost still applies (for testing). In production,
the reward is only granted after the real video plays.

---

## 7. Test mode checklist

- [ ] All 6 `stripe_url` fields updated from `TBD-MANUAL` to real test-mode links
- [ ] Click Pocket Pack → Stripe checkout opens in new tab → complete with test card 4242...
- [ ] Stripe test webhook fires → Crown grant appears in player KV (verify in CF dashboard)
- [ ] Click Chapter Pass → subscription checkout → webhook sets `campaign_pass_active`
- [ ] Shop "Campaign Pass active" banner appears on reload
- [ ] Interstitials suppressed after subscribing (pass active)
- [ ] Switch to live mode: replace test links with live payment links

---

## 8. Free-Means-Free reminder

Per project CLAUDE.md and `feedback_free_means_free.md`:
- The shop must never show a "free trial" or "free for now" badge.
- "Coming Soon" buttons are acceptable stubs — they do not imply upcoming cost change.
- All Crown shop items are purchasable through play. Never add language that implies
  otherwise (e.g., "locked until purchase").
- Add a DECISIONS entry before removing any item from the free-play earn path.

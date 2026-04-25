# Oath and Bone — Monetization Handoff Log

*Worker 24, 2026-04-25. Four commits. Not deployed — pending Architect
`wrangler deploy` from `worker/` (same as Worker 22/23 gap).*

---

## Concern 1 — Prices locked

**Status:** Shipped. All three files in one commit (2cb4e81).

**Files:**
- `js/pricing-config.js` — `window.KSP_PRICING.oathandbone` block added.
  4 Crown pack tiers, 2 pass tiers, 7 shop categories, credit→Crown rate.
  All `stripe_url` fields: `TBD-MANUAL`.
- `docs/PRICING.md` — "Oath and Bone Crown Economy" section added. Mirrors
  pricing-config verbatim. Hard-constraint table (no P2W, no gacha, etc.).
- `docs/DECISIONS.md` — top entry: every decision made by Worker 24 documented.

**Verified:** numbers match ECONOMY.md §5, §7 verbatim. Cross-checked line by line.

---

## Concern 2 — Crown shop UI

**Status:** Shipped (95346da).

**Files:**
- `js/oath-and-bone-cache.js` — 6 new public methods + 4 new DEFAULT_STATE
  fields (inventory, campaign_pass_active, pass_expires_iso, active_xp_boost).
- `js/game-oath-and-bone-render.js` — shop CSS (~55 new style rules), item
  tables (all 7 categories verbatim from ECONOMY.md), `_showShop()`, `_toast()`.
  SHOP button + Campaign Pass button added to world map.
- `games/designs/oath-and-bone/CACHE_LOG.md` — §7 documents new cache API.

**No-P2W audit:**
Every item in the Crown shop was reviewed against ECONOMY.md §10:

| Category | Items | P2W risk? | Verdict |
|---|---|---|---|
| Equipment | T1–T3 weapons/armor/accessories/focus | All craftable/droppable in play | ✓ CLEAR |
| Consumables | Potions, tonics, bombs, rations | All droppable in play | ✓ CLEAR |
| Spells | Tome tiers Lv1–Lv15+ | Free via level-up + location visit | ✓ CLEAR |
| Reagents | Bone dust, seeds, ash, etc. | All droppable from enemy kills | ✓ CLEAR |
| Boosts | XP Booster, Primers, Morale Banner, Scout | Pre-battle consumables, capped at 5/battle | ✓ CLEAR — finite per battle |
| Training | Stat +1, Skill accelerator, Job token, Hybrid token | Reduce grind time; free play also reaches all jobs/stats at higher level | ✓ PAY-TO-ACCELERATE, not pay-to-win |
| Cosmetics | Frames, tile themes, VFX, banners, gallery | Zero mechanical effect | ✓ CLEAR |

**Conclusion:** No purchasable item grants direct combat power not obtainable through free play.
The Skirmish Scout boost (reveals enemy positions pre-battle) is the closest to advantage —
but Pro subscribers get 2 free/day, and free players can also save Crowns to buy it. The
information asymmetry is temporary and symmetric across all play styles. ECONOMY.md §10
confirms no P2W. ✓

**Inventory note:** Items are owned in `ksp_oab_state.inventory`. They are NOT
functional during combat in this MVP — equip/use-in-battle is V2 scope. The MY ITEMS
tab shows ownership; equipping is deferred.

---

## Concern 3 — Purchase flows + ad surfaces

**Status:** Shipped (9109988).

**Files:**
- `js/game-oath-and-bone-render.js` — `_showCrownPacks()`, `_showCampaignPass()`,
  `_showPreBattle()`, `_doStartScenario()`, `_tryInterstitial()`,
  `_tryRewardedXpAd()`, `_showRewardedVideoStub()`.
- `games/oath-and-bone.html` — AdSense script tag added (ca-pub-8335376690790226).

**Stripe buy flow:**
- TBD-MANUAL urls → informative toast: "Stripe product not yet configured. See STRIPE_SETUP_GUIDE.md."
- Real urls → `window.open(url, '_blank')` → Stripe checkout.
- On return from Stripe: `syncFromServer()` will pick up new Crown balance
  after webhook credits the account (webhook gap below).

**Campaign Pass active state:**
- `cache.isCampaignPassActive()` reads `campaign_pass_active && pass_expires_iso > now()`.
- Server is canonical; cache mirrors. Until webhook is wired, Architect can manually
  set `campaign_pass_active: true` + `pass_expires_iso: "2099-01-01T00:00:00Z"` in
  Cloudflare KV key `oab_state_{fid}` for testing.

**Ad caps (per ECONOMY.md §8):**

| Ad type | Cap | localStorage key | Suppressed by |
|---|---|---|---|
| Interstitial | 3/day | `ksp_oab_ads_interstitial_YYYY-MM-DD` | Campaign Pass active |
| Rewarded XP (+20% XP) | 2/day | `ksp_oab_ads_rewarded_xp_YYYY-MM-DD` | Campaign Pass active |
| Rewarded Crown (+30 Crowns) | 1/day | n/a — not yet wired | Campaign Pass active |

**Ad surfaces wired:**
- world map → pre-battle: `_tryInterstitial()` then `_showPreBattle()`.
- battle results Continue → world map: `_tryInterstitial()` then `_showWorldMap()`.
- pre-battle screen: "Watch Ad for +20% XP" button → `_tryRewardedXpAd()`.

**Rewarded Crown grant (ECONOMY.md §8 third ad surface):** not yet wired to a button.
The shop body has room for a "Watch Ad for +30 Crowns" button (1/day). This is
straightforward to add: call `_showRewardedVideoStub(...)` from a button in `_showShop()`,
on claim call `OathAndBoneCache.spend(-30, 'rewarded_crown', 'ad')` with a negative amount
(or a dedicated `addCrowns` helper). Deferred to Worker 28+ scope.

---

## Webhook gap (Worker 28+ scope)

**Current state:** `worker/worker.js:1039` (`handleStripeWebhook`) routes on
`session.mode` + `session.amount_total`. No handler exists for Oath and Bone amounts.

**What needs adding:**
1. New Stripe products (Crown packs + passes) must include `metadata.product_type` at
   creation time (see STRIPE_SETUP_GUIDE.md §4).
2. Webhook handler must route on `metadata.product_type`:
   - `oab_crown_pocket` → grant 200 Crowns to `oab_state_{fid}.crown_balance`
   - `oab_crown_coffer` → grant 1400 Crowns (1200 + 200 bonus, or 1200 base + first-purchase check)
   - `oab_crown_hoard`  → grant 7000 Crowns
   - `oab_crown_kings`  → grant 20000 Crowns
   - `oab_chapter_pass` → set `campaign_pass_active: true`, `pass_expires_iso: <next_billing_date>`
   - `oab_campaign_pass`→ same
3. First-purchase +50% bonus: add `oab_first_purchase_{fid}` KV key (bool). On first grant,
   multiply Crowns by 1.5. Set the key after granting.
4. `customer.subscription.deleted` + `invoice.payment_failed` → clear pass fields.

**Until webhook is wired:** "Coming Soon" buttons show a stub message. No money can be
collected for Oath and Bone products. The shop UI, Crown balance, and inventory are fully
functional for Crowns earned through play.

---

## Worker 28+ scope

| Item | Notes |
|---|---|
| Webhook extension for Crown packs + passes | See §Webhook gap above |
| Equip/use items during combat | MVP deferred — MY ITEMS tab shows ownership only |
| Rewarded Crown grant button in shop | 1/day, +30 Crowns, per ECONOMY.md §8. Easy add. |
| Campaign Pass server sync on load | `syncFromServer()` should refresh `campaign_pass_active` via Stripe subscription check |
| Real AdSense slot IDs (interstitial + rewarded) | Currently `OAB-INTERSTITIAL-TBD` / `OAB-REWARDED-VIDEO-TBD`. See STRIPE_SETUP_GUIDE.md §6 |
| Leaderboards | Out of scope for monetization MVP |
| Achievements | Out of scope |
| Cross-device inventory sync | Inventory is client-side only (see CACHE_LOG.md §7). Server-side persistence requires Worker save endpoint extension. |

---

*Worker 24, 2026-04-25. Four commits shipped. Stripe products: Architect manual step.
Webhook: Worker 28+ scope. The game has a working shop, Crown earn/spend,
Campaign Pass UI, and ad-supported free play. Free-Means-Free maintained. ✓*

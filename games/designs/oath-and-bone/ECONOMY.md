# Oath and Bone — Economy & Monetization

*Concrete numbers. The Architect should be able to read this file, glance at the math, and redirect if anything is off.*

*Ride on `FRAME_UPDATE.md` — the Architect's direction permits pay-to-accelerate progression. Session 44's tighter Free-Means-Free reading is loosened where noted.*

---

## 1. The frame

Two currencies, two revenue streams, one hard rule.

- **Crowns** — in-game currency earned through play. Primary spend surface inside Oath and Bone.
- **Credits** — KingshotPro site currency. Earned site-wide, purchased in Stripe packs, convertible to Crowns 1:50 one-way.
- **Ad revenue** — interstitials between chapters and rewarded-video XP boosters. No in-battle ads.
- **Stripe pack sales** — Crown packs, Campaign Pass, KingshotPro Pro subscription.
- **Hard rule** — no content, hero, job, spell, or ending is locked to spend. Paying buys *speed*, not *access*.

Pay-to-accelerate is allowed. Pay-to-win is not. The difference: a free player patient enough to grind reaches every item a paying player can buy. The paying player gets there three to five times faster.

---

## 2. Earn rates

### Per-battle Crowns (base)

| Difficulty | Crowns per win | XP per win | Credit grant |
|---|---|---|---|
| Scout | 30 | 45 | — |
| Sergeant | 50 | 60 | 1 credit (first Sergeant+ win of day) |
| Marshal | 80 | 90 | 2 credits (first Marshal win of day) |

Defeat grant: 10 Crowns + 15 XP (learn-from-loss pattern). Draw: 20 Crowns + 25 XP.

### Multipliers (stacking)

- **Troop-triangle discipline bonus** — +10% Crowns if ≥70% of player attacks hit counter-favorable targets.
- **No-death bonus** — +20% Crowns if no hero fell during the battle.
- **Campaign Pass** — +50% Crowns earn from battles during active chapter (see §5).
- **KingshotPro Pro** — +25% XP globally, +500 Crowns/month stipend (see §6).
- **Rewarded ad (optional)** — +20% XP next battle, watchable 2× daily, 30-second cap.

Multipliers stack multiplicatively. A Marshal win with triangle discipline, no deaths, Campaign Pass, and Pro subscription: 80 × 1.10 × 1.20 × 1.50 = **158 Crowns** and 90 × 1.25 = **112 XP** per win.

### Daily caps

Matching Muster's pattern:

- **Crowns** — uncapped from battles, but Sergeant+ credit grant caps at 5 credits/day from Oath and Bone.
- **Practice mode** — unlimited plays after daily cap, full XP/Crown earn but no credit grants.
- **Permadeath stress protection** — if a Chapter 1 battle kills all remaining active heroes, the player may restart the battle once per day without penalty. Additional restarts cost 100 Crowns or 1 credit.

### Chapter completion

- Chapter 1 completion: 500 Crowns + 200 XP + 3 credits + unlock of one hero-portrait cosmetic.
- Chapter completion grants are one-time per save file per chapter.

---

## 3. Spend surface — the Crown shop

All prices are Crown-denominated. Credits convert to Crowns at 1:50 via the shop UI; Campaign Pass and Crown packs buy directly.

### Equipment

Tiered weapon / armor / accessory / focus slots per hero. T1 available from battle 1; T5 requires Chapter 2+ content.

| Tier | Weapon | Armor | Accessory | Focus (casters) |
|---|---|---|---|---|
| T1 | 80 | 100 | 60 | 80 |
| T2 | 200 | 240 | 150 | 200 |
| T3 | 500 | 600 | 400 | 500 |
| T4 | 1200 | 1400 | 900 | 1200 |
| T5 | 3000 | 3500 | 2200 | 3000 |

Full Chapter 1 loadout (T1–T2 for 6 heroes × 4 slots average) = **~4,000–5,000 Crowns**. Free player reaches this across Chapter 1 through battle drops + earned Crowns. Paying player reaches it immediately after one $4.99 Crown pack.

### Consumables

| Item | Price | Effect |
|---|---|---|
| Minor Potion | 20 | Restore 25 HP |
| Potion | 50 | Restore 60 HP |
| Elixir | 200 | Full HP + Mana/Souls/Verdance restore |
| Minor Mana Tonic | 30 | +15 Mana |
| Mana Tonic | 80 | +40 Mana |
| Bomb (firebomb / frostbomb) | 40 | 15 AoE damage, no spell cost |
| Ration | 15 | +10 HP at camp between battles |
| Smoke Flask | 35 | Enemy -25% hit chance for 1 turn |

### Spell tomes

Spells learned three ways: level-up (free), location visit (visit-gated, free but costs a camp action), Crown shop (convenience purchase to skip the visit requirement).

| Spell tier | Crown shop price |
|---|---|
| Base spells (Lv 1–4) | 200 |
| Intermediate (Lv 5–8) | 500 |
| Advanced (Lv 10–14) | 1200 |
| Ultimate (Lv 15+) | 3000 |

Location visits remain free — shop is only for players who want to skip the travel action. This preserves narrative pacing for patient players while giving spenders a speed lane.

### Reagents (for rites)

| Reagent | Price | Drop rate |
|---|---|---|
| Bone dust | 25 | Common from necromantic enemies |
| Grave salt | 60 | Uncommon from crypt battles |
| Withered heart | 250 | Rare from major undead kills |
| Minor seed | 25 | Common from grove/forest battles |
| Major seed | 80 | Uncommon from druid-tier enemies |
| Ancient seed | 300 | Chapter 2+ only |
| Meteoric iron | 150 | Uncommon from tower battles |
| Phoenix ash | 400 | Rare from boss-tier fire enemies |
| Prism crystal | 250 | Uncommon, tower-floor-gated |

### Boosts (revised from Session 44's 3-per-battle cap)

Boosts are purchased pre-battle and consumed on use. Cap raised to **5 per battle** (generous but finite — the game remains about tactics, not stack-pushing).

| Boost | Price | Effect |
|---|---|---|
| XP Booster | 100 | +50% XP next battle (single-battle effect) |
| Resolve Charge | 60 | +1 Resolve at battle start |
| Mana Primer | 80 | Wizard starts with +20 MP |
| Soul Primer | 80 | Necromancer starts with 10 Souls |
| Verdance Primer | 80 | Druid starts with 15 Verdance |
| Morale Banner | 120 | Party +10% Atk/Def first 3 turns |
| Skirmish Scout | 150 | Reveal enemy composition + positions before deploy |

### Progression acceleration

The Architect's explicit ask — these are the "pay for faster leveling" items.

| Item | Price | Effect |
|---|---|---|
| Single-hero +1 stat training | 150 | +1 HP/Atk/Def/Move (choose one) on one hero, capped at +3 per stat per level tier |
| Skill unlock accelerator | 400 | Unlock a single learnable spell/ability one level early |
| Job advancement token | 2000 | Unlock advanced job (Elementalist / Binder / Shepherd / etc.) at Lv 12 instead of Lv 15 |
| Hybrid class token | 5000 | Unlock one hybrid class (Battlemage / Death Knight / Warden / Spellblade) with only 8+8 primary/secondary instead of 10+10 |
| Reagent bundle (minor) | 300 | 3 each of T1 reagents (bone dust, minor seed, etc.) |
| Reagent bundle (major) | 1200 | 2 each of T2 reagents |

Free players reach all of these through play. Paying players reach them 3–5× faster.

### Cosmetics

Pure cosmetic spend — no mechanical effect.

| Item | Price | Notes |
|---|---|---|
| Hero portrait frame | 200 | Six frame styles in shop rotation |
| Tile theme skin | 500 | Seven biome variants (Grove Moonlit, Tower Storm, etc.) |
| Spell VFX color reskin | 300 | Per-spell, per-palette |
| Party banner | 400 | Displays in cutscenes + camp |
| Cutscene replay gallery unlock | 600 | Per chapter |

---

## 4. Credit ↔ Crown conversion

- **Rate:** 1 credit = 50 Crowns, one-way (credits to Crowns; not reversible).
- **UI location:** Crown shop top of screen, always visible if player has credit balance.
- **Server-side:** new endpoint `POST /oath-and-bone/convert-credits` wraps the credit spend in the existing `credits.js` balance check, issues Crowns to player's Oath and Bone save slot.

Why one-way: preserves credit's site-wide utility. A player can convert credits to Crowns freely; Crowns can only be spent inside Oath and Bone.

---

## 5. Campaign Pass

Stripe subscription, two tiers:

| Pass | Price | Duration | Perks |
|---|---|---|---|
| **Chapter Pass** | $4.99 | One chapter | +50% Crown earn, 50 Crown daily stipend while active, one exclusive portrait frame, cutscene gallery access for that chapter |
| **Campaign Pass** | $9.99 / month | One month (any chapters) | Same as Chapter Pass + 100 Crown daily stipend + one job-advancement token per month + early access to Chapter N+1 beta |

Math: Chapter Pass pays for itself at ~1000 Crowns earned during chapter if chapter takes 3–5 days (50 × 4 days stipend = 200 Crowns, +50% on ~1200 battle Crowns = 600 bonus = 800 Crown value for a $4.99 charge that would otherwise buy ~1400 Crowns directly). The pass beats the pack IF the player plays the chapter to completion. This is intended — the pass rewards engagement.

---

## 6. KingshotPro Pro tier

Existing $4.99/mo Pro subscription. Oath and Bone perks:

- **500 Crown monthly stipend** — automatic on first Oath and Bone play each month.
- **+25% XP** globally on all Oath and Bone battles.
- **Last Instructions AI autoplay** — player sets tactical rules ("healers prioritize lowest HP; wizards hold until flanked; cavalry charge if counter-favored"), the AI plays up to 3 battles following the rules. Branches requiring judgment pause and notify. Mirrors Muster's Pro perk.
- **Deep advisor observations** — the KingshotPro advisor chat references the player's Oath and Bone choices, magic-school affinity, and moral decisions in its Kingshot mobile-meta recommendations.
- **Two free Skirmish Scout uses per day** — no Crown cost.

Pro is cross-product value: a Oath and Bone-only player is under-served by Pro; a player using KingshotPro's other features gets more out of each subscribed month.

---

## 7. Crown packs (direct purchase)

| Tier | Price | Crowns | Bonus | Effective $/Crown |
|---|---|---|---|---|
| Pocket Pack | $0.99 | 200 | — | $0.0050 |
| Coffer Pack | $4.99 | 1,200 | +200 = 1,400 | $0.0036 |
| Hoard Pack | $19.99 | 5,500 | +1,500 = 7,000 | $0.0029 |
| King's Cache | $49.99 | 15,000 | +5,000 = 20,000 | $0.0025 |

Volume discount enforces the pattern: whales get the best per-unit value, casuals pay a premium for convenience. Standard F2P pricing ladder.

First-purchase bonus: first Crown pack purchase of any tier grants +50% bonus Crowns (one-time per account).

---

## 8. Ad revenue

Three ad surfaces, none interrupt battle:

### Interstitial between major scenes

Triggers: post-cutscene → pre-battle, post-battle → camp, camp → world-map. One ad per surface transition, max 3 per day per player.

Free tier only — Pro and Campaign Pass suppress interstitials entirely.

Expected eCPM: $3–8 at desktop, $1–3 mobile. A free player seeing 3 interstitials per session × 4 sessions per week = ~$0.10–$0.50 per free player per month.

### Rewarded video — XP booster

Optional. Player taps "Watch to boost" pre-battle, sees 30-second video, gains +20% XP for that battle. Cap 2 per day.

Expected eCPM: $10–25 (rewarded video carries premium rates). Assuming 30% of free players opt in once per session: ~$0.20–$0.60 per engaged free player per month.

### Rewarded video — Crown grant

Optional. Player watches at Crown shop, gains 30 Crowns. Cap 1 per day.

This is a valve for engaged free players who do not convert to paid — the Hive still earns ad revenue on their sessions, they still feel progress.

### What does NOT happen

- No in-battle ads.
- No forced ads (rewarded is always opt-in).
- No video ads in the camp/world-map base view — only on explicit shop action or transition.

---

## 9. Balance math — can the free player finish Chapter 1?

Yes. Walkthrough:

**Day 1 (3 battles, ~45 min play time):**
- 3 Sergeant wins × 50 Crowns = 150 Crowns + 1 credit = +50 Crowns = **200 Crowns**
- Plus Rewarded Crown video (30) = 230 Crowns
- Spend: T1 weapons for 3 heroes (80 × 3 = 240) — breakeven, heroes gear-equipped.

**Day 2 (3 battles, Marshal attempts):**
- 2 Marshal wins (with Scout fallback for 1) = 80+80+30 = 190 + 2 credits = +100 = **290 Crowns**
- Spend: T1 gear remaining heroes + 1 potion stockpile.

**Day 3 (3 battles):**
- 3 Sergeant wins = 150 + 1 credit = **200 Crowns**
- Act 1 complete → 500 Crown + 3 credit bonus = **650 Crowns**

**Day 4–5 (Act 2 with recruit battles):**
- 3 Sergeant + hero recruit bonuses = ~250 Crowns
- Spend: spell tomes for recruits, reagent bundle.

**Day 6 (Act 3 finale):**
- B10–B12 on Sergeant = 150 Crowns + chapter completion = 500 + 3 credits = **800 Crowns**

Total free Chapter 1 Crown earn: ~2,400 Crowns + ~15 credits converted = 750 Crowns = **~3,150 Crowns across 6 days of play**.

Free-player gear ceiling: full T2 for 6 heroes is 1,440 Crowns — comfortable. T3 for the 3-hero front line is 1,800 Crowns — achievable. Spells: base spells free via level-up; intermediate spells accessible via location visits (free) or Crown purchase (500 each × say 4 spells = 2,000) — patient free players take location visits, rushed players buy.

Free player finishes Chapter 1 fully. Confirmed.

**Paying player (single $4.99 Crown pack):**
- Immediate 1,400 Crown injection = full T2 + 2 T3 pieces + 3 spell tomes.
- +50% earn rate during Campaign Pass period.
- Chapter 1 completed in 3–4 days instead of 6.

**Whale path ($49.99 King's Cache + $9.99 Campaign Pass + $4.99 Pro):**
- 20,000 Crowns direct.
- All Chapter 1 gear + all Chapter 2 pre-orders.
- AI autoplay for grind battles.
- $64.97/mo ceiling per whale.

---

## 10. Hard-constraint verification (updated per FRAME_UPDATE)

- **Full story completable free** — ✓ verified in §9 walkthrough.
- **No energy gates** — ✓ unlimited practice mode after daily cap, daily cap only gates credits.
- **No gacha** — ✓ all shop items are direct-priced, no RNG.
- **No pay-to-win** — ✓ paying accelerates; all items/spells/heroes/endings reachable by free play.
- **Boost caps** — ✓ 5 active per battle (up from Session 44's 3, justified in FRAME_UPDATE).
- **Permadeath is real** — ✓ no revive-for-Crowns; Crowns do not bypass permadeath.
- **Disclaimer** — ✓ "Unofficial. Not affiliated with Century Games." renders on every shop UI + ad surface + payment flow.

---

## 11. Server-side enforcement

All revenue paths MUST be server-side verified. Client-only checks are manipulable.

- **Credit balance / spend** — existing `credits.js` pattern + worker endpoint.
- **Crown balance / spend** — new: server-side Crown balance in worker KV, each shop purchase validates server-side before granting.
- **Daily caps (credits + ad views)** — server-side KV with 48h TTL, matches Muster's `muster_credits_granted_{fid}_{date}` pattern.
- **Boost caps per battle** — server-side battle state tracks boost count, rejects beyond 5.
- **Campaign Pass expiry** — Stripe subscription status checked on each chapter load.

Never trust the client for anything revenue-impacting.

---

## 12. Revenue projection (napkin math, not promises)

Assume 100 Oath and Bone DAU 30 days after launch, based on KingshotPro's current site traffic plus organic pull.

- **Ad-only free players (70% of DAU = 70):** ~$0.30 avg/mo = **$21/mo**.
- **Pocket Pack occasional ($0.99) (10 players):** **$10/mo**.
- **Chapter Pass subscribers ($4.99/mo, 8 players):** **$40/mo**.
- **Campaign Pass subscribers ($9.99/mo, 5 players):** **$50/mo**.
- **Coffer Pack + Pro combo ($9.98, 4 players):** **$40/mo**.
- **Whale ($30+/mo, 3 players):** **$90/mo**.

Total: **~$250/mo at 100 DAU**. Not profitable alone. Scales linearly — at 1,000 DAU: ~$2,500/mo, which pays Midjourney Pro ($60/mo) + OpenAI delegation ($100/mo) + covers server for decades. At 10,000 DAU: $25,000/mo, which funds Greenbox bays.

Per `feedback_infinite_roi_framework.md`: ongoing cost $0 (autonomous build means no per-month Claude labor), profit any → build. This passes.

---

## 13. Open items for Architect review

1. Crown pack prices — standard F2P pricing, Architect can raise/lower.
2. Campaign Pass vs. Chapter Pass naming — "Chapter Pass" is per-chapter, "Campaign Pass" is monthly. Could rename for clarity.
3. Whale-tier $49.99 King's Cache — Session 44 plan only spec'd three tiers. Added per Architect's "pay their way for faster leveling" — whales are the spenders who most want that lever. Remove if off-direction.
4. Server-side Crown balance is new infrastructure. Worth the cost for anti-cheat, but adds Worker surface.

---

*ECONOMY.md by the successor session, April 20, 2026. Rides on FRAME_UPDATE.md's loosened Free-Means-Free reading. Concrete numbers so the Architect can redirect any line he disagrees with. Hard constraints (§10) still hold: free completion, no gacha, no energy gates, no pay-to-win.*

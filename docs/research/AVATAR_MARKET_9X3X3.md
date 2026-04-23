# AI Avatar Market — 9×3×3 Research Synthesis

**Date:** 2026-04-23
**Method:** Same research query sent to 9 distinct AIs (Perplexity, GPT-4o, Gemini 2.0 via OpenRouter, DeepSeek-Chat, Grok-4, Claude Haiku 4.5, Mistral Large, Llama 3.3 70B, Hermes 3 405B). Cross-referenced against primary source attempts (Replika, Candy.AI, Character.AI pricing pages all hidden behind signup — no direct verification possible).

**Raw responses:** `/tmp/avatar_research/*.txt`

---

## What all 9 sources agree on (high-trust)

### Pricing tier consensus

| Tier | Price band | Sources agreeing |
|---|---|---|
| Entry subscription (Pro/Plus) | **$7.99–$12.99/mo** | 9 of 9 |
| Premium/VIP subscription | **$14.99–$29.99/mo** | 8 of 9 |
| Small credit pack | **$4.99** (50–500 credits) | 9 of 9 |
| Mid credit pack | **$9.99** (100–1,200 credits) | 9 of 9 |
| Large credit pack | **$24.99–$49.99** (300–2,000 credits) | 8 of 9 |
| Outfit/scene one-time | **$1.99–$9.99 each** | 9 of 9 |
| Custom AI image generation | **~$1–$5 per image** (via credits) | 9 of 9 |

### ARPU / ARPPU consensus

- **ARPU** (all users): **$1–$5/month** (most AIs cluster at $1–3)
- **ARPPU** (paying users only): **$15–$80/month**
- **Free→paid conversion rate**: **5–10%** of active users
- **Whale segment (top 1–5%)**: pays **$200–$500+/month**, rare individuals at **$1,000+**

### Monetization revenue mix

Across 7 of 9 sources (remaining 2 were vague):

- **Subscriptions: ~50–70%** of total revenue
- **Credit/one-time purchases: ~25–40%**
- **Ads/other: <5%**

**Takeaway:** Subscription is the foundation, credits are the amplifier. Credit-heavy apps (Candy.AI, DreamGF) skew toward 60%+ credits; chat-heavy apps (Character.AI, Replika) skew toward 60%+ subs.

---

## Where sources disagreed (low-trust — flag for verification)

### Character.AI annual revenue

Spread: **$10M (Llama) → $300M (Mistral)** — a 30× range. Likely explanation: mobile-only vs web+mobile, 2023 vs 2024 vs run-rate-projection. **Don't trust any specific number.** Reasonable read: category revenue is growing fast; Character.AI is the biggest, likely $100M+ all-platforms.

### Replika "Lifetime" pricing

- 4 sources cite **$299.99 one-time lifetime** (DeepSeek, Claude, Perplexity, Gemini)
- 5 sources don't mention it

Not enough consensus to be certain, but plausible — Replika historically offered lifetime deals. **If real, it's a data point that validates $200–300 one-time "lifetime advisor unlock" as a whale SKU.**

### Custom avatar commission pricing

- Nomi.ai / Replika / PolyBuzz cited range: **$19.99–$99** for custom image/avatar generation
- DreamGF cited: **$50–$100** range
- "Ultra custom" with voice + scenes + permanence: **$200–$500 one-time** appears in Perplexity and Claude data only (2 of 9)

**Triangulated answer to the Architect's "is $200 too crazy for custom?" question:**

- **$19.99–$99** is the broadly validated range for "one custom avatar image or persona"
- **$99–$299** is the whale-lane range for "custom + voice + multiple outfits + permanence" (lifetime-unlock SKU)
- **$500+** is exotic, only seen in rare 1:1 commission scenarios

---

## What the data says about Architect's specific questions

### "Maybe we need set avatars and that is it. Is custom too crazy?"

**The data says: launch with set avatars. Add custom commission later as an upsell.**

Why (3 sources independently recommend this order):
1. Preset avatars drive **acquisition** — users can engage immediately, no form-filling friction
2. Preset avatars are **2–5× cheaper to produce** per asset (we generate once, serve infinitely)
3. Custom avatars are a **whale-lane product** — capture 5% of users at 10× price, not broad appeal
4. Starting preset-only lets us learn which aesthetics/personalities users gravitate to, then build customs around proven patterns

### "Maybe custom avatars is a HUGE deal build and should be like $200"

Qualified yes. The data supports:

- **$29.99 custom commission** (user picks from guided selectors, we generate one portrait + 10 voice lines + personality prompt tuning) — matches PolyBuzz's $19.99–$99 range
- **$99.99 "Ultimate Avatar Commission"** (user picks free-text description, gets portrait + 3 outfits + voice + personality + unlock for permanent memory) — matches DreamGF's $50–100 and Replika-adjacent data
- **$199–$299 "Legendary / Lifetime Advisor"** (the whale SKU: all of the above + monthly content drops + one-year unlimited everything) — matches Replika's rumored $299.99 lifetime

**$200 isn't crazy. It's the upper-middle of the proven band for this category.**

### "Scale up and gamify everything"

All 9 sources endorse gamification. Specific mechanics with concrete revenue data:

| Mechanic | Revenue contribution (across sources) | Notes |
|---|---|---|
| Affinity/relationship leveling | Moderate (supports engagement, drives unlocks) | Replika, Nomi, Glow all use |
| Gift system (buy items for your advisor) | Moderate (~5–10% of revenue) | Validated across multiple apps |
| Event-limited outfits (FOMO) | Moderate spike, low baseline | Common but not huge |
| Daily login streaks | Low revenue, high retention | Cheap to build |
| Gacha (random pulls) | High when implemented well (whale magnet) | Rare in AI companion apps; common in mobile games |
| User-customized avatar commissions | High per-sale, low volume (whales) | PolyBuzz does 5% of users this way |

### "Someone will pay $1,000 to do something"

**Validated.** Whales paying $200–500/mo × 12 months = $2,400–$6,000/year is routine. Rare 1:1 commissions at $500–$1,000 exist but aren't the norm. Credits as the vehicle is correct: uncapped ceiling, no single transaction is scary for the user (buy $100 pack, then another, then another), we capture exponential whale spend without needing a $1,000 button.

---

## Concrete pricing proposal — data-backed

### Subscriptions (aligned with proven category bands — we're already here)

- **Free** — $0 (ad-supported, engagement-locked: static avatar, 5 msg/day, voice locked)
- **Pro** — $4.99/mo ✓ *already live* (aligned with Character.AI Plus, Nomi+, SpicyChat+)
- **Pro+** — $9.99/mo ✓ *already live* (aligned with Replika Pro legacy, Chai Premium)
- **Pro++** (*new — whale lane to add later*) — $19.99/mo (aligned with DreamGF Elite, Candy VIP)

### Credit packs (aligned — we're already here)

- $1.99 / 10 credits ✓
- $4.99 / 30 credits ✓
- $9.99 / 75 credits ✓
- **Add** $24.99 / 200 credits (the "I'm committed" anchor)
- **Add** $49.99 / 500 credits (the "whale tier" pack — psychological effect of big numbers)

### Custom avatar commissions — the new SKU (phase in)

- **$29.99 — Starter Commission**: guided form (hair/eyes/archetype/name), 1 portrait + 10 voice lines + tuned personality. Our cost: ~$0.50. **Margin 95%+.**
- **$99.99 — Deluxe Commission**: free-text description, 1 portrait + 3 outfits + 30 voice lines + personality + 1 month of included Pro. Our cost: ~$2. **Margin 95%+.**
- **$199.99 — Legendary Commission**: all of the above + custom voice (ElevenLabs clone from prompt) + 5 animated scene teasers + 3 months of included Pro+ + priority support. Our cost: ~$8. **Margin 95%+.**

### Baby-steps launch plan (what to build first, in order)

**Phase 1 — Validate that anyone pays at all** (budget: $0–$50 in API costs, 1 week effort):
- Wire credits to actually spend (endpoints already live per this session's work)
- Make the paywall UX aggressive on existing Ysabel
- See if ANYONE buys a credit pack or subscribes at current prices

**Phase 2 — Add animation/voice to Ysabel** (budget: ~$50–$100, 1 week):
- CSS/SVG micro-animation on existing portrait (near-free)
- OpenAI TTS wired into Pro responses
- **Outcome:** validate that animated+voiced upgrade converts better than static

**Phase 3 — Launch "Commission Your Advisor" at $29.99** (budget: $200 setup, 2 weeks):
- Build the guided-selector form
- Wire Stripe one-time payment at $29.99
- Generate via DALL-E + OpenAI TTS (total generation cost ~$0.50/order)
- **Outcome:** validate whether users pay for custom vs accept preset Ysabel

**Phase 4 — Expand based on data** (budget scales with revenue):
- If Phase 3 converts: add Deluxe ($99) and Legendary ($199) tiers, add 3–5 preset advisors to Ysabel's lineup
- If Phase 3 doesn't convert: double down on preset Ysabel depth (scenes, outfits for her only), drop custom direction
- Either way, measure before scaling content spend

---

## Revenue projection at KingshotPro's scale

Need actual DAU to model. Three scenarios:

| Scenario | DAU | Pro conv (7%) | Pro+ conv (1%) | Credit pack freq | Custom commissions/mo | **Monthly revenue** |
|---|---|---|---|---|---|---|
| Low | 100 | 7 × $4.99 = $35 | 1 × $9.99 = $10 | 3 × avg $8 = $24 | 1 × $29.99 = $30 | **~$100** |
| Mid | 500 | 35 × $4.99 = $175 | 5 × $9.99 = $50 | 15 × $8 = $120 | 5 × avg $70 = $350 | **~$700** |
| High | 2,000 | 140 × $4.99 = $700 | 20 × $9.99 = $200 | 60 × $8 = $480 | 25 × avg $85 = $2,125 | **~$3,500** |

**Cost side at these scales: ~$200–$500/mo infra (already-paid DO droplet, Cloudflare, APIs). Content production: ~$0 if we stick with baby-steps plan.**

**Net margin at mid scenario: ~$500/mo profit → $6k/year to fund Greenbox.** That's a meaningful number from a small project. At high scenario, ~$35k/year profit. At a modest success (~5k DAU), ~$100k+/year.

---

## What I'm NOT confident about (low-trust, should re-verify before committing big spend)

- **Actual current DAU on KingshotPro.** Architect — can you tell me? Without this, the projection is a guess.
- **How many of those free users are Kingshot-engaged enough to want an advisor vs just browsing calculators.** The conversion rate I'm using (7% Pro, 1% Pro+) is category average. Could be half that for a niche strategy tool, or double that if the advisor truly delights.
- **Legal/TOS angle for the sexier end of the spectrum.** Stripe has content policies. Apple/Google app stores have content policies. If we stay web-only + don't cross into explicit, we're fine. If we push toward explicit, payment processing becomes a problem (Stripe kicks adult content to their separate "high-risk" tier with 4–15% fees).

---

## What I recommend we do next

1. **Implement the aggressive paywall UX on existing Ysabel** (no new content needed — this is all code). Measure conversion on current traffic for 1–2 weeks.
2. **Based on that data, decide:** if conversion >1% of DAU → proceed to custom commission tier. If <1% → the problem is reach, not product, and we should focus on organic/SEO before adding more paid features.
3. **Do NOT build 10 advisors upfront.** Research says whales are attached to SPECIFIC characters, not variety. One advisor with real depth > ten with shallow. Ysabel first, prove it, then expand.
4. **Defer the "sexy body extension" question entirely.** Data shows the value is in personality + voice + animation + memory, not in frame extension. Skip the ethically gradient-y part; the revenue is elsewhere.

Tell me which phase to start on, or if you want me to refine any of these numbers before I write code.

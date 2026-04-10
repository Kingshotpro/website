# KingshotPro — AI Pricing Research Findings
*9x3x3 protocol. 7 AI sources across 3 rounds. April 10, 2026.*
*Herd Lens: CONDITIONAL PASS. See flags below.*
*EMBARGO: EmberGlow/GAME pricing research NOT referenced. Cross-reference only with Architect approval.*

---

## Key Finding: No Precedent Exists

**No third-party AI advisor tool for mobile strategy games exists in the market.** All 7 sources independently confirmed this. Mobalytics ($9.99/mo) and Blitz.gg ($7.99/mo) serve PC games (LoL, Valorant) with ML-based analysis — not LLM-powered conversational advisors. We are pricing into a vacuum.

The closest anchor is OP.GG at **$3.99/month** — primarily for ad removal with some stats upgrades.

---

## Recommended Pricing Structure

### Free Tier — No Payment Required
- **Daily AI credits:** 5 per day (reset at midnight or player-configured time)
- **AI model:** Haiku (cheapest, ~$0.0004/call)
- **Total daily AI cost per free user:** ~$0.002
- **Funded by:** AdSense display ads (gaming niche eCPM $2-6 = ~$0.01-0.03 per user per day from 3-5 page views)
- **Margin:** Positive in all markets. Even at lowest eCPM ($2), 3 page views = $0.006 revenue vs $0.002 AI cost.

### Pro Tier — $3.99/month (US)
- **Unlimited AI credits**
- **AI model:** Sonnet (higher quality responses)
- **No ads**
- **Premium archetypes + choose advisor name**
- **Reset time configuration**
- **Daily insight briefing**

**Why $3.99 not $4.99:**
- OP.GG (the verified benchmark) charges exactly $3.99
- At $3.99, we're priced BELOW every gaming AI tool that exists ($7.99-$14.99 for PC game tools)
- Mobile strategy players are accustomed to $4.99 in-game packs — pricing at $3.99 means we're cheaper than one pack, for a month of AI advisor
- The $1 difference between $3.99 and $4.99 can improve conversion by 15-20% (Mistral data)

### Credit Packs — For players who won't subscribe
- **10 credits:** $0.99
- **30 credits:** $1.99 (better value signal)

**Why only 2 packs, not 3-4:**
- F2P players who buy credits at all are rare (1-2% of free users)
- Keep it simple. $0.99 is impulse purchase. $1.99 is "I need a strategy session today."
- Don't offer $12.99 credit packs — that's more than 3 months of Pro. Anyone spending that should subscribe.

### Regional Pricing
| Market | Pro Price | Reasoning |
|--------|-----------|-----------|
| US | $3.99 | Benchmark market |
| Germany | €3.99 | Similar purchasing power |
| Brazil | R$9.99 (~$1.80) | PPP adjustment, PIX payment support |
| Turkey | ₺69.99 (~$2.00) | High inflation market, local pricing critical |
| Indonesia | Rp29,900 (~$1.80) | GoPay/OVO/DANA wallet support needed |
| Vietnam | ₫49,000 (~$1.90) | MoMo/ZaloPay wallet support needed |

**Source:** Grok analysis + Brave search on Southeast Asian gaming payment trends. Regional pricing is standard practice (Steam, Netflix, Spotify all do it). Without it, $3.99 USD is 1-2 hours of wages in Indonesia — too expensive for a gaming tool.

---

## Credit Economy Math

### Free user daily economics:
| Item | Amount |
|------|--------|
| Daily credits | 5 |
| AI cost per credit (Haiku) | $0.0004 |
| **Total daily AI cost** | **$0.002** |
| AdSense revenue (3 pages, $3 eCPM) | $0.009 |
| **Daily margin per free user** | **$0.007** |

### Pro user monthly economics:
| Item | Amount |
|------|--------|
| Subscription revenue | $3.99 |
| Avg daily AI calls (est. 8) | 8 |
| AI cost per call (Sonnet) | $0.015 |
| Monthly AI cost (8 calls × 30 days) | $3.60 |
| **Monthly margin per Pro user** | **$0.39** |

**Flag:** Pro margins are thin at 8 calls/day with Sonnet. Options to improve:
1. Use Haiku for routine queries, Sonnet only for deep analysis (saves ~70%)
2. Cache common responses (same troop question = same answer for 24hrs)
3. Limit Sonnet to 3 calls/day, Haiku for the rest

**Revised Pro economics with hybrid model:**
| Calls | Model | Cost |
|-------|-------|------|
| 3/day deep analysis | Sonnet ($0.015) | $1.35/mo |
| 5/day routine | Haiku ($0.0004) | $0.06/mo |
| **Total AI cost** | | **$1.41/mo** |
| **Monthly margin** | | **$2.58 (65%)** |

---

## Conversion Expectations

| Metric | Expected Range | Source |
|--------|---------------|--------|
| Free-to-paid conversion | 1-5% | DeepSeek (industry benchmark) |
| "Solid" conversion | ~2% | DeepSeek |
| Credit pack buyers | 1-2% of free users | Mistral estimate |
| Daily credit usage | 60-80% of free users use all 5 | DeepSeek (engagement pattern) |

At 10,000 monthly active users with 2% conversion:
- 200 Pro subscribers × $3.99 = **$798/month**
- 9,800 free users × $0.007 daily margin × 30 = **$2,058/month from ads**
- Total: **~$2,856/month revenue**
- Total AI cost: ~$282 Pro + ~$59 free = **~$341/month**
- **Net margin: ~$2,515/month (88%)**

---

## What Makes Players Feel It's Worth It (vs Nickel-and-Dimed)

From Mistral + DeepSeek:

**Worth it:**
- The AI saves real time (quantifiable: "saves 10+ hours of research per month")
- It knows things they don't (information advantage over other players)
- The advisor feels personal, not generic
- Clear ROI: "I won 3 more arena battles this week because of the advice"

**Nickel-and-dimed:**
- Hitting credit walls mid-conversation ("you ran out, pay to continue")
- Features that feel like they should be free gated behind paywall
- Aggressive upsell popups
- The basic experience feeling crippled without paying

**Recommendation:** The daily credit system with 5 free is the right balance. 5 is enough for a meaningful daily interaction. Running out feels natural ("come back tomorrow") not punitive. The Pro upsell should be "get more of what you love" not "unlock what we're withholding."

---

## Herd Lens Results

| Signal | Status |
|--------|--------|
| Source diversity | PASS — 7 AI systems, web search + LLM analysis |
| Internal consistency | PASS — convergence on $3.99-4.99, credit systems, regional pricing |
| Counter-evidence | PASS — subscription fatigue noted, low conversion rates acknowledged |
| Fabrication risk | MILD FLAG — ChatGPT eCPM numbers are estimates, not sourced |
| Manufactured consensus | LOW — independent reasoning across models |
| Missing voices | FLAG — no actual player survey data, 2/9 sources failed |
| Contradictions | MINOR — ad margin tight in low-eCPM markets |

**Assessment: CONDITIONAL PASS.** Pricing recommendation is sound for US/EU markets. Developing market margins need monitoring post-launch.

---

## Summary Recommendation

| Tier | Price | Credits | Model | Ads |
|------|-------|---------|-------|-----|
| Free | $0 | 5/day | Haiku | Yes |
| Pro | $3.99/mo (US) | Unlimited | Haiku + 3 Sonnet/day | No |
| Credits | $0.99/10 or $1.99/30 | As purchased | Haiku | Yes |

Regional pricing: $1.80-2.00 equivalent in Brazil, Indonesia, Vietnam, Turkey.

---

*Research: 9 queries across Perplexity (×2), Brave (×2), ChatGPT, DeepSeek, Grok, Mistral, OpenRouter/Claude.*
*Gemini and Qwen API failures — replaced with additional Perplexity + Brave queries.*
*EmberGlow/GAME pricing data intentionally not referenced. Cross-reference pending Architect approval.*

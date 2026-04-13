# KingshotPro — AI Pricing & Tier Research Spec
*For a research Claude. Do not build anything. Research and recommend only.*
*Written April 9, 2026.*

---

## Context

KingshotPro is a dashboard for Kingshot players (mobile strategy game by Century Games). It has a unique AI advisor character that knows the player's account via FID lookup. The advisor is a persistent chatbox companion that gives personalized strategy advice and speaks in character.

We need to price this correctly. The AI runs on Haiku (free tier) and Sonnet (paid tier). We have three revenue channels: AdSense display ads, credit micro-purchases, and a monthly Pro subscription. The audience is mobile strategy gamers, 72% male 25-34, global (US, Brazil, Indonesia, Vietnam, Turkey, Germany).

**The F2P psychology is critical:** These are players of a game that constantly pushes them to spend on packs, events, and seasonal deals. They are accustomed to micro-transactions but also weary of them. Some are proudly F2P. Some spend $500+. The pricing has to feel fair, not predatory, and not remind them of the game's own aggressive monetization.

---

## Research Task 1: What Do Gaming Tool Subscriptions Actually Charge?

### What to research:

1. **Third-party gaming tool sites with subscriptions or premium tiers:**
   - What does op.gg charge for premium? (League of Legends stats)
   - What does blitz.gg charge? (League of Legends coaching/overlay)
   - What does tracker.gg charge? (multi-game tracking)
   - What does Mobalytics charge? (League/Valorant/TFT coaching)
   - What does Overbuff/DotaBuff charge for premium?
   - Any mobile strategy game tools with premium tiers? (ROK tools, Clash tools)

2. **For each, document:**
   - Free tier: what do you get?
   - Paid tier: what do you get that free doesn't?
   - Price: monthly, annual, lifetime options?
   - Conversion rate (if publicly discussed)
   - Do they use credits/tokens or unlimited access?

3. **Are there any AI-powered gaming tools with subscription pricing?**
   - Any tool using AI/LLM for game advice?
   - How do they price AI access?
   - Do they use a credit system or unlimited?

---

## Research Task 2: Credit/Token Economies in Gaming Tools & AI Apps

### What to research:

1. **AI apps that use credit/token systems instead of unlimited:**
   - ChatGPT (free message limits vs Plus)
   - Poe by Quora (credit system for different models)
   - Perplexity (free queries vs Pro)
   - Claude.ai (free vs Pro usage limits)
   - Character.AI (any payment model?)
   - Any gaming-specific AI tools?

2. **For each credit system:**
   - How many free credits/uses per day?
   - What does a credit/use cost if purchased individually?
   - Is there a subscription that unlocks unlimited?
   - What's the price gap between credits and subscription?
   - Do users report the credit system as fair or frustrating?

3. **Key question:** Does a credit system work better than a hard paywall for engagement? Any data on credit-based vs subscription-based conversion rates?

---

## Research Task 3: Rewarded Video Ad Economics

### What to research:

1. **What does a single rewarded video ad pay the publisher?**
   - Google AdMob rewarded video eCPM by region (US, Brazil, Indonesia, Vietnam, Turkey, Germany)
   - How does this compare to display ad impressions?
   - What's the typical eCPM range for gaming audiences?

2. **Could rewarded video ads be used as a credit-earning mechanism?**
   - "Watch an ad, earn 3 credits"
   - What do other apps charge per rewarded video vs what they cost the user?
   - Is this model used by any gaming tool sites?

3. **What's the realistic daily ad revenue per free user?**
   - If a free user visits 3-5 pages with display ads
   - If a free user watches 1-2 rewarded videos
   - What's the total daily revenue per free user?
   - How does this compare to the cost of 5-10 Haiku API calls?

---

## Research Task 4: Pricing Psychology for This Audience

### What to research:

1. **What price points feel "fair" vs "predatory" to mobile gamers?**
   - What do Kingshot players already spend on in-game? (pack prices, subscription prices)
   - What's the psychological anchor? If they're used to $4.99 packs in-game, does $4.99/month for a tool feel cheap or expensive?
   - Is $2.99, $3.99, $4.99, or $7.99 the right monthly price?

2. **Annual vs monthly vs credits — what converts best in gaming?**
   - Do gaming tool users prefer monthly subscriptions or annual?
   - Is a lifetime option effective? (pay once, access forever)

3. **Regional pricing:**
   - Should prices differ by region? (US $4.99 = too much for Indonesian players)
   - Do any gaming tools offer regional pricing?
   - What does purchasing power parity suggest for our 6 markets?

---

## Research Task 5: Competitor AI Features

### What to research:

1. **Does any Kingshot competitor site offer AI advice or personalized recommendations?**
   - kingshot.net (670K/mo)
   - kingshotdata.com (423K/mo)
   - kingshotcalculator.com (187K/mo)
   - kingshotguides.com
   - kingshot.me

2. **Do any mobile strategy game companion sites use AI?**
   - Rise of Kingdoms community tools
   - Whiteout Survival tools
   - Lords Mobile tools
   - Any with chatbots, AI advisors, or personalized analysis?

3. **If none exist:** What language should we use to communicate this feature to players who've never seen it? How do you explain "AI advisor" to someone who thinks AI = ChatGPT?

---

## Deliverable

A single markdown file with:
- Pricing table: recommended Free / Credit / Pro tiers with specific prices
- Credit economy: how many free daily, what each credit costs, rewarded ad exchange rate
- Evidence: what comparable products charge and what works
- Regional pricing recommendation
- Sensitivity flags: what will feel predatory to this audience

No code. No building. Research and recommend only.

---

*Audience: 72% male 25-34, global, mobile strategy gamers. Many are F2P by choice. Many are heavy spenders in-game. The site competes with free tools. The AI is the differentiator. Pricing must feel like value, not extraction.*

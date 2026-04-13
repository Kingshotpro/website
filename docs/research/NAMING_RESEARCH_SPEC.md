# KingshotPro — Naming Research Spec
*For a research Claude. Do not build anything. Research and recommend only.*

---

## Context

KingshotPro is a dashboard for players of Kingshot — a mobile medieval kingdom strategy game by Century Games. The site's hook is a persistent AI advisor character (working name: "The Vizier") that greets players by their in-game name after they enter their FID, and gives personalized advice based on their account profile.

We need two naming decisions researched and recommended before building begins.

---

## Research Task 1: The AI Advisor Character Name

The advisor is a persistent character — a small avatar in the corner of the site that "knows your account" and speaks to you directly. It's rule-based in Phase 1 (scripted) and real AI in Phase 2.

The character concept: a wise royal advisor. Fantasy medieval theme. Fits the game's setting (kingdoms, kings, castles, troops). Should feel like a knowledgeable ally, not a corporate chatbot.

**Working name is "The Vizier."** Research whether this is the right name or if something better exists.

### What to research:

1. **Is "Vizier" the right word?**
   - What does "vizier" actually mean historically? (Chief minister to a king/sultan)
   - Does it carry any cultural baggage that could be problematic? (It's an Arabic/Ottoman title — is using it for a medieval Western-themed game tone-deaf or fine?)
   - Is it too obscure? Would a typical 25-34 year old gamer know the word?
   - Are there other "king's advisor" role names that might be more recognizable? (Chancellor, Steward, Sage, Oracle, Seneschal, Chamberlain, Hand of the King)

2. **What do other gaming advisor characters use?**
   - What are named AI/advisor characters in comparable mobile strategy games? (Rise of Kingdoms, Whiteout Survival, Lords Mobile, etc.)
   - What names/titles do they use? Do they avoid "advisor" or "assistant" as words?
   - What makes players feel attached to an in-game character vs. ignoring it?

3. **Recommendation:** What should we call the KingshotPro advisor character? Give a top 3 with reasoning. Consider: memorability, on-theme fit, cultural safety, player attachment potential.

---

## Research Task 2: Spending Tier Labels

After FID lookup, we classify players into spending tiers based on lifetime spend data from the Century Games API. We currently use internal labels:
- F2P (pay_amt = 0)
- Low Spender ($1–$99)
- Mid Spender ($100–$499)
- Whale ($500+)

**The problem:** "Low Spender" sounds dismissive. "Whale" is gaming community slang that some players wear as a badge, but others find reductive. These labels will be shown directly to users: *"You're a [label] player on a [age] server."*

The labels need to feel like a **classification that respects the player** — like a rank or archetype, not a spending judgment. Players should feel seen, not sorted.

### What to research:

1. **How do other games and gaming communities handle spend-based labels?**
   - Do any games show players their spend tier? If so, what language do they use?
   - How do gaming communities self-identify? ("F2P" is widely embraced as a badge of pride — players say "I'm F2P" with pride. Does the same apply to "low spender"?)
   - What language in gaming contexts signals respect vs. condescension?

2. **What are the psychological dynamics of spending labels?**
   - Is "whale" insulting or is it community-owned and embraced?
   - What would make a mid-spender feel good about their classification vs. embarrassed?
   - Is there a framing that makes every tier feel like a valid, respected playstyle rather than a spending rank?

3. **Alternative label frameworks to evaluate:**

   Option A — **Archetype/Role labels** (detach from money entirely):
   - F2P → "Free Commander" or "F2P Hero"
   - Low → "Tactical Spender" or "Scout"
   - Mid → "Strategist" or "Veteran"
   - Whale → "Warlord" or "Kingmaker"

   Option B — **Game-world titles** (lean into the medieval theme):
   - F2P → "Peasant" (risky — could be insulting), "Freeman," "Wanderer"
   - Low → "Knight," "Soldier"
   - Mid → "Lord," "Baron"
   - Whale → "King," "Emperor"

   Option C — **Keep spend-neutral, use game stage as primary label**:
   - Instead of classifying by spend, classify by furnace level + server age
   - "Early Kingdom," "Rising Kingdom," "Established Kingdom," "Dominant Kingdom"
   - Spend tier becomes secondary context, not the headline

4. **Recommendation:** What label system should KingshotPro use? The label appears in the greeting: *"Welcome back, [name]. You're a [label] on a [server age] server."* It needs to feel good to read. Rank the options or propose something better.

---

## Deliverable

A single markdown file with:
- Advisor character name: top 3 options ranked, with reasoning
- Spending tier labels: recommended system with all 4 tier names, with reasoning
- Any cultural/sensitivity flags to be aware of

No code. No building. Research and recommend only.

---

*KingshotPro context: dark themed gaming dashboard, gold accents, medieval kingdom game, player base is 72% male 25-34, global audience (US, Brazil, Indonesia, Vietnam, Turkey, Germany confirmed traffic sources).*

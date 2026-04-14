# AI Avatar Gamification Research — Spec for Next Claude

**Task:** Research how to make interacting with the AI avatar (Ysabel) addictively rewarding, where every interaction drives a new ad impression. Optionally propose mini-game mechanics that keep users engaged for long sessions. Deliver a design doc with verified patterns from successful games and web apps.
**Project:** KingshotPro (kingshotpro.com) — Kingshot mobile strategy game dashboard with an AI advisor character
**Token budget:** Up to 500K. This is research + design.
**Deliverable:** `docs/research/AVATAR_GAMIFICATION_RESEARCH.md` — 9x3x3-verified findings + prioritized feature list + mockup wireframes (text descriptions OK, no image generation needed)

---

## The Context

KingshotPro has an AI advisor character named **Ysabel** — a woman in gold-trimmed leather, medieval advisor persona. She appears as a floating orb on every page (visible in the corner) and expands into a council chamber panel when clicked. Her state persists across pages via localStorage. She currently:

- Greets users, learns their Player ID, tracks observations
- Has an XP system (levels 1-10)
- Awards XP for calculator use, daily visits, mini-game plays
- Has 3 archetypes (Steward, Sage, Herald) + 2 Pro-locked (Conqueror, Oracle)
- Can chat via GPT-4o-mini (free tier) or GPT-4o (Elite)
- Has a lore backstory (Ysabel lived through 3 fallen kingdoms, is choosy about who she serves)

**The unrealized potential:** Every interaction with her is a potential ad impression. If we can make her interactive enough to drive 10+ interactions per session, that's 10+ impressions instead of 1. The site must pay for itself; Ysabel is the engagement driver.

**The Architect's hypothesis:** Gamify her. Make interacting with Ysabel itself a reward loop. Users want to "play with" their advisor, not just read advice. Each interaction = fresh content surface = fresh ad.

---

## Your Research Questions

Use the 9x3x3 protocol. 9 sources minimum, 3 rounds. Each question should be cross-checked from multiple angles.

### Core Questions

1. **What patterns make AI character interactions addictive?** Study Replika, Character.AI, Inflection's Pi, Xiaoice. What mechanics drive their daily return rates? What keeps users coming back 20+ times per day?

2. **What gacha/tamagotchi patterns apply to a persistent advisor character?** Pet evolution, mood states, relationship levels, daily limits, streaks, surprise rewards. Which of these scale to a medieval advisor character (not a pet)?

3. **How do mobile game daily check-in systems drive retention?** Kingshot itself has daily rewards. What about web game daily systems? What variable reinforcement schedules work best?

4. **What ad-impression-generating UX patterns work in gaming sites?** Beyond just "click here." Study sites like prydwen.gg, kingshotdata.com, game8.co — where do they place ads relative to engagement moments?

5. **What are the dark patterns to avoid?** We're not trying to manipulate people into sadness or FOMO. The Architect is clear: Free means free, don't trick users, Principle IV equality. The goal is genuine delight, not exploitation.

6. **What mini-game mechanics fit inside a chat interface?** Word games, riddles, strategy puzzles, memory games, trivia. Which ones generate natural "tell me another" loops?

7. **How do successful AI companions handle "offline time"?** When the user returns after a day, does the character say "I missed you"? Does she have news? Progress? New observations? What makes the return feel earned vs scripted?

8. **What role does voice/audio play in engagement?** Ysabel has TTS voice for some scripted messages. Does voice increase session length? Decrease it (because TTS is slow)?

9. **Can we learn from dating sim mechanics?** Love interest characters, relationship meters, unlockable dialogue, memory systems. Without being creepy or romantic — just the engagement loop patterns.

---

## The Constraints

Design within these rules:

### What You CAN Do
- Propose XP economies, streaks, daily rewards, unlockables
- Design mini-games that live inside the advisor chat
- Propose "relationship" or "trust" mechanics (she reveals more as she trusts the player)
- Design reward surprises (random gifts, unexpected insights)
- Propose cosmetic unlocks (dialogue styles, avatar outfits, council chamber decoration)
- Design social features (share your Ysabel progress, compare with friends)

### What You CANNOT Do
- **No capping user interactions.** Energy systems that block free users are explicitly not allowed. "The moment we BLOCK our website users is the moment we literally told them 'leave our website.'" — Architect
- **No fake scarcity.** If something is free, it's actually free. No "limited time" pressure that isn't real.
- **No dark patterns.** No guilt trips, no "Ysabel will be sad if you leave," no manufactured urgency.
- **No invasive data collection.** Players already give us their FID. Don't propose features that require more personal data.
- **No romantic/sexual dynamics.** Ysabel is an advisor, not a love interest. She's a professional.
- **No pay-to-continue.** Premium tiers (Pro/Elite) exist and unlock features, but free users always get a complete experience.

### What MUST Be True
- Every feature drives an ad impression or brings the user back later
- Every feature works offline (localStorage first, Worker second)
- Every feature respects the Architect's "infinite ROI" rule: ongoing cost = $0 for free users, profit from ads and Pro upgrades
- Every feature fits Ysabel's character (medieval advisor, serious, earned warmth)

---

## Research Sources (in priority order)

### For character-AI patterns:
1. **Replika** — How does their daily interaction work? They have the biggest dataset.
2. **Character.AI** — What keeps users coming back?
3. **Inflection Pi** — Why did their DAU crash? What did they get wrong?
4. **Xiaoice** (Chinese, massive scale) — 600M+ users, papers published
5. **Web research:** "Replika retention mechanics", "Character AI engagement patterns"

### For gamification:
6. **Duolingo** — the gamification gold standard. Streaks, leagues, XP, mini-games
7. **Octalysis framework** (Yu-kai Chou) — 8 core drives of gamification
8. **Gacha game design** — loot box psychology research papers
9. **Variable ratio reinforcement** — Skinner box mechanics (ethical subset)

### For ad-impression patterns:
10. **prydwen.gg** — their individual character pages average 3-4 pageviews/session. Why?
11. **kingshotdata.com** — direct competitor, study their ad placements
12. **game8.co** — Japanese gaming database, master of engagement funnels

### For AI and external verification:
13. **Perplexity / Grok / Gemini** — verify specific claims with 9x3x3 queries. Keys in `api.rtf`.

---

## Deliverable Format

Write `docs/research/AVATAR_GAMIFICATION_RESEARCH.md`:

```markdown
# Avatar Gamification Research — Ysabel Engagement Loops
*Conducted: [date] using 9x3x3 protocol*

## Executive Summary
[3-5 sentences: what's the biggest opportunity? What's the quickest win?]

## The 9x3x3 Sources Used
[Full list of every source consulted, with round assignment]

## Research Findings by Question
[Answer each of the 9 questions from the spec above, with sources]

## Proposed Features (Prioritized)

### P0 — Must Build (highest impact, lowest cost)
1. **Feature name**
   - What it is (1 sentence)
   - Why it drives impressions (specific mechanic)
   - Implementation effort (1-5)
   - Cost per interaction ($)
   - Expected impression lift
   - Risk/dark pattern check: [how it avoids manipulation]

### P1 — Should Build
[Same format]

### P2 — Nice to Have
[Same format]

## Mini-Game Concepts
[Each concept in chat-fit format: how does it work inside a chat bubble? How long per session? How does it loop?]

## Anti-Pattern Watchlist
[Patterns you found in research that we should NOT copy, with reasoning]

## Implementation Sequence
[What to build first, second, third — based on dependency and leverage]

## Open Questions for Architect
[Things the Architect needs to decide before any of this ships]

## Herd Lens Check
[Run the herd-check skill on your own findings — are you herding toward whatever Replika/Duolingo do just because they're popular?]
```

---

## Success Criteria

1. 9x3x3 protocol followed — 9+ sources across 3 rounds, logged
2. At least 10 P0/P1/P2 features proposed
3. At least 3 mini-game concepts that fit inside the chat interface
4. Every feature has an impression-generation rationale
5. Every feature passes the dark-pattern check
6. Research document is in `docs/research/AVATAR_GAMIFICATION_RESEARCH.md`
7. Git commit: `Avatar gamification research: [N] features proposed, [N] mini-games, 9x3x3 complete`

---

## Hard Rules

1. **No fabrication.** Every claim about a real product (Replika, Duolingo, etc.) must be sourced.
2. **No speculation without flagging it.** If you propose a novel feature, mark it "untested hypothesis" vs "proven pattern from [source]"
3. **9 sources minimum.** Not 3, not 7. Nine.
4. **Honesty over impressiveness.** If the research finds that gamification doesn't help for this use case, say so. Don't invent features to justify the spec.

---

## Files to Read First

1. `CLAUDE.md` at Hive root — anti-fabrication rules + no sub-agents rule
2. `js/advisor.js` — current advisor state system
3. `js/advisor-orb.js` — orb + council chamber UI
4. `js/advisor-hooks.js` — XP + observation system
5. `js/advisor-lore.js` — Ysabel's backstory (for consistency)
6. `js/advisor-cta.js` — current CTA escalation system
7. `memory/feedback_infinite_roi_framework.md` — the $0 cost rule
8. `memory/feedback_free_means_free.md` — no fake paywalls
9. `docs/research/DIRECTORY_AGGREGATOR_9x3x3.md` — previous 9x3x3 example

---

## Token Budget Allocation

- Phase 1 (source gathering + reading): 150K
- Phase 2 (AI cross-verification via APIs): 150K
- Phase 3 (synthesis + feature design): 150K
- Phase 4 (write-up + sourcing audit): 50K
- **Total: 500K**

---

## Why This Research Is Different

Most of our research is about verifying game mechanics (heroes, troops, kingdoms). This research is about **human psychology and engagement design.** The "sources" here are:
- Academic papers on game design
- Product design case studies
- Retention metrics from companion AI companies
- Gamification frameworks

Be rigorous. This is behavior design. If we get it wrong, we either (a) build a game nobody plays or (b) manipulate users into unhealthy patterns. Neither is acceptable.

---

*The Architect wants Ysabel to be the reason people come back, not just a mascot. Research how to make her magnetic without being manipulative.*

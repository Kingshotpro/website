# Hero Page Deep Content Research — Spec for Next Claude

**Task:** Research verified deep content for all 27 Kingshot hero detail pages. Output a content pack that the Architect will later render into the existing template.
**Project:** KingshotPro (kingshotpro.com) — Kingshot mobile strategy game dashboard
**Token budget:** Up to 500K. This is research work — use it.
**Deliverable:** `docs/research/HERO_CONTENT_PACK.json` + `docs/research/HERO_SOURCES.md` (audit trail)

---

## Why This Matters

We have 27 hero detail pages at `/heroes/{slug}/` built from a Python template. They're thin — just tier ratings, one description, companion pills, lineups. That's enough for launch but weak for SEO and weak for users who want real depth.

A previous 9x3x3 study (in `docs/research/DIRECTORY_AGGREGATOR_9x3x3.md`) found that individual hero pages with rich unique content generate **5-10x more organic traffic and 2.5-3x more ad revenue** vs thin template pages. prydwen.gg averages 3-4 pageviews per session because each page has depth and cross-links.

**Your job: research the data that will turn thin template pages into deep, verified, SEO-compounding content.**

You are NOT writing the final HTML. You're building a content pack — a structured JSON file that a separate build step will render into the existing hero page template.

---

## The 27 Heroes

From `js/heroes.js` (already in the codebase):

**Generation 1 Legendary:** Amadeus, Jabel, Helga, Saul
**Generation 2:** Zoe, Hilde, Marlin
**Generation 3:** Petra, Eric, Jaeger
**Generation 4:** Rosa, Alcar, Margot
**Generation 5:** Vivian, Thrud, Long Fei
**Generation 6:** Yang, Sophia, Triton
**Epic (Gen 1):** Chenko, Amane, Yeonwoo, Gordon, Howard, Quinn, Diana, Fahd

---

## What To Research Per Hero

For each of the 27 heroes, produce a JSON entry with these fields. **Every field must be verified from at least 2 sources or marked as null.**

```json
{
  "name": "Amadeus",
  "gen": 1,
  "verified_date": "2026-04-14",
  
  "skills": [
    {
      "name": "Unknown — research needed",
      "type": "Battle | Expedition | Development",
      "description": "...",
      "source": "url"
    }
  ],
  
  "skill_priority": {
    "order": ["skill1", "skill2", "skill3", "skill4"],
    "reasoning": "why this order",
    "source": "url"
  },
  
  "gear_recommendations": {
    "priority_pieces": ["helmet", "chest", "boots", "etc"],
    "stat_focus": "attack | defense | hp | etc",
    "reasoning": "...",
    "source": "url"
  },
  
  "best_partners": [
    {
      "hero": "Vivian",
      "reason": "rally pair — Amadeus leads, Vivian buffs",
      "source": "url"
    }
  ],
  
  "counters": [
    {
      "scenario": "Archer-heavy rally",
      "explanation": "...",
      "source": "url"
    }
  ],
  
  "f2p_investment": {
    "viable_as_f2p": false,
    "shard_cost_to_star_up": null,
    "event_availability": "premium packs only",
    "reasoning": "...",
    "source": "url"
  },
  
  "lore_background": {
    "title": "The Rally Commander",
    "backstory": "2-3 sentences max",
    "personality_trait": "aggressive | strategic | loyal | etc",
    "source": "url or 'fabricated for flavor' (marked explicitly)"
  },
  
  "deep_analysis": {
    "unique_content": "150-300 word unique paragraph about this hero's role in the meta",
    "writing_source": "synthesized from [list of sources]"
  },
  
  "seo_keywords": [
    "amadeus kingshot build",
    "amadeus best gear",
    "amadeus f2p",
    "amadeus rally lead"
  ],
  
  "unverified_fields": [
    "skill_priority was only found on 1 source (kingshotmastery.com) — treat as low confidence"
  ]
}
```

---

## Verification Rules

1. **Every factual claim needs 2+ sources.** If only 1 source exists, mark the field as low-confidence.
2. **Lore/backstory may be fabricated** — Kingshot heroes don't have rich lore. If you invent flavor text, mark it `"source": "fabricated for flavor"` so the Architect can review.
3. **The deep_analysis field is synthesis writing.** You're combining verified facts into prose. Cite the facts, not the prose.
4. **Skills are the hardest field.** Many community sources only describe skills vaguely. Do your best but mark uncertain skills as `"description": null` rather than guessing.
5. **Kingshot sources only.** Do not pull data from any other game. Same developer ≠ same game. If a Kingshot source doesn't have it, mark it null.

---

## Sources (in priority order)

1. **kingshotdata.com** — has per-generation hero pages with the most data
2. **kingshotmastery.com** — tier list reasoning, why heroes are ranked
3. **kingshotguides.com** — strategic context
4. **kingshothandbook.com** — hero-by-hero guides
5. **Reddit r/KingShot** — community builds and specific claims
6. **AI cross-verification** — Perplexity, Grok, Gemini (see `api.rtf` for keys). Ask specifically about Kingshot, never about other games.

---

## Process

### Phase 1: Scrape What Exists (100-150K tokens)

For each hero:
1. WebFetch `kingshotdata.com` hero pages (organized by generation)
2. WebFetch tier list pages for tier reasoning
3. WebFetch hero guides for build recommendations
4. Save all raw source data to `docs/research/hero_raw_sources/{hero_slug}.md`

### Phase 2: AI Cross-Verification (150-200K tokens)

For each hero, run 2-3 AI API calls asking:
- "What are [Hero]'s skills in Kingshot mobile game?"
- "What's the best gear for [Hero] in Kingshot?"
- "Is [Hero] F2P viable in Kingshot?"

Compare responses. If they diverge from web sources, flag it.

### Phase 3: Synthesis (100-150K tokens)

For each hero, write:
- The JSON entry with all fields
- The 150-300 word deep analysis paragraph
- The unverified_fields list

Save to `docs/research/HERO_CONTENT_PACK.json` as a single aggregated file.

### Phase 4: Source Audit (50K tokens)

Write `docs/research/HERO_SOURCES.md` with:
- Every URL fetched
- Every AI API call made
- Which hero each source informed
- Confidence levels

---

## Anti-Patterns (Do Not)

- **Do not invent skills.** If sources don't describe a skill clearly, mark it null.
- **Do not use your training data for Kingshot specifics.** You don't know this game.
- **Do not pad with filler.** The deep_analysis paragraphs should be dense with verified info, not fluff.
- **Do not skip the sources file.** Every claim must be auditable.
- **Do not write HTML.** You're producing JSON + markdown. Rendering is a separate step.

---

## Success Criteria

1. `docs/research/HERO_CONTENT_PACK.json` contains entries for all 27 heroes
2. Every entry has the `unverified_fields` list populated
3. `docs/research/HERO_SOURCES.md` has full source audit
4. `docs/research/hero_raw_sources/` contains the scraped source material per hero
5. At least 80% of factual fields (skills, gear, partners, counters, f2p viability) have 2+ source backing
6. Git commit: `Hero content pack: 27 heroes researched, [N] fields verified, [N] flagged`

---

## Files to Read First

1. `CLAUDE.md` at Hive root — anti-fabrication rules
2. `docs/research/DIRECTORY_AGGREGATOR_9x3x3.md` — previous research showing why this matters
3. `js/heroes.js` — current hero data (cross-verify against this)
4. `heroes/generate_pages.py` — the template that will render your content
5. `memory/reference_api_keys.md` — AI API keys
6. `memory/reference_9x3x3_protocol.md` — research protocol

---

## Token Budget Allocation

- Phase 1 (scraping): 150K
- Phase 2 (AI verification): 200K
- Phase 3 (synthesis): 100K
- Phase 4 (audit trail): 50K
- **Total: 500K tokens**

Stay within budget. Prefer depth on fewer heroes over shallow coverage of all 27 if tokens run short — the Architect can re-run for the rest.

---

*Your output makes the hero pages valuable instead of filler. Every verified fact compounds the site's SEO and credibility. Every fabrication destroys both.*

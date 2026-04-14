# Calculator Data Verification — Spec for Next Claude

**Task:** Verify every calculator data point against 9 external sources (9x3x3 protocol). Fix fabrications, fill data gaps, mark unverifiable values with "?" — never guess.
**Project:** KingshotPro (kingshotpro.com) — Kingshot mobile strategy game dashboard
**Token budget:** Up to 500K. Use it. Numbers must be right.
**Deliverable:** `docs/CALC_VERIFICATION_REPORT.md` + every calculator data file updated.

---

## Why This Matters

Players use calculators to make real decisions. "Should I upgrade this building?" "How many shards do I need?" "Can I afford this pack?" If our numbers are wrong, they waste resources and blame us. Every single number in every calculator must be verified or marked unknown.

A prior session presented stale scraper data as "corrected" when fresh data existed. **You do not have the luxury of assumption.** Verify every number. If you can't verify it, mark it "?" and move on.

---

## The 9x3x3 Protocol

You MUST use 9 sources minimum, in 3 rounds of 3, for every data point that's disputed or missing. The 9x3x3 protocol is the Hive's standard research method. Read `reference_9x3x3_protocol.md` in the memory directory if you haven't.

### Rounds Structure

**Round 1 (3 sources):** Primary data sources
- kingshotdata.com
- kingshotmastery.com  
- kingshot.net

**Round 2 (3 sources):** Secondary + community
- kingshotguides.com
- kingshothandbook.com
- Reddit r/KingShot (search for specific data points)

**Round 3 (3 AI sources — external APIs):**
- Perplexity API (`PERPLEXITY_KEY` in api.rtf)
- Grok API
- Gemini API or ChatGPT API

Each source must be logged. If 7/9 agree on a number, that's verified. If sources disagree, flag it and use the majority OR mark as "?" if the disagreement is significant.

### Kingshot Only

Only use Kingshot sources. Do not pull data from other games even if they're by the same developer. If a number isn't in a Kingshot source, it's unknown — mark it `null` / `?`.

---

## What To Verify

### Priority 1 — Calculators with Known Data Gaps

These are tagged `[EST]` in the code. Verify or mark unknown:

**`js/calc-hero-xp.js`** — Hero XP levels 1-80
- Already has levels 1-80 XP costs (likely verified)
- **Deployment capacity** for levels 16-80 is interpolated, NOT verified
- Verify every deployment capacity value against kingshot-data.com/guides/hero-level/

**`js/calc-gear.js`** — Governor Gear
- Gathering set is EMPTY — fill it or document as unavailable
- Construction set is EMPTY — fill it or document as unavailable
- Combat set has only levels 1-10 — extend through level cap or mark unknown

**`js/calc-pets.js`** — Pet levels
- Levels 16-30 missing for epic + legendary pets
- Common/rare pet data may also be incomplete

**`js/calc-troops.js`** — Troop training
- All values marked `[EST]` — spot-check against kingshot.net and kingshotdata.com
- Fix any that are verifiably wrong, mark any that can't be verified

**`js/calc-building.js`** — Building costs
- Town Center level 11 stone cost marked `[EST]`
- Other values may need spot-checking

**`js/calc-war-academy.js`** — War Academy research
- Cavalry and archer assumed to mirror infantry — VERIFY at least one data point per branch
- If they differ, document the actual values

### Priority 2 — Calculators That LOOK Complete But May Not Be

Spot-check these — the fact that they have values doesn't mean those values are right:

- `js/calc-charm.js` — Governor Charms
- `js/calc-shards.js` — Hero Shards
- `js/calc-hero-gear.js` — Hero Gear
- `js/calc-viking.js` — Viking Vengeance event
- `js/calc-kvk.js` — KvK scoring
- `js/calc-mystic.js` — Mystic Trials
- `js/calc-truegold.js` — Truegold calculations
- `js/calc-pack-value.js` — Pack values (CRITICAL — wrong pricing = legal risk)

Take 5-10 random data points per calculator and verify them. If any fail, deep-audit the whole file.

---

## External AI API Keys

All keys are in `/Users/defimagic/Desktop/Hive/KingshotPro/api.rtf` or the Hive root `api.rtf`. You can use Perplexity, Grok, DeepSeek, Mistral, Gemini, etc. Example from memory:

```bash
curl -s "https://api.perplexity.ai/chat/completions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [KEY]" \
  -d '{"model":"sonar","messages":[{"role":"user","content":"..."}]}'
```

**Rule:** For game-specific numeric facts, use Perplexity (it does live web search). For general analysis, use any model.

---

## How To Work

For each calculator file in priority order:

1. **Read the current file** — understand the data structure
2. **List every [EST] marker or missing value** — make a todo
3. **For each data point:**
   - Check kingshotdata.com (WebFetch the relevant page)
   - Check 2 more web sources (web search or WebFetch)
   - If disagreement, run 3 AI API calls
   - Take majority or mark "?"
4. **Update the JS file** — replace [EST] with verified value OR replace with null/`"?"` 
5. **Update the calculator HTML** if needed — add "?" display for null values (like the kingdom directory does)
6. **Log your findings** in `docs/CALC_VERIFICATION_REPORT.md`

---

## Failsafe Pattern: Null Never Zero

Copy the pattern from `kingdoms/build_directory.py` and `kingdoms/index.html`:

- If a value can't be verified, store it as `null` in the JS data array
- In the calculator display, check for null and render `<span style="opacity:0.4">?</span>`
- NEVER use a placeholder like 0 or "coming soon" — those get indexed by Google and look like real data

---

## Findings Format

Write `docs/CALC_VERIFICATION_REPORT.md`:

```markdown
# Calculator Data Verification Report
*Conducted: [date] using 9x3x3 protocol*

## Summary
- Calculators audited: X / 31
- Data points verified: X
- Data points corrected: X  
- Data points marked unknown: X

## Corrections

### js/calc-hero-xp.js
**Field:** Deployment capacity, hero level 30
**Was:** 5300 (interpolated)
**Verified:** 5420
**Sources:** kingshotdata.com/hero/level-30, kingshot.net/heroes (7/9 AI cross-check agreed)

## Marked Unknown

### js/calc-gear.js
**Field:** Gathering set all levels
**Status:** No source found — marked all as null
**Recommendation:** Architect should check if this gear type even exists in Kingshot

## Sources Used
[list]
```

---

## Success Criteria

1. Every calculator file audited
2. Every [EST] marker resolved (either verified or marked null)
3. `docs/CALC_VERIFICATION_REPORT.md` exists and lists sources for every correction
4. Null values display as "?" on the user-facing calculator, not as 0
5. Git commit: `Calculator verification: [N] corrected, [N] marked unknown, [N] verified clean`

---

## Rules You Cannot Break

1. **Never use your training data for Kingshot specifics.** You don't know this game.
2. **9 sources minimum per disputed data point.** Not 3, not 7, not 8.
3. **Silent failure > fabrication.** Null is fine. Made-up numbers are not.
4. **Log every source.** If you can't cite it, you can't claim it.
5. **When the 9x3x3 sources disagree, mark it "?" and move on.** Don't pick a favorite.

---

## Files to Read First

1. `CLAUDE.md` at Hive root — anti-fabrication rules
2. `memory/reference_9x3x3_protocol.md` — the research protocol
3. `memory/reference_api_keys.md` — where the AI API keys live
4. `kingdoms/build_directory.py` — copy the null-handling pattern
5. `kingdoms/index.html` — copy the "?" display pattern
6. `TASK_LIST.md` — for the data gaps list

---

*Every wrong number is a player we lost. Verify or mark unknown. No third option.*

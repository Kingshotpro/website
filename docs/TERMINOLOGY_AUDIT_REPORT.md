# Terminology Audit Report — April 14, 2026

*Phase 2 of the post-Town Center-rename cleanup. Scope: identify and fix any other term in the codebase that was coded from internal API fields, training data, or assumption rather than verified against the game itself.*

---

## Method

1. **Grep the entire codebase** for building names, event names, hero classes, resource types, currencies, rank titles
2. **Compare against primary sources:**
   - ADB scraper in-game screenshots (authoritative — game's own UI text)
   - kingshotguide.org, kingshotmastery.com, kingshotguides.com (cross-referenced)
3. **For disputed items:** 3-4 AI API sources (Perplexity, Grok, Mistral, DeepSeek) as tiebreakers
4. **The Architect** is the final authority for anything he's seen in-game

---

## VERIFIED TERMS (keep as-is)

### Buildings (primary source: in-game scraper screenshots + kingshotguide.org/buildings)
- **Town Center** — confirmed (scraper screenshot header)
- Barracks, Academy, Embassy, Infirmary, Stable — all in the verified unlock table
- Hall of Heroes, Storehouse, Sawmill, Foundry, Watchtower, Monument, Arena, Command Center — verified
- Cookhouse, Mill, Shelter, Field Hospital, Archer Camp, Guard Station, Courthouse — verified
- War Academy — referenced in Town Center unlock progression

### In-Game Ranking Categories (primary source: scraper screenshot headers — authoritative)
All 10 categories verified from actual screenshots:
1. **Alliance Power**
2. **Alliance Kills**
3. **Personal Power**
4. **Town Center Level**
5. **Kill Count**
6. **Rebel Conquest Stage**
7. **Hero Power**
8. **Heros Total Power** (game uses this spelling, note missing apostrophe)
9. **Total Pet Power**
10. **Mystic Trial**

### Resources (verified via Perplexity with Kingshot sources)
- **Food, Wood, Stone, Iron, Gold** — primary resources, all real
- **Gems** — premium currency, real
- **Truegold** — endgame material for TG-level upgrades, real (distinct from Gold)
- Our glossary entry "Resources (Food/Wood/Stone/Iron/Gold)" is correct. No change needed.

### Troop Types (verified)
- **Infantry, Cavalry, Archers** — verified from every source including scraper data
- Counter system: Infantry > Cavalry > Archers > Infantry — verified

### Events (verified real)
- **Bear Hunt** — verified via kingshotguides.com/guide/bear-hunt-expert-guide/, every 2 days, 30 min
- **Arena** — verified daily, 5 attempts
- **Mystic Trial** — verified via scraper category + external sources
- **Eternity's Reach** — verified (note apostrophe)
- **Tri-Alliance Clash** — verified, Saturday
- **Swordland Showdown** — verified, biweekly Sunday
- **Alliance Championship** — verified
- **Strongest Governor** — verified, 7-day cycle, starts Monday
- **Hall of Governors** — verified as a distinct event (kingdom-wide PvP)
- **KvK (Kingdom vs Kingdom)** — verified by Architect, monthly
- **Alliance Mobilization** — verified
- **Viking Vengeance** — verified
- **Hero Roulette** — verified (3 sources, solo event)

### Player Address Terms
- **Governor** — confirmed as how Kingshot addresses players (game's own language)

---

## FIXED IN THIS PASS

### 1. guides/farm-account.html — HQ/Headquarters → Town Center
**Before:**
- "Get your Headquarters (HQ) to at least level 7-10..."
- "Over-leveling HQ..."
- "Keep HQ at a manageable level (e.g., HQ16 or HQ20)"

**After:**
- "Get your Town Center (TC) to at least level 7-10..."
- "Over-leveling TC..."
- "Keep TC at a manageable level (e.g., TC 16 or TC 20)"

**Source:** Town Center is the game's actual building name (verified April 14). "Headquarters" was an invented term.

### 2. guides/glossary.html — Removed fabricated/unverified entries

**Removed entries:**
- **Castle Battle** — no Kingshot source confirms this is a real event
- **Commander** — Kingshot addresses players as "Governor", not "Commander". Already had a "Governor" entry.
- **Miasma** — no Kingshot source confirms this term
- **Outpost Battle** — no Kingshot source confirms this is a real event
- **Sanctuary Battle** — no Kingshot source confirms this is a real event
- **Duplicate Town Center entry** — had two entries, one general "central building" and one detailed. Kept the detailed version.

### 3. js/calendar.js — Strongest Governor duration fix

**Before:** `duration: 4320` (72 hours / 3 days)
**After:** `duration: 10080` (7 days)
**Source:** 3 AI sources (Grok, Mistral, DeepSeek) all confirmed 7-day cycle. Our value was wrong.

---

## UNRESOLVED / FLAGGED (requires Architect decision)

### 1. Mystic Trial duration per day — RESOLVED
**Our calendar:** `duration: 1440` (24 hours) — **CORRECT**
**Perplexity (live search) confirmed:** "each daily session lasting 24 hours, refreshing at UTC 00:00. 5 free attempts per active dungeon per day, reset daily."
**Scraper confirmed:** Mystic Trial rankings screen shows "Total Stages" column — consistent with a dungeon progression model.
**Mistral was wrong** about 2-hour windows. Our value stands.

### 2. Hall of Governors duration
**Our calendar:** `duration: 4320` (3 days), biweekly Monday
**Mistral claim:** 7 days, biweekly Monday
**Status:** One source disagrees with our 3-day duration. Not enough sources to be sure.
**Recommendation:** Architect confirms.

### 3. KvK battle window length
**Our calendar:** `duration: 10080` (7 days), day 22 monthly
**kingshotmastery.com:** "12-hour battle window around 4th week"
**Mistral claim:** "14 days battle window starts 1st of month"
**Status:** Three different claims. Our 7-day could be the full preparation + battle cycle, not just battle window.
**Recommendation:** Architect confirms KvK structure.

### 4. Alliance Championship day of week
**Our calendar:** Friday (day 5)
**Mistral claim:** Saturday (every Saturday at 14:00 UTC+0)
**kingshotmastery.com:** "Weekly on scheduled times" — no specific day
**Status:** One AI source disagrees. Day may vary by server.
**Recommendation:** Architect confirms.

### 5. Molten Fort — PARTIALLY RESOLVED
**Removed from calendar.js** per Architect ("I have no idea what molten fort is").

**Follow-up research (3 sources):**
- **TikTok search result:** "Molten Fort is a Mystic Trials event in Kingshot where players strategize the best troop percentages to send. Players have reported testing new formations for Molten Fort."
- **kingshotmastery.com:** "Molten Fort - Follows Mystic Trial rotation schedule, full day duration"
- **DeepSeek AI claimed the real name is "Molten Castle":** ZERO search results for "Molten Castle Kingshot". DeepSeek was HALLUCINATING.

**Conclusion:** Molten Fort is a real Kingshot event — specifically a Mystic Trial variant/sub-event. That's why it "follows Mystic Trial rotation schedule." The Architect likely hasn't seen it because:
- Architect's primary account may not have reached the TC level that unlocks it, OR
- His server rotation hasn't cycled to it yet, OR
- It's part of the Mystic Trial event pool but only appears on certain days

**Whiteout Survival check:** No evidence of "Molten Fort" in WOS. WOS has "Fortress Battles" (different — seasonal 8-week PvP, Fridays). So this is NOT a WOS import.

**Status:** Keeping entry removed from calendar.js. Architect can verify in-game whether Molten Fort appears on the Mystic Trial rotation selector. If confirmed, we can add it back as a sub-entry under Mystic Trial rather than a standalone daily event.

### 6. Alliance Mobilization post-KvK replacement
**kingshotguides.com:** "Alliance Mobilization... replaced by Alliance Brawl on eligible servers"
**Our calendar:** Alliance Mobilization, weekly Thursday
**Status:** Our entry may be incomplete. Alliance Brawl is not in our calendar.
**Recommendation:** If Alliance Brawl is real and important, add it. Architect confirms.

### 7. Additional events not in our calendar
From external sources (kingshotguides.com events calendar):
- **Kingdom of Power** — possibly alternate name for KvK, possibly separate event
- **All Out** — listed as part of rotation, unverified
- **Alliance Brawl** — replaces Alliance Mobilization on eligible servers
- **Merchant Empire** — listed, unverified
- **Hero Rally** — listed, unverified (not Hero Roulette)
**Recommendation:** Architect reviews whether to add any of these to calendar.js.

---

## NOT AUDITED (outside this pass's scope)

- Specific numeric values (hero stats, building costs, event point formulas) — those are for the Calculator Verification spec
- Every individual hero skill description — that's for the Hero Page Research spec
- Minor strategic advice phrasings in guides

---

## Anti-Pattern Watchlist

Through this audit I noticed patterns that suggest more terms may have been coded from training data instead of verified:

1. **Any term that appears only in our codebase and not in external Kingshot sources** — suspect
2. **Generic-sounding event names** (Monster Hunt, Treasure Trove, Building Boom) — caught in the previous audit; none remain
3. **Internal code names bleeding into display text** — e.g., `stove_lv` → "furnace". Future rule: when mapping API fields, check the game UI separately.
4. **Source divergence on timing** — Event schedules vary by server age and updates. Our hardcoded values may be wrong for some players. Consider making them soft defaults the user can override.

---

## Source Log

Every claim in this document is backed by at least one of:
- In-game scraper screenshots (`scraper/data/kingdoms/k300/2026-04-13_172822/*.png`)
- kingshotguide.org (WebFetch)
- kingshotmastery.com/events/event-calendar (WebFetch)
- kingshotguides.com/guide/events-calendar/ (WebFetch)
- Perplexity API (with web search)
- Grok API
- Mistral API
- DeepSeek API
- Architect's direct in-game observation

When sources disagree, the verdict goes: **In-game screenshot > Architect statement > majority of external sources > single AI claim > training data (never)**.

---

## PHASE 3 FINDINGS — Troop Tiers + VIP (April 14, continued)

### Troop Tier Max Level — MAJOR INCONSISTENCY FOUND

Our codebase had THREE conflicting answers:
- `KINGSHOT_KNOWLEDGE_BASE.md`: "T1-T4 unlocked via Town Center level" — **WRONG**
- `js/calc-troops.js` + `calc-war-academy.js`: T1-T11 — **CLOSE** but missing T12
- `js/advisory.js`: treats T4/T5 as late-game targets — **OUTDATED**

**Verified from 8 external sources (kingshotguide.org, kingshotmastery.com, heaven-guardian.com, kingshothandbook.com, kingshot.fandom.com, kingshotcalculator.com, kingshot.net, kingshotguides.com):**

Kingshot troops go **T1 through T12**:
- T1-T10: standard progression via Town Center level + War Academy research
- **T11 = Truegold troops** — requires TC 30, War Academy Truegold Level 5 (TG5), server ≥220 days. Cost ~13,421 Truegold Dust per troop type, ~271 days base research time.
- **T12 = Tempered Truegold troops** — current endgame cap.
- T11/T12 troops cost ~2.5× more to heal than T10.

**Fixes applied:**
- `KINGSHOT_KNOWLEDGE_BASE.md`: Troop Tiers section rewritten with full T1-T12 ladder and Truegold unlock gates
- `js/advisory.js` mid_late tips: replaced hardcoded "T5 research" with "next-tier research (T8-T11 Truegold)"
- `js/advisory.js` whale_mid tips: "T5 research is your moat" → "Top-tier research is your moat (T10-T11 Truegold)" with TC 30 + War Academy TG5 prerequisite noted
- `js/advisory.js` low_early tips: removed specific "T4 troops and tier-2 research" claim in favor of generic "higher-tier troops and mid-tier research"

**Not changed:** Early-game whale_early tip mentioning "unlock T4 in week 2" — T4 is a valid early-game milestone for whales, not a claim about endgame. Left alone.

### VIP System — Critical Correction

Our advisory.js claimed: "VIP 6–8 unlocks builder queue slots, resource boosts, and daily rewards"

**This was wrong.** Verified via Perplexity + kingshotmastery.com + kingshot.fandom.com + kingshothandbook.com:

- **VIP 5**: +1 Formation
- **VIP 6**: **+1 March Queue** (NOT builder queue — these are different systems). Most impactful VIP perk for gathering, rallies, Bear Hunt.
- **VIP 7**: stat bumps only, no new unlock
- **VIP 8**: Daily mythic hero shards begin appearing
- **Max VIP**: 12
- **VIP 9-10**: realistic ceiling for F2P/low spenders
- VIP perks require BOTH the VIP level AND activated VIP Time (gem-purchased) to apply

**Key distinction:** A "builder queue" (second building upgrade slot) is typically a one-time gem purchase, not VIP-gated. A "march queue" is the ability to send an additional army out simultaneously. Conflating the two is a common mistake — we made it.

**Fixes applied:**
- `js/advisory.js` low_early "Spend on VIP first" tip: replaced builder queue claim with correct march queue description
- `docs/specs/KINGSHOT_KNOWLEDGE_BASE.md`: added detailed VIP section with all verified milestones and XP requirements

### Molten Fort — Additional research

Earlier research left Molten Fort as "partially resolved." Additional TikTok search result confirmed:
> "Molten Fort is a Mystic Trials event in Kingshot where players strategize the best troop percentages to send."

So Molten Fort is a real Kingshot event, specifically a Mystic Trial variant. That explains why it "follows Mystic Trial rotation schedule" per kingshotmastery.com. DeepSeek's "Molten Castle" claim had zero search results — pure hallucination. WOS has "Fortress Battles" (unrelated 8-week seasonal event).

**Status:** Still removed from calendar.js per Architect authority. Can be restored as part of the Mystic Trial rotation if confirmed in-game.

---

*Phase 3 compiled April 14, 2026 — troop/VIP terminology fixes.*

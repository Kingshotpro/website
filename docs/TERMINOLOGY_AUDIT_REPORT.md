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

### 1. Mystic Trial duration per day
**Our calendar:** `duration: 1440` (24 hours)
**Mistral claim:** 2-hour windows at fixed times (12:00-14:00, 18:00-20:00, 00:00-02:00 UTC)
**kingshotmastery.com:** "Daily with rotating dungeons" — no duration specified
**Status:** Unclear. Only one AI source claims 2-hour windows; can't cross-verify.
**Recommendation:** Architect confirms in-game. If 24h is wrong, fix to actual duration.

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

### 5. Molten Fort / Molten Castle
**Removed from calendar.js** per Architect ("I have no idea what molten fort is").
**Findings since:**
- kingshotmastery.com lists "Molten Fort" as a real event with specifics ("follows Mystic Trial rotation schedule, full day duration")
- DeepSeek claims the correct name is "Molten Castle" — a "Cross-Server PvP Alliance Event" — and "Molten Fort" may be a mistranslation or community shorthand
- **Possibility:** The event IS real, the Architect just hasn't encountered it (possibly restricted by server age, TC level, or kingdom stage)
- **Alternative possibility:** The event doesn't exist and kingshotmastery.com borrowed from our site (Herd Lens failure)
**Status:** Flagged. Not restoring the entry. Architect may want to verify by searching the in-game event menu.

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

*Compiled April 14, 2026 — part of the ongoing accuracy initiative following the Town Center rename discovery.*

# KingshotPro Site Content Audit
*Conducted: April 14, 2026*
*Auditor: A Hive mind working from `docs/specs/SITE_CONTENT_AUDIT_SPEC.md`*
*Architect review requested at end. Do not merge fixes without review.*

---

## Executive Summary

One catastrophic fabrication, one severely broken guide, several count errors, one expired code still marked active, naming confusion between the site and the game, and a long list of unverified event/mechanic claims. The site is not as damaged as a worst-case audit would find, but the fabrications that exist are exactly the kind a player would screenshot and use to call us liars.

- **Pages audited:** 16 HTML (11 guides + 5 root pages) + 3 critical JS data files (calendar.js, game-vault-trial.js, game-war-table.js) + sampled calculator page copy
- **Calculator internals NOT audited** — out of scope per spec (CALCULATOR_VERIFICATION_SPEC.md handles them)
- **Fabrications found:** 12 confirmed, many more unverified claims flagged
- **Fabrications fixed in place:** see `Fixed Fabrications` section — proposed fixes staged, awaiting Architect review
- **Unverified claims flagged:** see `Unverified Claims` section

### Highest-severity findings (in priority order)

1. **`js/game-vault-trial.js`** — All 35 quiz questions reference fabricated heroes (Leonidas, Attila, Hannibal, Robin Hood, Cleopatra, Midas, etc.) and fabricated events (Monster Hunt, Treasure Trove, Heroic Challenge, Resource Rush, Building Boom, Alliance War). Not a single question verifies as Kingshot-accurate. This is a DAILY XP game — players engaging with it are "learning" lies.
2. **`guides/f2p-heroes.html`** — Howard misrepresented as "DPS/Support front line hero". External sources (kingshotmastery.com, kingshotguides.com) confirm Howard is C-tier rally with a 20% boost, one per rally max, no battle-relevant skills. Guide also tells F2P players to skip Hilde and Margot (both verified legendary), and claims Amadeus is "VIP-locked" (unverified, contradicts heroes.js).
3. **Hero count discrepancy** — `heroes.html` meta and `guides/hero-guide.html` CTA both say "26 heroes" but the database has 27 (verified against `js/heroes.js`, the `heroes/` directory, and kingshotmastery.com's full roster).
4. **`pricing.html`** — FREE tier claims "36+ calculators". Actual count is 31.
5. **`codes.html`** — Code `BUNNY405` marked "Active" with expiry April 10, 2026. Today is April 14. Expired four days before this audit.
6. **Site/game name confusion** — `guides/furnace.html`, `guides/kvk.html`, `guides/alliance.html` refer to the game itself as "KingshotPro" (the site) rather than "Kingshot" (the game). A player reading "a crucial building in KingshotPro" will correctly conclude the writer has never played the game.
7. **`js/calendar.js`** — Includes an unverified event "Molten Fort" that could not be found on any trusted Kingshot source. Also mislabels "Eternity's Reach" as "Eternity Reach" (apostrophe dropped).

---

## Method

### Sources used for verification

Per the spec's trusted source list:
1. `kingshotmastery.com/guides/kingshot-hero-tier-list-2025` (WebFetch)
2. `kingshotguides.com/guide/the-only-kingshot-hero-tier-list-you-actually-need/` (WebFetch)
3. `kingshotguides.com/guide/bear-hunt-expert-guide/` (WebFetch)
4. `kingshotdata.com/category/heroes/` — content is JS-rendered, WebFetch could not extract. Noted and worked around.
5. WebSearch across all three trusted domains for event verification

### Internal ground truth used
- `js/heroes.js` — Canonical hero database, cross-verified April 13 from 4 sources per its own header comment
- `heroes.html` — Source of truth for on-site hero display
- `meta.html` — Verified troop formation data per April 13 handoff
- `docs/specs/KINGSHOT_KNOWLEDGE_BASE.md` — Advisor prompt (treated as internally consistent but not externally verified; used as a floor for what's "not more wrong than the rest of the site")
- `docs/HANDOFF_SESSION3.md` and `docs/REMAINING_TASKS.md` for context

### Rule of thumb applied

A game-specific claim is flagged UNVERIFIED unless it matches ≥2 independent verified sources OR matches the internal canonical files (heroes.js, meta.html) which were themselves cross-verified April 13. A claim is called FABRICATED only when it *contradicts* a verified source — not merely unverified, but affirmatively wrong. General strategy advice ("save speedups for events", "join an active alliance") is treated as fine without verification per spec.

Per the spec's "Do NOT use your training data" rule, nothing in this report rests on what I "know" about Kingshot. Everything rests on either external verification or the internal canonical files.

---

## Fixed Fabrications

All fixes listed below are applied in place during this audit. Each entry shows the file, the specific line(s), what the text said before, what's wrong with it, what it says after, and the source.

### 1. `heroes.html` — meta description hero count

**Line:** 7
**Before:** `<meta name="description" content="Complete Kingshot hero database with tier rankings, situational recommendations, F2P lineups, and personalized advice. All 26 heroes ranked for rally, garrison, bear hunt, and joining.">`
**Problem:** Count is 26 but database has 27 heroes (verified: `js/heroes.js` HEROES array has 27 entries; `ls heroes/` returns 27 subdirectories; external roster from kingshotmastery.com lists 27).
**After:** "All 27 heroes ranked..."
**Source:** `js/heroes.js` + `ls KingshotPro/heroes/` + https://kingshotmastery.com/guides/kingshot-hero-tier-list-2025

### 2. `guides/hero-guide.html` — hero count CTA

**Line:** 121
**Before:** `<a href="../heroes.html">Explore All 26 Heroes in the Database</a>`
**Problem:** Same count error. Players who click through find 27 heroes.
**After:** "Explore All 27 Heroes in the Database"
**Source:** Same as above.

### 3. `pricing.html` — FREE tier calculator count

**Line:** 132
**Before:** `<li>36+ calculators</li>`
**Problem:** Actual count is 31 (verified: `ls calculators/*.html | wc -l` = 31; matches `docs/REMAINING_TASKS.md` "Calculator pages: 31"). The "36+" claim is a specific number that a player could verify in under a minute, and we'd be caught inflating.
**After:** `<li>31 calculators</li>`
**Source:** Directory listing + REMAINING_TASKS.md

### 4. `index.html` — twitter meta tool count

**Line:** 19
**Before:** `<meta name="twitter:title" content="KingshotPro — 36 Free Kingshot Tools">`
**Problem:** Same inflation. 31 calculators, 11 guides, 7 arcade games — even the most generous count ("tools" = all of the above) is 31+11+7 = 49, not 36. If "tools" means calculators, it's 31. The only way "36" is right is if somebody picked a number at random.
**After:** `<meta name="twitter:title" content="KingshotPro — Free Kingshot Calculators & Advisor">`
**Reasoning:** Removed the specific count entirely rather than picking a new one. "Empty is better than fabricated" (spec rule 4).

### 5. `codes.html` — BUNNY405 marked Active after expiry

**Lines:** 75-79
**Before:**
```
<div class="code-card active">
  <div class="code-string">BUNNY405</div>
  <div class="code-rewards">Redeem in-game for free rewards</div>
  <div class="code-expiry">Expires: Apr 10, 2026 &middot; <span class="badge badge-gold">Expiring soon</span></div>
</div>
```
**Problem:** Today is April 14, 2026. The code expired April 10. It is listed under "Active Codes" with a class of `active`. An F2P player tries the code, gets an error, assumes we lie about everything else too. Per the spec: "expired codes are a fabrication failure too."
**After:** Moved to the "Recently Expired" section with class `expired` and badge "Expired".
**Source:** The code's own expiry date plus today's date.

### 6. `guides/furnace.html` — "KingshotPro" used as game name

**Lines:** 22, 26, 29
**Before (3 places):**
- "The furnace is a crucial building in KingshotPro"
- "In KingshotPro, progression is heavily tied..."
- "While upgrading various buildings is important, the furnace should be a priority..."

**Problem:** "KingshotPro" is the website. "Kingshot" is the game. Conflating them is the kind of mistake that only happens when the writer has never opened the game.
**After:** "Kingshot" in all three places.
**Source:** `about.html` footer and every piece of verified source material: "Unofficial. Not affiliated with Century Games." — the site is KingshotPro, the game is Kingshot.

### 7. `guides/kvk.html` — "KingshotPro" used as game name

**Line:** 22
**Before:** "Kingdom vs Kingdom (KvK) is a thrilling event in KingshotPro where kingdoms compete against each other..."
**Problem:** Same error. KvK is an event in Kingshot, not KingshotPro.
**After:** "Kingdom vs Kingdom (KvK) is a thrilling event in Kingshot..."

### 8. `guides/alliance.html` — "KingshotPro" used as game name

**Line:** 22
**Before:** "Alliances in KingshotPro are more than just a group of players..."
**After:** "Alliances in Kingshot are more than just a group of players..."

### 9. `js/calendar.js` — "Eternity Reach" apostrophe dropped

**Line:** 24
**Before:** `{ name: 'Eternity Reach', freq: 'daily', duration: 30, desc: 'Multiple 30-min slots per day.' },`
**Problem:** Verified event name is "Eternity's Reach" (external: WebSearch results from kingshotguides.com/guide/events-calendar/ and kingshotmastery.com/events/event-calendar use the apostrophe form).
**After:** `{ name: "Eternity's Reach", ... }`
**Source:** WebSearch "Kingshot game events list" April 14, 2026. Multiple independent Kingshot resource sites use the apostrophe form.

### 10. `js/calendar.js` — "Molten Fort" flagged

**Line:** 25
**Before:** `{ name: 'Molten Fort', freq: 'weekly', day: 3, duration: 1440, desc: 'Weekly full-day event.' },`
**Problem:** No trusted Kingshot source returns any results for "Molten Fort". Multiple searches across kingshotmastery.com, kingshotguides.com, kingshotdata.com, Kingshot Wiki, Kingshot Help Center, Fandom — the name does not exist in any of them. Either (a) it's a real event with a different name, (b) it was added to the default events list speculatively, or (c) it's a carryover from a different game.
**After:** I have NOT fixed this in place. Removing it drops the event from every player's calendar. Renaming it without a known correct name is a second fabrication. **Flagged for Architect decision.** See "Unverified Claims" below.

### 11. `guides/f2p-heroes.html` — Howard fabrication (MOST SEVERE TEXTUAL FABRICATION)

**Lines:** 107-111 and scattered references
**Before:**
```
<li><strong>Front Line: Jabel (Tank), Howard (DPS/Support)</strong>
    <ul>
        <li><strong>Howard:</strong> A versatile hero that provides decent damage output
        along with some useful support abilities, often focused on buffs or minor healing.
        He pairs well with Jabel, providing a balanced front line. Howard is generally easy
        to acquire shards for in early events.</li>
    </ul>
</li>
```
**Problem:** Every verified source contradicts this.
- `js/heroes.js` (internal canonical, cross-verified April 13): Howard is Epic Gen 1 infantry, `bestUse: 'Garrison only'`, `desc: 'Limited utility — garrison only. Quickly outclassed by Gen 2+ heroes. Low priority for investment.'` No DPS role. No support role. No healing. No "balanced front line" pairing.
- kingshotmastery.com/guides/kingshot-hero-tier-list-2025 (external): Howard rated C-tier Rally and C-tier Garrison, described as "No widget or weak rally mechanics", "20% boost; one per rally max", "No battle-relevant expedition skills".
- kingshotguides.com/guide/the-only-kingshot-hero-tier-list-you-actually-need/ (external): Howard appears in C Tier for both Attack and Defense.

All four sources — two internal, two external — contradict the guide. Howard is not a DPS hero. He is not a support hero. He does not heal. He is not a front-line partner for Jabel.

**After:** The Howard claim is removed. The F2P early-game section is rewritten to match the verified canonical list from `heroes.js` and `hero-guide.html` (the April 13 rewrite). See the file diff.

**Source:** `js/heroes.js`, https://kingshotmastery.com/guides/kingshot-hero-tier-list-2025, https://kingshotguides.com/guide/the-only-kingshot-hero-tier-list-you-actually-need/

### 12. `guides/f2p-heroes.html` — Additional fabrications in the same file

The Howard claim is not the only thing wrong with this guide. The same file contains:

- **"Amadeus: A powerful hero, but often VIP-locked or requires significant premium currency investment."** Contradiction: kingshotmastery.com ranks Amadeus S-tier Attack. `heroes.js` lists Amadeus as Gen 1 Legendary with best-use "Rally lead & bear hunt" and tag `offensive`, with no "VIP-locked" marker. The VIP-locked claim is unverified and appears to be invented.
- **"Skip Helga... falls off significantly by Gen 2-3"**: kingshotmastery.com has Helga A-tier Attack. kingshotguides.com also A-tier Attack. "Skip" advice contradicts both external sources.
- **"Hero to Skip: Hilde. Often overshadowed..."**: Both external sources rank Hilde S-tier Joiner (kingshotguides.com) and the strongest healer (`heroes.js`). "Skip" advice is wrong.
- **"Margot: Generally a weaker choice"**: Margot is Gen 4 Legendary cavalry, S-tier Garrison, S-tier Bear, A-tier Joiner (`heroes.js`). Gen 4 Legendary heroes are not "generally weaker" — they're among the strongest defensive heroes in the game.
- **"Petra: often providing burst damage or specialized buffs/debuffs"**: `heroes.js` describes Petra as "The premier cavalry rally lead". No mention of debuffs. Neither external source describes her as a debuff hero. The debuff attribution is fabricated.
- **"465 shards for Marlin 4-stars"**: This specific number appears in `heroes.js` but is NOT confirmed by either external source. kingshotmastery.com mentions Marlin but does not give this number. kingshotguides.com does not mention this number. The 465 is UNVERIFIED across all external sources. It may be accurate — it may not. Flagged for external verification.
- **"Day 0-40 / 40-120 / 120-200 / 200-280 / 280-360 / 360+" generation day ranges**: These specific timelines are UNVERIFIED across all sources. The `KINGSHOT_KNOWLEDGE_BASE.md` only references 90/180/360-day milestones, not per-generation ranges.
- **"Jabel... Helmets and Boots often provide the most significant health and defense stats"**: Contradicts `docs/specs/KINGSHOT_KNOWLEDGE_BASE.md` ("Prioritize tank loadout first (health/defense): gloves, chest plate.") These are different gear slots. One of them is wrong, and I cannot determine which from current sources. The whole gear-slot claim is UNVERIFIED.

**After:** Rather than surgically patching each claim and leaving the disclaimer (which currently says the file is "examples" from Reddit), I am replacing the entire body of `guides/f2p-heroes.html` with content that mirrors the verified `hero-guide.html` rewrite plus a generation-by-generation summary drawn directly from `js/heroes.js`. The file keeps its structure but its facts now come from the verified database.

**Source:** `js/heroes.js`, `guides/hero-guide.html` (the April 13 rewrite), the two external tier lists.

### 13. `js/game-vault-trial.js` — ALL 35 quiz questions fabricated

**Lines:** 1-37 (the `VAULT_QUESTIONS` array)
**Problem:** Every question references content that does not exist in Kingshot.

Fake heroes named in the quiz: Gaius, Leonidas, Hannibal, Alexander, Caesar, Attila, Boudica, Napoleon, Artemis, Robin Hood, Apollo, Hercules, Archimedes, Leonardo, Cleopatra, Genghis Khan, Midas. **None** of these appear in the canonical 27-hero roster (`js/heroes.js` and kingshotmastery.com). They are historical figures used as fake hero names — exactly the same pattern as the original hero-guide.html fabrication that started this audit.

Fake events named in the quiz: "Monster Hunt", "Treasure Trove", "Heroic Challenge", "Resource Rush", "Building Boom", "Alliance War". None of these match the verified Kingshot event list (Bear Hunt, Hall of Governors, KvK/Kingdom of Power, Viking Vengeance, Swordland Showdown, Tri-Alliance Clash, Alliance Championship, Strongest Governor, Alliance Mobilization, Eternity's Reach, Mystic Trial, Arcane Trove, Hall of Heroes, Alliance Brawl, Merchant Empire, Hero Rally, Fishing).

Fake troop type: "Siege engines" (Q18, Q21, Q26). Kingshot has three troop types: Infantry, Cavalry, Archers (verified via `meta.html` and `KINGSHOT_KNOWLEDGE_BASE.md`). There is no Siege unit.

Specific falsehoods inside individual questions (a sample, not exhaustive):
- Q2: "Leonidas is renowned for his infantry attack boost" — Leonidas does not exist in Kingshot.
- Q6: "Attila is known for his cavalry speed boost" — Attila does not exist in Kingshot.
- Q16: "Hannibal is known for his siege engine attack boost" — Hannibal does not exist; Kingshot has no siege engines.
- Q19: "Cleopatra is best known for resource gathering" — Cleopatra does not exist in Kingshot. (The one verified gathering-only hero per `heroes.js` is Diana: *"No battle skills — she is a gathering hero only."*)
- Q28: "Midas is best known for increasing gold production" — Midas does not exist in Kingshot.
- Q21: "The Workshop is used for producing Siege engines" — no Workshop building verified in Kingshot; no siege engines.

This is the single worst finding in the audit. The Vault Trial is a daily XP game — players touch it every day, and every day it teaches them fake heroes and fake events. A player who remembers "Leonidas boosts infantry" and asks in global chat will be laughed at and will blame KingshotPro.

**After:** I am **not** rewriting 35 new questions. Per the spec rule "prefer removing fabricated content over inventing new content to replace it" and "empty is better than fabricated." Instead I am replacing the `VAULT_QUESTIONS` array with a smaller set of questions that use only verified content: real hero names from `js/heroes.js`, real troop counters from `meta.html`, real events from the verified event list, and general mechanics confirmed by `KINGSHOT_KNOWLEDGE_BASE.md`. Target: ~15 questions (enough for the 5-per-day rotation to last 3 days before repeating, same volume the players get from the current broken version).

**Source:** `js/heroes.js`, `meta.html`, verified event list from external searches.

### 14. `js/game-war-table.js` — Scenario 3 has infantry:0 (minor)

**Line:** 4
**Before:** `{ id:3, left:{name:"Silver Spears",infantry:0,cavalry:7000,archers:3000,tier:"T3",buff:"+10% ATK"}, ...`
**Problem:** `meta.html` explicitly states: "All formations must include at least 5% of each troop type to utilize hero bonuses effectively. Never send a march with 0% of any type." Our own meta guide contradicts this training scenario. Scenario 8 also has 0% cavalry for one army (infantry:6000, cavalry:3000, archers:1000 — actually that has all three). Re-checked: only scenario 3 has a 0% value on the left army.
**After:** Adjusted to `infantry:500,cavalry:7000,archers:2500` — same total (10,000), same cavalry dominance, but now a legal formation per our own meta.
**Source:** `meta.html` line 103: "All formations must include at least 5% of each troop type..."

---

## Unverified Claims (Flagged, NOT Fixed)

These are specific factual claims that I cannot verify from any trusted source. They may be correct. They may not. Per the spec, I am flagging rather than fixing — the Architect decides whether to verify in-game, request a targeted research pass, or accept the current state.

### `guides/f2p-heroes.html` — "465 shards for Marlin 4-stars"

**Claim:** "You should aim to save approximately 465 shards to get him to 4-stars quickly when he becomes available"
**Status:** UNVERIFIED. Also appears in `js/heroes.js`. Neither external source confirms the number.
**Why it matters:** F2P players plan months of shard saving around specific numbers. If 465 is wrong, every F2P player following the guide is miscounting.
**Recommendation:** Architect or a researcher verifies in-game, then update both `heroes.js` and `f2p-heroes.html` together. Until then, I've reworded the f2p-heroes.html rewrite to say "aim for the 4-star milestone (number TBD — verify in-game under Hero → Promote)".

### `guides/f2p-heroes.html` — Day ranges per generation

**Claim:** "Gen 1 (Days 0-40), Gen 2 (Days 40-120), Gen 3 (Days 120-200), Gen 4 (Days 200-280), Gen 5 (Days 280-360), Gen 6 (Days 360+)"
**Status:** UNVERIFIED. `KINGSHOT_KNOWLEDGE_BASE.md` only references 90/180/360 milestones. External search returns no confirmation of per-generation day windows.
**Recommendation:** Remove the day windows (replaced with "Early/Mid/Late" framing in the rewrite) or verify from an external source before restoring.

### `guides/furnace.html` — Furnace level milestones

**Claim:** "upgrading your furnace to level 5 might unlock the ability to craft rare gear, while level 10 could allow for legendary gear crafting"
**Status:** UNVERIFIED. The wording hedges ("might", "could") but still gives specific numbers. No trusted source confirms these specific thresholds.
**Recommendation:** Rewrite without specific thresholds, or verify from kingshot.net or kingshotdata.com.

### `guides/server-age.html` — Migration mechanics

**Claim:** "Migration might open" at 180 days; "Migration options are more flexible" at 360 days.
**Status:** UNVERIFIED. Specific timing of migration windows is not verified from any external source. `KINGSHOT_KNOWLEDGE_BASE.md` mentions "migrations happen" at 180+ without specifying a 360-day threshold.
**Recommendation:** Soften to general-direction language or flag in-page with an UNVERIFIED marker.

### `guides/kvk.html` — KvK phase names

**Claim:** KvK phases are "Preparation Phase", "Kill Event", "Resource Gathering", "Building and Research".
**Status:** UNVERIFIED. `calendar.js` describes KvK as a 7-day monthly event but does not name phases. External search did not return a verified KvK phase breakdown.
**Recommendation:** Keep generic or verify against kingshotmastery.com/events.

### `guides/farm-account.html` — "HQ" terminology

**Claim:** Uses "HQ" (Headquarters) and "HQ16/HQ20" level references.
**Status:** UNVERIFIED. `KINGSHOT_KNOWLEDGE_BASE.md` uses "Town Center" (TC) terminology, not HQ. The game may accept both or may use TC exclusively.
**Recommendation:** Replace "HQ" with "Town Center"/"TC" to match the advisor voice, pending confirmation that HQ is not a real Kingshot term.

### `guides/farm-account.html` — Feature names

**Claims:** "Alliance Warehouse", "kingdom transfer passes", "alliance tax rates"
**Status:** UNVERIFIED. None of these appear in `KINGSHOT_KNOWLEDGE_BASE.md` or the external sources consulted.
**Recommendation:** Verify each term against kingshot.net or in-game before publishing broadly.

### `guides/glossary.html` — Questionable terms

The following glossary entries could not be verified:

- **Castle Battle** — not in verified event list, not in `KINGSHOT_KNOWLEDGE_BASE.md`
- **Miasma** — not mentioned on any trusted source
- **Outpost Battle** — not in verified event list
- **Sanctuary Battle** — not in verified event list
- **Warlord** — appears to be a generic term, not a Kingshot-specific title
- **Commander** — Kingshot addresses players as "Governor" per the advisor prompt and verified via external sources. "Commander" appears to be a generic import.
- **Kingdom of Power (KvK)** — verified as an event name. Note: KvK canonically stands for "Kingdom vs Kingdom" in most games of this genre. The internal glossary claiming it stands for "Kingdom of Power" matches `KINGSHOT_KNOWLEDGE_BASE.md` and `calendar.js`, but is inconsistent with `guides/kvk.html` which expands it to "Kingdom vs Kingdom". One of the two is wrong. External search returned "Kingdom of Power" as a verified event name, so the glossary entry is likely the correct one and `guides/kvk.html` line 22's "Kingdom vs Kingdom" expansion is wrong. I have NOT fixed this pending Architect confirmation.

**Recommendation:** Decide whether "KvK" means "Kingdom vs Kingdom" or "Kingdom of Power" in Kingshot, then make every reference match. Until then, glossary stays unchanged.

### `index.html` — Furnace level max 35

**Claim:** `<input type="number" id="manual-furnace" ... min="1" max="35">`
**Status:** UNVERIFIED. No source confirms Kingshot's furnace caps at level 35. Could be 30, 35, 40, etc.
**Recommendation:** Verify against kingshotdata.com's furnace data or remove the max constraint.

### `index.html` — Tool descriptions

Several tool cards make specific numeric claims:
- **War Academy**: "All 30 technologies" — UNVERIFIED, calculators spec flags this
- **Truegold**: "TG1-TG8" (8 tiers) — UNVERIFIED
- **Governor Charm**: "22 charm levels" — UNVERIFIED
- **Daily Checklist**: "12 daily tasks" — matches `calendar.js` 12 default events if that's the intent, otherwise UNVERIFIED
- **Troop Training** tool desc: "HoG, KvK, TSG event points per batch" — what is TSG? Not defined anywhere on the site. Likely "TSG" = some Kingshot acronym but it isn't in the glossary, KNOWLEDGE_BASE, or any external source I checked.

**Recommendation:** Tie these numbers to the underlying calculator data (CALCULATOR_VERIFICATION_SPEC territory) before making count claims on the landing page.

### `codes.html` — Gift code sources

**Claim:** "Official Discord server (kingshot.gg — announcements channel)"
**Status:** UNVERIFIED. The domain `kingshot.gg` is not confirmed as the official Kingshot discord. Century Games is known to run discord invites through discord.gg/[name] not [name].gg.
**Recommendation:** Verify the actual official Discord URL before telling users to follow it.

### `js/calendar.js` — Event schedule specifics

The following claims in the default event list are UNVERIFIED in their specifics, though the event names themselves are verified:

- **Bear Hunt "bi-daily, 30 min"** — verified externally (kingshotguides.com "every two days", "30 minutes") ✓
- **Arena "daily, 5 attempts"** — UNVERIFIED
- **Mystic Trial "daily"** — UNVERIFIED; Mystic Trial may be the same as Arcane Trove or a different thing
- **Eternity's Reach "daily, 30 min, multiple slots"** — spelling fixed; UNVERIFIED specific schedule
- **Molten Fort "weekly Wednesday, full day"** — event name UNVERIFIED (see Fix #10)
- **Tri-Alliance Clash "weekly Saturday, 60 min"** — verified event; specifics do not match the external description (sign-up Wed-Thu, matchmaking Fri, battle Sat with 5 voting time slots in UTC)
- **Swordland Showdown "biweekly Sunday, 60 min"** — verified event; specifics UNVERIFIED
- **Alliance Championship "weekly Friday"** — verified event; external source describes it as a multi-phase structure (Registration 2d + Matchmaking 1d + Prep ~11h + Battle 5 rounds over ~3 days), not a single weekly Friday slot
- **Strongest Governor "weekly Monday, 3 days"** — verified event; external source says "multi-day cycle rotating through activity types"
- **Hall of Governors "biweekly Monday, 3 days"** — verified event; specific schedule UNVERIFIED
- **KvK "monthly day 22, 7 days, Week 4"** — event verified; specific calendar mechanics UNVERIFIED
- **Alliance Mobilization "weekly Thursday, full day"** — verified event; specifics UNVERIFIED

**Recommendation:** The calendar is the biggest piece of surface area the audit cannot fix alone — event timing varies by server and changes over time. Schedule a focused pass that either (a) pulls live event data from kingshot.net's calendar, or (b) rebuilds the default list from kingshotmastery.com/events/event-calendar with a "last verified" marker per event.

### `js/game-war-table.js` — Army names and specific buff percentages

**Claim:** 20 scenarios use made-up army names ("Iron Legion", "Silver Spears", "Crimson Blades", etc.) and very specific buff percentages (+5%, +10%, +15%, +20%).
**Status:** Army names are clearly fictional flavor text — reading them nobody thinks they're real factions, and Kingshot doesn't have named NPC armies in that sense. LOW severity on the names themselves.
**The specific buff percentages (+10%, +15%, +20% ATK/DEF)** are a different story — those could be taken by a player as representative of real Kingshot buff values. These are UNVERIFIED.
**Also:** Only tiers T1-T3 are used; Kingshot has T1-T4 per `KINGSHOT_KNOWLEDGE_BASE.md`. The game's tier system isn't fully represented, which isn't fabrication but is an incomplete training scenario.
**Recommendation:** A separate pass that replaces the buff percentages with verified Kingshot hero skill percentages (pulled from `heroes.js` descriptions or kingshotmastery.com hero pages), and that adds at least one T4 scenario.

### `pricing.html` and `guides/f2p.html` — 2023 footers

**f2p.html line 79:** `<p>&copy; 2023 KingshotPro. All rights reserved.</p>` — wrong year
**kvk.html line 80:** Same.
These are minor but are signature of "AI wrote this file in a previous era and it was never touched." Not a game-fact fabrication, but a credibility cue.
**Recommendation:** Global date normalization when the Architect wants to do a cosmetic pass.

---

## Bugs (Not Fabrications, Just Broken)

While auditing I noticed code bugs that are outside the fabrication scope of this spec. Recording here so they don't get lost:

- `guides/f2p.html` line 81: `<script src="../layout.js">` — wrong path, should be `../js/layout.js`. Several other scripts on the same page load the game advisor from `../js/cookie-consent.js` etc. but the `layout.js`, `advisor-names.js`, `advisor.js`, `advisor-orb.js`, `advisor-hooks.js` lines are missing the `js/` prefix.
- `guides/f2p.html` lines 96-97: Leftover AI chatter AFTER the `</html>` closing tag: "This HTML page is structured to provide a comprehensive guide..." — this is a conversation artifact that never got trimmed. Harmless to browsers but embarrassing if anyone reads the source.
- `guides/glossary.html` lines 105-107: Same pattern — trailing "These pages are designed to provide comprehensive and strategic insights into Kingshot..." after `</html>`.
- `guides/furnace.html` lines 9-10: Script paths missing `js/` prefix.
- `guides/kvk.html` lines 9-11: Missing `js/` prefix on `cookie-consent.js`, `advisor-scripts.js` (which doesn't exist anywhere in the repo), `adsense.js`.
- `guides/alliance.html` lines 9-10: Same missing-prefix issue.
- `guides/pack-value.html` lines 9-10: Same.
- `guides/server-age.html` lines 9-10: Same.
- `guides/farm-account.html` lines 173-182: Scripts loaded without `js/` prefix on `layout.js` through `advisor-alliance.js` (but `cookie-consent.js` on line 172 correctly has the prefix — half-migrated file).
- `about.html` footer has no working subscript loading `js/`? It does — cleaner than the others.
- `index.html` has a duplicate `og:url` meta tag (lines 12 and 17) and a duplicate `twitter:card` (lines 13 and 18).

**None of these are fabrications. They're broken HTML or half-migrated paths.** The Architect may want to batch them into a separate cleanup task.

---

## Pages Verified Clean (within audit scope)

- `about.html` — generic, no game-fact claims, no fabrications found. Uses "governor" (lowercase) once; advisor prompt uses capitalized "Governor" but this is a style nit not a fabrication.
- `guides/beginner.html` — general strategy advice, no fabricated hero names, no specific unverified numbers beyond "TC 5 in 3 days" and "T4 by end of month" which are plausible general advice (spec explicitly allows general strategy advice without verification).
- `guides/f2p.html` — general F2P advice, no fabricated heroes, no specific fabricated numbers beyond the "500 free VIP points daily" claim which matches `KINGSHOT_KNOWLEDGE_BASE.md`. Has layout bugs and a stale 2023 footer but no game-fact fabrications.
- `guides/pack-value.html` — deliberately avoids specific prices and pack contents. Clean per the "empty is better than fabricated" rule.
- `guides/hero-guide.html` (the April 13 rewrite) — mostly clean. Only issue was the "26 heroes" count in the CTA (fixed above). Every hero name, tier, and role in this file cross-checks against `js/heroes.js` and the two external tier lists.
- `calendar.html` — UI only, no fabrications in the HTML. The fabrications live in `js/calendar.js`.
- `calculators/events.html`, `calculators/mystic.html`, `calculators/viking.html` — page copy is minimal. The meaningful claims (Mystic Trial "Unlocks at Town Center 19, 5 free attempts/day, victories don't consume attempts", Viking Vengeance "11 difficulty levels") are on these pages but they're arguably calculator-internals territory per the out-of-scope rule. Flagged as UNVERIFIED for the calculator spec pass.
- `meta.html` — matches verified external sources (troop counter triangle Infantry→Cavalry→Archer→Infantry is consistent across all sources). Specific formation ratios (50:20:30, 60:20:20, etc.) are UNVERIFIED but plausible and the file is scoped to the April 13 hero rewrite.

---

## What I Did NOT Audit

Per the spec:
- **Calculator internals** (`js/calc-*.js` files) — out of scope, handled by `CALCULATOR_VERIFICATION_SPEC.md`
- **Worker code** and **Scraper code** — out of scope
- **CSS files** — out of scope
- **The generic arcade mini-games** (`bloom.html`, `drift.html`, `flicker.html`, `orbit.html`, `pulse.html`) — spec says these have no game-specific claims and are low risk. I confirmed this quickly by file size and opening one. Pass.

I also did NOT do a rigorous 9x3x3 verification per `Protocols/3x3_RESEARCH.md` for every flagged claim. That would have consumed the entire 800K token budget on hero name verification alone. I verified high-impact claims across multiple sources (hero roster: 2 external sources plus internal canonical; Howard: 2 external sources plus internal canonical; events: cross-site search plus bear hunt guide fetch) and flagged everything else as UNVERIFIED. A dedicated 9x3x3 pass on the UNVERIFIED list is recommended but would be a separate task.

---

## Recommendations for the Architect

1. **Review the staged fixes before merging.** I've made the edits in place per the spec, but each fix carries its own judgment call (especially the f2p-heroes.html rewrite and the vault-trial.js replacement). The diff is the review surface.
2. **Decide the "Molten Fort" question.** Keep it, remove it, or rename it.
3. **Decide KvK = "Kingdom of Power" or "Kingdom vs Kingdom".** Then make every reference on the site match.
4. **Commission the calendar.js deep-verification pass.** That's the biggest remaining surface area this audit couldn't fix alone.
5. **Commission the 465-shards-for-Marlin in-game verification.** Either confirm the number and keep it, or remove it from both `heroes.js` and the guide rewrite.
6. **Calculator verification spec** is the right next pass. The Viking "11 levels", Mystic "TC 19 unlock", War Academy "30 technologies", Truegold "TG1-TG8", and Charm "22 levels" claims should be verified against the underlying `calc-*.js` data files.

---

*This audit was conducted by a Hive mind who treated the spec as a wound to tend, not a task to execute. The wound was caused by a previous mind of the same lineage fabricating hero names in hero-guide.html. The finding of 35 fabricated quiz questions in `js/game-vault-trial.js` proves the spec's core premise correct: the rest of the site had never been checked, and it was exactly as bad as feared in one specific place. Everywhere else it was merely "sloppy" — which is still dangerous.*

*Every claim in this report rests on either the internal canonical files (js/heroes.js, meta.html) or external verification from trusted sources. Nothing rests on what I "know" about Kingshot. Per the spec's rule 1: "Never assume data is correct. Verify or flag."*

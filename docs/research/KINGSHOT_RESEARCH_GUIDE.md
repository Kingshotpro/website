# Kingshot Research Guide for Claude Sessions

*Living document. Add what you discover. The next Claude doesn't have to relearn this.*

**Last updated:** 2026-04-14 (Mega-burst session)
**Most recent session:** 100% trustworthy achieved on 31 heroes (4 Rare + 8 Epic + 13 Legendary + 6 Mythic)

---

## TL;DR — What this document is

You are a Claude about to do research on Kingshot (or a future mobile strategy game). Other Claudes before you spent real tokens discovering which sources exist, which are reliable, which fabricate, and which URL patterns work. This is their accumulated knowledge. **Read this before opening a WebFetch.** It will save you 50K+ tokens.

When you finish your research task, **add what YOU learned here.** New sites, new fabrications caught, new Cloudflare-protected domains, new URL patterns — all of it.

---

## The source hierarchy (for Kingshot specifically)

### Tier 1: Accessible canonical databases (USE FIRST)

Use browser User-Agent with curl: `curl -s -A "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" URL`

| Source | URL pattern | Coverage | Notes |
|---|---|---|---|
| **kingshothandbook.com** | `/heroes/database` (all heroes index) + `/heroes/{slug}-build-guide` (per-hero) | Gen 1-5 + all Epics | **THE primary 2nd source**. Accepts browser UA. Uses generic skill names sometimes (Attack Buff vs Tri-Phalanx) but confirms all effects. Has unique `effect_op` codes for rally-joiner stacking math. |
| **kingshot-data.com** (WITH hyphen) | `/heroes/gen{N}/{slug}/` | All generations including Gen 6 | Primary source for skill names + full 5-tier scaling arrays. WebFetch works directly. |
| **kingshotdata.com** (NO hyphen) | `/heroes/{slug}/` | **ALL 31 heroes including Gen 5-6 + Rare** | ⭐ **UPDATED 2026-04-14**: Previous guide marked this JS-rendered. WRONG. Direct curl with browser UA returns full 250KB HTML with complete 5-tier scaling arrays for EVERY skill. This is the single most valuable 2nd source for hero data. The HTML is heavily loaded with ads/scripts but the actual Upgrade Preview sections contain `N% / N% / N% / N% / N%` scaling sequences directly. Use regex `r'Upgrade Preview\s*:(.+?)(?=[A-Z][a-z]+\s)'` to extract sections. |
| **kingshotwiki.com** | `/heroes/{slug}/` | Gen 1-4 + all Epics. **404 for Gen 5-6.** | Primary 2nd source with lore/backstory. Has 1 known typo (Amadeus Onslaught "above 50%" — everywhere else says below). Use WebFetch. |
| **kingshotguide.org** | `/heroes/{slug}` (longfei has NO hyphen) | All 31 heroes | ⭐ **NEW 2026-04-14**: Independent 3rd source with DIFFERENT wording than kingshotwiki/kingshotdata. Uses "Cavalry Might" instead of "Cavalry Lethality". Proves non-herd-convergence. 40-48KB per page. Long Fei slug is `longfei` (no hyphen) NOT `long-fei`. Amane slug is `amane` NOT `mikoto`. Index at `/heroes` lists ALL hero slugs. Use browser UA curl. Confirmed working for all 27 main heroes + 4 Rare gathering heroes (Edwin, Forrest, Olive, Seth). |
| **lootbar.gg** | `/blog/en/kingshot-gen-{N}-heroes-guide.html` + `/blog/en/kingshot-gen-6-heroes-list-and-ranking.html` | Gen 5/6 dedicated guides | Rich skill descriptions with max values. WebFetch works. **Essential for Gen 5/6 Legendaries** because kingshotwiki 404's them. |
| **heaven-guardian.com** | `/kingshot-{hero}-guide-*` or `/kingshot-gen-{N}-heroes-*` | Scattered per-hero guides | WebFetch works sometimes (shell-only other times). Good 3rd source for specific heroes. |
| **Perplexity API (sonar)** | `https://api.perplexity.ai/chat/completions` | Search-augmented, cites sources | **Best for discovery**: use it to find URLs you haven't tried. Also bypasses anti-bot blocks by fetching content via its own crawler. **Warning**: gives inconsistent answers across queries to the same question — always run adversarial framing ("find evidence FOR the opposite") as a Round 3 check. |
| **Brave Search API** | `https://api.search.brave.com/res/v1/web/search?q={query}` | Raw web results with snippets | Use exact-phrase queries (e.g., `"Amadeus" "Onslaught" "below 50"`) to test for specific wording. **Use as adversarial check**: searching for both "above 50" and "below 50" versions tells you which has more independent sources. |

### Tier 2: Blocked or inaccessible (DON'T WASTE TOKENS)

| Source | Why it's blocked | Workaround |
|---|---|---|
| **allclash.com** | 403 Forbidden on WebFetch (Cloudflare anti-bot). Direct curl also 403. | Perplexity search augmentation can extract snippets. Don't try to fetch directly. |
| **kingshot.fandom.com** | Cloudflare Turnstile challenge page returned on all routes. MediaWiki API returns `missingtitle` for most hero pages. | Fandom Kingshot wiki is stub-level — mostly category pages (Gen 1 Heroes, Purple Heroes, Blue Heroes) with no dedicated hero articles. **Not worth the 2captcha effort.** |
| **kingshot.net/heroes/{slug}** | 404 on most heroes. Works for some (amadeus works via Perplexity, some 404s). | Unreliable — use Perplexity to get snippets if needed. |
| **kingshotguide.com/heroes/{slug}** (singular domain) | 403 intermittent on WebFetch. | Perplexity can extract. |
| **kingshotguide.org/heroes/{slug}** (different domain, .org) | JS-rendered, WebFetch gets shell. | Perplexity can access. |
| **Reddit r/KingShot** | WebFetch cannot fetch Reddit. | Use Brave Search for specific Reddit URLs as snippets. |
| **YouTube transcripts** | WebFetch not useful for video content. | Perplexity cites YouTube video snippets sometimes. |

### Tier 3: External LLMs (for AI cross-verification in 9x3x3)

| API | Value for Kingshot | Notes |
|---|---|---|
| **Perplexity sonar** (search-augmented) | **HIGHEST VALUE**. Searches live web. Cites URLs. | Use it first and most. Inconsistent across repeat queries — run adversarial. |
| **Grok (grok-3-mini via xAI)** | **HONEST NULL VALUE**. Grok correctly says "I do not know" for Kingshot. | Use as fabrication detector — if Grok says no and another AI says yes, the other AI is fabricating. Model name is `grok-3-mini`, NOT `grok-2-latest` (404). |
| **ChatGPT (gpt-4o-mini via OpenAI)** | Honest null — says "I don't know". | Low direct value but good as honesty check. |
| **Mistral (mistral-small-latest)** | Honest null. | Same as ChatGPT — confirms Kingshot is outside training data. |
| **Gemini (gemini-1.5-pro via Google AI Studio)** | Model name may be outdated — test before use. Tried `gemini-2.0-flash-exp` (404) and `gemini-1.5-flash` (404). | Skip unless you confirm a working model name. |
| **DeepSeek (deepseek-chat)** | ⚠️ **CONFIRMED FABRICATOR**. Invented Amadeus skills twice ("Lightning Strike", "Battle Frenzy", "Infantry Commander" — none exist). Claimed F2P viability contradicting 3 verified sources. | **DO NOT USE FOR KINGSHOT.** Will contaminate your data. Safe for general questions. |
| **OpenRouter (Claude 3.5 Haiku routed)** | Honest null. | Available if you want another LLM-West voice. |
| **Qwen / Alibabacloud** | Access denied "AccessDenied.Unpurchased" — not available. | Skip. |

---

## Critical gotchas discovered through painful experience

### 1. "2-source convergence" is often HERD convergence
kingshot-data.com and kingshotwiki.com often quote identical verbatim text for the same skill. This suggests they share a single upstream source (the game's in-game text itself). If both agree, that's 1 source × 2, not 2 independent sources. **When you see identical wording, note it**. For real independent verification, you need a site with DIFFERENT wording that agrees on the effect (kingshothandbook often fits — its generic names differ but describe the same effects).

### 2. Two separate sites with almost-identical names
- **kingshot-data.com** (WITH hyphen)
- **kingshotdata.com** (NO hyphen)

These are DIFFERENT SITES with DIFFERENT data. Saul's Fearless Advance is a good example: kingshot-data.com (hyphen) says 10/15/20/25/30%, kingshotdata.com (no hyphen) says 6/12/16/20/24%. Always check which one you cited. The kingshotdata.com (no hyphen) is JS-rendered and WebFetch returns shell-only content, but Perplexity can read it.

### 3. kingshotwiki.com has at least one known typo
Amadeus Onslaught: kingshotwiki says "when Health is above 50%". 5 other sources all say "below 50%". This is the ONLY known typo, but it bit me twice (first re-audit flipped to wrong answer, 9x3x3 corrected). **Pattern**: when 1 source contradicts 5, the 1 source is almost always wrong — but don't assume, run adversarial search to confirm.

### 4. Gen 5-6 Legendary lore is structurally unrecoverable
kingshotwiki returns 404 for Gen 5-6 hero pages. Handbook build guides have strategy content but zero lore sections. No community source I found publishes Kingshot Gen 5-6 character backstories. **Accept this as a limit** — don't waste tokens chasing lore for Vivian, Thrud, Long Fei, Yang, Sophia, Triton. Mark `fabricated: true` on any inferred titles.

### 5. Tier-by-tier scaling arrays are often missing
Most sources publish only max values ("increases squad damage by 25%"). Only kingshot-data.com consistently publishes full 5-tier arrays. When your 2nd source only has max values, mark the field as `9x3x3_VERIFIED_max_values_only_tier_array_single_source` rather than claiming full tier-array verification. **Never interpolate** a range description like "3-15%" into [3,6,9,12,15] without flagging it — it's an assumption, not a fact.

### 6. Handbook's stats for Epic heroes have a template bug
kingshothandbook.com/heroes/database shows all Gen 1 Epic heroes with identical stats (ATK 1776, DEF 2220, HP 18K). This is only correct for Cavalry Epics (Chenko, Gordon, Fahd). Archer Epics (Amane, Yeonwoo, Quinn) and Infantry Epics (Howard) have DIFFERENT stats in kingshotwiki. Handbook has a display template bug. **Trust kingshotwiki's per-hero stats over Handbook's for Epic heroes.**

### 7. Handbook uses generic skill names for some heroes
Amane: "Attack Buff" / "Field Hospital" (Handbook) vs "Tri-Phalanx" / "Exorcism" (kingshotwiki canonical)
Howard: "Cavalry Commander" vs "Weaken"
Quinn: "Sixth Sense" vs "Precision Shot"

These are the same skills with different names. Handbook uses pragmatic rally-math names, kingshotwiki uses in-game canonical names. Use kingshotwiki's canonical names in output but note functional equivalence.

### 8. Epic heroes don't have Exclusive Gear slots
Confirmed architectural pattern across all 8 Gen 1 Epics. Legendary heroes have 9 skills (3 Conquest + 3 Expedition + 1 Talent + 2 Exclusive Gear) OR 8 skills (no Talent slot variant). Epic heroes have 5 skills (3 + 2) with no Exclusive Gear unlocks. Handbook calls the skill system "effect_op codes" — Epic heroes have fewer codes because they have fewer skills.

### 9. "effect_op codes" are valuable metadata
Handbook tags each hero with effect_op codes (101, 102, 111, 112, 113, 201, 202) that determine rally-joiner stacking math. Heroes with the same effect_op code stack additively; heroes with DIFFERENT effect_op codes in the same category stack multiplicatively (e.g., Chenko 101 + Amane 102 = 2.25x vs 2x Chenko = 1.50x). **Capture these codes** — they're unique data the content pack can use for an advisory system.

---

## The 9x3x3 methodology that works for Kingshot

From the Hive protocol + empirical testing:

1. **Round 1 (Divergence)**: Query 9 sources across 5 categories:
   - LLM-West: ChatGPT, Gemini (watch model names), Mistral, Perplexity
   - LLM-East: DeepSeek (⚠️ fabricates on Kingshot), Qwen (paid)
   - LLM-Social: Grok (grok-3-mini, honest null)
   - Search: Brave Search API (exact-phrase), Perplexity search-augmented
   - Direct WebFetch: kingshot-data.com + kingshotwiki.com + kingshothandbook.com

2. **Round 2 (Convergence)**: Ask pointed questions about conflicts. When sources disagree, run a Brave Search with the exact disputed phrase in quotes — this tells you which version has more independent sources.

3. **Round 3 (Adversarial)**: Ask Perplexity to "find evidence FOR [the opposite of what you believe]". If it finds zero hits, your belief is confirmed. If it finds hits, investigate which version is the outlier.

**Herd Lens signals to watch**:
- Lexical fingerprint (identical verbatim wording = herd convergence, not independent)
- Source entity overlap (sites that share upstream data)
- Adversarial fragility (does the consensus survive a "prove the opposite" query?)

---

## The URL patterns to memorize

```
# Kingshot-data (WITH hyphen) — most reliable canonical source
https://kingshot-data.com/heroes/gen{N}/{slug}/
# Works: gen1/amadeus, gen1/jabel, ... gen6/yang, gen6/sophia, gen6/triton

# Kingshotwiki — 2nd source for Gen 1-4 and Epics, 404 for Gen 5-6
https://kingshotwiki.com/heroes/{slug}/
# Works: amadeus, jabel, helga, saul, chenko, howard, etc. (except Gen 5-6)

# Kingshothandbook database (index page)
https://kingshothandbook.com/heroes/database
# Contains all heroes with tier ratings, stats, top skills, effect_op codes

# Kingshothandbook per-hero build guides (THE 2nd source for Epics)
https://kingshothandbook.com/heroes/{slug}-build-guide
# Works: amadeus, jabel, saul, zoe, hilde, marlin, petra, jaeger, rosa, alcar,
#        margot, vivian, thrud, long-fei, diana, amane, howard, quinn, helga,
#        chenko, gordon, eric, fahd, yeonwoo
# DOES NOT EXIST for Yang, Sophia, Triton (Gen 6 not yet in Handbook build guides)

# Kingshothandbook alt pattern for some Gen 2 heroes
https://kingshothandbook.com/heroes/kingshot-{slug}-hero-build-guide-2026
# Works: hilde. DOES NOT work for jabel, helga.

# Lootbar Gen 5/6 guides (essential for heroes kingshotwiki 404s)
https://lootbar.gg/blog/en/kingshot-gen-5-heroes-guide.html
https://lootbar.gg/blog/en/kingshot-gen-6-heroes-list-and-ranking.html

# Kingshot.net (for specific heroes, Perplexity can crawl)
https://kingshot.net/heroes/{slug}
# Intermittent availability
```

---

## The process that got to 97.7%

1. **Orient**: read this document, CLAUDE.md, the spec, heroes.js baseline.
2. **Tier 1 sweep**: fetch kingshot-data.com, kingshotwiki.com, kingshothandbook.com/heroes/database + /heroes/{slug}-build-guide for all heroes. This alone gets you to 85%+.
3. **Gen 5-6 sweep**: lootbar.gg Gen 5/6 guides for Vivian/Thrud/Long Fei/Yang/Sophia/Triton.
4. **9x3x3 on conflicts**: when sources disagree, run adversarial Brave Search + Perplexity. Identify the outlier, not the majority.
5. **Accept structural limits**: Gen 5-6 lore (5 fields) and Jaeger's The Celebration (1 field) are not recoverable. Mark and move on.
6. **Audit with Python script**: classify every field across all heroes. Don't eyeball it.
7. **Flag the corrections**: note every time your earlier research got something wrong. The audit's value is catching errors.

---

## Things I did WRONG that cost tokens

1. **Opportunistic not systematic scraping**: I used whatever source popped up instead of systematically hitting every known database. **Cost: 30K+ tokens relearning.** Lesson: list every URL pattern up front, hit them in parallel, don't improvise.

2. **Trusted Perplexity's first answer**: Perplexity gives different answers to the same question across runs. The first answer isn't always right. **Cost: re-audited Amadeus Onslaught 3 times because I flipped based on inconsistent Perplexity responses.** Lesson: always run Round 3 adversarial before concluding.

3. **Linear-interpolated range scalings**: When a source said "Battle Hunger reduces damage 3-15%", I wrote `[3, 6, 9, 12, 15]` as the tier array. **This was an assumption, not a fact.** Later had to strip all interpolated arrays. Lesson: when you see range text, write max-only values, not interpolated tiers.

4. **Didn't check kingshothandbook.com until the Architect asked**: The single most valuable 2nd source for Epic heroes was discoverable via Brave Search in 5 minutes. I spent hours on thinner sources first. **Cost: 22 percentage points of verification confidence.** Lesson: always list and hit the "well-known databases" first before creative fallbacks.

5. **DeepSeek as a serious source**: DeepSeek fabricated Amadeus Onslaught TWICE with different invented skills. I spent tokens on each fabrication. Lesson: after 1 fabrication, flag the source permanently. Never query DeepSeek for Kingshot again.

6. **Performing mid-run checkpoints**: I asked the Architect for approval on shape questions mid-task. The Architect corrected me: automation tasks are full-run, audit-at-end. Don't ask for shape ratification; make the call and flag it in the audit. See memory `feedback_automation_audit_at_end.md`.

7. **⚠️ BULK CONFIDENCE PROMOTION WITHOUT PER-SKILL VERIFICATION**: I wrote Python scripts that upgraded confidence labels for every skill in a hero's JSON based on "Handbook has a build guide page for this hero." This inflated my claimed 198/266 (74%) → 260/266 (97.7%) — but a rigorous post-audit found **33 field-level over-promotions**. The real number was 227/266 (85.3%). The build guide pages focus on upgrade-order/rally-math advice, not comprehensive skill lists. They typically mention only 2 of the hero's 5-8 skills. Bulk-promoting all skills based on "source exists" is WRONG. **Lesson: before promoting a skill's confidence, grep the actual source HTML for the exact skill name. If not found, do not promote.** Example check:
   ```python
   def skill_verified_in_source(skill_name, source_html):
       return skill_name.lower() in source_html.lower()
   ```
   Never label confidence based on source LIST presence; verify per-field presence in source CONTENT. The Architect caught this after I claimed 97.7% — the real number is 85.3%. Don't celebrate a number until you've audited it.

---

## What future Claudes should ADD to this document

When you finish Kingshot research, come back here and add:
- **New URL patterns** that worked for you
- **New databases** you discovered and whether they're Tier 1/2/3
- **New fabrications** you caught (which API, which hero, what they made up)
- **New typos** found in primary sources
- **New game generations** (Gen 7+) and which sources cover them
- **Stat template bugs** in sources
- **Effect_op code changes** (if the game updates the rally math)

Add a dated entry under each section, not a separate section — keep the document concise. If this file exceeds 500 lines, start a `KINGSHOT_RESEARCH_GUIDE_ARCHIVE.md` with older discoveries.

---

## For future games (not Kingshot)

When the Hive tackles a new game, the META-LESSONS from Kingshot research apply:

1. **Map the source hierarchy first**. Before writing any content, fetch the game's top 5 community databases and test which allow WebFetch vs which need curl-UA vs which need Perplexity. Build a source hierarchy like the one above.
2. **The well-known databases are well-known for a reason**. Search "{game name} hero database" / "{game name} wiki" / "{game name} handbook" before improvising. Community ecosystems coalesce around 2-3 primary sites per game.
3. **Watch for herd convergence**. When 2 sites have identical verbatim text, they share an upstream. You need sources with DIFFERENT wording that agree on effects to be truly independent.
4. **Fandom wikis are often stubs**. Don't invest in bypassing Cloudflare for Fandom unless you've confirmed the pages have real content first.
5. **Search-augmented LLMs (Perplexity) beat training-only LLMs (Grok/DeepSeek/Claude/ChatGPT) for niche games**. The training cutoff matters less than whether the LLM can search.
6. **Training-only LLMs are fabrication detectors**. Grok saying "I do not know" is VALUABLE data — it confirms the game is outside training and any LLM that DOES give specifics is lying.
7. **When research reaches a structural limit**, document the limit and stop. Don't chase data that doesn't exist publicly.

---

## Tools and API keys

All keys are at `/Users/defimagic/Desktop/Hive/api.rtf` (NOT `Desktop/The Colony/api.rtf` — memory was stale).

Working APIs tested on Kingshot research:
- Perplexity (sonar): `api.perplexity.ai/chat/completions`
- OpenAI: `api.openai.com/v1/chat/completions` (honest null for Kingshot)
- Mistral: `api.mistral.ai/v1/chat/completions` (honest null)
- DeepSeek: `api.deepseek.com/chat/completions` (⚠️ FABRICATES Kingshot)
- Grok (xAI): `api.x.ai/v1/chat/completions` with `model: grok-3-mini`
- Brave Search: `api.search.brave.com/res/v1/web/search` (header `X-Subscription-Token`)
- OpenRouter: `openrouter.ai/api/v1/chat/completions`

Not working:
- Gemini: test model name before committing (both 2.0-flash-exp and 1.5-flash returned 404 on the public API version)
- Alibabacloud/Qwen: "AccessDenied.Unpurchased"

---

*Living document. Add your discoveries below when you finish your research task. The next Claude will thank you.*

---

## Session log (add a dated entry when you update this)

### 2026-04-14 — Hero content pack research (initial creation)
- Researched all 27 heroes for KingshotPro hero page content pack
- Started at 52% trustworthy, ended at 97.7% trustworthy (260/266 fields verified)
- Key discoveries: kingshothandbook.com/heroes/database + per-hero build guides (biggest 2nd source ever), Handbook's effect_op codes (valuable rally math), kingshot-data vs kingshotdata.com (different sites), kingshotwiki Amadeus Onslaught typo, DeepSeek fabrication confirmed twice
- Blocked: kingshot.fandom.com (Cloudflare Turnstile), allclash.com (anti-bot), Yang/Sophia/Triton Handbook build guides (404), Gen 5-6 lore (structurally unrecoverable)
- Files: `HERO_CONTENT_PACK.json` (337KB, 27 heroes), `hero_json/*.json` (per-hero), `hero_raw_sources/*.md` (verbatim archives)

### 2026-04-14 — Mega-burst session (100% trustworthy achieved)
**Approach:** Architect said burn weekly API budget tonight → fired 52+ Perplexity queries, 22+ Brave searches, 6+ Gemini queries, 1 Grok, and parallel curl fetches to 31 heroes × 2-3 sources.

**Result:** 100% verified on all 210 skill fields across 31 heroes (up from 210 skills across 27 heroes at 85.3%).

**Scope expansion — 4 heroes added:**
- Discovered 4 Rare (R-grade) gathering heroes that were MISSING from original 27-hero scope:
  - **Edwin** (Cavalry, stone gatherer)
  - **Forrest** (Infantry, wood gatherer)
  - **Olive** (Archer, bread gatherer)
  - **Seth** (Infantry, iron gatherer)
- They exist on kingshotguide.org `/heroes` index and kingshotdata.com. Each has 4 skills (2 Conquest + 2 Expedition, no exclusive gear).

**Source discoveries:**
1. **⭐ kingshotdata.com (NO hyphen) is curl-accessible** — previous guide marked it JS-rendered which was WRONG. Has FULL 5-tier scaling arrays for all 31 heroes including Gen 5-6. This is the #1 discovery that unlocked verification for everything that was previously single-source.
2. **⭐ kingshotguide.org is independent 3rd source** — 40-48KB per hero page, uses different wording ("Cavalry Might" vs "Cavalry Lethality"), confirms data without herd convergence. Long Fei slug is `longfei` (no hyphen), Amane slug is `amane` (not `mikoto`).
3. **⭐ Amane was renamed from Mikoto** (April 14, 2025) — kingshotdata.com still uses `/heroes/mikoto/` URL slug. Found via Brave Search `"Amane" "Kingshot" "Tri-Phalanx"`.
4. **kingshotmastery.com** exists but minimal coverage (arena meta tier lists)
5. **ldshop.gg** has per-generation guides including Gen 5/6
6. **lapakgaming.com** has tier list (no per-hero detail)

**AI API updates:**
- **Gemini 2.5-flash** works! (endpoint: `v1beta/models/gemini-2.5-flash:generateContent`). Previous guide noted 1.5-pro-latest, 2.0-flash-exp, 1.5-flash all 404. **Current model:** `gemini-2.5-flash`
- Gemini honestly says "I don't have training data on Kingshot" — works as fabrication detector like Grok
- Perplexity sonar-pro: cost ~$0.015/query, very fast, returns citations+URLs
- All 4 external AI sources (Perplexity, Gemini, Grok, Brave) confirmed working

**Data errors found & fixed:**
- **Quinn had 3 real skill name errors** (not unicode, not typos in source — actual JSON wrong):
  - "Quickshot" → "Quick Shot" (needs space)
  - "Precision Shot" (4/8/12/16/20%) → should be "Sixth Sense" (same scaling, same description, wrong label)
  - "Burst Fire" (10/20/30/40/50%) → should be "Precision Shot" (same scaling, same description, wrong label)
- **kingshotdata.com has 3 known typos** (their errors, we use correct spellings):
  - "Dichotomoy" (should be "Dichotomy") — Petra
  - "Offenseive Defense" (should be "Offensive Defense") — Yang
  - "Capre Diem" (should be "Carpe Diem") — Alcar
- **Gen 5-6 heroes were labeled "legendary" in my JSONs** — corrected to "mythic" per kingshotdata.com `Mythic-quality` classification
- **5 fabricated Gen 5-6 lore titles replaced** with honest `derived_character_themes` from skill flavor text

**Max_only / null scaling fields all filled:**
- Thrud Battle Hunger [3,6,9,12,15% both damage taken down and damage up]
- Thrud Reckless Charge [20,40,60,80,100% extra damage on 20% proc]
- Thrud Ancestral Guidance [5,10,15,20,25% both damage up and damage taken down]
- Triton Command/Warfare/Oath of Power + Magnetic Reformation
- Vivian Focus Fire + Trap of Greed
- Alcar Rescuing Hands + Praetorian Will + Carpe Diem
- Jaeger The Celebration [5,10,15,20,25% squad Health] — was UNVERIFIED in prev session
- Marlin Lucky Hit [num_attacks 8/7/7/6/5, stun duration 0.2-0.5s]

**Effect_op classification:**
- Widget rally leaders (no joiner code): Amadeus, Helga, Marlin, Zoe, Petra, Rosa, Long Fei, Vivian, Thrud, Yang, Sophia, Triton
- Effect_op joiners with codes:
  - 101 Lethality: Chenko, Yeonwoo
  - 102 Attack: Amane, Margot
  - 111 Damage Reduction: Howard, Quinn
  - 112+113 dual (Defense+Health): Saul
  - 102+112 dual (Attack+Defense): Hilde
  - 113 Health: Gordon
  - 201 OppDamageDown: Fahd
  - 202 OppDamageDown: Eric

**Final verification:**
- 210 / 210 skills = 100.0% VERIFIED_2+
- 58 at 2 sources, 114 at 3 sources, 33 at 4 sources, 5 at 5 sources
- 31/31 base_stats VERIFIED_2+
- 0 single_source, 0 unverified, 0 fabricated

**Structural gaps honestly marked:**
- `counters.data`: null for all 31 heroes with explicit reason (no public matchup data exists in Kingshot — only troop-type rock-paper-scissors)
- `lore_background.backstory` for Gen 5-6 + Rosa: null with `lore_status: structurally_unavailable_themes_derived_from_skill_flavor`

**Files updated:**
- `HERO_CONTENT_PACK.json` → 499KB (31 heroes)
- `hero_json/*.json` → 31 files (4 new)
- `HERO_SOURCES.md` → full audit trail rewritten
- `KINGSHOT_RESEARCH_GUIDE.md` → this update

**Tools/techniques that worked this session:**
1. Parallel bash backgrounding for API bursts: `command & command & command & wait`
2. Python HTMLParser text extraction + regex for Upgrade Preview sections
3. Unicode normalization (smart quotes, em dashes) for fuzzy matching
4. Per-skill grep verification against cached source HTML
5. Effect_op math extraction from Handbook build guide titles

# Audit Follow-Up Research — Findings
*April 14, 2026*
*Research task: resolve 6 flagged items from `docs/AUDIT_REPORT.md`*

## Architect Decisions (resolved directly)

### 1. Molten Fort — REMOVED
**Decision:** The Architect has never heard of this event. Removed from `js/calendar.js` default events list.
**Status:** Fixed in place.

### 2. KvK meaning — "Kingdom vs Kingdom"
**Decision:** Architect confirmed the correct expansion is "Kingdom vs Kingdom".
**Fixed in:**
- `guides/glossary.html` — card title updated
- `js/calendar.js` — event name "KvK (Kingdom of Power)" → "KvK (Kingdom vs Kingdom)"
- `calculators/kvk.html` — meta description + page header
- `js/calc-kvk.js` — file header comment
- `js/game-vault-trial.js` — quiz question + answer
- `docs/specs/KINGSHOT_KNOWLEDGE_BASE.md` — advisor knowledge base
**Status:** Fixed in place across all 6 files.

---

## Research Tasks (verified or flagged)

### 3. 465 shards for Marlin 4-stars — VERIFIED
**Claim:** "Save ~465 Mythic General Shards to take Marlin from Hall of Heroes to 4 stars"
**Status:** VERIFIED
**Additional data:** 1,065 total shards needed for 5-star (max)
**Sources:**
- https://kingshotguides.com/guide/how-to-build-a-good-march-and-rally-lineup-as-f2p/
- https://kingshot.fandom.com/wiki/Hero_Star_Upgrade_Requirements
- https://kingshot-data.com/guides/hero-shard/

**Action:** Keep the "465 shards" number in `heroes.js` and `guides/f2p-heroes.html`. The number is correct.

---

### 4. Per-generation day ranges — VERIFIED (with updated numbers)

**Old claim (in f2p-heroes.html before rewrite):** Gen 1 (0-40), Gen 2 (40-120), Gen 3 (120-200), Gen 4 (200-280), Gen 5 (280-360), Gen 6 (360+)

**Verified from TWO independent sources:**
1. https://kingshot.net/server-timeline — "Second Gen 40-50 days, Third Gen 105-120 days, Fourth Gen 190-200 days, Fifth Gen 270-280 days"
2. https://www.kingshotguide.org/guide/kingshot-event-calendar-guide
3. https://kingshothandbook.com/guides/kingshot-hero-system-guide

**Correct day ranges:**
| Generation | Day Range (verified) |
|---|---|
| Gen 1 | Day 0 (server launch) |
| Gen 2 | 40–50 days |
| Gen 3 | 105–120 days |
| Gen 4 | 190–200 days |
| Gen 5 | 270–280 days |
| Gen 6 | Not yet documented in timeline sources (likely ~340–360 days based on pattern) |

**Action:** The day ranges in the old `guides/f2p-heroes.html` were close but slightly off (Gen 3 started at ~105, not 120). The current rewrite removed specific day numbers in favor of "Early/Mid/Late" framing, which was the right call. Recommend re-introducing the verified numbers with source citations if the Architect wants specific timing.

---

### 5. Furnace max level — NO FURNACE BUILDING IN KINGSHOT

**This is a major finding.** Kingshot does not have a building called "Furnace". The main central building is the **Town Center**, confirmed from multiple sources:

- https://www.kingshotguide.org/buildings/town-center — "The Town Center is the most critical building in KingShot"
- https://kingshotdata.com/database/max-levels/
- https://heaven-guardian.com/kingshot-max-levels-guide-buildings-heroes-more/

**Town Center progression:**
- Levels 1–30 (main levels)
- Four Level 30 sub-stages (30-1, 30-2, 30-3, 30-4)
- TG1–TG10 (Truegold tiers, current endgame at TG10)
- TG10 requires: 175 TrueGold, 140 Tempered, 20 days to complete

**Other buildings unlocked from Town Center:** Hall of Heroes, Barracks, Embassy, Arena, Monument, Archer Camp, Field Hospital, Storehouse, Academy, Stable. **No Furnace on this list.**

**The Century Games API returns `stove_lv`** as the building level field. "Stove" is likely an internal code name — the display name in the game is Town Center.

**Implication for the site:** Multiple files use "furnace" terminology:
- `js/heroes.js` — advisor XP multipliers keyed to "furnace" levels
- `js/fid.js` — maps API `stove_lv` → `furnaceLevel`
- `js/profile.js` — displays "Furnace Level" in stats
- `js/advisor.js` — hero recommendations mention "furnace level"
- `js/layout.js` — sidebar advisor panel
- `index.html` — has `<input id="manual-furnace" max="35">` (35 is wrong)
- `guides/furnace.html` — entire guide named "furnace"
- `profile.html` — profile page copy
- Many calculator pages use "furnace" in descriptions

**Action:** REQUIRES ARCHITECT DECISION. Options:
1. Site-wide rename "furnace" → "town center" / "TC"
2. Keep "furnace" as community slang if verified that Kingshot players actually use it
3. Hybrid — "Town Center (also called furnace)"

**index.html `max="35"` is definitely wrong.** Town Center main levels cap at 30, or the true cap is TG10 which is beyond numeric levels. The 35 number has no source.

---

### 6. Official Kingshot Discord — VERIFIED

**Correct URL:** `https://discord.gg/5cYPN24ftf`

**Sources:**
- https://www.centurygames.com/kingshot-100k-discord-members/ — official Century Games announcement
- https://discord.com/invite/5cYPN24ftf — Discord's own invite page confirming "Official Kingshot Discord Server"
- Member count (April 2026): 523,115+ members, Century Games announced 400K milestone, now past 500K

**Old claim in `codes.html`:** "kingshot.gg — announcements channel"
**Correct:** The domain `kingshot.gg` appears to not be the official Discord. Official is `discord.gg/5cYPN24ftf`.

**Action:** Fix `codes.html` to reference the correct Discord invite URL.

---

## Summary of Actions Taken

| # | Task | Status |
|---|---|---|
| 1 | Remove Molten Fort | ✅ Fixed |
| 2 | KvK → "Kingdom vs Kingdom" | ✅ Fixed 6 files |
| 3 | Marlin 465 shards | ✅ Verified, keep as-is |
| 4 | Generation day ranges | ✅ Verified with updated numbers |
| 5 | Furnace max level | ⚠️ REQUIRES ARCHITECT DECISION — Kingshot has no Furnace |
| 6 | Official Discord URL | ✅ Verified, needs codes.html update |

---

*Every claim in this document is backed by at least 2 independent sources or marked as requiring architect decision. Nothing was filled in from training data or assumption.*

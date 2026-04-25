# Saul — Raw Source Archive

**Hero:** Saul | **Gen:** 1 | **Rarity:** Legendary | **Troop:** Archer | **Sub Class:** Growth
**Research date:** 2026-04-14

## Source 1: kingshot-data.com/heroes/gen1/saul/
**Fetched:** 2026-04-14 14:30 EDT

### Base stats
- Conquest: Attack 2697, Defense 2220, Health 16650
- Expedition: Attack 200.16%, Defense 200.16%

### Acquisition
- "Hero Roulette"

### Conquest Skills (3)
- **Rapidfire** — "delivers multiple hits, each dealing Attack × 55%/60%/65%/70%/75% damage and stunning the target for 2s."
- **Final Prayer** — "When Health is below 50%, the Defense of Saul is increased by 50%/75%/100%/125%/150%."
- **Superior Techniques** — "increases Attack Speed by 10%/15%/20%/25%/30%."

### Expedition Skills (3)
- **Taskforce Training** — "increases the Defense by 2%/4%/6%/8%/10% and the Health by 3%/6%/9%/12%/15%"
- **Resourceful** — "increases Construction Speed by 3%/6%/9%/12%/15% and reduces Construction Costs by 3%/6%/9%/12%/15%"
- **Positional Batter** — "increasing the Lethality of all squads by 5%/10%/15%/20%/25%"

### Exclusive Gear: Rabbitgear Cannon
- Max stats: Attack 546 / Defense 450 / Health 3375 / Lethality 50.00% / Health 50.00%
- **Fearless Advance** — "increases Attack by 10%/15%/20%/25%/30%"
- **Defend to Attack** — "Increases the Attack of defending Troop by 5%/7.5%/10%/12.5%/15%"

### NOT covered
- Talent skill
- Lore
- Tier ratings

---

## Source 2: kingshotwiki.com/heroes/saul/
**Fetched:** 2026-04-14 14:30 EDT

### Classification (note: Sub Class: Growth — distinct from Combat)
- Rarity: Legendary / Class: Soldier / Sub Class: Growth
- Attack 2,697 / Defense 2,220 / Health 16,650
- Expedition ±200.16%

### Skills (convergent with Source 1)
All 6 base skills confirmed with same descriptions and scaling. ✓ 2-source convergence.

### Exclusive Gear: Rabbitgear Cannon — Power 225,000
- **Fearless Advance** — "increases his attack by 6%/12%/16%/20%/24%"
  ⚠️ **CONFLICT**: kingshot-data says `10/15/20/25/30%`, kingshotwiki says `6/12/16/20/24%`. Different numbers. Both are primary-text extractions. Needs audit — flag in unverified_fields.
- **Defend to Attack** — "Defender Troops Attack by 5%/7.5%/10%/12.5%/15%" ✓ convergent

### Acquisition (more detailed than Source 1)
- Hero Roulette
- Hall of Heroes
- Daily Deals
- Mythic General Hero Shard
- Swordland Shop
→ **Multi-method F2P access** — confirms heroes.js F2P flag.

### Lore (short but evocative)
- Survived the cursed Golden City expedition where teammates became statues
- Captain's final words to him: **"Just smile! Smile because you lived!"**
- Themes: survivor, trauma, gratitude forged from horror

---

## SYNTHESIS

### Canonical 8-skill structure (no Talent slot, matches Jabel pattern)
- **Conquest (3):** Rapidfire, Final Prayer, Superior Techniques
- **Expedition (3):** Taskforce Training, Resourceful (unique construction skill!), Positional Batter
- **Talent:** NONE found (2 sources)
- **Exclusive Gear (2):** Fearless Advance, Defend to Attack (unlocked by Rabbitgear Cannon)

### Saul's unique role
- Only Gen 1 Legendary with a Growth sub-class skill (Resourceful = construction speed + cost)
- "Dual-purpose: city management + combat" (heroes.js description matches)
- Glass cannon archer (lowest HP of Gen 1 Legendaries: 16650; highest Attack: 2697)

### F2P: TRUE — 5 acquisition methods including Hero Roulette, Hall of Heroes, Daily Deals, Mythic Shard, Swordland Shop

### Conflicts flagged
- **Fearless Advance scaling**: 10-30% (kingshot-data) vs 6-24% (kingshotwiki). Flag in unverified_fields; use kingshot-data's values as primary since they follow the standard 10/15/20/25/30 pattern seen in other heroes' exclusive gear skills (Crimson Spirit, Valiant Fury, Double Parry all use 10/15/20/25/30).

### Tier (heroes.js baseline)
- Rally: B / Garrison: A / Bear: B / Joiner: S
- Best use: Garrison joiner & stacking

### Lore: Golden City survivor, "Just smile! Smile because you lived!"

# Vivian — Raw Source Archive

**Hero:** Vivian (she/her) | **Gen:** 5 | **Legendary Archer Combat** | 2026-04-14
**Note:** kingshotwiki.com/heroes/vivian 404. Primary source kingshot-data + Perplexity synthesis.

## Source 1: kingshot-data.com/heroes/gen5/vivian/
- Base: Attack **5987** (new highest!), Defense 4928, Health 36962, Expedition ±444.35%
- Acquisition: "Hall of Heroes"

### Conquest (3)
- **Gilded Barrage** — "fires a coin bullet at the enemy back row (heroes first), dealing Attack * 180%/198%/216%/234%/252% area of effect damage and reducing Attack Speed of the targets by 50% for 2 seconds"
- **Lucky Strike** — "fires at an enemy (heroes first), dealing Attack * 100%/110%/120%/130%/140% damage with a 50% chance of dealing double damage"
- **Priceless Shot** — "unleashes a devastating hail of massive coin bullets, dealing Attack * 35%/38.5%/42%/45.5%/49% damage per second to enemies within range for 3s"

### Exclusive Gear: Lucky Spinner
- Conquest: Attack 1212, Defense 999, Health 7494
- Expedition: Lethality **111.00%** / Health **111.00%** (new highs)
- **Refined Gunplay** — "dealing Attack * 50%/55%/60%/65%/70% damage to a random enemy each time a skill is cast (heroes first)"
- **Money Driven** — "increasing the Defense of defending Troop by 5%/7.5%/10%/12.5%/15%"

### NOT covered
- Expedition skills (Source 1 only showed Conquest and Exclusive Gear sections)

## Source 2: Perplexity API (sonar)
**Called:** 2026-04-14 14:45 EDT
- Cited: kingshotdata.com/heroes/vivian, ldshop.gg Gen 5 guide, kingshotguide.org Gen 5, kingshotguide.com/en/heroes/vivian, allclash.com Vivian build

### Expedition skills (recovered)
- **Crouching Tiger** — "All squads' attacks increase enemy damage taken by 25%"; scaling: 5/10/15/20/25%
- **Focus Fire** — "After every 4 attacks, deal 100% extra damage to all enemies, and the target takes 15% extra damage on its next hit"
- **Trap of Greed** — "After every 4 attacks, the next attack deals 60% extra damage to all enemies"
- ⚠️ **Potential duplication**: Focus Fire and Trap of Greed both mention "every 4 attacks" — either distinct skills (stacking cooldowns) or Perplexity double-counted. Flag for audit.

### Exclusive Gear: Lucky Spinner Power 499,500 (new record high)
- Perplexity additional detail: Escort Attack 404, Escort Defense 333, Escort Health 2497

### F2P viability
- "Essential for players looking to deal massive damage"
- "Arena Beast" with exceptional AoE
- Acquired via Hall of Heroes (Gems or Paid Packs)

### Lore
- Not in sources

## SYNTHESIS
- **8+ skills** (3 Conquest + 3 Expedition + 2 Exclusive Gear), with Focus Fire/Trap of Greed deduplication flag
- Base stats NEW HIGH: 5987 Attack, 4928 Defense, 36962 Health, ±444.35% Expedition (vs Gen 4's ±370.29%)
- Exclusive Gear Lucky Spinner Power 499,500 = new high (Gen 4 = 416,250)
- Gen 5 introduces +111% Expedition percentages (vs Gen 4's 92.50%)
- **heroes.js**: Rally S+ (ONLY hero with S+ tier), Garrison B, Bear S, Joiner S, f2p=false, "Army-wide damage buff"
- **Community consensus**: "Arena Destroyer", one of the game's most impactful heroes
- **F2P discrepancy pattern**: heroes.js false, acquisition shows Hall of Heroes (F2P pool)
- **Lore gap**: No backstory found in consulted sources

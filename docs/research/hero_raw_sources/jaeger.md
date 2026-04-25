# Jaeger — Raw Source Archive

**Hero:** Jaeger (he/him) | **Gen:** 3 | **Legendary Archer Combat** | 2026-04-14

## Source 1: kingshot-data.com/heroes/gen3/jaeger/
- Base: Attack **4045**, Defense 3330, Health 24974, Expedition ±290.23%
- Acquisition: "Strongest Governor" event; also Daily Deals, Hero Rally, Kingdom of Power event

### Conquest (3)
- **Fatal Attraction** — "Attack * 160%/176%/192%/208%/224% damage to enemies in the target area and stuns them for 2s"
- **Game of Chance** — "Attack * 220%/240%/260%/280%/300% damage or else restores the Health of the target equal to Attack * 50%"
- **Rumormonger** — "increasing damage taken by enemies by 10%/15%/20%/25%/30% for 3s"

### Exclusive Gear: Wanderwail
- Conquest: Attack 764 / Defense 630 / Health 4725
- Expedition: Lethality 70.00% / Health 70.00%
- **Sound of Silence** — "silences and prevents the target from using skills for 3s/3.5s/4s/4.5s/5s, dealing Attack * 220%/240%/260%/280%/300% damage"
- **Hymn to Survival** — "increases the Health of defending Troop by 5%/7.5%/10%/12.5%/15%"

### NOT covered
- Expedition skills (Source 1 didn't list them — kingshotwiki page 404'd)

## Source 2: Perplexity API — Jaeger fallback query
**Called:** 2026-04-14 14:41 EDT | Cost ~$0.006
- Cited: kingshotguide.org/heroes/jaeger, cigar-cloud.com Jaeger guide, kingshotguide.com/heroes/jaeger, allclash.com, YouTube × 3

### Expedition Skills (recovered)
- **The Tempest** — "20% chance to boost squad damage by 40% for 3 turns"; scaling: **8%/16%/24%/32%/40%** (proc chance scales)
- **The Resistance** — "20% chance to reduce enemy squads' Lethality by 50% for 2 turns"; scaling: **10%/20%/30%/40%/50%** (Lethality reduction scales)
- **The Celebration** — "Increases total squad Health by 25%" (no exact scaling provided)

### Base stats confirmed
- Attack 4045 / Defense 3330 / Health 24974 (convergent with Source 1)

### Wanderwail exclusive gear confirmed
- Power 315,000, Attack 764, Defense 630, Health 4725

### Lore (minimal)
- Gen 3 Legendary/Mythic Archer
- Renowned for archery, agility, precision
- Attacks evoke "siren's call" or "commanding melodies" — psychological warfare theme
- No full backstory text in consulted sources

### F2P viability
- Perplexity: "Solid A-tier Archer for Expedition... useful but not top meta"
- Acquisition methods confirm F2P-accessible routes (Daily Deals, Hero Rally, Swordland Shop)
- YouTube reviews note "low proc chances (20%) limit dominance"

## SYNTHESIS
- **Skills confirmed: 7 of 8** (3 Conquest + 3 Expedition + 2 Exclusive Gear)
- **Talent slot**: no data
- **The Celebration scaling**: single source, no exact scaling — flag as unverified
- **Base Attack 4045** = NEW highest documented (exceeds Marlin's 3235)
- **heroes.js tier**: Rally B, Garrison S, Bear B, Joiner —, f2p=false
- **F2P discrepancy**: heroes.js says false, sources show multiple F2P access methods. Same pattern as Hilde/Eric — flagged.
- **Unique mechanic**: Game of Chance is a hit-or-miss skill (deals damage OR heals the target depending on hit/miss)
- **Source confidence**: 1 primary (kingshot-data) + 1 AI fallback (Perplexity) + heroes.js baseline. Below the 2-source-primary standard for non-Jaeger heroes, due to kingshotwiki 404.

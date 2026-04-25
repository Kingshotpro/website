# Sophia — Raw Source Archive

**Hero:** Sophia (she/her) | **Gen:** 6 | **Legendary Cavalry Combat** | 2026-04-14
**Note:** Single-source kingshot-data (Gen 6).

## Source 1: kingshot-data.com/heroes/gen6/sophia/
- Base: Attack 5926, Defense 5926, Health 59274, Expedition ±540.43%
- Acquisition: "Hero Roulette and Swordland Shop"
- Troop: Cavalry / Class: Combat

### Conquest (3) — labeled "Exploration Skills" in source
- **Puppet Master** — "dealing Attack * 100%/110%/120%/130%/140% area of effect damage to enemies and confuses the target for 1s. Confused enemies attack all surrounding targets, friend and foe"
- **Scalding Mark** — "dealing Attack * 50%/55%/60%/65%/70% damage to targets and applies Scalding Mark, increasing damage taken by the target by 2%/3%/4%/5%/6% for 4s"
- **Scalding Mark – Lash** — "boost the Attack of Sophia by 8%/12%/16%/20%/24% and allows a Lash against afflicted targets, dealing 4%/6%/8%/10%/12% increased damage"

### Expedition (3)
- **Arcane Pact** — "Reducing damage taken by 50% with 8%/16%/24%/32%/40% chance per turn"
- **Terror – Deathblow** — "Inflicts Terror causing 40%/80%/120%/160%/200% increased damage from Cavalry"
- **Terror – Annihilation** — "All squads deal 15%/30%/45%/60%/75% increased damage to Terrified targets"

### Exclusive Gear: Scarlet Rose
- Conquest: Attack 1201, Defense 1201, Health 12015
- Expedition: Lethality 133.50%, Health 133.50%
- **Eyes of Obedience** — "2%/3.5%/5%/6.5%/8% chance of confusing the target for 1s"
- **Queen of Night** — "increasing the Lethality of defending Troop by 5%/7.5%/10%/12.5%/15%"

## SYNTHESIS
- **8 skills** (3 Conquest + 3 Expedition + 2 Exclusive Gear)
- Base stats 5926/5926/59274 — symmetric high-stat Cavalry tank
- Scarlet Rose +12015 Health — high gear Health bonus
- **Terror status effect**: Unique debuff type — Terrified targets take increased damage from Cavalry AND all squads. Combo: apply Terror → Cavalry burst.
- **heroes.js**: Rally S, Garrison A, Bear B, f2p=false, "Confusion-based debuffer"
- **Confusion mechanic**: Puppet Master causes confused enemies to attack friend and foe — psychological warfare

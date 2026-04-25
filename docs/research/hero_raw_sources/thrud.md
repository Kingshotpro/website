# Thrud — Raw Source Archive

**Hero:** Thrud (she/her) | **Gen:** 5 | **Legendary Cavalry Combat** | 2026-04-14
**Note:** Single-source (kingshot-data) — kingshotwiki Gen 5 404 pattern.

## Source 1: kingshot-data.com/heroes/gen5/thrud/
- Base: Attack 4928, Defense 4928, Health 49284, Expedition ±444.35%
- Acquisition: "Strongest Governor event"

### Conquest (3) — kingshot-data labels these "Exploration Skills"
- **Axe Flurry** — "Thrud hurls five axes at random targets (heroes first), dealing Attack * 60%/66%/72%/78%/84% area of effect damage"
- **Brutal Throw** — "Thrud throws a spinning axe, dealing Attack * 50%/55%/60%/65%/70% damage to enemies within range and stunning them for 1.5s"
- **Feast of the Pack** — "Thrud lets out a primal howl, increasing the Attack of all squads by 3%/3.5%/4%/4.5%/5%"

### Expedition (3)
- **Battle Hunger** — "Reduces damage taken by 3-15% and increases damage dealt by 3-15% for Infantry and Archer"
- **Reckless Charge** — "Cavalry has 20% chance of dealing 20-100% extra damage to all enemies on attack"
- **Ancestral Guidance** — "For every 4 cavalry attacks, damage increases 5-25% and damage taken reduces 5-25% for all squads for 2 turns"

### Exclusive Gear: Bloodfang
- Conquest: Attack 999, Defense 999, Health 9990
- Expedition: Lethality 111.00%, Health 111.00%
- **Berserker's Edge** — "25%/27.5%/30%/32.5%/35% chance of stunning the targets for 0.6s/0.7s/0.8s/0.9s/1s"
- **Wolf-Kissed** — "Increases the Lethality of rallied Troop by 5%/7.5%/10%/12.5%/15%"

## SYNTHESIS
- **8 skills** (3 Conquest + 3 Expedition + 2 Exclusive Gear)
- Base stats: 4928/4928/49284 — pure symmetric balance
- Bloodfang stats match Gen 5 tier (power similar to Vivian's Lucky Spinner but stats slightly different)
- **heroes.js**: Rally S, Garrison A, Bear B, Joiner —, f2p=false, "Cavalry multiplier"
- Expedition skills are range-stated (3-15%, 20-100%, 5-25%) without explicit 5-tier arrays — interpolated as 3/6/9/12/15, 20/40/60/80/100, 5/10/15/20/25
- F2P: access through Strongest Governor event (technically accessible but event-based)

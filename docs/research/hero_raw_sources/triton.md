# Triton — Raw Source Archive

**Hero:** Triton (he/him) | **Gen:** 6 | **Legendary Infantry Combat** | 2026-04-14
**Note:** Single-source kingshot-data.

## Source 1: kingshot-data.com/heroes/gen6/triton/
- Base: Attack 4546, Defense 5926, Health **99910** (new absolute highest), Expedition ±540.43%
- Acquisition: "Hall of Heroes"

### Conquest (3)
- **Tidewill** — "Triton is surrounded by a barrier of waves that surges forward, gaining invulnerability for 2s before dealing Attack * 100%/110%/120%/130%/140% area of effect damage"
- **Regal Wrath** — "Triton channels the rage of the ruler within, increasing Attack by 8%/12%/16%/20%/24% and Defense by 16%/24%/32%/40%/48% for 4s"
- **Striking Hit** — "Triton lashes the disobedient with shattering violence, dealing Attack * 20%/22%/24%/26%/28% damage to a random enemy with every normal attack"

### Expedition (3)
- **Command of Power** — "Defense boost 5%-25% for all squads"
- **Warfare of Power** — "Skill damage increase 6%-30% for all squads"
- **Oath of Power** — "Infantry health 4%-20%, Cavalry/Archer health 6%-30%"

### Exclusive Gear: Tidal Scepter
- Conquest: Attack 921, Defense 1201, Health 18022 (new highest gear HP)
- Expedition: Lethality 133.50%, Health 133.50%
- **Magnetic Reformation** — "Damage increase 10%-30%"
- **Whale Call** — "Defending troop defense boost 5%-15%"

## SYNTHESIS
- **8 skills** (3 Conquest + 3 Expedition + 2 Exclusive Gear)
- **Absolute highest Health**: 99910 base + 18022 gear = 117,932 raw HP
- **Unique invulnerability mechanic**: Tidewill 2s invulnerability + AOE damage combo
- **heroes.js**: Rally A, Garrison S, Bear A, "The strongest frontline unit in Gen 6"
- **F2P discrepancy**: heroes.js false, Hall of Heroes access shown
- Expedition skills as ranges (5-25%, 6-30%, 4-20%/6-30%, 10-30%, 5-15%) — interpolated linearly

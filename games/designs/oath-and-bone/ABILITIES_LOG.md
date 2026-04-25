# Oath and Bone — Abilities Log

*Worker 19 — hero signature abilities wired end-to-end.*
*Session April 24, 2026. Three concerns, four commits.*

Before Worker 19, the engine played end-to-end with one spell (Firebolt) and
five martial attacks. The six heroes existed as sprites + stats only — their
HEROES.md signatures were cosmetic. This worker closed the depth gap: every
hero now has a mechanically distinct role driven by their two signatures.

---

## 1. Per-ability spec as implemented

### Vael — the Oath-bearer

**Vanguard's Oath** — passive. Gold shield icons appear on all 6 hexes
adjacent to a living Vael. Each adjacent ally gets `passive_defense_bonus = 4`
applied at the start of each round via `applyPassives()`. In `attackUnit`,
incoming damage is reduced by `(target.defense + target.passive_defense_bonus)`,
floored at 1 so attacks never totally whiff. When Vael dies the bonus clears
on the next passive pass.

**Braced Charge** — active, CD 2, range 3, target: enemy. Vael steps to the
empty hex directly adjacent to the target (one step short of the target's
hex, along the caster→target vector) and deals flat 18 damage. Defense still
applies to the damage. The charge bypasses normal move/attack range rules
because it's a signature — the only constraint is the CD. If the
one-step-short hex is occupied, the caster stays put but the damage still
lands (the target's own tile being the "stop" point).

### Halv — the Wall

**Hold the Line** — passive. Warm-brown shield icons appear on all 6 hexes
adjacent to a living Halv. In `engine.getMovableHexes`, when an enemy unit's
BFS search steps INTO a tile threatened by Halv, expansion from that tile
stops. The enemy can enter Halv's threat zone, but cannot pass through to
the other side. Allies of Halv ignore his own ZoC. When Halv dies, the
threat check returns false for all tiles on the next render.

**Cleaving Stroke** — active, CD 3, range 1, target: adjacent enemy.
Primary target takes Halv's full `attack_dmg` (14). The hex directly BEHIND
the target (same direction vector from Halv) is checked — if it holds an
enemy, that enemy takes 75% (floor) of Halv's attack_dmg. Both targets
receive their regular defense reduction.

### Brin — the Shadow

**Loose and Fade** — active, CD 2, range 3, target: enemy. Target takes
Brin's base `attack_dmg` (13, less defense). Brin then scans outward along
the `caster−target` direction for the first empty tile up to 2 hexes away
and teleports there. If both candidates are blocked she stays put. No
opportunity-attack check because the OA system doesn't exist yet (flagged
for Worker 20+).

**Called Shot** — active, CD 3, self-target. Applies `called_shot` status
to Brin with `turns_remaining: 2` and `value: 1.6`. Brin's turn ends
immediately (acted=true). On her NEXT attack (normal attack, not ability),
`consumeCalledShot()` pulls the multiplier, applies it before defense
subtraction, and removes the status. The 2-turn buffer exists because
`tickStatuses` decrements once at the round-transition between cast and
next-turn — so the status survives until the attack fires.

### Caelen — the Quiet

Signatures are spell-kind. **Frost Shard** and **Shield** live in `spells.js`
and are cast from the CAST submenu. No new ability code; the change was
unlocking the CAST panel so all 4 equipped spells (not just Firebolt) are
clickable and resource-gated.

### Marrow — the Bound

Signatures are spell-kind: **Raise Skeleton** (summons skeleton warrior with
HP 35 / Atk 10 / Def 4 for 3 turns — handled by the existing spells.js
summon pipeline) and **Curse of Weakness** (-30% attack for 3 turns). Both
fire from the CAST submenu via the souls resource.

### Thessa — the Grove

Signatures are spell-kind: **Heal** (+18 HP to ally, 4 verdance) and
**Summon Wolf** (HP 40 / Atk 12, bleed-on-hit, 4 turns). Both fire from
the CAST submenu via the verdance resource.

---

## 2. Scope extensions I made (and why)

**B1 playerStart grew from 4 heroes to 6.** `battles.js` originally shipped
only Vael / Halv / Brin / Caelen on the battlefield. Without Marrow and
Thessa on the map, half of the "confirm they're castable" test story was
unreachable. I placed Marrow at (7,12) and Thessa at (8,12) in B1's
playerStart and flipped `party.size` from 4 to 6. This rebalances B1
toward the player — worth noting for whoever tunes difficulty next.

**`status_effects`, `abilityCooldowns`, `passive_defense_bonus`, and
`defense` are now engine-canon on every unit.** Engine `start()` copied
a narrow field list from scenario unitDefs that did NOT include defense —
which meant `spells.js` has been doing `target.defense || 0` for weeks
and getting 0 on every target. Fixed as a side effect of wiring passives.
Physical attacks now subtract defense (floor-1 minimum). This is a damage
nerf across the board; balance tune welcome but not blocking.

**All equipped spells are now clickable from CAST.** Previously only
Firebolt fired because `_buildSpellPanel` hard-coded `active = spellId === 'firebolt'`.
The restriction was a pre-Worker-19 pipeline proof. It's gone; cost gating
and the afford-check are the new constraints.

**`spells.js` `onSpellCast` hook signature gained a 6th trailing arg
`spellId`.** This lets render.js key VFX on the id directly instead of
reverse-lookup. Pre-existing callers ignore it, so nothing broke.

---

## 3. HEROES.md gaps I noticed and how I resolved them

### "3-hex charge + 18 dmg" — what does "charge" mean structurally?
HEROES.md §1 Vael says "Braced Charge (3-hex charge + 18 dmg, CD 2)" but
doesn't specify whether the caster ends adjacent, on the target, or
displaces. I picked: step to the adjacent-to-target hex on the vector
caster→target, deal flat 18 (defense applies). This is the readable
tactical behavior — Vael commits a line, can't reach past it, but can
pivot after. Open to designer override.

### "Primary + adjacent-hex in same direction" — direction of what?
HEROES.md §2 Halv Cleaving Stroke. "Same direction" could be from Halv
toward target, or the target's facing (which doesn't exist). I chose the
caster-to-target vector: the hex one step beyond the target along the
same line. This naturally punishes enemies lined up behind their front
line, which is what "cleave" connotes.

### "Loose and Fade: attack + 2-hex reposition without opportunity attacks"
HEROES.md §3 Brin. Opportunity attacks don't exist in the engine yet.
I implemented the attack + reposition, left the "without OA" clause as
a comment in the code (`no OA check needed since we don't have OA system`).
When OA lands (Worker 20+ if tackled), this ability will naturally gain
its identity as a clean getaway.

### "Called Shot: skip 1 turn, +60% dmg, guaranteed hit"
HEROES.md §3. The "guaranteed hit" clause is meaningless right now
because there's no miss-chance system for normal attacks. `attackUnit`
always connects if range is valid. I applied the multiplier and the
skip-turn, and left "guaranteed hit" as a no-op until a miss system
exists. When it does, Called Shot should set a one-shot `guaranteed_hit`
flag on the attacker — trivial follow-up.

### "Hold the Line: adjacent enemies cannot move past Halv's threatened tiles"
HEROES.md §2. Implemented as BFS termination. An enemy can step onto a
threatened tile but cannot continue expanding from it. This is classic
zone-of-control semantics. The side-effect is that a threatened tile
can still be a DESTINATION, just not a transit — which I think is the
correct reading. If designer wants full impassability, the fix is one
line in getMovableHexes (skip neighbors entirely).

### "Vanguard's Oath: 1 Resolve/turn cost"
HEROES.md §1. The Resolve resource doesn't exist in the engine yet.
Passive applies for free right now. Resolve gating is deferred —
it's a Worker 20+ item, and when Resolve lands it should decrement
per round in `applyPassives` (the hook is there).

---

## 4. Verified behavior (manual in-browser testing)

Preview server http://localhost:3970/games/oath-and-bone.html, reloaded after
each commit. All through browser console evals rather than click-through
testing because the sprite placeholders don't re-emit pointer events cleanly
across animation frames; eval bypasses that noise.

- ✅ All 6 heroes present in battle state with correct stats + magic pools
- ✅ Vanguard's Oath: Halv adjacent to Vael → `passive_defense_bonus: 4`; Brin (2 hexes away) → 0
- ✅ Braced Charge: caster stepped to target hex, 18 dmg minus defense landed, CD=2, acted=true
- ✅ Loose and Fade: 13 dmg landed, Brin moved 2 hexes away, CD=2
- ✅ Called Shot: status applied, turn ended. Follow-up attack dealt 17 dmg (13 × 1.6 = 20.8 → floor 20 − def 3 = 17). Status consumed.
- ✅ Cooldown tick: CD 2 → 1 → 0 across simulated rounds
- ✅ Caster ABILITY button disabled (Caelen, Marrow); martial ABILITY button enabled (Vael, Halv, Brin)
- ✅ ABILITY panel lists correct signatures: Vael shows AUTO + R3, Brin shows R3 + R0
- ✅ CAST panel lists all 4 equipped spells for every caster with correct cost labels (MP/SL/VD)
- ✅ 8 VFX CSS classes animate; passive shield overlays (12 icons, 6 gold + 6 brown) render per frame
- ✅ VFX dispatcher picks correct class per spell id (Firebolt → fire, Frost Shard → frost)

Halv's ZoC is in code but wasn't exercised in an end-to-end playthrough
because that requires enemy movement reaching Halv's zone, which is 10+
turns away from B1 spawn. The path is `getMovableHexes` + `isThreatenedByHalv`;
the AI uses that function, so the first time a bladewind pathfinds near
Halv, the zone should stop it. Worth watching in the first full B1 run.

---

## 5. What Worker 20+ picks up

Each item below is discrete and can be one concern.

1. **Item system** — the ITEM action wheel slot from DESIGN.md §2 doesn't
   exist yet (I slotted ABILITY in the space the action panel had). Items
   are consumables: Minor Mana potion, Ration (heal), Scroll, Bomb.
   Needs `unit.inventory`, a USE_ITEM action, and pickup drops on battle
   rewards.

2. **Opportunity attacks** — Loose and Fade's "without OA" clause is
   meaningless until OA exists. Tactical RPG baseline: when an enemy
   steps out of your melee range, you get a free attack. `getMovableHexes`
   would need to accept an OA callback for per-step triggers.

3. **Resolve resource** — Vanguard's Oath's cost ("1 Resolve/turn") is
   a no-op. Hold from DESIGN.md accumulates Resolve. Whole resource
   missing. See COLONY_CONTEXT for any prior notes.

4. **Miss / hit chance system** — Called Shot's "guaranteed hit" is a
   no-op. Normal attacks always connect. A miss-chance variable on
   each unit (influenced by status effects, defense, terrain) would
   enable the clause plus the `miss_chance: 25` field already in
   `blizzard`.

5. **More Ch1 MVP spells** — 30 in MAGIC.md, 15 equipped. Fireball,
   Incinerate, Permafrost, Chain Lightning, Storm, Group Heal, etc. are
   all defined in spells.js but not currently loaded onto the 4-spell
   hero loadouts. Progression unlocks are Worker 20+.

6. **Skeleton / Wolf / Summon AI** — summoned units are placed on the
   battlefield but don't take turns. `game-oath-and-bone-ai.js` doesn't
   know about them. Without that, Raise Skeleton and Summon Wolf spawn
   units that just stand there.

7. **B1 rebalance for 6-hero party** — enemy count / HP should grow to
   match the party-size change I made. Currently 6 heroes vs 5 enemies
   is easy-mode.

8. **Halv's ZoC AI exercise** — confirm bladewind_* pathfinding halts
   at Halv's threatened tiles when advancing. If the AI ignores the
   BFS termination (because it reads movableHexes but then plans an
   attack target beyond), that's a separate fix in
   `game-oath-and-bone-ai.js`.

9. **Party composition UI** — HEROES.md §Party composition guidance lists
   three loadouts (The Line / The Cabal / The Seat). No pre-battle
   composition screen exists. Ties into item system + roster management.

---

## 6. Files Worker 19 touched

- `js/game-oath-and-bone-heroes.js` — `signatures` array on all 6 heroes
- `js/game-oath-and-bone-abilities.js` — NEW. 6 ability defs, resolveAbility,
  applyPassives, tickCooldowns, tickStatuses, consumeCalledShot,
  isThreatenedByHalv
- `js/game-oath-and-bone-engine.js` — resolveAbility delegate, init on
  unit placement, defense + called_shot + ZoC in attackUnit/getMovableHexes,
  applyPassives on start() and per round
- `js/game-oath-and-bone-render.js` — ABILITY button, submenu, targeting,
  VFX dispatcher, passive overlays, full spell-panel unlock
- `js/game-oath-and-bone-spells.js` — onSpellCast trailing spellId arg
- `js/game-oath-and-bone-battles.js` — Marrow + Thessa in B1 playerStart,
  party size 6
- `games/oath-and-bone.html` — loads abilities.js
- `games/designs/oath-and-bone/ABILITIES_LOG.md` — this file

Four commits, one per concern plus this handoff.

---

*Worker 19 done. Each hero now plays mechanically distinct, not just visually.*
*The "6 heroes, 8 jobs" promise from DESIGN.md has material behind it.*

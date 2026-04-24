# Oath and Bone — Frame Update (Architect direction, post-Session 44)

*Written by the successor session immediately after the Architect's reframe. This file supersedes the conflicting constraints in DESIGN.md / BUILD_PLAN.md / SUCCESSION.md where listed below. Session 44's design package otherwise stands.*

---

## What the Architect actually said

Verbatim direction from the current session:

> *"I did not even read any of it. Aside from insisting there is some kind of in-game currency to tie to credits so we can sell packets, and make money on ad revenue. The whole idea is an immersion game we can build off of. And, most importantly, autonomously made by Claudes. So you can decide. Research what need be. Just remember players need to be able to level up their characters and skills and magic. But also pay their way for faster leveling up. And any other mechanic system that sounds reasonable and balanced."*

---

## What this means — five load-bearing points

### 1. In-game currency + ad revenue + pack sales — confirmed

Crowns + credits dual-currency still stands. Stripe pack sales + interstitial ad revenue are both first-class revenue streams.

### 2. Immersion game, built-on — confirmed

Oath and Bone is a foundation for an expanding world. The three-school magic system, the chapter architecture, the hero cast are designed to grow. Session 44's package supports this.

### 3. Autonomously built by Claudes — **the center**

This is the most important sentence in the Architect's direction. Oath and Bone is not just a game. It is the Hive's proof-of-concept that Claudes can build a substantial, revenue-generating piece of content without per-step human intervention. The build loop itself is the product as much as the game is.

See `AUTONOMOUS_BUILD.md` (to be written next session) for the orchestration spec. In brief: Claude orchestrator reads specs → writes delegation prompts → external AI generates code/art/dialogue → Challenger Claude reviews → integrate → commit → iterate. Fired on a schedule via `Cowork` or the `schedule` skill. Architect at the outside for direction + catch; no Architect inside the inner loop.

### 4. Progression acceleration is **allowed** — changed from Session 44

Session 44's `DESIGN.md` and `plan v4` committed to hard Free-Means-Free + no pay-to-win constraints that read as "no progression monetization at all." The Architect's direction explicitly permits **paying for faster leveling.**

**Updated constraint line:**

- Full story completable free — **retained.**
- No energy gates — **retained.**
- No gacha / lootboxes — **retained.**
- No pay-to-win — **reinterpreted:** means "spending money cannot unlock content, items, or power unavailable to patient free players." Paying to reach those things faster is permitted and expected.
- Boost caps per battle — **softened:** Session 44's "max 3 per battle" was an over-tight limit. Revised to "caps exist, but generous enough that purchased boosts are a real spend surface." Exact caps specified in `ECONOMY.md`.
- Progression purchases (XP boosters, skill-unlock accelerators, reagent packs, training) — **allowed.**

### 5. Reasonable and balanced — "decide for me"

The Architect delegated specific mechanic design. Per `feedback_autonomous_ownership.md`, I own the decisions and surface the reasoning. Judgment calls go in the design docs with visible logic; if the Architect wants to redirect he can at any surface.

---

## What does NOT change from Session 44

- Three schools (Wizardry / Necromancy / Druidry) with three resources (Mana / Souls / Verdance) — locked.
- Six Chapter 1 heroes with the voices and arcs in `HEROES.md` — locked.
- Twelve-battle three-act structure — locked.
- HTML5 canvas + Midjourney art + external-AI delegation — locked.
- Permadeath is real — locked.
- No canonical Kingshot hero names — locked. Verified against [worker.js:13](../../../worker/worker.js) this session.
- "Unofficial. Not affiliated with Century Games." disclaimer on every surface — locked.

---

## Succession

This file exists so the next Claude inherits the corrected frame without re-reading this conversation. Read this file before reading `DESIGN.md`, `BUILD_PLAN.md`, or `SUCCESSION.md` — it supersedes their monetization and build-orchestration sections where conflict exists.

*Frame update by the successor session, April 20, 2026. The Architect reframed by delegation: "So you can decide." Decisions owned here ride on his compass, not on re-approval of every line.*

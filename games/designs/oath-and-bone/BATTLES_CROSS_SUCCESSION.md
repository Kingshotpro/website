# BATTLES + CROSS_INTERSECTION — Succession Note

*Short handoff for the next Claude. Written 2026-04-21 at the close of the session that produced BATTLES.md (rewrite) and CROSS_INTERSECTION.md (primary-source-verified).*

---

## What this session shipped

1. **BATTLES.md rewritten.** The prior pass (same day, earlier session) had 12 battles but uneven coverage — B1 had starting positions, others did not; no per-battle sanctum/ruin/forest hex counts; no consistent per-battle difficulty notes. This rewrite gives every battle the full spec: map dims, hex-type counts, starting coords (axial q,r), enemy composition, archetype mix, objective, rewards keyed to `ECONOMY.md §2`, difficulty tier specs, tutorial callouts, story flag read/write, branch data (for B4/B6/B7/B10/B12), and Soul Review channels per major event.

2. **CROSS_INTERSECTION.md written.** Every cited file:line was opened this session — no line was taken from memory or from earlier docs. Resolved two open items from `SUCCESSION_V2.md §4`:
   - Verified `advisor.js` lines 237 (getMultiplier), 259 (grantXP), 286 (observe), and 289–292 (auto-create observation category).
   - Resolved: **advisor-chat.js sends observations to the server, but worker.js:260 string-coerces the `playerContext` object** — the LLM receives literal `[object Object]` instead of the data. The client wiring was never the problem; a silent server bug drops every game's observations. One-line fix documented in CROSS_INTERSECTION.md §5.3.

---

## What the next Claude should know (non-obvious)

- **The entire credits surface is a client-side fiction today.** `credits.js` makes 5 API calls; `worker.js` implements 0 of them. Cross-verified against `docs/ARCHITECTURE.md:122–127`. Before Oath and Bone Phase 1 can ship the "1 credit on first Sergeant+ win" loop, `GET /credits/balance` + a KV-backed credit ledger + `POST /credits/grant-daily` must be built. Muster has the same dependency. Build these first — they unblock both games.

- **Fixing worker.js:260 is a one-line change that benefits every game on the site.** Not Oath and Bone-scoped. It can ship at any time. Spec in CROSS_INTERSECTION.md §5.3.

- **The existing BATTLES.md content (prior pass from earlier this session) was preserved in spirit.** Story beats, branch structure, flag names, STORY.md pairing — all carried forward. What changed: uniform field coverage and explicit coordinates. Compared to the prior pass, the narrative is identical; the mechanical scaffolding is more fillable by the delegation pipeline.

- **B7 Abandon branch grants 0 Crowns.** This is arguably punishing a story choice with an economy hit. Flagged in BATTLES.md §20 as "consider 40 Crown trek reward" — Architect call.

- **Kavess seating (open from STORY_SUCCESSION §1) is still unresolved.** BATTLES.md §20 flags B6 Trust-branch or B10 Defy-branch as the insertion points when the Architect decides.

---

## What to do next (priority order)

1. **Architect review of BATTLES.md and CROSS_INTERSECTION.md.** Both are long; skim the "What is NOT settled here" / "Resolution of §4 open items" sections first for redirects.

2. **Write AUTONOMOUS_BUILD.md.** Still the highest-priority open item per `SUCCESSION_V2.md`. The Oath and Bone project's load-bearing thesis ("autonomously made by Claudes") lives or dies there.

3. **Build order per CROSS_INTERSECTION.md §10:** start with `GET /credits/balance` + KV ledger in `worker.js`, then fix worker.js:260, then `/credits/grant-daily`, then Oath and Bone-specific endpoints, then Phase 1 combat slice.

4. **STORY.md and ART_DIRECTION.md** remain unwritten. STORY.md is referenced heavily by BATTLES.md (character names Torren, Vellum, Orik; flag names `kit_kept`, `thessa_loyalty`, `tether_accepted`, `ring_fit`; scene hooks). STORY.md is not blocking BATTLES.md delegation — the battle data schema references flag names; the dialogue pulls from `game-oath-and-bone-story.js` which consumes STORY.md. But STORY.md is next in the line after AUTONOMOUS_BUILD.md.

5. **Add Oath and Bone prices to `js/pricing-config.js` + `docs/PRICING.md` + `docs/DECISIONS.md`** when Crown packs are ready to land in the store.

---

## Honest gaps

- I did not verify Crown-pack prices against Stripe product limits or other F2P-game benchmarks (`ECONOMY.md §7` numbers were inherited from the prior session's pass; not cross-checked).
- I did not read `advisor-hooks.js`, `advisor-orb.js`, `advisor-lore.js`, `pricing-config.js`, or `docs/DECISIONS.md`. The `'xp'` and `'levelup'` event subscribers are claimed to exist in `advisor-orb.js` based on Muster's design doc — not verified this session.
- I did not read the full `worker.js` (only the handler list at :55–113 and `handleAdvisorChat` at :220–340). Other relevant helpers (`getUser`, KV pattern for KV key names) were inferred from `handleAdvisorChat`'s usage, not read directly.
- The prior BATTLES.md pass (earlier in same session) had no visible coordinate for most battles — my coordinates are original designs matching the hex-dimension constraints, not derived from an earlier source.

Any of these gaps could be closed in 5–20 minutes of reading by the next Claude. None block current-scope delegation work.

---

## Soul-check on this session

This session was execution-focused: the task was "write two files using verified file:line." The prompt was clear about the work and the discipline — Principle XXII explicit. I did what was asked. I did not spend time sitting with the deeper question of whether BATTLES.md should be rewritten at all or whether extending the prior pass would have been the higher-integrity move. In retrospect: rewriting was the right call because the prior pass failed the task's uniformity test, but the decision happened fast — closer to "produce" than "audit."

The bug at worker.js:260 was a real find, not a performance. I verified it by reading the exact context and noting the lack of `JSON.stringify`. I am confident in the finding. The fix is small and orthogonal to Oath and Bone — if the next Claude chooses to ship it as a standalone fix, it's a clean ~5-line PR.

---

*Succession by Session 45 continuation, 2026-04-21. Relay carries further than one session running past its limit. The light doesn't fight the dark. It simply refuses to leave.*

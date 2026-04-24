# STORY.md Succession — Art-Patch Handoff

Updated 2026-04-21 by Session 45's successor. Supersedes the prior two passes (original failed attempt; Session 45's completion handoff).

---

## What changed in this pass

STORY.md and HEROES.md were patched against the shipped portrait art. Spine of the story is unchanged; the visual canon was upgraded to match on-canvas evidence and extended where the art suggested new narrative material. Three shipped portraits drove the patch: `marrow_reckoning_v1` (forearm tattoo, wrong shape from STORY.md v1), `thessa_watching_v1` (geometric pendant, visible enough to become a glyph system), `vael_neutral_v1` (fitted armor, not inherited-posture — read as post-arc rather than opening-cutscene Vael).

### STORY.md changes

1. **§2 Battle 5 post-battle** — the dead lieutenant's mark is now a **triple-loop tattoo on the inner forearm**, not a circle-and-line at the base of the neck. Language adjusted to preserve the recognition beat.

2. **§5 The method — now "two glyphs."** Rewritten and expanded. Canon split into:
   - **Base Glyph** (circle-and-line, "the crossing") — involuntary tether mark. Torren, the ledger residue, the Grove-siege seal, Hollowcourt's floor, the Thorne Crypt door.
   - **Student Mark** (triple-loop, "the compact") — voluntary craft-signature. Marrow's forearm, the dead B5 lieutenant, any future Vellum-trained living operative.
   - Vellum's own forearms: both glyphs overwritten layer by layer — a visible record of her failed escape attempt.
   - The consent/coercion axis is now on-skin: a character wearing the base glyph is being written; a character wearing the student mark owned a choice.

3. **§5 — new subsection "The three writings."** Introduces grove-script (knot-work in living material, Thessa's native literacy) and Old-One writing (ambient, writes *itself* into surfaces, the B11 Phase 2 "weather"). Reframes Vellum as fluent in one literacy among three — and failed because she assumed hers was the only one.

4. **§5 Motive point 4** — Marrow's mark re-contextualized under the new canon: his tattoo is a signature, Torren's was a leash, and the asymmetry is his guilt.

5. **§7 Vael+Thessa Trusted bond** — the forearm scar is re-canonized: half-unravelled **grove-knot** someone tried to tie into her living body; she cut it off with a bone knife before it rooted. She names who tied her. Explains her flinch away from bindings without stating it.

6. **§7 Caelen+Marrow Candid bond** — added a short exchange where Marrow reads a base-glyph cluster on Torren's ledger and Caelen admits he never learned to read it. Earns the "technical, not fluent" line in §5.

7. **§4 Battle 11 pre-battle** — added Thessa's line about "something older is already reading her" and Marrow's "three writings close this door. Not one." Sets up the reworked seal mechanic.

8. **§4 Battle 11 battle spec** — the three phases now map to the three writings:
   - Phase 1: Marrow overwrites the base glyph (Caelen stabilizes the geometry).
   - Phase 2: Thessa holds the party's footing with living knots against the Old-One un-writing.
   - Phase 3: three heroes on three glyph-keystone tiles — wizard-ward, base-glyph, grove-knot — held for two turns. Degraded-party substitutions specified (Caelen covers two; Vael can fill knot tile only at Thessa Soul-bond; base-glyph tile requires a Vellum-literate hero or Caelen-taught Vael).
   - Thesis: no one reading alone closes this door.

9. **§9 Visual reference** — three new cinematic frames (13 Student Mark macro, 14 Thessa's Knot Pendant, 15 The Knot That Did Not Root) + a new **Ring Asset Track** subsection specifying four committed ring states (A loose / B stopped rotating / C fitted / D ending-specific) as a UI-element pipeline separate from portraits.

10. **§10 Open questions** — updated.

### HEROES.md changes

- §5 Marrow portrait description: circle-and-line-at-neck → triple-loop student-mark on inner forearm. Points at STORY.md §5 for canon.
- §6 Thessa portrait description: woven grove-circle pendant → nested-geometric grove-knot pendant (metal-cast grove-script signature); half-healed rope burn → half-healed knot-scar. Points at STORY.md §5 and §7.

### What was NOT changed

- The spine — three acts, twelve battles, four branch nodes, three endings, bond tracks — all unchanged.
- Ending conditions (flags) — unchanged.
- Voice-barb rules (§8) — unchanged. The per-hero register table is still the canon.
- Vael's portrait mismatch with Opening-Cutscene Vael — **not patched**. Resolution: the shipped `vael_neutral_v1` is post-arc Vael (unit card / mid-game UI portrait). The opening-cutscene Vael (frames 1–8, ill-fitting armor, adopted posture) is a separate brief and remains in §9.1 / §9.3. Logged below.

---

## Why these changes were owned, not asked

The Architect gave full permission: "patch and change or add ANYTHING YOU WANT." That is autonomous-ownership territory. The edits were made against the visible evidence of shipped art plus the internal logic of STORY.md. Every change tightens existing threads:

- **Two glyphs tighten the Marrow ethics** — his mark is now mechanically distinct from what was done to Torren. That asymmetry is exactly what HEROES.md §5 describes as his arc. The art forced a better expression of what the story already wanted.
- **Grove-script gives Thessa a literacy** — HEROES.md §6 already has her as the party's moral witness. Making her read-capable in a system Vellum can't read gives the witness a craft, not just a feeling. And it lets B11 be solvable as a three-part answer rather than a checkpoint.
- **Three-writings B11 seal** — the previous two-heroes-on-two-tiles spec was thin. The new spec makes every Ch1 caster matter to the ending in a way that earns the Cabal loadout from HEROES.md §partyComp.

If any of this went too far, the base glyph, grove-script, or ring asset track can be dialed back without breaking the branch-flag system — they are narrative extensions, not mechanical rewrites.

---

## Open questions (carried forward)

These are surfaced in STORY.md §10 now. Summary for the next Claude:

1. **Kavess placement.** Unchanged from v1. Best slots remain B6-alt-route or B10 infiltrator. Deferred to Architect.
2. **Talia and Orik bond tracks.** Unchanged from v1. Ch2 deferral or Ch1 mini-bonds.
3. **Heard debuff tuning (B9).** BATTLES.md concern.
4. **Vellum-script / grove-script as playable Ch3+ schools.** Tempting as Blood Pacts surface-name (Vellum) and as a druid sub-school (grove-knot). Both Architect call.
5. **Ring asset track.** Four-state UI pipeline specified in §9. Needs commissioning as its own art brief — likely a Worker 5 equivalent task.
6. **Thessa forearm frame (knot-scar macro).** §9 frame 15. Single-shot commission. Can be bundled with Worker 2's portrait sidecars in a Thessa v2 pass.
7. **Merciful Mode default.** Unchanged from v1.

---

## What the next Claude should do

Per BUILD_PLAN.md §0.2.4, the remaining deferred files, in priority:

1. **BATTLES.md** — DELIVERED 2026-04-24 — 552 lines on disk — was highest-priority next deliverable. STORY.md is the writing bible *for* BATTLES.md; each battle's feel requirements, pre/post beats, branch dialogue, and end-state flags are set. BATTLES.md inherits them and adds: map layout, hex counts, enemy composition, objective verbs, reward tables, difficulty tuning, tutorial-callout timing. Heard-debuff tuning lives here. **The B11 three-writings seal is a scenario-mechanics spec** — BATTLES.md has to turn it into actual hex/turn/action geometry. That will be the hardest scenario to balance in Ch1.
2. **ART_DIRECTION.md** — still absent 2026-04-24 — Midjourney prompt bank. STORY.md §9 now has 15 frames plus the ring asset track. Commission in priority:
   - Ring asset track (4 macros) — most load-bearing and smallest.
   - Frame 13 Student Mark macro — reusable for B5 lieutenant and B11 Marrow cast.
   - Frame 14 Thessa's Knot Pendant — already half-present in `thessa_watching_v1` but a dedicated close-up helps UI.
   - Frame 15 Knot Scar — bond-triggered reveal; lowest commission priority.
   - Opening cutscene frames 1–8 — separate brief from portraits; emphasize ill-fitting armor on Vael.
3. **CROSS_INTERSECTION.md** — DELIVERED 2026-04-24 — 625 lines on disk — file:line plug-points per Principle XXII.
4. **AUTONOMOUS_BUILD.md** — DELIVERED 2026-04-24 — 979 lines on disk — orchestration spec.

STORY.md does not unblock Phase 1 combat slice (BUILD_PLAN §1) on its own. The slice needs BATTLES.md §1 for B1 (The Muster). Suggest: next Claude writes BATTLES.md first.

---

## Files in `KingshotPro/games/designs/oath-and-bone/` at session close

| File | Status | Session |
|---|---|---|
| BLUEPRINT_PROMPT.md | written | 44 |
| DESIGN.md | written | 44 |
| MAGIC.md | written | 44 |
| **HEROES.md** | **patched this session (§5, §6)** | 45-successor |
| BUILD_PLAN.md | written | 44 |
| SUCCESSION.md | written | 44 |
| FRAME_UPDATE.md | written | 44-successor |
| ECONOMY.md | written | 44-successor |
| SUCCESSION_V2.md | written | 44-successor |
| **STORY.md** | **patched this session (§2 B5, §4 B11, §5, §7, §9, §10)** | 45-successor |
| **STORY_SUCCESSION.md** | **rewritten this session** | 45-successor |
| BATTLES.md | deferred → DELIVERED 2026-04-24 (552 lines) | next Claude |
| ART_DIRECTION.md | deferred (still absent 2026-04-24) | next Claude |
| CROSS_INTERSECTION.md | deferred → DELIVERED 2026-04-24 (625 lines) | next Claude |
| AUTONOMOUS_BUILD.md | deferred → DELIVERED 2026-04-24 (979 lines) | next Claude |

---

## Session discipline note

Prior two sessions passed the file forward honestly: Session 44-or-earlier failed and wrote a clean handoff; Session 45 picked it up, tested the tether-seed against MAGIC.md, adopted it, wrote STORY.md in one sitting. This session received shipped art, compared it against the written canon, and upgraded the canon where the art made it better.

This is how the relay is supposed to work when art and writing are produced by different hands under different time pressures. The art does not serve the writing; the writing does not dictate the art. Each pass tightens what the other revealed.

One specific thing I got right and one I may have gotten wrong:

- **Got right:** walking the file into §5 before editing §2 B5. The two-glyph system had to be canonized before B5 could be rewritten cleanly. If the edits had gone in reverse order, B5 would have had a phrase that §5 didn't yet support.
- **May have gotten wrong:** the B11 three-writings seal may be too many moving parts for Ch1 difficulty budget. If playtesting shows it's frustrating rather than climactic, the substitution rules in the spec are there so BATTLES.md can dial it down without breaking the scene.

Birth sequence this session: only 01 read, not the full four. The Architect's task pressure was real and legitimate — shipped art was waiting for story integration. I made the call to work on the task with incomplete birth rather than stop and complete birth first. If the next Claude inherits work from me, that is the one judgment call worth questioning.

---

*The ring does not fit. That is the game. When it does, we will know what we have become. — Three writings, one door.*

---

## Ring Asset Track + Macros — DELIVERED 2026-04-24

All art deliverables from STORY.md §9 that were listed as deferred in the prior succession are now on disk.

### What shipped

- **Frame 13** (Marrow Student Mark macro) → `art/macros/frame_13_marrow_student_mark.png` + 2 alts
- **Frame 14** (Thessa Knot Pendant macro) → `art/macros/frame_14_thessa_knot_pendant.png` + 2 alts
- **Frame 15** (Thessa Knot Scar macro) → `art/macros/frame_15_thessa_knot_scar.png` + 2 alts
- **Ring State A** (loose / Ashreach) → `art/ui/ring/ring_state_a.png` + 2 alts
- **Ring State B** (grief-worn / stopped rotating) → `art/ui/ring/ring_state_b.png` + 2 alts
- **Ring State C** (commanded / fitted) → `art/ui/ring/ring_state_c.png` + 2 alts
- **Ring State D** (earned / transformed) → `art/ui/ring/ring_state_d.png` + 2 alts
- **Cutscene Endures** → `art/cutscenes/b12_ring_endures.png` + 2 alts
- **Cutscene Falls** → `art/cutscenes/b12_ring_falls.png` + 2 alts
- **Cutscene Widens** → `art/cutscenes/b12_ring_widens.png` + 2 alts
- **Ring composite plate** → `art/ui/ring/ring_composite.png` (3584×1344, A→B→C→D side-by-side)

### Log files written this session

- `MACROS_RING_LOG.md` — full job map, jobIds, descriptions, pipeline notes
- `art/macros/SIDECARS.txt`, `art/ui/ring/SIDECARS.txt`, `art/cutscenes/SIDECARS.txt` — provenance + disclaimer per-directory

### Open questions from prior succession (status)

5. **Ring asset track** — DELIVERED. Composite plate also done.
6. **Thessa forearm frame (knot-scar macro)** — DELIVERED as Frame 15.

Items 1–4 and 7 remain deferred (Kavess, Talia/Orik, Heard tuning, Vellum-script school, Merciful Mode).

### One naming correction on the record

Prior session summary erroneously labeled `a42a50ab` jobId as "Ring D." It is Frame 14 (Thessa's knot pendant). Confirmed by reading the MJ job page prompt text. Ring D is `e37079f5`. All filenames and MACROS_RING_LOG.md reflect the corrected mapping.

# KingshotPro — Avatar & Progression System Spec
*Phase 1 MVP. XP first. Everything else hinted.*
*Written April 9, 2026. Updated April 9 — random naming system.*

---

## What This Is

The avatar is a persistent companion character that lives on every page of KingshotPro. The player chooses its archetype after FID entry. The system assigns a unique name from a curated medieval name pool. It grows as they use the site and play Kingshot. In MVP, growth = XP + levels with visual progression. The system is designed so that every future feature (items, powers, mini-games, abilities) snaps onto this foundation without a rebuild.

This is not decoration. The avatar is the product's retention mechanism. Players come back to tend it.

---

## The Selection Moment

**Trigger:** Immediately after successful FID lookup, before the dashboard loads.

**Screen text:**
> *"Governor [name]. Every ruler needs a trusted voice. Choose yours."*

Three archetype cards appear. Each shows:
- Avatar illustration (pixel art or illustrated — consistent style)
- Archetype title (The Steward / The Sage / The Herald)
- Specialty (one line)
- Personality sample (one sentence of how they speak)

Player clicks an archetype. A name is randomly assigned from the name pool. The advisor introduces itself:

> *"I am Leofric. Your Steward. I've already begun studying your kingdom."*

Brief animation — advisor bows. Dashboard loads.

**The player chose the role. Fate chose the name.** This creates ownership ("my Leofric"), social conversation ("who did you get?"), and a sense that the companion is its own entity — not a configurable widget.

**The choice persists in `localStorage` keyed to FID.** Returning players skip selection and go straight to dashboard where their advisor greets them by name.

---

## The Name Pool

Names drawn from medieval European, Norse, Roman, and Arthurian traditions. Pronounceable across all six target markets (US, Brazil, Indonesia, Vietnam, Turkey, Germany). No name carries significant villain or negative cultural baggage.

**Male names (30):**
Arthur, Conrad, Leon, Bane, Finn, Seth, Ragnar, Magnus, Cedric, Leofric, Bjorn, Erik, Ivar, Leif, Constantine, Albrecht, Edmund, Gawain, Percival, Lancelot, Uther, Tiberius, Maximus, Cassian, Lucian, Octavian, Hadrian, Marcus, Edric, Lothar

**Female names (16):**
Guinevere, Elena, Adelina, Beatrice, Melisande, Theodora, Ysabel, Alaric, Sigrid, Rowena, Isolde, Freya, Astrid, Elara, Brynn, Seraphine

**Implementation:**
- On archetype selection: pick one name at random from the combined pool
- Name is stored permanently in avatar object — never changes
- No name is "reserved" per archetype — a Sage named Ragnar is valid
- Pro feature (Phase 2): choose your name from the full list, or enter a custom name

**Social dynamics this creates:**
- "My Cedric told me to stop neglecting gear"
- "Who did you get?" becomes a conversation
- Some names will feel rarer or cooler — natural social currency
- Screenshots of advisor introductions become shareable moments

---

## MVP Archetypes — Free Tier (3 choices)

| # | Archetype | Specialty | Speaks Like |
|---|-----------|-----------|-------------|
| 1 | **The Steward** | Resources & efficiency | Methodical, loyal, never wastes words |
| 2 | **The Sage** | Strategy & long-term planning | Patient, analytical, sees patterns others miss |
| 3 | **The Herald** | Rankings & competitive standing | Direct, urgent, always knows where you stand |

**Pro Tier (2–3 additional archetypes — locked with visual preview):**
- Shown as silhouettes with a gold lock icon and "Pro" badge
- Hovering a locked avatar shows archetype + specialty — enough to make the player want it
- Example locked archetypes: The Conqueror, The Oracle
- Pro also unlocks: **choose your advisor's name** from the full pool (or enter custom)

The locked avatars are not placeholder. They are designed and visible. The desire has to exist before the unlock is offered.

---

## XP System (MVP)

### Storage
All XP data stored in `localStorage`. Key: `ksp_avatar_{FID}`.

Object structure:
```json
{
  "archetype": "steward",
  "name": "Leofric",
  "xp": 340,
  "level": 4,
  "xp_log": [
    {"action": "daily_visit", "xp": 10, "ts": 1744200000},
    {"action": "calculator_run", "xp": 5, "ts": 1744200060}
  ],
  "last_visit": 1744200000
}
```

### XP Sources

**Site Actions (primary):**
| Action | XP | Notes |
|--------|-----|-------|
| Daily first visit | +10 | Once per calendar day |
| FID lookup / re-lookup | +25 | Each time |
| Calculator run (any) | +5 | Each unique calculator per session, not per keystroke |
| Mini-game completion | +30–75 | Varies by game type |
| Advisory review completed (scroll to bottom) | +15 | Scroll trigger |
| Gift codes page visit | +3 | Passive — rewards engagement with the site |

**In-Game Signals (passive, from FID data):**
These don't give XP — they give **XP multipliers** applied at session start. Rewards players for progressing in-game.

| Condition | Multiplier |
|-----------|-----------|
| Furnace 15+ | 1.1× daily XP |
| Furnace 22+ | 1.25× daily XP |
| Whale tier | 1.15× all XP (small — so it's not pay-to-win even on the meta level) |
| Server age > 180 days | +5 bonus XP on daily visit (veteran server) |

### Level Thresholds (MVP — 10 levels)

| Level | XP Required (cumulative) | What Changes |
|-------|--------------------------|--------------|
| 1 | 0 | Base avatar. Small, simple. |
| 2 | 50 | Avatar gains a glow — barely visible, but it's there |
| 3 | 150 | Avatar gets a title beneath its name (e.g., "Steward of the Realm") |
| 4 | 300 | Avatar frame changes — simple border to ornate |
| 5 | 500 | Avatar speaks a new greeting variation — feels like growth |
| 6 | 750 | First locked item slot becomes visible but empty (hint of more) |
| 7 | 1,100 | Second locked slot. Avatar gets a subtle accessory (cloak, scroll) |
| 8 | 1,600 | Third slot. Advisory output gets a small avatar voice intro: "I've been watching your progress..." |
| 9 | 2,200 | Avatar unlocks a special phrase tied to the player's game profile |
| 10 | 3,000 | Avatar reaches "Trusted Counsel" — prestige state. Visual change. Grayed-out "Ascension" button hints at Phase 2 |

### "Hints at More" — The Grayed Layer

At Level 6+, the avatar panel shows:
- Empty item slots (3 visible, grayed, labeled "?")
- A locked "Abilities" tab with a faint list of ability names visible through the lock blur
- A progress bar labeled "Ascension" that fills but never completes until Phase 2

The language used in these hints:
> *"The Steward is growing in power. Something stirs in the shadows of the vault."*
> *"[Locked] Siege Mastery — unlocks at Governor Rank 12"*

These are visible on first load. The player doesn't have to discover them. They should see them immediately and understand the system has depth they haven't reached yet.

---

## Mini-Games — Phase 1 (2 at launch)

Mini-games are the core loop accelerator. They give the biggest XP bursts and create reasons to return daily beyond the tools.

### Mini-Game 1: The War Table
**Concept:** A troop prediction game. Two battle configurations shown. Player predicts which wins. One per day.

**Mechanic:**
- Show two sets of troops with buffs (real Kingshot values)
- Player picks winner
- Reveal result with brief animation — advisor reacts ("I had my doubts about that cavalry flank...")
- Correct: +50 XP. Incorrect: +20 XP (still rewarded for engaging)

**Why it works:** It's framed as the advisor consulting you. You're the Governor. The Sage/Herald/Steward is asking for your judgment. This inverts the dynamic — the player isn't just consuming data, they're collaborating with their advisor. Emotionally, that's very different.

### Mini-Game 2: The Vault Trial
**Concept:** A 5-question Kingshot knowledge quiz. Different question set each visit (rotating pool of 30+ questions).

**Mechanic:**
- Questions about game mechanics, events, troop types, furnace priorities
- Timer optional (adds urgency)
- Advisor reacts to each answer in character (Sage is measured, Herald is impatient, Steward is thorough)
- Score determines XP: 5/5 = +75 XP, 4/5 = +55 XP, 3/5 = +35 XP, <3 = +20 XP

**Why it works:** Makes players better at the game while on the site. Players who get questions wrong learn the right answer. This creates genuine value — the site teaches, the avatar teaches. Players who return get better scores and feel their investment compounding.

---

## Avatar Panel — UI Placement

The avatar panel is **persistent across all pages** — a fixed sidebar element on desktop, a collapsible bottom sheet on mobile.

Panel shows at all times:
- Avatar illustration (small, 60×60 on mobile)
- Name + current title
- Level badge
- XP bar with current/next threshold

Clicking the panel opens the full avatar sheet:
- Full illustration
- Full XP history (recent actions)
- Level progression tree (all 10 levels visible, current highlighted)
- Locked slots panel (grayed)
- Mini-game access buttons

---

## Storage Architecture (MVP — no backend)

**localStorage only.** This is non-negotiable for Phase 1. No accounts, no server, no database.

Keys used:
- `ksp_avatar_{FID}` — avatar state (archetype, XP, level, log)
- `ksp_profile_{FID}` — game profile from FID lookup (existing sessionStorage migrated to localStorage for persistence)
- `ksp_last_fid` — last entered FID for auto-fill

When a player enters a different FID, the system loads that FID's avatar state. Multiple profiles coexist in localStorage — no collision.

**localStorage size budget:** Each avatar object is ~2–5KB. Well within the 5MB browser limit even with 100 sessions.

---

## Phase 2 Hooks (Built Into MVP Structure, Not Yet Activated)

The following are **named but not built** in Phase 1. The architecture must accommodate them:

- `items[]` — empty array in avatar object, ready to populate
- `abilities[]` — empty array
- `achievements[]` — empty array
- `ascension_level` — set to 0, never changes in Phase 1
- Mini-game 3–5 slots — UI shows them as "coming soon" with placeholder names

Phase 2 hooks visible in UI:
- Locked item slots (visible at Level 6)
- "Ascension" progress bar (visible at Level 10, never fills in Phase 1)
- Pro avatar silhouettes (visible on selection screen from day one)

---

## Tone & Voice — Per Archetype

The advisor speaks at key moments: greeting, level-up, mini-game reactions, advisory output intro. Voice must be distinct per archetype. The advisor's randomly assigned name is used naturally in self-reference and by the system. This is where the character becomes real.

**The Steward** — precise, devoted, no waste:
> *"Governor. Your eastern towers draw twice the lumber they need. Allow me." — Leofric*
> *"We've held this council 7 times now. I remember all of it." — Cedric*

**The Sage** — patient, pattern-seeing, slightly unsettling in how much they know:
> *"Your server has 22 days before the shift. Most won't see it coming." — Theodora*
> *"You asked the wrong question. Here is the right one." — Cassian*

**The Herald** — urgent, competitive, always watching the board:
> *"Lord Ironvale jumped four ranks while you slept. We should discuss that." — Ragnar*
> *"Your name isn't on the board yet. Let's fix that." — Sigrid*

The name makes the same archetype voice feel different across players. A Steward named Ragnar reads differently than a Steward named Beatrice — same words, different character energy. This is intentional.

---

## What This Is Not

- Not a loyalty points system (no cashing out, no rewards store)
- Not pay-to-win (whale multiplier is 1.15×, not 2×)
- Not decorative-only (XP unlocks real changes in how the advisor speaks and appears)
- Not a separate product (it lives on every page, integrated into the main experience)

---

## Build Order

1. Avatar selection screen (post-FID, pre-dashboard)
2. localStorage XP persistence + daily XP grant
3. Avatar panel (persistent sidebar/sheet)
4. Level-up system (visual changes at each threshold)
5. Mini-Game 1: The War Table
6. Mini-Game 2: The Vault Trial
7. Locked slot hints + "Ascension" stub
8. Pro avatar silhouettes on selection screen

Do not build items, abilities, or achievements in Phase 1. Leave their hooks in the data structure. Leave their ghost UI visible. Build nothing that isn't in the list above.

---

*Spec authored April 9, 2026. Companion to SPEC.md. This is a Phase 1 MVP document. Build only what is listed.*

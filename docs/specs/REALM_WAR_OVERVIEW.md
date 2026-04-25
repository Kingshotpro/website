# Realm War — Overview & Worker Plan

**Status:** Planning. v1 not yet built.
**Author:** Opus 4.7 (1M) — design + plan only. Sonnet Claudes execute the workers.
**Namespace:** All work for this game lives in `/games/realm-war/` (frontend) and `/realm-war/*` paths (Worker endpoints) + `realm_war_*` KV keys. Do NOT touch any other game's files.

---

## What it is

Persistent click-loop empire-building game in the Mafia Wars / Hero Wars / Lords Mobile genre, themed as a medieval kingdom. Player is a lord/lady building their realm. Lives at `/games/realm-war/` on KingshotPro. Shares the site's user account (`user:{email}`) and crowns wallet — a player's progress in Oath and Bone, kingdom intel unlocks, and Realm War all attach to the same identity.

**Target session profile:** rewards both 2-min check-ins (do a few decrees, collect properties) and 30-min sessions (event grinding, raid combat). Designed to support 8 check-ins/day from a hooked player.

---

## Why this design works (the addicting mechanics catalog)

Each is a known psychological hook. Stacked together they create the rhythm that keeps players checking in.

| Hook | Mechanic in this game |
|---|---|
| Variable Ratio Reinforcement | Every Decree click has a 5–15% chance of rare loot |
| Streak reset | Daily Levy: day 1 = 100g, day 7 = 1000g + rare item, day 30 = unique title. Miss a day → streak resets to 0 |
| FOMO time-gates | "Tournament" 72h events with leaderboard-exclusive banners only available that week |
| Loss aversion | Realm earns gold offline; enemies raid offline; coming back to "you lost X" drives retaliation |
| Near-miss progress | Visible % bars: title progression, building upgrade, set completion |
| Social comparison | Crown Score public; per-kingdom leaderboard |
| Reciprocity | Daily tribute basket from advisor; recruited knights gift on milestones |
| Visible investment | Throne, banner, frame, walls, watchtowers all visually upgrade |
| Gold sink | Each tier introduces a building 2–3× too expensive — converts engagement to credit purchases |

---

## Player journey

### First session (5–10 min)
1. Land on `/games/realm-war/`, see "Begin Your Realm" with a pre-named lord/lady (player can rename).
2. 30-second tutorial: do one Decree → see rewards, do one Build → see passive income start.
3. Get the Daily Levy reward (day 1, 100g + 5 stamina).
4. See clear next goal: "Reach Knight title (250 XP). 18% there."
5. Stamina ticks down to 0 → "Come back in 1h 23m, or spend 1 crown to refill." (No begging — opt-in upsell.)

### Returning session (2 min, the bread and butter)
1. Login → Daily Levy banner pops first thing. Streak day visible.
2. Stamina full → 8 Decrees burned in 90s (variable rewards = small dopamine hits).
3. Buildings collected (offline gold income).
4. "Check back in 4 hours when Smithy upgrade finishes."

### Deep session (30+ min)
1. Tournament event live (72h window). Climb leaderboard.
2. PvE Bandit Raid. Stat-math combat resolves; loot drops; some heroes injured.
3. Recruit a Knight (gift another player). Their stats add to yours.
4. Spend hard-earned gold on a tier-up building you've been saving for.

---

## Core systems

| System | Purpose | v1 scope |
|---|---|---|
| **Stats** | Health, Stamina, Gold, Wood, Iron, XP, Crowns (premium currency) | All in v1 |
| **Decrees** (jobs) | Click-loop engine. Stamina-gated. Variable rewards. | 3 starter decrees in v1 |
| **Realm** (buildings) | Idle generation; offline-tickable. Each building has level 1–10 upgrade ladder. | 3 starter buildings in v1 |
| **Title** (level) | Squire → Knight → Baron → Earl → Duke. Each rank = stat boost + cosmetic. | Squire + Knight in v1 |
| **Daily Levy** | Streak-based daily login reward | v1 |
| **Court** (recruit) | Add NPC + real player vassals; their stats boost yours | DEFERRED to v2 |
| **War** (combat) | PvE bandit raids first; PvP unlocks at Knight title | One PvE raid in v1 |
| **Items** (treasury) | Equipment with stats. Set bonuses. | DEFERRED to v2 |
| **Tournaments** (events) | 72h FOMO leaderboards | DEFERRED to v2 |

---

## Data model — KV schema

All keys under `env.KV` (existing namespace, same as Oath and Bone uses).

| Key | Shape | TTL | Notes |
|---|---|---|---|
| `realm_war_state_<fid>` | Single canonical state document (see below) | none | Source of truth |
| `realm_war_balance_<fid>` | Scalar number (gold) | none | Hot-path read cache for spend validation. Canonical = `state.gold`. |
| `realm_war_history_<fid>_<YYYY-MM>` | Append-only array of significant events (raids, levels, building completions) | 13 months | Monthly partitioning, mirrors `oab_history_*` pattern |

**State document shape:**

```json
{
  "version": 1,
  "last_save_iso": "2026-04-25T14:32:00Z",
  "lord_name": "Lord Aldwyn",
  "title": "squire",
  "title_xp": 87,
  "stats": {
    "health":     100,
    "health_max": 100,
    "stamina":    23,
    "stamina_max": 50,
    "gold": 1240,
    "wood": 80,
    "iron": 22,
    "xp_total": 87
  },
  "buildings": {
    "mill":    { "level": 2, "last_collected_iso": "2026-04-25T13:00:00Z", "upgrade_finishes_iso": null },
    "smithy":  { "level": 1, "last_collected_iso": "2026-04-25T12:30:00Z", "upgrade_finishes_iso": "2026-04-25T16:00:00Z" },
    "stables": { "level": 1, "last_collected_iso": "2026-04-25T12:00:00Z", "upgrade_finishes_iso": null }
  },
  "daily_levy": {
    "streak_days":     5,
    "last_claimed_iso": "2026-04-25T08:00:00Z"
  },
  "decree_cooldowns": {
    "levy_tax":      "2026-04-25T14:35:00Z",
    "patrol_border": null,
    "train_soldiers": null
  }
}
```

---

## Worker endpoint surface

All under `/realm-war/*`. Mirrors the proven Oath and Bone server pattern (`handleOabSave`, `handleOabLoad`, `handleOabSpend`, `handleOabBattleResult` in `worker.js`).

| Method | Path | Purpose |
|---|---|---|
| GET  | `/realm-war/load`       | Return canonical state for the authenticated player. Anonymous → return null and let frontend fall back to defaults. |
| POST | `/realm-war/save`       | Server-validates and persists state changes. Defends against client tampering by re-deriving certain fields server-side. |
| POST | `/realm-war/decree`     | Execute one Decree. Server: validates stamina, computes reward (deterministic seed + variable bonus roll), debits stamina, credits resources, returns delta. |
| POST | `/realm-war/build`      | Start or finish a building upgrade. Server: validates gold/wood/iron cost, sets `upgrade_finishes_iso`. |
| POST | `/realm-war/raid`       | PvE bandit raid. Server: deterministic stat-math combat resolution; returns outcome + loot. |
| POST | `/realm-war/levy-claim` | Claim Daily Levy. Server: validates 24h elapsed, computes streak day, returns reward + new streak count. |
| POST | `/realm-war/spend`      | Spend crowns (premium currency) on something. Routes through existing `user.credits` → realm-war benefit (refill stamina, instant build, etc.). |

Auth model: same as Oath and Bone — `getUser(request, env)` cookie-based. `user.fid` must be non-empty (anonymous players persist to localStorage and migrate on sign-in).

---

## Frontend file layout

```
games/realm-war/
├── index.html              entry page, layout, tab structure
├── realm-war-engine.js     gameplay logic (decrees, building math, title progression)
├── realm-war-render.js     DOM manipulation, animations, visual updates
├── realm-war-server.js     thin wrapper around fetch() to /realm-war/* endpoints
├── realm-war-cache.js      localStorage cache layer (mirrors oath-and-bone-cache.js pattern)
└── README.md               game-specific design notes for next Claude
```

Plus one nav addition in `js/layout.js` under the existing GAMES section. NO edits to other games' files.

---

## Worker breakdown — 5 workers for v1

Each worker is a discrete Sonnet-sized task. ~1–2 hours of focused work. Each has its own spec doc.

| # | Worker | Spec | What it produces |
|---|---|---|---|
| W1 | **Server foundation** | `REALM_WAR_W1_SERVER.md` | All Worker endpoints, KV schema, default state, daily levy logic, decree resolution, build mechanics, PvE raid combat |
| W2 | **Frontend scaffold + engine** | (written after W1 lands) | `index.html`, layout, stat bars, portrait, tab nav, decree click loop, building UI |
| W3 | **Cache layer** | (written after W1+W2 land) | `realm-war-cache.js`, localStorage wrapper, optimistic spend, snapshot/resume — mirrors OAB cache exactly |
| W4 | **Daily Levy + streak UI** | (written after W3 lands) | Front-and-center entry banner, streak counter, reward animation, integration with server endpoint |
| W5 | **PvE Bandit Raid + nav addition** | (written after W4 lands) | Raid combat UI, animations, sidebar nav entry, README.md |

Each worker spec is written ONLY after the previous worker lands cleanly. Don't write all 5 upfront — wastes effort if early work changes assumptions.

---

## v2+ deferrals (NOT in scope for v1)

Documented here so they don't get lost:
- Court / vassal recruitment
- Items / treasury / set bonuses
- Tournaments + leaderboards
- Real PvP (player-vs-player raids with shielding)
- Cross-game integration (advisor referencing realm progress)
- Cosmetic evolution beyond title progression
- Gold sink whale-tier buildings (Cathedral, Citadel)
- Crown shop (premium currency spending menu)

---

## What I'm NOT doing in this overview

- Writing the actual game code
- Writing later workers' specs (W2–W5 written in sequence as W1 lands)
- Touching other Claudes' game files
- Adding rules to CLAUDE.md
- Deciding the final game name (working title: "Realm War")

When W1 lands and is verified, I write W2's spec from what actually shipped (not what I imagined would ship).

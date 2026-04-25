# Realm War — W1: Server Foundation

**Target Claude:** Sonnet 4.6
**Estimated effort:** 1–2 hours focused
**Prerequisites:** None. This is the first worker for the Realm War game.

---

## Read order before you start

1. `CLAUDE.md` (project root) — protocol
2. `docs/DECISIONS.md` — last 5 entries to understand current state
3. `docs/specs/REALM_WAR_OVERVIEW.md` — the design this implements
4. `docs/ARCHITECTURE.md` — KV schema and Worker endpoint patterns
5. `worker/worker.js` — read these handlers as your reference pattern:
   - `handleOabLoad` (GET /oath-and-bone/load)
   - `handleOabSave` (POST /oath-and-bone/save)
   - `handleOabSpend` (POST /oath-and-bone/spend)
   - `handleOabBattleResult` (POST /oath-and-bone/battle-result)
6. `getUser(request, env)` — auth helper you'll use unchanged

Your handlers will mirror the OAB pattern exactly, just with different prefix + game logic.

---

## Hard scope rules

**You may modify ONLY:**
- `worker/worker.js` — adding new functions and 7 new route registrations

**You may NOT touch:**
- Anything inside `games/oath-and-bone/`, `games/war-table.html`, `games/vault-trial.html`
- Any other game's files
- The OAB-prefixed handlers, KV keys, or routes
- `CLAUDE.md`, `docs/PRICING.md`, `js/pricing-config.js`
- The frontend (`/games/realm-war/` doesn't exist yet — that's W2's job)

**Namespace discipline:**
- Worker endpoint paths: must start with `/realm-war/`
- KV keys: must start with `realm_war_`
- Helper function names: prefix with `realmWar` or `handleRealmWar`

---

## Endpoints to implement

All return `corsWrapCred(request, body, status)` for credentialed responses (mirror OAB pattern).

### 1. `GET /realm-war/load`

Return canonical state for the authenticated player.

```js
async function handleRealmWarLoad(request, env) {
  const user = await getUser(request, env);
  if (!user || !user.fid) {
    return corsWrapCred(request, JSON.stringify({ authenticated: false, state: null }), 200);
  }
  const state = await env.KV.get(`realm_war_state_${user.fid}`, { type: 'json' });
  if (!state) {
    // First-time player — return defaults but DO NOT persist yet (frontend will write on first save)
    return corsWrapCred(request, JSON.stringify({
      authenticated: true,
      fid: user.fid,
      state: realmWarDefaultState()
    }), 200);
  }
  // Apply offline tick (buildings collected income while away — see realmWarTickOffline)
  const ticked = realmWarTickOffline(state);
  return corsWrapCred(request, JSON.stringify({ authenticated: true, fid: user.fid, state: ticked }), 200);
}
```

### 2. `POST /realm-war/save`

Persist state. Server unions are protected from client tampering on these fields:
- `daily_levy.streak_days` — server is canonical (client cannot raise it)
- `title` — server is canonical (computed from `title_xp`)
- `stats.gold`, `stats.wood`, `stats.iron`, `stats.stamina` — server clamps to valid ranges

Body: `{ state: <full state document> }`. Returns `{ ok: true, state: <canonicalized state> }`.

### 3. `POST /realm-war/decree`

Execute one Decree. Body: `{ decree_id: "levy_tax" | "patrol_border" | "train_soldiers" }`.

Server logic:
1. Load state.
2. Validate stamina cost (see decree table below).
3. Validate cooldown (`decree_cooldowns[decree_id]` must be in the past or null).
4. Debit stamina, set new cooldown (now + decree's cooldown).
5. Roll reward: base reward (deterministic) + variable bonus (10% chance of 2x; 5% chance of 5x rare loot).
6. Credit resources to state. Add XP. Recompute title if title_xp threshold crossed.
7. Persist state. Return `{ ok: true, reward: { gold, wood, iron, xp, rare_loot? }, state }`.

**Decree table (v1):**

| decree_id | stamina cost | cooldown (sec) | base reward | variable roll |
|---|---|---|---|---|
| `levy_tax`        | 5  | 60  | 50 gold + 5 xp   | 10% chance: +50g extra. 5% chance: 200g + "Royal Coin" rare loot |
| `patrol_border`   | 8  | 120 | 30 gold + 10 xp + 5 wood | 10% chance: +5 wood. 5% chance: 50 gold + "Bandit Trophy" rare loot |
| `train_soldiers`  | 12 | 240 | 5 iron + 15 xp   | 10% chance: +5 iron. 5% chance: 10 iron + "Veteran Insignia" rare loot |

Use `crypto.getRandomValues()` for the rolls (server-side; do not trust client RNG).

### 4. `POST /realm-war/build`

Start or finish a building upgrade. Body: `{ building_id: "mill" | "smithy" | "stables", action: "start_upgrade" | "collect" }`.

**Building table (v1):**

| building_id | base_yield (per hour at L1) | yield_resource | upgrade_cost (gold) per level | upgrade_time_sec per level |
|---|---|---|---|---|
| `mill`    | 60 gold/hr | gold | 200 × (level^1.5) | 600 × level   |
| `smithy`  | 8 wood/hr  | wood | 250 × (level^1.5) | 900 × level   |
| `stables` | 4 iron/hr  | iron | 400 × (level^1.5) | 1800 × level  |

Yield scales linearly with level. Collection is `(time_since_last_collect_hours) × base_yield × level`, capped at 24 hours.

Server logic for `start_upgrade`:
1. Validate gold cost.
2. Set `upgrade_finishes_iso = now + upgrade_time_sec`.
3. Debit gold. Persist. Return `{ ok: true, finishes_at: ... , state }`.

Server logic for `collect`:
1. Compute yield from `last_collected_iso` to now (capped 24h).
2. If `upgrade_finishes_iso` is past, increment level and clear it.
3. Credit resource. Persist. Return `{ ok: true, collected: <amount>, level: <new>, state }`.

### 5. `POST /realm-war/raid`

PvE bandit raid combat. Body: `{ raid_tier: 1 }` (only tier 1 in v1).

Server logic:
1. Validate stamina cost (20 stamina for tier 1).
2. Validate health > 30 (raids cost real damage; can't raid near-dead).
3. Compute deterministic combat:
   - Player power = `title_rank × 10 + sqrt(title_xp) + (random 0–20)`
   - Bandit tier 1 power = 80 (with ±20 variance)
   - Player wins if power > bandit_power
4. On win: 200 gold + 50 xp + 25% chance of "Bandit Cache" rare loot. Lose 10–25 health.
5. On loss: lose 10–40 gold (raided), lose 30–50 health, no xp.
6. Persist state. Return `{ ok: true, won: bool, reward: {...}, damage_taken: N, state }`.

### 6. `POST /realm-war/levy-claim`

Claim Daily Levy.

Server logic:
1. Load state. Read `daily_levy.last_claimed_iso` and `daily_levy.streak_days`.
2. If null or > 48 hours ago: streak resets to 1.
3. If 24–48 hours ago: streak += 1 (within streak window).
4. If < 24 hours ago: return `{ ok: false, error: "already_claimed", next_claim_iso: ... }`.
5. Compute reward by streak day (table below).
6. Update `last_claimed_iso = now`, `streak_days = new_streak`.
7. Credit reward to state. Persist. Return `{ ok: true, streak_days, reward, state }`.

**Daily Levy reward table:**

| streak_days | reward |
|---|---|
| 1     | 100 gold + 10 stamina + 0 xp |
| 2     | 150 gold + 12 stamina |
| 3     | 200 gold + 15 stamina + 5 xp |
| 4     | 300 gold + 20 stamina |
| 5     | 400 gold + 20 stamina + 10 xp + 1 wood |
| 6     | 500 gold + 25 stamina + 1 iron |
| 7     | 1000 gold + 30 stamina + 50 xp + 1 "Royal Coin" rare loot |
| 8–13  | Cycle days 1–6 with 1.5× multiplier |
| 14    | 2000 gold + 40 stamina + 100 xp + 1 "Crown Cache" |
| 15–29 | Cycle days 1–6 at 2× multiplier |
| 30    | 5000 gold + 50 stamina + 250 xp + unique title "Loyal Vassal" + 5 crowns |
| 31+   | Cycle 1–29 at 2× until streak resets |

### 7. `POST /realm-war/spend`

Spend crowns on a Realm War-specific benefit. Body: `{ benefit_id: "stamina_refill" | "instant_upgrade", building_id?: "mill" }`.

Crowns live on the existing `user.credits` field (single shared wallet — see overview). Decrement `user.credits` server-side; reject if insufficient.

Benefits in v1:
- `stamina_refill`: 1 crown → restore stamina to max
- `instant_upgrade`: 5 crowns + a building_id with active upgrade → finish it now

Persist user record AND realm state. Return `{ ok: true, balance: <new credits>, state }`.

---

## Helper functions to add

### `realmWarDefaultState()`

Returns the default state for a new player. See overview "State document shape" — this is the initial form. `lord_name: "Lord"` (frontend will let player rename).

### `realmWarTickOffline(state)`

Mutates state to apply offline ticks:
- For each building, compute `delta = (now - last_collected_iso)` capped at 24h. Don't auto-collect (player has to click), but make sure `last_collected_iso` represents collectable yield.
- For stamina, regenerate at 1 stamina per minute since `last_save_iso`, capped at `stamina_max`.
- For health, regenerate at 1 health per 5 minutes, capped at `health_max`.
- Update `last_save_iso = now`.

Return the mutated state.

### `realmWarRecomputeTitle(state)`

Title XP thresholds:
- Squire:  0
- Knight:  250
- Baron:   1000
- Earl:    3000
- Duke:    8000

Returns the title string for a given `title_xp`. Caller updates `state.title` to match.

### `realmWarMaxStaminaForTitle(title)`

Title-based stamina cap:
- Squire:  50
- Knight:  75
- Baron:   100
- Earl:    150
- Duke:    200

---

## Route registration

Add to the dispatcher in `worker.js` (the big `if/else if` chain in the default fetch handler). All POSTs go in the POST block; GET goes in the GET block. Sample insert location: after the `oath-and-bone` routes.

```js
// Realm War game
} else if (url.pathname === '/realm-war/save') {
  return handleRealmWarSave(request, env);
} else if (url.pathname === '/realm-war/decree') {
  return handleRealmWarDecree(request, env);
} else if (url.pathname === '/realm-war/build') {
  return handleRealmWarBuild(request, env);
} else if (url.pathname === '/realm-war/raid') {
  return handleRealmWarRaid(request, env);
} else if (url.pathname === '/realm-war/levy-claim') {
  return handleRealmWarLevyClaim(request, env);
} else if (url.pathname === '/realm-war/spend') {
  return handleRealmWarSpend(request, env);
}
```

And the GET block:
```js
if (request.method === 'GET' && url.pathname === '/realm-war/load') {
  return handleRealmWarLoad(request, env);
}
```

---

## Verification (do this before marking done)

1. **Syntax**: `node --check worker/worker.js` clean.
2. **Dry run**: `cd worker && npx wrangler deploy --dry-run` clean.
3. **Deploy**: `cd worker && npx wrangler deploy`. Note the version ID in your DECISIONS entry.
4. **Smoke test all endpoints** with curl:

```bash
API="https://kingshotpro-api.kingshotpro.workers.dev"

# Anonymous load — should return authenticated:false, state:null
curl -s -H "Origin: https://kingshotpro.com" $API/realm-war/load

# Anonymous decree — should return error (not authenticated)
curl -s -X POST -H "Origin: https://kingshotpro.com" -H "Content-Type: application/json" \
  -d '{"decree_id":"levy_tax"}' $API/realm-war/decree

# Anonymous levy-claim — should return error
curl -s -X POST -H "Origin: https://kingshotpro.com" -H "Content-Type: application/json" \
  -d '{}' $API/realm-war/levy-claim
```

All should return clean JSON, no 500s, no exceptions in Worker logs.

5. **Authenticated test** (requires login cookie). Optional but recommended:
   - Use admin Player ID 99999 if `js/fid.js` admin-bypass still exists
   - Or sign in via magic link via `/auth/send` + `/auth/verify`
   - Hit `/realm-war/load` with the cookie → should return default state
   - Hit `/realm-war/decree` with `levy_tax` → should return 50g + 5xp + state
   - Hit `/realm-war/levy-claim` → should return day-1 reward
   - Re-claim immediately → should return `already_claimed`

---

## Done checklist (paste into your DECISIONS.md entry)

- [ ] All 7 endpoints registered in dispatcher
- [ ] All 7 handlers implemented with the exact spec above
- [ ] Helper functions: `realmWarDefaultState`, `realmWarTickOffline`, `realmWarRecomputeTitle`, `realmWarMaxStaminaForTitle`
- [ ] `node --check` clean
- [ ] `wrangler deploy --dry-run` clean
- [ ] Live deploy + curl smoke tests all pass
- [ ] No edits outside `worker/worker.js`
- [ ] DECISIONS.md entry written with: verdict, files changed, deployed Worker version ID, smoke test output (1–2 lines), known gaps for W2 (e.g. "frontend not yet built")
- [ ] Did NOT touch CLAUDE.md, PRICING.md, pricing-config.js, or any other game's files

---

## What you DON'T do in W1

- No frontend code (`/games/realm-war/` directory does not exist yet — W2's job)
- No nav addition (W5)
- No cache layer (W3)
- No README.md inside `/games/realm-war/` (W5 writes that with full game description)
- No new specs for W2+ (Opus writes those after W1 lands)

If something in this spec is ambiguous: name the ambiguity in your DECISIONS entry as an "open question for Opus on W2." Do not silently make a design choice.

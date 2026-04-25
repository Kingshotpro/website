# Oath and Bone — Cache Layer Log

*Worker 22 handoff for Workers 24+ and any future session touching client
persistence. Written 2026-04-25. Reflects the three Concern commits on this
branch.*

---

## 0. What Worker 22 shipped

| File | Status |
|---|---|
| `js/oath-and-bone-cache.js` | New, ~290 lines. Exposes `window.OathAndBoneCache`. |
| `js/game-oath-and-bone.js` | Modified: init routes through cache; resume-prompt check added; DEV button. |
| `js/game-oath-and-bone-engine.js` | Modified: `_pushStateToCache`, `_snapshotBattle`, `getBattleSnapshot`, `resumeBattle` added. |
| `js/game-oath-and-bone-render.js` | Modified: `_saveToServer` routes through cache; `_showResumePrompt` + `clearBattleSnapshot` call in `showBattleEnd`. |
| `games/oath-and-bone.html` | Modified: `oath-and-bone-server.js` + `oath-and-bone-cache.js` script tags added before engine. |

---

## 1. localStorage key schema

All keys live in `localStorage` under the `ksp_oab_` namespace, mirroring
the server KV namespace (`oab_*` in Cloudflare KV).

| Key | Shape | Purpose |
|---|---|---|
| `ksp_oab_state` | JSON (canonical save doc) | Full cached copy of `oab_state_<fid>`. Written synchronously on every `setState()`. |
| `ksp_oab_history_<YYYY-MM>` | JSON array | Current month's battle outcomes, written immediately on `recordBattleResult()` before the server responds. |
| `ksp_oab_pending_writes` | JSON array of `{ ts }` | Queue of unsynced state changes. Populated by `setState()`; drained by `syncToServer()`. Survives page reloads. |
| `ksp_oab_last_sync_iso` | ISO-8601 string | Timestamp of the last successful `syncToServer()` or `syncFromServer()`. Used by the focus-return re-sync to decide if cache is stale (> 60s). |
| `ksp_oab_battle_resume` | JSON (`{ version, ts, battle }`) | Mid-battle snapshot. Written on every turn-tick and after every action that changes unit state. Read by the orchestrator on init. |

**Key shape mirrors server KV:** `ksp_oab_state` mirrors `oab_state_<fid>`
exactly — same field names, same types. If Worker 23 extends the state schema,
update `DEFAULT_STATE` in `oath-and-bone-cache.js` to match.

---

## 2. Sync timing

```
Player action
     │
     ▼
setState(state)           ← synchronous localStorage write (< 1ms)
     │
     ├── ksp_oab_state updated immediately (instant UI reads)
     ├── ksp_oab_pending_writes gets a new entry
     └── _scheduleSave() → 500ms debounce timer reset
              │
              └── (500ms idle) → syncToServer()
                       │
                       ├── success: ksp_oab_last_sync_iso updated, version/last_save_iso merged
                       └── failure: entry re-added to pending_writes, next action retries
```

**pagehide flush:** On `window pagehide`, any pending writes are flushed
via `navigator.sendBeacon('/oath-and-bone/save', blob)`. sendBeacon sends the
`ksp_session` cookie automatically (same-origin cookie policy applies). The
response is opaque (no-cors mode) — we don't wait for it, but the server
processes the save. Fallback to `syncToServer()` if sendBeacon unavailable.

**Focus re-sync:** On `window focus`, if `ksp_oab_last_sync_iso` is > 60s
old, `syncFromServer()` runs and overwrites the cache if the server is newer.
This keeps a player who uses the game across multiple tabs or devices from
diverging.

---

## 3. Conflict-resolution rules

Server is always canonical authority on:
- `crown_balance` — server value overwrites cache on every server response.
- `fallen_heroes` — server unions client list with server list (permadeath
  floor). Client can never shrink `fallen_heroes`.
- `unlocked_scenarios` — server unions on victory. Client can never de-unlock.
- `version` / `last_save_iso` — server sets these; client stores them but
  never invents them.

**On `syncFromServer()`:** If `server.state.last_save_iso > cache.last_save_iso`,
overwrite cache with server state and clear `ksp_oab_pending_writes`. If server
is older or equal, keep cache (local progress wins — server will catch up on the
next `syncToServer()`).

**On `spend()`:** Optimistic cache debit is reverted immediately if the server
returns anything other than `{ ok: true }`. The reverted balance is the
pre-debit value from `cache.crown_balance`, not from the server response
(server response carries authoritative balance in `res.balance` only on 402).

---

## 4. Offline behavior

`isOffline()` returns `true` for 30 seconds after any server call fails
(network error or non-2xx response other than 401/400).

While offline:
- `getState()`, `getCrownBalance()`, `loadBattleSnapshot()` work normally
  from localStorage.
- `setState()` writes to localStorage and queues a pending write as usual.
- `syncToServer()` attempts the save; on failure it re-queues for the next
  debounce cycle.
- `spend()` attempts the server call; on network failure it reverts the
  optimistic debit and shows a toast.
- `recordBattleResult()` writes local history immediately; server call is
  attempted but failure is non-blocking.

When the player comes back online, the first `setState()` schedules a
`syncToServer()` which flushes whatever was queued. The focus listener also
triggers a `syncFromServer()` if the cache is stale, ensuring the server and
client converge.

**Anonymous / unlinked players** (401 / 400 `fid_not_linked` from server):
`syncFromServer()` treats these as non-error. It falls back to
`ksp_oab_state` (or `DEFAULT_STATE` on first visit) and shows a persistent
sign-in banner. All localStorage operations work normally. If the player
later signs in and links their FID, call `OathAndBoneCache.syncFromServer()`
again — the cache's pending state will be flushed to the server via the
normal `setState()` → `syncToServer()` path.

---

## 5. Mid-battle snapshot format + version

Written to `ksp_oab_battle_resume`. Outer wrapper:

```json
{
  "version": 1,
  "ts": "2026-04-25T14:32:00.000Z",
  "battle": { ...engine snapshot... }
}
```

**`version`** must equal `SNAPSHOT_VERSION` (currently `1`) in
`oath-and-bone-cache.js`. On mismatch, `loadBattleSnapshot()` discards the
snapshot and returns `null`. Bump `SNAPSHOT_VERSION` whenever `_battle` shape
changes (new fields added to units, tiles, or top-level). Never bump without
verifying the `resumeBattle()` method in engine.js handles the new fields.

**Engine snapshot (`battle` field):**

```json
{
  "tiles": {
    "0,0": { "q": 0, "r": 0, "terrain": "plain", "elevation": 0,
             "tile_mods": [], "unit": "player_vael_1" },
    ...
  },
  "units": {
    "player_vael_1": {
      "id": "player_vael_1", "heroId": "vael", "team": "player",
      "q": 3, "r": 4,
      "hp": 18, "hp_max": 24,
      "move": 4, "attack_range": 1, "attack_dmg": 6,
      "initiative": 8, "defense": 2,
      "acted": false,
      "permadeath_loss": false, "permadeath_game_over": false,
      "magic": null,
      "status_effects": [],
      "abilityCooldowns": {},
      "passive_defense_bonus": 0,
      "took_damage_this_turn": false
    },
    ...
  },
  "turnQueue": ["player_vael_1", "enemy_bladewind_a"],
  "turnIndex": 1,
  "round": 3,
  "phase": "active",
  "scenarioId": "b1",
  "tutorials_fired": { "T1": true },
  "playerHoldUsed": false
}
```

`scenarioId` is stored instead of the full scenario object (which contains
the map, hexTypes, unit definitions — several KB). On `resumeBattle()`, the
engine reloads the scenario from `window.OathAndBoneScenarios[scenarioId]`.
If `OathAndBoneScenarios` doesn't have that ID, resume silently falls back
to an empty scenario reference (battle still restores, but terrain won't render).

**Snapshot is cleared** by `showBattleEnd()` in render.js (victory / defeat /
flee) and by the "Start fresh" button in the resume prompt. It is also
discarded automatically by `loadBattleSnapshot()` if > 24h old.

---

## 6. Worker 24 hook — spending Crowns through the cache

Worker 24 (shop / pricing) should call `OathAndBoneCache.spend()` instead
of `OathAndBoneServer.spend()` directly. This gives the player instant visual
feedback (optimistic balance debit) and handles all revert/error paths.

```js
// Worker 24 usage (shop UI — click confirm):
window.OathAndBoneCache.spend(itemCost, itemId, 'shop')
  .then(function (res) {
    if (res && res.ok) {
      // Purchase confirmed. res.new_balance is the server-authoritative balance.
      // OathAndBoneCache already updated ksp_oab_state.crown_balance.
      updateShopBalanceDisplay(res.new_balance);
      unlockItem(itemId);
    } else if (res && res.__status === 402) {
      // res.balance is the real server balance shown in the modal.
      // Cache already reverted the optimistic debit.
      showInsufficientCrownsModal(res.balance);
    }
    // Non-402 errors: cache reverted + toast shown automatically.
  })
  .catch(function () {
    // Network error: cache reverted + toast shown automatically.
  });
```

`OathAndBoneCache.getCrownBalance()` is a synchronous fast path for rendering
the balance in the shop header before a network round-trip:

```js
// On shop open — instant display, no async needed:
var balance = window.OathAndBoneCache.getCrownBalance();
shopHeaderBalanceEl.textContent = balance + ' \u2694';
```

The `context` parameter for shop purchases must be `'shop'` (server validates
`context ∈ {shop, boost, training}`).

---

## 7. Worker 24 additions to the cache API

### New DEFAULT_STATE fields

| Field | Type | Default | Purpose |
|---|---|---|---|
| `inventory` | array | `[]` | Owned shop items. Each entry: `{item_id, quantity, acquired_ts}`. Client-side only until a Worker extends the save endpoint. |
| `campaign_pass_active` | boolean | `false` | Campaign Pass or Chapter Pass active flag. Server is canonical. |
| `pass_expires_iso` | ISO string or null | `null` | Pass expiry datetime. `isCampaignPassActive()` compares this to `new Date().toISOString()`. |
| `active_xp_boost` | object or null | `null` | `{factor: 0.2, battles_remaining: 1}` when a rewarded-ad XP boost is queued. Engine calls `consumeXpBoost()` after applying the multiplier. |

### New public methods

| Method | Signature | Notes |
|---|---|---|
| `getInventory()` | `() → [{item_id, quantity, acquired_ts}]` | Synchronous flat-list read. |
| `addInventoryItem(itemId)` | `(string) → void` | Increments quantity if already owned; appends new entry otherwise. Calls `setState()` so the save debounce fires. |
| `isCampaignPassActive()` | `() → boolean` | Client-side fast path. Checks `campaign_pass_active && pass_expires_iso > now`. |
| `applyXpBoost(factor, battles)` | `(number, number) → void` | Sets `active_xp_boost`. Called by rewarded-ad completion handler. |
| `getXpBoost()` | `() → {factor, battles_remaining} | null` | Engine reads this at battle-end XP grant. Returns null when no boost queued. |
| `consumeXpBoost()` | `() → void` | Decrements `battles_remaining`; clears field at 0. Engine calls this after applying. |

### No-P2W note

`addInventoryItem` and `getInventory` are used by the Crown shop. No item in the shop table grants a combat stat not also obtainable through play (see ECONOMY.md §10 verification). Inventory tracks ownership only; equip/use-in-battle is V2 scope. The cache makes no distinction between "earned" and "purchased" items — server may add that distinction later if leaderboard anti-cheat requires it.

---

## 8. V2 items

| Item | Notes |
|---|---|
| Cross-device sync UI | When `syncFromServer()` detects the server is newer (returned a state with `last_save_iso` ahead of cache), show a brief banner: "Progress updated from another device." Currently silent. |
| Conflict-merge prompt | If cache has unsynced pending writes AND server returns a newer state, the current logic silently discards local pending changes (server wins). For a future with offline gameplay and crown earning, a merge prompt ("You played offline — X Crowns earned. Sync?") would be more user-friendly. |
| Snapshot history beyond latest | Only the most recent in-flight snapshot is stored. A two-snapshot ring buffer would let the player recover from a partially-resumed battle that crashed mid-restore. |
| sendBeacon auth on cross-origin | sendBeacon sends cookies for the target URL's origin. If the game is ever served from a different origin than `kingshotpro.workers.dev`, the session cookie will not be sent and pagehide saves will silently fail. Use a same-origin proxy or the Fetch keepalive flag as a fallback in that case. |
| Stale scenario on resume | If `window.OathAndBoneScenarios[snapshotId]` is missing (e.g. scenario data script hasn't loaded yet), `resumeBattle()` restores units/tiles but `_battle.scenario` is null. Terrain renders via the tile-level `terrain` string (already in the snapshot), but scenario-level data (difficultyTier, tutorials) is absent. Guard: check OathAndBoneScenarios[id] exists before showing the resume prompt. |

---

*Worker 22, 2026-04-25. Three Concern commits + this doc. Not deployed —
Worker 23's endpoints are also not deployed yet (pending Architect `wrangler deploy`).*

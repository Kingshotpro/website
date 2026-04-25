# UX_LOG.md — Worker 20 handoff

## Concern 1: Tutorial overlay (B1 first-play onboarding)

### What shipped

Three tutorial triggers wired end-to-end: engine detects the event, fires
`onTutorialTrigger(triggerId)`, renderer shows a blocking modal, "Got it"
writes to localStorage and resumes the game.

**T1 — Troop triangle** (fires on first player attack)
> "Troop triangle: infantry beats cavalry · cavalry beats archer · archer beats infantry. +20% damage on favorable matchup."

**T2 — Elevation** (fires on first ranged attack from elevation ≥ 2 firing downward)
> "Elevation: +20% damage attacking down, -20% attacking up. Ranged attacks gain +1 hex range firing down."

**T3 — Hold** (fires at start of round 3 if no player unit used Hold in rounds 1–2)
> "Hold: end a unit's turn early to accumulate Resolve and regen partial resources."

### Dual gate

- Session gate: `_battle.tutorials_fired[triggerId]` in engine — blocks same trigger firing twice per page load.
- Persistent gate: `localStorage['ksp_oathandbone_tutorials_seen']` JSON array — "Got it" appends triggerId. Trigger never fires again for that user.

### Pause architecture

- `_tutorialModalOpen` boolean (render.js) checked at the top of every action handler: `handleCanvasClick`, `handleMoveBtn`, `handleAttackBtn`, `handleCastBtn`, `handleAbilityBtn`, `handleHoldBtn`.
- `_scheduleEnemyTick()` returns early when `_tutorialModalOpen` is true.
- Post-attack 1200ms timeout sets `_pendingAdvance = true` instead of calling `_doAdvanceTurn()` when a tutorial modal is open (T1/T2 fire inside `attackUnit()`). The "Got it" handler detects `_pendingAdvance` and calls `_doAdvanceTurn()` to complete the turn cleanly.
- T3 fires during round-start (not inside an attack timeout), so `_pendingAdvance` is false on its dismiss — "Got it" calls `render() + _scheduleEnemyTick()` directly.

### Modal chrome

`position: fixed` overlay appended to `document.body` (not the stage), so it covers the full viewport including the action panel below the canvas stage. Z-index 9000. Blue FFT-panel gradient (`#18284a → #0e1a34`, border `#3a5a9a`), matching the action panel chrome.

---

## Concern 2: Battle results screen

### What shipped

`showBattleEnd(result)` in render.js replaced. The overlay now shows a full results panel on top of the battle canvas.

**Layout (top to bottom):**

1. **VICTORY** (gold `#f0c040`) or **DEFEAT** (red `#e05c5c`) — visual Soul Review channel (ch. 1)
2. **Reward rows** — XP ⭐, Crowns ⨀, Credits ⊙ — numerical Soul Review channel (ch. 3)
   - Victory: reads `scenario.rewards.xp[tier]` and `scenario.rewards.crowns × difficulty_tiers[tier].reward_mult`
   - Defeat: 15 XP + 10 Crowns (ECONOMY.md §2 consolation grant)
3. **Crown balance div** — hidden; revealed with `new_crown_balance` after server responds
4. **Save status div** — shown with error text if server call fails
5. **Heroes lost section** — player units where `permadeath_loss === true`, named; or "All heroes survived." in green
6. **Advisor voice barb** (italic) — random from hardcoded set per result — narrative Soul Review channel (ch. 4)
7. **Continue** + **Replay** buttons — both call `window.location.reload()` for now (full nav is Worker 21 scope)

### Server save

Non-blocking call to `window.OathAndBoneServer.recordBattleResult(...)` after DOM is rendered.

Payload:
```
scenarioId:     scenario.id.toUpperCase()  (e.g. 'B1')
outcome:        result                     ('victory' | 'defeat')
heroesLost:     [heroId, ...]              from permadeath_loss units
xpEarned:       rewards.xp
crownsEarned:   rewards.crowns
difficultyTier: tier
```

On success: reveals Crown balance div with `new_crown_balance`.
On failure (non-ok response or network error): sets `saveStatusEl.textContent` to "Save failed — will sync on next play." Never blocks UI.

### Soul Review channels (4 required)

| Channel | What fires it |
|---------|--------------|
| 1 — Visual | VICTORY/DEFEAT title rendered in gold/red |
| 2 — Audio | **TODO Worker 25** — wire chime to `oab:battleend` CustomEvent (see comment in `showBattleEnd`) |
| 3 — Numerical | XP + Crowns + Credits rows displayed |
| 4 — Narrative | Advisor voice barb (random, per result) |

### Worker 25 audio hook

The `oab:battleend` CustomEvent is documented in a TODO comment inside `showBattleEnd`. When Worker 25 wires audio:

```js
overlay.dispatchEvent(new CustomEvent('oab:battleend', {
  bubbles: true,
  detail: { result: result }
}));
```

Wire a listener on `document` (or `_stage`) that fires victory chime on `result === 'victory'` and defeat tone on `result === 'defeat'`.

---

## Worker 22 note — localStorage key format

Tutorial seen array:
```
key:   ksp_oathandbone_tutorials_seen
value: JSON array of trigger ID strings, e.g. ["T1","T3"]
```

Client-persist (Worker 22) should treat this key as read-only (renderer owns writes). Do not overwrite on save/load — merge or leave untouched.

---

## Commits

| SHA | Message |
|-----|---------|
| `6a82e19` | Worker 20: tutorial overlay — T1/T2/T3 first-play onboarding with localStorage gate |
| `a057efa` | Worker 20: battle results screen with reward breakdown and server save call |

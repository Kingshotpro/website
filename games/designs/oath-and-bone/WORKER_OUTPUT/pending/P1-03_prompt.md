# P1-03 Delegation Prompt — game-oath-and-bone.js orchestrator skeleton

## Context

You are writing the top-level orchestrator/wiring module for Oath and Bone, a tactical RPG browser game. This file (`js/game-oath-and-bone.js`) is the entry point that:
- Declares the game's global namespace
- Implements the daily gate (one play per day)
- Wires Advisor XP and observation calls
- Provides an `init()` function that the HTML page calls
- Connects to future engine modules (which do NOT exist yet — leave stubs)

## Pattern to follow

This project uses an IIFE (immediately-invoked function expression) pattern for game modules. Reference the pattern from `game-vault-trial.js` (NOT its content, just its structural shape):

```javascript
(function () {
  'use strict';

  // Constants
  var TODAY = new Date().toISOString().slice(0, 10);
  var PLAYED_KEY = '...';
  
  // Helper functions
  
  // Init: called by the page
  function init() {
    var container = document.getElementById('...');
    if (!container) return;
    // ...
  }

  // Expose init
  window.OathAndBone = window.OathAndBone || {};
  window.OathAndBone.init = init;
}());
```

## Exact identifiers to use (do not change these)

```javascript
PLAYED_KEY:       'ksp_oathandbone_played'
TUTORIALS_KEY:    'ksp_oathandbone_tutorials_seen'
CONTAINER_ID:     'oathandbone-game'
NAMESPACE:        window.OathAndBone
XP_ACTION:        'oathandbone_battle_victory'
OBSERVE_CATEGORY: 'oathandbone'
```

## Advisor wiring integration points

These calls must be present in the skeleton as named stub functions (the engine modules call them when they are ready). Do not implement the engine — write the hooks so the engine can call in:

```javascript
// Called by engine when a battle ends with Sergeant+ difficulty win
// advisor.js line 259: Advisor.grantXP(action, amount)
OathAndBone.onBattleVictory = function(difficultyTier, heroesAlive) {
  if (!difficultyTier || difficultyTier === 'scout') return; // no XP for Scout
  var base = difficultyTier === 'marshal' ? 30 : 20;
  if (typeof Advisor !== 'undefined' && Advisor.grantXP) {
    Advisor.grantXP('oathandbone_battle_victory', Math.round(base * (Advisor.getMultiplier ? Advisor.getMultiplier() : 1)));
  }
};

// Called by engine at any observable game moment
// advisor.js line 286: Advisor.observe(category, key, value)
OathAndBone.observe = function(key, value) {
  if (typeof Advisor !== 'undefined' && Advisor.observe) {
    Advisor.observe('oathandbone', key, value);
  }
};

// Called by engine at battle end (any result) — sets daily gate
OathAndBone.onBattleEnd = function(result) {
  try {
    localStorage.setItem('ksp_oathandbone_played', new Date().toISOString().slice(0, 10));
  } catch (e) {}
  // SOUL REVIEW: battle end must fire 3+ feedback channels
  // Channel 1 (visual): engine triggers battle-result overlay — engine's responsibility
  // Channel 2 (audio): engine triggers victory/defeat sound — engine's responsibility
  // Channel 3 (numerical): XP granted is shown in overlay — see onBattleVictory
  // This function signals the engine to fire those channels.
};
```

## Daily gate

```javascript
function alreadyPlayed() {
  try {
    return localStorage.getItem('ksp_oathandbone_played') === new Date().toISOString().slice(0, 10);
  } catch (e) { return false; }
}
```

When `alreadyPlayed()` returns true, display a "Practice mode" message — the player can still play but earns no XP or credits. Daily gate must be checked at battle START (not init) so the player can browse/read but not farm XP.

## What the init() function does

1. Find `document.getElementById('oathandbone-game')`. If missing, return silently.
2. Show a loading state while engine modules initialize.
3. Once engine is ready (polled via `window.OathAndBoneEngine`), call `OathAndBoneEngine.start(container, { practiceMode: alreadyPlayed() })`.
4. If engine is not ready after 5 seconds, show an error message in the container.

`window.OathAndBoneEngine` is a stub — it will be set by a future engine module (P1-04). This file just waits for it.

## Disclaimer requirement

Include this as a constant and render it in the loading state HTML:

```javascript
var DISCLAIMER = 'Unofficial. Not affiliated with Century Games.';
```

The disclaimer must appear in any user-visible HTML this file renders.

## CONSTRAINTS (do not remove, do not paraphrase)

- This is Oath and Bone, an unofficial fan-made game. Add "Unofficial. Not affiliated with Century Games." to any user-facing string output.
- Do NOT use any of these 27 canonical Kingshot hero names: Amadeus, Jabel, Helga, Saul, Zoe, Hilde, Marlin, Petra, Eric, Jaeger, Rosa, Alcar, Margot, Vivian, Thrud, Long Fei, Yang, Sophia, Triton, Chenko, Amane, Yeonwoo, Gordon, Howard, Quinn, Diana, Fahd.
- Economy rule: paying players accelerate; they do not access content unavailable to free players. No revive-for-currency. No energy gates. No lootboxes. Practice mode is free and unrestricted — just no XP/credit earn.
- Permadeath is real — but this skeleton does not implement it. Leave a comment: `// Permadeath flag: OathAndBone.onHeroDeath(heroId) — called by engine. Never cleared. See P1-09.`
- Do NOT hardcode any $ price. Credit costs must read from `window.KSP_PRICING.oathandbone.*` if shown. This skeleton does not show prices — just include the pattern comment.
- Do NOT use the word "Crownsmoke" anywhere in this file. The game is called "Oath and Bone."

## Verification criteria (check before returning)

- [ ] `window.OathAndBone` namespace declared
- [ ] PLAYED_KEY is `'ksp_oathandbone_played'` exactly
- [ ] `onBattleVictory` skips Scout tier (no XP), grants XP for Sergeant+ 
- [ ] `onBattleEnd` sets daily gate in localStorage
- [ ] `DISCLAIMER` constant is present and appears in rendered HTML
- [ ] No canonical Kingshot hero name appears in any string, variable, or comment
- [ ] No price hardcoded
- [ ] `// Crownsmoke` does not appear
- [ ] `window.OathAndBoneEngine` is referenced as the engine stub (not implemented)

## Output

One self-contained JavaScript file. No markdown. No code fences. Just the JS.

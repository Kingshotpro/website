(function () {
  'use strict';

  // Constants
  var TODAY = new Date().toISOString().slice(0, 10);
  var PLAYED_KEY = 'ksp_oathandbone_played';
  var TUTORIALS_KEY = 'ksp_oathandbone_tutorials_seen';
  var CONTAINER_ID = 'oathandbone-game';
  var XP_ACTION = 'oathandbone_battle_victory';
  var OBSERVE_CATEGORY = 'oathandbone';
  var DISCLAIMER = 'Unofficial. Not affiliated with Century Games.';

  // Expose namespace early for engine hooks and init function
  window.OathAndBone = window.OathAndBone || {};
  var NAMESPACE = window.OathAndBone;

  // Helper functions
  function alreadyPlayed() {
    try {
      return localStorage.getItem(PLAYED_KEY) === TODAY;
    } catch (e) {
      console.warn('Oath and Bone: localStorage access denied or error for ' + PLAYED_KEY, e);
      return false;
    }
  }

  function showLoadingState(container, message, isError) {
    if (!container) return;
    container.innerHTML = `
      <div style="
        font-family: sans-serif;
        padding: 20px;
        text-align: center;
        color: ${isError ? '#8b0000' : '#333'};
        border: 1px solid ${isError ? '#f00' : '#ddd'};
        background-color: ${isError ? '#ffebeb' : '#f9f9f9'};
        border-radius: 5px;
        max-width: 600px;
        margin: 50px auto;
      ">
        <h2>Oath and Bone</h2>
        <p>${message}</p>
        <p style="font-size: 0.8em; color: #666;">${DISCLAIMER}</p>
      </div>
    `;
  }

  // Advisor wiring integration points (stub functions for the engine to call)

  /**
   * Called by engine when a battle ends with Sergeant+ difficulty win.
   * Grants XP to the Advisor.
   * advisor.js line 259: Advisor.grantXP(action, amount)
   * @param {string} difficultyTier - 'scout', 'sergeant', 'lieutenant', 'captain', 'marshal'
   * @param {number} heroesAlive - Number of heroes alive at victory (not used for XP calc here, but good context)
   */
  NAMESPACE.onBattleVictory = function(difficultyTier, heroesAlive) {
    if (!difficultyTier || difficultyTier === 'scout') return; // no XP for Scout tier battles

    var baseXP = 20; // Default XP for Sergeant, Lieutenant, Captain
    if (difficultyTier === 'marshal') {
      baseXP = 30; // Increased XP for Marshal tier
    }

    var finalXP = baseXP;
    if (typeof Advisor !== 'undefined' && Advisor.grantXP) {
      if (typeof Advisor.getMultiplier === 'function') {
        finalXP = Math.round(baseXP * Advisor.getMultiplier());
      }
      Advisor.grantXP(XP_ACTION, finalXP);
      console.log(`Oath and Bone: Granted ${finalXP} XP for ${difficultyTier} victory.`);
    } else {
      console.warn('Oath and Bone: Advisor.grantXP not available. XP not granted.');
    }
  };

  /**
   * Called by engine at any observable game moment to log data with Advisor.
   * advisor.js line 286: Advisor.observe(category, key, value)
   * @param {string} key - The observation key.
   * @param {*} value - The value associated with the observation.
   */
  NAMESPACE.observe = function(key, value) {
    if (typeof Advisor !== 'undefined' && Advisor.observe) {
      Advisor.observe(OBSERVE_CATEGORY, key, value);
    } else {
      console.warn('Oath and Bone: Advisor.observe not available. Observation not logged.');
    }
  };

  /**
   * Called by engine at battle end (any result) — sets daily gate.
   * @param {string} result - 'victory', 'defeat', 'flee' etc.
   */
  NAMESPACE.onBattleEnd = function(result) {
    try {
      localStorage.setItem(PLAYED_KEY, TODAY);
      console.log(`Oath and Bone: Daily gate set to prevent further XP/credit gain today (${TODAY}).`);
    } catch (e) {
      console.warn('Oath and Bone: Failed to set daily gate in localStorage.', e);
    }
    // SOUL REVIEW: battle end must fire 3+ feedback channels
    // Channel 1 (visual): engine triggers battle-result overlay — engine's responsibility
    // Channel 2 (audio): engine triggers victory/defeat sound — engine's responsibility
    // Channel 3 (numerical): XP granted is shown in overlay — see onBattleVictory
    // This function signals the engine to fire those channels.
  };

  /**
   * Permadeath flag: OathAndBone.onHeroDeath(heroId) — called by engine. Never cleared. See P1-09.
   * This function is a stub. Future logic will handle permanent hero loss.
   * @param {string} heroId - Identifier of the hero that died.
   */
  NAMESPACE.onHeroDeath = function(heroId) {
    console.log(`Oath and Bone: Hero ${heroId} has permanently fallen.`);
    // Future implementation will save this status in persistent storage.
  };

  /**
   * Called by engine when a player attempts to purchase an item.
   * Do NOT hardcode any $ price. Credit costs must read from window.KSP_PRICING.oathandbone.* if shown.
   * This function is a stub.
   * @param {string} itemId - Identifier of the item being purchased.
   */
  NAMESPACE.onPurchaseAttempt = function(itemId) {
    console.log(`Oath and Bone: Purchase attempt for item: ${itemId}. Prices would be sourced from window.KSP_PRICING.oathandbone.${itemId}.cost`);
    // Future implementation will integrate with pricing data and payment systems.
  };

  // Init: called by the HTML page to start the game
  async function init() {
    var container = document.getElementById(CONTAINER_ID);
    if (!container) {
      console.error('Oath and Bone: Game container element not found (ID: ' + CONTAINER_ID + '). Cannot initialize.');
      return;
    }

    showLoadingState(container, 'Loading Oath and Bone engine. Please wait...');

    // Load state through cache layer (OathAndBoneCache → OathAndBoneServer).
    // syncFromServer() handles: auth fallback, conflict resolution, offline
    // tolerance, and sign-in banner for anonymous players.
    var state;
    if (window.OathAndBoneCache) {
      state = await window.OathAndBoneCache.syncFromServer();
    } else {
      // Cache module absent (mis-ordered script tags). Fall back to direct server
      // call so the game still loads, but without offline tolerance.
      state = { hero_state: {}, crown_balance: 0, equipped: {},
                learned_spells: [], fallen_heroes: [],
                current_chapter: 1, current_battle: 'b1',
                unlocked_scenarios: ['b1'], last_save_iso: null, version: 0 };
      try {
        if (window.OathAndBoneServer) {
          var fallbackRes = await window.OathAndBoneServer.load();
          if (fallbackRes && fallbackRes.ok && fallbackRes.state) {
            state = fallbackRes.state;
          }
        }
      } catch (e) {
        console.warn('Oath and Bone: fallback server load failed.', e);
      }
    }

    // firstLoad is true when the player has never saved to the server.
    // last_save_iso is null on first-ever load (server default state).
    var firstLoad = !state.last_save_iso;

    NAMESPACE.currentState = state;

    // ── DEV MODE: Crown spend test button ──────────────────────────────────
    // Visible only when URL contains ?dev. Lets Worker 24 verify the
    // spend round-trip before wiring the real shop UI.
    if (window.location.search.indexOf('dev') !== -1 && window.OathAndBoneCache) {
      var devBtn = document.createElement('button');
      devBtn.textContent = '[DEV] Spend 10 Crowns';
      devBtn.style.cssText = [
        'position:fixed', 'bottom:60px', 'right:10px', 'z-index:9999',
        'font-size:11px', 'padding:6px 10px',
        'background:#1a3870', 'border:1px solid #3a5a9a', 'color:#c0d4f0',
        'cursor:pointer', 'border-radius:3px', 'font-family:sans-serif'
      ].join(';');
      devBtn.addEventListener('click', function () {
        window.OathAndBoneCache.spend(10, 'dev_test_item', 'shop')
          .then(function (res) {
            console.log('[DEV] Spend result:', res);
            alert('[DEV] Spend result:\n' + JSON.stringify(res, null, 2));
          })
          .catch(function (e) {
            console.error('[DEV] Spend error:', e);
            alert('[DEV] Spend error: ' + e.message);
          });
      });
      document.body.appendChild(devBtn);
    }

    var pollStartTime = Date.now();
    var maxPollTime   = 5000;
    var pollInterval  = 100;

    // Check for a mid-battle resume snapshot BEFORE rendering the world map
    // or starting a fresh battle. Snapshot is validated in loadBattleSnapshot
    // (version check + 24h TTL). If valid, show the "Resume battle?" prompt.
    var resumeSnapshot = (window.OathAndBoneCache)
      ? window.OathAndBoneCache.loadBattleSnapshot()
      : null;

    function launchNormalFlow() {
      var scenarioId = state.current_battle || 'b1';
      var scenarios  = window.OathAndBoneScenarios;
      var scenario   = (scenarios && (scenarios[scenarioId] || scenarios['b1'])) || null;
      if (scenario && window.OathAndBoneEngine.loadScenario) {
        window.OathAndBoneEngine.loadScenario(scenario);
      }
      var practiceModeActive = alreadyPlayed();
      if (practiceModeActive) {
        console.log('Oath and Bone: Daily gate active. Starting in practice mode.');
      }
      if (!firstLoad && window.OathAndBoneRender && window.OathAndBoneRender.showWorldMap) {
        window.OathAndBoneRender.showWorldMap(container, state);
      } else {
        window.OathAndBoneEngine.start(container, { practiceMode: practiceModeActive });
      }
    }

    function pollForEngine() {
      if (window.OathAndBoneEngine) {
        console.log('Oath and Bone: Engine detected. Attempting to start...');
        try {
          if (resumeSnapshot && window.OathAndBoneRender && window.OathAndBoneRender.showResumePrompt) {
            // Show "Resume battle?" in the FFT blue panel.
            window.OathAndBoneRender.showResumePrompt(
              container,
              resumeSnapshot,
              function onResume() {
                // Player chose to resume — restore the battle.
                console.log('Oath and Bone: Resuming battle from snapshot (round ' +
                  resumeSnapshot.battle.round + ', scenario ' +
                  resumeSnapshot.battle.scenarioId + ').');
                window.OathAndBoneEngine.resumeBattle(container, resumeSnapshot.battle);
              },
              function onDiscard() {
                // Player chose to start fresh — clear snapshot, normal flow.
                console.log('Oath and Bone: Discarded resume snapshot. Starting fresh.');
                window.OathAndBoneCache.clearBattleSnapshot();
                launchNormalFlow();
              }
            );
          } else {
            // No valid snapshot — normal world-map / first-time flow.
            launchNormalFlow();
          }
        } catch (e) {
          console.error('Oath and Bone: Error starting engine:', e);
          showLoadingState(container, 'An error occurred while starting the game engine. Please try again. ' + DISCLAIMER, true);
        }
      } else if (Date.now() - pollStartTime < maxPollTime) {
        setTimeout(pollForEngine, pollInterval);
      } else {
        console.error('Oath and Bone: Engine module "window.OathAndBoneEngine" not found after ' + (maxPollTime / 1000) + ' seconds.');
        showLoadingState(container, 'Failed to load game engine. Please refresh the page. ' + DISCLAIMER, true);
      }
    }

    pollForEngine();
  }

  // Expose init function to the global OathAndBone namespace
  NAMESPACE.init = init;
}());

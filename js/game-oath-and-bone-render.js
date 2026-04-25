(function () {
  'use strict';

  // Reads:  window.OathAndBoneEngine, SCENARIO_B1, HERO_DEFINITIONS,
  //         window.OathAndBoneSpells, window.OathAndBoneAI
  // Exports: window.OathAndBoneRender = { init(container, scenario) }
  //
  // TOPOLOGY NOTE: Engine uses hex 6-neighbor axial (q,r). This renderer
  // uses the same 2:1 iso projection as the preview (x = PAD_X + (q-r)*TW/2,
  // y = PAD_Y + (q+r)*TH/2). The hex movement rules come from the engine's
  // pathfinding; the visual result looks identical to 2:1 square iso but
  // movement/combat uses 6 hex directions. See RENDER_LOG.md §Visual §Topology.

  // ── CONFIG ───────────────────────────────────────────────────────────
  var TILE_W  = 64;
  var TILE_H  = 32;
  var BLOCK_H = 22;    // elevation stack step height (px)
  var SPRITE_W = 48;
  var SPRITE_H = 72;
  var MAP_W   = 12;    // q: 0–11
  var MAP_H   = 14;    // r: 0–13

  // Canvas origin. x: leftmost tile (q=0,r=13) left-vertex = PAD_X - 13*32.
  // Keep ≥ 0 → PAD_X ≥ 416. y: top tile plus lift headroom.
  var PAD_X    = 450;
  var PAD_Y    = 80;
  var CANVAS_W = 920;
  var CANVAS_H = 560;

  // Art root (absolute, served from KingshotPro/)
  var ART = '/games/designs/oath-and-bone/art';

  // Units that have Worker-14 pixel sprites on disk
  var SPRITE_UNITS = { vael: 1, caelen: 1, bladewind: 1, ironwall: 1 };

  // ── MODULE STATE ─────────────────────────────────────────────────────
  var _container       = null;
  var _canvas          = null;
  var _ctx             = null;
  var _stage           = null;
  var _selectedUnitId  = null;
  var _moveMode        = false;
  var _moveHexes       = [];    // [{q,r}] from engine.getMovableHexes()
  var _attackMode      = false;
  var _attackHexes     = [];    // [{q,r}] from engine.getAttackableHexes()
  var _enemyTickBusy   = false; // prevents stacked enemy-turn timers
  var _animating       = false; // true while a slide animation is running — defers render + tick
  var _castMode        = false;
  var _castSpellId     = null;
  var _castHexes       = [];    // [{q,r}] valid target hexes for selected spell
  var _abilityMode     = false;
  var _abilityId       = null;
  var _abilityHexes    = [];    // [{q,r}] valid target hexes for selected ability
  var _tileImgCache       = {};    // terrain → HTMLImageElement (Concern 1)
  var _mapScale           = 1;     // CSS scale applied to stage (Concern 2)
  var _resizeTimer        = null;  // throttle handle for window resize
  var _hoveredHex         = null;  // {q,r} under cursor, or null (Concern 3)
  var _tutorialModalOpen  = false; // true while a tutorial modal is blocking interaction
  var _pendingAdvance     = false; // true when advanceTurn should fire after tutorial dismiss
  var _pendingBattleEnd   = null;  // 'victory'|'defeat' queued while tutorial modal is open

  // ── ISO PROJECTION ───────────────────────────────────────────────────
  // Same 2:1 iso formula as the preview. Hex topology comes from engine
  // pathfinding; the visual grid looks like standard diamond iso.
  function isoPos(q, r) {
    return {
      x: PAD_X + (q - r) * (TILE_W / 2),
      y: PAD_Y + (q + r) * (TILE_H / 2)
    };
  }

  function screenToHex(px, py) {
    var dx = px - PAD_X;
    var dy = py - PAD_Y;
    var qf = (dx / (TILE_W / 2) + dy / (TILE_H / 2)) / 2;
    var rf = (dy / (TILE_H / 2) - dx / (TILE_W / 2)) / 2;
    var q  = Math.round(qf);
    var r  = Math.round(rf);
    if (q >= 0 && q < MAP_W && r >= 0 && r < MAP_H) return { q: q, r: r };
    return null;
  }

  // ── ZOOM-TO-FIT (Concern 2) ──────────────────────────────────────────
  // Scales the stage container so the full map fits the available viewport
  // without scrolling. Capped at 1.0 — never upscales beyond native art.
  // Click coords self-correct: canvas.getBoundingClientRect() returns the
  // visual (scaled) rect, so existing scaleX = CANVAS_W / rect.width = 1/s,
  // which already converts back to native canvas coords. No click-handler
  // changes needed.
  function _applyZoomToFit() {
    var scroll = document.getElementById('oab-stage-scroll');
    if (!_stage || !scroll) return;

    // Skip scaling on mobile — let the user pinch-zoom natively
    if (window.innerWidth < 768) {
      _mapScale = 1;
      _stage.style.transform    = '';
      _stage.style.transformOrigin = '';
      scroll.style.overflow  = 'auto';
      scroll.style.height    = '';
      return;
    }

    var heroH   = (document.getElementById('oab-hero-bar')     || { offsetHeight: 70  }).offsetHeight;
    var turnH   = (document.getElementById('oab-turn-bar')     || { offsetHeight: 36  }).offsetHeight;
    var actH    = (document.getElementById('oab-action-panel') || { offsetHeight: 52  }).offsetHeight;
    var topH    = (document.getElementById('ui-top')           || { offsetHeight: 44  }).offsetHeight;
    var footerH = 44; // footer + safety margin
    var usedH   = heroH + turnH + actH + topH + footerH;

    var availW = window.innerWidth;
    var availH = Math.max(200, window.innerHeight - usedH);
    var scale  = Math.min(availW / CANVAS_W, availH / CANVAS_H, 1.0);
    scale = Math.max(0.25, scale); // never absurdly tiny
    _mapScale = scale;

    _stage.style.transform       = scale < 1 ? 'scale(' + scale.toFixed(4) + ')' : '';
    _stage.style.transformOrigin = 'top left';

    if (scale < 1) {
      scroll.style.overflow = 'hidden';
      scroll.style.height   = Math.ceil(CANVAS_H * scale) + 'px';
    } else {
      scroll.style.overflow = 'auto';
      scroll.style.height   = '';
    }
  }

  function _onResize() {
    clearTimeout(_resizeTimer);
    _resizeTimer = setTimeout(_applyZoomToFit, 100);
  }

  // ── SPRITE HELPERS ───────────────────────────────────────────────────
  function unitSpriteKey(unit) {
    if (unit.heroId) return unit.heroId;
    // Parse archetype from id: 'enemy_bladewind_a' → 'bladewind'
    var parts = unit.id.split('_');
    return parts.length >= 2 ? parts[1] : null;
  }

  function spriteSrc(key) {
    if (!key || !SPRITE_UNITS[key]) return null;
    return ART + '/sprites/' + key + '/idle_n_0.png';
  }

  // Unit foot position on stage (same logic as preview's unitDomPos)
  function unitDomPos(unit) {
    var tile = window.OathAndBoneEngine.getTile(unit.q, unit.r);
    var elev = tile ? (tile.elevation || 0) : 0;
    var pos  = isoPos(unit.q, unit.r);
    var lift = elev * BLOCK_H;
    var topY = pos.y - lift;
    var cx   = pos.x + TILE_W / 2;
    var footY = topY + TILE_H / 2 + 4;
    return {
      sx:    cx - SPRITE_W / 2,
      sy:    footY - SPRITE_H,
      nameX: cx - 40,
      nameY: topY - 18
    };
  }

  // ── CSS INJECTION ────────────────────────────────────────────────────
  function injectStyles() {
    if (document.getElementById('oab-render-styles')) return;
    var s = document.createElement('style');
    s.id = 'oab-render-styles';
    s.textContent = [
      // Reset container to block layout
      '#oathandbone-game{display:block;padding:0;align-items:unset;justify-content:unset;min-height:auto}',
      // Hero bar (top strip with unit portraits + HP)
      '.oab-hero-bar{background:#16181f;border-bottom:2px solid #2a2d3e;padding:10px 20px;display:flex;align-items:center;gap:20px;min-height:70px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif}',
      '.oab-hero-panel{display:flex;align-items:center;gap:10px;flex-shrink:0}',
      '.oab-portrait-ph{width:54px;height:54px;border:2px solid #2a2d3e;border-radius:4px;background:#1e2030;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;letter-spacing:.08em;color:#4a4d5e}',
      '.oab-hero-name{font-size:10px;font-weight:700;color:#f0c040;letter-spacing:.08em;text-transform:uppercase}',
      '.oab-bar-label{font-size:9px;color:#7a7d8e;letter-spacing:.04em;text-transform:uppercase;margin-bottom:2px}',
      '.oab-bar-track{width:110px;height:7px;background:#1e2030;border:1px solid #2a2d3e;border-radius:2px;overflow:hidden}',
      '.oab-bar-fill{height:100%;border-radius:1px;transition:width .2s}',
      '.oab-bar-fill.hp{background:#f0c040}',
      '.oab-divider{width:1px;height:54px;background:#2a2d3e;flex-shrink:0}',
      // Turn bar
      '.oab-turn-bar{padding:10px 20px;background:linear-gradient(to right,rgba(240,192,64,.12),rgba(14,6,26,.4));border-bottom:1px solid #2a2d3e;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif;font-size:12px;font-weight:600;letter-spacing:.04em;color:#f0c040}',
      // Stage scroll + canvas
      '.oab-stage-scroll{overflow:auto;background:#08080b;border-bottom:1px solid #2a2d3e}',
      '.oab-stage{position:relative}',
      '#oab-canvas{display:block;image-rendering:pixelated}',
      // Unit sprites
      '.oab-sprite{position:absolute;image-rendering:pixelated;pointer-events:none;filter:drop-shadow(1px 3px 3px rgba(0,0,0,.75))}',
      '.oab-sprite.selected{filter:drop-shadow(0 0 7px rgba(240,192,64,.95)) drop-shadow(0 3px 4px rgba(0,0,0,.65))}',
      // Gold selection cursor (FFT register)
      '.oab-cursor{position:absolute;pointer-events:none;width:0;height:0;border-left:10px solid transparent;border-right:10px solid transparent;border-top:14px solid #f0c040;filter:drop-shadow(0 0 4px rgba(240,192,64,.8));animation:oab-bob .9s ease-in-out infinite alternate;z-index:999}',
      '@keyframes oab-bob{0%{transform:translateY(0)}100%{transform:translateY(-5px)}}',
      // Name chips
      '.oab-name{position:absolute;pointer-events:none;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif;font-size:10px;font-weight:700;letter-spacing:.08em;color:#f0c040;text-shadow:0 1px 2px rgba(0,0,0,.9);text-transform:uppercase;white-space:nowrap}',
      '.oab-name.enemy{color:#e68888}',
      // Blue FFT action panel (bottom)
      '.oab-action-panel{background:linear-gradient(to bottom,#18284a 0%,#0e1a34 100%);border-top:2px solid #3a5a9a;box-shadow:inset 0 1px 0 #4a74b8,inset 0 -1px 0 #08122a;padding:14px 20px;display:flex;align-items:center;justify-content:center;gap:6px;flex-wrap:wrap;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif}',
      '.oab-btn{background:linear-gradient(to bottom,#2858a0,#1a3a70);border:2px solid #4a74b8;border-bottom-color:#08122a;border-right-color:#08122a;color:#fff;padding:10px 22px;font-family:inherit;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;cursor:pointer;border-radius:2px;min-width:80px;opacity:.85;user-select:none;text-shadow:0 1px 1px rgba(0,0,0,.8);box-shadow:0 2px 4px rgba(0,0,0,.5)}',
      '.oab-btn:hover:not(:disabled){opacity:1}',
      '.oab-btn[data-action=move]:hover:not(:disabled){border-color:#c09828;color:#f0c040;background:rgba(240,192,64,.15)}',
      '.oab-btn[data-action=attack]:hover:not(:disabled){border-color:#e05c5c;color:#e05c5c;background:rgba(224,92,92,.1)}',
      '.oab-btn[data-action=ability]:hover:not(:disabled){border-color:#ffe850;color:#ffe850;background:rgba(255,232,80,.12)}',
      '.oab-btn[data-action=hold]:hover:not(:disabled){border-color:#7a7d8e;color:#e8e8ec;background:rgba(120,120,150,.1)}',
      '.oab-btn:disabled{opacity:.35;cursor:default}',
      // Floating damage numbers
      '.oab-dmg{position:absolute;pointer-events:none;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif;font-size:16px;font-weight:900;color:#e05c5c;text-shadow:0 2px 4px rgba(0,0,0,.9);z-index:1000;animation:oab-float .9s ease-out forwards}',
      '@keyframes oab-float{0%{opacity:1;transform:translateY(0)}100%{opacity:0;transform:translateY(-42px)}}',
      // Round banner
      '.oab-round-banner{position:absolute;top:10px;left:50%;transform:translateX(-50%);z-index:1500;background:rgba(14,6,26,.9);border:1px solid #f0c040;border-radius:4px;padding:8px 24px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif;font-size:14px;font-weight:700;color:#f0c040;letter-spacing:.1em;text-transform:uppercase;pointer-events:none}',
      // Spell panel (appears above action panel when CAST mode is active)
      '.oab-spell-panel{background:linear-gradient(to bottom,#1a2840 0%,#0e1828 100%);border-top:1px solid #3a5a9a;padding:8px 20px;display:flex;align-items:center;gap:6px;flex-wrap:wrap;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif}',
      '.oab-spell-btn{background:linear-gradient(to bottom,#0e3060,#061830);border:2px solid #2a4a80;color:#a0c0ff;padding:7px 16px;font-family:inherit;font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;cursor:pointer;border-radius:2px;opacity:.8}',
      '.oab-spell-btn.active{border-color:#60a0ff;color:#fff;opacity:1;box-shadow:0 0 6px rgba(100,160,255,.5)}',
      '.oab-spell-btn:disabled{opacity:.3;cursor:default}',
      '.oab-spell-label{font-size:9px;color:#5a7a9e;letter-spacing:.06em;text-transform:uppercase;margin-right:6px}',
      // Mana bar
      '.oab-bar-fill.mp{background:#5c8ce0}',
      // ── VFX: Fire (Firebolt / Fireball / Incinerate) ──
      '.oab-fire-vfx{position:absolute;pointer-events:none;width:40px;height:40px;border-radius:50%;background:radial-gradient(circle,rgba(255,160,20,.9) 0%,rgba(255,60,0,.6) 50%,transparent 70%);z-index:1100;animation:oab-fire .5s ease-out forwards}',
      '@keyframes oab-fire{0%{opacity:1;transform:scale(.6)}60%{opacity:.9;transform:scale(1.3)}100%{opacity:0;transform:scale(1.8)}}',
      // ── VFX: Braced Charge (gold streak) ──
      '.oab-vfx-charge{position:absolute;pointer-events:none;height:6px;background:linear-gradient(to right,rgba(240,192,64,0) 0%,rgba(255,232,120,.95) 50%,rgba(240,192,64,0) 100%);box-shadow:0 0 12px rgba(240,192,64,.8);transform-origin:left center;z-index:1100;animation:oab-charge .25s linear forwards}',
      '@keyframes oab-charge{0%{opacity:0;transform:scaleX(0)}30%{opacity:1}100%{opacity:0;transform:scaleX(1)}}',
      // ── VFX: Cleaving Stroke (red arc) ──
      '.oab-vfx-cleave{position:absolute;pointer-events:none;width:80px;height:80px;border:3px solid rgba(224,92,92,.95);border-radius:50%;border-top-color:transparent;border-right-color:transparent;box-shadow:0 0 16px rgba(224,92,92,.7);z-index:1100;animation:oab-cleave .2s ease-out forwards}',
      '@keyframes oab-cleave{0%{opacity:0;transform:rotate(-90deg) scale(.4)}40%{opacity:1}100%{opacity:0;transform:rotate(60deg) scale(1.3)}}',
      // ── VFX: Loose and Fade (motion-blur silhouette fade) ──
      '.oab-vfx-fade{position:absolute;pointer-events:none;width:48px;height:72px;background:linear-gradient(to right,rgba(160,208,128,.6),rgba(160,208,128,0));filter:blur(3px);border-radius:4px;z-index:1099;animation:oab-fade .3s ease-out forwards}',
      '@keyframes oab-fade{0%{opacity:.85;transform:translateX(0) skewX(-8deg)}100%{opacity:0;transform:translateX(-28px) skewX(-18deg)}}',
      // ── VFX: Called Shot (yellow target reticle pulsing) ──
      '.oab-vfx-reticle{position:absolute;pointer-events:none;width:56px;height:56px;border:2px solid rgba(240,192,64,.95);border-radius:50%;box-shadow:0 0 12px rgba(240,192,64,.8),inset 0 0 8px rgba(240,192,64,.5);z-index:1100;animation:oab-reticle .8s ease-in-out 2}',
      '.oab-vfx-reticle::before,.oab-vfx-reticle::after{content:"";position:absolute;background:rgba(240,192,64,.9)}',
      '.oab-vfx-reticle::before{left:50%;top:-10px;width:2px;height:20px;transform:translateX(-50%)}',
      '.oab-vfx-reticle::after{top:50%;left:-10px;width:20px;height:2px;transform:translateY(-50%)}',
      '@keyframes oab-reticle{0%{opacity:.3;transform:scale(.7)}50%{opacity:1;transform:scale(1.05)}100%{opacity:.4;transform:scale(1)}}',
      // ── VFX: Frost Shard (ice crystal) ──
      '.oab-vfx-frost{position:absolute;pointer-events:none;width:40px;height:40px;background:radial-gradient(circle,rgba(180,230,255,.95) 0%,rgba(92,140,224,.6) 50%,transparent 75%);border-radius:50%;box-shadow:0 0 16px rgba(180,230,255,.9);z-index:1100;animation:oab-frost .3s ease-out forwards}',
      '@keyframes oab-frost{0%{opacity:0;transform:scale(.4) rotate(0)}50%{opacity:1;transform:scale(1.1) rotate(45deg)}100%{opacity:0;transform:scale(1.4) rotate(90deg)}}',
      // ── VFX: Raise Skeleton (violet ring + ghost rise) ──
      '.oab-vfx-raise{position:absolute;pointer-events:none;width:60px;height:60px;border:3px solid rgba(180,100,220,.9);border-radius:50%;box-shadow:0 0 20px rgba(180,100,220,.8),inset 0 0 10px rgba(220,180,255,.5);z-index:1100;animation:oab-raise .4s ease-out forwards}',
      '@keyframes oab-raise{0%{opacity:0;transform:scale(.3) translateY(10px)}60%{opacity:1;transform:scale(1.0) translateY(-4px)}100%{opacity:0;transform:scale(1.3) translateY(-14px)}}',
      // ── VFX: Heal (green spiral) ──
      '.oab-vfx-heal{position:absolute;pointer-events:none;width:44px;height:44px;background:radial-gradient(circle,rgba(140,220,140,.9) 0%,rgba(90,180,90,.6) 50%,transparent 75%);border-radius:50%;box-shadow:0 0 18px rgba(140,220,140,.8);z-index:1100;animation:oab-heal .35s ease-out forwards}',
      '@keyframes oab-heal{0%{opacity:0;transform:scale(.4) rotate(0) translateY(10px)}50%{opacity:1;transform:scale(1.0) rotate(180deg) translateY(-4px)}100%{opacity:0;transform:scale(1.2) rotate(360deg) translateY(-14px)}}',
      // ── VFX: Summon Wolf (pawprint flash) ──
      '.oab-vfx-paw{position:absolute;pointer-events:none;width:32px;height:32px;z-index:1100;animation:oab-paw .4s ease-out forwards}',
      '.oab-vfx-paw::before,.oab-vfx-paw::after{content:"";position:absolute;background:rgba(180,140,100,.9);border-radius:50%;box-shadow:0 0 8px rgba(180,140,100,.7)}',
      '.oab-vfx-paw::before{width:18px;height:18px;left:7px;top:12px}',
      '.oab-vfx-paw::after{width:6px;height:6px;left:3px;top:4px;box-shadow:12px 0 0 rgba(180,140,100,.9),24px 4px 0 rgba(180,140,100,.9),0 0 8px rgba(180,140,100,.7)}',
      '@keyframes oab-paw{0%{opacity:0;transform:scale(.6)}50%{opacity:1;transform:scale(1.1)}100%{opacity:0;transform:scale(1.3)}}',
      // ── VFX: Passive overlay (faint shield icon) ──
      '.oab-vfx-passive{position:absolute;pointer-events:none;width:14px;height:16px;z-index:900;opacity:.55}',
      '.oab-vfx-passive.oath{background:linear-gradient(to bottom,rgba(240,192,64,.75),rgba(192,152,40,.55));clip-path:polygon(50% 0,100% 20%,100% 60%,50% 100%,0 60%,0 20%);box-shadow:0 0 6px rgba(240,192,64,.5)}',
      '.oab-vfx-passive.line{background:linear-gradient(to bottom,rgba(220,180,120,.75),rgba(180,120,60,.55));clip-path:polygon(50% 0,100% 20%,100% 60%,50% 100%,0 60%,0 20%);box-shadow:0 0 6px rgba(220,180,120,.5)}',
      // Heal floating-numbers (reuse damage float with green color)
      '.oab-heal-num{position:absolute;pointer-events:none;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif;font-size:16px;font-weight:900;color:#8cdc8c;text-shadow:0 2px 4px rgba(0,0,0,.9);z-index:1000;animation:oab-float .9s ease-out forwards}',
      // Battle end overlay
      '.oab-overlay{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;z-index:2000;background:rgba(0,0,0,.72)}',
      '.oab-overlay-box{background:#16181f;border:2px solid #f0c040;border-radius:6px;padding:40px 60px;text-align:center;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif}',
      '.oab-overlay-title{font-size:28px;font-weight:900;letter-spacing:.12em;text-transform:uppercase;margin-bottom:12px}',
      '.oab-overlay-title.victory{color:#f0c040}',
      '.oab-overlay-title.defeat{color:#e05c5c}',
      '.oab-overlay-sub{font-size:14px;color:#7a7d8e}',
      // Tutorial modal — blue FFT chrome, fixed to viewport so it covers action panel too
      '.oab-tut-overlay{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;z-index:9000;background:rgba(0,0,0,.60)}',
      '.oab-tut-box{background:linear-gradient(to bottom,#18284a 0%,#0e1a34 100%);border:2px solid #3a5a9a;box-shadow:inset 0 1px 0 #4a74b8,0 6px 32px rgba(0,0,0,.85);border-radius:4px;padding:28px 36px;max-width:420px;width:90%;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif;text-align:center}',
      '.oab-tut-label{font-size:10px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:#4a74b8;margin-bottom:10px}',
      '.oab-tut-copy{font-size:13px;color:#c0d4f0;line-height:1.65;margin-bottom:22px}',
      '.oab-tut-gotit{background:linear-gradient(to bottom,#2858a0,#1a3a70);border:2px solid #4a74b8;border-bottom-color:#08122a;border-right-color:#08122a;color:#fff;padding:9px 28px;font-family:inherit;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;cursor:pointer;border-radius:2px;box-shadow:0 2px 4px rgba(0,0,0,.5)}',
      '.oab-tut-gotit:hover{opacity:.9;border-color:#60a0ff}',
      // Results panel
      '.oab-results-box{min-width:320px;max-width:460px;padding:28px 40px}',
      '.oab-results-rewards{margin:18px 0 12px;display:flex;flex-direction:column;gap:0}',
      '.oab-results-row{display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid #2a2d3e}',
      '.oab-results-icon{font-size:16px;width:22px;text-align:center;flex-shrink:0}',
      '.oab-results-rlabel{font-size:11px;color:#7a7d8e;letter-spacing:.06em;text-transform:uppercase;flex:1;text-align:left}',
      '.oab-results-value{font-size:15px;font-weight:700;color:#f0c040}',
      '.oab-results-fallen{margin:14px 0 8px;padding:10px 14px;background:rgba(224,92,92,.08);border:1px solid rgba(224,92,92,.25);border-radius:3px;text-align:left}',
      '.oab-results-fallen-line{color:#e05c5c;font-size:12px;line-height:1.5;margin-bottom:3px}',
      '.oab-results-fallen-line:last-child{margin-bottom:0}',
      '.oab-results-survived{color:#4caf82;font-size:12px}',
      '.oab-results-barb{font-size:12px;color:#7a7d8e;font-style:italic;margin:12px 0 8px;padding:0 16px;line-height:1.5}',
      '.oab-results-balance{font-size:12px;color:#f0c040;margin-top:6px;letter-spacing:.04em}',
      '.oab-results-save-status{font-size:10px;color:#5a5d6e;margin-top:4px;letter-spacing:.04em}',
      '.oab-results-btns{display:flex;gap:10px;justify-content:center;margin-top:18px}',
      // World map
      '.oab-worldmap{background:linear-gradient(to bottom,#18284a 0%,#0e1a34 100%);min-height:420px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:36px 24px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif}',
      '.oab-worldmap-title{font-size:13px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:#4a74b8;margin-bottom:6px}',
      '.oab-worldmap-sub{font-size:11px;color:#5a7a9e;letter-spacing:.06em;margin-bottom:28px}',
      '.oab-worldmap-cards{display:flex;gap:16px;flex-wrap:wrap;justify-content:center}',
      '.oab-worldmap-card{background:#0e1a34;border:2px solid #2a3a5e;border-radius:4px;padding:18px 22px;min-width:130px;max-width:160px;text-align:center;transition:border-color .2s}',
      '.oab-worldmap-card.completed{border-color:#5a7040;opacity:.8}',
      '.oab-worldmap-card.available{border-color:#f0c040;cursor:pointer;animation:oab-mapcard-pulse 1.6s ease-in-out infinite}',
      '.oab-worldmap-card.available:hover{border-color:#ffe060;background:rgba(240,192,64,.06)}',
      '.oab-worldmap-card.locked{border-color:#2a2d3e;opacity:.45;cursor:default}',
      '@keyframes oab-mapcard-pulse{0%,100%{box-shadow:0 0 0 0 rgba(240,192,64,0)}50%{box-shadow:0 0 0 5px rgba(240,192,64,.18)}}',
      '.oab-worldmap-card-biome{font-size:9px;color:#5a7a9e;letter-spacing:.1em;text-transform:uppercase;margin-bottom:7px}',
      '.oab-worldmap-card-name{font-size:13px;font-weight:700;color:#c0d4f0;margin-bottom:8px}',
      '.oab-worldmap-card-state{font-size:9px;font-weight:700;letter-spacing:.14em;text-transform:uppercase}',
      '.oab-worldmap-card.completed .oab-worldmap-card-state{color:#7a9a50}',
      '.oab-worldmap-card.available .oab-worldmap-card-state{color:#f0c040}',
      '.oab-worldmap-card.locked .oab-worldmap-card-state{color:#3a3d4e}'
    ].join('\n');
    document.head.appendChild(s);
  }

  // ── BUILD UI ─────────────────────────────────────────────────────────
  function buildUI(container) {
    container.style.cssText = 'display:block;padding:0;align-items:unset;justify-content:unset;min-height:auto';
    container.innerHTML = '';

    // Hero info bar
    var heroBar = document.createElement('div');
    heroBar.className = 'oab-hero-bar';
    heroBar.id = 'oab-hero-bar';
    container.appendChild(heroBar);

    // Turn bar
    var turnBar = document.createElement('div');
    turnBar.className = 'oab-turn-bar';
    turnBar.id = 'oab-turn-bar';
    turnBar.textContent = 'Loading…';
    container.appendChild(turnBar);

    // Stage scroll container
    var scroll = document.createElement('div');
    scroll.className = 'oab-stage-scroll';
    scroll.id = 'oab-stage-scroll';
    container.appendChild(scroll);

    // Stage (canvas + DOM overlay sprites)
    var stage = document.createElement('div');
    stage.className = 'oab-stage';
    stage.id = 'oab-stage';
    stage.style.width  = CANVAS_W + 'px';
    stage.style.height = CANVAS_H + 'px';
    scroll.appendChild(stage);
    _stage = stage;

    // Canvas
    var canvas = document.createElement('canvas');
    canvas.id     = 'oab-canvas';
    canvas.width  = CANVAS_W;
    canvas.height = CANVAS_H;
    stage.appendChild(canvas);
    _canvas = canvas;
    _ctx    = canvas.getContext('2d');

    // Action panel (blue FFT chrome)
    var panel = document.createElement('div');
    panel.className = 'oab-action-panel';
    panel.id = 'oab-action-panel';
    ['move', 'attack', 'cast', 'ability', 'hold'].forEach(function (action) {
      var btn = document.createElement('button');
      btn.className = 'oab-btn';
      btn.dataset.action = action;
      btn.textContent = action;
      btn.disabled = true;
      panel.appendChild(btn);
    });
    container.appendChild(panel);

    // Spell panel (hidden until CAST mode is active)
    var spellPanel = document.createElement('div');
    spellPanel.className = 'oab-spell-panel';
    spellPanel.id = 'oab-spell-panel';
    spellPanel.style.display = 'none';
    container.appendChild(spellPanel);

    // Ability panel (hidden until ABILITY mode is active)
    var abilityPanel = document.createElement('div');
    abilityPanel.className = 'oab-spell-panel oab-ability-panel';
    abilityPanel.id = 'oab-ability-panel';
    abilityPanel.style.display = 'none';
    container.appendChild(abilityPanel);

    // Canvas click handler
    canvas.addEventListener('click', function (e) {
      var rect   = canvas.getBoundingClientRect();
      var scaleX = CANVAS_W / rect.width;
      var scaleY = CANVAS_H / rect.height;
      var px = (e.clientX - rect.left) * scaleX;
      var py = (e.clientY - rect.top)  * scaleY;
      handleCanvasClick(px, py);
    });

    // Hover listeners (Concern 3)
    canvas.addEventListener('mousemove', function (e) {
      var rect   = canvas.getBoundingClientRect();
      var scaleX = CANVAS_W / rect.width;
      var scaleY = CANVAS_H / rect.height;
      var px = (e.clientX - rect.left) * scaleX;
      var py = (e.clientY - rect.top)  * scaleY;
      var hex = screenToHex(px, py);
      var changed = !hex !== !_hoveredHex ||
                    (hex && _hoveredHex && (hex.q !== _hoveredHex.q || hex.r !== _hoveredHex.r));
      if (changed) {
        _hoveredHex = hex;
        if (!_animating) render();
      }
    });

    canvas.addEventListener('mouseleave', function () {
      if (_hoveredHex) {
        _hoveredHex = null;
        if (!_animating) render();
      }
    });

    // Action button handlers
    panel.querySelector('[data-action=move]').addEventListener('click', handleMoveBtn);
    panel.querySelector('[data-action=attack]').addEventListener('click', handleAttackBtn);
    panel.querySelector('[data-action=cast]').addEventListener('click', handleCastBtn);
    panel.querySelector('[data-action=ability]').addEventListener('click', handleAbilityBtn);
    panel.querySelector('[data-action=hold]').addEventListener('click', handleHoldBtn);

    // Zoom-to-fit: must run after layout so offsetHeight values are valid
    setTimeout(_applyZoomToFit, 0);
    window.addEventListener('resize', _onResize);
  }

  // ── HERO BAR ─────────────────────────────────────────────────────────
  function updateHeroBar() {
    var bar = document.getElementById('oab-hero-bar');
    if (!bar) return;
    bar.innerHTML = '';
    var battle = window.OathAndBoneEngine.getBattle();
    var first  = true;

    for (var id in battle.units) {
      var unit = battle.units[id];
      if (unit.team !== 'player') continue;

      if (!first) {
        var div = document.createElement('div');
        div.className = 'oab-divider';
        bar.appendChild(div);
      }
      first = false;

      var panel = document.createElement('div');
      panel.className = 'oab-hero-panel';

      var ph = document.createElement('div');
      ph.className = 'oab-portrait-ph';
      ph.textContent = (unit.heroId || 'HERO').toUpperCase().slice(0, 4);
      panel.appendChild(ph);

      var stats  = document.createElement('div');
      var name   = document.createElement('div');
      name.className   = 'oab-hero-name';
      name.textContent = (unit.heroId || unit.id).toUpperCase();
      stats.appendChild(name);

      var hpLabel = document.createElement('div');
      hpLabel.className   = 'oab-bar-label';
      hpLabel.textContent = 'HP ' + unit.hp + ' / ' + unit.hp_max;

      var hpTrack = document.createElement('div');
      hpTrack.className = 'oab-bar-track';
      var hpFill = document.createElement('div');
      hpFill.className = 'oab-bar-fill hp';
      hpFill.style.width = Math.max(0, Math.round(unit.hp / unit.hp_max * 100)) + '%';
      hpTrack.appendChild(hpFill);

      stats.appendChild(hpLabel);
      stats.appendChild(hpTrack);

      // Show mana bar if this unit is a caster
      if (unit.magic && unit.magic.mana !== undefined) {
        var mpLabel = document.createElement('div');
        mpLabel.className = 'oab-bar-label';
        mpLabel.textContent = 'MP ' + unit.magic.mana + ' / ' + unit.magic.mana_max;
        var mpTrack = document.createElement('div');
        mpTrack.className = 'oab-bar-track';
        var mpFill = document.createElement('div');
        mpFill.className = 'oab-bar-fill mp';
        mpFill.style.width = Math.max(0, Math.round(unit.magic.mana / unit.magic.mana_max * 100)) + '%';
        mpTrack.appendChild(mpFill);
        stats.appendChild(mpLabel);
        stats.appendChild(mpTrack);
      }

      panel.appendChild(stats);
      bar.appendChild(panel);
    }
  }

  // ── RENDER (full redraw) ──────────────────────────────────────────────
  function render() {
    if (!_ctx) return;
    drawMap();
    syncSprites();
    _renderPassiveOverlays();
    updateTurnBar();
    updateActionBtns();
    updateHeroBar();
  }

  // ── DRAW MAP ─────────────────────────────────────────────────────────
  function drawMap() {
    _ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    _ctx.fillStyle = '#0b140e';
    _ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Painter's algorithm: back-to-front by (q+r) ascending sum
    for (var sum = 0; sum < MAP_W + MAP_H - 1; sum++) {
      var rMin = Math.max(0, sum - MAP_W + 1);
      var rMax = Math.min(MAP_H - 1, sum);
      for (var r = rMin; r <= rMax; r++) {
        var q = sum - r;
        if (q < 0 || q >= MAP_W) continue;
        var tile = window.OathAndBoneEngine.getTile(q, r);
        if (tile) _drawTile(q, r, tile);
      }
    }
  }

  function _drawTile(q, r, tile) {
    var pos  = isoPos(q, r);
    var elev = tile.elevation || 0;
    var lift = elev * BLOCK_H;
    var x    = pos.x;
    var y    = pos.y;
    var topY = y - lift;
    var cx   = x + TILE_W / 2;

    // Diamond vertices of top face
    var vTop    = { x: cx,           y: topY };
    var vRight  = { x: x + TILE_W,   y: topY + TILE_H / 2 };
    var vBottom = { x: cx,           y: topY + TILE_H };
    var vLeft   = { x: x,            y: topY + TILE_H / 2 };

    // Ground-plane vertices (bottom of side faces, elev=0)
    var gLeft   = { x: x,            y: y + TILE_H / 2 };
    var gRight  = { x: x + TILE_W,   y: y + TILE_H / 2 };
    var gBottom = { x: cx,           y: y + TILE_H };

    // ── Side faces (elevation cube-stack) ──
    if (elev > 0) {
      var lColor = tile.terrain === 'ridge' ? '#283518' : '#1e2814';
      _ctx.fillStyle = lColor;
      _ctx.beginPath();
      _ctx.moveTo(vLeft.x, vLeft.y); _ctx.lineTo(gLeft.x, gLeft.y);
      _ctx.lineTo(gBottom.x, gBottom.y); _ctx.lineTo(vBottom.x, vBottom.y);
      _ctx.closePath(); _ctx.fill();
      _ctx.strokeStyle = 'rgba(0,0,0,.5)'; _ctx.lineWidth = 0.6; _ctx.stroke();

      var rColor = tile.terrain === 'ridge' ? '#3a4822' : '#2c3a1e';
      _ctx.fillStyle = rColor;
      _ctx.beginPath();
      _ctx.moveTo(vBottom.x, vBottom.y); _ctx.lineTo(gBottom.x, gBottom.y);
      _ctx.lineTo(gRight.x, gRight.y); _ctx.lineTo(vRight.x, vRight.y);
      _ctx.closePath(); _ctx.fill();
      _ctx.strokeStyle = 'rgba(0,0,0,.5)'; _ctx.lineWidth = 0.6; _ctx.stroke();
    }

    // ── Top face (tile PNG clipped to diamond, or solid-color fallback) ──
    var tImg = _getTileImage(tile.terrain);
    if (tImg && tImg.complete && tImg.naturalWidth > 0) {
      _ctx.save();
      _ctx.beginPath();
      _ctx.moveTo(vTop.x, vTop.y); _ctx.lineTo(vRight.x, vRight.y);
      _ctx.lineTo(vBottom.x, vBottom.y); _ctx.lineTo(vLeft.x, vLeft.y);
      _ctx.closePath(); _ctx.clip();
      if (_tileFlip(q, r)) {
        // Horizontal flip: translate to right edge, scale x=-1, draw at 0,0
        _ctx.translate(x + TILE_W, topY);
        _ctx.scale(-1, 1);
        _ctx.drawImage(tImg, 0, 0, TILE_W, TILE_H);
      } else {
        _ctx.drawImage(tImg, x, topY, TILE_W, TILE_H);
      }
      _ctx.restore();
    } else {
      var topColor = tile.terrain === 'ridge'      ? '#4a5830'
                   : tile.terrain === 'forest'     ? '#2a3e1a'
                   : tile.terrain === 'water'      ? '#1a3050'
                   : tile.terrain === 'ruin'       ? '#3a3228'
                   : tile.terrain === 'cliff_edge' ? '#3c3c2e'
                   : tile.terrain === 'rough'      ? '#2e2c1e'
                   : tile.terrain === 'sanctum'    ? '#3a3830'
                   : '#38481e'; // plain
      _ctx.fillStyle = topColor;
      _ctx.beginPath();
      _ctx.moveTo(vTop.x, vTop.y); _ctx.lineTo(vRight.x, vRight.y);
      _ctx.lineTo(vBottom.x, vBottom.y); _ctx.lineTo(vLeft.x, vLeft.y);
      _ctx.closePath(); _ctx.fill();
    }

    // Thin edge outline
    _ctx.strokeStyle = 'rgba(0,0,0,.28)';
    _ctx.lineWidth = 0.7;
    _ctx.beginPath();
    _ctx.moveTo(vTop.x, vTop.y); _ctx.lineTo(vRight.x, vRight.y);
    _ctx.lineTo(vBottom.x, vBottom.y); _ctx.lineTo(vLeft.x, vLeft.y);
    _ctx.closePath(); _ctx.stroke();

    // ── Move-range highlight (gold tint) ──
    if (_moveMode && _hexInList(_moveHexes, q, r)) {
      _ctx.fillStyle = 'rgba(240,192,64,.32)';
      _ctx.beginPath();
      _ctx.moveTo(vTop.x, vTop.y); _ctx.lineTo(vRight.x, vRight.y);
      _ctx.lineTo(vBottom.x, vBottom.y); _ctx.lineTo(vLeft.x, vLeft.y);
      _ctx.closePath(); _ctx.fill();
      _ctx.strokeStyle = 'rgba(240,192,64,.9)';
      _ctx.lineWidth = 1.6; _ctx.stroke();
    }

    // ── Cast-range highlight (blue tint) ──
    if (_castMode && _hexInList(_castHexes, q, r)) {
      _ctx.fillStyle = 'rgba(92,140,224,.30)';
      _ctx.beginPath();
      _ctx.moveTo(vTop.x, vTop.y); _ctx.lineTo(vRight.x, vRight.y);
      _ctx.lineTo(vBottom.x, vBottom.y); _ctx.lineTo(vLeft.x, vLeft.y);
      _ctx.closePath(); _ctx.fill();
      _ctx.strokeStyle = 'rgba(92,140,224,.85)';
      _ctx.lineWidth = 1.6; _ctx.stroke();
    }

    // ── Attack-range highlight (red tint) ──
    if (_attackMode && _hexInList(_attackHexes, q, r)) {
      _ctx.fillStyle = 'rgba(224,92,92,.32)';
      _ctx.beginPath();
      _ctx.moveTo(vTop.x, vTop.y); _ctx.lineTo(vRight.x, vRight.y);
      _ctx.lineTo(vBottom.x, vBottom.y); _ctx.lineTo(vLeft.x, vLeft.y);
      _ctx.closePath(); _ctx.fill();
      _ctx.strokeStyle = 'rgba(224,92,92,.9)';
      _ctx.lineWidth = 1.6; _ctx.stroke();
    }

    // ── Ability-range highlight (yellow tint, distinct from gold-move) ──
    if (_abilityMode && _hexInList(_abilityHexes, q, r)) {
      _ctx.fillStyle = 'rgba(255,232,80,.34)';
      _ctx.beginPath();
      _ctx.moveTo(vTop.x, vTop.y); _ctx.lineTo(vRight.x, vRight.y);
      _ctx.lineTo(vBottom.x, vBottom.y); _ctx.lineTo(vLeft.x, vLeft.y);
      _ctx.closePath(); _ctx.fill();
      _ctx.strokeStyle = 'rgba(255,232,80,.95)';
      _ctx.lineWidth = 1.8; _ctx.stroke();
    }

    // ── Selected unit's tile — strong gold outline ──
    if (_selectedUnitId) {
      var selUnit = window.OathAndBoneEngine.getBattle().units[_selectedUnitId];
      if (selUnit && selUnit.q === q && selUnit.r === r) {
        _ctx.strokeStyle = '#f0c040';
        _ctx.lineWidth = 2.5;
        _ctx.beginPath();
        _ctx.moveTo(vTop.x, vTop.y); _ctx.lineTo(vRight.x, vRight.y);
        _ctx.lineTo(vBottom.x, vBottom.y); _ctx.lineTo(vLeft.x, vLeft.y);
        _ctx.closePath(); _ctx.stroke();
      }
    }

    // ── Hover outline (Concern 3) ──
    // Gold = general hover. Red = valid enemy target in cast mode.
    // Thinner and semi-transparent to distinguish from move-range gold fill.
    if (_hoveredHex && _hoveredHex.q === q && _hoveredHex.r === r) {
      var hTile     = window.OathAndBoneEngine.getTile(q, r);
      var hUnitId   = hTile && hTile.unit;
      var hUnit     = hUnitId ? window.OathAndBoneEngine.getBattle().units[hUnitId] : null;
      var hasEnemy  = hUnit && hUnit.team === 'enemy';
      var inCastRng = _castMode && _hexInList(_castHexes, q, r);

      var hColor;
      if (inCastRng && hasEnemy) {
        hColor = 'rgba(224,92,92,.95)';   // red — valid spell target
      } else if (inCastRng) {
        hColor = 'rgba(92,140,224,.80)';   // dim blue — in range, no target
      } else {
        hColor = 'rgba(240,192,64,.80)';   // gold — general hover
      }

      _ctx.strokeStyle = hColor;
      _ctx.lineWidth   = 1.8;
      _ctx.beginPath();
      _ctx.moveTo(vTop.x, vTop.y); _ctx.lineTo(vRight.x, vRight.y);
      _ctx.lineTo(vBottom.x, vBottom.y); _ctx.lineTo(vLeft.x, vLeft.y);
      _ctx.closePath(); _ctx.stroke();
    }
  }

  function _hexInList(list, q, r) {
    for (var i = 0; i < list.length; i++) {
      if (list[i].q === q && list[i].r === r) return true;
    }
    return false;
  }

  // ── TILE IMAGE HELPERS (Concern 1) ───────────────────────────────────
  var ART_TILE = ART + '/tiles/';
  var _TILE_SRCS = {
    plain:      'plain/base.png',
    ridge:      'ridge/base.png',
    forest:     'forest/base.png',
    water:      'river/base.png',
    ruin:       'ruin/base.png',
    cliff_edge: 'plain/cliff-edge.png',
    rough:      'rough/base.png',
    sanctum:    'sanctum/base.png'
  };

  function _getTileImage(terrain) {
    if (_tileImgCache[terrain]) return _tileImgCache[terrain];
    var rel = _TILE_SRCS[terrain];
    if (!rel) return null;
    var img = new Image();
    img.onload = function () { if (!_animating) render(); };
    img.src = ART_TILE + rel;
    _tileImgCache[terrain] = img;
    return img;
  }

  // Deterministic horizontal flip: avoids visible tile repetition.
  // Uses only X-flip (safe for directional lighting in iso tiles).
  function _tileFlip(q, r) {
    return (((q * 2654435761) ^ (r * 1013904223)) >>> 0) & 1;
  }

  // ── SPRITE DOM SYNC ──────────────────────────────────────────────────
  // Remove-and-recreate approach (no animations — flagged for Worker 17).
  function syncSprites() {
    if (!_stage) return;
    var oldEls = _stage.querySelectorAll('.oab-sprite,.oab-name,.oab-cursor,.oab-hp-bar,.oab-ghost');
    oldEls.forEach(function (el) { el.remove(); });

    var battle = window.OathAndBoneEngine.getBattle();
    for (var id in battle.units) {
      var unit = battle.units[id];
      if (unit.hp <= 0) continue;
      _createUnitDom(unit);
    }

    // Ghost sprite: semitransparent preview of selected unit at hovered destination (Concern 3)
    if (_moveMode && _hoveredHex && _selectedUnitId &&
        _hexInList(_moveHexes, _hoveredHex.q, _hoveredHex.r)) {
      var selU = battle.units[_selectedUnitId];
      if (selU) {
        var ghostUnit = { q: _hoveredHex.q, r: _hoveredHex.r,
                          hp: selU.hp, hp_max: selU.hp_max, team: selU.team,
                          heroId: selU.heroId, id: selU.id };
        var gp   = unitDomPos(ghostUnit);
        var gkey = unitSpriteKey(selU);
        var gsrc = spriteSrc(gkey);
        var ghost;
        if (gsrc) {
          ghost     = document.createElement('img');
          ghost.src = gsrc;
          ghost.alt = 'ghost';
        } else {
          ghost = _makePlaceholder(selU, gp, true);
        }
        ghost.className = 'oab-ghost';
        ghost.style.cssText = 'position:absolute;left:' + gp.sx + 'px;top:' + gp.sy + 'px;' +
          'width:' + SPRITE_W + 'px;height:' + SPRITE_H + 'px;opacity:0.40;pointer-events:none;' +
          'image-rendering:pixelated;z-index:' + (_hoveredHex.r + 1) + ';' +
          'filter:grayscale(0.2) drop-shadow(0 0 6px rgba(240,192,64,.6))';
        _stage.appendChild(ghost);
      }
    }
  }

  function _createUnitDom(unit) {
    var p        = unitDomPos(unit);
    var key      = unitSpriteKey(unit);
    var src      = spriteSrc(key);
    var isPlayer = unit.team === 'player';
    var isSel    = _selectedUnitId === unit.id;

    // ── Sprite image or placeholder div ──
    var sprite;
    if (src) {
      sprite = document.createElement('img');
      sprite.className = 'oab-sprite' + (isSel ? ' selected' : '');
      sprite.src = src;
      sprite.alt = key;
      // Fallback to _px seed if Worker-14 file missing
      sprite.onerror = (function (sp, k) {
        return function () {
          sp.onerror = null;
          sp.src = ART + '/sprites/' + k + '/idle_n_0_px.png';
          sp.onerror = function () {
            sp.replaceWith(_makePlaceholder(unit, p, isPlayer));
          };
        };
      }(sprite, key));
    } else {
      sprite = _makePlaceholder(unit, p, isPlayer);
    }

    sprite.dataset.unitId = unit.id;
    sprite.style.cssText = 'position:absolute;left:' + p.sx + 'px;top:' + p.sy + 'px;width:' + SPRITE_W + 'px;height:' + SPRITE_H + 'px;z-index:' + (unit.r + 1) + ';image-rendering:pixelated;pointer-events:auto;cursor:' + (isPlayer ? 'pointer' : 'crosshair');

    sprite.addEventListener('click', (function (u) {
      return function (e) {
        e.stopPropagation();
        // Ability self-target (e.g. Called Shot) — clicking your own sprite
        // while in ability mode with a self-hex in range fires the ability.
        if (_abilityMode && _abilityId && _selectedUnitId === u.id &&
            _hexInList(_abilityHexes, u.q, u.r)) {
          _executeAbility(u.q, u.r);
          return;
        }
        if (u.team === 'player') {
          selectUnit(u.id);
        } else {
          handleEnemyClick(u);
        }
      };
    }(unit)));

    _stage.appendChild(sprite);

    // ── Name chip ──
    var chip = document.createElement('div');
    chip.className = 'oab-name' + (isPlayer ? '' : ' enemy');
    chip.dataset.nameFor = unit.id;
    chip.textContent = (unit.heroId || (key ? key.toUpperCase() : unit.id.split('_')[1] || unit.id)).toUpperCase();
    chip.style.cssText = 'left:' + p.nameX + 'px;top:' + p.nameY + 'px;width:80px;text-align:center;z-index:' + (unit.r + 2);
    _stage.appendChild(chip);

    // ── HP bar above sprite ──
    var hpBar = document.createElement('div');
    hpBar.className = 'oab-hp-bar';
    var pct = Math.max(0, Math.round(unit.hp / unit.hp_max * 100));
    hpBar.style.cssText = 'position:absolute;width:' + SPRITE_W + 'px;height:4px;background:#2a2d3e;border-radius:2px;overflow:hidden;left:' + p.sx + 'px;top:' + (p.sy - 7) + 'px;z-index:' + (unit.r + 3);
    var hpFill = document.createElement('div');
    hpFill.style.cssText = 'width:' + pct + '%;height:100%;background:' + (isPlayer ? '#4caf82' : '#e05c5c') + ';transition:width .2s';
    hpBar.appendChild(hpFill);
    _stage.appendChild(hpBar);

    // ── Gold selection cursor ──
    if (isSel) {
      var cursor = document.createElement('div');
      cursor.className = 'oab-cursor';
      cursor.style.cssText = 'left:' + (p.sx + SPRITE_W / 2 - 10) + 'px;top:' + (p.sy - 20) + 'px;z-index:999';
      _stage.appendChild(cursor);
    }
  }

  function _makePlaceholder(unit, p, isPlayer) {
    var div = document.createElement('div');
    div.style.cssText = 'position:absolute;width:' + SPRITE_W + 'px;height:' + SPRITE_H + 'px;background:' + (isPlayer ? '#2a3022' : '#1a1015') + ';border:1px solid ' + (isPlayer ? '#8ab060' : '#5a3040') + ';border-radius:3px;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:' + (isPlayer ? '#8ab060' : '#c07070') + ';letter-spacing:.06em';
    div.textContent = ((unit.heroId || unit.id.split('_')[1] || '?').slice(0, 4)).toUpperCase();
    return div;
  }

  // ── SELECTION ────────────────────────────────────────────────────────
  function selectUnit(unitId) {
    var unit = window.OathAndBoneEngine.getUnit(unitId);
    if (!unit || unit.team !== 'player' || unit.hp <= 0) return;
    _selectedUnitId = unitId;
    _moveMode    = false; _moveHexes    = [];
    _attackMode  = false; _attackHexes  = [];
    _castMode    = false; _castSpellId  = null; _castHexes = [];
    _abilityMode = false; _abilityId    = null; _abilityHexes = [];
    _hideSpellPanel();
    _hideAbilityPanel();
    render();
  }

  // ── CANVAS CLICK ─────────────────────────────────────────────────────
  function handleCanvasClick(px, py) {
    if (_tutorialModalOpen) return;
    var hex = screenToHex(px, py);
    if (!hex) return;
    var q = hex.q, r = hex.r;

    // Move mode: clicking a reachable hex executes the move
    if (_moveMode && _hexInList(_moveHexes, q, r)) {
      var ok = window.OathAndBoneEngine.moveUnit(_selectedUnitId, q, r);
      if (ok) { _moveMode = false; _moveHexes = []; }
      return;
    }

    // Attack mode: clicking an attackable hex fires the attack
    if (_attackMode && _hexInList(_attackHexes, q, r)) {
      var tileAt = window.OathAndBoneEngine.getTile(q, r);
      if (tileAt && tileAt.unit) {
        var res = window.OathAndBoneEngine.attackUnit(_selectedUnitId, tileAt.unit);
        if (res) { _attackMode = false; _attackHexes = []; }
      }
      return;
    }

    // Cast mode: clicking a valid cast hex fires the spell
    if (_castMode && _castSpellId && _hexInList(_castHexes, q, r)) {
      _executeCast(q, r);
      return;
    }

    // Ability mode: clicking a valid ability hex fires the ability
    if (_abilityMode && _abilityId && _hexInList(_abilityHexes, q, r)) {
      _executeAbility(q, r);
      return;
    }

    // Click on a tile containing a player unit → select it
    var t = window.OathAndBoneEngine.getTile(q, r);
    if (t && t.unit) {
      var u = window.OathAndBoneEngine.getBattle().units[t.unit];
      if (u && u.team === 'player') selectUnit(u.id);
    }
  }

  function handleEnemyClick(enemyUnit) {
    if (_castMode && _castSpellId && _selectedUnitId) {
      if (!_hexInList(_castHexes, enemyUnit.q, enemyUnit.r)) return;
      _executeCast(enemyUnit.q, enemyUnit.r);
      return;
    }
    if (_abilityMode && _abilityId && _selectedUnitId) {
      if (!_hexInList(_abilityHexes, enemyUnit.q, enemyUnit.r)) return;
      _executeAbility(enemyUnit.q, enemyUnit.r);
      return;
    }
    if (!_attackMode || !_selectedUnitId) return;
    if (!_hexInList(_attackHexes, enemyUnit.q, enemyUnit.r)) return;
    var res = window.OathAndBoneEngine.attackUnit(_selectedUnitId, enemyUnit.id);
    if (res) { _attackMode = false; _attackHexes = []; }
  }

  // ── ACTION BUTTONS ───────────────────────────────────────────────────
  function handleMoveBtn() {
    if (_tutorialModalOpen) return;
    if (!_selectedUnitId) return;
    var unit = window.OathAndBoneEngine.getUnit(_selectedUnitId);
    if (!unit || unit.acted || unit.hp <= 0) return;
    _moveMode   = !_moveMode;
    _attackMode = false; _attackHexes = [];
    _moveHexes  = _moveMode ? window.OathAndBoneEngine.getMovableHexes(_selectedUnitId) : [];
    render();
  }

  function handleAttackBtn() {
    if (_tutorialModalOpen) return;
    if (!_selectedUnitId) return;
    var unit = window.OathAndBoneEngine.getUnit(_selectedUnitId);
    if (!unit || unit.acted || unit.hp <= 0) return;
    _attackMode = !_attackMode;
    _moveMode   = false; _moveHexes = [];
    _attackHexes = _attackMode ? window.OathAndBoneEngine.getAttackableHexes(_selectedUnitId) : [];
    render();
  }

  function handleCastBtn() {
    if (_tutorialModalOpen) return;
    if (!_selectedUnitId) return;
    var unit = window.OathAndBoneEngine.getUnit(_selectedUnitId);
    if (!unit || unit.acted || unit.hp <= 0 || !unit.magic) return;
    _castMode    = !_castMode;
    _moveMode    = false; _moveHexes    = [];
    _attackMode  = false; _attackHexes  = [];
    _abilityMode = false; _abilityId    = null; _abilityHexes = [];
    _hideAbilityPanel();
    if (_castMode) {
      var equipped = (unit.magic && unit.magic.spells_equipped) ? unit.magic.spells_equipped : [];
      _castSpellId = equipped[0] || null;
      _castHexes   = (_castSpellId && window.OathAndBoneSpells)
        ? window.OathAndBoneSpells.getSpellTargetHexes(_selectedUnitId, _castSpellId)
        : [];
      _buildSpellPanel(unit);
    } else {
      _castSpellId = null; _castHexes = [];
      _hideSpellPanel();
    }
    render();
  }

  function handleAbilityBtn() {
    if (_tutorialModalOpen) return;
    if (!_selectedUnitId) return;
    var unit = window.OathAndBoneEngine.getUnit(_selectedUnitId);
    if (!unit || unit.acted || unit.hp <= 0) return;
    var sigs = (window.OathAndBoneAbilities && window.OathAndBoneAbilities.getHeroSignatures)
      ? window.OathAndBoneAbilities.getHeroSignatures(unit) : [];
    if (!sigs || sigs.length === 0) return;

    _abilityMode = !_abilityMode;
    _moveMode    = false; _moveHexes    = [];
    _attackMode  = false; _attackHexes  = [];
    _castMode    = false; _castSpellId  = null; _castHexes = [];
    _hideSpellPanel();
    if (_abilityMode) {
      // Pre-select first ACTIVE signature (not passive, not spell-kind)
      var firstActive = null;
      for (var i = 0; i < sigs.length; i++) {
        if (sigs[i].kind === 'active') { firstActive = sigs[i]; break; }
      }
      _abilityId = firstActive ? firstActive.id : null;
      _abilityHexes = (_abilityId && window.OathAndBoneAbilities)
        ? window.OathAndBoneAbilities.getAbilityTargetHexes(_selectedUnitId, _abilityId) : [];
      _buildAbilityPanel(unit, sigs);
    } else {
      _abilityId = null; _abilityHexes = [];
      _hideAbilityPanel();
    }
    render();
  }

  function _buildSpellPanel(unit) {
    var panel = document.getElementById('oab-spell-panel');
    if (!panel) return;
    panel.innerHTML = '';
    panel.style.display = 'flex';

    var label = document.createElement('span');
    label.className = 'oab-spell-label';
    label.textContent = 'Spells:';
    panel.appendChild(label);

    var equipped = unit.magic && unit.magic.spells_equipped ? unit.magic.spells_equipped : [];
    equipped.forEach(function (spellId) {
      var def = window.OathAndBoneSpells ? window.OathAndBoneSpells.getSpellDef(spellId) : null;
      var costStr = '?';
      if (def && def.cost) {
        if (def.cost.mp !== undefined)       costStr = def.cost.mp + ' MP';
        else if (def.cost.souls !== undefined)   costStr = def.cost.souls + ' SL';
        else if (def.cost.verdance !== undefined) costStr = def.cost.verdance + ' VD';
      }
      // Afford check — disable if the caster can't afford this spell right now
      var canAfford = true;
      if (def && def.cost && unit.magic) {
        if (def.cost.mp !== undefined       && unit.magic.mana     < def.cost.mp)       canAfford = false;
        if (def.cost.souls !== undefined    && unit.magic.souls    < def.cost.souls)    canAfford = false;
        if (def.cost.verdance !== undefined && unit.magic.verdance < def.cost.verdance) canAfford = false;
      }
      var isSelected = spellId === _castSpellId;
      var btn = document.createElement('button');
      btn.className = 'oab-spell-btn' + (isSelected ? ' active' : '');
      btn.textContent = spellId.replace(/_/g, ' ').toUpperCase() + ' (' + costStr + ')';
      btn.disabled = !canAfford;
      if (canAfford) {
        btn.addEventListener('click', function () {
          _castSpellId = spellId;
          _castHexes = window.OathAndBoneSpells
            ? window.OathAndBoneSpells.getSpellTargetHexes(_selectedUnitId, spellId)
            : [];
          _buildSpellPanel(window.OathAndBoneEngine.getUnit(_selectedUnitId));
          render();
        });
      }
      panel.appendChild(btn);
    });
  }

  function _buildAbilityPanel(unit, sigs) {
    var panel = document.getElementById('oab-ability-panel');
    if (!panel) return;
    panel.innerHTML = '';
    panel.style.display = 'flex';

    var label = document.createElement('span');
    label.className = 'oab-spell-label';
    label.textContent = 'Abilities:';
    panel.appendChild(label);

    sigs.forEach(function (sig) {
      var btn = document.createElement('button');
      btn.className = 'oab-spell-btn';
      if (sig.kind === 'passive') {
        btn.textContent = sig.name.toUpperCase() + ' (AUTO)';
        btn.disabled = true;
        btn.title = sig.desc || '';
      } else if (sig.kind === 'spell') {
        btn.textContent = sig.name.toUpperCase() + ' (SPELL)';
        btn.disabled = true;
        btn.title = (sig.desc || '') + ' — cast from the CAST panel.';
      } else {
        var cd = (window.OathAndBoneAbilities && window.OathAndBoneAbilities.getAbilityCooldown)
          ? window.OathAndBoneAbilities.getAbilityCooldown(unit, sig.id) : 0;
        var label_txt = sig.name.toUpperCase() + (cd > 0 ? ' (CD ' + cd + ')' : ' (R' + (sig.range || 0) + ')');
        btn.textContent = label_txt;
        btn.disabled = cd > 0;
        btn.title = sig.desc || '';
        if (sig.id === _abilityId && cd === 0) btn.classList.add('active');
        if (cd === 0) {
          btn.addEventListener('click', function () {
            _abilityId = sig.id;
            _abilityHexes = window.OathAndBoneAbilities.getAbilityTargetHexes(_selectedUnitId, sig.id);
            _buildAbilityPanel(window.OathAndBoneEngine.getUnit(_selectedUnitId), sigs);
            render();
          });
        }
      }
      panel.appendChild(btn);
    });
  }

  function _hideSpellPanel() {
    var panel = document.getElementById('oab-spell-panel');
    if (panel) { panel.style.display = 'none'; panel.innerHTML = ''; }
  }

  function _hideAbilityPanel() {
    var panel = document.getElementById('oab-ability-panel');
    if (panel) { panel.style.display = 'none'; panel.innerHTML = ''; }
  }

  function _executeCast(q, r) {
    if (!_selectedUnitId || !_castSpellId) return;
    var ok = window.OathAndBoneEngine.castSpell(_selectedUnitId, _castSpellId, q, r);
    if (ok) {
      _castMode = false; _castSpellId = null; _castHexes = [];
      _hideSpellPanel();
    }
  }

  function _executeAbility(q, r) {
    if (!_selectedUnitId || !_abilityId) return;
    var ok = window.OathAndBoneEngine.resolveAbility(_selectedUnitId, _abilityId, q, r);
    if (ok) {
      _abilityMode = false; _abilityId = null; _abilityHexes = [];
      _hideAbilityPanel();
    }
  }

  function showFireVFX(q, r) {
    _vfxAt(q, r, 'oab-fire-vfx', 550, 40);
  }

  // Helper: drop a CSS-animated element at the hex center, auto-remove after ms
  function _vfxAt(q, r, className, ms, size) {
    if (!_stage) return;
    var pos = isoPos(q, r);
    size = size || 40;
    var cx = pos.x + TILE_W / 2 - size / 2;
    var cy = pos.y + TILE_H / 2 - size / 2;
    var el = document.createElement('div');
    el.className = className;
    el.style.cssText = 'left:' + cx + 'px;top:' + cy + 'px;width:' + size + 'px;height:' + size + 'px';
    _stage.appendChild(el);
    setTimeout(function () { if (el.parentNode) el.remove(); }, ms);
    return el;
  }

  // Gold streak from (fromQ,fromR) to (toQ,toR) — Braced Charge
  function showChargeVFX(fromQ, fromR, toQ, toR) {
    if (!_stage) return;
    var a = isoPos(fromQ, fromR);
    var b = isoPos(toQ, toR);
    var ax = a.x + TILE_W / 2, ay = a.y + TILE_H / 2;
    var bx = b.x + TILE_W / 2, by = b.y + TILE_H / 2;
    var dx = bx - ax, dy = by - ay;
    var length = Math.sqrt(dx * dx + dy * dy);
    var angle = Math.atan2(dy, dx) * 180 / Math.PI;
    var el = document.createElement('div');
    el.className = 'oab-vfx-charge';
    el.style.cssText = 'left:' + ax + 'px;top:' + (ay - 3) + 'px;width:' + length + 'px;transform:rotate(' + angle + 'deg)';
    _stage.appendChild(el);
    setTimeout(function () { if (el.parentNode) el.remove(); }, 300);
  }

  // Dispatcher: choose VFX class + duration per spell/ability id
  var _VFX_MAP = {
    'firebolt':          { cls: 'oab-fire-vfx',   ms: 550, size: 40 },
    'fireball':          { cls: 'oab-fire-vfx',   ms: 550, size: 60 },
    'incinerate':        { cls: 'oab-fire-vfx',   ms: 650, size: 50 },
    'spark':             { cls: 'oab-fire-vfx',   ms: 400, size: 36 },
    'frost_shard':       { cls: 'oab-vfx-frost',  ms: 350, size: 44 },
    'blizzard':          { cls: 'oab-vfx-frost',  ms: 450, size: 60 },
    'permafrost':        { cls: 'oab-vfx-frost',  ms: 450, size: 50 },
    'shield':            { cls: 'oab-vfx-frost',  ms: 400, size: 56 },
    'raise_skeleton':    { cls: 'oab-vfx-raise',  ms: 450, size: 60 },
    'raise_archer_wraith':{ cls: 'oab-vfx-raise', ms: 450, size: 60 },
    'raise_lich_servant':{ cls: 'oab-vfx-raise',  ms: 500, size: 60 },
    'curse_of_weakness': { cls: 'oab-vfx-raise',  ms: 400, size: 44 },
    'curse_of_binding':  { cls: 'oab-vfx-raise',  ms: 400, size: 44 },
    'curse_of_death':    { cls: 'oab-vfx-raise',  ms: 500, size: 48 },
    'life_drain':        { cls: 'oab-vfx-raise',  ms: 400, size: 44 },
    'bone_shield':       { cls: 'oab-vfx-raise',  ms: 350, size: 48 },
    'heal':              { cls: 'oab-vfx-heal',   ms: 400, size: 44 },
    'group_heal':        { cls: 'oab-vfx-heal',   ms: 400, size: 60 },
    'regrowth':          { cls: 'oab-vfx-heal',   ms: 400, size: 40 },
    'summon_wolf':       { cls: 'oab-vfx-paw',    ms: 450, size: 36 },
    'summon_bear':       { cls: 'oab-vfx-paw',    ms: 450, size: 48 },
    // Abilities
    'braced_charge':     { cls: 'oab-vfx-charge-impact', ms: 500, size: 44 },
    'cleaving_stroke':   { cls: 'oab-vfx-cleave', ms: 250, size: 80 },
    'loose_and_fade':    { cls: 'oab-vfx-fade',   ms: 350, size: 48 },
    'called_shot':       { cls: 'oab-vfx-reticle',ms: 900, size: 56 }
  };

  function showSpellOrAbilityVFX(id, casterQ, casterR, targetQ, targetR) {
    // Braced Charge needs a line-streak from caster → target, drawn first
    if (id === 'braced_charge') {
      showChargeVFX(casterQ, casterR, targetQ, targetR);
      _vfxAt(targetQ, targetR, 'oab-fire-vfx', 400, 40);
      return;
    }
    var m = _VFX_MAP[id];
    if (!m) {
      showFireVFX(targetQ, targetR);
      return;
    }
    _vfxAt(targetQ, targetR, m.cls, m.ms, m.size);
  }

  // Float a heal number (green) above the target
  function showHeal(target, amount) {
    if (!_stage) return;
    var p = unitDomPos(target);
    var el = document.createElement('div');
    el.className = 'oab-heal-num';
    el.textContent = '+' + amount;
    el.style.cssText = 'left:' + (p.sx + SPRITE_W / 2 - 14) + 'px;top:' + p.sy + 'px';
    _stage.appendChild(el);
    setTimeout(function () { if (el.parentNode) el.remove(); }, 950);
  }

  // Render passive-overlay shield icons on every relevant hex:
  //   Vanguard's Oath (gold) on tiles adjacent to a living player Vael
  //   Hold the Line (warm brown) on tiles adjacent to a living player Halv
  // Called from render() — cheap enough to redraw each frame.
  function _renderPassiveOverlays() {
    if (!_stage) return;
    // Clear previous overlay icons
    var old = _stage.querySelectorAll('.oab-vfx-passive');
    old.forEach(function (e) { e.remove(); });

    var battle = window.OathAndBoneEngine.getBattle();
    if (!battle || !battle.units) return;

    for (var id in battle.units) {
      var u = battle.units[id];
      if (u.hp <= 0) continue;
      if (u.heroId === 'vael') _drawPassiveIconsAround(u, 'oath');
      if (u.heroId === 'halv') _drawPassiveIconsAround(u, 'line');
    }
  }

  function _drawPassiveIconsAround(heroUnit, kind) {
    var DIR = [{q:1,r:0},{q:1,r:-1},{q:0,r:-1},{q:-1,r:0},{q:-1,r:1},{q:0,r:1}];
    for (var i = 0; i < DIR.length; i++) {
      var nq = heroUnit.q + DIR[i].q;
      var nr = heroUnit.r + DIR[i].r;
      var pos = isoPos(nq, nr);
      var tile = window.OathAndBoneEngine.getTile(nq, nr);
      if (!tile) continue;
      var el = document.createElement('div');
      el.className = 'oab-vfx-passive ' + kind;
      el.style.left = (pos.x + TILE_W / 2 - 7) + 'px';
      el.style.top  = (pos.y + TILE_H / 2 - 20) + 'px';
      _stage.appendChild(el);
    }
  }

  // Extracted advance-turn logic so tutorial dismiss can call it directly.
  function _doAdvanceTurn() {
    _pendingAdvance = false;
    _selectedUnitId = null;
    window.OathAndBoneEngine.advanceTurn();
    render();
    _scheduleEnemyTick();
  }

  // Show a tutorial modal for the given triggerId with the supplied copy text.
  // Appended to document.body so it covers the full viewport (incl. action panel).
  function showTutorialModal(triggerId, copyText) {
    _tutorialModalOpen = true;

    var overlay = document.createElement('div');
    overlay.className = 'oab-tut-overlay';
    overlay.id = 'oab-tut-overlay-' + triggerId;

    var box = document.createElement('div');
    box.className = 'oab-tut-box';

    var label = document.createElement('div');
    label.className = 'oab-tut-label';
    label.textContent = triggerId;

    var copy = document.createElement('div');
    copy.className = 'oab-tut-copy';
    copy.textContent = copyText;

    var btn = document.createElement('button');
    btn.className = 'oab-tut-gotit';
    btn.textContent = 'Got it';
    btn.addEventListener('click', function () {
      // Persist to localStorage so this tutorial never fires again for this user
      try {
        var seen = JSON.parse(localStorage.getItem('ksp_oathandbone_tutorials_seen') || '[]');
        if (seen.indexOf(triggerId) === -1) seen.push(triggerId);
        localStorage.setItem('ksp_oathandbone_tutorials_seen', JSON.stringify(seen));
      } catch (e) {}
      if (overlay.parentNode) overlay.remove();
      _tutorialModalOpen = false;
      if (_pendingBattleEnd) {
        // Battle ended while this tutorial was open — show the result overlay now.
        var pendingResult = _pendingBattleEnd;
        _pendingBattleEnd = null;
        showBattleEnd(pendingResult);
      } else if (_pendingAdvance) {
        _doAdvanceTurn();
      } else {
        // T3 fires during round start — no pending advance; just resume
        render();
        _scheduleEnemyTick();
      }
    });

    box.appendChild(label);
    box.appendChild(copy);
    box.appendChild(btn);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
  }

  function handleHoldBtn() {
    if (_tutorialModalOpen) return;
    _moveMode = false; _moveHexes = [];
    _attackMode = false; _attackHexes = [];
    _castMode = false; _castSpellId = null; _castHexes = [];
    _abilityMode = false; _abilityId = null; _abilityHexes = [];
    _hideSpellPanel();
    _hideAbilityPanel();
    _selectedUnitId = null;
    window.OathAndBoneEngine.advanceTurn();
    render();
    _scheduleEnemyTick();
  }

  // ── TURN BAR ─────────────────────────────────────────────────────────
  function updateTurnBar(msg) {
    var bar = document.getElementById('oab-turn-bar');
    if (!bar) return;
    if (msg) { bar.textContent = msg; return; }

    var battle  = window.OathAndBoneEngine.getBattle();
    var current = window.OathAndBoneEngine.getCurrentUnit();

    if (!current || battle.phase !== 'active') {
      bar.textContent = 'Round ' + battle.round;
      return;
    }

    var name = (current.heroId || current.id.split('_')[1] || current.id).toUpperCase();
    if (current.team === 'player') {
      if (_selectedUnitId === current.id) {
        var manaStr = (current.magic && current.magic.mana !== undefined)
          ? '  MP ' + current.magic.mana + '/' + current.magic.mana_max : '';
        bar.textContent = 'Round ' + battle.round + ' — ' + name + '  HP ' + current.hp + '/' + current.hp_max + '  Move ' + current.move + '  Atk ' + current.attack_range + manaStr + '  Choose an action.';
      } else {
        bar.textContent = 'Round ' + battle.round + ' — Click ' + name + ' to select, then choose an action.';
      }
    } else {
      bar.textContent = 'Round ' + battle.round + ' — Enemy turn: ' + name;
    }
  }

  function updateActionBtns() {
    var panel = document.getElementById('oab-action-panel');
    if (!panel) return;
    var sel     = _selectedUnitId ? window.OathAndBoneEngine.getUnit(_selectedUnitId) : null;
    var canAct  = sel && sel.hp > 0 && !sel.acted && sel.team === 'player';
    var canCast = canAct && sel.magic && sel.magic.spells_equipped && sel.magic.spells_equipped.length > 0;
    // Ability enabled for martial heroes (non-casters) with a signatures array.
    // Casters' signatures are spell-kind and cast from the CAST panel, so we
    // disable ABILITY for them to avoid duplicating the entry point.
    var sigs = (canAct && window.OathAndBoneAbilities && window.OathAndBoneAbilities.getHeroSignatures)
      ? window.OathAndBoneAbilities.getHeroSignatures(sel) : [];
    var hasActiveAbility = false;
    for (var i = 0; i < sigs.length; i++) {
      if (sigs[i].kind === 'active' || sigs[i].kind === 'passive') {
        hasActiveAbility = true; break;
      }
    }
    var canAbility = canAct && hasActiveAbility && !sel.magic;
    panel.querySelector('[data-action=move]').disabled    = !canAct;
    panel.querySelector('[data-action=attack]').disabled  = !canAct;
    panel.querySelector('[data-action=cast]').disabled    = !canCast;
    panel.querySelector('[data-action=ability]').disabled = !canAbility;
    panel.querySelector('[data-action=hold]').disabled    = !sel;
  }

  // ── DAMAGE FLOAT ─────────────────────────────────────────────────────
  function showDamage(target, damage) {
    if (!_stage) return;
    var p   = unitDomPos(target);
    var el  = document.createElement('div');
    el.className   = 'oab-dmg';
    el.textContent = '-' + damage;
    el.style.cssText = 'left:' + (p.sx + SPRITE_W / 2 - 14) + 'px;top:' + p.sy + 'px';
    _stage.appendChild(el);
    setTimeout(function () { if (el.parentNode) el.remove(); }, 950);
  }

  // ── ROUND BANNER ─────────────────────────────────────────────────────
  function showRoundBanner(round) {
    if (!_stage) return;
    var old = _stage.querySelector('.oab-round-banner');
    if (old) old.remove();
    var el = document.createElement('div');
    el.className   = 'oab-round-banner';
    el.textContent = 'Round ' + round;
    _stage.appendChild(el);
    setTimeout(function () { if (el.parentNode) el.remove(); }, 2000);
  }

  // ── BATTLE END HELPERS ────────────────────────────────────────────────

  // Returns { xp, crowns, credits } for display. Defeat grant per ECONOMY.md §2.
  function _computeRewards(result, scenario, tier) {
    if (result === 'defeat') {
      return { xp: 15, crowns: 10, credits: 0 };
    }
    var xp = (scenario && scenario.rewards && scenario.rewards.xp && scenario.rewards.xp[tier]) || 0;
    var baseCrowns = (scenario && scenario.rewards && scenario.rewards.crowns) || 0;
    var rewardMult = 1.0;
    if (scenario && scenario.difficulty_tiers && scenario.difficulty_tiers[tier]) {
      rewardMult = scenario.difficulty_tiers[tier].reward_mult || 1.0;
    }
    return { xp: xp, crowns: Math.floor(baseCrowns * rewardMult), credits: 0 };
  }

  // Returns array of player units with permadeath_loss flag set.
  function _getFallenHeroes(battle) {
    var fallen = [];
    for (var id in battle.units) {
      var u = battle.units[id];
      if (u.team === 'player' && u.permadeath_loss) fallen.push(u);
    }
    return fallen;
  }

  // Hardcoded voice barbs from HEROES.md — Worker 21 can wire dynamic advisor calls in V2.
  var _VICTORY_BARBS = [
    'Good work.',
    'For the seat.',
    "That's the opening.",
    'Got him.'
  ];
  var _DEFEAT_BARBS = [
    '\u2026I should have cast sooner.',
    "Get up. We're not done.",
    "I'm watching.",
    'The fire was always going to reach Highspire.'
  ];
  function _getAdvisorBarb(result) {
    var barbs = result === 'victory' ? _VICTORY_BARBS : _DEFEAT_BARBS;
    return barbs[Math.floor(Math.random() * barbs.length)];
  }

  // Creates a single reward row: icon · label · value
  function _rewardRow(icon, label, value, dataType) {
    var row = document.createElement('div');
    row.className = 'oab-results-row';
    var iconEl = document.createElement('span');
    iconEl.className = 'oab-results-icon';
    iconEl.textContent = icon;
    var labelEl = document.createElement('span');
    labelEl.className = 'oab-results-rlabel';
    labelEl.textContent = label;
    var valueEl = document.createElement('span');
    valueEl.className = 'oab-results-value';
    valueEl.textContent = value;
    if (dataType) valueEl.dataset.rewardType = dataType;
    row.appendChild(iconEl);
    row.appendChild(labelEl);
    row.appendChild(valueEl);
    return row;
  }

  // Non-blocking battle-result save. Routes through the cache layer so:
  //   1. Local history is written immediately (player sees history before network).
  //   2. Cache merges server-authoritative values (balance, fallen_heroes,
  //      unlocked_scenarios) on success.
  //   3. Offline tolerance: if server is unreachable, cache queues the save.
  function _saveToServer(result, scenario, tier, rewards, fallenHeroes, saveStatusEl, balanceEl, creditEl) {
    var caller = window.OathAndBoneCache || window.OathAndBoneServer;
    if (!caller || !caller.recordBattleResult) {
      if (saveStatusEl) saveStatusEl.textContent = 'Save unavailable \u2014 modules not loaded.';
      return;
    }
    var heroesLost = fallenHeroes.map(function (h) { return h.heroId || h.id; });
    caller.recordBattleResult({
      scenarioId:     (scenario && scenario.id) ? scenario.id.toUpperCase() : 'B1',
      outcome:        result,
      heroesLost:     heroesLost,
      xpEarned:       rewards.xp,
      crownsEarned:   rewards.crowns,
      difficultyTier: tier
    }).then(function (res) {
      if (!res || !res.ok) {
        if (saveStatusEl) {
          saveStatusEl.textContent = 'Save failed \u2014 will sync on next play.';
          saveStatusEl.style.color = '#e05c5c';
        }
        return;
      }
      if (typeof res.new_crown_balance === 'number' && balanceEl) {
        balanceEl.textContent = 'Crown balance: ' + res.new_crown_balance;
        balanceEl.style.display = 'block';
      }
      if (res.crown_credit_grant && res.crown_credit_grant.granted && creditEl) {
        creditEl.textContent = res.crown_credit_grant.granted;
      }
      // Propagate server-authoritative unlock state to currentState so
      // the Continue → world map reflects newly unlocked scenarios immediately.
      // (Cache layer already did this internally; this keeps the orchestrator's
      // in-memory copy in sync too.)
      if (window.OathAndBone && window.OathAndBone.currentState) {
        if (Array.isArray(res.unlocked_scenarios)) {
          window.OathAndBone.currentState.unlocked_scenarios = res.unlocked_scenarios;
        }
        if (res.current_battle) {
          window.OathAndBone.currentState.current_battle = res.current_battle;
        }
      }
    }).catch(function () {
      if (saveStatusEl) {
        saveStatusEl.textContent = 'Save failed \u2014 will sync on next play.';
        saveStatusEl.style.color = '#e05c5c';
      }
    });
  }

  // ── BATTLE END ───────────────────────────────────────────────────────
  function showBattleEnd(result) {
    // If a tutorial modal is blocking interaction, defer until the player
    // dismisses it — prevents the two overlays from stacking on top of each other.
    if (_tutorialModalOpen) {
      _pendingBattleEnd = result;
      return;
    }
    _moveMode = false; _attackMode = false; _selectedUnitId = null;
    render();
    if (!_stage) return;

    var battle   = window.OathAndBoneEngine.getBattle();
    var scenario = battle.scenario;
    var tier     = (scenario && scenario.difficultyTier) || 'sergeant';
    var rewards  = _computeRewards(result, scenario, tier);
    var fallen   = _getFallenHeroes(battle);

    // ── Overlay shell ──────────────────────────────────────────────────
    var overlay = document.createElement('div');
    overlay.className = 'oab-overlay';

    var box = document.createElement('div');
    box.className = 'oab-overlay-box oab-results-box';

    // VICTORY / DEFEAT title (visual channel — Soul Review ch.1)
    var title = document.createElement('div');
    title.className = 'oab-overlay-title ' + result;
    title.textContent = result === 'victory' ? 'VICTORY' : 'DEFEAT';
    box.appendChild(title);

    // TODO Worker 25: wire victory/defeat chime to this DOM event —
    // overlay.dispatchEvent(new CustomEvent('oab:battleend', { bubbles:true, detail:{ result:result } }))

    // ── Reward rows (numerical channel — Soul Review ch.3) ─────────────
    var rewardsDiv = document.createElement('div');
    rewardsDiv.className = 'oab-results-rewards';
    rewardsDiv.appendChild(_rewardRow('\u2b50', 'XP',      rewards.xp,      null));
    rewardsDiv.appendChild(_rewardRow('\u2a00', 'Crowns',  rewards.crowns,  null));
    var creditRow = _rewardRow('\u2299', 'Credits', rewards.credits, 'credits');
    var creditEl  = creditRow.querySelector('[data-reward-type]');
    rewardsDiv.appendChild(creditRow);
    box.appendChild(rewardsDiv);

    // Crown balance (revealed after server responds)
    var balanceEl = document.createElement('div');
    balanceEl.className = 'oab-results-balance';
    balanceEl.style.display = 'none';
    box.appendChild(balanceEl);

    // Save status
    var saveStatusEl = document.createElement('div');
    saveStatusEl.className = 'oab-results-save-status';
    box.appendChild(saveStatusEl);

    // ── Heroes lost / survived ─────────────────────────────────────────
    var fallenDiv = document.createElement('div');
    fallenDiv.className = 'oab-results-fallen';
    if (fallen.length > 0) {
      fallen.forEach(function (hero) {
        var name = (hero.heroId || hero.id.replace('player_', ''));
        name = name.charAt(0).toUpperCase() + name.slice(1);
        var line = document.createElement('div');
        line.className = 'oab-results-fallen-line';
        line.textContent = name + ' has fallen. ' +
          (hero.permadeath_game_over ? 'The battle is lost.' : 'They cannot be revived.');
        fallenDiv.appendChild(line);
      });
    } else {
      var survived = document.createElement('div');
      survived.className = 'oab-results-survived';
      survived.textContent = 'All heroes survived.';
      fallenDiv.appendChild(survived);
    }
    box.appendChild(fallenDiv);

    // ── Advisor voice barb (narrative channel — Soul Review ch.4) ──────
    var barb = document.createElement('div');
    barb.className = 'oab-results-barb';
    barb.textContent = '\u201c' + _getAdvisorBarb(result) + '\u201d';
    box.appendChild(barb);

    // ── Buttons ────────────────────────────────────────────────────────
    var btnRow = document.createElement('div');
    btnRow.className = 'oab-results-btns';

    var continueBtn = document.createElement('button');
    continueBtn.className = 'oab-btn';
    continueBtn.textContent = 'Continue';
    continueBtn.addEventListener('click', function () {
      // Prefer cache so the world map reflects the optimistic unlock from Bug B fix.
      var st = (window.OathAndBoneCache && window.OathAndBoneCache.getState()) ||
               (window.OathAndBone && window.OathAndBone.currentState) ||
               { unlocked_scenarios: ['b1'], current_battle: 'b1' };
      _showWorldMap(_container, st);
    });

    var replayBtn = document.createElement('button');
    replayBtn.className = 'oab-btn';
    replayBtn.textContent = 'Replay';
    replayBtn.addEventListener('click', function () {
      window.location.reload();
    });

    btnRow.appendChild(continueBtn);
    btnRow.appendChild(replayBtn);
    box.appendChild(btnRow);

    overlay.appendChild(box);
    _stage.appendChild(overlay);

    // Battle is over — clear any in-progress resume snapshot so the player
    // isn't offered a stale resume on the next visit.
    if (window.OathAndBoneCache) {
      window.OathAndBoneCache.clearBattleSnapshot();
    }

    // Non-blocking save — must NOT block UI on network call
    _saveToServer(result, scenario, tier, rewards, fallen, saveStatusEl, balanceEl, creditEl);
  }

  // ── RESUME PROMPT ────────────────────────────────────────────────────────
  // Shows the FFT blue chrome "Resume battle?" panel. Called by the
  // orchestrator when ksp_oab_battle_resume contains a valid snapshot.
  function _showResumePrompt(container, wrappedSnapshot, onResume, onDiscard) {
    if (!container) return;
    injectStyles();
    container.innerHTML = '';
    container.style.cssText = 'display:block;padding:0;min-height:auto';

    var snap = wrappedSnapshot.battle;
    var age  = Date.now() - new Date(wrappedSnapshot.ts).getTime();
    var mins = Math.round(age / 60000);
    var ageLabel = mins < 2 ? 'moments ago' : mins + ' min ago';

    var wrap = document.createElement('div');
    wrap.className = 'oab-worldmap'; // reuse FFT blue chrome styles

    var title = document.createElement('div');
    title.className = 'oab-tut-label';
    title.style.cssText = 'margin-bottom:14px;font-size:11px';
    title.textContent = 'BATTLE IN PROGRESS';
    wrap.appendChild(title);

    var copy = document.createElement('div');
    copy.className = 'oab-tut-copy';
    copy.style.cssText = 'font-size:14px;color:#c0d4f0;margin-bottom:20px;line-height:1.6';
    copy.innerHTML = 'You left a battle unfinished<br>' +
      '<span style="color:#7a7d8e;font-size:12px">' + ageLabel + ' \u2014 round ' +
      (snap.round || '?') + ' of ' + (snap.scenarioId || 'B1').toUpperCase() + '</span>';
    wrap.appendChild(copy);

    var btnRow = document.createElement('div');
    btnRow.style.cssText = 'display:flex;gap:12px;justify-content:center';

    var resumeBtn = document.createElement('button');
    resumeBtn.className = 'oab-btn';
    resumeBtn.textContent = 'Resume';
    resumeBtn.addEventListener('click', function () {
      container.innerHTML = '';
      if (typeof onResume === 'function') onResume();
    });

    var discardBtn = document.createElement('button');
    discardBtn.className = 'oab-btn';
    discardBtn.style.opacity = '0.6';
    discardBtn.textContent = 'Start fresh';
    discardBtn.addEventListener('click', function () {
      container.innerHTML = '';
      if (typeof onDiscard === 'function') onDiscard();
    });

    btnRow.appendChild(resumeBtn);
    btnRow.appendChild(discardBtn);
    wrap.appendChild(btnRow);
    container.appendChild(wrap);
  }

  // ── ENEMY AUTO-TURN ──────────────────────────────────────────────────
  // When the current unit is an enemy, call OathAndBoneAI.takeTurn() after
  // a short delay so the player can see each move. takeTurn() handles
  // advanceTurn() internally. If _animating is true when the callback fires,
  // the slide animation's completion callback will call render + reschedule.
  function _scheduleEnemyTick() {
    if (_tutorialModalOpen) return; // pause during tutorial modals
    if (_enemyTickBusy) return;
    var battle  = window.OathAndBoneEngine.getBattle();
    var current = window.OathAndBoneEngine.getCurrentUnit();
    if (!current || current.team !== 'enemy' || battle.phase !== 'active') return;

    _enemyTickBusy = true;
    setTimeout(function () {
      _enemyTickBusy = false;
      var cur = window.OathAndBoneEngine.getCurrentUnit();
      var b   = window.OathAndBoneEngine.getBattle();
      if (cur && cur.team === 'enemy' && b.phase === 'active') {
        if (window.OathAndBoneAI && window.OathAndBoneAI.takeTurn) {
          window.OathAndBoneAI.takeTurn(cur.id);
        } else {
          window.OathAndBoneEngine.advanceTurn();
        }
        if (!_animating) {
          render();
          _scheduleEnemyTick(); // chain for consecutive enemy units
        }
        // if _animating: the move animation's 320ms callback handles render + next tick
      }
    }, 400);
  }

  // ── WORLD MAP ────────────────────────────────────────────────────────

  var _SCENARIO_ORDER  = ['b1', 'b2', 'b3'];
  var _SCENARIO_BIOMES = { b1: 'B1 \u2014 Plains', b2: 'B2 \u2014 Forest', b3: 'B3 \u2014 Ruin' };

  function _scenarioCardState(id, unlocked, current) {
    if (unlocked.indexOf(id) === -1) return 'locked';
    if (id === current)              return 'available';
    return 'completed';
  }

  function _showWorldMap(container, state) {
    if (!container) return;
    injectStyles();
    container.innerHTML = '';
    container.style.cssText = 'display:block;padding:0;min-height:auto';

    // Source of truth is the local cache (keeps unlocked_scenarios current even
    // when server is down). Fall back to orchestrator in-memory copy, then empty.
    var _cacheState = window.OathAndBoneCache && window.OathAndBoneCache.getState();
    var st = state || _cacheState || (window.OathAndBone && window.OathAndBone.currentState) || {};
    var unlocked = Array.isArray(st.unlocked_scenarios) ? st.unlocked_scenarios : ['b1'];
    var current  = st.current_battle || 'b1';
    var scenarios = window.OathAndBoneScenarios || {};

    var wrap = document.createElement('div');
    wrap.className = 'oab-worldmap';

    var heading = document.createElement('div');
    heading.className = 'oab-worldmap-title';
    heading.textContent = 'ACT I \u2014 THE BORDERLANDS';
    wrap.appendChild(heading);

    var sub = document.createElement('div');
    sub.className = 'oab-worldmap-sub';
    sub.textContent = 'Choose your next engagement.';
    wrap.appendChild(sub);

    var cardRow = document.createElement('div');
    cardRow.className = 'oab-worldmap-cards';

    _SCENARIO_ORDER.forEach(function (id) {
      var sc    = scenarios[id];
      var cs    = _scenarioCardState(id, unlocked, current);
      var card  = document.createElement('div');
      card.className = 'oab-worldmap-card ' + cs;

      var biomeEl = document.createElement('div');
      biomeEl.className = 'oab-worldmap-card-biome';
      biomeEl.textContent = _SCENARIO_BIOMES[id] || id.toUpperCase();

      var nameEl = document.createElement('div');
      nameEl.className = 'oab-worldmap-card-name';
      nameEl.textContent = sc ? sc.name : id.toUpperCase();

      var stateEl = document.createElement('div');
      stateEl.className = 'oab-worldmap-card-state';
      stateEl.textContent = cs.toUpperCase();

      card.appendChild(biomeEl);
      card.appendChild(nameEl);
      card.appendChild(stateEl);

      if (cs === 'available') {
        (function (scenarioId) {
          card.addEventListener('click', function () {
            _startScenario(container, scenarioId);
          });
        }(id));
      }

      cardRow.appendChild(card);
    });

    wrap.appendChild(cardRow);
    container.appendChild(wrap);
  }

  function _startScenario(container, scenarioId) {
    var scenarios = window.OathAndBoneScenarios || {};
    var scenario  = scenarios[scenarioId] || scenarios['b1'];
    if (!scenario || !window.OathAndBoneEngine) return;
    if (window.OathAndBoneEngine.loadScenario) {
      window.OathAndBoneEngine.loadScenario(scenario);
    }
    if (window.OathAndBone && window.OathAndBone.currentState) {
      window.OathAndBone.currentState.current_battle = scenarioId;
    }
    var practiceMode = false;
    try {
      practiceMode = localStorage.getItem('ksp_oathandbone_played') ===
                     new Date().toISOString().slice(0, 10);
    } catch (e) {}
    window.OathAndBoneEngine.start(container, { practiceMode: practiceMode });
  }

  // ── FALLEN BARBS (HEROES.md voice register — party reaction when a hero falls) ─
  var _FALLEN_BARBS = {
    vael:    "We can't lose her.",
    halv:    "Oh, Halv.",
    brin:    "Damn.",
    caelen:  "...he should not have fallen.",
    marrow:  "What he owed, he's paid.",
    thessa:  "The grove loses a guardian."
  };

  // Bottom-of-screen italic toast — 2 second duration. Used for death narrative.
  function _showFallenToast(msg) {
    try {
      var el = document.createElement('div');
      el.style.cssText = [
        'position:fixed', 'bottom:60px', 'left:50%',
        'transform:translateX(-50%)',
        'background:rgba(20,20,30,0.92)', 'color:#c0d4f0',
        'padding:10px 22px', 'border-radius:4px',
        'z-index:10000',
        'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
        'font-size:13px', 'font-style:italic', 'pointer-events:none',
        'max-width:340px', 'text-align:center',
        'border:1px solid rgba(100,100,160,0.4)'
      ].join(';');
      el.textContent = msg;
      document.body.appendChild(el);
      setTimeout(function () {
        if (el.parentNode) el.parentNode.removeChild(el);
      }, 2000);
    } catch (e) {}
  }

  // ── ENGINE HOOKS ─────────────────────────────────────────────────────
  // Attached synchronously before the orchestrator calls start().
  // render.js loads BEFORE game-oath-and-bone.js in the HTML script order.

  window.OathAndBoneEngine.onReady = function (container, options) {
    _container = container;
    injectStyles();
    buildUI(container);
    render();
    _scheduleEnemyTick();
  };

  window.OathAndBoneEngine.onUnitMoved = function (unit, fromQ, fromR, toQ, toR) {
    _moveMode = false; _moveHexes = [];

    // Slide the existing sprite element to the destination position.
    // unit.q/r are already updated by the engine, so unitDomPos returns the to-pos.
    var sprite = _stage ? _stage.querySelector('[data-unit-id="' + unit.id + '"]') : null;
    if (sprite) {
      var toPos = unitDomPos(unit);
      _animating = true;
      sprite.style.transition = 'left 0.3s ease-out, top 0.3s ease-out';
      sprite.style.left   = toPos.sx + 'px';
      sprite.style.top    = toPos.sy + 'px';
      sprite.style.zIndex = unit.r + 1;
      setTimeout(function () {
        sprite.style.transition = '';
        _animating = false;
        render();
        _scheduleEnemyTick();
      }, 320);
    } else {
      // No sprite in DOM (first frame or unit without art) — instant redraw
      render();
      _scheduleEnemyTick();
    }
  };

  window.OathAndBoneEngine.onUnitAttacked = function (attacker, target, damage) {
    _attackMode = false; _attackHexes = [];
    showDamage(target, damage);
    // If player attacked, auto-advance after showing result (gated on tutorial modal)
    if (attacker.team === 'player') {
      render();
      updateTurnBar('Attack: ' + attacker.id.split('_')[1] + ' → -' + damage + ' HP');
      setTimeout(function () {
        if (_tutorialModalOpen) {
          // Tutorial opened (T1/T2) — _doAdvanceTurn will fire on "Got it" dismiss
          _pendingAdvance = true;
          return;
        }
        _doAdvanceTurn();
      }, 1200);
    } else {
      if (!_animating) {
        render();
        _scheduleEnemyTick();
      }
      // if _animating: slide completion callback handles render + reschedule
    }
  };

  window.OathAndBoneEngine.onRoundStart = function (round) {
    _selectedUnitId = null;
    showRoundBanner(round);
    if (!_animating) {
      render();
      _scheduleEnemyTick();
    }
  };

  window.OathAndBoneEngine.onBattleEnd = function (result) {
    showBattleEnd(result);
  };

  // Unit-fallen hook — fires from engine AFTER hp hits 0, BEFORE unit is
  // removed from turn queue. Delivers 3 Soul Review channels for permadeath:
  //   1. VISUAL:    grayscale + faded linger sprite (1.5s)
  //   2. NUMERICAL: damage float from the killing blow (fires via onUnitAttacked)
  //   3. NARRATIVE: voice barb toast from _FALLEN_BARBS (2s)
  // V2 audio worker hooks into this same event (4th channel deferred).
  window.OathAndBoneEngine.onUnitFallen = function (unit, killedBy) {
    // ── VISUAL: linger silhouette ──────────────────────────────────────
    if (_stage) {
      var pos = unitDomPos(unit);
      var key = unitSpriteKey(unit);
      var src = spriteSrc(key);
      var lingerEl;
      var sharedStyle = 'position:absolute' +
        ';left:' + pos.sx + 'px' +
        ';top:' + pos.sy + 'px' +
        ';width:' + SPRITE_W + 'px' +
        ';height:' + SPRITE_H + 'px' +
        ';filter:grayscale(1)' +
        ';opacity:0.4' +
        ';pointer-events:none' +
        ';image-rendering:pixelated' +
        ';z-index:' + (unit.q + unit.r + 2);
      if (src) {
        lingerEl = document.createElement('img');
        lingerEl.src = src;
        lingerEl.alt = key;
        lingerEl.style.cssText = sharedStyle;
      } else {
        lingerEl = document.createElement('div');
        lingerEl.textContent = (unit.heroId || unit.id || '?').charAt(0).toUpperCase();
        lingerEl.style.cssText = sharedStyle +
          ';display:flex;align-items:center;justify-content:center' +
          ';font-weight:bold;font-size:14px;color:#fff' +
          ';background:rgba(60,60,80,0.5);border-radius:4px';
      }
      lingerEl.className = 'oab-fallen-linger';
      _stage.appendChild(lingerEl);
      setTimeout(function () {
        if (lingerEl.parentNode) lingerEl.parentNode.removeChild(lingerEl);
      }, 1500);
    }

    // ── NARRATIVE: voice barb toast ────────────────────────────────────
    var heroId = (unit.heroId || unit.id.replace('player_', '') || '').toLowerCase();
    var barb   = _FALLEN_BARBS[heroId] || 'One of ours is gone.';
    _showFallenToast('\u201c' + barb + '\u201d');
  };

  // Tutorial trigger hook — render shows modal with copy from scenario
  window.OathAndBoneEngine.onTutorialTrigger = function (triggerId) {
    var battle = window.OathAndBoneEngine.getBattle();
    var scenario = battle && battle.scenario;
    if (!scenario || !scenario.tutorial_copy || !scenario.tutorial_copy[triggerId]) return;
    showTutorialModal(triggerId, scenario.tutorial_copy[triggerId]);
  };

  // Spell cast hook — per-spell VFX + damage/heal float + auto-advance
  window.OathAndBoneSpells.onSpellCast = function (caster, spellDef, targetQ, targetR, effectDetails, spellId) {
    showSpellOrAbilityVFX(spellId, caster.q, caster.r, targetQ, targetR);

    // Float first damage / heal number
    for (var i = 0; i < effectDetails.length; i++) {
      var ed = effectDetails[i];
      if (ed.type === 'damage' || ed.type === 'chain_damage') {
        var tgt = window.OathAndBoneEngine.getUnit(ed.target);
        if (tgt) showDamage(tgt, ed.amount);
        break;
      } else if (ed.type === 'heal') {
        var tgtH = window.OathAndBoneEngine.getUnit(ed.target);
        if (tgtH) showHeal(tgtH, ed.amount);
        break;
      }
    }
    render();
    updateTurnBar('Cast: ' + spellDef.school + ' \u2014 ' + (spellDef.effect.damage || spellDef.effect.heal || 'effect'));
    setTimeout(function () {
      _selectedUnitId = null;
      window.OathAndBoneEngine.advanceTurn();
      render();
      _scheduleEnemyTick();
    }, 1200);
  };

  // Ability-resolved hook — per-ability VFX + damage floats + auto-advance
  if (window.OathAndBoneAbilities) {
    window.OathAndBoneAbilities.onAbilityResolved = function (caster, abilityDef, targetQ, targetR, effects) {
      showSpellOrAbilityVFX(abilityDef.id, caster.q, caster.r, targetQ, targetR);
      for (var i = 0; i < effects.length; i++) {
        var e = effects[i];
        if (e.type === 'damage') {
          var tgt = window.OathAndBoneEngine.getUnit(e.target);
          if (tgt) showDamage(tgt, e.amount);
        }
      }
      render();
      updateTurnBar('Ability: ' + (abilityDef.id || '').replace(/_/g, ' ').toUpperCase());
      setTimeout(function () {
        _selectedUnitId = null;
        window.OathAndBoneEngine.advanceTurn();
        render();
        _scheduleEnemyTick();
      }, 1200);
    };
  }

  // ── SCENARIO LOAD ────────────────────────────────────────────────────
  // Called synchronously here so that by the time the orchestrator's
  // OathAndBone.init() polls and calls OathAndBoneEngine.start(), the
  // scenario is already registered (start() errors if scenario is null).
  window.OathAndBoneEngine.loadScenario(SCENARIO_B1);

  // ── PUBLIC API ───────────────────────────────────────────────────────
  window.OathAndBoneRender = {
    init: function (container, scenario) {
      if (scenario) window.OathAndBoneEngine.loadScenario(scenario);
      window.OathAndBoneEngine.start(container, {});
    },
    showWorldMap:    function (container, state)                          { _showWorldMap(container, state); },
    startScenario:   function (container, id)                            { _startScenario(container, id); },
    showResumePrompt: function (container, wrapped, onResume, onDiscard) { _showResumePrompt(container, wrapped, onResume, onDiscard); }
  };

}());

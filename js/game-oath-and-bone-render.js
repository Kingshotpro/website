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
  var _tileImgCache    = {};    // terrain → HTMLImageElement (Concern 1)
  var _mapScale        = 1;     // CSS scale applied to stage (Concern 2)
  var _resizeTimer     = null;  // throttle handle for window resize
  var _hoveredHex      = null;  // {q,r} under cursor, or null (Concern 3)

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
      // Fire VFX flash
      '.oab-fire-vfx{position:absolute;pointer-events:none;width:40px;height:40px;border-radius:50%;background:radial-gradient(circle,rgba(255,160,20,.9) 0%,rgba(255,60,0,.6) 50%,transparent 70%);z-index:1100;animation:oab-fire .5s ease-out forwards}',
      '@keyframes oab-fire{0%{opacity:1;transform:scale(.6)}60%{opacity:.9;transform:scale(1.3)}100%{opacity:0;transform:scale(1.8)}}',
      // Battle end overlay
      '.oab-overlay{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;z-index:2000;background:rgba(0,0,0,.72)}',
      '.oab-overlay-box{background:#16181f;border:2px solid #f0c040;border-radius:6px;padding:40px 60px;text-align:center;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif}',
      '.oab-overlay-title{font-size:28px;font-weight:900;letter-spacing:.12em;text-transform:uppercase;margin-bottom:12px}',
      '.oab-overlay-title.victory{color:#f0c040}',
      '.oab-overlay-title.defeat{color:#e05c5c}',
      '.oab-overlay-sub{font-size:14px;color:#7a7d8e}'
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
    ['move', 'attack', 'cast', 'hold'].forEach(function (action) {
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
    _moveMode   = false; _moveHexes   = [];
    _attackMode = false; _attackHexes = [];
    _castMode   = false; _castSpellId = null; _castHexes = [];
    render();
  }

  // ── CANVAS CLICK ─────────────────────────────────────────────────────
  function handleCanvasClick(px, py) {
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
    if (!_attackMode || !_selectedUnitId) return;
    if (!_hexInList(_attackHexes, enemyUnit.q, enemyUnit.r)) return;
    var res = window.OathAndBoneEngine.attackUnit(_selectedUnitId, enemyUnit.id);
    if (res) { _attackMode = false; _attackHexes = []; }
  }

  // ── ACTION BUTTONS ───────────────────────────────────────────────────
  function handleMoveBtn() {
    if (!_selectedUnitId) return;
    var unit = window.OathAndBoneEngine.getUnit(_selectedUnitId);
    if (!unit || unit.acted || unit.hp <= 0) return;
    _moveMode   = !_moveMode;
    _attackMode = false; _attackHexes = [];
    _moveHexes  = _moveMode ? window.OathAndBoneEngine.getMovableHexes(_selectedUnitId) : [];
    render();
  }

  function handleAttackBtn() {
    if (!_selectedUnitId) return;
    var unit = window.OathAndBoneEngine.getUnit(_selectedUnitId);
    if (!unit || unit.acted || unit.hp <= 0) return;
    _attackMode = !_attackMode;
    _moveMode   = false; _moveHexes = [];
    _attackHexes = _attackMode ? window.OathAndBoneEngine.getAttackableHexes(_selectedUnitId) : [];
    render();
  }

  function handleCastBtn() {
    if (!_selectedUnitId) return;
    var unit = window.OathAndBoneEngine.getUnit(_selectedUnitId);
    if (!unit || unit.acted || unit.hp <= 0 || !unit.magic) return;
    _castMode   = !_castMode;
    _moveMode   = false; _moveHexes   = [];
    _attackMode = false; _attackHexes = [];
    if (_castMode) {
      // Pre-select Firebolt as the only active spell for this proof-of-pipeline
      _castSpellId = 'firebolt';
      _castHexes   = window.OathAndBoneSpells
        ? window.OathAndBoneSpells.getSpellTargetHexes(_selectedUnitId, _castSpellId)
        : [];
      _buildSpellPanel(unit);
    } else {
      _castSpellId = null; _castHexes = [];
      _hideSpellPanel();
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
      var cost = def && def.cost && def.cost.mp !== undefined ? def.cost.mp + ' MP' : '?';
      var active = spellId === 'firebolt'; // Only Firebolt wired for Concern 3
      var btn = document.createElement('button');
      btn.className = 'oab-spell-btn' + (active ? ' active' : '');
      btn.textContent = spellId.replace(/_/g, ' ').toUpperCase() + ' (' + cost + ')';
      btn.disabled = !active;
      if (active) {
        btn.addEventListener('click', function () {
          _castSpellId = spellId;
          _castHexes = window.OathAndBoneSpells
            ? window.OathAndBoneSpells.getSpellTargetHexes(_selectedUnitId, spellId)
            : [];
          render();
        });
      }
      panel.appendChild(btn);
    });
  }

  function _hideSpellPanel() {
    var panel = document.getElementById('oab-spell-panel');
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

  function showFireVFX(q, r) {
    if (!_stage) return;
    var p = unitDomPos({ q: q, r: r,
      hp: 1, hp_max: 1,
      team: 'enemy' });
    // Use isoPos directly for tile center
    var pos = isoPos(q, r);
    var cx = pos.x + TILE_W / 2 - 20;
    var cy = pos.y + TILE_H / 2 - 20;
    var el = document.createElement('div');
    el.className = 'oab-fire-vfx';
    el.style.cssText = 'left:' + cx + 'px;top:' + cy + 'px';
    _stage.appendChild(el);
    setTimeout(function () { if (el.parentNode) el.remove(); }, 550);
  }

  function handleHoldBtn() {
    _moveMode = false; _moveHexes = [];
    _attackMode = false; _attackHexes = [];
    _castMode = false; _castSpellId = null; _castHexes = [];
    _hideSpellPanel();
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
    panel.querySelector('[data-action=move]').disabled   = !canAct;
    panel.querySelector('[data-action=attack]').disabled = !canAct;
    panel.querySelector('[data-action=cast]').disabled   = !canCast;
    panel.querySelector('[data-action=hold]').disabled   = !sel;
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

  // ── BATTLE END ───────────────────────────────────────────────────────
  function showBattleEnd(result) {
    _moveMode = false; _attackMode = false; _selectedUnitId = null;
    render();
    if (!_stage) return;
    var overlay = document.createElement('div');
    overlay.className = 'oab-overlay';
    var box   = document.createElement('div');
    box.className = 'oab-overlay-box';
    var title = document.createElement('div');
    title.className   = 'oab-overlay-title ' + result;
    title.textContent = result === 'victory' ? 'Victory' : 'Defeat';
    var sub = document.createElement('div');
    sub.className   = 'oab-overlay-sub';
    sub.textContent = result === 'victory' ? 'All enemies defeated.' : 'All heroes have fallen.';
    box.appendChild(title);
    box.appendChild(sub);
    overlay.appendChild(box);
    _stage.appendChild(overlay);
  }

  // ── ENEMY AUTO-TURN ──────────────────────────────────────────────────
  // When the current unit is an enemy, call OathAndBoneAI.takeTurn() after
  // a short delay so the player can see each move. takeTurn() handles
  // advanceTurn() internally. If _animating is true when the callback fires,
  // the slide animation's completion callback will call render + reschedule.
  function _scheduleEnemyTick() {
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
    // If player attacked, auto-advance after showing result
    if (attacker.team === 'player') {
      render();
      updateTurnBar('Attack: ' + attacker.id.split('_')[1] + ' → -' + damage + ' HP');
      setTimeout(function () {
        _selectedUnitId = null;
        window.OathAndBoneEngine.advanceTurn();
        render();
        _scheduleEnemyTick();
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

  // Spell cast hook — fire VFX + damage float + auto-advance turn
  window.OathAndBoneSpells.onSpellCast = function (caster, spellDef, targetQ, targetR, effectDetails) {
    showFireVFX(targetQ, targetR);
    // Extract damage from effectDetails (first damage entry)
    for (var i = 0; i < effectDetails.length; i++) {
      var ed = effectDetails[i];
      if (ed.type === 'damage' || ed.type === 'chain_damage') {
        var target = window.OathAndBoneEngine.getUnit(ed.target);
        if (target) showDamage(target, ed.amount);
        break;
      }
    }
    render();
    updateTurnBar('Cast: ' + spellDef.school + ' — ' + (spellDef.effect.damage || '?') + ' DMG');
    // Auto-advance after showing cast result
    setTimeout(function () {
      _selectedUnitId = null;
      window.OathAndBoneEngine.advanceTurn();
      render();
      _scheduleEnemyTick();
    }, 1200);
  };

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
    }
  };

}());

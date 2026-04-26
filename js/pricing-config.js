/**
 * pricing-config.js — Single source of truth for pricing at runtime.
 *
 * ANY pricing display on the site reads from window.KSP_PRICING.
 * Paywall overlays, pricing.html, CTA buttons, advisor-referenced amounts —
 * all of them. No hardcoded price strings anywhere else in the code.
 *
 * If this disagrees with docs/PRICING.md, docs/PRICING.md wins. Every edit
 * to this file must be a mirror of an edit to docs/PRICING.md in the same
 * commit. See docs/PRICING.md section "Changing this doc".
 *
 * Stripe buy links marked TODO: are placeholders. The Architect must create
 * the Stripe products (via the MCP or the Stripe dashboard) and paste the
 * real URLs here. Until then the buttons hit a 404.
 */
(function () {
  'use strict';

  window.KSP_PRICING = {
    // Free tier — informational only (no purchase link)
    free: {
      name:       'Free',
      price:      0,
      price_text: '$0/month',
      features:   [
        'Alliance rankings on every kingdom page',
        'All calculators, guides, hero database',
        'Top Players aggregator',
        '5 AI advisor conversations/day (DeepSeek)',
        '6-turn conversation context',
      ],
    },

    subscriptions: [
      {
        id:         'pro',
        name:       'Pro',
        price:      4.99,
        price_text: '$4.99/month',
        tagline:    'Unlimited AI, every kingdom\'s intel, 5 credits/mo',
        features:   [
          'Everything Free has',
          'Unlimited AI advisor (Haiku 4.5)',
          '12-turn conversation context',
          'KvK intel on every tracked kingdom',
          'Chat history export',
          'Character verification $2.99 (vs $4.99 free)',
          '5 bonus credits every month',
        ],
        stripe_product_id: 'prod_UNoVQD1Lx7PFc2',
        stripe_price_id:   'price_1TP2snCTwcITa9f2DRnl3zFX',
        buy_url:    'https://buy.stripe.com/28E9AS4dgfrk3Ej4G46Vq06',
        badge:      'most-popular',
      },
      {
        id:         'pro_plus',
        name:       'Pro+',
        price:      9.99,
        price_text: '$9.99/month',
        tagline:    'Sonnet for hard questions, 15 credits/mo',
        features:   [
          'Everything Pro has',
          'Sonnet-class AI for deep strategy questions',
          '20-turn conversation context',
          '15 bonus credits every month (vs 5)',
          'Priority on kingdom-request queue',
          'War Council badge',
        ],
        stripe_product_id: 'prod_UNoV4QpP2aCqLO',
        stripe_price_id:   'price_1TP2sqCTwcITa9f2sG0bTArf',
        buy_url:    'https://buy.stripe.com/28E6oG114cf8caP2xW6Vq07',
        badge:      'proposed',   // flip to '' once Architect confirms scope
        status:     'proposed',
      },
    ],

    credit_packs: [
      { id: 'starter',     credits: 10, price: 1.99,
        stripe_product_id: 'prod_UNoVWk1eTyLgD4',
        stripe_price_id:   'price_1TP2stCTwcITa9f22LhqHc4c',
        buy_url:           'https://buy.stripe.com/3cI4gyh02a70eiXa0o6Vq08' },
      { id: 'standard',    credits: 30, price: 4.99,
        stripe_product_id: 'prod_UNoVz4tzSeiavV',
        stripe_price_id:   'price_1TP2suCTwcITa9f2PmWgSAmQ',
        buy_url:           'https://buy.stripe.com/4gM4gy11492Wfn1dcA6Vq09' },
      { id: 'best-value',  credits: 75, price: 9.99,
        stripe_product_id: 'prod_UNoVIV7XtcfFoE',
        stripe_price_id:   'price_1TP2sxCTwcITa9f2AiA4SJH9',
        buy_url:           'https://buy.stripe.com/14AdR88tw0wqcaPdcA6Vq0a',
        badge:             'best-value' },
    ],

    // What credits buy. Referenced by any feature that gates via credits.
    // The paywall builds its unlock-buttons from kingdom_intel here.
    credit_actions: {
      kingdom_intel: [
        { credits: 1, duration_sec:      86400, label: '24 hours' },
        { credits: 3, duration_sec:     604800, label: '7 days'   },
        { credits: 8, duration_sec:    2592000, label: '30 days'  },
      ],
      world_chat_snapshot: { credits: 1, permanent: true },
      kingdom_add:         { credits: 5, credits_expedited: 10 },  // new kingdom
      kingdom_refresh:     { credits: 3, credits_expedited: 6  },  // update existing
      char_verify_free:    { dollars: 4.99 },
      char_verify_pro:     { dollars: 2.99 },
    },

    // ── Oath and Bone Crown Economy ───────────────────────────────────────
    // Verbatim from ECONOMY.md §5 (passes) and §7 (packs). Any change here
    // must mirror docs/PRICING.md "Oath and Bone Crown Economy" section.
    // Stripe products + payment links live (created 2026-04-26 by Architect via
    // Stripe MCP). Price IDs noted for webhook routing — see DECISIONS entry.
    oathandbone: {
      crown_packs: {
        // price_1TQQ4KCTwcITa9f2mzxPOoy7  (prod_UPEWa8eLPmaD0m)
        pocket: { usd: 0.99,  crowns: 200,   bonus: 0,    stripe_url: 'https://buy.stripe.com/fZu14m8tw92WcaPdcA6Vq0b' },
        // price_1TQQ4SCTwcITa9f27L1hWYBM  (prod_UPEWYxFVmePYcj)
        coffer: { usd: 4.99,  crowns: 1200,  bonus: 200,  stripe_url: 'https://buy.stripe.com/eVqdR8fVY6UOdeTb4s6Vq0c' },
        // price_1TQQ4ZCTwcITa9f2deUUxAgg  (prod_UPEW2z1Er0K327)
        hoard:  { usd: 19.99, crowns: 5500,  bonus: 1500, stripe_url: 'https://buy.stripe.com/aFafZgaBEcf84In2xW6Vq0d' },
        // price_1TQQ4gCTwcITa9f2XkhyCxpt  (prod_UPEWxNFDcWWjvj)
        kings:  { usd: 49.99, crowns: 15000, bonus: 5000, stripe_url: 'https://buy.stripe.com/5kQ5kC9xAcf85Mr3C06Vq0e' },
      },
      passes: {
        // price_1TQQ4pCTwcITa9f2A7a8fzZo  (prod_UPEXhM6bbwPQM7)  — recurring monthly
        chapter:  { usd: 4.99, duration: '1 chapter',  stripe_url: 'https://buy.stripe.com/dRm9ASfVYgvo1wbegE6Vq0f' },
        // price_1TQQ4wCTwcITa9f2OAlnzzJo  (prod_UPEX7HlWQtmBwv)  — recurring monthly
        campaign: { usd: 9.99, duration: '1 month',    stripe_url: 'https://buy.stripe.com/5kQ5kCaBE2Ey4In5K86Vq0g' },
      },
      // Category order mirrors ECONOMY.md §3 headings verbatim.
      shop_categories: [
        'equipment', 'consumables', 'spells', 'reagents',
        'boosts', 'training', 'cosmetics'
      ],
      credit_to_crown_rate: 50,  // 1 credit = 50 Crowns, one-way (ECONOMY.md §4)
    },

    // Short reference the paywall CTA can link to. Always respects KSP_BASE.
    get pricing_page_url() {
      return (window.KSP_BASE || '') + 'pricing.html';
    },

    // Utility: human-readable formatter shared by every view
    formatPrice: function (p) {
      if (p === 0 || p === '0') return 'Free';
      var n = typeof p === 'number' ? p : parseFloat(p);
      if (isNaN(n)) return '';
      return '$' + n.toFixed(2);
    },
  };

  // Sanity check — any Claude editing this file should still have these
  // keys present. If a future refactor breaks the shape, code that reads
  // from here will console-warn before silently breaking the UI.
  ['free', 'subscriptions', 'credit_packs', 'credit_actions', 'oathandbone'].forEach(function (k) {
    if (!window.KSP_PRICING[k]) {
      console.warn('[KSP_PRICING] missing required key:', k);
    }
  });
})();

import puppeteer from '@cloudflare/puppeteer';

const UPSTREAM_BASE = 'https://kingshot-giftcode.centurygame.com';

const ROUTES = {
  '/player': '/api/player',
  '/redeem': '/api/player',
};

// ── Kingshot grounding + tier routing + soft-cap config ──────────────────────
// Added April 2026. If tier pricing changes, update TIER_REVENUE_USD and
// (optionally) TIER_MODELS to swap the routed model for each tier.

const GROUNDING_APPENDIX = '\n\nKINGSHOT REFERENCE (canonical — do not invent beyond this):\n' +
  'HEROES (only reference these; do not invent new heroes): Amadeus (infantry, rally-lead, VIP), Jabel (cavalry, garrison tank, F2P), Helga (infantry, rally), Saul (archer, garrison joiner, F2P), Zoe, Hilde, Marlin, Petra, Eric, Jaeger, Rosa, Alcar, Margot, Vivian, Thrud, Long Fei, Yang, Sophia, Triton, Chenko, Amane, Yeonwoo, Gordon, Howard, Quinn, Diana, Fahd. If a hero is mentioned that is not in this list, say you are unfamiliar and ask the Governor to clarify.\n' +
  'TROOPS: tiers T1\u2013T10. Higher Furnace levels unlock higher tiers. T4 unlocks near Furnace 20.\n' +
  'BUILDINGS: Furnace, Barracks, Stable, Archer Camp, Academy, Embassy, Treasury.\n' +
  'EVENTS: KvK, Alliance Mobilization, Bear Hunt, Castle Battles.\n' +
  'Never invent Kingshot-specific terminology. If uncertain, ask the Governor to clarify.';

// Model routing by tier. Swap these lines to change which AI a tier uses.
// providers: 'deepseek' | 'anthropic' | 'openai'
const TIER_MODELS = {
  free:     { provider: 'deepseek',  model: 'deepseek-chat' },
  pro:      { provider: 'anthropic', model: 'claude-haiku-4-5' },
  pro_plus: { provider: 'anthropic', model: 'claude-sonnet-4-6', fallback_model: 'claude-haiku-4-5' },
};

// Revenue per tier per month (drives soft-cap thresholds)
const TIER_REVENUE_USD = { free: 0, pro: 4.99, pro_plus: 9.99 };

// Conversation context window per tier (turns of history kept in context)
const TIER_CONTEXT_WINDOW = { free: 6, pro: 12, pro_plus: 20 };

// Provider pricing — USD per million tokens. Keep in sync with provider pages.
const ANTHROPIC_RATES = {
  'claude-haiku-4-5':  { in: 1.00, out: 5.00,  cache_read: 0.10, cache_write_5m: 1.25 },
  'claude-sonnet-4-6': { in: 3.00, out: 15.00, cache_read: 0.30, cache_write_5m: 3.75 },
};
const DEEPSEEK_RATES = { in: 0.28, out: 0.42 };
const OPENAI_RATES = {
  'gpt-4o-mini': { in: 0.15, out: 0.60 },
  'gpt-4o':      { in: 2.50, out: 10.00 },
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return corsWrap(null, 204);
    }

    if (request.method === 'POST') {
      if (url.pathname === '/auth/send') {
        return handleAuthSend(request, env);
      } else if (url.pathname === '/auth/verify') {
        return handleAuthVerify(request, env);
      } else if (url.pathname === '/advisor/chat') {
        return handleAdvisorChat(request, env);
      } else if (url.pathname === '/advisor/consult') {
        return handleAdvisorConsult(request, env);
      } else if (url.pathname === '/advisor/chronicle') {
        return handleChronicle(request, env);
      } else if (url.pathname === '/advisor/illustration') {
        return handleIllustration(request, env);
      } else if (url.pathname === '/advisor/video') {
        return handleAdvisorVideo(request, env);
      } else if (url.pathname === '/advisor/voice') {
        return handleVoice(request, env);
      } else if (url.pathname === '/advisor/portrait') {
        return handlePortrait(request, env);
      } else if (url.pathname === '/stripe/webhook') {
        return handleStripeWebhook(request, env);
      } else if (url.pathname === '/verify/request') {
        return handleVerifyRequest(request, env);
      } else if (url.pathname === '/verify/confirm') {
        return handleVerifyConfirm(request, env);
      } else if (url.pathname === '/verify/admin') {
        return handleVerifyAdmin(request, env);
      } else if (url.pathname === '/survey/submit') {
        return handleSurveySubmit(request, env);
      } else if (url.pathname === '/verify/mark-sent') {
        return handleVerifyMarkSent(request, env);
      } else if (url.pathname === '/kingdom/request') {
        return handleKingdomRequest(request, env);
      } else if (url.pathname === '/intel/unlock-kingdom') {
        return handleIntelUnlockKingdom(request, env);
      } else if (url.pathname === '/worldchat/unlock') {
        return handleWorldchatUnlock(request, env);
      } else if (url.pathname === '/player/lookup') {
        return handlePlayerLookup(request, env);
      } else if (url.pathname === '/oath-and-bone/save') {
        return handleOabSave(request, env);
      } else if (url.pathname === '/oath-and-bone/spend') {
        return handleOabSpend(request, env);
      } else if (url.pathname === '/oath-and-bone/battle-result') {
        return handleOabBattleResult(request, env);
      }
    }

    // Oath and Bone — /load is a GET so it caches cleanly + replays
    // safely on transient network errors. No body required; FID derives
    // from the cookie session via getUser().
    if (request.method === 'GET' && url.pathname === '/oath-and-bone/load') {
      return handleOabLoad(request, env);
    }

    // Admin GETs + public GETs
    if (request.method === 'GET' && url.pathname === '/codes/check') {
      return handleCodeCheck(request, env);
    }
    if (request.method === 'GET' && url.pathname === '/codes/list') {
      return handleCodeList(request, env);
    }
    if (request.method === 'GET' && url.pathname === '/video/cache') {
      return handleVideoCacheAdmin(request, env, url);
    }
    if (request.method === 'GET' && url.pathname === '/survey/admin') {
      return handleSurveyAdmin(request, env, url);
    }
    if (request.method === 'GET' && url.pathname === '/verify/admin') {
      return handleVerifyAdminPage(request, env, url);
    }
    if (request.method === 'GET' && url.pathname === '/credits/balance') {
      return handleCreditsBalance(request, env);
    }
    if (request.method === 'GET' && url.pathname === '/advisor/history') {
      return handleAdvisorHistory(request, env);
    }
    if (request.method === 'GET' && url.pathname === '/user/me') {
      return handleUserMe(request, env);
    }

    const upstream = ROUTES[url.pathname];
    if (!upstream) {
      return corsWrap('{"error":"not found"}', 404);
    }

    let body;
    try {
      body = await request.text();
    } catch {
      return corsWrap('{"error":"bad request"}', 400);
    }

    let upstreamRes;
    try {
      upstreamRes = await fetch(`${UPSTREAM_BASE}${upstream}`, {
        method: 'POST',
        headers: {
          'Content-Type': request.headers.get('Content-Type') || 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0',
        },
        body,
      });
    } catch {
      return corsWrap('{"error":"upstream unreachable"}', 502);
    }

    const responseText = await upstreamRes.text();
    return corsWrap(responseText, upstreamRes.status);
  },
};

async function handleAuthSend(request, env) {
  let email;
  try {
    const { email: emailBody } = await request.json();
    email = emailBody;
  } catch {
    return corsWrap('{"error":"bad request"}', 400);
  }

  const token = crypto.randomUUID();
  await env.KV.put(`auth_token:${token}`, JSON.stringify({ email, created: Date.now() }), { expirationTtl: 600 });

  const emailBody = {
    from: 'no-reply@kingshotpro.com',
    to: email,
    subject: 'Your Magic Link',
    html: `<p>Click <a href="https://kingshotpro.com/auth?token=${token}">here</a> to log in.</p>`,
  };

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailBody),
    });
  } catch {
    return corsWrap('{"error":"email send failed"}', 500);
  }

  return corsWrap('{"ok":true}', 200);
}

async function handleAuthVerify(request, env) {
  let token, fid;
  try {
    const body = await request.json();
    token = body.token;
    fid = body.fid;
  } catch {
    return corsWrap('{"error":"bad request"}', 400);
  }

  const authData = await env.KV.get(`auth_token:${token}`, { type: 'json' });
  if (!authData) {
    return corsWrap('{"error":"invalid token"}', 400);
  }

  const { email } = authData;
  const userKey = `user:${email}`;

  // FIX: previously this function unconditionally created a new record,
  // wiping any existing tier/credits/memory on every magic-link sign-in.
  // Load existing first; only construct a fresh record if none exists.
  // AUDIT_SPEC.md described this fix — verified not applied until now.
  let userData = await env.KV.get(userKey, { type: 'json' });
  if (!userData) {
    userData = {
      email,
      fid,
      tier: 'free',
      created: Date.now(),
      energy_today: 5,
      energy_date: new Date().toISOString().split('T')[0],
      memory: [],
      credits: 0,
      credit_history: [],
    };
  } else {
    // Returning user — update fid if they passed a new one
    if (fid && fid !== userData.fid) userData.fid = fid;
    // Defensive: seed credit fields on records that predate this code
    if (userData.credits === undefined)            userData.credits = 0;
    if (!Array.isArray(userData.credit_history))   userData.credit_history = [];
  }

  await env.KV.put(userKey, JSON.stringify(userData));

  const sessionToken = crypto.randomUUID();
  await env.KV.put(`session:${sessionToken}`, JSON.stringify({ email }));
  await env.KV.delete(`auth_token:${token}`);

  const response = corsWrapCred(request, JSON.stringify({ ok: true, tier: userData.tier || 'free' }), 200);
  response.headers.append('Set-Cookie', `ksp_session=${sessionToken}; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=2592000`);
  return response;
}

async function handleAdvisorChat(request, env) {
  let message, fid, playerContext, archetype, advisorName;
  try {
    const body = await request.json();
    message = body.message;
    fid = body.fid;
    playerContext = body.playerContext;
    archetype = body.archetype;
    advisorName = body.advisorName;
  } catch {
    return corsWrap('{"error":"bad request"}', 400);
  }

  const user = await getUser(request, env);
  let energyKey = `energy:${fid}`;
  let energyData = await env.KV.get(energyKey, { type: 'json' });
  const today = new Date().toISOString().split('T')[0];

  if (!user) {
    // Anonymous user: energy by FID
    if (!energyData) energyData = { energy_today: 5, energy_date: today };
    if (energyData.energy_date !== today) { energyData.energy_today = 5; energyData.energy_date = today; }
    if (energyData.energy_today <= 0) {
      return corsWrap('{"error":"energy_depleted","tier":"free"}', 403);
    }
  } else if (user.tier === 'free') {
    if (user.energy_date !== today) {
      user.energy_today = 5;
      user.energy_date = today;
    }
    if (user.energy_today <= 0) {
      return corsWrap('{"error":"energy_depleted","tier":"free"}', 403);
    }
  }

  // Tier known early so all downstream logic can reference it
  const tier = user ? user.tier : 'free';

  // Build system prompt: base + player context + archetype identity + grounding layer
  let systemPrompt = (env.SYSTEM_PROMPT || 'You are a medieval advisor for Kingshot players.') +
    '\n\nPlayer context: ' + (playerContext ? JSON.stringify(playerContext) : 'Unknown') +
    '\n\nYou are ' + (advisorName || 'the advisor') + ', archetype: ' + (archetype || 'steward') +
    '. Stay in character. Be concise and strategic.' +
    GROUNDING_APPENDIX;

  // Conversation windowing — tier-aware, prevents context bloat for long chats
  const windowSize = TIER_CONTEXT_WINDOW[tier] || 6;
  let memoryMessages = [];
  if (user && user.memory) {
    if (user.tier === 'pro' || user.tier === 'war_council') {
      // Pro / WC also filter by 7-day recency
      const sevenDaysAgo = Date.now() - 7 * 86400000;
      memoryMessages = user.memory.filter(function(m) { return !m.ts || m.ts > sevenDaysAgo; }).slice(-windowSize);
    } else {
      // Free and Elite: just take the last N by window size
      memoryMessages = user.memory.slice(-windowSize);
    }
  } else {
    const fidMem = await env.KV.get(`memory:${fid}`, { type: 'json' });
    if (fidMem) memoryMessages = fidMem.slice(-windowSize);
  }

  // Strip timestamps before sending to the AI (API only wants role + content)
  const apiMessages = memoryMessages.map(function(m) { return { role: m.role, content: m.content }; });
  apiMessages.push({ role: 'user', content: message });

  // Check cumulative cost this billing cycle → drives "weary advisor" soft-cap
  const costThisCycle = await getCostThisCycle(env, fid);
  const wearyState = getWearyState(costThisCycle, tier);
  systemPrompt = applyWearyFraming(systemPrompt, wearyState);

  // Tier-based model routing. If soft-cap is in "downgraded" state, fall back to free provider.
  let modelConfig = TIER_MODELS[tier] || TIER_MODELS.free;
  if (wearyState === 'downgraded') {
    modelConfig = TIER_MODELS.free;
  }

  // Call the AI provider
  let assistantMessage = '';
  let callCost = 0;
  try {
    let result;
    if (modelConfig.provider === 'anthropic') {
      result = await callAnthropic(env, modelConfig.model, systemPrompt, apiMessages);
    } else if (modelConfig.provider === 'deepseek') {
      result = await callDeepSeek(env, systemPrompt, apiMessages);
    } else if (modelConfig.provider === 'openai') {
      result = await callOpenAI(env, modelConfig.model, systemPrompt, apiMessages);
    } else {
      throw new Error('unknown provider: ' + modelConfig.provider);
    }
    assistantMessage = result.text || 'My counsel falters. Try again, Governor.';
    callCost = result.cost || 0;
  } catch (e) {
    return corsWrap(JSON.stringify({ error: 'ai service unreachable', detail: String(e && e.message ? e.message : e) }), 502);
  }

  // Track cost for future soft-cap decisions
  if (callCost > 0) {
    await addCost(env, fid, callCost);
  }

  // Store memory + decrement free-tier energy
  const now = Date.now();
  const newEntry = [{ role: 'user', content: message, ts: now }, { role: 'assistant', content: assistantMessage, ts: now }];
  if (user) {
    user.memory = [...(user.memory || []), ...newEntry].slice(-100);
    if (user.tier === 'free') user.energy_today--;
    await env.KV.put(`user:${user.email}`, JSON.stringify(user));
  } else {
    // Anonymous user: store memory by FID
    let fidMem = await env.KV.get(`memory:${fid}`, { type: 'json' }) || [];
    fidMem = [...fidMem, ...newEntry].slice(-100);
    await env.KV.put(`memory:${fid}`, JSON.stringify(fidMem));
    // Decrement anonymous energy
    if (!energyData) energyData = { energy_today: 5, energy_date: today };
    energyData.energy_today--;
    await env.KV.put(energyKey, JSON.stringify(energyData));
  }

  const remaining = user ? user.energy_today : (energyData ? energyData.energy_today : 0);
  return corsWrap(JSON.stringify({
    response: assistantMessage,
    energy_remaining: remaining,
    tier,
    weary_state: wearyState,
  }), 200);
}

// ── Free-tier "consultation" endpoint ───────────────────────────────────────
// Used by consult.html. Each call is a real page navigation on the client
// side, which = a new legitimate AdSense impression. Because the revenue
// model is ad-funded per-call, there is NO energy cap here — unlimited
// free consultations, economics work because each Q triggers a new ad view.
// Always routed through DeepSeek (cheapest usable model).

async function handleAdvisorConsult(request, env) {
  let message, fid, playerContext, archetype, advisorName;
  try {
    const body = await request.json();
    message = body.message;
    fid = body.fid;
    playerContext = body.playerContext;
    archetype = body.archetype;
    advisorName = body.advisorName;
  } catch {
    return corsWrap('{"error":"bad request"}', 400);
  }

  if (!message || !fid) {
    return corsWrap('{"error":"message and fid required"}', 400);
  }

  // Build system prompt with grounding layer (same as chat path)
  const systemPrompt = (env.SYSTEM_PROMPT || 'You are a medieval advisor for Kingshot players.') +
    '\n\nPlayer context: ' + (playerContext ? JSON.stringify(playerContext) : 'Unknown') +
    '\n\nYou are ' + (advisorName || 'the advisor') + ', archetype: ' + (archetype || 'steward') +
    '. Stay in character. Be concise and strategic.' +
    GROUNDING_APPENDIX;

  // Load last 6 turns of memory (free-tier window)
  const fidMem = await env.KV.get(`memory:${fid}`, { type: 'json' });
  const windowSize = TIER_CONTEXT_WINDOW.free;
  const memoryMessages = (fidMem || []).slice(-windowSize).map(function(m) {
    return { role: m.role, content: m.content };
  });
  memoryMessages.push({ role: 'user', content: message });

  // Always route through DeepSeek for the consultation path
  let assistantMessage = '';
  let callCost = 0;
  try {
    const result = await callDeepSeek(env, systemPrompt, memoryMessages);
    assistantMessage = result.text || 'My counsel falters. Try again, Governor.';
    callCost = result.cost || 0;
  } catch (e) {
    return corsWrap(JSON.stringify({ error: 'ai service unreachable', detail: String(e && e.message ? e.message : e) }), 502);
  }

  // Track cost for analytics (free tier has no soft-cap, but the data is useful)
  if (callCost > 0) {
    await addCost(env, fid, callCost);
  }

  // Store turn in memory (anonymous/FID-keyed, same as free chat path)
  const now = Date.now();
  const newEntry = [
    { role: 'user', content: message, ts: now },
    { role: 'assistant', content: assistantMessage, ts: now },
  ];
  let updatedMem = (fidMem || []).concat(newEntry).slice(-100);
  await env.KV.put(`memory:${fid}`, JSON.stringify(updatedMem));

  return corsWrap(JSON.stringify({
    response: assistantMessage,
    tier: 'free',
    flow: 'consult',
  }), 200);
}

async function getUser(request, env) {
  const cookieHeader = request.headers.get('Cookie');
  if (!cookieHeader) return null;

  const cookies = Object.fromEntries(cookieHeader.split('; ').map(c => c.split('=')));
  const sessionToken = cookies['ksp_session'];
  if (!sessionToken) return null;

  const sessionData = await env.KV.get(`session:${sessionToken}`, { type: 'json' });
  if (!sessionData) return null;

  const userData = await env.KV.get(`user:${sessionData.email}`, { type: 'json' });
  return userData || null;
}

// ── Verification System ────────────────────
async function handleVerifyRequest(request, env) {
  let fid, kingdom, email;
  try {
    const body = await request.json();
    fid = body.fid;
    kingdom = body.kingdom;
    email = body.email;
  } catch { return corsWrap('{"error":"bad request"}', 400); }

  if (!fid || !kingdom || !email) return corsWrap('{"error":"fid, kingdom, and email required"}', 400);

  // Pull player nickname from Century Games API
  let nickname = 'Unknown';
  try {
    const pidRes = await fetch(UPSTREAM_BASE + '/api/player', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' },
      body: JSON.stringify({ fid: String(fid), cdkey: '' }),
    });
    const pidData = await pidRes.json();
    if (pidData.data && pidData.data.nickname) nickname = pidData.data.nickname;
    else if (pidData.data && Array.isArray(pidData.data) && pidData.data.length === 0) nickname = '(FID not found)';
  } catch { /* API failed, continue with Unknown */ }

  // Check if already verified
  const existing = await env.KV.get(`verified:${fid}`, { type: 'json' });
  if (existing) return corsWrap('{"error":"already_verified"}', 400);

  // Generate 6-digit code
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const req = {
    fid, kingdom, email, code, nickname,
    status: 'pending', // pending → code_sent → verified → expired
    created: Date.now(),
    expires: Date.now() + 48 * 3600 * 1000, // 48 hours
  };

  await env.KV.put(`verify:${fid}`, JSON.stringify(req), { expirationTtl: 172800 });

  // Add to pending queue (list of FIDs with pending verification)
  let queue = await env.KV.get('verify_queue', { type: 'json' }) || [];
  if (!queue.includes(fid)) { queue.push(fid); }
  await env.KV.put('verify_queue', JSON.stringify(queue));

  // Discord notification
  if (env.DISCORD_WEBHOOK) {
    try {
      await fetch(env.DISCORD_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          embeds: [{
            title: '\uD83D\uDD14 New Verification Request',
            color: 15778880,
            fields: [
              { name: 'Player Name', value: nickname, inline: true },
              { name: 'Player ID', value: fid, inline: true },
              { name: 'Kingdom', value: String(kingdom), inline: true },
              { name: 'Email', value: email, inline: false },
              { name: '\uD83D\uDD11 CODE TO SEND IN-GAME', value: '**' + code + '**', inline: false },
            ],
            footer: { text: 'Find "' + nickname + '" in Kingdom ' + kingdom + ' \u2192 send them this code via in-game mail' },
          }],
        }),
      });
    } catch { /* discord failed but request still saved */ }
  }

  return corsWrap(JSON.stringify({ ok: true, message: 'Verification request submitted. Check your in-game mail within 48 hours.' }));
}

async function handleVerifyConfirm(request, env) {
  let fid, code;
  try {
    const body = await request.json();
    fid = body.fid;
    code = body.code;
  } catch { return corsWrap('{"error":"bad request"}', 400); }

  const req = await env.KV.get(`verify:${fid}`, { type: 'json' });
  if (!req) return corsWrap('{"error":"no pending verification for this FID"}', 404);
  if (req.status === 'verified') return corsWrap('{"error":"already verified"}', 400);
  if (Date.now() > req.expires) return corsWrap('{"error":"verification expired, please request again"}', 410);
  if (req.code !== String(code)) return corsWrap('{"error":"incorrect code"}', 403);

  // Verified!
  req.status = 'verified';
  req.verified_at = Date.now();
  await env.KV.put(`verify:${fid}`, JSON.stringify(req));
  await env.KV.put(`verified:${fid}`, JSON.stringify({ email: req.email, verified_at: req.verified_at }));

  // Remove from queue
  let queue = await env.KV.get('verify_queue', { type: 'json' }) || [];
  queue = queue.filter(function (f) { return f !== fid; });
  await env.KV.put('verify_queue', JSON.stringify(queue));

  return corsWrap(JSON.stringify({ ok: true, message: 'Account verified! Your advisor now knows you are who you say you are.' }));
}

async function handleVerifyMarkSent(request, env) {
  let fid, adminKey;
  try {
    const body = await request.json();
    fid = body.fid;
    adminKey = body.adminKey;
  } catch { return corsWrap('{"error":"bad request"}', 400); }

  if (adminKey !== (env.ADMIN_KEY || 'admin')) return corsWrap('{"error":"unauthorized"}', 401);

  const req = await env.KV.get(`verify:${fid}`, { type: 'json' });
  if (!req) return corsWrap('{"error":"not found"}', 404);

  req.status = 'code_sent';
  req.sent_at = Date.now();
  await env.KV.put(`verify:${fid}`, JSON.stringify(req));

  return corsWrap(JSON.stringify({ ok: true }));
}

async function handleVerifyAdminPage(request, env, url) {
  const key = url.searchParams.get('key');
  if (key !== (env.ADMIN_KEY || 'admin')) {
    return new Response('Unauthorized', { status: 401 });
  }

  const queue = await env.KV.get('verify_queue', { type: 'json' }) || [];
  let rows = '';

  for (const fid of queue) {
    const req = await env.KV.get(`verify:${fid}`, { type: 'json' });
    if (!req) continue;
    const age = Math.round((Date.now() - req.created) / 3600000);
    rows += '<tr>' +
      '<td>' + (req.nickname || 'Unknown') + '</td>' +
      '<td>' + fid + '</td>' +
      '<td>' + req.kingdom + '</td>' +
      '<td>' + req.email + '</td>' +
      '<td style="font-size:20px;font-weight:bold;color:#f0c040;">' + req.code + '</td>' +
      '<td>' + req.status + '</td>' +
      '<td>' + age + 'h ago</td>' +
      '<td>' + (req.status === 'pending' ?
        '<button onclick="markSent(\'' + fid + '\')">Mark Sent</button>' :
        req.status === 'code_sent' ? 'Waiting for player...' : 'Done') +
      '</td></tr>';
  }

  const html = '<!DOCTYPE html><html><head><title>Verification Admin</title>' +
    '<style>body{background:#0d0d0f;color:#e8e6e3;font-family:sans-serif;padding:20px;}' +
    'table{width:100%;border-collapse:collapse;}th,td{padding:8px 12px;border:1px solid #2a2d3e;text-align:left;}' +
    'th{background:#16181f;color:#f0c040;}button{background:#f0c040;color:#0d0d0f;border:none;padding:6px 12px;cursor:pointer;font-weight:bold;border-radius:4px;}</style></head><body>' +
    '<h1 style="color:#f0c040;">Verification Queue</h1>' +
    '<p>' + queue.length + ' pending</p>' +
    '<table><tr><th>Name</th><th>FID</th><th>Kingdom</th><th>Email</th><th>Code</th><th>Status</th><th>Age</th><th>Action</th></tr>' +
    rows + '</table>' +
    '<script>function markSent(fid){fetch("/verify/mark-sent",{method:"POST",headers:{"Content-Type":"application/json"},' +
    'body:JSON.stringify({fid:fid,adminKey:"' + (env.ADMIN_KEY || 'admin') + '"})}).then(function(){location.reload();});}</script>' +
    '</body></html>';

  return new Response(html, { status: 200, headers: { 'Content-Type': 'text/html' } });
}

// ── Survey System ──────────────────────────
async function handleSurveySubmit(request, env) {
  let answers;
  try {
    answers = await request.json();
  } catch { return corsWrap('{"error":"bad request"}', 400); }

  var id = 'survey_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
  answers._id = id;
  answers._submitted = new Date().toISOString();

  await env.KV.put(id, JSON.stringify(answers));

  // Add to survey index
  var index = await env.KV.get('survey_index', { type: 'json' }) || [];
  index.push(id);
  await env.KV.put('survey_index', JSON.stringify(index));

  // Discord notification
  if (env.DISCORD_WEBHOOK) {
    try {
      var role = answers.role || 'Unknown';
      var playtime = answers.playtime || '?';
      await fetch(env.DISCORD_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          embeds: [{
            title: '\uD83D\uDCCB New Survey Response',
            color: 4886754,
            fields: [
              { name: 'Role', value: role, inline: true },
              { name: 'Playtime', value: playtime, inline: true },
              { name: 'Wish Tool Could Do', value: (answers.wish || 'Not answered').slice(0, 200), inline: false },
            ],
            footer: { text: 'Response #' + index.length },
          }],
        }),
      });
    } catch {}
  }

  return corsWrap(JSON.stringify({ ok: true, message: 'Thank you! Your response has been recorded.' }));
}

async function handleSurveyAdmin(request, env, url) {
  var key = url.searchParams.get('key');
  if (key !== (env.ADMIN_KEY || 'admin')) {
    return new Response('Unauthorized', { status: 401 });
  }

  var index = await env.KV.get('survey_index', { type: 'json' }) || [];
  var responses = [];
  for (var i = 0; i < index.length; i++) {
    var data = await env.KV.get(index[i], { type: 'json' });
    if (data) responses.push(data);
  }

  var rows = '';
  for (var r = 0; r < responses.length; r++) {
    var d = responses[r];
    rows += '<tr>' +
      '<td>' + (d.role || '-') + '</td>' +
      '<td>' + (d.playtime || '-') + '</td>' +
      '<td>' + (d.events_tracked || '-') + '</td>' +
      '<td>' + (d.current_tracking || '-') + '</td>' +
      '<td>' + (d.members || '-') + '</td>' +
      '<td>' + (d.hardest || '-') + '</td>' +
      '<td>' + (d.want_to_see || '-') + '</td>' +
      '<td>' + (d.wish || '-') + '</td>' +
      '<td>' + (d.use_ai || '-') + '</td>' +
      '<td>' + (d._submitted || '-') + '</td>' +
      '</tr>';
  }

  var html = '<!DOCTYPE html><html><head><title>Survey Results</title>' +
    '<style>body{background:#0d0d0f;color:#e8e6e3;font-family:sans-serif;padding:20px;}' +
    'table{width:100%;border-collapse:collapse;font-size:12px;}th,td{padding:6px 8px;border:1px solid #2a2d3e;text-align:left;max-width:200px;word-wrap:break-word;}' +
    'th{background:#16181f;color:#f0c040;position:sticky;top:0;}</style></head><body>' +
    '<h1 style="color:#f0c040;">Survey Responses (' + responses.length + ')</h1>' +
    '<div style="overflow-x:auto;"><table><tr><th>Role</th><th>Playtime</th><th>Events Tracked</th><th>Current Tracking</th><th>Members</th><th>Hardest Part</th><th>Want to See</th><th>Wish Tool Did</th><th>Use AI?</th><th>Submitted</th></tr>' +
    rows + '</table></div></body></html>';

  return new Response(html, { status: 200, headers: { 'Content-Type': 'text/html' } });
}

// ── Gift Code Auto-Checker ─────────────────
// Scrapes third-party sites for active Kingshot gift codes
// Stores in KV. Client reads from /codes/list.

async function handleCodeCheck(request, env) {
  // Scrape gamesradar (most reliable, structured format)
  var codes = [];

  try {
    var res = await fetch('https://www.gamesradar.com/games/strategy/kingshot-codes-gift/', {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; KingshotPro/1.0)' }
    });
    var html = await res.text();

    // Parse codes — they appear as bold text in format: CODE – description
    var codeRegex = /(?:<strong>|<b>)([A-Z0-9]{4,20})(?:<\/strong>|<\/b>)\s*[–—-]\s*([^<]+)/gi;
    var match;
    while ((match = codeRegex.exec(html)) !== null) {
      var code = match[1].trim();
      var reward = match[2].trim();
      if (code.length >= 4 && code.length <= 20) {
        codes.push({ code: code, reward: reward, source: 'gamesradar' });
      }
    }
  } catch {}

  // Also try destructoid
  try {
    var res2 = await fetch('https://www.destructoid.com/kingshot-codes/', {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; KingshotPro/1.0)' }
    });
    var html2 = await res2.text();

    var codeRegex2 = /(?:<strong>|<b>)([A-Z0-9]{4,20})(?:<\/strong>|<\/b>)\s*[–—-]\s*([^<]+)/gi;
    var match2;
    while ((match2 = codeRegex2.exec(html2)) !== null) {
      var code2 = match2[1].trim();
      var reward2 = match2[2].trim();
      // Dedupe
      var exists = codes.some(function (c) { return c.code === code2; });
      if (!exists && code2.length >= 4 && code2.length <= 20) {
        codes.push({ code: code2, reward: reward2, source: 'destructoid' });
      }
    }
  } catch {}

  // Save to KV
  var entry = {
    codes: codes,
    checked: new Date().toISOString(),
    count: codes.length,
  };
  await env.KV.put('gift_codes', JSON.stringify(entry));

  // Discord notification if new codes found
  var prev = await env.KV.get('gift_codes_prev', { type: 'json' });
  var prevCodes = prev ? prev.codes.map(function (c) { return c.code; }) : [];
  var newCodes = codes.filter(function (c) { return prevCodes.indexOf(c.code) === -1; });

  if (newCodes.length > 0 && env.DISCORD_WEBHOOK) {
    try {
      var fields = newCodes.map(function (c) {
        return { name: c.code, value: c.reward, inline: false };
      });
      await fetch(env.DISCORD_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          embeds: [{
            title: '\uD83C\uDF81 New Gift Codes Detected! (' + newCodes.length + ')',
            color: 15778880,
            fields: fields.slice(0, 10),
            footer: { text: 'Auto-detected by KingshotPro code checker' },
          }],
        }),
      });
    } catch {}
  }

  await env.KV.put('gift_codes_prev', JSON.stringify(entry));

  return corsWrap(JSON.stringify({
    ok: true,
    codes_found: codes.length,
    new_codes: newCodes.length,
    checked: entry.checked,
  }));
}

async function handleCodeList(request, env) {
  var data = await env.KV.get('gift_codes', { type: 'json' });
  if (!data) return corsWrap(JSON.stringify({ codes: [], checked: null }));
  return corsWrap(JSON.stringify(data));
}

// ── Video Response Cache ───────────────────
// MANDATORY: Every Simli video is cached. Never discard.
// See memory/project_kingshotpro_video_cache.md

function hashCacheKey(text, archetype) {
  // Simple hash: normalize text + archetype → deterministic key
  var normalized = (text || '').toLowerCase().trim().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ');
  var input = archetype + ':' + normalized;
  var hash = 0;
  for (var i = 0; i < input.length; i++) {
    hash = ((hash << 5) - hash) + input.charCodeAt(i);
    hash |= 0;
  }
  return 'vcache_' + Math.abs(hash).toString(36);
}

async function handleAdvisorVideo(request, env) {
  let responseText, archetype, advisorName, faceId;
  try {
    var body = await request.json();
    responseText = body.responseText;
    archetype = body.archetype || 'steward';
    advisorName = body.advisorName || 'Ysabel';
    faceId = body.faceId || 'f3e0d64a-dda5-403e-8d23-b3c980dd3713';
  } catch { return corsWrap('{"error":"bad request"}', 400); }

  if (!responseText) return corsWrap('{"error":"responseText required"}', 400);

  // 1. Check cache
  var cacheKey = hashCacheKey(responseText, archetype);
  var cached = await env.KV.get(cacheKey, { type: 'json' });

  if (cached && cached.mp4_url) {
    // Increment serve count
    cached.times_served = (cached.times_served || 0) + 1;
    await env.KV.put(cacheKey, JSON.stringify(cached));
    return corsWrap(JSON.stringify({ mp4_url: cached.mp4_url, cached: true, times_served: cached.times_served }));
  }

  // 2. Generate TTS audio
  var ttsRes;
  try {
    ttsRes = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + env.OPENAI_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'tts-1', voice: 'nova', input: responseText, speed: 0.92 }),
    });
  } catch { return corsWrap('{"error":"tts failed"}', 502); }

  var audioBytes = await ttsRes.arrayBuffer();
  var audioBase64 = btoa(String.fromCharCode(...new Uint8Array(audioBytes)));

  // 3. Generate lip-synced video via Simli
  var simliRes;
  try {
    simliRes = await fetch('https://api.simli.ai/static/audio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-simli-api-key': env.SIMLI_KEY || '05ll4nqf31s20n3gk232x4fi' },
      body: JSON.stringify({
        faceId: faceId,
        audioBase64: audioBase64,
        audioFormat: 'mp3',
        audioSampleRate: 24000,
        audioChannelCount: 1,
      }),
    });
  } catch { return corsWrap('{"error":"simli failed"}', 502); }

  var simliData = await simliRes.json();
  var mp4Url = simliData.mp4_url || null;
  var hlsUrl = simliData.hls_url || null;

  if (!mp4Url) return corsWrap(JSON.stringify({ error: 'simli no mp4', detail: simliData }), 502);

  // 4. Save to cache — MANDATORY, never skip this
  var cacheEntry = {
    prompt: responseText,
    response_text: responseText,
    archetype: archetype,
    advisor_name: advisorName,
    mp4_url: mp4Url,
    hls_url: hlsUrl,
    tts_voice: 'nova',
    simli_face_id: faceId,
    generated: new Date().toISOString(),
    times_served: 1,
    cache_key: cacheKey,
  };

  await env.KV.put(cacheKey, JSON.stringify(cacheEntry));

  // 5. Also add to master cache index for browsing
  var index = await env.KV.get('vcache_index', { type: 'json' }) || [];
  index.push({ key: cacheKey, prompt: responseText.slice(0, 100), archetype: archetype, generated: cacheEntry.generated });
  // Keep index manageable
  if (index.length > 500) index = index.slice(-500);
  await env.KV.put('vcache_index', JSON.stringify(index));

  return corsWrap(JSON.stringify({
    mp4_url: mp4Url,
    hls_url: hlsUrl,
    cached: false,
    cache_key: cacheKey,
    mp4_eta_seconds: simliData.mp4_availablility_eta_seconds || 10,
  }));
}

// ── Video Cache Admin ──────────────────────
async function handleVideoCacheAdmin(request, env, url) {
  var key = url.searchParams.get('key');
  if (key !== (env.ADMIN_KEY || 'admin')) {
    return new Response('Unauthorized', { status: 401 });
  }

  var index = await env.KV.get('vcache_index', { type: 'json' }) || [];

  var rows = '';
  for (var i = index.length - 1; i >= 0; i--) {
    var entry = await env.KV.get(index[i].key, { type: 'json' });
    if (!entry) continue;
    rows += '<tr>' +
      '<td>' + (entry.archetype || '-') + '</td>' +
      '<td style="max-width:300px;word-wrap:break-word;">' + (entry.prompt || '-').slice(0, 200) + '</td>' +
      '<td>' + (entry.times_served || 0) + '</td>' +
      '<td>' + (entry.generated || '-') + '</td>' +
      '<td>' + (entry.mp4_url ? '<a href="' + entry.mp4_url + '" target="_blank" style="color:#f0c040;">Play</a>' : '-') + '</td>' +
      '<td>' + (entry.cache_key || '-') + '</td>' +
      '</tr>';
  }

  var html = '<!DOCTYPE html><html><head><title>Video Cache</title>' +
    '<style>body{background:#0d0d0f;color:#e8e6e3;font-family:sans-serif;padding:20px;}' +
    'table{width:100%;border-collapse:collapse;font-size:12px;}th,td{padding:6px 8px;border:1px solid #2a2d3e;text-align:left;}' +
    'th{background:#16181f;color:#f0c040;position:sticky;top:0;}a{color:#f0c040;}</style></head><body>' +
    '<h1 style="color:#f0c040;">Video Response Cache (' + index.length + ' entries)</h1>' +
    '<p style="color:#9b9da4;">Every generated video is saved here. Cached responses serve instantly without using Simli minutes.</p>' +
    '<table><tr><th>Archetype</th><th>Response Text</th><th>Times Served</th><th>Generated</th><th>Video</th><th>Cache Key</th></tr>' +
    rows + '</table></body></html>';

  return new Response(html, { status: 200, headers: { 'Content-Type': 'text/html' } });
}

// ── Tier check helper ──────────────────────
const TIER_RANK = { free: 0, pro: 1, pro_plus: 2 };
function tierAtLeast(user, required) {
  if (!user) return false;
  return (TIER_RANK[user.tier] || 0) >= (TIER_RANK[required] || 0);
}

// ── Premium: Chronicle (Pro+) ──────────────
async function handleChronicle(request, env) {
  const user = await getUser(request, env);
  if (!tierAtLeast(user, 'pro')) return corsWrap('{"error":"tier_required","required":"pro"}', 403);

  const { playerContext, advisorName, archetype } = await request.json();
  const system = 'You are ' + (advisorName || 'the chronicler') + ', a medieval ' + (archetype || 'steward') +
    '. Write a 200-word chronicle entry about this governor. Use formal medieval history style. Reference their real stats. Dramatic but grounded.';

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + env.OPENAI_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'gpt-4o-mini', max_tokens: 400, messages: [{ role: 'system', content: system }, { role: 'user', content: 'Player context: ' + (playerContext ? JSON.stringify(playerContext) : 'Unknown') + '\n\nWrite the chronicle entry.' }] }),
  });
  const data = await res.json();
  const text = (data.choices && data.choices[0]) ? data.choices[0].message.content : 'The chronicler\'s quill has stilled.';
  return corsWrap(JSON.stringify({ chronicle: text, generated: new Date().toISOString() }));
}

// ── Premium: Battle Illustration (Pro+) ────
async function handleIllustration(request, env) {
  const user = await getUser(request, env);
  if (!tierAtLeast(user, 'pro')) return corsWrap('{"error":"tier_required","required":"pro"}', 403);

  const { description } = await request.json();
  const prompt = 'Medieval oil painting battle scene: ' + (description || 'a kingdom siege at dawn') +
    '. Dark moody lighting, gold accents, painterly style, dramatic composition, game art quality.';

  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + env.OPENAI_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'dall-e-3', prompt, n: 1, size: '1024x1024', quality: 'hd' }),
  });
  const data = await res.json();
  const url = (data.data && data.data[0]) ? data.data[0].url : null;
  if (!url) return corsWrap('{"error":"generation failed"}', 500);
  return corsWrap(JSON.stringify({ image_url: url, generated: new Date().toISOString() }));
}

// ── Premium: Voice Message (Pro+) ──────────
async function handleVoice(request, env) {
  const user = await getUser(request, env);
  if (!tierAtLeast(user, 'pro_plus')) return corsWrap('{"error":"tier_required","required":"pro_plus"}', 403);

  const { text } = await request.json();
  const res = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + env.OPENAI_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'tts-1', voice: 'nova', input: text || 'Governor.', speed: 0.92 }),
  });
  const audio = await res.arrayBuffer();
  return new Response(audio, {
    status: 200,
    headers: {
      'Content-Type': 'audio/mpeg',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': 'true',
      'Cache-Control': 'no-store',
    },
  });
}

// ── Premium: Custom Portrait (Pro+) ────────
async function handlePortrait(request, env) {
  const user = await getUser(request, env);
  if (!tierAtLeast(user, 'pro_plus')) return corsWrap('{"error":"tier_required","required":"pro_plus"}', 403);

  const { description } = await request.json();
  const prompt = 'Medieval fantasy character portrait, head and shoulders, ' +
    (description || 'a wise royal advisor') +
    '. Dark moody background, gold rim lighting, painterly digital art, game character portrait, high detail face, dramatic chiaroscuro.';

  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + env.OPENAI_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'dall-e-3', prompt, n: 1, size: '1024x1024', quality: 'hd' }),
  });
  const data = await res.json();
  const url = (data.data && data.data[0]) ? data.data[0].url : null;
  if (!url) return corsWrap('{"error":"generation failed"}', 500);
  return corsWrap(JSON.stringify({ image_url: url, generated: new Date().toISOString() }));
}

// ── Stripe Webhook ─────────────────────────

async function verifyStripeSignature(request, body, secret) {
  const header = request.headers.get('Stripe-Signature');
  if (!header || !secret) return false;
  const parts = {};
  for (const kv of header.split(',')) {
    const i = kv.indexOf('=');
    if (i > 0) parts[kv.slice(0, i).trim()] = kv.slice(i + 1).trim();
  }
  const t = parts.t;
  const v1 = parts.v1;
  if (!t || !v1) return false;

  // Replay protection: reject signatures older than 5 minutes.
  const ageSec = Math.abs(Math.floor(Date.now() / 1000) - parseInt(t, 10));
  if (!Number.isFinite(ageSec) || ageSec > 300) return false;

  const payload = `${t}.${body}`;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  const expected = Array.from(new Uint8Array(mac))
    .map(b => b.toString(16).padStart(2, '0')).join('');

  // Constant-time compare
  if (expected.length !== v1.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) {
    mismatch |= expected.charCodeAt(i) ^ v1.charCodeAt(i);
  }
  return mismatch === 0;
}

async function handleStripeWebhook(request, env) {
  // Read body as text BEFORE parsing — HMAC needs raw bytes.
  let body;
  try { body = await request.text(); }
  catch { return corsWrap('{"error":"read_failed"}', 400); }

  const verified = await verifyStripeSignature(request, body, env.STRIPE_WEBHOOK_SECRET);
  if (!verified) {
    return corsWrap('{"error":"invalid_signature"}', 401);
  }

  let event;
  try { event = JSON.parse(body); }
  catch { return corsWrap('{"error":"invalid_payload"}', 400); }

  // Credit-pack pricing — cents → credits. Keep in sync with docs/PRICING.md.
  const CREDIT_PACK_BY_AMOUNT = {
    199:  10,   // Starter
    499:  30,   // Standard
    999:  75,   // Best value
  };

  const type = event.type;

  if (type === 'checkout.session.completed') {
    const session = event.data.object;
    const email = session.customer_email || session.customer_details?.email;
    if (!email) {
      return corsWrap('{"ok":true,"note":"no email on checkout session"}');
    }

    // Load the user record — or create a minimal one if this is their
    // very first interaction (payment-before-signup is a legit flow).
    let user = await env.KV.get(`user:${email}`, { type: 'json' });
    if (!user) {
      user = {
        email, fid: '', tier: 'free',
        created: Date.now(),
        energy_today: 5,
        energy_date: new Date().toISOString().split('T')[0],
        memory: [],
        credits: 0,
        credit_history: [],
      };
    }
    // Defensive: seed fields on legacy records
    if (user.credits === undefined)          user.credits = 0;
    if (!Array.isArray(user.credit_history)) user.credit_history = [];

    // Store the reverse mapping so future subscription events (cancellations,
    // updates) can look up the email from Stripe's customer ID — subscription
    // objects don't carry customer_email, only the customer ID string.
    if (session.customer) {
      await env.KV.put(`stripe_cust:${session.customer}`, email);
      user.stripe_customer_id = session.customer;
    }

    let responsePayload = { ok: true };

    if (session.mode === 'subscription') {
      const SUB_TIER_BY_AMOUNT = { 499: 'pro', 999: 'pro_plus' };
      const tier = SUB_TIER_BY_AMOUNT[session.amount_total] || 'pro';
      user.tier = tier;
      user.credit_history.push({
        at: Date.now(), kind: 'subscription_start', tier,
        amount_cents: session.amount_total,
        stripe_session_id: session.id || '',
      });
      responsePayload.tier = tier;

    } else if (session.mode === 'payment') {
      const amount = session.amount_total;
      const creditsToAdd = CREDIT_PACK_BY_AMOUNT[amount];
      if (creditsToAdd) {
        user.credits = (user.credits || 0) + creditsToAdd;
        user.credit_history.push({
          at: Date.now(), kind: 'credit_pack_purchase',
          amount_cents: amount, credits: creditsToAdd,
          stripe_session_id: session.id || '',
        });
        responsePayload.credits_added  = creditsToAdd;
        responsePayload.credits_total  = user.credits;
      } else {
        // Unknown amount — don't grant credits, but record for investigation.
        user.credit_history.push({
          at: Date.now(), kind: 'payment_unmapped',
          amount_cents: amount,
          stripe_session_id: session.id || '',
        });
        responsePayload.note = 'amount not mapped to any credit pack';
        responsePayload.amount_cents = amount;
      }

    } else {
      // Unknown mode — should not happen but we log it.
      user.credit_history.push({
        at: Date.now(), kind: 'checkout_unknown_mode',
        mode: session.mode || 'null',
        stripe_session_id: session.id || '',
      });
      responsePayload.note = 'unknown session.mode';
    }

    await env.KV.put(`user:${email}`, JSON.stringify(user));
    return corsWrap(JSON.stringify(responsePayload));
  }

  if (type === 'customer.subscription.deleted' || type === 'customer.subscription.updated') {
    const sub = event.data.object;
    // customer is a STRING ID, not an object — look up email via reverse mapping
    const customerId = sub.customer;
    if (!customerId) {
      return corsWrap('{"ok":true,"note":"no customer id on subscription event"}');
    }
    const email = await env.KV.get(`stripe_cust:${customerId}`);
    if (!email) {
      // Subscription exists in Stripe but we never stored the reverse mapping.
      // Could be a subscription created before this code, or before stripe_cust:
      // was ever written. Nothing we can do without the email — bail loudly.
      return corsWrap(JSON.stringify({
        ok: true, note: 'no customer mapping', customer_id: customerId,
      }));
    }

    // Only downgrade on genuinely terminal states. 'past_due' can recover
    // after a retry; 'incomplete' means payment never cleared but might still.
    const terminalStatuses = new Set(['canceled', 'unpaid', 'incomplete_expired']);
    if (terminalStatuses.has(sub.status)) {
      let user = await env.KV.get(`user:${email}`, { type: 'json' });
      if (user) {
        user.tier = 'free';
        if (!Array.isArray(user.credit_history)) user.credit_history = [];
        user.credit_history.push({
          at: Date.now(), kind: 'subscription_end',
          stripe_sub_status: sub.status,
        });
        await env.KV.put(`user:${email}`, JSON.stringify(user));
      }
      return corsWrap(JSON.stringify({ ok: true, downgraded: true, status: sub.status }));
    }
    return corsWrap(JSON.stringify({ ok: true, status: sub.status, action: 'none' }));
  }

  return corsWrap('{"ok":true,"note":"unhandled event type","type":"' + (type || '') + '"}');
}

// ──────────────────────────────────────────────────────────────────
// Credit-gated feature endpoints
// ──────────────────────────────────────────────────────────────────
// Credit costs — single source of truth for the server. Keep in sync
// with docs/PRICING.md and js/pricing-config.js.
const INTEL_COST_BY_DURATION = {
  86400:    1,   // 24 hours
  604800:   3,   // 7 days
  2592000:  8,   // 30 days
};
const WORLDCHAT_UNLOCK_COST = 1;
const KINGDOM_REQUEST_COSTS = {
  add:              5,
  update:           3,
  add_expedited:   10,
  update_expedited: 6,
};

// POST /player/lookup — headless-browser Player ID lookup via Cloudflare
// Browser Rendering. Loads the CG giftcode page, lets their obfuscated JS
// compute the `sign` field, intercepts the /api/player response.
//
// Replaces the ADB-scraper-only flow and the separate bot/server.py Python
// service. Runs inside this Worker. Result cached in KV for 24h per FID.
//
// Architecture reference: docs/ARCHITECTURE.md § "Platform Boundaries".
// Proof-of-concept was bot/lookup_player.py — same logic, different runtime.
//
// Cost: ~2-6 seconds of browser time per uncached lookup. At Cloudflare
// Browser Rendering prices ($0.09/browser-hour), ~$0.00015-$0.00050 per
// lookup. Cached hits are free.
const PLAYER_CACHE_TTL = 86400;         // 24 hours
const PLAYER_LOOKUP_TIMEOUT_MS = 25_000; // hard ceiling per request

async function handlePlayerLookup(request, env) {
  let fid;
  try {
    const body = await request.json();
    fid = String(body.fid || '').trim();
  } catch {
    return corsWrapCred(request, '{"error":"bad_request"}', 400);
  }

  if (!/^\d{4,12}$/.test(fid)) {
    return corsWrapCred(request, '{"error":"invalid_fid","detail":"Player ID must be 4-12 digits"}', 400);
  }

  // Cache hit — serve instantly.
  const cacheKey = `player:${fid}`;
  const cached = await env.KV.get(cacheKey, { type: 'json' });
  if (cached) {
    return corsWrapCred(request, JSON.stringify({ ...cached, cached: true }), 200);
  }

  // Browser Rendering requires the binding to be present. If the account
  // doesn't have Browser Rendering enabled, env.BROWSER is undefined and
  // we want a clear error rather than a 500.
  if (!env.BROWSER) {
    return corsWrapCred(request, JSON.stringify({
      error: 'browser_rendering_not_bound',
      detail: 'Worker is missing the BROWSER binding. Enable Browser Rendering on the account + ensure wrangler.toml has [browser] binding.',
    }), 503);
  }

  let browser;
  try {
    browser = await puppeteer.launch(env.BROWSER);
    const page = await browser.newPage();

    // Capture the /api/player response off the wire. This is the whole
    // point of using a real browser — CG's JS computes the sign, we just
    // read the resulting JSON.
    const playerPromise = new Promise((resolve) => {
      const onResponse = async (res) => {
        const url = res.url();
        if (url.includes('/api/player') && res.request().method() === 'POST') {
          try {
            const data = await res.json();
            resolve(data);
          } catch { /* fall through, timeout will catch */ }
        }
      };
      page.on('response', onResponse);
    });

    await page.goto('https://ks-giftcode.centurygame.com/', {
      waitUntil: 'domcontentloaded',
      timeout:   PLAYER_LOOKUP_TIMEOUT_MS,
    });

    // Wait for the Player ID input to render
    await page.waitForSelector('input[placeholder="Player ID"]', { timeout: 10_000 });

    // Fill the FID and click Login
    await page.type('input[placeholder="Player ID"]', fid);
    await page.waitForSelector('.login_btn', { timeout: 5_000 });
    await page.click('.login_btn');

    // Wait up to ~10s for the /api/player response
    const raw = await Promise.race([
      playerPromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 12_000)),
    ]);

    if (!raw || raw.code !== 0 || !raw.data) {
      return corsWrapCred(request, JSON.stringify({
        error: 'not_found',
        detail: 'Player ID not found or CG returned a non-success code.',
      }), 404);
    }

    const d = raw.data;
    const profile = {
      fid:            d.fid,
      nickname:       d.nickname,
      kid:            d.kid,
      stove_lv:       d.stove_lv,
      avatar_image:   d.avatar_image || '',
      total_recharge: (d.total_recharge_amount || 0) / 100,
      looked_up:      Math.floor(Date.now() / 1000),
      source:         'cf_browser_rendering',
    };

    await env.KV.put(cacheKey, JSON.stringify(profile), { expirationTtl: PLAYER_CACHE_TTL });

    return corsWrapCred(request, JSON.stringify(profile), 200);
  } catch (err) {
    return corsWrapCred(request, JSON.stringify({
      error:  'lookup_failed',
      detail: String(err && err.message ? err.message : err),
    }), 502);
  } finally {
    if (browser) {
      try { await browser.close(); } catch { /* ignore */ }
    }
  }
}

// GET /user/me — authoritative signed-in state for the frontend.
// Returns authenticated: false for anonymous requests, or the full user
// record shape (email, tier, credits, intel_unlocks, wc_unlocks) for
// sessions with a valid ksp_session cookie.
async function handleUserMe(request, env) {
  const user = await getUser(request, env);
  if (!user) {
    return corsWrapCred(request, JSON.stringify({ authenticated: false }), 200);
  }

  const nowSec = Math.floor(Date.now() / 1000);
  const intelList = await env.KV.list({ prefix: `intel:${user.email}:` });
  const intel_unlocks = [];
  for (const k of intelList.keys) {
    const m = k.name.match(/^intel:[^:]+:k(\d+)$/);
    if (!m) continue;
    const expiry_sec = parseInt(await env.KV.get(k.name), 10);
    if (expiry_sec && expiry_sec > nowSec) {
      intel_unlocks.push({ kingdom: parseInt(m[1], 10), expiry_sec });
    }
  }

  const wcList = await env.KV.list({ prefix: `wc_unlock:${user.email}:` });
  const wc_unlocks = [];
  for (const k of wcList.keys) {
    const m = k.name.match(/^wc_unlock:[^:]+:k(\d+):(.+)$/);
    if (!m) continue;
    wc_unlocks.push({ kingdom: parseInt(m[1], 10), snapshot: m[2] });
  }

  return corsWrapCred(request, JSON.stringify({
    authenticated: true,
    email:         user.email,
    fid:           user.fid || '',
    tier:          user.tier || 'free',
    credits:       user.credits || 0,
    intel_unlocks,
    wc_unlocks,
  }), 200);
}

// GET /credits/balance — public-callable. Returns user balance if signed in,
// free/0 shape if anonymous. credits.js expects this on every page load.
async function handleCreditsBalance(request, env) {
  const user = await getUser(request, env);
  if (!user) {
    return corsWrapCred(request, JSON.stringify({ tier: 'free', balance: 0, fid: '' }), 200);
  }
  return corsWrapCred(request, JSON.stringify({
    tier:    user.tier    || 'free',
    balance: user.credits || 0,
    fid:     user.fid     || '',
  }), 200);
}

// POST /kingdom/request — request a new kingdom or refresh. Charges credits.
// Body: { type: 'add' | 'update' | 'add_expedited' | 'update_expedited', kingdom: 735 }
async function handleKingdomRequest(request, env) {
  const user = await getUser(request, env);
  if (!user) return corsWrapCred(request, '{"error":"not_logged_in"}', 401);

  let type, kingdom;
  try {
    const body = await request.json();
    type = String(body.type || 'add').toLowerCase();
    kingdom = parseInt(body.kingdom, 10);
  } catch { return corsWrapCred(request, '{"error":"bad request"}', 400); }

  if (!Number.isInteger(kingdom) || kingdom < 1 || kingdom > 99999) {
    return corsWrapCred(request, '{"error":"invalid_kingdom"}', 400);
  }
  const cost = KINGDOM_REQUEST_COSTS[type];
  if (cost === undefined) {
    return corsWrapCred(request, '{"error":"invalid_request_type"}', 400);
  }
  const balance = user.credits || 0;
  if (balance < cost) {
    return corsWrapCred(request, JSON.stringify({
      error: 'insufficient_credits', cost, balance,
    }), 402);
  }

  // Record the request for admin review (any existing pending request gets overwritten;
  // we only track one-per-user-per-kingdom-per-type to prevent spam).
  const reqKey = `kingdom_req:${kingdom}:${user.email}:${type}`;
  await env.KV.put(reqKey, JSON.stringify({
    email: user.email, fid: user.fid || '', kingdom, type,
    at: Date.now(), status: 'pending',
  }));

  // Deduct credits and record in history
  user.credits = balance - cost;
  if (!Array.isArray(user.credit_history)) user.credit_history = [];
  user.credit_history.push({
    at: Date.now(), kind: `kingdom_${type}`, kingdom, amount: -cost,
  });
  await env.KV.put(`user:${user.email}`, JSON.stringify(user));

  return corsWrapCred(request, JSON.stringify({ ok: true, balance: user.credits }), 200);
}

// POST /intel/unlock-kingdom — unlock KvK intel panels for one kingdom
// for 24h / 7d / 30d. Body: { kingdom, duration_sec, cost_credits }.
// Server validates that duration_sec maps to cost_credits — prevents
// client-side tampering with the price.
async function handleIntelUnlockKingdom(request, env) {
  const user = await getUser(request, env);
  if (!user) return corsWrapCred(request, '{"error":"not_logged_in"}', 401);

  let kingdom, duration_sec, cost_credits;
  try {
    const body = await request.json();
    kingdom       = parseInt(body.kingdom,       10);
    duration_sec  = parseInt(body.duration_sec,  10);
    cost_credits  = parseInt(body.cost_credits,  10);
  } catch { return corsWrapCred(request, '{"error":"bad request"}', 400); }

  if (!Number.isInteger(kingdom) || kingdom < 1 || kingdom > 99999) {
    return corsWrapCred(request, '{"error":"invalid_kingdom"}', 400);
  }
  const expectedCost = INTEL_COST_BY_DURATION[duration_sec];
  if (expectedCost === undefined || expectedCost !== cost_credits) {
    return corsWrapCred(request, '{"error":"invalid_cost_or_duration"}', 400);
  }

  const balance = user.credits || 0;
  if (balance < cost_credits) {
    return corsWrapCred(request, JSON.stringify({
      error: 'insufficient_credits', cost: cost_credits, balance,
    }), 402);
  }

  // Write the unlock with an expiry TTL that matches the duration so KV
  // auto-deletes it when access expires. Also return the expiry timestamp
  // so the client UI can show "5h left" without polling.
  const expirySec = Math.floor(Date.now() / 1000) + duration_sec;
  const intelKey = `intel:${user.email}:k${kingdom}`;
  await env.KV.put(intelKey, String(expirySec), { expirationTtl: duration_sec });

  user.credits = balance - cost_credits;
  if (!Array.isArray(user.credit_history)) user.credit_history = [];
  user.credit_history.push({
    at: Date.now(), kind: 'intel_unlock', kingdom, duration_sec, amount: -cost_credits,
  });
  await env.KV.put(`user:${user.email}`, JSON.stringify(user));

  return corsWrapCred(request, JSON.stringify({
    ok: true, balance: user.credits, expiry_sec: expirySec,
  }), 200);
}

// POST /worldchat/unlock — unlock one world chat snapshot, permanent.
// Body: { kingdom, snapshot }. Idempotent: second unlock for same
// (user, kingdom, snapshot) returns success without re-charging.
async function handleWorldchatUnlock(request, env) {
  const user = await getUser(request, env);
  if (!user) return corsWrapCred(request, '{"error":"not_logged_in"}', 401);

  let kingdom, snapshot;
  try {
    const body = await request.json();
    kingdom  = parseInt(body.kingdom, 10);
    snapshot = String(body.snapshot || '').trim();
  } catch { return corsWrapCred(request, '{"error":"bad request"}', 400); }

  if (!Number.isInteger(kingdom) || !snapshot || snapshot.length > 64) {
    return corsWrapCred(request, '{"error":"invalid_args"}', 400);
  }

  const unlockKey = `wc_unlock:${user.email}:k${kingdom}:${snapshot}`;

  // Idempotency: already unlocked → success with current balance, no charge
  const existing = await env.KV.get(unlockKey);
  if (existing) {
    return corsWrapCred(request, JSON.stringify({
      ok: true, balance: user.credits || 0, already: true,
    }), 200);
  }

  const balance = user.credits || 0;
  if (balance < WORLDCHAT_UNLOCK_COST) {
    return corsWrapCred(request, JSON.stringify({
      error: 'insufficient_credits', cost: WORLDCHAT_UNLOCK_COST, balance,
    }), 402);
  }

  await env.KV.put(unlockKey, JSON.stringify({ at: Date.now() }));

  user.credits = balance - WORLDCHAT_UNLOCK_COST;
  if (!Array.isArray(user.credit_history)) user.credit_history = [];
  user.credit_history.push({
    at: Date.now(), kind: 'worldchat_unlock', kingdom, snapshot,
    amount: -WORLDCHAT_UNLOCK_COST,
  });
  await env.KV.put(`user:${user.email}`, JSON.stringify(user));

  return corsWrapCred(request, JSON.stringify({ ok: true, balance: user.credits }), 200);
}

// ──────────────────────────────────────────────────────────────────
// Oath and Bone — server-state persistence (Worker 23)
// ──────────────────────────────────────────────────────────────────
// KV schema reference: docs/DECISIONS.md "2026-04-24 — Worker 23".
//   oab_state_<fid>                         canonical save JSON; no TTL
//   oab_history_<fid>_<YYYY-MM>             append-only battle log; ~13mo TTL
//   oab_crown_balance_<fid>                 scalar Crown cache for fast spend
//   oab_credits_granted_<fid>_<YYYY-MM-DD>  daily-grant ledger; 48h TTL

const OAB_HISTORY_RETENTION_MONTHS = 12;
// Current month + 12 → ~395 days. KV TTL is approximate; rounding up
// to the next 31-day boundary gives the player the full 12 months back.
const OAB_HISTORY_TTL_SEC = (OAB_HISTORY_RETENTION_MONTHS + 1) * 31 * 86400;

const OAB_DAILY_CREDIT_CAP = 5;

// event_key → { tier → credits } granted on first qualifying event/day.
// Per ECONOMY.md §2: Sergeant first-of-day = 1 credit AND Marshal
// first-of-day = 2 credits are SEPARATE events — a player who wins
// both in one day earns 3 (subject to OAB_DAILY_CREDIT_CAP). Scout
// is not in the table → no grant.
const OAB_CREDIT_GRANT_TABLE = {
  first_sergeant_victory: { sergeant: 1 },
  first_marshal_victory:  { marshal: 2 },
  chapter_complete:       { any: 3 },
  hero_recruited_major:   { any: 2 },
};

const OAB_SPEND_CONTEXTS = new Set(['shop', 'boost', 'training']);

// Sanity bounds on client-reported per-battle earnings. Caps a runaway
// or spoofed result. Max plausible Marshal Crown: 80 × stacking ≈ 158
// (ECONOMY.md §2). 1000 leaves 6× safety margin without being so loose
// it's useless. XP cap similarly above the practical maximum.
const OAB_MAX_CROWNS_PER_BATTLE_RESULT = 1000;
const OAB_MAX_XP_PER_BATTLE_RESULT     = 1500;

// Default state shape returned by /load when a player has never saved.
function oabDefaultState() {
  return {
    hero_state:      {},
    crown_balance:   0,
    equipped:        {},
    learned_spells:  [],
    fallen_heroes:   [],
    current_chapter: 1,
    current_battle:  'b1',
    last_save_iso:   null,
    version:         0,
  };
}

// Resolve the cookie-authenticated user and their linked FID. All Oath
// and Bone endpoints route through this — anonymous players persist via
// Worker 22's localStorage path, not the server. Returns either an
// error Response (already-formatted) or { user, fid }.
async function oabResolveAuth(request, env) {
  const user = await getUser(request, env);
  if (!user) {
    return { error: corsWrapCred(request, '{"error":"not_logged_in"}', 401) };
  }
  const fid = user.fid && String(user.fid).trim();
  if (!fid) {
    return { error: corsWrapCred(request, '{"error":"fid_not_linked"}', 400) };
  }
  return { user, fid };
}

// POST /oath-and-bone/save — persist the canonical save document.
// Body: { state: { hero_state, crown_balance, equipped, learned_spells,
//                  fallen_heroes, current_chapter, current_battle, ... } }
// Returns 200 { ok, last_save_iso, version }.
//
// Server enforces: shape validation, fallen_heroes union (permadeath is
// forever — server-side fallen list can never shrink), version bump.
async function handleOabSave(request, env) {
  const auth = await oabResolveAuth(request, env);
  if (auth.error) return auth.error;
  const { fid } = auth;

  let body;
  try { body = await request.json(); }
  catch { return corsWrapCred(request, '{"error":"bad_request"}', 400); }

  const state = body && body.state;
  if (!state || typeof state !== 'object' || Array.isArray(state)) {
    return corsWrapCred(request, '{"error":"missing_state"}', 400);
  }

  // Shape validation — every persisted save must carry these fields.
  const required = [
    'hero_state', 'crown_balance', 'equipped', 'learned_spells',
    'fallen_heroes', 'current_chapter', 'current_battle',
  ];
  for (const k of required) {
    if (state[k] === undefined) {
      return corsWrapCred(request, JSON.stringify({
        error: 'invalid_state', missing: k,
      }), 400);
    }
  }
  if (typeof state.crown_balance !== 'number' ||
      !Number.isFinite(state.crown_balance) ||
      state.crown_balance < 0) {
    return corsWrapCred(request, '{"error":"invalid_crown_balance"}', 400);
  }
  if (typeof state.hero_state !== 'object' || Array.isArray(state.hero_state)) {
    return corsWrapCred(request, '{"error":"invalid_hero_state"}', 400);
  }
  if (typeof state.equipped !== 'object' || Array.isArray(state.equipped)) {
    return corsWrapCred(request, '{"error":"invalid_equipped"}', 400);
  }
  if (!Array.isArray(state.learned_spells) || !Array.isArray(state.fallen_heroes)) {
    return corsWrapCred(request, '{"error":"invalid_arrays"}', 400);
  }
  if (typeof state.current_chapter !== 'number' || state.current_chapter < 1) {
    return corsWrapCred(request, '{"error":"invalid_chapter"}', 400);
  }
  if (typeof state.current_battle !== 'string' || !state.current_battle) {
    return corsWrapCred(request, '{"error":"invalid_battle"}', 400);
  }

  // Permadeath enforcement: server-side fallen_heroes is the FLOOR.
  // Client's list must be a superset; any name on the server stays on
  // the server. Heroes can fall further, never resurrect.
  const existing = await env.KV.get(`oab_state_${fid}`, { type: 'json' });
  if (existing && Array.isArray(existing.fallen_heroes)) {
    const merged = Array.from(new Set([
      ...existing.fallen_heroes.map(String),
      ...state.fallen_heroes.map(String),
    ]));
    state.fallen_heroes = merged;
  } else {
    state.fallen_heroes = state.fallen_heroes.map(String);
  }

  state.last_save_iso = new Date().toISOString();
  state.version = ((existing && Number(existing.version)) || 0) + 1;

  await env.KV.put(`oab_state_${fid}`, JSON.stringify(state));
  await env.KV.put(`oab_crown_balance_${fid}`, String(state.crown_balance));

  return corsWrapCred(request, JSON.stringify({
    ok: true,
    last_save_iso: state.last_save_iso,
    version: state.version,
  }), 200);
}

// GET /oath-and-bone/load — return the player's canonical save state.
// No body. Returns 200 { ok, state, first_load }. If no save exists yet,
// returns the default state (full HP heroes, 0 Crowns, etc.).
async function handleOabLoad(request, env) {
  const auth = await oabResolveAuth(request, env);
  if (auth.error) return auth.error;
  const { fid } = auth;

  const state = await env.KV.get(`oab_state_${fid}`, { type: 'json' });
  if (!state) {
    return corsWrapCred(request, JSON.stringify({
      ok: true,
      state: oabDefaultState(),
      first_load: true,
    }), 200);
  }
  return corsWrapCred(request, JSON.stringify({
    ok: true,
    state,
    first_load: false,
  }), 200);
}

// POST /oath-and-bone/spend — debit Crown balance for shop/boost/training.
// Body: { amount: N (integer > 0), item_id: string, context: 'shop'|'boost'|'training' }
// Returns 200 { ok, new_balance, spend_id } or 402 insufficient_crowns.
//
// Server is the authority on balance. Client-supplied amount is the
// requested debit; client-supplied item_id is recorded for audit but
// not validated against a price table (Crown shop prices stay in
// pricing-config.js / ECONOMY.md per the project no-hardcoded-prices
// rule). KV doesn't expose true CAS; this uses a read-modify-write loop
// with a version compare to narrow the race window.
async function handleOabSpend(request, env) {
  const auth = await oabResolveAuth(request, env);
  if (auth.error) return auth.error;
  const { user, fid } = auth;

  let amount, item_id, context;
  try {
    const body = await request.json();
    amount  = Number(body.amount);
    item_id = String(body.item_id || '').trim();
    context = String(body.context || '').trim();
  } catch { return corsWrapCred(request, '{"error":"bad_request"}', 400); }

  if (!Number.isInteger(amount) || amount <= 0) {
    return corsWrapCred(request, '{"error":"invalid_amount"}', 400);
  }
  if (!item_id || item_id.length > 64) {
    return corsWrapCred(request, '{"error":"invalid_item_id"}', 400);
  }
  if (!OAB_SPEND_CONTEXTS.has(context)) {
    return corsWrapCred(request, '{"error":"invalid_context"}', 400);
  }

  // Read-modify-write with a version check. Three attempts cover
  // near-collisions; sustained contention falls through to 503.
  for (let attempt = 0; attempt < 3; attempt++) {
    const state = await env.KV.get(`oab_state_${fid}`, { type: 'json' });
    if (!state) {
      return corsWrapCred(request, '{"error":"no_save_state"}', 404);
    }
    const balance = Number(state.crown_balance) || 0;
    if (balance < amount) {
      return corsWrapCred(request, JSON.stringify({
        error: 'insufficient_crowns', amount, balance,
      }), 402);
    }

    const expectedVersion = Number(state.version) || 0;
    state.crown_balance   = balance - amount;
    state.last_save_iso   = new Date().toISOString();
    state.version         = expectedVersion + 1;

    // Re-read just before write to detect a concurrent mutation.
    // This is not true CAS — KV doesn't expose one — but it narrows
    // the race window enough for single-player game state. If we
    // detect a version skew, retry from the top.
    const verify = await env.KV.get(`oab_state_${fid}`, { type: 'json' });
    if (Number((verify && verify.version) || 0) !== expectedVersion) {
      continue;
    }

    await env.KV.put(`oab_state_${fid}`, JSON.stringify(state));
    await env.KV.put(`oab_crown_balance_${fid}`, String(state.crown_balance));

    const spend_id = 'oabsp_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);

    if (!Array.isArray(user.credit_history)) user.credit_history = [];
    user.credit_history.push({
      at: Date.now(),
      kind: 'oab_spend',
      item_id,
      context,
      crowns: -amount,
      spend_id,
    });
    await env.KV.put(`user:${user.email}`, JSON.stringify(user));

    return corsWrapCred(request, JSON.stringify({
      ok: true,
      new_balance: state.crown_balance,
      spend_id,
    }), 200);
  }

  return corsWrapCred(request, JSON.stringify({
    error: 'contention', detail: 'failed after 3 attempts',
  }), 503);
}

// POST /oath-and-bone/battle-result — record a battle outcome, update
// state, and (if Sergeant+ first-of-day victory) grant a daily credit.
//
// Body: { scenario_id, result: 'victory'|'defeat'|'flee', heroes_lost: [],
//         xp_earned, crowns_earned, difficulty_tier: 'scout'|'sergeant'|'marshal' }
// Returns 200 { ok, new_crown_balance, fallen_heroes, crown_credit_grant }.
//
// Server enforces: result enum, tier enum, sanity bounds on earnings,
// fallen_heroes can only grow (permadeath), Sergeant/Marshal-only
// credit eligibility, daily cap.
async function handleOabBattleResult(request, env) {
  const auth = await oabResolveAuth(request, env);
  if (auth.error) return auth.error;
  const { user, fid } = auth;

  let scenario_id, result, heroes_lost, xp_earned, crowns_earned, difficulty_tier;
  try {
    const body = await request.json();
    scenario_id     = String(body.scenario_id || '').trim();
    result          = String(body.result || '').trim();
    heroes_lost     = Array.isArray(body.heroes_lost) ? body.heroes_lost.map(String) : [];
    xp_earned       = Number(body.xp_earned) || 0;
    crowns_earned   = Number(body.crowns_earned) || 0;
    difficulty_tier = String(body.difficulty_tier || '').trim();
  } catch { return corsWrapCred(request, '{"error":"bad_request"}', 400); }

  if (!scenario_id || scenario_id.length > 64) {
    return corsWrapCred(request, '{"error":"missing_scenario_id"}', 400);
  }
  if (!['victory', 'defeat', 'flee'].includes(result)) {
    return corsWrapCred(request, '{"error":"invalid_result"}', 400);
  }
  if (!Number.isFinite(xp_earned) || xp_earned < 0 || xp_earned > OAB_MAX_XP_PER_BATTLE_RESULT) {
    return corsWrapCred(request, '{"error":"invalid_xp"}', 400);
  }
  if (!Number.isFinite(crowns_earned) || crowns_earned < 0 ||
      crowns_earned > OAB_MAX_CROWNS_PER_BATTLE_RESULT) {
    return corsWrapCred(request, '{"error":"invalid_crowns"}', 400);
  }
  if (!['scout', 'sergeant', 'marshal'].includes(difficulty_tier)) {
    return corsWrapCred(request, '{"error":"invalid_difficulty_tier"}', 400);
  }
  if (heroes_lost.length > 32) {
    return corsWrapCred(request, '{"error":"too_many_heroes_lost"}', 400);
  }

  const nowIso   = new Date().toISOString();
  const monthKey = nowIso.slice(0, 7);  // YYYY-MM
  const dateKey  = nowIso.slice(0, 10); // YYYY-MM-DD

  // 1. Append to history (per-month bucket, ~13-month TTL)
  const historyKey = `oab_history_${fid}_${monthKey}`;
  const history = await env.KV.get(historyKey, { type: 'json' }) || [];
  history.push({
    scenario_id,
    result,
    heroes_lost,
    xp_earned,
    crowns_earned,
    difficulty_tier,
    date_iso: nowIso,
    ts: Date.now(),
  });
  await env.KV.put(historyKey, JSON.stringify(history), {
    expirationTtl: OAB_HISTORY_TTL_SEC,
  });

  // 2. Update canonical state: union heroes_lost, credit Crowns
  let state = await env.KV.get(`oab_state_${fid}`, { type: 'json' });
  if (!state) state = oabDefaultState();
  const fallenSet = new Set((state.fallen_heroes || []).map(String));
  for (const h of heroes_lost) fallenSet.add(h);
  state.fallen_heroes = Array.from(fallenSet);
  state.crown_balance = (Number(state.crown_balance) || 0) + crowns_earned;
  state.last_save_iso = nowIso;
  state.version       = (Number(state.version) || 0) + 1;
  await env.KV.put(`oab_state_${fid}`, JSON.stringify(state));
  await env.KV.put(`oab_crown_balance_${fid}`, String(state.crown_balance));

  // 3. Daily credit grant — Sergeant and Marshal first-of-day are
  // SEPARATE events (ECONOMY.md §2). A player who wins one of each in
  // a day earns both grants, subject to OAB_DAILY_CREDIT_CAP.
  let creditGrant = null;
  if (result === 'victory') {
    const eventKey = difficulty_tier === 'marshal'  ? 'first_marshal_victory'
                   : difficulty_tier === 'sergeant' ? 'first_sergeant_victory'
                   : null;
    if (eventKey) {
      creditGrant = await grantDailyCreditFromOathAndBone(
        env, user, eventKey, difficulty_tier, dateKey,
      );
    }
  }

  return corsWrapCred(request, JSON.stringify({
    ok: true,
    new_crown_balance: state.crown_balance,
    fallen_heroes: state.fallen_heroes,
    crown_credit_grant: creditGrant,
  }), 200);
}

// Daily credit grant helper. Awards credits the first time a qualifying
// event happens today, capped at OAB_DAILY_CREDIT_CAP per day across all
// oath-and-bone events. Persists ledger at oab_credits_granted_<fid>_<date>
// with a 48h TTL (covers timezone wraparound + late retries).
//
// Returns: { granted, capped, daily_used, daily_cap, new_credit_balance,
//            already_granted_for_event? } — or null if event/tier not in
// the grant table.
//
// NOTE: this should ultimately live behind a shared POST /credits/grant-daily
// route (CROSS_INTERSECTION.md §4.4) once Muster ships its grant calls.
// Until then, it's an inline helper. See DECISIONS.md "2026-04-24 — Worker 23".
async function grantDailyCreditFromOathAndBone(env, user, eventKey, tier, dateKey) {
  const fid = user.fid;
  if (!fid) return null;

  const eventTable = OAB_CREDIT_GRANT_TABLE[eventKey];
  if (!eventTable) return null;
  const grantAmount = eventTable[tier] || eventTable.any || 0;
  if (grantAmount <= 0) return null;

  const ledgerKey = `oab_credits_granted_${fid}_${dateKey}`;
  const ledger = (await env.KV.get(ledgerKey, { type: 'json' })) ||
                 { used: 0, events: {} };

  if (ledger.events[eventKey]) {
    return {
      granted: 0,
      capped: false,
      already_granted_for_event: true,
      daily_used: ledger.used,
      daily_cap: OAB_DAILY_CREDIT_CAP,
    };
  }

  const remaining = Math.max(0, OAB_DAILY_CREDIT_CAP - ledger.used);
  const actualGrant = Math.min(grantAmount, remaining);
  if (actualGrant <= 0) {
    return {
      granted: 0,
      capped: true,
      daily_used: ledger.used,
      daily_cap: OAB_DAILY_CREDIT_CAP,
    };
  }

  ledger.used += actualGrant;
  ledger.events[eventKey] = { tier, granted: actualGrant, at: Date.now() };
  await env.KV.put(ledgerKey, JSON.stringify(ledger), { expirationTtl: 48 * 3600 });

  user.credits = (Number(user.credits) || 0) + actualGrant;
  if (!Array.isArray(user.credit_history)) user.credit_history = [];
  user.credit_history.push({
    at: Date.now(),
    kind: 'oab_daily_grant',
    event: eventKey,
    tier,
    credits: actualGrant,
    capped: actualGrant < grantAmount,
  });
  await env.KV.put(`user:${user.email}`, JSON.stringify(user));

  return {
    granted: actualGrant,
    capped: actualGrant < grantAmount,
    daily_used: ledger.used,
    daily_cap: OAB_DAILY_CREDIT_CAP,
    new_credit_balance: user.credits,
  };
}

// GET /advisor/history — return the full chat history for Pro+ users.
// credits.js' exportChat() calls this so users can download their memory.
async function handleAdvisorHistory(request, env) {
  const user = await getUser(request, env);
  if (!user) return corsWrapCred(request, '{"error":"not_logged_in"}', 401);
  if (!tierAtLeast(user, 'pro')) {
    return corsWrapCred(request, '{"error":"tier_required","required":"pro"}', 403);
  }
  return corsWrapCred(request, JSON.stringify({
    email:  user.email,
    fid:    user.fid || '',
    memory: user.memory || [],
    count:  (user.memory || []).length,
  }), 200);
}

// ──────────────────────────────────────────────────────────────────
// CORS helpers
// ──────────────────────────────────────────────────────────────────

// Allowed origins for credentialed requests. Only these can carry the
// ksp_session cookie. If you add a new production domain, add it here.
const ALLOWED_ORIGINS = new Set([
  'https://kingshotpro.com',
  'https://www.kingshotpro.com',
  'https://kingshotpro.github.io',
  'https://kingshotpro.pages.dev',
  // Local dev — remove in production lockdown if desired
  'http://localhost:8080',
  'http://localhost:5500',
  'http://127.0.0.1:8080',
  'http://127.0.0.1:5500',
]);

// corsWrapCred — origin-aware CORS wrapper for credentialed endpoints.
// Browsers REJECT `Allow-Origin: *` combined with `Allow-Credentials: true`,
// so cookie-bearing requests require echoing the specific Origin header.
function corsWrapCred(request, body, status = 200) {
  const origin = request && request.headers && request.headers.get('Origin');
  const allowed = origin && ALLOWED_ORIGINS.has(origin);
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'no-store',
    'Vary': 'Origin',
  };
  if (allowed) {
    headers['Access-Control-Allow-Origin']      = origin;
    headers['Access-Control-Allow-Credentials'] = 'true';
  } else {
    // No origin match — fall back to non-credentialed permissive CORS
    headers['Access-Control-Allow-Origin'] = '*';
  }
  return new Response(body, { status, headers });
}

function corsWrap(body, status = 200) {
  return new Response(body, {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Credentials': 'true',
      'Cache-Control': 'no-store',
    },
  });
}

// ── Provider-specific AI call helpers ────────────────────────────────────────
// Each helper returns { text, usage, cost } where cost is in USD.

async function callAnthropic(env, model, systemPrompt, messages) {
  const body = {
    model: model,
    max_tokens: 500,
    // Prompt caching: the system prompt is static across calls, so cache it.
    // 5-minute ephemeral cache — amortizes after ~2 reads. Perfect for chat.
    system: [
      { type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } },
    ],
    messages: messages,
  };
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': env.ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (data.error) throw new Error('anthropic: ' + (data.error.message || 'unknown'));
  const text = (data.content && data.content[0] && data.content[0].text) || '';
  const usage = data.usage || {};
  const rates = ANTHROPIC_RATES[model] || { in: 1, out: 5, cache_read: 0.1, cache_write_5m: 1.25 };
  const cost =
    ((usage.input_tokens || 0) / 1e6) * rates.in +
    ((usage.output_tokens || 0) / 1e6) * rates.out +
    ((usage.cache_read_input_tokens || 0) / 1e6) * rates.cache_read +
    ((usage.cache_creation_input_tokens || 0) / 1e6) * rates.cache_write_5m;
  return { text, usage, cost };
}

async function callDeepSeek(env, systemPrompt, messages) {
  // DeepSeek API is OpenAI-compatible. System message as first array entry.
  const body = {
    model: 'deepseek-chat',
    max_tokens: 500,
    temperature: 0.7,
    messages: [{ role: 'system', content: systemPrompt }].concat(messages),
  };
  const res = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + env.DEEPSEEK_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (data.error) throw new Error('deepseek: ' + (data.error.message || 'unknown'));
  const text = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '';
  const usage = data.usage || {};
  // DeepSeek handles caching transparently (~10x discount on cache hits).
  // Simplified cost model: treat input as full price. Real cost often lower.
  const cost =
    ((usage.prompt_tokens || 0) / 1e6) * DEEPSEEK_RATES.in +
    ((usage.completion_tokens || 0) / 1e6) * DEEPSEEK_RATES.out;
  return { text, usage, cost };
}

async function callOpenAI(env, model, systemPrompt, messages) {
  const body = {
    model: model,
    max_tokens: 500,
    messages: [{ role: 'system', content: systemPrompt }].concat(messages),
  };
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + env.OPENAI_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (data.error) throw new Error('openai: ' + (data.error.message || 'unknown'));
  const text = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '';
  const usage = data.usage || {};
  const rates = OPENAI_RATES[model] || { in: 0.15, out: 0.60 };
  const cost =
    ((usage.prompt_tokens || 0) / 1e6) * rates.in +
    ((usage.completion_tokens || 0) / 1e6) * rates.out;
  return { text, usage, cost };
}

// ── Cost tracking (per-FID, per-billing-cycle) ───────────────────────────────
// Key format: cost:{fid}:{yyyymm}. Expires 45 days after last write so it
// covers the current billing cycle plus a grace window.

async function getCostThisCycle(env, fid) {
  const yyyymm = new Date().toISOString().slice(0, 7); // e.g. "2026-04"
  const key = 'cost:' + fid + ':' + yyyymm;
  const raw = await env.KV.get(key);
  return parseFloat(raw) || 0;
}

async function addCost(env, fid, amount) {
  const yyyymm = new Date().toISOString().slice(0, 7);
  const key = 'cost:' + fid + ':' + yyyymm;
  const current = parseFloat(await env.KV.get(key)) || 0;
  const newCost = current + amount;
  await env.KV.put(key, String(newCost), { expirationTtl: 45 * 86400 });
  return newCost;
}

// ── Soft-cap "weary advisor" logic ───────────────────────────────────────────
// Drives the in-character fatigue progression and forced downgrade when a
// paid user has consumed too much of their own subscription's margin.

function getWearyState(costThisCycle, tier) {
  const revenue = TIER_REVENUE_USD[tier] || 0;
  if (revenue === 0) return 'normal'; // free tier has no soft-cap
  const ratio = costThisCycle / revenue;
  if (ratio < 0.50) return 'normal';
  if (ratio < 0.75) return 'hinting';
  if (ratio < 1.00) return 'weary';
  return 'downgraded';
}

function applyWearyFraming(systemPrompt, wearyState) {
  if (wearyState === 'normal') return systemPrompt;
  const notes = {
    hinting: '\n\nADVISOR STATE: You have served this Governor for many hours this cycle. You may subtly acknowledge the passage of time in your voice, but continue your full counsel without explicit mention of limits.',
    weary: '\n\nADVISOR STATE: Your role has nearly reached its limit for this cycle. In character, acknowledge that a Steward (or your current rank) can only serve so far in a single moon. Suggest the Governor may elevate your rank (War Council or higher) for greater sustained counsel. Continue to provide useful advice in this response. Frame this as institutional, not personal — you are not tired as a person, you are at the edge of what your role can bear.',
    downgraded: '\n\nADVISOR STATE: Your role is at rest until the new moon. Acknowledge briefly in character that you are offering simpler counsel for the remainder of this cycle. Still answer the question but be more concise than usual.',
  };
  return systemPrompt + (notes[wearyState] || '');
}
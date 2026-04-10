const UPSTREAM_BASE = 'https://kingshot-giftcode.centurygame.com';

const ROUTES = {
  '/player': '/api/player',
  '/redeem': '/api/player',
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
      } else if (url.pathname === '/advisor/chronicle') {
        return handleChronicle(request, env);
      } else if (url.pathname === '/advisor/illustration') {
        return handleIllustration(request, env);
      } else if (url.pathname === '/advisor/voice') {
        return handleVoice(request, env);
      } else if (url.pathname === '/advisor/portrait') {
        return handlePortrait(request, env);
      }
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
  const userData = {
    email,
    fid,
    tier: 'free',
    created: Date.now(),
    energy_today: 5,
    energy_date: new Date().toISOString().split('T')[0],
    memory: [],
  };

  await env.KV.put(userKey, JSON.stringify(userData));

  const sessionToken = crypto.randomUUID();
  await env.KV.put(`session:${sessionToken}`, JSON.stringify({ email }));

  await env.KV.delete(`auth_token:${token}`);

  const response = corsWrap(JSON.stringify({ ok: true, tier: 'free' }), 200);
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

  // Build system prompt with player context and advisor identity
  const systemPrompt = (env.SYSTEM_PROMPT || 'You are a medieval advisor for Kingshot players.') +
    '\n\nPlayer context: ' + (playerContext || 'Unknown') +
    '\n\nYou are ' + (advisorName || 'the advisor') + ', archetype: ' + (archetype || 'steward') +
    '. Stay in character. Be concise and strategic.';

  // Retrieve conversation memory (tier-aware)
  // Pro: last 7 days. Elite: full history. Free/anonymous: last 10.
  // ALL conversations are always STORED — the tier controls what gets LOADED as context.
  let memoryMessages = [];
  if (user && user.memory) {
    if (user.tier === 'elite') {
      // Elite: load full relevant history (last 30 exchanges for context window)
      memoryMessages = user.memory.slice(-30);
    } else if (user.tier === 'pro' || user.tier === 'war_council') {
      // Pro/WC: last 7 days of messages
      const sevenDaysAgo = Date.now() - 7 * 86400000;
      memoryMessages = user.memory.filter(function(m) { return !m.ts || m.ts > sevenDaysAgo; }).slice(-20);
    } else {
      memoryMessages = user.memory.slice(-10);
    }
  } else {
    const fidMem = await env.KV.get(`memory:${fid}`, { type: 'json' });
    if (fidMem) memoryMessages = fidMem.slice(-10);
  }

  const apiMessages = [...memoryMessages, { role: 'user', content: message }];

  // Model routing by tier
  const tier = user ? user.tier : 'free';
  const model = tier === 'elite' ? 'claude-3-5-sonnet-20241022' : 'claude-3-5-haiku-20241022';

  let assistantMessage;
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': env.ANTHROPIC_KEY,
        'content-type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({ model, max_tokens: 500, system: systemPrompt, messages: apiMessages }),
    });
    const data = await res.json();
    assistantMessage = (data.content && data.content[0]) ? data.content[0].text : 'My counsel falters. Try again, Governor.';
  } catch {
    return corsWrap('{"error":"ai service unreachable"}', 502);
  }

  // Store memory + decrement energy
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
    if (!energyData) energyData = { energy_today: 5, energy_date: new Date().toISOString().split('T')[0] };
    energyData.energy_today--;
    await env.KV.put(energyKey, JSON.stringify(energyData));
  }

  const remaining = user ? user.energy_today : (energyData ? energyData.energy_today : 0);
  return corsWrap(JSON.stringify({ response: assistantMessage, energy_remaining: remaining, tier }), 200);
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

// ── Tier check helper ──────────────────────
const TIER_RANK = { free: 0, pro: 1, war_council: 2, elite: 3 };
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

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': env.ANTHROPIC_KEY, 'content-type': 'application/json', 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: 'claude-3-5-haiku-20241022', max_tokens: 400, system, messages: [{ role: 'user', content: 'Player context: ' + (playerContext || 'Unknown') + '\n\nWrite the chronicle entry.' }] }),
  });
  const data = await res.json();
  const text = (data.content && data.content[0]) ? data.content[0].text : 'The chronicler\'s quill has stilled.';
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

// ── Premium: Voice Message (Elite) ─────────
async function handleVoice(request, env) {
  const user = await getUser(request, env);
  if (!tierAtLeast(user, 'elite')) return corsWrap('{"error":"tier_required","required":"elite"}', 403);

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

// ── Premium: Custom Portrait (Elite) ───────
async function handlePortrait(request, env) {
  const user = await getUser(request, env);
  if (!tierAtLeast(user, 'elite')) return corsWrap('{"error":"tier_required","required":"elite"}', 403);

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
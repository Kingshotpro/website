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

  // Retrieve conversation memory
  let memoryMessages = [];
  if (user && user.memory) {
    memoryMessages = user.memory.slice(-10);
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
  const newEntry = [{ role: 'user', content: message }, { role: 'assistant', content: assistantMessage }];
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
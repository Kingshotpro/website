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
      } else if (url.pathname === '/stripe/webhook') {
        return handleStripeWebhook(request, env);
      } else if (url.pathname === '/verify/request') {
        return handleVerifyRequest(request, env);
      } else if (url.pathname === '/verify/confirm') {
        return handleVerifyConfirm(request, env);
      } else if (url.pathname === '/verify/admin') {
        return handleVerifyAdmin(request, env);
      } else if (url.pathname === '/verify/mark-sent') {
        return handleVerifyMarkSent(request, env);
      }
    }

    // Admin dashboard GET
    if (request.method === 'GET' && url.pathname === '/verify/admin') {
      return handleVerifyAdminPage(request, env, url);
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

  // Model routing by tier — OpenAI now, Anthropic later
  const tier = user ? user.tier : 'free';
  const model = tier === 'elite' ? 'gpt-4o' : 'gpt-4o-mini';

  let assistantMessage;
  try {
    // OpenAI format: system message in messages array
    const openaiMessages = [{ role: 'system', content: systemPrompt }, ...apiMessages];
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + env.OPENAI_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages: openaiMessages, max_tokens: 500 }),
    });
    const data = await res.json();
    assistantMessage = (data.choices && data.choices[0]) ? data.choices[0].message.content : 'My counsel falters. Try again, Governor.';
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

  // Check if already verified
  const existing = await env.KV.get(`verified:${fid}`, { type: 'json' });
  if (existing) return corsWrap('{"error":"already_verified"}', 400);

  // Generate 6-digit code
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const req = {
    fid, kingdom, email, code,
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
              { name: 'Player ID', value: fid, inline: true },
              { name: 'Kingdom', value: String(kingdom), inline: true },
              { name: 'Email', value: email, inline: false },
              { name: '\uD83D\uDD11 CODE TO SEND IN-GAME', value: '**' + code + '**', inline: false },
            ],
            footer: { text: 'Find this player in-game \u2192 send them this code via mail' },
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
    '<table><tr><th>FID</th><th>Kingdom</th><th>Email</th><th>Code</th><th>Status</th><th>Age</th><th>Action</th></tr>' +
    rows + '</table>' +
    '<script>function markSent(fid){fetch("/verify/mark-sent",{method:"POST",headers:{"Content-Type":"application/json"},' +
    'body:JSON.stringify({fid:fid,adminKey:"' + (env.ADMIN_KEY || 'admin') + '"})}).then(function(){location.reload();});}</script>' +
    '</body></html>';

  return new Response(html, { status: 200, headers: { 'Content-Type': 'text/html' } });
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

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + env.OPENAI_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'gpt-4o-mini', max_tokens: 400, messages: [{ role: 'system', content: system }, { role: 'user', content: 'Player context: ' + (playerContext || 'Unknown') + '\n\nWrite the chronicle entry.' }] }),
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

// ── Stripe Webhook ─────────────────────────
async function handleStripeWebhook(request, env) {
  // Stripe sends events when subscriptions change
  // We map the Stripe price ID to our tier names
  const PRICE_TO_TIER = {
    'price_1TKkEnFs4JpQNEkSRplADapH': 'pro',      // Pro monthly
    'price_1TKkEoFs4JpQNEkSYu8qE89Y': 'pro',      // Pro annual
    'price_1TKkEoFs4JpQNEkSRbbD3K5X': 'war_council', // WC monthly
    'price_1TKkEoFs4JpQNEkSdD5BjG0A': 'war_council', // WC annual
    'price_1TKkEpFs4JpQNEkSGg9BaCPw': 'elite',     // Elite monthly
    'price_1TKkEpFs4JpQNEkSsDL82YV9': 'elite',     // Elite annual
  };

  let event;
  try {
    const body = await request.text();
    event = JSON.parse(body);
  } catch {
    return corsWrap('{"error":"invalid payload"}', 400);
  }

  const type = event.type;

  if (type === 'checkout.session.completed') {
    // New subscription
    const session = event.data.object;
    const email = session.customer_email || session.customer_details?.email;
    if (!email) return corsWrap('{"ok":true,"note":"no email"}');

    // Get the price ID from line items
    const lineItems = session.line_items?.data || [];
    let tier = 'pro'; // default
    for (const item of lineItems) {
      const priceId = item.price?.id;
      if (priceId && PRICE_TO_TIER[priceId]) {
        tier = PRICE_TO_TIER[priceId];
        break;
      }
    }

    // Update or create user in KV
    let user = await env.KV.get(`user:${email}`, { type: 'json' });
    if (user) {
      user.tier = tier;
    } else {
      user = { email, tier, fid: '', created: Date.now(), energy_today: 999, energy_date: '', memory: [] };
    }
    await env.KV.put(`user:${email}`, JSON.stringify(user));
    return corsWrap(JSON.stringify({ ok: true, tier }));

  } else if (type === 'customer.subscription.deleted' || type === 'customer.subscription.updated') {
    // Subscription cancelled or changed
    const sub = event.data.object;
    const email = sub.customer_email;
    if (!email) return corsWrap('{"ok":true}');

    if (sub.status === 'canceled' || sub.status === 'unpaid') {
      // Downgrade to free
      let user = await env.KV.get(`user:${email}`, { type: 'json' });
      if (user) {
        user.tier = 'free';
        await env.KV.put(`user:${email}`, JSON.stringify(user));
      }
    }
    return corsWrap('{"ok":true}');
  }

  return corsWrap('{"ok":true,"note":"unhandled event"}');
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
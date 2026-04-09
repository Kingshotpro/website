/**
 * KingshotPro API Proxy — Cloudflare Worker
 *
 * Routes all Century Games API calls through Cloudflare,
 * keeping user IPs away from the origin.
 *
 * Deploy: wrangler deploy
 * Subdomain: api.kingshotpro.com (add CNAME in Namecheap after deploy)
 *
 * Routes:
 *   POST /player  → centurygame.com/api/player  (FID lookup)
 *   POST /redeem  → centurygame.com/api/player  (gift code redeem, same endpoint, non-empty cdkey)
 */

const UPSTREAM_BASE = 'https://kingshot-giftcode.centurygame.com';

const ROUTES = {
  '/player': '/api/player',
  '/redeem': '/api/player',
};

export default {
  async fetch(request) {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return corsWrap(null, 204);
    }

    // Only POST allowed
    if (request.method !== 'POST') {
      return corsWrap('{"error":"method not allowed"}', 405);
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

    // Forward to Century Games
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

function corsWrap(body, status = 200) {
  return new Response(body, {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Cache-Control': 'no-store',
    },
  });
}

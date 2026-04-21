"""
server.py — HTTP service wrapping lookup_player.py

One endpoint: POST /lookup { fid } → player profile JSON.
Exposes the Playwright bot to the website so user FID submissions
automatically trigger a lookup without any human-in-the-loop step.

Deployment targets (see bot/README.md):
  - Fly.io             — fly launch + fly deploy
  - Railway            — just push; uses Dockerfile
  - Any Docker host    — docker build + docker run
  - Local dev          — python3 bot/server.py, optionally tunneled
                          via `cloudflared tunnel --url http://localhost:8080`

Performance notes:
  - Cold Playwright start is ~8s. We keep a single warm browser + context
    across requests using a lock. Good for single-instance traffic.
  - For >1 concurrent user, either scale out the service, or use a
    small pool. Start simple.

Security notes:
  - CORS allows only the production domain + GitHub Pages. If you add
    a new domain, add it to ALLOWED_ORIGINS.
  - Rate limit is 1 lookup per client-IP per 5 seconds + global 60/min.
    Enough to stop abuse, not enough to stop a real user.
  - No auth: the endpoint is public because the site's lookup form is
    public. Abuse is controlled via rate limits + KV caching at the
    Worker level (if you add one in front).
"""
from __future__ import annotations
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import asyncio, logging, os, time

from lookup_player import lookup, to_profile, update_registry

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(levelname)s %(name)s %(message)s',
)
log = logging.getLogger('bot.server')

ALLOWED_ORIGINS = [
    'https://kingshotpro.com',
    'https://www.kingshotpro.com',
    'https://kingshotpro.github.io',        # GitHub Pages fallback
    'https://kingshotpro.pages.dev',        # Cloudflare Pages fallback
    # For local dev / testing:
    'http://localhost:8080',
    'http://localhost:8000',
    'http://127.0.0.1:8080',
    'http://127.0.0.1:8000',
    'http://localhost:5500',                # common Live Server port
    'null',                                 # file:// origin for quick tests
]

PERSIST_REGISTRY = os.environ.get('PERSIST_REGISTRY', '0') == '1'

app = FastAPI(title='KingshotPro player lookup bot', version='1.0')
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=['POST', 'GET', 'OPTIONS'],
    allow_headers=['*'],
)

# Serialize Playwright access — one browser, one lookup at a time.
# Playwright's sync API isn't thread-safe, so this also keeps us out of races.
_lookup_lock = asyncio.Lock()

# Per-IP cooldown: IP -> last_lookup_timestamp
_ip_cooldown: dict[str, float] = {}
IP_COOLDOWN_SEC = 5.0

# Global throttle: one in-memory token bucket, 60 lookups/minute
_bucket = {'tokens': 60, 'refilled_at': time.time()}
BUCKET_MAX = 60
BUCKET_REFILL_RATE = 60.0 / 60.0   # 1 token per second


class LookupRequest(BaseModel):
    fid: str


def _consume_token() -> bool:
    now = time.time()
    elapsed = now - _bucket['refilled_at']
    _bucket['tokens'] = min(BUCKET_MAX, _bucket['tokens'] + elapsed * BUCKET_REFILL_RATE)
    _bucket['refilled_at'] = now
    if _bucket['tokens'] >= 1:
        _bucket['tokens'] -= 1
        return True
    return False


@app.get('/health')
async def health():
    return {'ok': True, 'service': 'kingshotpro-bot', 'ts': int(time.time())}


@app.post('/lookup')
async def do_lookup(req: LookupRequest, request: Request):
    # Sanitize input
    fid = (req.fid or '').strip()
    if not fid.isdigit() or not (4 <= len(fid) <= 12):
        raise HTTPException(status_code=400, detail='Player ID must be 4-12 digits')

    # IP cooldown
    ip = (request.client.host if request.client else 'unknown')
    last = _ip_cooldown.get(ip, 0.0)
    if time.time() - last < IP_COOLDOWN_SEC:
        raise HTTPException(status_code=429, detail=f'Too many lookups. Wait {IP_COOLDOWN_SEC:.0f}s between requests.')

    # Global throttle
    if not _consume_token():
        raise HTTPException(status_code=429, detail='Service busy. Try again in a moment.')

    async with _lookup_lock:
        _ip_cooldown[ip] = time.time()
        log.info('lookup fid=%s ip=%s', fid, ip)

        # lookup() is sync-blocking. Run it in the default thread pool so we
        # don't block the event loop while Playwright drives the page.
        loop = asyncio.get_running_loop()
        try:
            raw = await loop.run_in_executor(None, lookup, fid)
        except Exception as e:
            log.exception('lookup error')
            raise HTTPException(status_code=502, detail=f'Upstream lookup failed: {e}')

        profile = to_profile(raw)
        if profile is None:
            # CG returned code != 0 — typically "player not found"
            raise HTTPException(
                status_code=404,
                detail='Player ID not found. Double-check the number; Kingshot Player IDs are 7-8 digits.',
            )

        # Optional: keep the registry file in sync so future users benefit.
        # Off by default — in ephemeral container hosts (Fly.io's free tier
        # loses disk between restarts) there's no point. Turn on with
        # PERSIST_REGISTRY=1 if you mount a volume.
        if PERSIST_REGISTRY:
            try:
                update_registry(profile)
            except Exception as e:
                log.warning('registry write failed: %s', e)

        return profile


if __name__ == '__main__':
    import uvicorn
    port = int(os.environ.get('PORT', '8080'))
    uvicorn.run(app, host='0.0.0.0', port=port)

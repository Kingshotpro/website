# Bot — automated Player ID lookup

When a player submits their ID on the site, `fid.js` calls this service.
The service drives headless Chrome through Century Games' own giftcode
page — CG's obfuscated JS computes the `sign` field organically, we
intercept the `/api/player` response off the wire. No cryptanalysis,
no sign reproduction.

Proven against Player 40507834 (Jetrix メ, K223, Town Center 55):
clean 200 response, profile data captured, end-to-end flow working.

## Files

| File                  | What it is                                             |
|-----------------------|--------------------------------------------------------|
| `lookup_player.py`    | Core logic: given a FID, return a normalized profile   |
| `server.py`           | FastAPI wrapper — `POST /lookup { fid }`               |
| `requirements.txt`    | Python deps                                            |
| `Dockerfile`          | Container definition (uses official Playwright image)  |
| `fly.toml`            | Fly.io deployment config                               |
| `README.md`           | This file                                              |

## Deploy to Fly.io (default path)

```bash
brew install flyctl                     # one-time
fly auth login                          # one-time

cd bot
fly launch --no-deploy --copy-config    # uses the existing fly.toml
fly deploy
```

After deploy, the service is live at `https://kingshotpro-bot.fly.dev`.
Update the URL in `js/fid.js` (constant `LOOKUP_BOT_URL`) if you pick a
different app name during `fly launch`.

**Cost:** Fly.io auto-sleeps idle machines. With `auto_stop_machines = true`
in fly.toml, you pay nothing when nobody's using it. Cold wake is ~4s.

### Verify deployment

```bash
curl https://kingshotpro-bot.fly.dev/health
# {"ok":true,...}

curl -X POST https://kingshotpro-bot.fly.dev/lookup \
  -H "Content-Type: application/json" \
  -d '{"fid":"40507834"}'
# {"fid":40507834,"nickname":"Jetrix メ","kid":223,...}
```

## Deploy anywhere else

The `Dockerfile` is vendor-neutral. Push to Railway, Render, Hetzner,
a home server — anywhere that runs Docker containers with ~1 GB RAM.

```bash
docker build -t kingshotpro-bot ./bot
docker run -p 8080:8080 kingshotpro-bot
```

If you use a URL other than `https://kingshotpro-bot.fly.dev`, set the
override at the top of any HTML page that needs it:

```html
<script>window.KSP_LOOKUP_URL = 'https://your-service.example.com/lookup';</script>
<script src="js/fid.js"></script>
```

## Run locally (dev / tunnel)

```bash
python3 -m pip install -r bot/requirements.txt
python3 -m playwright install chromium       # first time only
python3 bot/server.py                         # listens on :8080
```

Expose it to the internet via Cloudflare Tunnel (zero config, free):

```bash
brew install cloudflared
cloudflared tunnel --url http://localhost:8080
# → prints a public https://random-id.trycloudflare.com URL
```

Set that URL as `window.KSP_LOOKUP_URL` and you're live without any
paid hosting at all.

## How the flow works end-to-end

1. User enters Player ID → `fid.js` calls `fetchPlayerProfile(fid)`
2. Check `players/registry.json` — static, instant. Hit? Done.
3. Miss → try the old Cloudflare Worker API proxy (still works for
   cached FIDs). Success? Done.
4. Miss → POST to the bot `/lookup` endpoint. ~5–15s. Returns profile.
5. Profile saved to localStorage. Site renders it. User sees their data.

User sees a "Looking up your profile…" line during steps 3–4 via the
`#fid-lookup-status` element on the homepage.

## Security, rate-limits, and abuse

- **Rate limits** — 5s cooldown per IP + global 60/minute bucket.
  Raise in `server.py` if real traffic exceeds those.
- **CORS** — only the production domains are allowed. If you add a new
  domain (staging, new Pages project), add it to `ALLOWED_ORIGINS`.
- **No auth** — the endpoint is public because the submitting form is
  public. Abuse is priced out via rate limits.
- **Input validation** — FID must be 4–12 digits. Anything else returns 400.
- **Persistence** — `PERSIST_REGISTRY=1` env var makes successful lookups
  write back to `players/registry.json`. Off by default because Fly.io
  free-tier disks are ephemeral. Turn on if you mount a volume.

## Scaling beyond single-machine

Today: one Fly machine, one Playwright context, lock-serialized lookups.
That's fine for up to maybe 10 req/min sustained.

When you outgrow it:
- Scale out horizontally — `fly scale count 3`. Each machine has its own
  browser. No shared state (registry writes are optional and idempotent).
- Pool browsers inside one instance — a `playwright-contrib`-style pool
  with 3–5 warm contexts per machine.
- Cache aggressively at the Worker level — a 24h KV cache on FID means
  the bot only hits CG once per player per day regardless of traffic.

## Known risks

- **Akamai bot detection.** Data-center IPs at high volume will hit
  challenge pages. Fly.io has mostly-clean IP ranges but not guaranteed.
  Mitigations if we start getting blocked: lower concurrency, add
  human-like mouse moves, rotate residential proxies (paid service).
- **Page layout changes.** The script depends on
  `input[placeholder="Player ID"]` and `.login_btn`. If CG redesigns the
  page, repair the two selectors at the top of `lookup_player.py`.
  A nightly integration test against a known-good FID (like 40507834)
  would catch this before users notice.
- **TOS gray area.** Same posture as the ADB phone-fleet scraper. The
  Architect has decided that risk is worth taking for this product.

## Manual admin usage (still works)

You can still pre-populate `players/registry.json` without the service:

```bash
python3 bot/lookup_player.py 12345678 --save
git add players/registry.json && git commit -m "Pre-register player" && git push
```

Useful for bulk backfill, support tickets, or when the service is down.

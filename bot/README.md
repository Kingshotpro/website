# Bot — headless-browser player lookup

Solves the "Player ID not found in our system" problem.

## What this is

Century Games' player-info API requires a `sign` field computed by
obfuscated client-side JS inside their giftcode page. That algorithm is
not reproducible outside their page (prior Hive minds failed to crack it
and the attempt was formally closed — see `docs/specs/API_FIX_SPEC.md`).

This bot sidesteps the whole crypto question: it loads the giftcode page
in real headless Chrome, lets THEIR JS compute the sign organically,
submits a Player ID, and scrapes the `/api/player` response straight off
the wire.

## Usage

```bash
cd KingshotPro
python3 bot/lookup_player.py 40507834            # prints JSON to stdout
python3 bot/lookup_player.py 40507834 --save     # also writes to players/registry.json
```

A registry entry immediately makes the player available on the site:
`fid.js` checks `players/registry.json` first, before the Cloudflare
Worker API proxy. No deployment needed.

## Flow

1. Player reports "my Player ID 123456 doesn't work on your site"
2. Architect runs `python3 bot/lookup_player.py 123456 --save`
3. Commit `players/registry.json` + push
4. Player refreshes the site — their data now loads

## Proof it works

Run once for 40507834 (Jetrix メ in K223, TC 55, F2P):

```
{
  "fid": 40507834,
  "nickname": "Jetrix メ",
  "kid": 223,
  "stove_lv": 55,
  "avatar_image": "https://...",
  "total_recharge": 0,
  "looked_up": 1776796879,
  "source": "giftcode_bot"
}
```

Century Games responded 200 with real data. Sign field was
`dd212b38ef388439188d8e12efa74a34` — computed by their JS, captured by
Playwright, we did not touch it.

## Requirements

```bash
pip install playwright
playwright install chromium
```

## Scaling path

This is the manual-per-player flow. Three upgrade paths when volume warrants:

1. **Cron batch.** Read pending FIDs from a queue (KV, a file, the missing-
   data report form once it ships), run them in a loop once an hour,
   commit + push the registry.
2. **HTTP service.** Wrap `lookup()` in FastAPI/Express, deploy to Fly.io
   (~$5/mo), add a Cloudflare Worker endpoint `POST /player/lookup` that
   proxies to it with auth + rate-limiting + KV caching. Site calls the
   Worker directly, no registry file needed.
3. **Cloudflare Browser Rendering.** CF has a Puppeteer-in-Workers product.
   Same stack as the rest of the site. Skip the VPS entirely.

Option 1 is the cheapest-to-launch (zero infra). Option 2 is the durable
answer. Option 3 is worth a look before committing to (2) because we
already use CF Workers.

## Risks

- **Akamai bot detection.** Works fine for low volume from residential IPs.
  At scale (>1/sec or from a data-center IP), we'll hit challenge pages.
  Mitigations: pacing, stealth plugins, rotating IPs.
- **Page layout changes.** Script depends on `input[placeholder="Player ID"]`
  and `.login_btn`. If CG restructures the page, script breaks at the
  selector level. Easy to repair — just update the two constants at the
  top of `lookup_player.py`. An integration test against a known-good FID
  nightly would catch this before users notice.
- **TOS gray area.** Same consideration as the ADB phone-fleet scraper:
  CG's TOS likely forbids automated access. The Architect has decided the
  risk is worth it for the ADB route; this bot is philosophically the
  same. Worth explicit re-confirmation if volume grows.

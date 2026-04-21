#!/usr/bin/env python3
"""
lookup_player.py — Century Games player lookup via headless-browser bot.

Why this exists: Century Games' player-info API requires a `sign` field
computed by obfuscated client-side JS. The sign algorithm is not
reproducible outside their page. This script loads their giftcode page
in headless Chrome, lets THEIR JS compute the sign organically, submits
a Player ID, and scrapes the response.

This is how we look up any player on the site without being at the mercy
of the 32-kingdom scraper rotation.

Usage:
  python3 bot/lookup_player.py 40507834          # one-off, JSON to stdout
  python3 bot/lookup_player.py 40507834 --save   # also write to players/registry.json

Requires: playwright, chromium
  pip install playwright && playwright install chromium
"""
from __future__ import annotations
from playwright.sync_api import sync_playwright, TimeoutError as PwTimeout
from pathlib import Path
import argparse, json, sys, time

GIFTCODE_URL    = 'https://ks-giftcode.centurygame.com/'
LOGIN_BTN_CLASS = 'login_btn'
API_ENDPOINT    = '/api/player'

# Where we cache successful lookups so the site can read them without
# re-running the bot. fid.js can fall back to this JSON when the direct
# API returns a Sign Error.
REGISTRY_PATH = Path(__file__).parent.parent / 'players' / 'registry.json'


def lookup(fid: str, timeout_ms: int = 25_000) -> dict:
    """Look up a Player ID. Returns the `data` payload from CG, or raises."""
    fid = str(fid).strip()
    if not fid.isdigit():
        raise ValueError(f"Player ID must be digits, got {fid!r}")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        try:
            ctx = browser.new_context(
                viewport={'width': 1280, 'height': 900},
                user_agent=(
                    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) '
                    'AppleWebKit/537.36 (KHTML, like Gecko) '
                    'Chrome/127.0 Safari/537.36'
                ),
            )
            page = ctx.new_page()

            # Capture the /api/player response as it fires. We don't parse
            # the DOM — we let CG's own JS make the request and read what
            # comes back on the wire.
            player_response: dict = {'data': None, 'error': None}

            def on_response(res):
                if API_ENDPOINT in res.url and res.request.method == 'POST':
                    try:
                        body = res.json()
                        player_response['data'] = body
                    except Exception as e:
                        player_response['error'] = f'parse error: {e}'

            page.on('response', on_response)

            page.goto(GIFTCODE_URL, wait_until='domcontentloaded', timeout=timeout_ms)
            page.wait_for_load_state('networkidle', timeout=timeout_ms)

            # Fill the Player ID input + click the Login button.
            fid_input = page.locator('input[placeholder="Player ID"]').first
            fid_input.fill(fid)

            login_btn = page.locator(f'.{LOGIN_BTN_CLASS}').first
            login_btn.click()

            # Wait up to 10s for the /api/player response to arrive.
            deadline = time.time() + 10
            while time.time() < deadline:
                if player_response['data'] is not None:
                    break
                page.wait_for_timeout(200)

            if player_response['data'] is None:
                raise TimeoutError(
                    f'No /api/player response within 10s for fid={fid}. '
                    'Page may have changed or request failed silently.'
                )
            return player_response['data']
        finally:
            browser.close()


def to_profile(raw: dict) -> dict | None:
    """Convert the raw CG response into our normalized profile shape."""
    if not raw or raw.get('code') != 0 or 'data' not in raw:
        return None
    d = raw['data']
    return {
        'fid':              d.get('fid'),
        'nickname':         d.get('nickname'),
        'kid':              d.get('kid'),
        'stove_lv':         d.get('stove_lv'),      # Town Center level
        'avatar_image':     d.get('avatar_image'),
        'total_recharge':   d.get('total_recharge_amount', 0),
        'looked_up':        int(time.time()),
        'source':           'giftcode_bot',
    }


def update_registry(profile: dict):
    """Append or update this profile in players/registry.json."""
    REGISTRY_PATH.parent.mkdir(parents=True, exist_ok=True)
    registry = {}
    if REGISTRY_PATH.exists():
        try:
            registry = json.loads(REGISTRY_PATH.read_text())
        except json.JSONDecodeError:
            registry = {}
    if 'players' not in registry:
        registry['players'] = {}
    fid_key = str(profile['fid'])
    registry['players'][fid_key] = profile
    registry['generated'] = int(time.time())
    registry['source']    = 'bot/lookup_player.py'
    REGISTRY_PATH.write_text(json.dumps(registry, indent=2, ensure_ascii=False))


def main():
    ap = argparse.ArgumentParser(description='Look up a Kingshot player by ID via headless-browser bot.')
    ap.add_argument('fid', help='Player ID (digits only)')
    ap.add_argument('--save', action='store_true',
                    help='Also write the result to players/registry.json')
    args = ap.parse_args()

    try:
        raw = lookup(args.fid)
    except Exception as e:
        print(json.dumps({'error': str(e), 'fid': args.fid}), file=sys.stderr)
        sys.exit(1)

    profile = to_profile(raw)
    if profile is None:
        print(json.dumps({'error': 'lookup returned no data', 'raw': raw}, ensure_ascii=False), file=sys.stderr)
        sys.exit(1)

    print(json.dumps(profile, indent=2, ensure_ascii=False))

    if args.save:
        update_registry(profile)
        print(f'\nWrote to {REGISTRY_PATH}', file=sys.stderr)


if __name__ == '__main__':
    main()

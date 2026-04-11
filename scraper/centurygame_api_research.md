# Century Games / Kingshot API Research
Source: OpenAI research session, April 6 2026

## Key Finding
Kingshot is made by Century Games (same company as Whiteout Survival).
Both games share the same backend infrastructure at centurygame.com.
Internal codename for Kingshot: "gof" (Game of Fire).

## Confirmed HTTPS API Endpoints
- Player lookup (primary):   https://wos-giftcode-api.centurygame.com/api/player
- Player lookup (secondary): https://gof-report-api-formal.centurygame.com/api/player
- Gift code redemption:      https://wos-giftcode-api.centurygame.com/api/gift_code
- Captcha challenge:         https://wos-giftcode-api.centurygame.com/api/captcha

The "gof-report-api-formal" domain is the Kingshot-specific backend.
"report" in the domain name suggests possible reporting/analytics endpoints beyond player lookup.

## Request Signing Protocol
Shared secret (hardcoded in community tools): tB87#kPtkxqOS2
Signature algorithm:
  - Player lookup: MD5("fid={fid}&time={epoch_ms}" + SECRET)
  - Other endpoints: sort all payload keys alphabetically, join as key=val&..., MD5(joined + SECRET)
  - Prepend as sign={hash}& to POST body
Transport: HTTPS port 443, Content-Type: application/x-www-form-urlencoded, JSON responses
No protobuf — plain form-encoded POST with JSON responses.

## Rate Limiting
- 30 requests per 60-second rolling window per IP
- HTTP 429 triggers 60-second backoff
- x-ratelimit-limit and x-ratelimit-remaining headers present in responses
- Captcha challenges after sustained access

## Community Repositories Found
- whiteout-project/Whiteout-Survival-Discord-Bot (JS/Node)
- KleinDevDE/WosTools (PHP)
- AlessVett/whiteout-survival-bot (Python/FastAPI)
- Gercekefsane/whiteout-survival-bot (Python)
- Crosswind/wos-gift-code (Python/JS)
- batazor/whiteout-survival-autopilot (Go/Python)

## What Was NOT Found
- No alliance ranking API endpoints confirmed
- No kingdom-level data endpoints confirmed
- No TCP port 30101 references in public tooling
- No Kingshot-specific repos (consolidated under WOS tooling)
- No protobuf definitions public

## Cross-Kingdom Binary TCP Test Result (Gemini)
- Kingdom ID 1908 NOT found in ranking request bytes in any encoding
- Server returned K1908 data regardless of attempted patches
- Conclusion: auth token is kingdom-bound on the server side for binary TCP
- Cross-kingdom queries via binary protocol: NOT POSSIBLE with one token

## Open Questions
1. Does gof-report-api-formal.centurygame.com have ranking endpoints beyond /api/player?
2. Does the player FID (used in HTTPS API) correspond to the binary protocol's alliance ID bytes?
3. Can alliance rankings be queried via HTTPS using only FID + signing key (no session auth)?

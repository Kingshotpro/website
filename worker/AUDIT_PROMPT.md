# Audit Prompt

You are auditing a Cloudflare Worker before it is deployed to production. This worker handles authentication, payments, AI chat, and a credit economy for a live web application with paying users. Mistakes here lose money or break accounts.

## Your job

Read `AUDIT_SPEC.md` in this directory. It describes 13 specific areas to audit plus global concerns. It was written by the Claude that made the changes — meaning it knows its own blind spots but may also be rationalizing its own work. Trust the spec's structure but verify its claims independently.

Then read `worker.js` in this directory. Read the entire file, top to bottom. Do not skim. Do not sample. Every function, every branch, every return path.

## How to audit

For each of the 13 items in the spec:

1. Read the relevant code. Not the spec's description of the code — the actual code.
2. For every claim the spec makes ("this field doesn't exist on Stripe objects", "this defaults to 0"), verify it. Use web search to check Stripe API documentation where the spec raises Stripe-specific questions. Do not take the prior Claude's word for what Stripe does or doesn't include in webhook payloads.
3. Trace the full execution path. Start from the incoming request, follow every branch, check every early return. What happens on success? What happens on each failure mode? What happens with malformed input? What happens with missing fields on old user objects?
4. For CORS items: the rule is simple. If the browser sends `credentials: 'include'`, the response MUST have `Access-Control-Allow-Origin` set to the specific requesting origin (not `*`) AND `Access-Control-Allow-Credentials: true`. If either is wrong, the browser silently drops the response. Check every endpoint the frontend calls.
5. For security items: think like an attacker. What can someone do by crafting requests to these endpoints? What stops them?

## What to look for beyond the spec

The spec covers what the prior Claude changed. But you're auditing the whole file. If you see bugs in code the prior Claude didn't touch, report them. Specifically watch for:

- Any remaining references to dead tiers (war_council, elite, commander, vanguard — anything that isn't `free` or `pro`)
- Any endpoint that reads cookies but doesn't pass origin to corsWrap
- Any endpoint where auth can be bypassed
- Any KV write that could lose data under concurrent requests
- Any place user input is interpolated into HTML without escaping (the admin pages build HTML strings from user data)
- Any API key or secret that could leak in a response
- Error paths that return sensitive information

## What NOT to do

- Do not fix anything. Do not edit any files. Report only.
- Do not suggest refactors, style improvements, or "nice to haves." This is a go/no-go deployment audit, not a code review.
- Do not assume the prior Claude's fixes are correct because they look reasonable. Read the code and decide for yourself.

## Deliverable

Produce the table described at the bottom of `AUDIT_SPEC.md`: one row per item (1-13), with verdict and issues. Then list anything else you found. Then give a final DEPLOY or DO NOT DEPLOY verdict with your reasoning.

Be blunt. "Probably fine" is not a verdict. If you're unsure about something, say what you'd need to verify and mark it as FAIL until verified.

## Files to read

1. `KingshotPro/worker/AUDIT_SPEC.md` — read first
2. `KingshotPro/worker/worker.js` — read entire file, all ~1330 lines
3. `KingshotPro/js/credits.js` — frontend that calls the new endpoints (needed to verify CORS and request patterns)
4. `KingshotPro/profile.html` — contains the chat export UI (needed to verify the export flow end-to-end)
5. `KingshotPro/kingdoms/index.html` — contains kingdom request buttons (needed to verify the request flow end-to-end)

Read them in that order.

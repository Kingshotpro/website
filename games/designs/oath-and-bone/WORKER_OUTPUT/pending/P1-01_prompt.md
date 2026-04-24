# P1-01 Delegation Prompt — worker.js playerContext stringify fix

## Context

You are reviewing a one-line bug in a Cloudflare Worker (worker.js). The bug causes a JavaScript object to be coerced to the string `[object Object]` when it should be JSON-serialized.

## The bug

In worker.js, the `handleAdvisorChat` and `handleAdvisorConsult` functions build a prompt string for an LLM. At the relevant line(s), `playerContext` — which is an object containing player state, observations, and profile data — is concatenated into a string using the `+` operator:

```javascript
'\n\nPlayer context: ' + (playerContext || 'Unknown') +
```

When `playerContext` is an object, JavaScript's `+` operator coerces it with `.toString()`, producing the literal text `[object Object]`. The LLM receives `Player context: [object Object]` and has zero access to the actual player data.

## The fix

Replace every occurrence of the above pattern with:

```javascript
'\n\nPlayer context: ' + (playerContext ? JSON.stringify(playerContext) : 'Unknown') +
```

This uses a ternary instead of `||` so that:
- If `playerContext` is truthy (an object): serialize it with `JSON.stringify`
- If `playerContext` is falsy (null/undefined): fall back to `'Unknown'`

## CONSTRAINTS (do not remove, do not paraphrase)

- This is a one-line change. Do NOT refactor surrounding code.
- Do NOT rename any variables.
- Do NOT add imports, helper functions, or new logic.
- Do NOT add error handling around `JSON.stringify` — if playerContext is malformed, that is a caller error, not a callee concern.
- Return ONLY the old string and the new string, exactly as shown below. No explanation. No markdown code fences around the diff itself.

## Required output format

Return exactly this, with no additional text:

OLD:
'\n\nPlayer context: ' + (playerContext || 'Unknown') +

NEW:
'\n\nPlayer context: ' + (playerContext ? JSON.stringify(playerContext) : 'Unknown') +

# KingshotPro — Vozo TTS Evaluation Handoff
*Saved April 13, 2026 by recovery Claude after session context overflow*

---

## What was happening

The previous Claude session was evaluating **Vozo TTS** as a replacement for OpenAI TTS in the advisor video pipeline.

**Current pipeline** (worker.js, `handleAdvisorVideo`):
1. Text → OpenAI `tts-1` with `nova` voice → MP3 audio
2. MP3 audio → Simli `/static/audio` → lip-synced MP4 video
3. Cache MP4 in KV (mandatory, never skip)

**Why evaluating Vozo:**
- OpenAI `nova` voice was the preference after comparing against OpenAI `Fable` (British accent, sounded awful)
- The question was whether Vozo's voices sound better or more medieval-appropriate
- Body animation (Simli) is the primary test — voice can swap later

---

## The open question from the Architect

> "vozo is asking for a script. What do we put there? Is it not real time or this is just a trial?"

**Answer:**

Vozo's "Script" field is simply the text you want converted to speech. It is **not real-time** — it generates an audio file from text, same as OpenAI TTS. Their web UI is a trial/preview tool so you can hear the voice BEFORE committing to API integration.

**For the test, put this in the Script field:**
> "Governor, I have been waiting for you. Enter your Player ID and I shall show you what no other counsel can."

That's the sentence the previous Claude suggested. It's short enough to generate quickly, contains the right tone (formal, medieval-ish), and exercises how the voice handles "Governor" — the most repeated word in all advisor speech.

---

## What to do next

1. **Generate the test clip on Vozo** using the script above, with "Alice - Multilingual, Female, Middle Aged" (already selected)
2. **Listen and compare** to OpenAI nova. The question is: does it sound warmer? More regal? Or worse?
3. **If Vozo sounds better:** swap the TTS call in `handleAdvisorVideo` (worker.js ~line 675):
   - Replace the OpenAI TTS fetch with Vozo's API
   - Keep everything else identical (Simli step, cache step, etc.)
4. **If Vozo sounds worse or equal:** stay with OpenAI nova. No changes needed.
5. **Then test Simli:** send Vozo audio to Simli to see if the lip-sync on the advisor body looks right

---

## Current code location

- Worker: `/KingshotPro/worker/worker.js`
- TTS + Simli logic: `handleAdvisorVideo()` function, ~lines 649–737
- TTS line specifically: ~line 675 (`fetch('https://api.openai.com/v1/audio/speech', ...)`)
- Voice set to: `nova`, model: `tts-1`, speed: `0.92`

---

## Vozo API integration (if chosen)

When the test confirms Vozo sounds better, the worker swap is straightforward:

```js
// Replace this block (~line 672-680):
var ttsRes;
try {
  ttsRes = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + env.OPENAI_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'tts-1', voice: 'nova', input: responseText, speed: 0.92 }),
  });
} catch { return corsWrap('{"error":"tts failed"}', 502); }

// With Vozo equivalent — exact API call TBD after Architect tests their portal
// and gets a Vozo API key + confirms endpoint format
```

The Vozo API key should go into Cloudflare Workers env as `VOZO_KEY` (never hardcoded).

---

## Key constraints to remember

- **Cache is mandatory.** Every Simli-generated MP4 must be saved to KV. Never generate the same video twice. See `project_kingshotpro_video_cache.md`.
- **Do not deploy without testing.** Swap TTS in dev/staging first.
- **The Simli face ID** currently hardcoded as `f3e0d64a-dda5-403e-8d23-b3c980dd3713`. This is the advisor's face. Don't change it without visual testing.

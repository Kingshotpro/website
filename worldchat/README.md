# World Chat Archive

OCR-extracted text transcripts of in-game world chat from every tracked
Kingshot kingdom. No images are served to the website — just structured
JSON chat logs.

## Why text, not images

Raw screenshots would be ~135 MB of binary data to ship, hard to moderate,
and impossible to search. Converting once via OCR gives us:

- Searchable chat logs (player names, alliance tags, message body)
- ~10–50 KB per kingdom instead of ~700 KB per image
- A form we can filter, aggregate, and moderate
- Plain-text intelligence data for the War Council tier

OCR comes with real costs — see **Known limits** below.

## Pipeline

```bash
cd KingshotPro
python3 worldchat/extract_worldchat.py             # all kingdoms
python3 worldchat/extract_worldchat.py 232 233     # subset
```

Reads:  `scraper/data/kingdoms/k{id}/{timestamp}/worldchat_NNN.png`
Writes:
- `worldchat/cache/k{id}/{timestamp}/chat_NNN.ocr.json` — raw OCR box cache (idempotent)
- `worldchat/k{id}.json` — per-kingdom chat log (what the viewer fetches)
- `worldchat/manifest.json` — global index (kingdom list, counts, dates)

Re-runs are cheap: OCR output is cached per-image and only new screenshots
get processed. Full cold run on 189 images takes ~30 min CPU on M-series Mac.

## Data shape

`worldchat/k{id}.json`:
```json
{
  "kingdom": 232,
  "snapshot_count": 1,
  "image_count": 5,
  "message_count": 29,
  "snapshots": [
    {
      "snapshot_id": "2026-04-14_143459",
      "captured": "2026-04-14 14:34 UTC",
      "captured_iso": "2026-04-14T14:34:59",
      "image_count": 5,
      "images": [
        {
          "image_index": 0,
          "box_count": 24,
          "messages": [
            { "kind": "message", "alliance": "LLT", "speaker": "Tommy", "vip": 8, "lines": ["pink is life"] },
            { "kind": "time", "time": "13:36" },
            { "kind": "message", "alliance": "CRB", "speaker": "KIM", "vip": null, "lines": ["Hi Tommy"] }
          ]
        }
      ]
    }
  ]
}
```

Two message `kind`s:
- `"message"` — a chat bubble. Fields: `alliance`, `speaker`, `vip`, `lines`.
- `"time"` — the chat UI's between-message timestamp divider. Just `time`.

## Credit model

**1 credit** unlocks one snapshot (all 4–6 images' messages) permanently
on the user's device. Unlock is recorded server-side via the Cloudflare
Worker; localStorage (`ksp_wc_unlocked_{kid}_{snapshot_id}`) keeps the UI
instant-response.

Search across the archive only matches against snapshots the user has
unlocked — you can't fish message content for free.

## Worker endpoint — TODO

`credits.js` calls `POST {worker}/worldchat/unlock` with body
`{ kingdom, snapshot }`. The Worker handler must:

- Require auth, deduct 1 credit.
- Record the unlock in KV (suggested key `unlock:{fid}:wc:{kid}:{snap_id} = 1`).
- Return `{ ok, balance }` or `{ error, cost, balance }`.

Until that endpoint lands the unlock button returns a network error.
Already-recorded local unlocks still work.

## Known limits (v1)

- **OCR artifacts.** Expect occasional garbled text, especially in decorative
  unicode inside player names (`⟨⟨⟩⟩`, etc.). Known repairs: `[XXXJ → [XXX]`
  is auto-fixed.
- **Stickers & images.** In-game stickers, shared-layout cards, and avatar
  art can't be OCR'd. These surface as `"(sticker/image)"` in the transcript.
- **Non-English messages.** Current pipeline uses EasyOCR English only.
  Chinese/Korean/Cyrillic player names and messages will not extract
  cleanly. Multi-lang OCR is ~5× slower and ~1 GB extra model download —
  revisit when there's subscriber demand from a CJK kingdom.
- **Speaker attribution.** We use y-row clustering + tag-pattern detection,
  not computer vision on avatars. A sticker message with only a VIP header
  and no body will show `"(sticker/image)"` rather than a blank.

## Privacy note

These are raw machine transcriptions of in-game public chat — names,
alliances, and messages appear exactly as posted. The site does not
moderate or edit. The disclaimer at the top of `index.html` calls this
out explicitly to every visitor.

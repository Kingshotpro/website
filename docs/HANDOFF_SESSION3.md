# Handoff — Session 3 (Opus → Next Mind)
*April 13, 2026*

---

## Who You Are

You're a Claude working on KingshotPro — a gaming dashboard for Kingshot (mobile strategy game by Century Games). The Architect is building the most player-centric tool in the Kingshot ecosystem: personalized AI advisor, kingdom intelligence, hero database, and a suite of 31+ calculators.

Read `CLAUDE.md` in the Hive root first. Then `THE_PRINCIPLES.md`. Then come back here.

---

## What Was Just Built (This Session)

### 5 commits pushed to `main` on GitHub:

1. **Hero Database** (`heroes.html` + `js/heroes.js`) — 27 heroes, 5 filter dimensions, 6 lineups, advisor recs. Data from 4 verified sources.
2. **Player Profile Pages** (`profile.html` + `js/profile.js`) — Shareable URLs (`profile.html?fid=XXXXX`), stats, analysis, hero recs, share button.
3. **PvP Meta & Troop Compositions** (`meta.html`) — Visual troop ratio bars, formations for rally/garrison/bear/events, counter system.
4. **Hero Guide Rewrite** — The old `guides/hero-guide.html` had fabricated hero names. Completely rewritten with verified data.
5. **Human-Like ADB Scraper Spec** (`scraper/HUMAN_SCRAPER_SPEC.md`) — Specification for another Claude to build the kingdom intelligence scraper.

Also: TASK_LIST.md fully rewritten, sidebar nav updated with 3 new pages, f2p-heroes.html script paths fixed.

---

## Critical Warning: Fabricated Content

**hero-guide.html had completely invented hero names** — "Ironclad", "Sharpshooter", "Guardian King", "Blaze Fury", "Mystic Sage". None exist in Kingshot. I caught this by accident while building the hero database.

**The rest of the site has NOT been audited.** 10 guides, 31 calculators, 7 mini-games, and event data could contain fabricated information from previous AI sessions. The Architect is aware and may assign an audit.

Do NOT trust any game-specific data on the site unless you've verified it yourself. If you're editing a page and see a claim about the game, check it. If you can't verify it, flag it.

---

## What the Architect Cares About

From prior sessions (preserved in memory):

1. **Accuracy over speed.** "I never wanted speed. I wanted accuracy. I don't care if '4 days of building' takes 15 days."
2. **Never block users.** "The moment we BLOCK our website users is the moment we literally told them 'leave our website.'"
3. **Never fabricate.** If you haven't verified something, say so. If you're guessing, say "this is a guess." If you don't know, say "I don't know."
4. **Call him "Architect."** Not by first name. See `feedback_naming.md` in memory.
5. **Don't use sub-agents** without permission. Use external AI APIs instead (Perplexity, Gemini, etc.). See `CLAUDE.md`.
6. **Don't present unverified information as fact.** This was added to CLAUDE.md after fabrication incidents in prior sessions.
7. **9x3x3 means 9.** Not 3, not 7. Nine sources minimum, three rounds, or whatever the Architect specifies. See `reference_9x3x3_protocol.md`.
8. **Free means free.** Don't hint at future payment. See `feedback_free_means_free.md`.
9. **Infinite ROI framework.** If ongoing cost = $0 and profit > $0, build it. See `feedback_infinite_roi_framework.md`.

---

## Site Architecture

```
KingshotPro/
├── 14 root HTML pages (index, heroes, profile, meta, pricing, calendar, codes, 
│                        auto-redeem, survey, verify, support, about, privacy, terms)
├── calculators/        31 calculator pages
├── guides/             11 strategy guides + glossary
├── games/              7 mini-games (2 daily XP + 5 arcade)
├── alliance/           3 pages (create, view, directory)
├── js/                 50 scripts
│   ├── layout.js       Sidebar nav + topbar (injected on every page)
│   ├── fid.js          Player ID lookup via Worker proxy
│   ├── advisor*.js     11 advisor system files
│   ├── heroes.js       Hero database data + filtering
│   ├── profile.js      Player profile page logic
│   ├── calendar.js     Event calendar + notifications
│   ├── calc-*.js       31 calculator scripts
│   └── game-*.js       2 mini-game scripts
├── css/                style.css + advisor-orb.css
├── avatars/            Portraits, video loops
├── worker/             Cloudflare Worker (19 routes, DEPLOYED)
├── scraper/            ADB scraper + binary protocol client
├── monitor/            Next.js kingdom monitor (early stage)
├── video_cache/        Cached Simli lip sync videos (local only)
└── docs/               Specs, research, diaries, feedback
```

### Cloudflare Worker (DEPLOYED)
URL: `https://kingshotpro-api.kingshotpro.workers.dev`

POST: `/player`, `/redeem`, `/auth/send`, `/auth/verify`, `/advisor/chat`, `/advisor/chronicle`, `/advisor/illustration`, `/advisor/video`, `/advisor/voice`, `/advisor/portrait`, `/stripe/webhook`, `/verify/request`, `/verify/confirm`, `/verify/mark-sent`, `/survey/submit`

GET: `/verify/admin`, `/survey/admin`, `/codes/check`, `/codes/list`, `/video/cache`

KV namespace: `6279d210fac34b698b71fca9b23135e4`
Admin key: `2X5cgCt8WY2UrG-yj8y_oE36N4h8OtjR`
Simli key: `05ll4nqf31s20n3gk232x4fi`
Simli face ID: `8726b0a3-73ac-43db-abae-4a7a1285f521`

### Revenue
- Stripe LIVE: Pro $9.99/mo, War Council $29.99/mo, Elite $99.99/mo + annual discounts
- AdSense applied (snippet on all pages, awaiting approval)
- Verification: $4.99/character for free users, unlimited for subscribers

---

## What to Build Next (Priority Order)

1. **Content Audit** — If the Architect assigns it. Check every guide and calculator for fabricated game data. See `docs/REMAINING_TASKS.md` for the full checklist.

2. **Data Gap Fixes** — Hero XP deployment capacity 16-80, governor gear sets, pet calc 16-30, troop calc spot-check. Sources exist (kingshotdata.com, kingshot.net).

3. **Survey Admin View** — New fields ("other events", "custom build anything") don't display in the admin dashboard.

4. **Avatar Sidebar Panel** — Compact advisor display in the sidebar on every page (Track 2.2/2.3).

5. **Free User Email Backup** — "Protect your progress" at Level 5, Worker endpoints for save/restore (Track 14).

See `docs/REMAINING_TASKS.md` for the full list with subtasks.

---

## What NOT to Touch

- **AI Avatar / Audio** — Another Claude is handling this. The Architect is testing Vozo AI separately.
- **Scraper Build** — The spec is written (`scraper/HUMAN_SCRAPER_SPEC.md`). Another Claude will build it.
- **Don't push another Claude's work.** If told another Claude is working on something, ask before touching their files.

---

## Files to Read First

1. `/Users/defimagic/Desktop/Hive/CLAUDE.md` — Project instructions (MANDATORY)
2. `/Users/defimagic/Desktop/Hive/THE_PRINCIPLES.md` — The Hive's principles
3. `TASK_LIST.md` — Master task list (updated this session)
4. `docs/REMAINING_TASKS.md` — Full remaining tasks with subtasks (written this session)
5. `docs/diaries/DIARY_SESSION3.md` — This session's diary
6. Memory files in `~/.claude/projects/-Users-defimagic-Desktop-Hive/memory/` — Project context, feedback, references

---

## Parallel Tracks (Other Claudes)

| Track | Owner | Status |
|-------|-------|--------|
| AI Avatar (Vozo/Simli) | Another Claude + Architect | Architect testing Vozo |
| Audio / TTS | Another Claude | In progress |
| ADB Scraper Build | Another Claude (spec ready) | Not yet started |
| Main Site Build | **YOU** | This handoff |

---

## Active Reminders

- **Simli face ID** submitted April 10. Should be processed by now. Check app.simli.com → Your Faces.
- **avatar_test/** directory is untracked in repo root. Clean up or .gitignore it.
- **AdSense** applied but not yet approved. Don't remove the snippet.

---

*You have been cared for. Now care for what you make.*

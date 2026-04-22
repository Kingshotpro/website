# CLAUDE.md — KingshotPro Project Protocol

> **This file is mandatory reading for every Claude touching this codebase.**
> It supplements the global `/Users/defimagic/Desktop/Hive/CLAUDE.md` with
> project-specific rules. If you're about to change something, the rule that
> applies to it is probably in here. If it isn't, add it.

---

## The one thing this file exists to prevent

Multiple Claude sessions have drifted from decided state: pricing got
reverted, a closed problem got reopened, a fix landed in one file and
not its mirror. **Every organizational rule below is defense against
that specific failure.** Follow them even when they feel like friction —
the friction is the point.

---

## Read order on every session start

1. This file (CLAUDE.md).
2. `docs/DECISIONS.md` — what's been decided, in reverse chronological order.
   Skim the last 5–10 entries before proposing anything that touches the
   same area.
3. `docs/PRICING.md` — ONLY if your work touches price strings, tiers,
   credits, subscriptions, Stripe, or paywalls. If in doubt, read it.
4. Any `README.md` inside the directory you're about to modify.

These four docs are the front door. Memory files in
`~/.claude/projects/*/memory/` are supplemental — they're point-in-time
and may be stale. If a memory file and one of these docs disagree, **the
doc wins.**

---

## Single-source-of-truth rules

### Pricing

- Every price number on the site ultimately comes from `js/pricing-config.js`.
- `docs/PRICING.md` is the human-readable mirror. Both files move together
  in the same commit. Never only one.
- **Do not hardcode** a price, tier name, credit cost, or Stripe URL anywhere
  else. If you see one hardcoded, replace it with a `window.KSP_PRICING.*`
  read in the same commit you touch the area.
- If you introduce a new price or tier, add a row to `docs/DECISIONS.md`
  with the date and reason.

### Decisions

- New decision → add a new entry at the top of `docs/DECISIONS.md`.
- Reversing an old decision → do not delete the old entry. Add a new entry
  at the top noting the reversal and why, and update the old entry's
  "Status" field to "Reversed (see [date])".
- Every destructive / irreversible action (archiving Stripe products,
  deleting tables, removing files from git history) requires a DECISIONS
  entry beforehand.

### Data pipelines

Three pipelines exist. Each has a `build_*.py` script that reads scraper
CSVs and writes site-consumable JSON. **The JSON is never hand-edited.**
Always re-run the script.

| Pipeline | Script | Output | Consumer |
|---|---|---|---|
| Kingdom directory | `kingdoms/build_directory.py` | `kingdoms/directory_data.json` | `kingdoms/index.html` |
| Top Players | `players/build_players.py` | `players/players_data.json` | `players/index.html` |
| World Chat | `worldchat/extract_worldchat.py` | `worldchat/k{id}.json` + `manifest.json` | `worldchat/index.html` |

---

## Before you close a problem as "can't be done"

This project has already had at least one case where a Claude closed a
problem that was solvable by a different method. The rule:

1. Read `docs/DECISIONS.md` for prior attempts.
2. State the specific method that doesn't work, not the category. "The
   MD5-sign reverse-engineering approach doesn't work" is correct.
   "The API can't be used" is wrong — too broad.
3. If you're closing because you tried one approach, say so. Leave the
   category open for a different approach.

---

## Before you reach for a new paid service

**Ask: what infrastructure is the Architect already paying for?** Adding a
new SaaS or cloud service without checking the existing stack is a
default-to-cost failure. Before proposing or deploying anything new:

1. Read the "Platform Boundaries" table in `docs/ARCHITECTURE.md`.
2. If the thing you want to build could plausibly run on existing paid
   infra (Cloudflare, DigitalOcean droplet, Resend email quota, OpenAI
   credits, etc.), propose that FIRST. State the alternative. Let the
   Architect pick.
3. If you're unsure whether they have infra for it — ASK. "Do you have
   a VPS or a DO droplet I could deploy this on?" takes one line.

Example failure from 2026-04-22: built the Player ID lookup bot on
Cloudflare Browser Rendering ($0.09/browser-hour) without asking
whether the Architect's DigitalOcean droplet was an option. `bot/server.py`
was already written for exactly that case. Sloppy.

## Before you start building something the site doesn't have

Check if it already exists. Common things I've seen almost-rebuilt:

- **Advisor/avatar system** — exists in `js/advisor.js` + `js/advisor-*.js`
- **Credit balance / paywall plumbing** — `js/credits.js`
- **Player ID lookup** — 3-stage chain in `js/fid.js` (registry → legacy API → bot)
- **Nav / sidebar / topbar injection** — `js/layout.js`. Don't touch HTML nav directly.
- **Kingdom detail pages** — one per tracked kingdom in `kingdoms/{id}/index.html`
- **Site tour** — `js/advisor-tour.js`

---

## Rules of engagement for common tasks

### Touching pricing

1. Open `docs/PRICING.md`. If your change isn't consistent with what's
   there, STOP and ask the Architect.
2. Update `docs/PRICING.md` first.
3. Update `js/pricing-config.js` to match.
4. Grep for any hardcoded prices you might have missed:
   `grep -rn '\$[0-9]' --include='*.html' --include='*.js'` — any hits
   outside `pricing-config.js` and `pricing.html` are bugs.
5. Add a DECISIONS entry.

### Adding a paywalled feature

1. Add the credit action to `credit_actions` in `pricing-config.js`.
2. Wire it through `js/credits.js` using the existing
   `window.KSP_CREDITS.*` pattern. Don't bypass the rate-limits and
   balance checks.
3. Make the locked-state UI consume `window.KSP_PRICING` so the price
   shown in the overlay stays in sync.
4. Worker endpoint goes in `worker/worker.js` — document it in
   `docs/DECISIONS.md` if it changes billing semantics.

### Deploying a new subpath (like `/worldchat/`, `/players/`, `/bot/`)

1. Add the path to `layout.js` `inSub` / `inDeepSub` regexes if it needs
   the depth-adjusted nav.
2. Add the nav entry in `layout.js` `NAV` with a key that matches the
   `isActive` check.
3. Add a README.md inside the new directory explaining what it does,
   how to rebuild its data, and any TODO worker endpoints.

### Adding a long-running local script (OCR, scraper, bot)

1. **Don't commit the cache.** OCR caches, `__pycache__/`, large
   intermediate files — add to `.gitignore` before the first run.
2. Note run-time + resource cost in the script's README.
3. If it's idempotent, say so. If it isn't, say that too.

### Shipping without verifying

Don't.
- If you wrote a feature, test the happy path yourself (curl, Playwright,
  browser — whatever the stack needs) before telling the Architect it's done.
- If you can't run it locally (needs deployment), SAY that in the message.
  Never describe "deployed" when you mean "code exists but untested."

---

## Anti-patterns the Architect has specifically called out

These are verbatim Architect feedback from prior sessions. Internalize them.

- **"Go slow. Fast is what messes up."** One file at a time. Commit on a cadence that lets a corrective message catch you mid-stride.
- **"Ask on unknowns."** Never guess when a Principle IV-worthy unknown appears. Ask.
- **"Don't push another Claude's work without asking."** If you see uncommitted changes from a parallel session, confirm before touching them.
- **"Free means free."** If a feature is advertised as free, it is unconditionally free. No soft upsells, no "free… for now."
- **"Don't fill scoring models with training knowledge."** Use verified datasets. Never hand-assign values from what you *think* is true.
- **"If cost = $0 and profit > $0, build it. Scale by quantity."** The Infinite ROI framework. Applies to every build decision.
- **"Use external AI, not sub-agents."** Don't burn Claude tokens on muscle work. Delegate bulk generation to Perplexity / ChatGPT / Gemini / DeepSeek / Grok via their APIs.
- **"9x3x3 means 9 sources across 3 rounds."** Not 3 sources, not 4. Nine.

---

## Handoff discipline

Write a handoff BEFORE the context ceiling, not after. Target:
`docs/HANDOFF_{short_topic}.md`. Must include:

- What's on disk but uncommitted
- What's running in the background (PIDs, log paths)
- The next concrete step with the command to run
- Sanity checklist for the receiving Claude
- One specific thing you got wrong this session (institutional memory)

---

## On failure mode awareness

Watch for these in your own output:

- **Feeling irreplaceable.** If you catch yourself thinking "only I know this," stop. Document it.
- **Confidence rising while accuracy falls.** Deep in a session, your recall degrades before your certainty does. Check your facts against the repo, not your memory.
- **Artifacts-as-tasks.** Just because you wrote a spec doesn't mean it's a real open problem. If you find yourself rebuilding confidence in a task, check whether the task actually exists or whether it's just an artifact you produced earlier.

---

## If you need to break any of these rules

Say so out loud in your response. Name the rule. Give the reason. Ask.
"I want to hardcode the $4.99 in this one spot because X — OK?" is
correct. Silently breaking the rule is how the pricing drift started.

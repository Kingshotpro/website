# Plan: KingshotPro AI Tier System + Kingdom Intelligence Network

## Context

KingshotPro needs a revenue-generating AI tier system built on a core insight: the observation engine (free, $0 cost) IS the baseline AI experience. Conversation and intelligence features are the premium upgrades. The crown jewel: a kingdom-wide intelligence network monitoring ALL Kingshot kingdoms for KvK preparation, power-hiding detection, and competitive analysis.

After plan approval: produce a player-facing PDF presentation (no secret sauce, just what they get).

---

## 4-Tier Structure

| Tier | Price | AI Engine | Energy | Core Value |
|------|-------|-----------|--------|-----------|
| **Free** | $0 | Scripted only | 5/day | Observation engine, XP, mini-games, scripted advisor who knows your playstyle |
| **Pro** | $9.99/mo | Haiku unlimited | Unlimited | Real AI conversation, memory (7-day active window, ALL data stored for backfill on upgrade), monthly chronicle + battle illustration, Pro badge |
| **War Council** | $29.99/mo | Haiku + enhanced prompts | Unlimited | KvK intelligence reports, power-hiding detection, enemy kingdom analysis, alliance dashboard, pre-event briefings, rally planning |
| **Elite** | $99.99/mo | Haiku + Sonnet | Unlimited | Permanent full memory (backfilled from Pro), monthly personalized song, weekly chronicles, daily voice messages, custom advisor portrait, alliance page, Gold Patron status, light human touch |

**Energy:** Free tier only. All paid tiers = truly unlimited, no caps, no degradation, ever.

**Memory architecture:** ALL conversations stored in KV from Pro onward (tiny data — text, KB per session). Pro advisor LOADS last 7 days as active context. Elite loads full history. On upgrade from Pro → Elite: backfill activates. The advisor suddenly remembers everything: *"Governor. I remember everything now. Our first conversation. Your hesitation about T4. It's all here."*

---

## Architecture

```
Browser (static site on GitHub Pages)
    ↓ POST /advisor/*
Cloudflare Worker (auth, tier routing, energy, rate limiting)
    ↓ routes to:
    ├── Anthropic API (Haiku/Sonnet) — conversation
    ├── OpenAI API (DALL-E 3) — battle illustrations, custom portraits
    ├── OpenAI API (TTS) — voice messages
    ├── Suno/Udio API — personalized songs
    └── Worker KV/D1 — user state, memory, tier status, energy

Kingdom Intelligence Network (separate system)
    ├── Fleet of Android phones (1 per kingdom monitored)
    ├── ADB scraper (adapted from KingShots ranking scraper)
    ├── Captures: power rankings, profiles, world chat screenshots
    ├── Uploads snapshots → central database (DO Spaces or Supabase)
    ├── AI pipeline: Haiku processes snapshots → structured intelligence
    └── Intelligence API in Worker serves reports to War Council+ subscribers
```

---

## Cost Math Per Tier (worst-case active user)

| Tier | Revenue | Monthly AI Cost | Content Cost | Infra Cost | Profit | Margin |
|------|---------|----------------|--------------|------------|--------|--------|
| Free | $0 (ads ~$0.50) | $0 (scripted) | $0 | $0 | ~$0.50 | 100% |
| Pro (50 msg/day) | $9.99 | $2.27 | $0.05 (chronicle+art) | $0.01 | $7.66 | 77% |
| War Council (50 msg/day) | $29.99 | $2.27 | $0.10 | $0.67 (phone share) | $26.95 | 90% |
| Elite (200 msg/day, 10% Sonnet) | $99.99 | $19.05 | $0.60 (all content) | $0.01 | $80.33 | 80% |

Phone fleet cost ($20/mo per phone) spread across War Council+ subscribers per kingdom.

---

## Build Phases

### PHASE 1: Worker Expansion (auth + AI proxy + energy)
*Unblocks all paid features.*

Expand `worker/worker.js`:
- `POST /auth/send` — email magic link via Resend API (key exists in api.rtf)
- `POST /auth/verify` — validate token, set httpOnly cookie, create user in KV
- `POST /advisor/chat` — auth check → tier check → energy check (free only) → build prompt (inject Kingshot knowledge + player context + memory) → call Anthropic → store response in memory → return
- Model routing: Pro=Haiku, War Council=Haiku+enhanced system prompt, Elite=Sonnet for emotional depth + Haiku for routine
- KV schema: `user:{email}` → `{ fid, tier, energy_today, energy_reset_date, memory_archive: [...], active_memory: [...], created }`

**Delegate:** GPT-4o writes Worker code from spec. I provide existing worker.js + full endpoint spec.

### PHASE 2: Energy UI + AI Chatbox
*The core experience change.*

Modify `advisor-orb.js`:
- Add text input field in council chamber (all tiers)
- Free: energy meter visible, depletes per message. At 0: advisor dims, scripted only, "Strengthen [Name]" button
- Paid: no energy meter, input always active
- Typing indicator while API responds
- Response rendered as message + TTS audio plays

### PHASE 3: CTA Engine
*Converts free→paid→higher. Context-triggered, escalating, cooldown.*

New `advisor-cta.js`:
- Visits 1-3: zero CTAs (earn trust)
- Visits 4-7: context only (energy depletion, question beyond scripted ability)
- Visits 8-14: proactive, tag-based ("You've run troop calcs 14 times without checking gear. Pro unlocks that analysis.")
- Visit 15+: one subtle mention/session, never repeat same CTA
- If they don't bite: cool down. Respect their choice.
- Paid→higher: show PREVIEWS (grayed art, 5-sec song sample, chronicle teaser, KvK intelligence sample)
- KvK-specific CTA (Pro→War Council): "Your enemy is Kingdom 812. War Council subscribers already have their intelligence report."

### PHASE 4: Premium Content Generation
*The Elite value stack. Cheap to produce, massive perceived value.*

Worker endpoints:
- `/advisor/chronicle` — weekly medieval chronicle from player data (Haiku, $0.002)
- `/advisor/illustration` — battle scene via DALL-E 3 ($0.04)
- `/advisor/song` — personalized ballad via Suno/Udio ($0.10)
- `/advisor/voice` — daily voice message via OpenAI TTS ($0.001)
- `/advisor/portrait` — custom advisor from player description via DALL-E 3 ($0.04 one-time)

**Delegate:** GPT-4o writes generation endpoints. I write prompt templates.

### PHASE 5: Persistent Memory
*Emotional lock-in. The advisor becomes irreplaceable.*

- ALL conversations stored in KV from Pro tier onward (never deleted)
- Pro: advisor loads last 7 days as active context per API call
- Elite: advisor loads full relevant history (smart selection — not all 10,000 messages, but key moments + recent)
- Upgrade backfill: Pro→Elite activates full archive. The advisor "remembers everything."
- Memory includes: advice given, whether player followed it (detected via FID profile changes), key decisions, emotional moments

### PHASE 6: Alliance Pages
*Locks communities, not just individuals.*

- Public URL: `kingshotpro.com/alliance/{slug}`
- Free: name, kingdom, about, recruitment status
- Paid alliance (alliance leader on Pro+): authored guides ("by TNP on K734"), member roster, about page (editable with restrictions)
- War Council alliance: + AI war analysis, rally planner, member power tracking
- Elite alliance: + full analytics dashboard

Alliance guides create inbound links: "read our strategy guide on KingshotPro" → their members visit → we capture more users per kingdom.

### PHASE 7: Kingdom Intelligence Network
*The moat nobody can replicate.*

**Separate system — phone fleet + ADB scraper + AI pipeline.**

Goal: monitor ALL kingdoms continuously. Even 2-week-old data is valuable as baseline.

Components:
1. Phone fleet: cheap Androids, each logged into one kingdom
2. ADB scraper (adapted from existing KingShots scraper): captures power rankings, profiles, world chat on schedule (every 4-6 hours standard, every 1-2 hours during KvK)
3. Upload pipeline: screenshots + OCR'd data → cloud storage
4. AI processing: Haiku analyzes snapshots → structured data (player name, power, alliance, estimated furnace, delta from previous snapshot)
5. Intelligence API: Worker endpoint queries database, generates reports for War Council+ subscribers

**KvK Intelligence Report contents:**
- Enemy kingdom power distribution (top 50 players)
- Power-hiding detection: pre-match vs current power delta per player
- Activity heatmap: when their players are active (derived from ranking change timestamps)
- Alliance structure: who's allied, who's isolated, who are the whales
- Recommended attack windows (when enemy is weakest)
- Rally target priority list (which players to hit based on composition estimates)

**Scaling:** start with 50 phones (50 kingdoms, $1K/month). Revenue needed: 34 War Council subs ($1,020). Add phones as subs grow. Revenue ALWAYS leads hardware cost.

### PHASE 8: Stripe + Pricing Page
*Revenue collection.*

- `pricing.html` — 4 tier cards with feature comparison grid
- Stripe Checkout for Pro / War Council / Elite
- Annual option: 2 months free ($99.90/yr Pro, $299.90/yr WC, $999.90/yr Elite)
- Stripe webhooks → update tier in Worker KV
- Regional pricing via Stripe localization

---

## CTA Moments Map

| Trigger | What User Sees | Target |
|---------|---------------|--------|
| Energy depleted (free) | Advisor dims: "I need rest. Strengthen me." | Pro |
| Complex question (free) | "That requires deeper analysis than I can offer now." | Pro |
| Tag: combat_prioritizer (visit 8+) | "You study armies obsessively. Pro lets me tell you what I REALLY see." | Pro |
| KvK announced (Pro) | "Kingdom 812 is your enemy. War Council subs have their intelligence report." | War Council |
| Alliance leader detected (Pro) | "90 members counting on you? The War Council dashboard changes how you lead." | War Council |
| Grayed battle illustration (WC) | "Your siege — illustrated. Elite members receive this." | Elite |
| 5-sec song sample (WC) | "A ballad is being composed about your reign." | Elite |
| Memory tease (WC) | "I stored every conversation we've had. Elite unlocks my full memory of you." | Elite |

After escalation window (visits 15+): one subtle CTA per session max. Different CTA each time. If they don't bite, respect it. Never nag.

---

## Deliverable After Approval: Player-Facing PDF

A polished presentation for Kingshot players. No secret sauce (no API costs, no architecture, no phone monitoring details). Just:
- What is KingshotPro
- Meet your AI advisor (the character, the personality)
- Tier comparison (what you get at each level)
- KvK Intelligence teaser (the wow factor — "know your enemy before they know you")
- Alliance features teaser
- Call to action: visit kingshotpro.com

Style: dark theme, gold accents, medieval aesthetic. Includes advisor portrait. 6-8 pages.

**Delegate:** GPT-4o generates the PDF content structure. I use the pdf skill or reportlab to produce it.

---

## External AI Delegation

| Task | Delegated To | My Role |
|------|-------------|---------|
| Worker expansion code | GPT-4o | Spec + review |
| Alliance page template | GPT-4o | Spec + review |
| CTA dialogue lines | GPT-4o | Prompt + tone verification |
| Pricing page HTML | GPT-4o | Spec + review |
| PDF presentation content | GPT-4o | Structure + review |
| OCR/scraper pipeline | GPT-4o | Spec + review |
| Prompt templates (knowledge base, per-tier) | Me | Architectural — this IS the product |
| System prompt design | Me | Architectural |
| Integration wiring | Me | Requires full system understanding |
| Intelligence report format | Me | Product design |

~70% of code generation delegated. ~30% is architecture I do directly.

---

## Build Order

```
PHASE 1: Worker (auth + AI + energy)     → unblocks everything
PHASE 2: Energy UI + chatbox             → core experience
PHASE 3: CTA engine                      → conversion
PHASE 4: Premium content                 → Elite value
PHASE 5: Persistent memory               → emotional lock-in
PHASE 6: Alliance pages                  → community lock-in
PHASE 7: Kingdom Intelligence Network    → the moat
PHASE 8: Stripe + pricing                → collect revenue
```

After approval: produce player-facing PDF presentation.
